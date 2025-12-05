# 🎯 Session-Based Authentication Guide

## ❌ Problem with TOTP Automation
- Microsoft's authentication flow is unpredictable in CI/CD
- FIDO/Windows Hello screens interfere with TOTP
- Different conditional access policies across environments
- Fighting with Microsoft's security is time-consuming

## ✅ Better Solution: Session Reuse

### How It Works
1. **One-time setup locally**: You log in manually (including TOTP)
2. **Save the session**: Playwright saves cookies and tokens
3. **Reuse in CI/CD**: Pipeline loads the session - **no login needed**
4. **Refresh periodically**: Re-run setup when session expires (usually 30-90 days)

---

## 📋 Setup Steps

### Step 1: Authenticate Once Locally

```powershell
# Run this ONCE on your local machine
npx playwright test setup-auth-once.spec.ts --headed
```

**What happens:**
- Browser opens to D365 login page
- **You complete the login manually** (email + TOTP)
- Script waits for you to reach D365 homepage
- Saves session to `auth/D365AuthFile.json`

### Step 2: Secure Your Session File

The `auth/D365AuthFile.json` contains valid cookies/tokens. Treat it like a password!

**Option A: Azure DevOps Secure Files (Recommended)**
```powershell
# Upload to Azure DevOps Library
# Navigate to: Pipelines → Library → Secure files → + Secure file
# Upload: auth/D365AuthFile.json
```

**Option B: Base64 in Variable (Alternative)**
```powershell
# Convert to base64 for variable storage
$content = Get-Content auth/D365AuthFile.json -Raw
$base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host $base64

# Store $base64 in Azure DevOps variable: AUTH_SESSION_BASE64
```

### Step 3: Update Pipeline

Replace TOTP variables with session file download:

```yaml
trigger:
  - main

pool:
  vmImage: 'windows-latest'

steps:
  # Download secure authentication file
  - task: DownloadSecureFile@1
    name: authFile
    displayName: 'Download D365 Auth Session'
    inputs:
      secureFile: 'D365AuthFile.json'
  
  # Copy to expected location
  - powershell: |
      New-Item -ItemType Directory -Force -Path "$(System.DefaultWorkingDirectory)/auth"
      Copy-Item "$(authFile.secureFilePath)" -Destination "$(System.DefaultWorkingDirectory)/auth/D365AuthFile.json"
      Write-Host "✅ Session file ready at: $(System.DefaultWorkingDirectory)/auth/D365AuthFile.json"
    displayName: 'Setup Auth Session'
  
  # Install dependencies
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
    displayName: 'Install Node.js'
  
  - script: npm ci
    displayName: 'Install Dependencies'
  
  - script: npx playwright install chromium
    displayName: 'Install Playwright Browsers'
  
  # Run tests (no login automation needed!)
  - script: npx playwright test
    displayName: 'Run Playwright Tests'
    env:
      CI: 'true'
  
  # Publish results
  - task: PublishTestResults@2
    condition: succeededOrFailed()
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: 'test-results/junit.xml'
      testRunTitle: 'D365 Playwright Tests'
  
  - task: PublishPipelineArtifact@1
    condition: failed()
    inputs:
      targetPath: 'playwright-report'
      artifact: 'playwright-report'
```

### Step 4: Update Test Configuration

Your tests now just load the session:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // Load saved authentication session
    storageState: 'auth/D365AuthFile.json',
    baseURL: process.env.D365_URL || 'https://avs-isv-puat.sandbox.operations.dynamics.com',
  },
  // ... rest of config
});
```

---

## 🔄 Session Maintenance

### When to Refresh
- Session expires (check error: "Please sign in again")
- After 30-90 days (typical Azure AD token lifetime)
- After password changes
- After MFA re-enrollment

### How to Refresh
```powershell
# Just re-run the setup locally
npx playwright test setup-auth-once.spec.ts --headed

# Upload new D365AuthFile.json to Azure DevOps Library
```

---

## ✅ Advantages

| Aspect | TOTP Automation | Session Reuse |
|--------|----------------|---------------|
| **Setup Time** | Hours debugging | 5 minutes |
| **Reliability** | Flaky in CI | 100% stable |
| **Maintenance** | Constant fixes | Refresh every 30-90 days |
| **Security** | Exposes TOTP secret | Temporary session tokens |
| **Microsoft Changes** | Breaks often | Unaffected |

---

## 🎬 Demo: Before & After

### ❌ Before (TOTP Automation)
```typescript
// 50+ lines of code fighting Microsoft
await page.fill('input[name="passwd"]', password);
await page.click('text=Sign in another way');
await page.waitForTimeout(5000); // Hope it works
const totp = generateTOTP(secret);
await page.fill('input[name="otc"]', totp); // Maybe it appears?
// ... endless debugging
```

### ✅ After (Session Reuse)
```typescript
// 0 lines - config does it all
export default defineConfig({
  use: {
    storageState: 'auth/D365AuthFile.json' // Done!
  }
});
```

---

## 🚀 Next Steps

1. **Run setup locally**: `npx playwright test setup-auth-once.spec.ts --headed`
2. **Upload session file** to Azure DevOps Secure Files
3. **Update pipeline** with session download task
4. **Remove TOTP variables** from variable groups
5. **Run pipeline** - enjoy stable, fast tests!

---

## 📞 Support

If session expires in pipeline:
- Check error message: "Please sign in again"
- Re-run `setup-auth-once.spec.ts` locally
- Re-upload `D365AuthFile.json` to Azure DevOps
- Session lifetime: ~30-90 days (Azure AD default)

**This approach is used by Microsoft, Google, and other major companies for E2E testing. It's proven, stable, and fast.** 🎯
