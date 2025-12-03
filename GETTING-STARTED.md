# 🚀 Getting Started - Service Principal Authentication

## Two Setup Options

### Option A: Automated Setup (Recommended) ⚡

Run the PowerShell setup script:

```powershell
# From the project root directory
.\setup-service-principal.ps1
```

**What it does:**
- ✅ Checks Azure CLI installation
- ✅ Logs you into Azure
- ✅ Creates App Registration automatically
- ✅ Creates Service Principal
- ✅ Generates Client Secret
- ✅ Adds Dynamics 365 API permissions
- ✅ Provides all values for Azure DevOps

**Time: ~5 minutes**

### Option B: Manual Setup 📋

Follow the detailed guide:
1. Open `SETUP-APP-REGISTRATION.md` for complete step-by-step instructions
2. Use `QUICK-SETUP-CHECKLIST.md` as a quick reference

**Time: ~15-20 minutes**

---

## Quick Start (After Running Setup Script)

### 1. Grant Admin Consent in Azure Portal

```
🌐 https://portal.azure.com
   ↓
Azure Active Directory > App registrations > D365-Playwright-Automation-*
   ↓
API permissions > Grant admin consent for [Tenant]
   ↓
✅ Verify green checkmarks
```

### 2. Add Application User to D365

```
🌐 https://admin.powerplatform.microsoft.com
   ↓
Select your environment > Settings > Users + permissions
   ↓
Application users > + New app user
   ↓
Select your App Registration > Assign System Administrator role
   ↓
✅ Click Create
```

### 3. Update Azure DevOps Variable Group

**Go to:** Azure DevOps > Pipelines > Library > D365-Credentials

**Add these variables** (from script output):

| Variable | Example Value | Secret? |
|----------|--------------|---------|
| `AZURE_TENANT_ID` | `e4c980ba-90aa-4bb3-b931-847a929f8f3f` | No |
| `AZURE_CLIENT_ID` | `12345678-1234-1234-1234-123456789abc` | No |
| `AZURE_CLIENT_SECRET` | `xxx~xxxxxxxxxxxxxxxxxxxxxxxxxx` | ✅ **Yes** |
| `D365_URL` | `https://your-env.sandbox.operations.dynamics.com` | No |

**Important:** Click the lock icon 🔒 to mark `AZURE_CLIENT_SECRET` as secret!

### 4. Commit and Push Changes

```powershell
git add .
git commit -m "feat: Add Service Principal authentication for CI/CD"
git push origin main
```

### 5. Monitor Azure DevOps Pipeline

Watch for these log messages:

```
✅ Service Principal credentials detected - using App Registration authentication
🔑 Attempting Service Principal (App Registration) authentication...
🔐 Starting Service Principal authentication...
🔑 Requesting OAuth2 access token...
✅ Access token received
🌐 Navigating to D365 with Service Principal token...
✅ Service Principal authentication successful
```

**Expected result:**
- ✅ Test completes in ~30 seconds (not 180s timeout)
- ✅ No MFA/TOTP prompts
- ✅ No "Target page, context or browser has been closed" errors

---

## What's Different Now?

### Before (TOTP - Broken in CI):
```
Email → Password → TOTP → Stay signed in? → ❌ Browser closes → TIMEOUT
```

### After (Service Principal - Works in CI):
```
OAuth2 Token Request → Access Token → Navigate to D365 → ✅ AUTHENTICATED
```

---

## Local Development

**TOTP still works!** No changes needed for local development:

```powershell
# Use your existing .env file
npx playwright test tests/login-setup.spec.ts --project="🔐 Login Authentication"
```

The code automatically detects:
- **CI environment** → Uses Service Principal (if configured)
- **Local environment** → Uses TOTP authentication

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `unauthorized_client` | Grant admin consent in Azure Portal |
| `invalid_client` | Check Client ID and Secret in Variable Group |
| `invalid_resource` | Verify D365_URL is correct |
| Still redirecting to login | Add Application User to D365 with System Admin role |
| Permission denied | Assign security roles to Application User in D365 |

**Still stuck?** Check the detailed guide: `SETUP-APP-REGISTRATION.md`

---

## Files in This Project

| File | Purpose |
|------|---------|
| `setup-service-principal.ps1` | **START HERE** - Automated setup script |
| `QUICK-SETUP-CHECKLIST.md` | Quick reference checklist |
| `SETUP-APP-REGISTRATION.md` | Detailed setup guide with screenshots |
| `pages/ServicePrincipalAuth.ts` | Service Principal authentication logic |
| `pages/AuthenticationManager.ts` | Orchestrates authentication (TOTP + Service Principal) |
| `.env.example` | Environment variable template |
| `azure-pipelines.yml` | Updated pipeline with Service Principal support |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   AuthenticationManager                      │
│                                                              │
│  ┌────────────────────┐         ┌──────────────────────┐   │
│  │  CI Environment?   │────Yes──│ Service Principal    │   │
│  │  + Credentials?    │         │ (No browser needed)  │   │
│  └────────────────────┘         └──────────────────────┘   │
│           │                              ↓                   │
│          No                      OAuth2 Token → D365         │
│           │                                                  │
│           ↓                                                  │
│  ┌──────────────────┐                                       │
│  │ TOTP Auth        │                                       │
│  │ (Browser-based)  │                                       │
│  └──────────────────┘                                       │
│           ↓                                                  │
│  Email → Password → TOTP → D365                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

✅ **Run:** `.\setup-service-principal.ps1`  
✅ **Grant:** Admin consent in Azure Portal  
✅ **Add:** Application User to D365  
✅ **Update:** Azure DevOps Variable Group  
✅ **Test:** Push to Azure DevOps and monitor  

**Total time: ~25-30 minutes** ⏱️

**Result:** Reliable CI/CD authentication that just works! 🎉

---

## Support

- 📖 **Detailed Guide:** `SETUP-APP-REGISTRATION.md`
- ✅ **Quick Reference:** `QUICK-SETUP-CHECKLIST.md`
- 🔧 **Script:** `setup-service-principal.ps1`

Need help? Check the troubleshooting section in `SETUP-APP-REGISTRATION.md`
