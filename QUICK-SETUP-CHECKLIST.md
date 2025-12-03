# Service Principal Authentication - Quick Setup Checklist

## ✅ Azure Portal Steps (15 minutes)

### 1. Create App Registration
- [ ] Go to Azure Portal > Azure AD > App registrations > New registration
- [ ] Name: `D365-Playwright-Automation`
- [ ] Single tenant
- [ ] Register

**Copy these values:**
```
Tenant ID: _______________________________________
Client ID: _______________________________________
```

### 2. Create Client Secret
- [ ] Go to Certificates & secrets > New client secret
- [ ] Description: `Azure DevOps Pipeline Secret`
- [ ] Expiry: 12 months
- [ ] Add and copy value immediately!

**Copy this value:**
```
Client Secret: ___________________________________
```

### 3. Grant API Permissions
- [ ] Go to API permissions > Add permission
- [ ] Select "APIs my organization uses"
- [ ] Search for "Dynamics 365" or "Common Data Service"
- [ ] Select "Dynamics CRM"
- [ ] Check `user_impersonation`
- [ ] Grant admin consent
- [ ] Verify green checkmarks

### 4. Add App User to D365
- [ ] Go to Power Platform Admin Center
- [ ] Select environment > Settings > Users + permissions > Application users
- [ ] New app user > Select your App Registration
- [ ] Assign **System Administrator** role
- [ ] Create

---

## ✅ Azure DevOps Steps (5 minutes)

### 5. Update Variable Group
- [ ] Go to Pipelines > Library > D365-Credentials
- [ ] Add or update these variables:

| Variable | Value | Secret? |
|----------|-------|---------|
| `AZURE_TENANT_ID` | [Your Tenant ID] | No |
| `AZURE_CLIENT_ID` | [Your Client ID] | No |
| `AZURE_CLIENT_SECRET` | [Your Secret Value] | ✅ Yes |
| `D365_URL` | [Your D365 URL] | No |

- [ ] Save Variable Group
- [ ] Verify Variable Group is linked to pipeline

---

## ✅ Code Changes (Already Done!)

- [x] ✅ Created `ServicePrincipalAuth.ts` 
- [x] ✅ Updated `AuthenticationManager.ts`
- [x] ✅ Updated `azure-pipelines.yml`
- [x] ✅ Created `.env.example`

---

## ✅ Test & Validate

### Local Test (TOTP - should still work)
```powershell
npx playwright test tests/login-setup.spec.ts --project="🔐 Login Authentication"
```

### CI Test (Service Principal - after setup)
```powershell
git add .
git commit -m "feat: Add Service Principal authentication for CI/CD"
git push origin main
```

- [ ] Monitor pipeline in Azure DevOps
- [ ] Look for: `✅ Service Principal credentials detected`
- [ ] Verify: `✅ Service Principal authentication successful`
- [ ] Check: No MFA/TOTP prompts
- [ ] Confirm: Test passes within 30 seconds (not 180s timeout)

---

## ✅ Verification Checklist

Authentication should show:
```
🔑 Attempting Service Principal (App Registration) authentication...
🔐 Starting Service Principal authentication...
🔑 Requesting OAuth2 access token...
✅ Access token received
🌐 Navigating to D365 with Service Principal token...
✅ Service Principal authentication successful
```

**NOT**:
```
⚠️ Login redirect timeout...
❌ Target page, context or browser has been closed
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| `unauthorized_client` | Grant admin consent for API permissions |
| `invalid_client` | Check Client ID and Secret in Variable Group |
| `invalid_resource` | Verify D365_URL is correct |
| Still redirecting to login | Add Service Principal as Application User in D365 with System Admin role |
| Token obtained but access denied | Assign security roles to Application User in D365 |

---

## 📋 Variables Summary

**For CI/CD (Service Principal):**
```env
AZURE_TENANT_ID=your-tenant-id-guid
AZURE_CLIENT_ID=your-client-id-guid
AZURE_CLIENT_SECRET=your-client-secret-value
D365_URL=https://your-env.sandbox.operations.dynamics.com
CI=true  # Auto-set in Azure DevOps
```

**For Local Dev (TOTP) - Optional Fallback:**
```env
M365_USERNAME=your-email@domain.com
M365_PASSWORD=your-password
TOTP_SECRET=your-totp-secret
D365_URL=https://your-env.sandbox.operations.dynamics.com
CI=false  # Default for local
```

---

## ⏱️ Time Estimate

- Azure Portal Setup: **15 minutes**
- Azure DevOps Setup: **5 minutes**
- First Pipeline Run: **5 minutes**
- **Total: ~25 minutes**

---

## 📞 Need Help?

1. Check `SETUP-APP-REGISTRATION.md` for detailed steps
2. Review Azure DevOps pipeline logs
3. Check screenshots in `test-results/` artifact
4. Verify all variables in D365-Credentials Variable Group

---

**Status: Ready to implement! 🚀**

Once complete, your CI/CD authentication will:
- ✅ Skip interactive MFA/TOTP
- ✅ Complete in <30 seconds (not 180s timeout)
- ✅ No browser context closure errors
- ✅ Work reliably in headless mode
