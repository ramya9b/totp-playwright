# ============================================================================
# Azure DevOps PAT Token Setup Helper
# Purpose: Guide and automate PAT token setup for pipeline authorization
# ============================================================================

param(
    [switch]$Help,
    [switch]$CheckSetup,
    [string]$PAT
)

# Display help
if ($Help) {
    Write-Host @"
╔════════════════════════════════════════════════════════════════════════════╗
║     Azure DevOps PAT Token Setup Helper                                    ║
╚════════════════════════════════════════════════════════════════════════════╝

SYNOPSIS:
  Helps you create and set up an Azure DevOps Personal Access Token (PAT)
  for automated pipeline resource authorization.

NOTE: PAT is DIFFERENT from Azure AD credentials
  - Azure AD credentials: For authenticating to D365/Microsoft services
  - PAT token: For authenticating to Azure DevOps/Azure Pipelines API

USAGE:
  .\setup-pat-token.ps1 -CheckSetup          # Check if PAT is configured
  .\setup-pat-token.ps1 -PAT "your-token"    # Set PAT from command line
  .\setup-pat-token.ps1                      # Interactive setup guide

STEPS TO CREATE A PAT TOKEN:

1. Go to Azure DevOps: https://dev.azure.com/ramyabinyahya/_usersSettings/tokens

2. Click "New Token" button

3. Fill in these details:
   Name: Playwright-Pipeline-Auth
   Organization: ramyabinyahya (or select from dropdown)
   Expiration: Custom defined > 1 year (or your preference)

4. Under SCOPES - Select these checkboxes:
   ✓ Build
     ✓ Read & execute
   ✓ Variable Groups
     ✓ Read, create & manage
   ✓ Secure files
     ✓ Read

5. Click "Create Token"

6. Copy the token immediately (shown in a blue box)
   - You CANNOT view it again after closing this dialog
   - If you lose it, delete and create a new one

7. Run this script with the token:
   .\setup-pat-token.ps1 -PAT "your-copied-token-here"

EXAMPLE:
  .\setup-pat-token.ps1 -PAT "j7al2k3m5n9p0q2r4s6t8u0v2w4x6y8z"
"@
    exit 0
}

