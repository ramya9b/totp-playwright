# ============================================================================
# Direct Pipeline Authorization with Token Input
# Purpose: Authorize pipeline resources using token passed as parameter
# No environment variables needed!
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Token,
    
    [string]$Organization = "RSATwithAzure",
    [string]$Project = "PlaywrightTests",
    [string]$PipelineName = "totp-playwright"
)

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    Direct Pipeline Authorization - No Environment Variable Needed        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# If no token provided, ask for it
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "📝 Enter your PAT token:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Get token from: https://dev.azure.com/$Organization/_usersSettings/tokens" -ForegroundColor Cyan
    Write-Host ""
    $Token = Read-Host "Paste your complete PAT token here"
    Write-Host ""
}

# Validate token
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "❌ No token provided. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Token received. Length: $($Token.Length) characters" -ForegroundColor Yellow

if ($Token.Length -lt 20) {
    Write-Host "❌ Token is too short! Should be 50+ characters." -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you copied the ENTIRE token from the blue box." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Token format looks good" -ForegroundColor Green
Write-Host ""

# Prepare authentication
Write-Host "🔐 Testing authentication..." -ForegroundColor Yellow

try {
    $EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$Token"))
    $Headers = @{
        "Authorization" = "Basic $EncodedToken"
        "Content-Type"  = "application/json"
    }
    
    # Test authentication with the endpoint we know works
    $TestResponse = Invoke-RestMethod -Uri "https://dev.azure.com/$Organization/_apis/projects?api-version=7.1-preview.4" `
        -Headers $Headers -Method Get -ErrorAction Stop -TimeoutSec 5
    
    Write-Host "✅ Authentication successful!" -ForegroundColor Green
    Write-Host "   Found $($TestResponse.value.Count) project(s) in $Organization" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Authentication failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "   - Token is invalid or expired" -ForegroundColor Cyan
    Write-Host "   - Token was corrupted during paste" -ForegroundColor Cyan
    Write-Host "   - Network connectivity issue" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Try again with a fresh token from:" -ForegroundColor Green
    Write-Host "   https://dev.azure.com/$Organization/_usersSettings/tokens" -ForegroundColor Cyan
    exit 1
}

# Now authorize the pipeline
Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Organization: $Organization" -ForegroundColor Gray
Write-Host "   Project: $Project" -ForegroundColor Gray
Write-Host "   Pipeline: $PipelineName" -ForegroundColor Gray
Write-Host ""

# Get pipeline ID
Write-Host "🔍 Finding pipeline: $PipelineName..." -ForegroundColor Yellow

try {
    $BaseUri = "https://dev.azure.com/$Organization/$Project/_apis"
    
    $PipelineResponse = Invoke-RestMethod `
        -Uri "$BaseUri/pipelines?api-version=7.1-preview.1" `
        -Headers $Headers `
        -Method Get `
        -ErrorAction Stop -TimeoutSec 10
    
    $Pipeline = $PipelineResponse.value | Where-Object { $_.name -eq $PipelineName }
    
    if (-not $Pipeline) {
        Write-Host "❌ Pipeline '$PipelineName' not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available pipelines:" -ForegroundColor Yellow
        $PipelineResponse.value | ForEach-Object { Write-Host "   - $($_.name)" -ForegroundColor Cyan }
        exit 1
    }
    
    $PipelineId = $Pipeline.id
    Write-Host "✅ Pipeline found! ID: $PipelineId" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error fetching pipelines: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Authorize variable groups
Write-Host "📦 Authorizing Variable Groups..." -ForegroundColor Cyan

$VariableGroups = @("Playwright-Testing-Secrets_totp", "Playwright-Testing-Secrets")
$AuthorizedCount = 0

foreach ($GroupName in $VariableGroups) {
    try {
        # Get variable group ID
        $GroupResponse = Invoke-RestMethod `
            -Uri "$BaseUri/distributedtask/variablegroups?api-version=7.1-preview.2&groupName=$GroupName" `
            -Headers $Headers `
            -Method Get `
            -ErrorAction Stop -TimeoutSec 10
        
        if ($GroupResponse.value.Count -eq 0) {
            Write-Host "   ⚠️  Variable group '$GroupName' not found (skipping)" -ForegroundColor Yellow
            continue
        }
        
        $GroupId = $GroupResponse.value[0].id
        
        # Authorize the variable group
        $AuthorizeUri = "$BaseUri/pipelines/$PipelineId/pipelineresources/variablegroups/$GroupId?api-version=7.1-preview.1"
        
        $AuthorizeBody = @{ "authorized" = $true } | ConvertTo-Json
        
        Invoke-RestMethod `
            -Uri $AuthorizeUri `
            -Headers $Headers `
            -Method Patch `
            -Body $AuthorizeBody `
            -ErrorAction Stop -TimeoutSec 10 | Out-Null
        
        Write-Host "   ✅ Authorized: $GroupName" -ForegroundColor Green
        $AuthorizedCount++
        
    } catch {
        Write-Host "   ❌ Failed: $GroupName - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Authorize secure files
Write-Host "🔐 Authorizing Secure Files..." -ForegroundColor Cyan

$SecureFiles = @("D365AuthFile.json")
$AuthorizedFiles = 0

foreach ($FileName in $SecureFiles) {
    try {
        # Get secure file ID
        $FileResponse = Invoke-RestMethod `
            -Uri "$BaseUri/distributedtask/securefiles?api-version=7.1-preview.1" `
            -Headers $Headers `
            -Method Get `
            -ErrorAction Stop -TimeoutSec 10
        
        $SecureFile = $FileResponse.value | Where-Object { $_.name -eq $FileName }
        
        if (-not $SecureFile) {
            Write-Host "   ⚠️  Secure file '$FileName' not found (skipping)" -ForegroundColor Yellow
            continue
        }
        
        $FileId = $SecureFile.id
        
        # Authorize the secure file
        $AuthUri = "$BaseUri/distributedtask/securefiles/$FileId/authorize?api-version=7.1-preview.1&pipelineId=$PipelineId"
        
        $AuthBody = @{ "authorized" = $true } | ConvertTo-Json
        
        Invoke-RestMethod `
            -Uri $AuthUri `
            -Headers $Headers `
            -Method Patch `
            -Body $AuthBody `
            -ErrorAction Stop -TimeoutSec 10 | Out-Null
        
        Write-Host "   ✅ Authorized: $FileName" -ForegroundColor Green
        $AuthorizedFiles++
        
    } catch {
        Write-Host "   ❌ Failed: $FileName - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Summary
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                       Authorization Complete                              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Results:" -ForegroundColor Green
Write-Host "   Variable Groups Authorized: $AuthorizedCount" -ForegroundColor Green
Write-Host "   Secure Files Authorized: $AuthorizedFiles" -ForegroundColor Green
Write-Host ""

if ($AuthorizedCount -gt 0 -or $AuthorizedFiles -gt 0) {
    Write-Host "✅ Authorization successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your scheduled pipelines should now run without permission errors!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Go to your Azure Pipelines project" -ForegroundColor Yellow
    Write-Host "   2. Queue a manual build to test" -ForegroundColor Yellow
    Write-Host "   3. Check scheduled execution times (2:00 AM and 10:00 AM UTC)" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  No resources were authorized." -ForegroundColor Yellow
    Write-Host "   Check that variable groups and secure files exist in your project." -ForegroundColor Yellow
}

Write-Host ""
