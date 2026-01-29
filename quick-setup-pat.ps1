# ============================================================================
# Quick PAT Token Setup - Simplified Version
# ============================================================================

param(
    [string]$Token
)

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Azure DevOps PAT Token Quick Setup                                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# If token not provided as parameter, ask for it
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "⚠️  You need an Azure DevOps Personal Access Token (PAT)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "HOW TO GET YOUR PAT TOKEN:" -ForegroundColor Cyan
    Write-Host "1. Try: https://dev.azure.com/RSATwithAzure/_usersSettings/tokens" -ForegroundColor Green
    Write-Host "   OR: https://dev.azure.com/RSATwithAzure/_settings/tokens" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. If those don't work, navigate manually:" -ForegroundColor Green
    Write-Host "   - Go to https://dev.azure.com/RSATwithAzure" -ForegroundColor Green
    Write-Host "   - Click your profile icon (top-right corner)" -ForegroundColor Green
    Write-Host "   - Select 'Personal access tokens'" -ForegroundColor Green
    Write-Host ""
    Write-Host "3. Click 'New Token'" -ForegroundColor Green
    Write-Host "3. Name: Playwright-Pipeline-Auth" -ForegroundColor Green
    Write-Host "4. Check these scopes:" -ForegroundColor Green
    Write-Host "   ✓ Build (Read & execute)" -ForegroundColor Green
    Write-Host "   ✓ Variable Groups (Read, create & manage)" -ForegroundColor Green
    Write-Host "   ✓ Secure files (Read)" -ForegroundColor Green
    Write-Host "5. Click 'Create' and copy the token from the blue box" -ForegroundColor Green
    Write-Host ""
    
    $Token = Read-Host "Paste your PAT token here"
    
    if ([string]::IsNullOrEmpty($Token)) {
        Write-Host "❌ No token provided. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔐 Setting up environment variable..." -ForegroundColor Yellow

# Set environment variable for current user
[Environment]::SetEnvironmentVariable('AZURE_DEVOPS_PAT', $Token, 'User')

# Also set for current session
$env:AZURE_DEVOPS_PAT = $Token

Write-Host "✅ PAT token saved to environment!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: You must close and reopen PowerShell for the change to take effect" -ForegroundColor Yellow
Write-Host ""
Write-Host "Then run: .\authorize-pipeline-resources.ps1" -ForegroundColor Green
Write-Host ""
