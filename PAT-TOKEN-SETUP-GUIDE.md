# 🚀 Complete Guide: Automated Pipeline Permission Authorization

## **Problem**
Your scheduled pipelines can't run because they don't have permission to access:
- ✓ Variable Groups (`Playwright-Testing-Secrets_totp`, `Playwright-Testing-Secrets`)
- ✓ Secure Files (`D365AuthFile.json`)

## **Solution Overview**
Instead of manually clicking "Permit" in Azure Pipelines UI, use an automated script that requires just:
1. **Azure DevOps PAT Token** (5 minutes to create)
2. **Run the authorization script** (2 minutes to execute)

---

## **Step 1: Create Your PAT Token (5 minutes)**

### Why do you need a PAT?
- **PAT = Personal Access Token** for Azure DevOps/Pipelines API
- Different from your Azure AD or D365 credentials
- Allows scripts to authenticate to Azure Pipelines

### How to Create:

1. **Open this link in your browser:**
   
   **Try one of these URLs:**
   ```
   Option A: https://dev.azure.com/RSATwithAzure/_usersSettings/tokens
   Option B: https://dev.azure.com/RSATwithAzure/_settings/tokens
   Option C: https://dev.azure.com/RSATwithAzure/user/tokens
   ```
   
   **Or navigate manually:**
   1. Go to https://dev.azure.com/RSATwithAzure
   2. Click on your **profile icon** (top-right corner)
   3. Select **"Personal access tokens"** or **"User Settings"**
   4. Look for **"Tokens"** or **"Personal Access Tokens"**

2. **Click the blue "New Token" button**

3. **Fill in the form:**
   ```
   Name: Playwright-Pipeline-Auth
   Organization: RSATwithAzure (select from dropdown)
   Expiration: Custom defined → Set to 1 year
   ```

4. **Select Scopes** - Check these 3 items:
   ```
   ☑ Build
     ☑ Read & execute
   ☑ Variable Groups
     ☑ Read, create & manage
   ☑ Secure files
     ☑ Read
   ```

5. **Click "Create Token"**

6. **⚠️ IMPORTANT: Copy the token immediately**
   - You'll see it in a blue highlighted box
   - Copy it NOW - it disappears after you close the dialog
   - You cannot retrieve it later if you close without copying

   Example token format:
   ```
   j7al2k3m5n9p0q2r4s6t8u0v2w4x6y8z
   ```

---

## **Step 2: Set Up Environment Variable**

Open PowerShell and run ONE of these commands:

### **Option A: Using the Quick Setup Script (Easiest)**
```powershell
cd C:\Users\RamyaBIN\totp-playwright
.\quick-setup-pat.ps1
```
Then paste your token when prompted.

### **Option B: Direct Command**
```powershell
[Environment]::SetEnvironmentVariable('AZURE_DEVOPS_PAT', 'paste-your-token-here', 'User')
```

Replace `'paste-your-token-here'` with your actual token.

### **Option C: Using PowerShell Profile (Advanced)**
Add to your `$PROFILE`:
```powershell
$env:AZURE_DEVOPS_PAT = "your-token-here"
```

---

## **Step 3: Close and Reopen PowerShell**

⚠️ **CRITICAL**: After setting the environment variable:
1. **Close the current PowerShell window**
2. **Open a NEW PowerShell window** 
3. This ensures the environment variable is loaded

---

## **Step 4: Run Authorization Script**

```powershell
cd C:\Users\RamyaBIN\totp-playwright
.\authorize-pipeline-resources.ps1
```

### **Expected Success Output:**
```
╔════════════════════════════════════════════════════════════════════════════╗
║       Azure Pipelines Resource Authorization Script                       ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 Configuration:
   Organization: RSATwithAzure
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
```

---

## **Step 5: Verify Everything Works**

### **Quick Check:**
```powershell
.\authorize-pipeline-resources.ps1 -CheckOnly
```

### **Full Verification:**
1. Go to your Azure Pipelines project
2. Queue a manual build of `azure-pipelines`
3. Check that the build completes successfully
4. Verify the daily (2:00 AM UTC) and weekly (10:00 AM UTC Monday) schedules run

---

## **Troubleshooting**

### **Issue: "Authentication failed"**
```
Solution:
✓ PAT token is wrong or expired
✓ Check you copied the token correctly
✓ Create a new token if needed
✓ Restart PowerShell after setting environment variable
```

### **Issue: "Pipeline not found"**
```
Solution:
✓ Verify pipeline name is "azure-pipelines"
✓ Check you're in the right organization: ramyabinyahya
✓ Check you're in the right project: totp-playwright
```

### **Issue: "Variable group not found"**
```
Solution:
✓ Create the variable group if it doesn't exist
✓ Check exact spelling: Playwright-Testing-Secrets_totp
✓ Check exact spelling: Playwright-Testing-Secrets
```

### **Issue: "Secure file not found"**
```
Solution:
✓ Create the secure file in Pipelines > Library > Secure files
✓ Check exact filename: D365AuthFile.json
✓ Verify the file exists in your project
```

---

## **What Each Script Does**

### **quick-setup-pat.ps1**
- Interactive prompt for your PAT token
- Saves token to Windows environment variable
- Simple and beginner-friendly

### **setup-pat-token.ps1**
- Advanced setup with validation
- Tests token before saving
- Shows list of accessible projects
- Option to run authorization script immediately

### **authorize-pipeline-resources.ps1**
- Main authorization script
- Authenticates to Azure DevOps API
- Authorizes all variable groups and secure files
- Provides detailed success/failure reporting

---

## **Security Notes**

✅ **SAFE:**
- PAT token stored only in Windows environment variable
- Secure and isolated per user
- Can be revoked anytime from Azure DevOps

❌ **UNSAFE:**
- Don't share your PAT token with others
- Don't commit it to Git or version control
- Don't hardcode it in scripts

---

## **Next Steps After Authorization**

1. ✅ Queue a manual pipeline build to test
2. ✅ Monitor first scheduled run (daily at 2:00 AM UTC)
3. ✅ Check Allure reports for test results
4. ✅ Set up email notifications if needed

---

## **Quick Reference Commands**

```powershell
# Set PAT token (one time)
[Environment]::SetEnvironmentVariable('AZURE_DEVOPS_PAT', 'your-token', 'User')

# Run authorization (after restarting PowerShell)
.\authorize-pipeline-resources.ps1

# Check setup
.\setup-pat-token.ps1 -CheckSetup

# Get help
.\authorize-pipeline-resources.ps1 -Help

# Set PAT from command line
.\quick-setup-pat.ps1 -Token "your-token-here"
```

---

## **Support**

If you need help:
1. Check the troubleshooting section above
2. Review Azure Pipelines documentation: https://docs.microsoft.com/azure/devops/pipelines
3. Check PAT token creation guide: https://docs.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate

---

**Status:** ✅ Ready to automate pipeline permissions!
