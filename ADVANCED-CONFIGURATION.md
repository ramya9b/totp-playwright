# Advanced Configuration & Troubleshooting Guide

## 🔧 Advanced Pipeline Configurations

### 1. Custom Schedule Patterns

#### Run Tests Multiple Times Daily
Edit `azure-pipelines.yml`:
```yaml
schedules:
  # Every 6 hours
  - cron: "0 0,6,12,18 * * *"
    displayName: "Every 6 Hours Test Execution"
    branches:
      include:
        - main
    always: true

  # Every 12 hours
  - cron: "0 0,12 * * *"
    displayName: "Twice Daily Tests (12 hours apart)"
    branches:
      include:
        - main
    always: true
```

#### Run Tests on Specific Days Only
```yaml
schedules:
  # Monday and Friday only at 9 AM
  - cron: "0 9 * * 1,5"
    displayName: "Monday & Friday Tests at 9:00 AM UTC"
    branches:
      include:
        - main
    always: true

  # Weekdays only (Monday-Friday)
  - cron: "0 2 * * 1-5"
    displayName: "Weekday Daily Tests at 2:00 AM UTC"
    branches:
      include:
        - main
    always: true

  # Weekends only (Saturday & Sunday)
  - cron: "0 4 * * 0,6"
    displayName: "Weekend Tests at 4:00 AM UTC"
    branches:
      include:
        - main
    always: true
```

#### Run Tests Specific Dates (e.g., 1st and 15th)
```yaml
schedules:
  # 1st and 15th of month at 10 AM
  - cron: "0 10 1,15 * *"
    displayName: "Bi-Monthly Tests (1st & 15th at 10:00 AM UTC)"
    branches:
      include:
        - main
    always: true
```

---

### 2. Conditional Test Execution

Run different tests based on schedule type:

```yaml
stages:
  - stage: Test
    displayName: 'Run Tests'
    jobs:
      - job: DailyTests
        displayName: 'Daily Test Suite'
        condition: eq(variables['DailyRun'], 'true')
        steps:
          - task: PowerShell@2
            displayName: 'Run Daily Smoke Tests'
            inputs:
              targetType: 'inline'
              script: 'npx playwright test tests/smoke/'
      
      - job: WeeklyTests
        displayName: 'Weekly Comprehensive Tests'
        condition: eq(variables['WeeklyRun'], 'true')
        steps:
          - task: PowerShell@2
            displayName: 'Run Full Regression Suite'
            inputs:
              targetType: 'inline'
              script: 'npx playwright test tests/'
```

---

### 3. Parallel Test Execution

Increase test execution speed with parallel workers:

```yaml
# In azure-pipelines.yml, modify the test execution step:
- task: PowerShell@2
  displayName: '🧪 Run Tests with Parallel Workers'
  inputs:
    targetType: 'inline'
    script: |
      # Use 3 workers for parallel execution
      # Only use if tests are independent and don't interfere
      npx playwright test -c playwright.service.config.ts --workers=3
```

**Note**: Only use if:
- Tests are independent
- No shared state between tests
- D365 can handle concurrent loads
- You have sufficient agent resources

---

### 4. Test Retry Configuration

Add automatic retry for flaky tests:

Edit `playwright.config.ts`:
```typescript
export default defineConfig({
  // ... other config ...
  
  // Retry each test up to 2 times on failure
  retries: process.env.CI ? 2 : 0,
  
  // Timeout per test
  timeout: 30 * 1000, // 30 seconds
  
  // Timeout for entire test suite
  globalTimeout: 30 * 60 * 1000, // 30 minutes
  
  use: {
    // ... other settings ...
    
    // Action timeout (click, type, etc.)
    actionTimeout: 10 * 1000, // 10 seconds
  },
});
```

---

### 5. Dynamic Environment Variables

Set variables based on schedule type:

