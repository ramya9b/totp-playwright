# 🔐 Create Service Connection with Managed Identity

## Option 1: Workload Identity Federation (Recommended)

### Step 1: Create Service Connection with Manual Configuration

1. **Go to**: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_settings/adminservices

2. **Click**: "New service connection"

3. **Select**: "Azure Resource Manager"

4. **Authentication method**: Select **"Workload Identity federation (manual)"**

5. **Fill in details**:
   - **Service connection name**: `Azure-Playwright-Testing-Connection`
   - **Subscription ID**: Your Azure subscription ID
   - **Subscription name**: Your subscription name

6. **Click**: "Next"

7. **Copy the values shown** (you'll need these in Azure Portal):
   - Issuer
   - Subject identifier

### Step 2: Create App Registration in Azure Portal

1. **Go to Azure Portal**: https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps

2. **Click**: "New registration"

3. **Fill in**:
   - **Name**: `PlaywrightTesting-ServiceConnection`
   - **Supported account types**: "Accounts in this organizational directory only"
   - **Redirect URI**: Leave empty

4. **Click**: "Register"

5. **Copy** the following values:
   - **Application (client) ID**
   - **Directory (tenant) ID**

### Step 3: Configure Federated Credentials

1. **In the App Registration**, go to **"Certificates & secrets"**

2. **Click**: "Federated credentials" tab

3. **Click**: "Add credential"

4. **Select scenario**: "Other issuer"

5. **Fill in** (use values from Step 1):
   - **Issuer**: (paste from Azure DevOps)
   - **Subject identifier**: (paste from Azure DevOps)
   - **Name**: `AzureDevOps-PlaywrightTesting`

6. **Click**: "Add"

### Step 4: Assign Role to Service Principal

1. **Go to your Playwright Testing workspace** in Azure Portal

2. **Click**: "Access control (IAM)" in left menu

3. **Click**: "Add" → "Add role assignment"

4. **Select role**: "Contributor"

5. **Click**: "Next"

6. **Assign access to**: "User, group, or service principal"

7. **Click**: "+ Select members"

8. **Search for**: `PlaywrightTesting-ServiceConnection`

9. **Select** it and click "Select"

10. **Click**: "Review + assign"

### Step 5: Complete Service Connection in Azure DevOps

1. **Go back to Azure DevOps** (service connection creation page)

2. **Fill in** (values from Step 2):
   - **Service Principal Id**: Application (client) ID
   - **Tenant ID**: Directory (tenant) ID

3. **Check**: ✅ "Grant access permission to all pipelines"

4. **Click**: "Verify and save"

---

## Option 2: Use Access Token (Quick but Less Secure)

If the above is too complex, you can use an access token temporarily:

### Step 1: Enable Access Token in Playwright Testing

1. **Go to**: https://playwright.microsoft.com/
2. **Select your workspace**
3. **Settings** → "Access tokens"
4. **Click**: "Generate new token"
5. **Copy** the token

### Step 2: Store Token in Azure DevOps

1. **Go to**: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_settings/variablelibrary

2. **Create new variable group**: `Playwright-Testing-Secrets`

3. **Add variable**:
   - Name: `PLAYWRIGHT_SERVICE_ACCESS_TOKEN`
   - Value: (paste the token)
   - Click lock icon to make it secret

4. **Save**

### Step 3: Update Pipeline to Use Access Token

Update `azure-pipelines-mpt.yml`:

```yaml
variables:
  - group: Playwright-Testing-Secrets
  - name: PLAYWRIGHT_SERVICE_URL
    value: 'wss://eastus.api.playwright.microsoft.com/...'
```

And in the AzureCLI@2 task, add:

```yaml
env:
  PLAYWRIGHT_SERVICE_ACCESS_TOKEN: $(PLAYWRIGHT_SERVICE_ACCESS_TOKEN)
```

---

## Which Option Should You Choose?

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **Workload Identity** | More secure, no secrets | Complex setup | Production |
| **Access Token** | Quick setup | Token can expire, less secure | Testing/Development |

---

## 🚀 Quick Start: Use Access Token First

For quick testing, I recommend starting with **Option 2 (Access Token)**:

1. Generate token from Playwright portal
2. Store in Azure DevOps variable group
3. Update pipeline (I can do this for you)
4. Test the pipeline
5. Later migrate to Workload Identity for production

**Which option do you want to proceed with?**
