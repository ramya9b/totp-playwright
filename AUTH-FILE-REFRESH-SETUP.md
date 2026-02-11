# 🔐 D365 Authentication File Auto-Refresh Setup Guide

## Overview

This guide explains how to automatically refresh your D365 authentication file on a **daily or weekly schedule** using Azure DevOps pipelines.

---

## ✅ Prerequisites

- ✅ Azure DevOps project already set up
- ✅ Git repository with Playwright project
- ✅ Azure Pipeline variable group: `Playwright-Testing-Secrets`
- ✅ Required secrets defined in variable group (see below)

---

## 🔑 Required Variables in Azure DevOps

Add these secrets to your **Playwright-Testing-Secrets** variable group:

| Variable | Value | Type | Example |
|----------|-------|------|---------|
| `M365_USERNAME` | Your D365 login email | Secret | `user@company.com` |
| `M365_PASSWORD` | Your D365 password | Secret | `YourPassword123!` |
| `TOTP_SECRET` | Your MFA TOTP secret | Secret | `nslgypx7hbklrj7v` |
| `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` | Access token for Playwright Service | Secret | (from Azure Portal) |

### How to Set Up Variable Group in Azure DevOps

1. Go to **Azure DevOps** → **Project Settings** → **Pipelines** → **Library**
2. Click **+ Variable group** → Name it `Playwright-Testing-Secrets`
3. Add each variable above and mark as **Secret** (padlock icon)
4. Click **Save**

---

## 📋 Solution Options

### Option 1: Separate Auth Refresh Pipeline (Recommended)

**Best for:** Clean separation of concerns, dedicated scheduling

#### Step 1: Create Azure DevOps Pipeline

1. Go to **Pipelines** → **New Pipeline**
2. Select **Azure Repos Git** 
3. Select **Existing Azure Pipelines YAML file**
4. Path: `azure-pipelines-auth-refresh.yml`
5. Name: **D365 Auth Refresh**
6. Click **Save**

#### Step 2: Configure Pipeline

Once the pipeline is created:

1. Click **Edit** → **...** (more options)
2. Select **Schedule**
3. Verify scheduled triggers are configured:
   - ✅ Daily: 2:00 AM UTC
   - ✅ Weekly: Sunday 2:00 AM UTC

#### Step 3: Grant Pipeline Permissions

⚠️ **Important**: On first run, you'll see a permission warning

1. Click **Permit** to allow the pipeline to access secret variables
2. Click **Permit** again to allow pushing to repository

---

### Option 2: Add Auth Refresh to Existing Pipeline

**Best for:** Single pipeline managing everything

Add this job to your existing `azure-pipelines.yml`:

```yaml
  - stage: RefreshAuth
    displayName: 'Refresh D365 Auth (Scheduled)'
    condition: and(succeeded(), eq(variables['Build.Reason'], 'Schedule'))
    dependsOn: []  # Run independently
    jobs:
      - job: RefreshAuthFile
        displayName: 'Generate Fresh D365 Session'
        timeoutInMinutes: 30
        
        steps:
          # [Copy all steps from azure-pipelines-auth-refresh.yml]
```

---

## 🔄 How It Works

### Execution Flow

```
Scheduled Trigger (Daily/Weekly)
    ↓
Azure Pipeline Starts
    ↓
Checkout Code
    ↓
Install Dependencies & Browsers
    ↓
Generate Fresh D365 Session
    ↓
Commit Changes (if file changed)
    ↓
Push to Repository
```

### What Gets Updated

✅ **File Updated:**
- `auth/D365AuthFile.json` - Fresh session tokens
- Commit message includes timestamp and trigger info

✅ **No Changes To:**
- Code files
- Test files
- Configuration files

---

## 📊 Schedule Configuration

### Daily Refresh

```yaml
- cron: "0 2 * * *"           # 2:00 AM UTC daily
```

Convert to your timezone:
- **2:00 AM UTC** = **7:30 AM IST** = **9:30 PM EST**

### Weekly Refresh

```yaml
- cron: "0 2 * * 0"           # 2:00 AM UTC Sundays
```

### Custom Schedule

Edit `azure-pipelines-auth-refresh.yml`:

```yaml
schedules:
  - cron: "0 2 * * *"          # Change this cron expression
    displayName: "Your Description"
    branches:
      include:
        - main
    always: true
```

**Cron Format:** `minute hour day month day-of-week`

Examples:
- `"0 2 * * *"` - Every day at 2:00 AM
- `"0 2 * * 0"` - Every Sunday at 2:00 AM
- `"0 2 * * 1-5"` - Every weekday at 2:00 AM
- `"0 2 1 * *"` - First day of month at 2:00 AM
- `"30 2 * * *"` - Every day at 2:30 AM

---

## 🚀 Initial Setup Steps

### Step 1: Push New Pipeline Files

