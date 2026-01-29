# ============================================================================
# Correct Pipeline Authorization Script - Final Version
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Token
)

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Pipeline Resource Authorization - Correct Version                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrEmpty($Token)) {
    $Token = Read-Host "Paste your PAT token"
}

if ($Token.Length -lt 20) {
    Write-Host "❌ Token too short!" -ForegroundColor Red
    exit 1
}

# Setup
$Organization = "RSATwithAzure"
$Project = "PlaywrightTests"
$PipelineId = 57  # totp-playwright pipeline
$PipelineName = "totp-playwright"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Organization: $Organization" -ForegroundColor Gray
Write-Host "   Project: $Project" -ForegroundColor Gray
Write-Host "   Pipeline: $PipelineName (ID: $PipelineId)" -ForegroundColor Gray
Write-Host ""

$EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$Token"))
$Headers = @{
    "Authorization" = "Basic $EncodedToken"
    "Content-Type"  = "application/json"
}

# Test auth
Write-Host "🔐 Testing authentication..." -ForegroundColor Yellow
try {
    $Test = Invoke-RestMethod -Uri "https://dev.azure.com/$Organization/$Project/_apis/pipelines?api-version=7.1-preview.1" `
        -Headers $Headers -Method Get -ErrorAction Stop -TimeoutSec 5
    Write-Host "✅ Authentication successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Authorize variable groups
Write-Host "📦 Authorizing Variable Groups..." -ForegroundColor Cyan

$VarGroupIds = @(3, 2)  # Playwright-Testing-Secrets_totp (3), Playwright-Testing-Secrets (2)
$VarGroupNames = @("Playwright-Testing-Secrets_totp", "Playwright-Testing-Secrets")

for ($i = 0; $i -lt $VarGroupIds.Count; $i++) {
    $GroupId = $VarGroupIds[$i]
    $GroupName = $VarGroupNames[$i]
    
    try {
        $AuthUri = "https://dev.azure.com/$Organization/$Project/_apis/pipelines/$PipelineId/pipelineresources/variablegroups/$GroupId?api-version=7.1-preview.1"
        
        $Body = @{ "authorized" = $true } | ConvertTo-Json
        
        Invoke-RestMethod -Uri $AuthUri -Headers $Headers -Method Patch -Body $Body -ErrorAction Stop -TimeoutSec 10 | Out-Null
        
        Write-Host "   ✅ Authorized: $GroupName" -ForegroundColor Green
        
    } catch {
        Write-Host "   ❌ Failed: $GroupName - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Authorize secure files
Write-Host "🔐 Authorizing Secure Files..." -ForegroundColor Cyan

$FileIds = @("894cd2c4-76ca-4b06-a4d4-53a341110f9d")  # D365AuthFile.json
$FileNames = @("D365AuthFile.json")

for ($i = 0; $i -lt $FileIds.Count; $i++) {
    $FileId = $FileIds[$i]
    $FileName = $FileNames[$i]
    
    try {
        $AuthUri = "https://dev.azure.com/$Organization/$Project/_apis/distributedtask/securefiles/$FileId/authorize?api-version=7.1-preview.1&pipelineId=$PipelineId"
        
        $Body = @{ "authorized" = $true } | ConvertTo-Json
        
        Invoke-RestMethod -Uri $AuthUri -Headers $Headers -Method Patch -Body $Body -ErrorAction Stop -TimeoutSec 10 | Out-Null
        
        Write-Host "   ✅ Authorized: $FileName" -ForegroundColor Green
        
    } catch {
        Write-Host "   ❌ Failed: $FileName - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                   Authorization Complete!                                 ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Pipeline resources have been authorized!" -ForegroundColor Green
Write-Host ""
Write-Host "Your scheduled pipelines should now run without permission errors." -ForegroundColor Green
Write-Host ""
