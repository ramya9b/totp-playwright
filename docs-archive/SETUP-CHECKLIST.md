# ✅ Scheduled Pipeline Setup Checklist

Use this checklist to ensure your scheduled pipeline is properly configured for daily/weekly test execution.

---

## Phase 1: Preparation ✅

- [ ] **Repository Ready**
  - [ ] Code is in Git repository
  - [ ] `main` branch exists and has latest code
  - [ ] `azure-pipelines.yml` file is present
  - [ ] All test files are committed (`tests/` folder)

- [ ] **Authentication Files**
  - [ ] `auth/D365AuthFile.json` exists locally
  - [ ] File contains valid authentication session
  - [ ] File is in `.gitignore` (not committed to repo)

---

## Phase 2: Code Configuration ✅

- [ ] **azure-pipelines.yml Configuration**
  - [ ] File exists in repository root
  - [ ] Contains `schedules:` section with daily & weekly triggers
  - [ ] Cron syntax is correct: `"0 2 * * *"` (daily) and `"0 10 * * 1"` (weekly)
  - [ ] Branch filter includes `main`
  - [ ] `always: true` is set (runs even without code changes)
  - [ ] Variable group `Playwright-Testing-Secrets` is referenced
  - [ ] Secure file `D365AuthFile.json` is referenced

- [ ] **Schedule Times** (if customizing)
  - [ ] Daily time is converted to your timezone
  - [ ] Weekly day and time match your requirements
  - [ ] Times avoid peak business hours if needed
  - [ ] Changes are committed and pushed

---

## Phase 3: Azure DevOps Setup ✅

### Create Pipeline

- [ ] **Pipeline Creation**
  - [ ] Logged into Azure DevOps
  - [ ] Project selected
  - [ ] Clicked **Pipelines** → **Create Pipeline**
  - [ ] Repository connected
  - [ ] Selected "Existing YAML file"
  - [ ] Selected `azure-pipelines.yml` from `main` branch
  - [ ] Clicked **Save** (configuration saved)

### Configure Secrets

- [ ] **Variable Group: `Playwright-Testing-Secrets`**
  - [ ] Went to **Pipelines** → **Library** → **Variable groups**
  - [ ] Created new variable group named exactly: `Playwright-Testing-Secrets`
  - [ ] Added variable: `PLAYWRIGHT_SERVICE_ACCESS_TOKEN`
    - [ ] Value: Your access token
    - [ ] Marked as **Secret** ✓
  - [ ] Added variable: `D365_USERNAME` (optional)
    - [ ] Value: Your D365 username
    - [ ] Marked as **Secret** ✓
  - [ ] Added variable: `D365_PASSWORD` (optional)
    - [ ] Value: Your D365 password
    - [ ] Marked as **Secret** ✓
  - [ ] Clicked **Save**

- [ ] **Secure Files: `D365AuthFile.json`**
  - [ ] Went to **Pipelines** → **Library** → **Secure files**
  - [ ] Clicked **+ Secure file**
  - [ ] Selected and uploaded `auth/D365AuthFile.json`
  - [ ] File uploaded successfully

### Verify Configuration

- [ ] **Pipeline Triggers**
  - [ ] Went to pipeline → **Edit** → **Triggers**
  - [ ] Scrolled to **Scheduled triggers**
  - [ ] Verified daily schedule appears:
    - [ ] Display name: "Daily Test Execution at 2:00 AM UTC"
    - [ ] Cron: `0 2 * * *`
  - [ ] Verified weekly schedule appears:
    - [ ] Display name: "Weekly Test Execution - Monday 10:00 AM UTC"
    - [ ] Cron: `0 10 * * 1`
  - [ ] Both have ✓ checkmarks

- [ ] **Pipeline Permissions**
  - [ ] Authorized access to variable groups
  - [ ] Authorized access to secure files
  - [ ] Pipeline is **Enabled** (not disabled)

---

## Phase 4: Testing ✅

- [ ] **Manual Test Run**
  - [ ] Clicked **Run** button in Azure DevOps
  - [ ] Selected **Run pipeline** to manually trigger
  - [ ] Pipeline started execution
  - [ ] All stages completed successfully:
    - [ ] Checkout & Setup: ✓ Passed
    - [ ] Download Auth File: ✓ Passed
    - [ ] Install Node.js: ✓ Passed
    - [ ] Install Dependencies: ✓ Passed
    - [ ] Install Playwright: ✓ Passed
    - [ ] Run Tests: ✓ Passed
    - [ ] Publish Results: ✓ Passed

