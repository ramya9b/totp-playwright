# DevOps Pipeline Setup - Scheduled Test Execution

This guide explains how to set up your Playwright tests to run on a scheduled basis (daily/weekly) using Azure Pipelines.

## 📋 Overview

Your `azure-pipelines.yml` is now configured with:
- **Daily execution**: Every day at 2:00 AM UTC
- **Weekly execution**: Every Monday at 10:00 AM UTC
- **CI execution**: Automatically when code is pushed to `main` branch

## 🔧 Configuration Details

### Cron Schedule Syntax

```
┌───────── minute (0 - 59)
│ ┌───────── hour (0 - 23)
│ │ ┌───────── day of month (1 - 31)
│ │ │ ┌───────── month (1 - 12)
│ │ │ │ ┌───────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Current Schedule

```yaml
# Daily at 2:00 AM UTC
- cron: "0 2 * * *"

# Weekly - Monday at 10:00 AM UTC  
- cron: "0 10 * * 1"
```

## 🕐 Timezone Conversion

The schedules are in **UTC**. Convert to your timezone:

| Timezone | Daily (2:00 AM UTC) | Weekly (10:00 AM UTC) |
|----------|-------------------|----------------------|
| PST (UTC-8) | 6:00 PM prev day | 2:00 AM |
| CST (UTC-6) | 8:00 PM prev day | 4:00 AM |
| EST (UTC-5) | 9:00 PM prev day | 5:00 AM |
| GMT (UTC+0) | 2:00 AM | 10:00 AM |
| CET (UTC+1) | 3:00 AM | 11:00 AM |
| IST (UTC+5:30) | 7:30 AM | 3:30 PM |

## 🔄 How to Modify Schedules

Edit `azure-pipelines.yml` and update the `schedules` section:

### Example: Run Daily at 9:00 AM and Weekly on Friday at 6:00 PM

```yaml
schedules:
  # Daily at 9:00 AM UTC
  - cron: "0 9 * * *"
    displayName: "Daily Test - 9:00 AM UTC"
    branches:
      include:
        - main
    always: true

  # Weekly Friday 6:00 PM UTC
  - cron: "0 18 * * 5"
    displayName: "Weekly Test - Friday 6:00 PM UTC"
    branches:
      include:
        - main
    always: true
```

## 📝 Common Schedule Examples

```yaml
# Every 6 hours
- cron: "0 0,6,12,18 * * *"

# Every Monday and Friday at 9:00 AM
- cron: "0 9 * * 1,5"

# Every day at midnight (12:00 AM)
- cron: "0 0 * * *"

# Every Sunday at 11:59 PM
- cron: "59 23 * * 0"

