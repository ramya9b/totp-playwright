# Azure App Registration Setup Script for D365 Automation
# This script helps you set up Service Principal authentication

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Azure App Registration Setup for D365 Automation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
$azCliInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azCliInstalled) {
    Write-Host "❌ Azure CLI is not installed" -ForegroundColor Red
    Write-Host "Please install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Follow manual steps in SETUP-APP-REGISTRATION.md" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Azure CLI detected" -ForegroundColor Green
Write-Host ""

# Login to Azure
Write-Host "Step 1: Azure Login" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
$loginCheck = az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Azure..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure login failed" -ForegroundColor Red
        exit 1
    }
}

$accountInfo = az account show | ConvertFrom-Json
Write-Host "✅ Logged in as: $($accountInfo.user.name)" -ForegroundColor Green
Write-Host "✅ Subscription: $($accountInfo.name)" -ForegroundColor Green
Write-Host "✅ Tenant ID: $($accountInfo.tenantId)" -ForegroundColor Green
Write-Host ""

# Get D365 URL
Write-Host "Step 2: D365 Environment Configuration" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
$d365Url = Read-Host "Enter your D365 URL (e.g., https://your-env.sandbox.operations.dynamics.com)"
if ([string]::IsNullOrWhiteSpace($d365Url)) {
    Write-Host "❌ D365 URL is required" -ForegroundColor Red
    exit 1
}
Write-Host "✅ D365 URL: $d365Url" -ForegroundColor Green
Write-Host ""

# Create App Registration
Write-Host "Step 3: Creating App Registration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
$appName = "D365-Playwright-Automation-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Creating app registration: $appName" -ForegroundColor Yellow

try {
    $app = az ad app create --display-name $appName | ConvertFrom-Json
    $appId = $app.appId
    $objectId = $app.id
    
    Write-Host "✅ App Registration created successfully" -ForegroundColor Green
    Write-Host "   App Name: $appName" -ForegroundColor White
    Write-Host "   Client ID: $appId" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create App Registration" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Create Service Principal
Write-Host "Step 4: Creating Service Principal" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
try {
    $sp = az ad sp create --id $appId | ConvertFrom-Json
    Write-Host "✅ Service Principal created" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create Service Principal" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Create Client Secret
Write-Host "Step 5: Creating Client Secret" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Secret will expire in 12 months" -ForegroundColor Yellow
try {
    $secretName = "Azure-DevOps-Pipeline-Secret"
    $secret = az ad app credential reset --id $appId --append --display-name $secretName --years 1 | ConvertFrom-Json
    $clientSecret = $secret.password
    
    Write-Host "✅ Client Secret created" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Copy this secret now - it won't be shown again!" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create Client Secret" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Add Dynamics 365 API Permissions
Write-Host "Step 6: Adding Dynamics 365 API Permissions" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Attempting to add Dynamics CRM permissions..." -ForegroundColor Yellow

try {
    # Dynamics CRM API ID
    $dynamicsApiId = "00000007-0000-0000-c000-000000000000"
    $userImpersonationId = "78ce3f0f-a1ce-49c2-8cde-64b5c0896db4" # user_impersonation scope
    
    # Add permission
    az ad app permission add --id $appId --api $dynamicsApiId --api-permissions "${userImpersonationId}=Scope" 2>$null
    
    Write-Host "✅ Dynamics 365 API permission added" -ForegroundColor Green
    Write-Host "⚠️  Admin consent required - grant manually in Azure Portal" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "⚠️  Could not automatically add API permissions" -ForegroundColor Yellow
    Write-Host "   Please add manually in Azure Portal:" -ForegroundColor Yellow
    Write-Host "   1. Go to App registrations > $appName > API permissions" -ForegroundColor White
    Write-Host "   2. Add permission > APIs my organization uses > Dynamics 365" -ForegroundColor White
    Write-Host "   3. Select 'user_impersonation'" -ForegroundColor White
    Write-Host "   4. Grant admin consent" -ForegroundColor White
    Write-Host ""
}

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete! Copy these values:" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "AZURE_TENANT_ID=$($accountInfo.tenantId)" -ForegroundColor White
Write-Host "AZURE_CLIENT_ID=$appId" -ForegroundColor White
Write-Host "AZURE_CLIENT_SECRET=$clientSecret" -ForegroundColor White
Write-Host "D365_URL=$d365Url" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "1. ✅ Copy the values above" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. 🌐 Azure Portal - Grant Admin Consent:" -ForegroundColor Yellow
Write-Host "   • Go to: https://portal.azure.com" -ForegroundColor White
Write-Host "   • Navigate to: Azure AD > App registrations > $appName" -ForegroundColor White
Write-Host "   • Click: API permissions > Grant admin consent" -ForegroundColor White
Write-Host "   • Verify green checkmarks appear" -ForegroundColor White
Write-Host ""
Write-Host "3. 🔐 Power Platform - Add Application User:" -ForegroundColor Yellow
Write-Host "   • Go to: https://admin.powerplatform.microsoft.com" -ForegroundColor White
Write-Host "   • Select your environment > Settings > Users + permissions" -ForegroundColor White
Write-Host "   • Application users > + New app user" -ForegroundColor White
Write-Host "   • Select: $appName" -ForegroundColor White
Write-Host "   • Assign role: System Administrator" -ForegroundColor White
Write-Host "   • Click Create" -ForegroundColor White
Write-Host ""
Write-Host "4. 🔧 Azure DevOps - Update Variable Group:" -ForegroundColor Yellow
Write-Host "   • Go to: Pipelines > Library > D365-Credentials" -ForegroundColor White
Write-Host "   • Add the 4 variables shown above" -ForegroundColor White
Write-Host "   • Mark AZURE_CLIENT_SECRET as 'secret'" -ForegroundColor White
Write-Host "   • Save Variable Group" -ForegroundColor White
Write-Host ""
Write-Host "5. 🚀 Test in Azure DevOps:" -ForegroundColor Yellow
Write-Host "   • Commit and push changes" -ForegroundColor White
Write-Host "   • Monitor pipeline for: '✅ Service Principal authentication successful'" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup script complete! 🎉" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed instructions, see: SETUP-APP-REGISTRATION.md" -ForegroundColor Gray
Write-Host "For quick reference, see: QUICK-SETUP-CHECKLIST.md" -ForegroundColor Gray
