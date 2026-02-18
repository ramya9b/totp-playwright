# ============================================================================
# PAT Token Verification Script
# Purpose: Verify token is properly configured and valid
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              PAT Token Verification & Troubleshooting                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if token exists
Write-Host "🔍 Checking if AZURE_DEVOPS_PAT environment variable is set..." -ForegroundColor Yellow

if ([string]::IsNullOrEmpty($env:AZURE_DEVOPS_PAT)) {
    Write-Host "❌ ERROR: AZURE_DEVOPS_PAT is NOT set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You must set the environment variable first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Direct command" -ForegroundColor Cyan
    Write-Host '  [Environment]::SetEnvironmentVariable("AZURE_DEVOPS_PAT", "your-token-here", "User")' -ForegroundColor Green
    Write-Host ""
    Write-Host "Option 2: Using the quick setup script" -ForegroundColor Cyan
    Write-Host "  .\quick-setup-pat.ps1" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: After setting, close and reopen PowerShell!" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ AZURE_DEVOPS_PAT is SET" -ForegroundColor Green
Write-Host "   Token length: $($env:AZURE_DEVOPS_PAT.Length) characters" -ForegroundColor Gray
Write-Host ""

# Check token format
Write-Host "🔍 Checking token format..." -ForegroundColor Yellow

if ($env:AZURE_DEVOPS_PAT.Length -lt 10) {
    Write-Host "❌ Token is too short! Token should be much longer (usually 50+ characters)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Your token appears to be invalid or corrupted." -ForegroundColor Yellow
    Write-Host "Create a new token from:" -ForegroundColor Cyan
    Write-Host "   https://dev.azure.com/RSATwithAzure/_usersSettings/tokens" -ForegroundColor Green
    exit 1
}

if ($env:AZURE_DEVOPS_PAT -match '\s') {
    Write-Host "⚠️  WARNING: Token contains spaces!" -ForegroundColor Yellow
    Write-Host "   Tokens should not have spaces. Check if you copied it correctly." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Token format appears valid (length: $($env:AZURE_DEVOPS_PAT.Length) chars)" -ForegroundColor Green
Write-Host ""

# Test token
Write-Host "🧪 Testing token with Azure DevOps API..." -ForegroundColor Yellow

try {
    # Encode token
    $EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$env:AZURE_DEVOPS_PAT"))
    $Headers = @{
        "Authorization" = "Basic $EncodedToken"
        "Content-Type"  = "application/json"
    }
    
    # Try different API endpoints to diagnose
    Write-Host ""
    Write-Host "Testing various API endpoints:" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 1: Organizations endpoint
    Write-Host "1️⃣  Testing: /_apis/organizations" -ForegroundColor Gray
    try {
        $OrgResponse = Invoke-RestMethod -Uri "https://dev.azure.com/_apis/organizations?api-version=7.1-preview.1" `
            -Headers $Headers -Method Get -ErrorAction Stop -TimeoutSec 5
        Write-Host "   ✅ Success" -ForegroundColor Green
        Write-Host "   Found $($OrgResponse.value.Count) organization(s)" -ForegroundColor Green
        
        # Show organizations
        foreach ($Org in $OrgResponse.value) {
            Write-Host "      - $($Org.accountName)" -ForegroundColor Cyan
        }
    } catch {
        $ErrorMsg = $_.Exception.Message
        Write-Host "   ❌ Failed: $ErrorMsg" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Test 2: Specific organization
    Write-Host "2. Testing: /RSATwithAzure/_apis/projects" -ForegroundColor Gray
    try {
        $ProjectResponse = Invoke-RestMethod -Uri "https://dev.azure.com/RSATwithAzure/_apis/projects?api-version=7.1-preview.4" `
            -Headers $Headers -Method Get -ErrorAction Stop -TimeoutSec 5
        Write-Host "   ✅ Success" -ForegroundColor Green
        Write-Host "   Found $($ProjectResponse.value.Count) project(s)" -ForegroundColor Green
        
        # Show projects
        foreach ($Project in $ProjectResponse.value) {
            Write-Host "      - $($Project.name)" -ForegroundColor Cyan
        }
    } catch {
        $ErrorMsg = $_.Exception.Message
        Write-Host "   ❌ Failed: $ErrorMsg" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Test 3: User info
    Write-Host "3. Testing: /_apis/profile/currentuser" -ForegroundColor Gray
    try {
        $UserResponse = Invoke-RestMethod -Uri "https://app.vssps.visualstudio.com/_apis/profile/currentuser?api-version=7.1-preview.3" `
            -Headers $Headers -Method Get -ErrorAction Stop -TimeoutSec 5
        Write-Host "   ✅ Success" -ForegroundColor Green
        Write-Host "   Logged in as: $($UserResponse.displayName)" -ForegroundColor Green
        Write-Host "   Email: $($UserResponse.emailAddress)" -ForegroundColor Green
    } catch {
        $ErrorMsg = $_.Exception.Message
        Write-Host "   ❌ Failed: $ErrorMsg" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host ""
    
    # Analysis
    Write-Host "Analysis:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "If Test 1 passed but Tests 2-3 failed:" -ForegroundColor Yellow
    Write-Host "   - Check that RSATwithAzure organization exists and you have access" -ForegroundColor Cyan
    Write-Host "   - Verify you have permission to view projects in that organization" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "If all tests failed:" -ForegroundColor Yellow
    Write-Host "   - Token is invalid or expired" -ForegroundColor Cyan
    Write-Host "   - Token does not have required permissions" -ForegroundColor Cyan
    Write-Host "   - Create a new token with Build, Variable Groups, and Secure files scopes" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "If tests passed:" -ForegroundColor Yellow
    Write-Host "   - Token is valid! Run: authorize-pipeline-resources.ps1" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ Critical error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 If you still have issues:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create a NEW PAT token from:" -ForegroundColor Cyan
Write-Host "   https://dev.azure.com/RSATwithAzure/_usersSettings/tokens" -ForegroundColor Green
Write-Host ""
Write-Host "2. Make sure it has these EXACT scopes:" -ForegroundColor Cyan
Write-Host "   - Build - Read and execute" -ForegroundColor Green
Write-Host "   - Variable Groups - Read, create and manage" -ForegroundColor Green
Write-Host "   - Secure files - Read" -ForegroundColor Green
Write-Host ""
Write-Host "3. Set the token (copy entire token, no spaces/breaks):" -ForegroundColor Cyan
Write-Host '   [Environment]::SetEnvironmentVariable("AZURE_DEVOPS_PAT", "PASTE_TOKEN_HERE", "User")' -ForegroundColor Green
Write-Host ""
Write-Host "4. Close PowerShell completely and reopen" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Run this script again to verify:" -ForegroundColor Cyan
Write-Host "   .\verify-pat-token.ps1" -ForegroundColor Green
Write-Host ""
