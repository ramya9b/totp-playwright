# 🤖 Automated Pipeline Resource Authorization Guide

## Overview
Instead of manually clicking "Permit" in the Azure Pipelines UI, this script automatically authorizes all required resources (variable groups and secure files) for your pipeline through the Azure DevOps REST API.

## Prerequisites

### 1. Create a Personal Access Token (PAT)

1. Go to: **https://dev.azure.com/ramyabinyahya/_usersSettings/tokens**
2. Click **"New Token"**
3. Fill in the details:
   - **Name**: `Playwright-Pipeline-Auth` (or any descriptive name)
   - **Organization**: Select your organization
   - **Expiration**: 1 year (or your preferred duration)
4. Under **Scopes**, select:
   - ✅ **Build** (Read & execute)
   - ✅ **Secrets** (Read)
   - ✅ **Variable Groups** (Read & manage)
5. Click **"Create"**
6. **IMPORTANT**: Copy the token immediately (you won't see it again!)

### 2. Set Up Environment Variable

Open PowerShell and run:

```powershell
[Environment]::SetEnvironmentVariable('AZURE_DEVOPS_PAT', 'your-actual-pat-token-here', 'User')
```

**Replace `'your-actual-pat-token-here'`** with the token you just created.

After setting this, **restart PowerShell** for the environment variable to take effect.

## Usage

### Quick Start (Using Environment Variable)

```powershell
cd C:\Users\RamyaBIN\totp-playwright
.\authorize-pipeline-resources.ps1
```

### Using Parameter (Without Environment Variable)

```powershell
cd C:\Users\RamyaBIN\totp-playwright
.\authorize-pipeline-resources.ps1 -PersonalAccessToken "your-pat-token-here"
```

### Get Help

```powershell
.\authorize-pipeline-resources.ps1 -Help
```

## Expected Output

```
╔════════════════════════════════════════════════════════════════════════════╗
║       Azure Pipelines Resource Authorization Script                       ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 Configuration:
   Organization: ramyabinyahya
   Project: totp-playwright
   Pipeline: azure-pipelines

🔐 Authenticating to Azure DevOps...
✅ Authentication successful!

🔍 Finding pipeline: azure-pipelines...
✅ Pipeline found! ID: 123

📦 Authorizing Variable Groups...
   ✅ Authorized: Playwright-Testing-Secrets_totp
   ✅ Authorized: Playwright-Testing-Secrets

🔐 Authorizing Secure Files...
   ✅ Authorized: D365AuthFile.json

╔════════════════════════════════════════════════════════════════════════════╗
║                          Authorization Summary                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📊 Results:
   Variable Groups Authorized: 2 ✅
   Secure Files Authorized: 1 ✅

✅ All resources authorized successfully!

🚀 Your scheduled pipelines should now run without permission errors!

📝 Next Steps:
   1. Queue a manual build to verify everything works
   2. Check scheduled pipeline execution at the scheduled times
   3. Monitor Allure reports for test results
```

## Troubleshooting

### "Authentication failed"
- **Cause**: Invalid PAT token or incorrect environment variable
- **Fix**: 
  1. Check the token hasn't expired
  2. Verify you set the environment variable correctly
  3. Run `$env:AZURE_DEVOPS_PAT` in PowerShell to confirm it's set

### "Pipeline not found"
- **Cause**: Pipeline name doesn't match
- **Fix**: The script will list available pipelines. Use the exact name shown

### "Variable group not found" or "Secure file not found"
- **Cause**: Resource doesn't exist in your project
- **Fix**: Create the resource in Azure Pipelines first, or update the script if the name is different

### "Permission denied"
- **Cause**: Your PAT token doesn't have required scopes
- **Fix**: Create a new PAT with "Build (read & execute)" and "Secrets (read)" scopes

## Automation Ideas

### Option 1: Schedule the Script
Run this in Windows Task Scheduler:

```powershell
# Create scheduled task
$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument 'C:\Users\RamyaBIN\totp-playwright\authorize-pipeline-resources.ps1'
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Days 1)
Register-ScheduledTask -TaskName 'PipelineResourceAuth' -Action $Action -Trigger $Trigger -RunLevel Highest
```

### Option 2: Run in Azure Pipeline
Add this to `azure-pipelines.yml` (for manual authorization):

```yaml
- stage: AuthorizeResources
  displayName: 'Authorize Pipeline Resources'
  jobs:
    - job: AuthorizeSecrets
      displayName: 'Authorize Variable Groups and Secure Files'
      steps:
        - task: PowerShell@2
          inputs:
            filePath: '$(System.DefaultWorkingDirectory)/authorize-pipeline-resources.ps1'
            arguments: |
              -Organization "ramyabinyahya" `
              -Project "totp-playwright" `
              -PipelineName "azure-pipelines" `
              -PersonalAccessToken "$(AZURE_DEVOPS_PAT)"
```

### Option 3: Add to CI/CD as Pre-Pipeline Step
Include in your build matrix to ensure resources are always authorized

## Security Best Practices

✅ **DO:**
- Store PAT tokens in environment variables (not hardcoded)
- Use tokens with minimal required scopes
- Rotate tokens regularly (Azure suggests yearly)
- Use "Restrict audience" option when creating the token

❌ **DON'T:**
- Share your PAT token with others
- Commit tokens to source control
- Use broad scopes like "Full Access"
- Store tokens in plain text files

## What This Script Does

1. ✅ Authenticates to Azure DevOps API using your PAT
2. ✅ Finds your pipeline by name
3. ✅ Authorizes all variable groups:
   - `Playwright-Testing-Secrets_totp`
   - `Playwright-Testing-Secrets`
4. ✅ Authorizes all secure files:
   - `D365AuthFile.json`
5. ✅ Provides detailed output and error handling

## Result

After running this script successfully:
- ✅ Scheduled pipelines can access variable groups
- ✅ Scheduled pipelines can access secure files
- ✅ No more "Permission needed" prompts
- ✅ Daily and weekly scheduled tests will run automatically

---

**Questions?** Check your Azure DevOps project settings or Azure Pipelines documentation for more details.