```powershell
cd c:\Users\RamyaBIN\totp-playwright

git add azure-pipelines-auth-refresh.yml
git add scripts/refresh-auth-file.ps1
git commit -m "setup: add D365 auth file refresh pipeline"
git push origin main
```

### Step 2: Create Pipeline in Azure DevOps

1. Go to **Pipelines** → **New Pipeline**
2. Select **Azure Repos Git**
3. Select **Existing Azure Pipelines YAML file**
4. Choose `azure-pipelines-auth-refresh.yml`
5. Click **Save**

### Step 3: Grant Permissions

First pipeline run will require:
- ✅ Approve use of secret variables
- ✅ Approve push to repository

### Step 4: Verify Scheduled Runs

1. Go to **Pipelines** → **D365 Auth Refresh**
2. Click **Edit** → **...** → **Triggers**
3. Verify scheduled triggers show:
   - Daily at 2:00 AM UTC
   - Weekly Sunday at 2:00 AM UTC

---

## 📈 Monitoring & Troubleshooting

### View Pipeline Runs

1. Go to **Pipelines** → **D365 Auth Refresh**
2. Watch for scheduled runs at configured times
3. Click on any run to see detailed logs

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Permission denied" when pushing** | Click "Permit" button on first run warning |
| **Auth file not generated** | Check credentials in variable group |
| **Pipeline doesn't run on schedule** | Verify pipeline is saved and triggers are enabled |
| **"TOTP not valid"** | Re-extract TOTP secret from Microsoft Authenticator |

### Debug Logs

Pipeline logs show detailed steps:

✅ **Success Indicators:**
```
✅ Dependencies installed
✅ Playwright browsers installed
✅ Authentication file generated
✅ Changes committed
✅ Changes pushed successfully
```

❌ **Error Indicators:**
```
❌ Failed to install dependencies
❌ Authentication file not found
❌ Failed to push changes
```

---

## 🔒 Security Best Practices

### Secret Variables

✅ **DO:**
- Mark all credentials as **Secret** (padlock icon)
- Use variable groups for reusable secrets
- Rotate credentials regularly
- Use service principals when possible

❌ **DON'T:**
- Commit secrets to repository
- Display secrets in pipeline logs
- Share variable group access widely

### Git Configuration

Pipeline configures Git securely:
- Uses `--local` scope (repository level only)
- Identity: `d365-pipeline@azure.devops.com`
- No sensitive data in commit messages

---

## 📋 File Structure

```
totp-playwright/
├── auth/
│   └── D365AuthFile.json ← Auto-updated by pipeline
├── scripts/
│   └── refresh-auth-file.ps1 (Local refresh utility)
├── azure-pipelines.yml (Main test pipeline)
├── azure-pipelines-auth-refresh.yml ← NEW ✨
└── ... other files
```

---

## 🎯 Next Steps

1. **Push files to repository**
   ```powershell
   git add .
   git commit -m "setup: add auth refresh infrastructure"
   git push origin main
   ```

2. **Create pipeline in Azure DevOps**
   - Use `azure-pipelines-auth-refresh.yml`

3. **Set up secret variables**
   - Ensure `Playwright-Testing-Secrets` group is configured

4. **Grant permissions**
   - Approve on first pipeline run

5. **Monitor first scheduled run**
   - Check pipeline execution logs
   - Verify auth file was committed

---

## 📚 Additional Resources

- [Azure Pipelines Scheduled Triggers](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/triggers?view=azure-devops&tabs=yaml#scheduled-triggers)
- [Cron Expression Format](https://quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger-tutorial.html)
- [Git Configuration in Pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/scripts/git-commands?view=azure-devops&tabs=yaml)
- [Variable Groups Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml)

---

## 💡 Tips & Tricks

### Manual Trigger

Need to refresh auth immediately? Run manually:

1. Go to **Pipelines** → **D365 Auth Refresh**
2. Click **Run Pipeline**
3. Select branch and click **Run**

### Test Schedule

Test cron schedule before deploying:

```powershell
# Install crontab parser (Node.js)
npm install -g cron-parser

# Test your cron expression
cron-parser '0 2 * * *'
```

### View Git Commits

Check auth file update history:

```powershell
git log --oneline -- auth/D365AuthFile.json
```

---

## ✅ Verification Checklist

- [ ] `azure-pipelines-auth-refresh.yml` pushed to repository
- [ ] Pipeline created in Azure DevOps
- [ ] Secret variables configured in `Playwright-Testing-Secrets`
- [ ] Permissions granted on first run
- [ ] Scheduled triggers showing in pipeline configuration
- [ ] First manual test run successful
- [ ] Auth file committed to repository
- [ ] Scheduled run at next scheduled time confirmed

---

**Questions?** Check Azure DevOps pipeline logs for detailed error messages. 🚀
