# Scheduled Test Execution Guide - Azure DevOps Pipeline

## 📋 Current Configuration

Your project is **fully configured** for scheduled test execution with the following schedules:

### ✅ Active Schedules

| Schedule | Time | Frequency | Notes |
|----------|------|-----------|-------|
| **Daily Execution** | 2:00 AM UTC | Every day | Runs automated D365 tests |
| **Weekly Execution** | 10:00 AM UTC | Every Monday | Comprehensive test suite |
| **CI/CD Trigger** | On push | Each commit | Runs when code is pushed to `main` |

---

## 🕐 Timezone Conversion

The schedules are set in **UTC**. Here's what time they run in your timezone:

| Timezone | Daily (2:00 AM UTC) | Weekly Monday (10:00 AM UTC) |
|----------|-------------------|------------------------------|
| **PST** (UTC-8) | 6:00 PM (previous day) | 2:00 AM |
| **CST** (UTC-6) | 8:00 PM (previous day) | 4:00 AM |
| **EST** (UTC-5) | 9:00 PM (previous day) | 5:00 AM |
| **GMT** (UTC±0) | 2:00 AM | 10:00 AM |
| **CET** (UTC+1) | 3:00 AM | 11:00 AM |
| **IST** (UTC+5:30) | 7:30 AM | 3:30 PM |