```yaml
# In azure-pipelines.yml
variables:
  # Static variables
  - name: PLAYWRIGHT_SERVICE_URL
    value: 'wss://eastus.api.playwright.microsoft.com/...'
  
  - name: D365_URL
    value: 'https://avs-isv-puat.sandbox.operations.dynamics.com'
  
  # Conditional variables (set by agent/pipeline)
  - name: TEST_ENVIRONMENT
    value: 'development'
  
  - name: RETRY_COUNT
    value: 2

stages:
  - stage: Test
    displayName: 'Run Tests'
    variables:
      # Override for specific stage
      D365_URL: 'https://your-test-environment.operations.dynamics.com'
    jobs:
      - job: PlaywrightTests
        steps:
          - task: PowerShell@2
            env:
              TEST_ENV: $(TEST_ENVIRONMENT)
              RETRIES: $(RETRY_COUNT)
            script: |
              Write-Host "Testing in: $env:TEST_ENV"
              Write-Host "Retries: $env:RETRIES"
```

---

### 6. Email Notifications on Failure

```yaml
- stage: Notify
  displayName: 'Notifications'
  condition: failed()
  jobs:
    - job: EmailNotification
      displayName: 'Send Failure Email'
      steps:
        - task: SendEmail@1
          inputs:
            To: 'team@company.com'
            Subject: 'Pipeline Failed - $(Build.Repository.Name) #$(Build.BuildNumber)'
            Body: |
              Build failed!
              
              Project: $(Build.Repository.Name)
              Branch: $(Build.SourceBranch)
              Commit: $(Build.SourceVersion)
              
              View Details: $(System.TeamFoundationCollectionUri)$(System.TeamProject)/_build/results?buildId=$(Build.BuildId)
              
              Test Results: $(System.ArtifactsDirectory)
            SmtpServer: 'smtp.company.com'
```

---

### 7. Conditional Publishing Based on Status

```yaml
- task: PublishTestResults@2
  condition: always()  # Always publish, even if tests fail
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: '**/test-results/*.xml'

- task: PublishPipelineArtifact@1
  condition: failed()  # Only publish on failure
  displayName: 'Publish Failure Artifacts'
  inputs:
    targetPath: 'test-results'
    artifact: 'FailureScreenshots'

- task: PublishPipelineArtifact@1
  condition: succeeded()  # Only publish on success
  displayName: 'Archive Success Report'
  inputs:
    targetPath: 'playwright-report'
    artifact: 'SuccessReport'
```

---

## 🚨 Troubleshooting Guide

### Issue 1: "Scheduled trigger not executing"

**Symptoms:**
- Pipeline configured but not running at scheduled time
- No runs appear on scheduled days

**Diagnosis Steps:**
1. Check if pipeline is enabled
   ```
   Azure DevOps → Pipelines → Your Pipeline → Settings
   Look for "Disabled" toggle
   ```

2. Verify trigger configuration
   ```
   Edit Pipeline → Triggers → Scheduled triggers
   Should see checkmarks next to your schedules
   ```

3. Check system time on Azure DevOps
   ```
   Pipelines → Library → Agent pools → Default
   Click agent → View system info
   Verify system time is correct
   ```

**Solutions:**
```bash
# Ensure latest code is in main branch
git log --oneline main | head -5

# Push code if not recent
git add .
git commit -m "Verify pipeline configuration"
git push origin main

# Manually trigger to test
# In Azure DevOps: Click "Run" button
```

### Issue 2: "Authentication token expired"

**Symptoms:**
- Tests fail with 401 Unauthorized
- PLAYWRIGHT_SERVICE_ACCESS_TOKEN error in logs

**Solution:**
1. Generate new token from Playwright Testing service
2. Update variable group:
   ```
   Pipelines → Library → Variable groups → Playwright-Testing-Secrets
   ```
3. Update PLAYWRIGHT_SERVICE_ACCESS_TOKEN
4. Save and re-run pipeline

