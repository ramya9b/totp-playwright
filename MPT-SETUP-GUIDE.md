# 🚀 Microsoft Playwright Testing Setup Guide

## ✅ What We've Configured

1. ✅ Installed `@azure/microsoft-playwright-testing` package
2. ✅ Created `playwright.service.config.ts` for cloud testing
3. ✅ Updated `playwright.config.ts` with required artifacts
4. ✅ Created Azure Pipeline: `azure-pipelines-mpt.yml`

---

## 📋 Next Steps (Required Setup)

### Step 1: Create Microsoft Playwright Testing Workspace

1. **Go to Azure Portal**: https://portal.azure.com
2. **Search for**: "Microsoft Playwright Testing"
3. **Click**: "Create"
4. **Fill in details**:
   - Subscription: Select your subscription
   - Resource Group: Create new or use existing
   - Workspace Name: `d365-playwright-testing`
   - Region: Select closest region (e.g., East US)
5. **Click**: "Review + Create"
6. **Wait** for deployment to complete

### Step 2: Get Service Endpoint URL

1. **Go to Playwright Portal**: https://playwright.microsoft.com/
2. **Sign in** with your Azure account
3. **Select your workspace**: `d365-playwright-testing`
4. **Click**: "View setup guide"
5. **Copy** the endpoint URL (looks like: `https://eastus.api.playwright.microsoft.com/api/v1/workspaces/...`)

### Step 3: Store Endpoint in Azure DevOps

1. **Go to**: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_settings/
2. **Navigate to**: Pipelines → Library
3. **Click**: "+ Variable group"
4. **Name**: `Playwright-Testing-Config`
5. **Add variable**:
   - Name: `PLAYWRIGHT_SERVICE_URL`
   - Value: Paste the endpoint URL you copied
   - Click the lock icon to make it secret
6. **Save**

### Step 4: Create Azure Service Connection

1. **Go to**: Project Settings → Service connections
2. **Click**: "New service connection"
3. **Select**: "Azure Resource Manager"
4. **Authentication method**: "Service principal (automatic)"
5. **Scope**: Subscription
6. **Select your subscription**
7. **Resource group**: Select the one with your Playwright Testing workspace
8. **Service connection name**: `Azure-Playwright-Testing-Connection`
9. **Grant access permission to all pipelines**: ✅ Check this
10. **Save**

### Step 5: Update Pipeline Configuration

Open `azure-pipelines-mpt.yml` and update:

```yaml
variables:
  - group: Playwright-Testing-Config  # Add this line
  - name: D365_URL
    value: 'https://avs-isv-puat.sandbox.operations.dynamics.com'
```

And verify the service connection name matches:

```yaml
azureSubscription: 'Azure-Playwright-Testing-Connection'
```

### Step 6: Upload Session File (If not already done)

1. **Go to**: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_library?itemType=SecureFiles
2. **Click**: "+ Secure file"
3. **Upload**: `auth/D365AuthFile.json`

### Step 7: Switch to Microsoft Playwright Testing Pipeline

```powershell
# Backup current pipeline
Copy-Item azure-pipelines.yml azure-pipelines-backup.yml

# Switch to Microsoft Playwright Testing pipeline
Copy-Item azure-pipelines-mpt.yml azure-pipelines.yml

# Commit changes
git add .
git commit -m "Enable Microsoft Playwright Testing"
git push origin main
```

---

## 🎯 Expected Benefits

| Feature | Before | After (MPT) |
|---------|--------|-------------|
| **Parallel Workers** | 1-4 | 20 |
| **Execution Time** | 30+ minutes | 5-10 minutes |
| **Browser Management** | Manual install | Cloud-hosted |
| **Test Results** | Basic Azure DevOps | Rich Playwright Portal |
| **Debugging** | Limited | Trace Viewer + Artifacts |
| **Cost** | Free tier | Free trial (1000 test minutes) |

---

## 📊 Test Locally Before Pipeline

Test the service configuration locally:

```powershell
# Set service URL temporarily
$env:PLAYWRIGHT_SERVICE_URL = "YOUR_ENDPOINT_URL_HERE"

# Run single test with service
npx playwright test tests/login-setup.spec.ts -c playwright.service.config.ts

# Run all tests with 20 workers
npx playwright test -c playwright.service.config.ts --workers=20
```

---

## 🔍 Troubleshooting

### "Service URL not found"
→ Make sure `PLAYWRIGHT_SERVICE_URL` variable is set in Azure DevOps Library

### "Authentication failed"
→ Verify service connection has access to the resource group with Playwright Testing workspace

### "No tests found"
→ Check that `playwright.service.config.ts` imports from `./playwright.config`

### "Session expired"
→ Re-upload fresh `D365AuthFile.json` to Secure Files

---

## 📈 View Results in Playwright Portal

After pipeline runs:

1. **Go to**: https://playwright.microsoft.com/
2. **Select your workspace**
3. **View**:
   - Test run status
   - Individual test results
   - Screenshots, videos, traces
   - Timeline and network logs
   - CI build details and commit ID

---

## 💰 Pricing (After Free Trial)

- **Free tier**: 1,000 test minutes/month
- **After free tier**: Pay-as-you-go
- **Estimated**: ~$0.005 per test minute

With 20 parallel workers and ~10 minute runs:
- Cost per run: ~$1.00
- 100 runs/month: ~$100

---

## ⚠️ Important Notes

1. **Service Deprecation**: Microsoft Playwright Testing will be retired on **March 8, 2026**
2. **Migration Path**: Migrate to Azure App Testing (new service)
3. **Free Trial**: Use wisely to avoid exhausting free test minutes
4. **Start Small**: Run 1-2 tests first, then scale up

---

## 🚀 Quick Start Commands

```powershell
# Test service configuration locally
$env:PLAYWRIGHT_SERVICE_URL = "YOUR_URL"
npx playwright test -c playwright.service.config.ts --workers=5

# Switch pipeline
Copy-Item azure-pipelines-mpt.yml azure-pipelines.yml
git add . && git commit -m "Enable MPT" && git push

# View results
Start-Process "https://playwright.microsoft.com/"
```

---

**Ready to enable Microsoft Playwright Testing?** Follow the steps above! 🎯
