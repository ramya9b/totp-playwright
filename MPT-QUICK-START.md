# 🚀 Quick Setup: Microsoft Playwright Testing

## ✅ What's Already Done

1. ✅ Workspace endpoint configured: `wss://eastus.api.playwright.microsoft.com/...`
2. ✅ Package installed: `@azure/microsoft-playwright-testing`
3. ✅ Service config created: `playwright.service.config.ts`
4. ✅ Pipeline ready: `azure-pipelines-mpt.yml`

---

## 📋 Only 2 Steps Left!

### Step 1: Create Azure Service Connection (2 Minutes)

This allows Azure DevOps to authenticate with Microsoft Playwright Testing.

1. **Go to**: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_settings/adminservices

2. **Click**: "New service connection"

3. **Select**: "Azure Resource Manager"

4. **Authentication method**: "Service principal (automatic)"

5. **Scope level**: "Subscription"

6. **Select**:
   - Your Azure subscription
   - Resource group: (the one with your Playwright Testing workspace)

7. **Service connection name**: `Azure-Playwright-Testing-Connection`

8. **Check**: ✅ "Grant access permission to all pipelines"

9. **Click**: "Save"

---

### Step 2: Upload Session File (If Not Already Done)

1. **Go to**: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_library?itemType=SecureFiles

2. **Check if** `D365AuthFile.json` exists
   - ✅ If yes → Skip to Step 3
   - ❌ If no → Click "+ Secure file" and upload `auth/D365AuthFile.json`

---

### Step 3: Switch to Microsoft Playwright Testing Pipeline

```powershell
# Backup current pipeline
Copy-Item azure-pipelines.yml azure-pipelines-old.yml

# Switch to MPT pipeline
Copy-Item azure-pipelines-mpt.yml azure-pipelines.yml

# Commit and push
git add azure-pipelines.yml azure-pipelines-mpt.yml azure-pipelines-old.yml
git commit -m "Enable Microsoft Playwright Testing with 20 parallel workers"
git push origin main
```

---

## 🎯 What Happens Next

1. **Pipeline triggers** on push to main
2. **Downloads** D365AuthFile.json
3. **Authenticates** with Microsoft Playwright Testing using service principal
4. **Runs tests** across 20 parallel cloud-hosted browsers
5. **Publishes results** to Playwright Portal

**Expected time**: 5-10 minutes (vs 30+ minutes before)

---

## 📊 View Results

After pipeline completes:

1. **Go to**: https://playwright.microsoft.com/
2. **Sign in** with your Azure account
3. **Select workspace**: Your workspace
4. **View**:
   - Test run status and duration
   - Individual test results
   - Screenshots, videos, traces
   - Network logs and console output
   - CI build details and commit ID

---

## 🔍 Troubleshooting

### "Could not authenticate with the service"
→ Make sure service connection is created and named exactly: `Azure-Playwright-Testing-Connection`

### "Service connection not found"
→ Check that service connection has access to the resource group with Playwright Testing workspace

### "Session file not found"
→ Upload `D365AuthFile.json` to Azure DevOps Secure Files

### Tests fail with login screen
→ Session expired, generate new one:
```powershell
# Open Chrome with debugging
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" "-remote-debugging-port=9222 https://avs-isv-puat.sandbox.operations.dynamics.com"

# After logging in, run:
node extract-session-from-chrome.js
```

---

## 💰 Cost Estimate

- **Free tier**: 1,000 test minutes/month
- **Your usage**: ~10 minutes per run × 20 workers = 200 test minutes per run
- **Free runs**: 5 runs/month on free tier
- **After free tier**: ~$1 per run

**Tip**: Start with fewer workers (e.g., `--workers=5`) to conserve free minutes while testing.

---

## ⚡ Quick Commands

```powershell
# Switch to MPT pipeline
Copy-Item azure-pipelines-mpt.yml azure-pipelines.yml && git add . && git commit -m "Enable MPT" && git push

# Open service connections
Start-Process "https://dev.azure.com/RSATwithAzure/PlaywrightTests/_settings/adminservices"

# Open secure files
Start-Process "https://dev.azure.com/RSATwithAzure/PlaywrightTests/_library?itemType=SecureFiles"

# Open Playwright portal
Start-Process "https://playwright.microsoft.com/"

# View pipeline runs
Start-Process "https://dev.azure.com/RSATwithAzure/PlaywrightTests/_build"
```

---

**Ready?** Just create the service connection and switch the pipeline! 🚀