# Check if PAT is already configured
if ($CheckSetup) {
    Write-Host "🔍 Checking Azure DevOps PAT setup..." -ForegroundColor Cyan
    Write-Host ""
    
    $PatExists = [string]::IsNullOrEmpty($env:AZURE_DEVOPS_PAT) -eq $false
    
    if ($PatExists) {
        Write-Host "✅ AZURE_DEVOPS_PAT is configured!" -ForegroundColor Green
        Write-Host "   Token length: $($env:AZURE_DEVOPS_PAT.Length) characters" -ForegroundColor Green
        
        # Test the token
        Write-Host ""
        Write-Host "🧪 Testing PAT token..." -ForegroundColor Yellow
        
        $EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$env:AZURE_DEVOPS_PAT"))
        $Headers = @{
            "Authorization" = "Basic $EncodedToken"
            "Content-Type"  = "application/json"
        }
        
        try {
            $Response = Invoke-RestMethod -Uri "https://dev.azure.com/ramyabinyahya/_apis/projects" `
                -Headers $Headers -Method Get -ErrorAction Stop
            
            Write-Host "✅ PAT token is VALID!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 Found projects:" -ForegroundColor Cyan
            $Response.value | ForEach-Object {
                Write-Host "   - $($_.name)" -ForegroundColor Green
            }
            
            Write-Host ""
            Write-Host "🚀 You're ready to run: .\authorize-pipeline-resources.ps1" -ForegroundColor Green
        } catch {
            Write-Host "❌ PAT token is INVALID or EXPIRED!" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "📝 Create a new PAT token from: https://dev.azure.com/ramyabinyahya/_usersSettings/tokens" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ AZURE_DEVOPS_PAT is NOT configured!" -ForegroundColor Red
        Write-Host ""
        Write-Host "📝 Setup required:" -ForegroundColor Yellow
        Write-Host "   1. Create PAT token: https://dev.azure.com/ramyabinyahya/_usersSettings/tokens" -ForegroundColor Cyan
        Write-Host "   2. Run: .\setup-pat-token.ps1 -PAT 'your-token-here'" -ForegroundColor Cyan
        Write-Host ""
    }
    exit 0
}

# Set PAT if provided
if (-not [string]::IsNullOrEmpty($PAT)) {
    Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║            Setting Up Azure DevOps PAT Token                              ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🔐 Setting AZURE_DEVOPS_PAT environment variable..." -ForegroundColor Yellow
    
    try {
        [Environment]::SetEnvironmentVariable('AZURE_DEVOPS_PAT', $PAT, 'User')
        Write-Host "✅ Environment variable set for current user!" -ForegroundColor Green
        Write-Host ""
        
        # Verify it was set
        $env:AZURE_DEVOPS_PAT = $PAT
        
        Write-Host "🧪 Testing PAT token..." -ForegroundColor Yellow
        
        $EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$PAT"))
        $Headers = @{
            "Authorization" = "Basic $EncodedToken"
            "Content-Type"  = "application/json"
        }
        
        $Response = Invoke-RestMethod -Uri "https://dev.azure.com/ramyabinyahya/_apis/projects" `
            -Headers $Headers -Method Get -ErrorAction Stop
        
        Write-Host "✅ PAT token validated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Accessible projects:" -ForegroundColor Cyan
        $Response.value | ForEach-Object {
            Write-Host "   - $($_.name)" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
        Write-Host "   The environment variable has been set, but you need to RESTART PowerShell" -ForegroundColor Yellow
        Write-Host "   for it to take effect in new terminal sessions." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🚀 Next steps:" -ForegroundColor Green
        Write-Host "   1. Close this PowerShell window" -ForegroundColor Cyan
        Write-Host "   2. Open a NEW PowerShell window" -ForegroundColor Cyan
        Write-Host "   3. Navigate to: C:\Users\RamyaBIN\totp-playwright" -ForegroundColor Cyan
        Write-Host "   4. Run: .\authorize-pipeline-resources.ps1" -ForegroundColor Cyan
        Write-Host ""
        
    } catch {
        Write-Host "❌ Failed to set PAT token!" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "📝 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "   1. Verify token is correct and not expired" -ForegroundColor Cyan
        Write-Host "   2. Check token has required scopes (Build, Variable Groups, Secure files)" -ForegroundColor Cyan
        Write-Host "   3. Create new token if needed: https://dev.azure.com/ramyabinyahya/_usersSettings/tokens" -ForegroundColor Cyan
        exit 1
    }
    
    exit 0
}

# Interactive mode
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      Azure DevOps PAT Token Interactive Setup                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "ℹ️  What is an Azure DevOps PAT Token?" -ForegroundColor Cyan
Write-Host "   It's a secure credential that allows scripts to authenticate to Azure Pipelines." -ForegroundColor Gray
Write-Host "   Different from Azure AD credentials - this is for the DevOps platform itself." -ForegroundColor Gray
Write-Host ""

Write-Host "📋 Step 1: Open Azure DevOps Token Settings" -ForegroundColor Yellow
Write-Host "   Option A: https://dev.azure.com/RSATwithAzure/_usersSettings/tokens" -ForegroundColor Cyan
Write-Host "   Option B: https://dev.azure.com/RSATwithAzure/_settings/tokens" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Or manually navigate:" -ForegroundColor Gray
Write-Host "   1. Go to https://dev.azure.com/RSATwithAzure" -ForegroundColor Gray
Write-Host "   2. Click your profile icon (top-right)" -ForegroundColor Gray
Write-Host "   3. Select 'Personal access tokens'" -ForegroundColor Gray

Write-Host "   When you arrive, you'll see:" -ForegroundColor Gray
Write-Host "   - A 'New Token' button (blue button)" -ForegroundColor Gray
Write-Host "   - List of existing tokens (if any)" -ForegroundColor Gray
Write-Host ""

$OpenBrowser = Read-Host "Do you want to open this URL in your browser? (Y/n)"
if ($OpenBrowser -ne 'n' -and $OpenBrowser -ne 'N') {
    Start-Process "https://dev.azure.com/ramyabinyahya/_usersSettings/tokens"
    Write-Host "🌐 Opening browser..." -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Step 2: Create New Token - Fill in these details:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Field: Name" -ForegroundColor Cyan
Write-Host "   Value: Playwright-Pipeline-Auth" -ForegroundColor Green
Write-Host ""
Write-Host "   Field: Organization" -ForegroundColor Cyan
Write-Host "   Value: ramyabinyahya" -ForegroundColor Green
Write-Host ""
Write-Host "   Field: Expiration" -ForegroundColor Cyan
Write-Host "   Value: Custom defined (set to 1 year or more)" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Step 3: Select Required Scopes" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Check these scopes:" -ForegroundColor Cyan
Write-Host "   ✓ Build (Read & execute)" -ForegroundColor Green
Write-Host "   ✓ Variable Groups (Read, create & manage)" -ForegroundColor Green
Write-Host "   ✓ Secure files (Read)" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Step 4: Copy Token" -ForegroundColor Yellow
Write-Host "   Click 'Create Token' button" -ForegroundColor Cyan
Write-Host "   You'll see a blue box with your token" -ForegroundColor Cyan
Write-Host "   Copy it immediately - you won't see it again!" -ForegroundColor Red
Write-Host ""

Write-Host "📝 Paste your token below:" -ForegroundColor Yellow
$TokenInput = Read-Host "Enter your PAT token"

if ([string]::IsNullOrEmpty($TokenInput)) {
    Write-Host "❌ No token provided. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔐 Setting AZURE_DEVOPS_PAT environment variable..." -ForegroundColor Yellow

try {
    [Environment]::SetEnvironmentVariable('AZURE_DEVOPS_PAT', $TokenInput, 'User')
    Write-Host "✅ Environment variable set!" -ForegroundColor Green
    
    # Set for current session
    $env:AZURE_DEVOPS_PAT = $TokenInput
    
    Write-Host ""
    Write-Host "🧪 Testing PAT token..." -ForegroundColor Yellow
    
    $EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$TokenInput"))
    $Headers = @{
        "Authorization" = "Basic $EncodedToken"
        "Content-Type"  = "application/json"
    }
    
    $Response = Invoke-RestMethod -Uri "https://dev.azure.com/ramyabinyahya/_apis/projects" `
        -Headers $Headers -Method Get -ErrorAction Stop
    
    Write-Host "✅ PAT token is VALID!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Connected projects:" -ForegroundColor Cyan
    $Response.value | ForEach-Object {
        Write-Host "   ✓ $($_.name)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                    ✅ Setup Complete!                                     ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🚀 You're ready to authorize pipeline resources!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next command to run:" -ForegroundColor Cyan
    Write-Host "   .\authorize-pipeline-resources.ps1" -ForegroundColor Yellow
    Write-Host ""
    
    $RunAuth = Read-Host "Run authorization script now? (Y/n)"
    if ($RunAuth -ne 'n' -and $RunAuth -ne 'N') {
        Write-Host ""
        & ".\authorize-pipeline-resources.ps1"
    }
    
} catch {
    Write-Host "❌ Failed to set up PAT token!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "   - Token is invalid or incorrect" -ForegroundColor Cyan
    Write-Host "   - Token has expired" -ForegroundColor Cyan
    Write-Host "   - Token doesn't have required scopes" -ForegroundColor Cyan
    Write-Host "   - Network connectivity issue" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