```bash
# To check current token status:
# Contact your Playwright Testing service admin
# Tokens typically expire after 30-90 days
```

### Issue 3: "D365AuthFile.json not found"

**Symptoms:**
- Pipeline fails at authentication step
- Error: "D365AuthFile.json: No such file or directory"

**Diagnosis:**
```
Check Secure Files:
Pipelines → Library → Secure files
D365AuthFile.json should be listed
```

**Solution:**
1. If file is missing:
   ```
   Generate fresh D365 authentication session
   Place in local auth/ folder
   Upload to Secure files in Azure DevOps
   ```

2. If file is expired:
   ```
   Login to D365 to create new session
   Export and re-upload
   Run manual test to verify
   ```

### Issue 4: "Tests failing only in pipeline but pass locally"

**Symptoms:**
- Tests pass when run locally: `npm test`
- Same tests fail in scheduled pipeline
- Local D365 login works fine

**Possible Causes:**
1. **Different D365 environment**
   ```yaml
   # Check D365_URL in pipeline vs local
   D365_URL: 'https://correct-environment.operations.dynamics.com'
   ```

2. **Timezone differences**
   ```
   Pipeline agent might be in different timezone
   Tests with time-dependent logic might fail
   Solution: Use UTC for all time operations
   ```

3. **Network/Firewall**
   ```
   Pipeline agent might not have access
   Add agent IP to D365 whitelist
   Or run tests from same network as D365
   ```

4. **Browser differences**
   ```
   Local: Chrome/Firefox
   Pipeline: Chromium via Playwright Service
   May behave slightly differently
   Solution: Test on all configured browsers
   ```

**Troubleshooting Steps:**
```bash
# 1. Check logs in Azure DevOps
# Pipeline Run → Jobs → View detailed logs

# 2. Review test reports
# Published → Playwright-HTML-Report → Check failure details

# 3. Run test locally in CI mode
set CI=true
npm test

# 4. Add debug logging
# Edit test file to add console output at problem points

# 5. Take screenshots at failure point
await page.screenshot({ path: 'debug-screenshot.png' });
```

### Issue 5: "Pipeline timeout - execution too slow"

**Symptoms:**
- Pipeline takes longer than 60 minutes
- Tests get killed due to timeout

**Diagnosis:**
1. Check execution logs for slow stages
2. Review test duration in reports
3. Identify bottlenecks

**Solutions:**

Option 1: Increase timeout
```yaml
jobs:
  - job: PlaywrightTests
    displayName: 'Execute Tests at Scale'
    timeoutInMinutes: 120  # Increase from 60 to 120
```

Option 2: Parallelize tests
```bash
# In test execution step
npx playwright test -c playwright.service.config.ts --workers=2
```

Option 3: Split test suites
```yaml
jobs:
  - job: LoginTests
    displayName: 'Login Tests'
    steps:
      - script: npx playwright test tests/SC_01_login.setup.ts
  
  - job: HomepageTests
    displayName: 'Homepage Tests'
    steps:
      - script: npx playwright test tests/SC_02_homepage-verification.spec.ts
  
  - job: CreationTests
    displayName: 'Creation Tests'
    steps:
      - script: npx playwright test tests/SC_03_createcustomer.spec.ts
```

Option 4: Optimize test data
```typescript
// Use smaller dataset for scheduled runs
const testDataSize = process.env.CI ? 'small' : 'full';

const customers = testDataSize === 'small' 
  ? loadSmallTestData()   // 2-3 customers
  : loadFullTestData();   // All customers
```

### Issue 6: "Disk space full on agent"

**Symptoms:**
- Pipeline fails with "No space left on device"
- Artifacts aren't published