# Every 1st and 15th of month at 8:00 AM
- cron: "0 8 1,15 * *"
```

## ✅ Setup Steps

### Step 1: Push Code to Azure DevOps

1. Go to your Azure DevOps project
2. Create a new Git repository or use existing
3. Push your code with the updated `azure-pipelines.yml`

```bash
git add azure-pipelines.yml
git commit -m "Add scheduled pipeline execution"
git push origin main
```

### Step 2: Configure Pipeline in Azure DevOps

1. Go to **Azure DevOps** → Your Project
2. Click **Pipelines** → **New Pipeline**
3. Select **Azure Repos Git**
4. Choose your repository
5. Select **Existing Azure Pipelines YAML file**
6. Select `azure-pipelines.yml` from main branch
7. Click **Continue**
8. Review the YAML configuration
9. Click **Save and run** or **Save** (without running)

### Step 3: Verify Scheduled Triggers

1. Go to **Pipelines** → Your Pipeline
2. Click **Edit** (top right)
3. Click **Triggers** (top right of editor)
4. Scroll down to **Scheduled triggers**
5. Verify your schedules are listed:
   - ✅ Daily Test Execution at 2:00 AM UTC
   - ✅ Weekly Test Execution - Monday 10:00 AM UTC

### Step 4: Configure Secret Variables

The pipeline uses a variable group `Playwright-Testing-Secrets` that must be configured:

1. Go to **Pipelines** → **Library** → **Variable groups**
2. Create a new variable group named `Playwright-Testing-Secrets`
3. Add these variables:
   - `PLAYWRIGHT_SERVICE_ACCESS_TOKEN`: Your Playwright service token
   - `D365_USERNAME`: D365 username (if needed)
   - `D365_PASSWORD`: D365 password (if needed)
   - Mark passwords as **Secret** (lock icon)

### Step 5: Secure File Configuration

1. Go to **Pipelines** → **Library** → **Secure files**
2. Upload `D365AuthFile.json` (your authentication session file)
3. This will be downloaded and used during test execution

## 📊 Monitoring Scheduled Runs

### View Pipeline Runs

1. **Pipelines** → Your Pipeline
2. Click **Runs** tab to see all executions:
   - Green checkmark = ✅ Passed
   - Red X = ❌ Failed
   - Clock icon = ⏱️ Scheduled

### View Test Results

1. Click on a specific run
2. View **Summary** tab
3. Click **Published** to see test reports:
   - Playwright HTML Report
   - Allure HTML Report
   - Test Results

### Configure Notifications

1. Go to **Project Settings** → **Service hooks**
2. Click **Create subscription**
3. Select **Build completion** event
4. Configure to send to:
   - Email (to team members)
   - Slack (if integrated)
   - Microsoft Teams

## 🔍 Troubleshooting

### Schedule Not Running

1. **Verify pipeline is enabled**: Settings → Pipelines → Disabled status
2. **Check branch**: Ensure `main` branch exists and has latest code
3. **Review logs**: Pipeline runs show execution logs with any errors
4. **Wait for first run**: First scheduled run may take a few minutes to start

### Authentication Failures

1. Verify `D365AuthFile.json` is uploaded to Secure files
2. Check `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` is set in variable group
3. Ensure tokens/credentials haven't expired
4. Test locally first: `npm test`

### Test Failures

1. Check **Published** artifacts for test reports
2. Download screenshots from **Artifacts**
3. Review detailed logs in pipeline run
4. Run tests locally to replicate issues

## 🚀 Pipeline Stages

Your pipeline has two main stages:

### Stage 1: Test (Execution)
- Downloads authentication files
- Installs dependencies
- Installs Playwright browsers
- **Runs Playwright Tests** (creates single or multiple customers)
- Publishes test results

### Stage 2: Report (Optional)
- Generates Allure HTML Report
- Publishes artifacts for viewing

## 📈 Test Execution Details

Each scheduled run will:
1. ✅ Navigate to D365 Customers page
2. ✅ Create new customers with random name suffixes
3. ✅ Fill all required form fields
4. ✅ Save customer records
5. ✅ Verify customers appear in list
6. ✅ Generate test reports

**Current test file**: `tests/SC_03_createcustomer.spec.ts`
- **Single customer test**: Creates 1 customer
- **Multiple customers test**: Loops through all Excel rows (currently 3)

## 🎯 Next Steps

1. **Update timing**: Modify cron expressions to match your timezone
2. **Add more tests**: Create additional test files in `tests/` folder
3. **Configure notifications**: Set up email/Slack alerts for failures
4. **Monitor results**: Review trends in test execution over time
5. **Expand coverage**: Add more customer scenarios to Excel test data

## 📚 Additional Resources

- [Azure Pipelines Scheduled Triggers](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/triggers?view=azure-devops#scheduled-triggers)
- [Cron Syntax Reference](https://crontab.guru/)
- [Playwright Documentation](https://playwright.dev/)
- [Azure DevOps Pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/)

---

**Pipeline Status**: ✅ Ready for scheduled execution
**Test Coverage**: D365 Customer Creation (single and bulk)
**Execution Frequency**: Daily + Weekly
