# ============================================================================
# Azure Pipelines Resource Authorization Automation Script
# Purpose: Automatically authorize variable groups and secure files for pipelines
# This eliminates the need to manually click "Permit" in the Azure Pipelines UI
# ============================================================================

param(
    [string]$Organization = "RSATwithAzure",      # Your Azure DevOps organization
    [string]$Project = "totp-playwright",          # Your project name
    [string]$PipelineName = "azure-pipelines",     # Pipeline name or file
    [string]$PersonalAccessToken = $env:AZURE_DEVOPS_PAT,  # Use environment variable or parameter
    [switch]$Help
)

# Display help
if ($Help) {
    Write-Host @"
╔════════════════════════════════════════════════════════════════════════════╗
║     Azure Pipelines Resource Authorization Automation Script               ║
╚════════════════════════════════════════════════════════════════════════════╝

SYNOPSIS:
  Automatically authorizes variable groups and secure files for Azure Pipelines
  to fix "Permission needed" errors on scheduled pipeline runs.

USAGE:
  .\authorize-pipeline-resources.ps1 -Organization <name> -Project <name> `
    -PipelineName <name> -PersonalAccessToken <token>

PARAMETERS:
  -Organization        : Azure DevOps organization name (default: ramyabinyahya)
  -Project            : Project name (default: totp-playwright)
  -PipelineName       : Pipeline name without .yml extension (default: azure-pipelines)
  -PersonalAccessToken: Azure DevOps PAT token (uses AZURE_DEVOPS_PAT env var if not provided)
  -Help               : Display this help message

PREREQUISITES:
  1. Generate a Personal Access Token (PAT) from Azure DevOps:
     - Go to: https://dev.azure.com/<organization>/_usersSettings/tokens
     - Create token with: "Build (read & execute)" and "Secrets (read)" scopes
     - Set environment variable: [Environment]::SetEnvironmentVariable('AZURE_DEVOPS_PAT', 'your-token', 'User')
  
  2. Ensure you have at least Contributor role on the project

EXAMPLE:
  # Using environment variable
  [Environment]::SetEnvironmentVariable('AZURE_DEVOPS_PAT', 'your-pat-token', 'User')
  .\authorize-pipeline-resources.ps1

  # Using parameter
  .\authorize-pipeline-resources.ps1 -PersonalAccessToken 'your-pat-token'

OUTPUT:
  ✅ Variable groups authorized
  ✅ Secure files authorized
  ❌ Errors displayed with details for troubleshooting
"@
    exit 0
}

# ============================================================================
# CONFIGURATION & VALIDATION
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Azure Pipelines Resource Authorization Script                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Validate inputs
if ([string]::IsNullOrEmpty($PersonalAccessToken)) {
    Write-Host "❌ ERROR: Personal Access Token is required!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To set up the PAT token, run:" -ForegroundColor Yellow
    Write-Host '  [Environment]::SetEnvironmentVariable("AZURE_DEVOPS_PAT", "your-token", "User")' -ForegroundColor Green
    Write-Host ""
    Write-Host "Get your PAT token from: https://dev.azure.com/$Organization/_usersSettings/tokens" -ForegroundColor Cyan
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Organization: $Organization"
Write-Host "   Project: $Project"
Write-Host "   Pipeline: $PipelineName"
Write-Host ""

# ============================================================================
# PREPARE API AUTHENTICATION
# ============================================================================

# Azure DevOps API base URL
$BaseUri = "https://dev.azure.com/$Organization/$Project/_apis"

# Encode PAT token for Basic auth
$EncodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("`:$PersonalAccessToken"))
$Headers = @{
    "Authorization" = "Basic $EncodedToken"
    "Content-Type"  = "application/json"
}

Write-Host "🔐 Authenticating to Azure DevOps..." -ForegroundColor Yellow

# Test authentication
try {
    $TestResponse = Invoke-RestMethod -Uri "$BaseUri/projects" -Headers $Headers -Method Get -ErrorAction Stop
    Write-Host "✅ Authentication successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# GET PIPELINE ID
# ============================================================================

Write-Host "🔍 Finding pipeline: $PipelineName..." -ForegroundColor Yellow

try {
    $PipelineResponse = Invoke-RestMethod `
        -Uri "$BaseUri/pipelines?api-version=7.1-preview.1" `
        -Headers $Headers `
        -Method Get `
        -ErrorAction Stop
    
    $Pipeline = $PipelineResponse.value | Where-Object { $_.name -eq $PipelineName }
    
    if (-not $Pipeline) {
        Write-Host "❌ Pipeline '$PipelineName' not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available pipelines:" -ForegroundColor Yellow
        $PipelineResponse.value | ForEach-Object { Write-Host "  - $($_.name)" }
        exit 1
    }
    
    $PipelineId = $Pipeline.id
    Write-Host "✅ Pipeline found! ID: $PipelineId" -ForegroundColor Green
} catch {
    Write-Host "❌ Error fetching pipelines: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# AUTHORIZE VARIABLE GROUPS
# ============================================================================

Write-Host "📦 Authorizing Variable Groups..." -ForegroundColor Cyan

# Variable groups to authorize
$VariableGroups = @(
    "Playwright-Testing-Secrets_totp",
    "Playwright-Testing-Secrets"
)

$AuthorizedGroups = 0
$FailedGroups = 0

foreach ($GroupName in $VariableGroups) {
    try {
        # Get variable group ID
        $GroupResponse = Invoke-RestMethod `
            -Uri "$BaseUri/distributedtask/variablegroups?api-version=7.1-preview.2&groupName=$GroupName" `
            -Headers $Headers `
            -Method Get `
            -ErrorAction Stop
        
        if ($GroupResponse.value.Count -eq 0) {
            Write-Host "   ⚠️  Variable group '$GroupName' not found (skipping)" -ForegroundColor Yellow
            continue
        }
        
        $GroupId = $GroupResponse.value[0].id
        
        # Authorize the variable group for this pipeline
        $AuthorizeUri = "$BaseUri/pipelines/$PipelineId/pipelineresources/variablegroups/$GroupId?api-version=7.1-preview.1"
        
        $AuthorizeBody = @{
            "authorized" = $true
        } | ConvertTo-Json
        
        Invoke-RestMethod `
            -Uri $AuthorizeUri `
            -Headers $Headers `
            -Method Patch `
            -Body $AuthorizeBody `
            -ErrorAction Stop | Out-Null
        
        Write-Host "   ✅ Authorized: $GroupName" -ForegroundColor Green
        $AuthorizedGroups++
        
    } catch {
        Write-Host "   ❌ Failed to authorize $GroupName" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
        $FailedGroups++
    }
}

Write-Host ""

# ============================================================================
# AUTHORIZE SECURE FILES
# ============================================================================

Write-Host "🔐 Authorizing Secure Files..." -ForegroundColor Cyan

# Secure files to authorize
$SecureFiles = @(
    "D365AuthFile.json"
)

$AuthorizedFiles = 0
$FailedFiles = 0

foreach ($FileName in $SecureFiles) {
    try {
        # Get secure file ID
        $FileResponse = Invoke-RestMethod `
            -Uri "$BaseUri/distributedtask/securefiles?api-version=7.1-preview.1" `
            -Headers $Headers `
            -Method Get `
            -ErrorAction Stop
        
        $SecureFile = $FileResponse.value | Where-Object { $_.name -eq $FileName }
        
        if (-not $SecureFile) {
            Write-Host "   ⚠️  Secure file '$FileName' not found (skipping)" -ForegroundColor Yellow
            continue
        }
        
        $FileId = $SecureFile.id
        
        # Get current authorization settings
        $AuthUri = "$BaseUri/distributedtask/securefiles/$FileId/authorize?api-version=7.1-preview.1&pipelineId=$PipelineId"
        
        # Authorize the secure file
        $AuthBody = @{
            "authorized" = $true
        } | ConvertTo-Json
        
        Invoke-RestMethod `
            -Uri $AuthUri `
            -Headers $Headers `
            -Method Patch `
            -Body $AuthBody `
            -ErrorAction Stop | Out-Null
        
        Write-Host "   ✅ Authorized: $FileName" -ForegroundColor Green
        $AuthorizedFiles++
        
    } catch {
        Write-Host "   ❌ Failed to authorize $FileName" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
        $FailedFiles++
    }
}

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                          Authorization Summary                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Results:"
Write-Host "   Variable Groups Authorized: $AuthorizedGroups ✅"
Write-Host "   Secure Files Authorized: $AuthorizedFiles ✅"
Write-Host ""

if ($FailedGroups -gt 0 -or $FailedFiles -gt 0) {
    Write-Host "   Failed Operations: $($FailedGroups + $FailedFiles) ❌" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Some authorizations failed. Please check the errors above." -ForegroundColor Yellow
} else {
    Write-Host "✅ All resources authorized successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Your scheduled pipelines should now run without permission errors!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Queue a manual build to verify everything works"
Write-Host "   2. Check scheduled pipeline execution at the scheduled times"
Write-Host "   3. Monitor Allure reports for test results"
Write-Host ""