**Need a different time?** See the [Customizing Schedules](#-customizing-schedules) section below.

---

## 🚀 How to Enable & Verify

### Step 1: Push Configuration to Azure DevOps

```bash
# Ensure your code is committed
git add azure-pipelines.yml
git commit -m "Configure scheduled pipeline execution for daily/weekly tests"
git push origin main
```

### Step 2: Create or Update Pipeline in Azure DevOps

1. Go to **Azure DevOps** → Your Project
2. Navigate to **Pipelines** → **Pipelines**
3. Click **New Pipeline**
4. Select **Azure Repos Git**
5. Choose your repository
6. Select **Existing Azure Pipelines YAML file**
7. Choose `azure-pipelines.yml` from the `main` branch
8. Click **Continue**
9. Click **Save** (or **Save and run** to test immediately)

### Step 3: Verify Scheduled Triggers

1. In your Pipeline settings, click **Edit** (top-right)
2. Click **Triggers** (top-right of the editor)
3. Scroll down to **Scheduled triggers**
4. Verify both schedules appear:
   - ✅ "Daily Test Execution at 2:00 AM UTC"
   - ✅ "Weekly Test Execution - Monday 10:00 AM UTC"

### Step 4: Configure Required Secrets

The pipeline requires these configurations in Azure DevOps:

#### Variable Group: `Playwright-Testing-Secrets`

1. Go to **Pipelines** → **Library** → **Variable groups**
2. Click **+ Variable group**
3. Name it: `Playwright-Testing-Secrets`
4. Add these variables:
   - `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` → Your access token (mark as **Secret**)
   - `D365_USERNAME` → Your D365 username (mark as **Secret**)
   - `D365_PASSWORD` → Your D365 password (mark as **Secret**)

#### Secure Files: `D365AuthFile.json`

1. Go to **Pipelines** → **Library** → **Secure files**
2. Click **+ Secure file**
3. Upload your `auth/D365AuthFile.json` file

### Step 5: Authorize Pipeline

1. When you first run the pipeline, Azure DevOps may ask for authorization
2. Click **Permit** to allow the pipeline to access secure files and variable groups
3. Pipeline will then proceed with execution

---

## 🔧 Pipeline Configuration Details

### Current Cron Schedule Syntax

```yaml
schedules:
  # Daily at 2:00 AM UTC
  - cron: "0 2 * * *"
    displayName: "Daily Test Execution at 2:00 AM UTC"
    branches:
      include:
        - main
    always: true  # Always run, even if no code changes

  # Weekly on Monday at 10:00 AM UTC
  - cron: "0 10 * * 1"
    displayName: "Weekly Test Execution - Monday 10:00 AM UTC"
    branches:
      include:
        - main
    always: true
```

### Cron Syntax Reference

```
┌───────── minute (0-59)
│ ┌───────── hour (0-23)
│ │ ┌───────── day of month (1-31)
│ │ │ ┌───────── month (1-12)
│ │ │ │ ┌───────── day of week (0-6) [0=Sunday, 1=Monday, ... 6=Saturday]
│ │ │ │ │
│ │ │ │ │
* * * * *
```

---

## 🎯 Customizing Schedules

Want to change when tests run? Edit `azure-pipelines.yml` and modify the `schedules` section.

### Common Examples

#### Run Daily at 9:00 AM UTC
```yaml
- cron: "0 9 * * *"
  displayName: "Daily Test Execution at 9:00 AM UTC"
  branches:
    include:
      - main
  always: true
```

#### Run Every Monday and Friday at 8:00 AM UTC
```yaml
- cron: "0 8 * * 1,5"
  displayName: "Monday & Friday Tests at 8:00 AM UTC"
  branches:
    include:
      - main
  always: true
```

#### Run Every 6 Hours
```yaml
- cron: "0 0,6,12,18 * * *"
  displayName: "Every 6 Hours Test Execution"
  branches:
    include:
      - main
  always: true
```

#### Run Every Day at Midnight (12:00 AM UTC)
```yaml
- cron: "0 0 * * *"
  displayName: "Midnight Daily Tests"
  branches:
    include:
      - main
  always: true
```

#### Run on 1st and 15th of Month at 10:00 AM UTC
```yaml
- cron: "0 10 1,15 * *"
  displayName: "Twice Monthly Tests"
  branches:
    include:
      - main
  always: true
```

After modifying, **commit and push** your changes:
```bash
git add azure-pipelines.yml
git commit -m "Update test execution schedule"
git push origin main
```

---

## 📊 What Happens During Scheduled Execution

When the pipeline runs, it automatically:

1. **Checkout Code** - Latest version from main branch
2. **Setup Environment**
   - Install Node.js (v20.x)
   - Install npm dependencies
   - Install Playwright browsers
3. **Authentication**
   - Download `D365AuthFile.json` from secure files
   - Use access token for Playwright Testing service
4. **Execute Tests**
   - Run tests from `tests/SC_03_createcustomer.spec.ts`
   - Execute both single and bulk customer creation scenarios
   - Generate test reports and artifacts
5. **Generate Reports**
   - Create Playwright HTML report
   - Generate Allure report
   - Publish all results as artifacts

### Test Files Executed

- **`tests/SC_01_login.setup.ts`** - Login setup/authentication
- **`tests/SC_02_homepage-verification.spec.ts`** - Homepage verification
- **`tests/SC_03_createcustomer.spec.ts`** - Customer creation (main test)

### Expected Results

Each run creates:
- ✅ Test results (JUnit format)
- ✅ Playwright HTML report
- ✅ Allure report
- ✅ Screenshots & videos (if tests fail)
- ✅ Execution logs

---

## 🔍 Monitoring & Viewing Results

### View Pipeline Runs

1. Go to **Pipelines** → Your Pipeline
2. Click **Runs** tab
3. You'll see all executions with status:
   - ✅ Green = Passed
   - ❌ Red = Failed
   - ⏱️ Clock icon = Scheduled/Running

### View Test Results

1. Click on a specific run
2. View the **Summary** tab
3. In the **Published** section, download or view:
   - **Playwright-HTML-Report** - Detailed test report
   - **Allure-HTML-Report** - Test metrics and charts
   - **Test-Results-Artifacts** - Screenshots and videos

### View Logs

1. Click on a run
2. Expand **Test Stage** → **PlaywrightTests** job
3. View detailed execution logs showing:
   - Dependencies installation
   - Test execution progress
   - Any errors or warnings

---

## 🔐 Security Best Practices

### Variable Group Secrets
- Always mark passwords/tokens as **Secret** (lock icon) in variable groups
- Secrets won't appear in pipeline logs or build output
- Regularly rotate credentials

### Secure Files
- Upload sensitive files (`D365AuthFile.json`, etc.) as **Secure files**
- These are encrypted at rest in Azure DevOps
- Only downloaded when needed, not stored in code

### Credential Storage
```yaml
# ✅ Correct - Use variable group
variables:
  - group: Playwright-Testing-Secrets

# ❌ Never commit credentials
# DO NOT hardcode: PLAYWRIGHT_SERVICE_ACCESS_TOKEN: 'secret-token'
```

---

## 🚨 Troubleshooting

### Issue: Schedule Not Running

**Possible Causes & Solutions:**

1. **Pipeline is disabled**
   - Go to **Pipelines** → Your Pipeline → **Settings**
   - Ensure "Disabled" is NOT checked

2. **Branch doesn't exist or is wrong**
   - Verify `main` branch exists with latest code
   - Pipeline only runs on configured branches

3. **Credentials expired**
   - Check if `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` is still valid
   - Refresh token in variable group if needed

4. **First scheduled run delay**
   - Azure DevOps may take a few minutes for first schedule
   - Manually trigger a run to verify setup

**Verification Steps:**
```bash
# 1. Verify your pipeline.yml has correct syntax
git add azure-pipelines.yml
git commit -m "Verify pipeline configuration"
git push origin main

# 2. Check Azure DevOps Pipeline Runs tab
# 3. Review Triggers section in pipeline editor
```

### Issue: Authentication Failures

**Check these:**
1. Verify `D365AuthFile.json` is uploaded to Secure files
2. Ensure `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` is set correctly
3. Check that authentication file hasn't expired
4. Test locally: `npm test`

### Issue: Test Failures During Scheduled Run

**Debugging Steps:**
1. Download artifacts from the failed run
2. Review screenshots in test results
3. Check detailed logs in pipeline job
4. Run tests locally with: `npm test`
5. Verify D365 environment is accessible

---

## 📈 Performance Tips

### Optimize Pipeline Execution

1. **Parallel Workers** (already set to 1 for compatibility)
   ```yaml
   npx playwright test -c playwright.service.config.ts --workers=1
   ```

2. **Timeouts** (already set to 60 minutes)
   ```yaml
   timeoutInMinutes: 60
   ```

3. **Retry Configuration**
   ```yaml
   options {
       retry(1)  # Retry failed tests once
   }
   ```

### Reduce Execution Time
- Keep test data minimal
- Remove unnecessary delays in tests
- Use parallel workers if tests are independent
- Archive old test results regularly

---

## 📚 Additional Resources

- **Cron Schedule Generator**: https://crontab.guru/
- **Azure Pipelines Documentation**: https://docs.microsoft.com/en-us/azure/devops/pipelines/
- **Scheduled Triggers Guide**: https://docs.microsoft.com/en-us/azure/devops/pipelines/build/triggers#scheduled-triggers
- **Playwright Documentation**: https://playwright.dev/
- **Allure Report**: https://docs.qameta.io/allure/

---

## ✅ Verification Checklist

Before running scheduled tests, ensure:

- [ ] `azure-pipelines.yml` is pushed to `main` branch
- [ ] Pipeline is created in Azure DevOps
- [ ] Variable group `Playwright-Testing-Secrets` is configured
- [ ] `D365AuthFile.json` is uploaded to Secure files
- [ ] Scheduled triggers are visible in pipeline settings
- [ ] Pipeline permissions are authorized
- [ ] Manual test run succeeds first
- [ ] Notifications are configured (optional)

---

## 🎯 Next Steps

1. **Verify Configuration** - Follow steps 1-5 in "How to Enable & Verify"
2. **Test Manually** - Run pipeline once manually to confirm setup
3. **Customize Schedule** - Adjust times to your timezone preference
4. **Add Notifications** - Configure email/Teams alerts (optional)
5. **Monitor Results** - Review trend data after first week of scheduled runs

---

**Status**: ✅ Pipeline Ready for Scheduled Execution  
**Frequency**: Daily + Weekly  
**Coverage**: D365 Automation Tests (Login, Homepage, Customer Creation)  
**Last Updated**: January 22, 2026
