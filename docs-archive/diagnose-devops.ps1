# ============================================================================
# Azure DevOps Organization & Project Diagnostic Script
# Purpose: Discover correct organization and project names
# ============================================================================

param(
    [string]$Token
)

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Azure DevOps Organization & Project Diagnostic                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get token
if ([string]::IsNullOrEmpty($Token)) {
    if ([string]::IsNullOrEmpty($env:AZURE_DEVOPS_PAT)) {
        Write-Host "❌ ERROR: PAT token not provided and AZURE_DEVOPS_PAT not set" -ForegroundColor Red
        Write-Host ""
        Write-Host "Provide token as parameter:" -ForegroundColor Yellow
        Write-Host "  .\diagnose-devops.ps1 -Token 'your-pat-token'" -ForegroundColor Green
        exit 1
    }
    $Token = $env:AZURE_DEVOPS_PAT
}

# Encode token
$EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$Token"))
$Headers = @{
    "Authorization" = "Basic $EncodedToken"
    "Content-Type"  = "application/json"
}

Write-Host "🔐 Testing token authentication..." -ForegroundColor Yellow

try {
    # Test basic authentication
    $TestResponse = Invoke-RestMethod -Uri "https://dev.azure.com/_apis/organizations" `
        -Headers $Headers -Method Get -ErrorAction Stop
    
    Write-Host "✅ Token is VALID!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Token authentication failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "   • Token is invalid or expired" -ForegroundColor Cyan
    Write-Host "   • Token doesn't have required permissions" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Create a new token from:" -ForegroundColor Green
    Write-Host "   https://dev.azure.com/RSATwithAzure/_usersSettings/tokens" -ForegroundColor Cyan
    exit 1
}

# Get organizations
Write-Host "📦 Fetching your organizations..." -ForegroundColor Yellow
Write-Host ""

try {
    $OrgResponse = Invoke-RestMethod -Uri "https://dev.azure.com/_apis/organizations?api-version=7.1-preview.1" `
        -Headers $Headers -Method Get -ErrorAction Stop
    
    if ($OrgResponse.value.Count -eq 0) {
        Write-Host "⚠️  No organizations found!" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Found $($OrgResponse.value.Count) organization(s):" -ForegroundColor Green
    Write-Host ""
    
    foreach ($Org in $OrgResponse.value) {
        Write-Host "📍 Organization Name: $($Org.accountName)" -ForegroundColor Cyan
        Write-Host "   Display Name: $($Org.accountName)" -ForegroundColor Gray
        Write-Host "   URL: https://dev.azure.com/$($Org.accountName)" -ForegroundColor Gray
        Write-Host ""
        
        # Get projects for this organization
        Write-Host "   📂 Projects in this organization:" -ForegroundColor Yellow
        
        try {
            $ProjectResponse = Invoke-RestMethod `
                -Uri "https://dev.azure.com/$($Org.accountName)/_apis/projects?api-version=7.1-preview.4" `
                -Headers $Headers -Method Get -ErrorAction Stop
            
            if ($ProjectResponse.value.Count -eq 0) {
                Write-Host "      (No projects found)" -ForegroundColor Gray
            } else {
                foreach ($Project in $ProjectResponse.value) {
                    Write-Host "      ✓ $($Project.name)" -ForegroundColor Green
                    Write-Host "        ID: $($Project.id)" -ForegroundColor Gray
                    Write-Host "        URL: https://dev.azure.com/$($Org.accountName)/$($Project.name)" -ForegroundColor Gray
                }
            }
        } catch {
            Write-Host "      ⚠️  Could not fetch projects: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        Write-Host ""
    }
    
    Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                  Found Organizations and Projects                         ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "ℹ️  Use these exact names in the authorization script:" -ForegroundColor Cyan
    Write-Host "   • Organization name (e.g., RSATwithAzure)" -ForegroundColor Green
    Write-Host "   • Project name (e.g., totp-playwright)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Green
    Write-Host "   .\authorize-pipeline-resources.ps1 -Organization 'YOUR_ORG' -Project 'YOUR_PROJECT'" -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to fetch organizations!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "This usually means:" -ForegroundColor Yellow
    Write-Host "   • Token is invalid" -ForegroundColor Cyan
    Write-Host "   • Network connectivity issue" -ForegroundColor Cyan
    Write-Host "   • API endpoint is unreachable" -ForegroundColor Cyan
    exit 1
}
