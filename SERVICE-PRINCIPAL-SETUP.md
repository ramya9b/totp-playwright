# 🔐 Service Principal Setup for Microsoft Playwright Testing

## ✅ You're Right! Use Service Principal Instead of Access Token

Since you don't have access to Playwright Portal, use **Service Principal authentication** with Azure DevOps service connection.

---

## 📋 Step-by-Step Guide

### Step 1: Create App Registration in Azure Portal

1. **Open**: https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps

2. **Click**: `+ New registration`

3. **Fill in**:
   - **Name**: `PlaywrightTesting-ServicePrincipal`
   - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**: Leave empty

4. **Click**: `Register`

5. **✅ Copy these values** (you'll need them):
   - ✏️ **Application (client) ID**: `_________________`
   - ✏️ **Directory (tenant) ID**: `_________________`

---

### Step 2: Create Client Secret

1. **In the App Registration**, go to **`Certificates & secrets`**

2. **Click**: `+ New client secret`

3. **Fill in**:
   - **Description**: `Azure DevOps Pipeline`
   - **Expires**: `180 days (6 months)` or `Custom` (max 24 months)

4. **Click**: `Add`

5. **✅ IMMEDIATELY Copy the secret VALUE** (shown only once):
   - ✏️ **Client Secret Value**: `_________________`

⚠️ **WARNING**: Secret value is shown only once! If you miss it, you'll need to create a new one.

---

### Step 3: Find Your Playwright Workspace Resource ID

1. **Open**: https://portal.azure.com/

2. **Search for**: `Playwright Testing`

3. **Click** on your workspace (the one in East US)

4. **Go to**: `Properties` (left menu)

5. **Copy**:
   - ✏️ **Resource ID**: `/subscriptions/____________/resourceGroups/____________/providers/Microsoft.AzurePlaywrightService/accounts/____________`
   - ✏️ **Subscription ID**: `_________________`
   - ✏️ **Resource Group**: `_________________`

---

### Step 4: Assign Role to Service Principal

#### Option A: Using Azure Portal (Easier)

1. **In your Playwright workspace**, click **`Access control (IAM)`**

2. **Click**: `+ Add` → `Add role assignment`

3. **Role tab**:
   - Select: `Contributor`
   - Click: `Next`

4. **Members tab**:
   - Select: `User, group, or service principal`
   - Click: `+ Select members`
   - Search: `PlaywrightTesting-ServicePrincipal`
   - Click on it to select
   - Click: `Select`

5. **Review + assign**:
   - Click: `Review + assign`
   - Click: `Review + assign` again

#### Option B: Using PowerShell (if Portal doesn't work)

```powershell
# Replace these with your actual values
$servicePrincipalAppId = "YOUR_APP_ID_FROM_STEP_1"
$playwrightWorkspaceResourceId = "YOUR_RESOURCE_ID_FROM_STEP_3"

# Install Azure PowerShell if needed
# Install-Module -Name Az -Repository PSGallery -Force

# Login to Azure
Connect-AzAccount

# Assign Contributor role
New-AzRoleAssignment `
    -ApplicationId $servicePrincipalAppId `
    -RoleDefinitionName "Contributor" `
    -Scope $playwrightWorkspaceResourceId

Write-Host "✅ Role assigned successfully!" -ForegroundColor Green
```

---

### Step 5: Create Service Connection in Azure DevOps

1. **Open**: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_settings/adminservices

2. **Click**: `New service connection`

3. **Select**: `Azure Resource Manager`

4. **Authentication method**: Select **`Service principal (manual)`**

5. **Fill in** (use values from Steps 1-3):
   - **Environment**: `Azure Cloud`
   - **Scope Level**: `Subscription`
   - **Subscription ID**: (from Step 3)
   - **Subscription Name**: Your subscription name (e.g., "Visual Studio Enterprise")
   - **Service Principal Id**: (Application/Client ID from Step 1)
   - **Credential**: Select `Service principal key`
   - **Service Principal Key**: (Client Secret Value from Step 2)
   - **Tenant ID**: (from Step 1)

6. **Service connection name**: `Azure-Playwright-Testing`

7. **Security**:
   - ✅ Check: `Grant access permission to all pipelines`

8. **Click**: `Verify`

9. **If verification succeeds**, click: `Verify and save`

⚠️ If verification fails, double-check all IDs and the secret value.

---

### Step 6: Update Pipeline to Use Service Connection

1. **Open**: `azure-pipelines-mpt.yml`

2. **Ensure these settings**:
   ```yaml
   variables:
     PLAYWRIGHT_SERVICE_URL: 'wss://eastus.api.playwright.microsoft.com/playwrightworkspaces/03f9e658-c2b3-45a4-9689-0c639e6f99c0/browsers'
     D365_URL: 'https://avs-isv-puat.sandbox.operations.dynamics.com'
     USE_ACCESS_TOKEN: 'false'  # ← Make sure this is 'false'
   ```

3. **Verify the AzureCLI task** has the correct service connection name:
   ```yaml
   - task: AzureCLI@2
     displayName: 'Run Tests with Service Principal Auth'
     condition: eq(variables.USE_ACCESS_TOKEN, 'false')
     inputs:
       azureSubscription: 'Azure-Playwright-Testing'  # ← Your service connection name
   ```

---

### Step 7: Switch to MPT Pipeline and Run

```powershell
# Backup current pipeline
Copy-Item azure-pipelines.yml azure-pipelines.backup.yml

# Switch to MPT pipeline
Copy-Item azure-pipelines-mpt.yml azure-pipelines.yml

# Commit and push
git add azure-pipelines.yml
git commit -m "Enable Microsoft Playwright Testing with Service Principal"
git push origin main
```

---

## 🎯 Quick Checklist

- [ ] App registration created with Client ID and Tenant ID
- [ ] Client secret created and saved
- [ ] Playwright workspace Resource ID found
- [ ] Contributor role assigned to service principal
- [ ] Service connection created in Azure DevOps
- [ ] Service connection verified successfully
- [ ] Pipeline updated with USE_ACCESS_TOKEN='false'
- [ ] Pipeline switched and pushed

---

## 🔍 Troubleshooting

### "Failed to query service connection API"
- Make sure you copied the Client Secret VALUE (not the Secret ID)
- Check that Tenant ID and Client ID are correct

### "Insufficient permissions"
- Verify the service principal has Contributor role on the Playwright workspace
- Wait 5 minutes after role assignment for permissions to propagate

### "Could not authenticate with the service"
- Ensure PLAYWRIGHT_SERVICE_URL is correct
- Verify service connection name matches in pipeline
- Check that USE_ACCESS_TOKEN is set to 'false'

---

## 📞 Need Help?

If any step fails, let me know:
1. Which step you're on
2. The exact error message
3. Screenshot if helpful

Let's get this working! 🚀
