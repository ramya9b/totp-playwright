# Quick Reference: Scheduled Pipeline Setup

## 🎯 Your Current Setup

✅ **Status**: Scheduled execution is already configured in your `azure-pipelines.yml`

| What | When | How Often |
|------|------|-----------|
| **Daily Tests** | 2:00 AM UTC | Every day |
| **Weekly Tests** | 10:00 AM UTC (Monday) | Once per week |
| **CI Tests** | On code push | On every commit |

---

## ⚡ Quick Start (3 Steps)

### Step 1: Push to Azure DevOps
```bash
git add .
git commit -m "Scheduled pipeline configuration"
git push origin main
```

### Step 2: Create Pipeline
1. Go to Azure DevOps → Pipelines → New Pipeline
2. Select your Git repository
3. Choose "Existing Azure Pipelines YAML file"
4. Select `azure-pipelines.yml`
5. Click **Save** (not "Save and run")

### Step 3: Configure Secrets
**In Azure DevOps:**
1. Pipelines → Library → Variable groups
2. Create `Playwright-Testing-Secrets` with:
   - `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` (your token)
   - `D365_USERNAME` (your username)
   - `D365_PASSWORD` (your password)

3. Pipelines → Library → Secure files
4. Upload `D365AuthFile.json`

✅ **Done!** Pipeline will start running on schedule.

---

## 📅 Change Schedule Times

### Edit `azure-pipelines.yml`

**Daily at 9 AM UTC instead of 2 AM:**
```yaml
schedules:
  - cron: "0 9 * * *"  # Changed from "0 2 * * *"
    displayName: "Daily Test Execution at 9:00 AM UTC"
    branches:
      include:
        - main
    always: true
```

**Weekly on Friday 3 PM UTC instead of Monday 10 AM:**
```yaml
  - cron: "0 15 * * 5"  # Changed from "0 10 * * 1"
    displayName: "Weekly Test Execution - Friday 3:00 PM UTC"
    branches:
      include:
        - main
    always: true
```

**Then commit and push:**
```bash
git add azure-pipelines.yml
git commit -m "Update test schedule times"
git push origin main
```

---

## 🕐 Time Zone Quick Reference

**Need what time in YOUR timezone?**

| You Want | PST | CST | EST | GMT | CET | IST |
|----------|-----|-----|-----|-----|-----|-----|
| 2 AM UTC | 6 PM* | 8 PM* | 9 PM* | 2 AM | 3 AM | 7:30 AM |
| 10 AM UTC | 2 AM | 4 AM | 5 AM | 10 AM | 11 AM | 3:30 PM |

\* = Previous day

---

## 🔧 Common Cron Patterns

| Schedule | Cron | Notes |
|----------|------|-------|
| Daily (any time) | `0 HH * * *` | Replace HH with hour (0-23) |
| Weekly Mon | `0 HH * * 1` | Any Monday at HH:00 UTC |
| Weekly Fri | `0 HH * * 5` | Any Friday at HH:00 UTC |
| Every 6 hours | `0 0,6,12,18 * * *` | At 12am, 6am, 12pm, 6pm UTC |
| Twice monthly | `0 HH 1,15 * *` | 1st and 15th of month |

**Find perfect cron times**: https://crontab.guru/

---

## ✅ Verify It's Working

1. **Go to Azure DevOps Pipeline**
2. Click **Edit** → **Triggers**
3. Scroll to **Scheduled triggers**
4. Should see your two schedules listed with checkmarks ✅

### Wait for First Run
- Daily schedule: Up to 24 hours for first run
- Weekly schedule: Up to 7 days for first run
- Or click **Run pipeline** to test immediately

---

## 📊 What Happens When Tests Run

✅ Automatically:
1. Checks out latest code from `main` branch
2. Downloads `D365AuthFile.json` from secure files
3. Installs Node.js dependencies
4. Installs Playwright browsers
5. Runs all tests in `tests/` folder
6. Creates test reports (Playwright + Allure)
7. Publishes results as artifacts
8. Shows pass/fail in Azure DevOps

---

## 🚨 Troubleshooting

### "Schedule not running" 
- [ ] Check pipeline is **enabled** (Settings → not disabled)
- [ ] Verify `main` branch has code pushed
- [ ] Wait up to 24 hours for first run
- [ ] Manually trigger: **Run** → **Run pipeline**

### "Authentication failed"
- [ ] Verify `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` in secret variables
- [ ] Check `D365AuthFile.json` is uploaded to Secure files
- [ ] Run `npm test` locally to test authentication

### "Tests failing in pipeline but pass locally"
- [ ] Check timezone differences in test timing
- [ ] Verify D365 environment is accessible from pipeline agent
- [ ] Review test logs in **Published** artifacts

---

## 📱 Using Jenkins Instead

If using **Jenkins** instead of Azure DevOps:

1. Copy `Jenkinsfile-Scheduled` to your repo root (rename to `Jenkinsfile`)
2. In Jenkins:
   - Create Pipeline job from Git repository
   - Enable **Build Periodically**
   - Enter cron: `0 2 * * *` (for daily at 2 AM)
   - Configure credentials in Jenkins credentials store

See [JENKINS-SETUP.md](./Jenkinsfile-Scheduled) for detailed instructions.

---

## 📚 Full Documentation

- **Complete Setup Guide**: [SCHEDULED-EXECUTION-GUIDE.md](./SCHEDULED-EXECUTION-GUIDE.md)
- **Azure DevOps Setup**: [DEVOPS-PIPELINE-SETUP.md](./DEVOPS-PIPELINE-SETUP.md)
- **Cron Syntax Helper**: https://crontab.guru/

---

## 🎯 You're Set!

Your pipeline is configured and ready. 

**Next steps:**
1. ✅ Ensure secrets are configured
2. ✅ Wait for first scheduled run
3. ✅ View results in Azure DevOps Pipelines
4. ✅ Adjust times if needed

Questions? Check the full guides above or review your `azure-pipelines.yml` file.
