#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Refreshes D365 Authentication file and commits it to Azure DevOps
.DESCRIPTION
    Runs global-setup to generate a fresh D365 session file and commits it to the repository
.PARAMETER GitUserName
    GitHub/DevOps username for git config
.PARAMETER GitUserEmail
    GitHub/DevOps email for git config
.PARAMETER CommitMessage
    Custom commit message (optional)
#>

param(
    [string]$GitUserName = "Azure Pipeline",
    [string]$GitUserEmail = "pipeline@azure.devops.com",
    [string]$CommitMessage = "chore: refresh D365 authentication session file"
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 === D365 AUTH FILE REFRESH SCRIPT ===" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$workingDir = Get-Location
Write-Host "📁 Working directory: $workingDir" -ForegroundColor Yellow

# Step 1: Verify Node.js is installed
Write-Host ""
Write-Host "Step 1️⃣: Verifying Node.js installation..." -ForegroundColor Cyan
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Step 2: Install dependencies
Write-Host ""
Write-Host "Step 2️⃣: Installing dependencies..." -ForegroundColor Cyan
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 3: Install Playwright browsers
Write-Host ""
Write-Host "Step 3️⃣: Installing Playwright browsers..." -ForegroundColor Cyan
npx playwright install --with-deps chromium
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Playwright browsers" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Playwright browsers installed" -ForegroundColor Green

# Step 4: Run global setup to generate fresh auth file
Write-Host ""
Write-Host "Step 4️⃣: Running global setup to refresh D365 authentication..." -ForegroundColor Cyan
Write-Host "This will log in to D365 and save a fresh session file..." -ForegroundColor Yellow
Write-Host ""

# Set environment variables for headless mode
$env:HEADLESS = "true"
$env:CI = "true"

# Remove old auth file to force fresh authentication
if (Test-Path "auth/D365AuthFile.json") {
    Write-Host "🗑️  Removing old authentication file..." -ForegroundColor Yellow
    Remove-Item "auth/D365AuthFile.json" -Force
}

# Run the global setup
npx playwright codegen https://avs-isv-puat.sandbox.operations.dynamics.com --save-storage=auth/D365AuthFile.json
if ($LASTEXITCODE -ne 0) {
    # Alternative: Use global-setup.ts directly
    Write-Host "⚠️  Codegen not available, trying alternative method..." -ForegroundColor Yellow
    # This would require running global-setup through the test config
    Write-Host "❌ Could not generate auth file. Please generate manually." -ForegroundColor Red
    exit 1
}

# Verify auth file was generated
Write-Host ""
if (Test-Path "auth/D365AuthFile.json") {
    $fileSize = (Get-Item "auth/D365AuthFile.json").Length
    Write-Host "✅ Authentication file generated successfully" -ForegroundColor Green
    Write-Host "📊 File size: $fileSize bytes" -ForegroundColor Green
} else {
    Write-Host "❌ Authentication file was not generated" -ForegroundColor Red
    exit 1
}

# Step 5: Configure Git (if not already configured in Azure DevOps)
Write-Host ""
Write-Host "Step 5️⃣: Configuring Git..." -ForegroundColor Cyan
git config user.name "$GitUserName"
git config user.email "$GitUserEmail"
Write-Host "✅ Git configured for user: $GitUserName <$GitUserEmail>" -ForegroundColor Green

# Step 6: Check Git status
Write-Host ""
Write-Host "Step 6️⃣: Checking Git status..." -ForegroundColor Cyan
git status
Write-Host ""

# Step 7: Commit the auth file
Write-Host "Step 7️⃣: Committing updated authentication file..." -ForegroundColor Cyan

# Stage only the auth file
git add auth/D365AuthFile.json

# Check if there are changes to commit
$git_status = git status --porcelain
if ([string]::IsNullOrEmpty($git_status)) {
    Write-Host "⚠️  No changes to commit (auth file unchanged)" -ForegroundColor Yellow
    exit 0
}

# Commit the changes
git commit -m "$CommitMessage

Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')
Triggered by: Azure Pipeline Scheduled Job"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Changes committed" -ForegroundColor Green

# Step 8: Push to repository
Write-Host ""
Write-Host "Step 8️⃣: Pushing to Azure DevOps repository..." -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push changes" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Changes pushed to repository" -ForegroundColor Green

# Step 9: Display summary
Write-Host ""
Write-Host "📊 === REFRESH COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "✅ D365 authentication file has been successfully refreshed and pushed!" -ForegroundColor Green
Write-Host "🔗 Check your Azure DevOps repository for the latest changes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next refresh: $(Get-Date -Add (New-TimeSpan -Days 1) -Format 'yyyy-MM-dd HH:mm:ss UTC')" -ForegroundColor Yellow