**Solution:**
```yaml
- task: PowerShell@2
  displayName: 'Cleanup Old Reports'
  condition: always()
  inputs:
    targetType: 'inline'
    script: |
      # Remove old playwright reports (keep last 5)
      Get-ChildItem "playwright-report" -Directory | 
        Sort-Object CreationTime -Descending | 
        Select-Object -Skip 5 | 
        Remove-Item -Recurse
      
      # Remove old allure results (keep last 5)
      Get-ChildItem "allure-results" -Directory | 
        Sort-Object CreationTime -Descending | 
        Select-Object -Skip 5 | 
        Remove-Item -Recurse
```

### Issue 7: "Variable group not found"

**Symptoms:**
- Error: "Variable group 'Playwright-Testing-Secrets' not found"
- Pipeline can't access secrets

**Solution:**
1. Create variable group:
   ```
   Pipelines → Library → Variable groups
   Click "+ Variable group"
   Name: Playwright-Testing-Secrets
   Add variables with secret tokens
   Click Save
   ```

2. Authorize variable group:
   ```
   Select variable group
   Click "Pipeline permissions"
   Click "+" button
   Search for your pipeline
   Click "Authorize"
   ```

3. Verify reference in pipeline:
   ```yaml
   variables:
     - group: Playwright-Testing-Secrets  # Exact name match
   ```

---

## 📊 Monitoring & Metrics

### Build Success Rate Dashboard

Track success rate over time:

```powershell
# PowerShell script to calculate success metrics
$successfulBuilds = Get-AzDevOpsBuilds -BuildStatus succeeded | Measure-Object
$failedBuilds = Get-AzDevOpsBuilds -BuildStatus failed | Measure-Object

$successRate = [math]::Round(
  ($successfulBuilds.Count / ($successfulBuilds.Count + $failedBuilds.Count)) * 100, 
  2
)

Write-Host "Success Rate: $successRate%"
Write-Host "Successful Builds: $($successfulBuilds.Count)"
Write-Host "Failed Builds: $($failedBuilds.Count)"
```

### Average Execution Time

```powershell
$builds = Get-AzDevOpsBuilds -Last 10
$totalTime = 0

foreach ($build in $builds) {
  $duration = ($build.finishTime - $build.startTime).TotalMinutes
  $totalTime += $duration
  Write-Host "$($build.id): $duration minutes"
}

$avgTime = $totalTime / $builds.Count
Write-Host "Average Execution Time: $avgTime minutes"
```

---

## 🔐 Security Best Practices

### 1. Rotate Credentials Regularly
```
Set calendar reminder to rotate every 30-90 days:
- PLAYWRIGHT_SERVICE_ACCESS_TOKEN
- D365 Credentials
- Authentication file (if session-based)
```

### 2. Use Managed Identities (if possible)
```yaml
# Instead of credentials, use service principal/managed identity
- task: AzureCLI@2
  inputs:
    azureSubscription: 'Your-Service-Connection'
    scriptType: 'pscore'
    scriptLocation: 'inlineScript'
    inlineScript: |
      # Uses managed identity authentication
      az account show
```

### 3. Audit Variable Group Access
```
Pipelines → Library → Variable groups
Click variable group
View "Authorized pipelines"
Review who has access
```

### 4. Secure Files Best Practices
```
- Upload only necessary files
- Regularly audit secure file list
- Update/replace expired files
- Don't store credentials in code
```

---

## 💡 Performance Optimization Tips

1. **Use npm ci instead of npm install**
   - Faster, more reliable for CI/CD
   - Already configured in pipeline

2. **Cache dependencies** (optional)
   ```yaml
   - task: Cache@2
     inputs:
       key: 'npm | "$(Agent.OS)" | package-lock.json'
       path: '$(npm_config_cache)'
   ```

3. **Reduce test data**
   - For daily runs: use smaller datasets
   - For weekly runs: comprehensive testing

4. **Use selective browser installation**
   ```bash
   # Only install needed browsers
   npx playwright install chromium
   ```

---

This advanced guide covers complex scenarios, troubleshooting, and optimization. Refer here when you need to customize your setup or resolve specific issues.
