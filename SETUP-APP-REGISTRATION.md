# Azure App Registration Setup Guide for D365 Automation

## Problem Statement

Microsoft's interactive authentication with MFA/TOTP fails in Azure DevOps CI/CD pipelines because:
1. Microsoft closes the browser context after authentication attempts (security measure)
2. The reprocess/verification screen appears but submit buttons don't work in headless automation
3. Error: `Target page, context or browser has been closed`

## Solution: Service Principal Authentication

Use Azure AD App Registration with **Client Credentials Flow** for non-interactive authentication in CI/CD.

---

## Prerequisites

- Azure Active Directory admin access
- D365 environment access
- Azure DevOps pipeline admin access

---

## Step 1: Create Azure AD App Registration

### 1.1 Navigate to Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **+ New registration**

### 1.2 Register Application
- **Name**: `D365-Playwright-Automation` (or your preferred name)
- **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
- **Redirect URI**: Leave blank (not needed for client credentials flow)
- Click **Register**

### 1.3 Note the Application Details
After registration, copy these values (you'll need them later):
- **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## Step 2: Create Client Secret

### 2.1 Generate Secret
1. In your App Registration, go to **Certificates & secrets**
2. Click **+ New client secret**
3. **Description**: `Azure DevOps Pipeline Secret`
4. **Expires**: Select expiration period (e.g., 12 months, 24 months)
5. Click **Add**

### 2.2 Copy Secret Value
⚠️ **IMPORTANT**: Copy the **Value** immediately - it won't be shown again!
- **Client Secret Value**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 3: Grant API Permissions

### 3.1 Add Dynamics 365 Permissions
1. In your App Registration, go to **API permissions**
2. Click **+ Add a permission**
3. Select **APIs my organization uses**
4. Search for **Dynamics 365** or **Common Data Service**
5. Select **Dynamics CRM**

### 3.2 Configure Permissions
Select the following **Delegated permissions**:
- ✅ `user_impersonation` - Access Dynamics 365 as organization users

### 3.3 Grant Admin Consent
1. Click **Grant admin consent for [Your Tenant Name]**
2. Confirm by clicking **Yes**
3. Verify status shows green checkmarks

---

## Step 4: Add to Azure DevOps Variable Group

### 4.1 Navigate to Variable Groups
1. Go to your Azure DevOps project
2. Navigate to **Pipelines** > **Library**
3. Find or create **D365-Credentials** Variable Group

### 4.2 Add Service Principal Variables

Add the following variables:

| Variable Name | Value | Secret? | Example |
|--------------|-------|---------|---------|
| `AZURE_TENANT_ID` | Your Tenant ID | No | `e4c980ba-90aa-4bb3-b931-847a929f8f3f` |
| `AZURE_CLIENT_ID` | Your Application (Client) ID | No | `12345678-1234-1234-1234-123456789abc` |
| `AZURE_CLIENT_SECRET` | Your Client Secret Value | ✅ **Yes** | `xxx~xxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `D365_URL` | Your D365 Environment URL | No | `https://your-env.sandbox.operations.dynamics.com` |

### 4.3 Keep Existing TOTP Variables (Optional)
For local development fallback, keep:
- `M365_USERNAME`
- `M365_PASSWORD`
- `TOTP_SECRET`

---

## Step 5: Update Azure DevOps Pipeline

The pipeline (`azure-pipelines.yml`) has been updated to:
1. ✅ Check for Service Principal credentials first
2. ✅ Use Service Principal auth in CI if credentials are available
3. ✅ Fall back to TOTP auth if Service Principal fails or not configured
4. ✅ Create `.env` file with appropriate credentials

**No manual pipeline changes needed** - the updated YAML is ready!

---

## Step 6: Test the Setup

### 6.1 Local Testing (TOTP)
```powershell
# Ensure .env has TOTP credentials
npx playwright test tests/login-setup.spec.ts --project="🔐 Login Authentication"
```

### 6.2 CI Testing (Service Principal)
1. Commit and push changes to Azure DevOps
2. Monitor pipeline execution
3. Check logs for: `✅ Running in CI mode with Service Principal authentication`
4. Verify authentication succeeds without MFA prompts

---

## Step 7: Verify Authentication

### Expected Log Output (Service Principal):
```
✅ Running in CI mode with Service Principal authentication
🔐 Starting Service Principal authentication...
📋 Tenant ID: e4c980ba-xxxx-xxxx-xxxx-xxxxxxxxxxxx
📋 Client ID: 12345678-xxxx...
🔑 Requesting OAuth2 access token...
📡 Token endpoint: https://login.microsoftonline.com/.../oauth2/v2.0/token
📡 Scope: https://dynamics.microsoft.com/.default
✅ Access token received
🌐 Navigating to D365 with Service Principal token...
✅ Authorization header injected
✅ Successfully authenticated - on D365 domain
✅ Service Principal authentication successful
```

---

## Troubleshooting

### Issue: "unauthorized_client" Error
**Solution**: Ensure API permissions are granted and admin consent is provided

### Issue: "invalid_client" Error
**Solution**: Verify Client ID and Client Secret are correct in Variable Group

### Issue: "invalid_resource" Error
**Solution**: Check D365_URL is correct and accessible

### Issue: Token obtained but still redirected to login
**Solution**: 
1. Verify Service Principal has access to D365 environment
2. Add Service Principal as user in D365 (System Administrator role)
3. Check conditional access policies in Azure AD

---

## Adding Service Principal to D365

### Option 1: Via Power Platform Admin Center
1. Go to [Power Platform Admin Center](https://admin.powerplatform.microsoft.com)
2. Select your environment
3. Settings > Users + permissions > Application users
4. Click **+ New app user**
5. Select your App Registration
6. Assign **System Administrator** security role
7. Click **Create**

### Option 2: Via D365 (if you have System Admin access)
1. Go to Settings > Security > Users
2. Switch view to **Application Users**
3. Click **+ New**
4. Select your App Registration from Azure AD
5. Assign appropriate security roles
6. Save

---

## Security Best Practices

1. ✅ **Rotate Secrets Regularly**: Set secret expiration and rotate before expiry
2. ✅ **Least Privilege**: Grant only necessary permissions
3. ✅ **Monitor Usage**: Review sign-in logs in Azure AD
4. ✅ **Secure Variable Group**: Mark secrets as "secret" in Azure DevOps
5. ✅ **Audit Access**: Regularly review who has access to Variable Group
6. ✅ **Use Managed Identities**: Consider Azure Managed Identities for production

---

## Architecture Comparison

### Before (TOTP Authentication)
```
Azure DevOps → Headless Browser → Microsoft Login
                    ↓
                Email Entry
                    ↓
                Password Entry
                    ↓
            MFA/TOTP Prompt ❌ (Microsoft skips in CI)
                    ↓
        Stay Signed In? → Reprocess Screen ❌ (Browser closes)
                    ↓
                TIMEOUT
```

### After (Service Principal Authentication)
```
Azure DevOps → Service Principal App Registration
                    ↓
            OAuth2 Client Credentials Flow
                    ↓
            Access Token (no interaction)
                    ↓
        Inject Token → Navigate to D365 ✅
                    ↓
            AUTHENTICATED
```

---

## Cost Considerations

- ✅ **Azure AD App Registration**: Free (included with Azure AD)
- ✅ **Client Credentials Flow**: No additional cost
- ✅ **Azure DevOps Pipeline**: Uses existing pipeline minutes

---

## Next Steps

1. ✅ Create App Registration (15 minutes)
2. ✅ Configure permissions and secrets (10 minutes)
3. ✅ Update Variable Group (5 minutes)
4. ✅ Test in Azure DevOps pipeline (10 minutes)
5. ✅ Monitor and validate (ongoing)

**Total Setup Time: ~40 minutes**

---

## Support & Resources

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Dynamics 365 Authentication](https://docs.microsoft.com/en-us/powerapps/developer/data-platform/authenticate-oauth)
- [Azure DevOps Variable Groups](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups)

---

## Summary

✅ Service Principal authentication bypasses interactive MFA  
✅ Works in headless CI/CD environments  
✅ Secure and Microsoft-recommended approach  
✅ Fallback to TOTP for local development  
✅ No browser context closure issues  

**Ready to implement!** 🚀
