# Teams Webhook Setup Guide for Playwright Pipelines

This guide walks you through configuring Microsoft Teams notifications for your Playwright test results in Azure Pipelines.

## Problem: "Invalid URI: The hostname could not be parsed"

This error occurs when the `TEAMS_WEBHOOK` variable is not configured in your Azure DevOps variable group. The pipeline tries to send to an undefined URL, causing the error.

## Solution: 4-Step Setup

### Step 1️⃣ : Create Teams Incoming Webhook

1. Open **Microsoft Teams**
2. Go to the channel where you want test notifications (e.g., #test-automation)
3. Click the **⋯ (More options)** button next to the channel name
4. Select **Connectors**
5. Search for **"Incoming Webhook"**
6. Click **Configure** (or **Add** if not already added)
7. Name it: `Playwright Test Notifications`
8. (Optional) Upload a logo/icon
9. Click **Create**
10. **Copy the webhook URL** - it will look like:
   ```
   https://outlook.webhook.office.com/webhookb2/xxxxx/IncomingWebhook/yyyyy/zzzz
   ```
11. Click **Done**

**⚠️ IMPORTANT:** Keep this URL safe - anyone with it can post to your channel!

---

### Step 2️⃣ : Create Azure DevOps Variable Group

1. Go to **Azure DevOps**: https://dev.azure.com/RSATwithAzure/PlaywrightTests
2. Click **Pipelines** → **Library** (in left sidebar)
3. Click **+ Variable group**
4. Configure:
   - **Name**: `PlaywrightTestsConfig`
   - **Description**: Variables for Playwright test notifications

5. Add Variable:
   - **Name**: `TEAMS_WEBHOOK`
   - **Value**: (Paste your webhook URL from Step 1)
   - **Check ✅**: "Keep this value secret" (important for security!)

6. Click **Save**

You should now see:
```
PlaywrightTestsConfig (Variable Group)
  └── TEAMS_WEBHOOK = ••••••••••• (secret)
```

---

### Step 3️⃣ : Link Variable Group to Pipeline

Your pipelines already reference the variable group. Verify by checking if your `azure-pipelines.yml` files contain:

```yaml
variables:
  - group: PlaywrightTestsConfig
```

If not present, add this after the `trigger:` and `pool:` sections:

```yaml
trigger:
  - main

pool:
  vmImage: 'windows-latest'

variables:
  - group: PlaywrightTestsConfig  # ← Add this line

stages:
  - stage: Test
    ...
```

---

### Step 4️⃣ : Test the Configuration

1. Queue a new pipeline run:
   - Go to **Pipelines** → **azure-pipelines.yml** (or your pipeline)
   - Click **Run pipeline**
   - Select **main** branch
   - Click **Run**

2. Wait for tests to complete (approximately 1-2 minutes)

3. Check your Teams channel for a notification like:

   ```
   ✅ Playwright Test Results - Build #123
   SC_03_createcustomer

   Total Tests         6
   ✅ Passed           6
   ❌ Failed           0
   Pass Rate           100%
   Execution Time      28.5s
   ```

---

## Troubleshooting

### ❌ Error: "Invalid URI: The hostname could not be parsed"

**Cause**: Webhook URL is empty or malformed

**Fix**:
1. Check variable group exists: Pipelines → Library → PlaywrightTestsConfig
2. Verify TEAMS_WEBHOOK variable is set with full webhook URL
3. Ensure URL matches format: `https://outlook.webhook.office.com/...`
4. Re-queue the pipeline after fixing

### ❌ Error: "401 Unauthorized"

**Cause**: Webhook URL is expired or invalid

**Fix**:
1. Delete the old Teams connector in your channel
2. Create a new incoming webhook (Steps 1-3 above)
3. Update TEAMS_WEBHOOK in variable group with new URL
4. Re-queue the pipeline

### ❌ No notification received, but no error in logs

**Cause**: Variable group not linked to pipeline

**Fix**:
1. Verify `variables: - group: PlaywrightTestsConfig` in pipeline YAML
2. Ensure variable group name is spelled exactly: `PlaywrightTestsConfig`
3. Save and commit pipeline changes
4. Re-queue the pipeline

### ⚠️ Notification sent but with incomplete data

**Cause**: test_results.json not generated properly

**Fix**:
1. Check "Run Tests" stage - should show 3/3 tests passing
2. Verify test run creates `test_results.json` in repo root
3. Check "Generate Artifacts" stage uploads JSON files
4. Re-run the pipeline with verbose logging enabled

---

## Manual Testing (Without Pipeline)

To test your webhook URL directly from PowerShell:

```powershell
$webhook = "https://outlook.webhook.office.com/..."  # Your webhook URL
$body = @{
    "@type" = "MessageCard"
    "@context" = "https://schema.org/extensions"
    "summary" = "Test Notification"
    "themeColor" = "28a745"
    "sections" = @(@{
        "activityTitle" = "✅ Test Notification"
        "facts" = @(
            @{ "name" = "Status"; "value" = "Working" },
            @{ "name" = "Time"; "value" = (Get-Date).ToString() }
        )
    })
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $webhook -Method Post -ContentType 'application/json' -Body $body
```

**Expected result**: 
- No error in PowerShell
- Message appears in your Teams channel

---

## Security Best Practices

1. **Always mark webhook URL as secret** in variable groups
2. **Never commit webhook URL** to git repo
3. **Rotate webhooks** if accidentally exposed (delete old, create new)
4. **Use separate channels** for critical vs non-critical notifications
5. **Limit access** to variable group to necessary team members

---

## Advanced: Azure DevOps CLI Setup

Prefer command-line? Use Azure DevOps CLI:

```bash
# Install extension
az extension add --name azure-devops

# Configure defaults
az devops configure \
  --defaults organization=https://dev.azure.com/RSATwithAzure \
                  project=PlaywrightTests

# Create variable group
az pipelines variable-group create \
  --name PlaywrightTestsConfig \
  --variables TEAMS_WEBHOOK='https://outlook.webhook.office.com/...'

# Verify creation
az pipelines variable-group list --query "[?name=='PlaywrightTestsConfig']"
```

---

## Webhook Message Format

Your notifications use Microsoft Adaptive Card format. Structure:

```json
{
  "@type": "MessageCard",
  "@context": "https://schema.org/extensions",
  "summary": "Playwright Test Results - Build #123",
  "themeColor": "28a745",  // Green for pass, Red (dc3545) for fail
  "sections": [{
    "activityTitle": "✅ Playwright Test Results - Build #123",
    "activitySubtitle": "totp-playwright",
    "facts": [
      { "name": "Total Tests", "value": "6" },
      { "name": "✅ Passed", "value": "6" },
      { "name": "❌ Failed", "value": "0" },
      { "name": "Pass Rate", "value": "100%" },
      { "name": "Execution Time", "value": "28.5s" }
    ]
  }]
}
```

---

## Next Steps

Once Teams notifications are working:

1. ✅ Set up scheduled daily pipeline runs
2. ✅ Create Power BI dashboard from test_results.json
3. ✅ Add more test scenarios to automation
4. ✅ Configure failure alerts (escalate if >1 test fails)

---

## Support

If you encounter issues:

1. Check pipeline logs in Azure DevOps → Build details
2. Enable debug logging: add `-Debug` flag to PowerShell tasks
3. Review variable group permissions
4. Verify Teams channel webhook is active (test via manual PowerShell command)

**Last updated**: February 20, 2026
**Pipeline commit**: af55397
