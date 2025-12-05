# 🔐 Microsoft Playwright Testing - Authentication Setup

## ⚠️ Current Issue

You have the access token in `.env`, but authentication is failing because:

1. Access token authentication needs to be **enabled in the workspace**
2. OR you need to use **Azure CLI / Entra ID authentication** (recommended)

---

## ✅ Solution 1: Enable Access Token Auth in Workspace (Quick)

### Steps:

1. **Open your Playwright workspace** in Azure Portal:
   - https://portal.azure.com/
   - Search for "Playwright Testing"
   - Click on your workspace (East US)

2. **Enable access token authentication**:
   - Go to **Settings** → **Authentication**
   - Enable **"Access token authentication"**
   - Save changes

3. **Verify your token** in `.env`:
   ```env
   PLAYWRIGHT_SERVICE_ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6...
   ```

4. **Run tests**:
   ```powershell
   npx playwright test -c playwright.service.config.ts
   ```

📚 **Documentation**: https://aka.ms/mpt/access-token

---

## ✅ Solution 2: Use Azure CLI / Entra ID (Recommended)

### Why Recommended?
- ✅ More secure (no long-lived tokens)
- ✅ Automatic token refresh
- ✅ Better for team environments

### Steps:

#### 1. Fix Azure CLI Installation

Azure CLI was just reinstalled but needs a **new terminal**:

```powershell
# Close this terminal/VS Code and reopen
# OR open a NEW PowerShell window
```

#### 2. Login to Azure

In the **new terminal**:

```powershell
# Login to Azure
az login

# If you're in multiple tenants, specify yours:
az login --tenant e4c980ba-90aa-4bb3-b931-847a929f8f3f

# Verify login
az account show
```

#### 3. Run Tests

```powershell
# Now tests will use your Azure identity
npx playwright test -c playwright.service.config.ts
```

#### 4. Remove Access Token (Optional)

Once Azure CLI works, you can remove the access token from `.env` for better security.

---

## 🚀 Quick Commands

### Check Azure CLI Status
```powershell
az --version
az account show
```

### Test Authentication
```powershell
# Run one test to verify
npx playwright test tests/login.spec.ts -c playwright.service.config.ts --headed
```

### View Test Results
After successful run, view results at:
- https://playwright.microsoft.com/

---

## 🔍 Troubleshooting

### "Could not authenticate with the service"

**Cause**: Neither access token auth is enabled NOR Azure CLI is logged in

**Fix**:
1. Complete Solution 1 (enable access token in workspace)
2. OR complete Solution 2 (fix Azure CLI and login)

### "DLL load failed while importing win32file"

**Cause**: Azure CLI installation issue

**Fix**:
1. Close VS Code completely
2. Open new PowerShell as Administrator
3. Run: `az login`

### "Access token expired"

**Cause**: Token in `.env` is old

**Fix**:
1. Go to Azure Portal → Playwright workspace
2. Settings → Access tokens
3. Generate new token
4. Replace in `.env`

---

## 📋 Next Steps

### For Local Development:
✅ Use Azure CLI (Solution 2) - Restart terminal first

### For CI/CD Pipeline:
✅ Use Service Principal (as configured in `azure-pipelines-mpt.yml`)

The pipeline already has correct authentication setup via service connection!

---

## 🎯 Recommendation

**Do this NOW:**

1. **Close VS Code** completely
2. **Reopen VS Code**
3. **Run**: `az login`
4. **Test**: `npx playwright test -c playwright.service.config.ts`

This is faster than enabling access token auth in the portal! 🚀