- [ ] **Verify Reports Generated**
  - [ ] In pipeline run, clicked **Published**
  - [ ] **Playwright-HTML-Report** artifact present
  - [ ] **Allure-Results** artifact present
  - [ ] Downloaded and viewed reports (optional)

---

## Phase 5: Monitoring Setup ✅

- [ ] **Email Notifications** (optional)
  - [ ] Went to **Project Settings** → **Service hooks**
  - [ ] Created subscription for **Build completion**
  - [ ] Configured recipient email addresses
  - [ ] Set to notify on failures (recommended)

- [ ] **Teams/Slack Notifications** (optional)
  - [ ] Integrated with Teams/Slack
  - [ ] Created webhook for pipeline events
  - [ ] Test notification sent

---

## Phase 6: Verification ✅

- [ ] **Scheduled Trigger Verification**
  - [ ] Pipeline shows in **Runs** tab
  - [ ] Viewing one run shows scheduled time
  - [ ] Date/time matches configured schedule
  - [ ] No errors in trigger logs

- [ ] **Documentation**
  - [ ] Created/updated `SCHEDULED-EXECUTION-GUIDE.md`
  - [ ] Updated team documentation
  - [ ] Shared schedule times with team
  - [ ] Documented any custom configurations

---

## Common Issues & Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| **Schedule not appearing** | Is `schedules:` section present? | Add proper YAML syntax |
| | Are all cron expressions valid? | Use https://crontab.guru/ |
| | Is YAML indentation correct? | Fix indentation (2 spaces) |
| **Auth failures** | Token still valid? | Refresh in variable group |
| | D365AuthFile expired? | Upload fresh authentication file |
| **Tests not running** | Pipeline enabled? | Check Settings → Enable |
| | Code in main branch? | Push code to main |
| | Permissions granted? | Authorize variable groups |
| **Wrong run time** | Timezone configured? | Check system timezone |
| | Is it UTC or local? | Cron in `azure-pipelines.yml` is UTC |

---

## Post-Setup Maintenance

- [ ] **Weekly Review** (first month)
  - [ ] Check that scheduled runs occur at correct times
  - [ ] Review test results for patterns
  - [ ] Verify no authentication issues

- [ ] **Monthly Maintenance**
  - [ ] Rotate credentials (passwords/tokens)
  - [ ] Refresh D365AuthFile if needed
  - [ ] Review and archive old test results
  - [ ] Update test data if needed

- [ ] **Quarterly Updates**
  - [ ] Review and adjust schedules based on team feedback
  - [ ] Update Playwright to latest version
  - [ ] Review test coverage and add new tests
  - [ ] Document any process changes

---

## Final Checklist Summary

**Phase 1 (Preparation)**: ___/2  
**Phase 2 (Code Configuration)**: ___/4  
**Phase 3 (Azure DevOps Setup)**: ___/10  
**Phase 4 (Testing)**: ___/7  
**Phase 5 (Monitoring)**: ___/4  
**Phase 6 (Verification)**: ___/4  

**Total Completed**: ___/31 ✅

---

## Success Indicators

You know everything is working when:

✅ Pipeline shows in Azure DevOps Pipelines list  
✅ Manual test run completes successfully  
✅ Scheduled triggers appear in pipeline settings  
✅ First scheduled run executes at configured time  
✅ Test reports are generated and published  
✅ No authentication errors in logs  
✅ Team receives notifications on test completion  

---

## Next Steps After Setup

1. **Monitor First Week**
   - Verify daily and weekly runs execute
   - Confirm proper times in your timezone
   - Review test results trends

2. **Optimize Tests**
   - Identify slow tests
   - Add more test scenarios
   - Increase test data coverage

3. **Expand Coverage**
   - Add more test suites
   - Test different scenarios
   - Include regression tests

4. **Team Communication**
   - Share pipeline status dashboard
   - Distribute test reports
   - Document test failure procedures

---

## Questions or Issues?

Refer to:
- 📖 [SCHEDULED-EXECUTION-GUIDE.md](./SCHEDULED-EXECUTION-GUIDE.md) - Complete setup guide
- 🚀 [QUICK-START-SCHEDULING.md](./QUICK-START-SCHEDULING.md) - Quick reference
- ⚙️ [DEVOPS-PIPELINE-SETUP.md](./DEVOPS-PIPELINE-SETUP.md) - Original setup documentation
- 🔗 [Azure Pipelines Docs](https://docs.microsoft.com/en-us/azure/devops/pipelines/)

---

**Checklist Created**: January 22, 2026  
**Status**: Ready for Implementation  
**Estimated Setup Time**: 30-45 minutes
