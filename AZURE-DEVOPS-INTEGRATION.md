# Azure DevOps Test Results Integration Guide

This guide explains how to integrate test results from Azure Pipelines with the Jupyter Notebook test reporting system.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Integration Methods](#integration-methods)
3. [Method 1: Automatic Sync (Recommended)](#method-1-automatic-sync-recommended)
4. [Method 2: PowerShell Script](#method-2-powershell-script)
5. [Method 3: Jupyter Notebook API](#method-3-jupyter-notebook-api)
6. [Troubleshooting](#troubleshooting)

## Overview

**Problem:** Test results are generated in Azure Pipelines, but need to be analyzed in Jupyter Notebook.

**Solution:** Multiple integration approaches:
- ✅ **Automatic**: Pipeline auto-commits results to repository (simplest)
- 🔧 **Manual**: PowerShell script to download artifacts
- 📡 **API**: Direct REST API calls from notebook

## Integration Methods

### Architecture Flow

```
┌─────────────────────┐
│  Azure Pipelines    │
│   - Run Tests       │
│   - Generate CSV    │
│   - Generate JSON   │
│   - Gen Allure      │
└──────────┬──────────┘
           │
           ├─────────────────────────────────────┐
           ▼                                     ▼
    ┌──────────────┐                ┌────────────────────┐
    │  Artifacts   │                │  Git Repository    │
    │   Upload     │                │  Auto-Commit       │
    └──────┬───────┘                └────────┬───────────┘
           │                                 │
           │  (Method 2)                     │  (Method 1)
           │  Download & Sync                │  Pull & Analyze
           │                                 ▼
           │                        ┌────────────────────┐
           │                        │  Local Workspace   │
           │                        │  allure-results/   │
           │                        │  test_results.*    │
           │                        └────────┬───────────┘
           │                                 │
           └─────────────────┬───────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Jupyter         │
                    │  Notebook        │
                    │  - Read Results  │
                    │  - Analyze       │
                    │  - Visualize     │
                    └──────────────────┘
```

## Method 1: Automatic Sync (Recommended) ⭐

**How it works:**
- Pipeline automatically commits test results back to repository
- Results are always in sync with Git
- Notebook reads latest results from `allure-results/` directory
- Zero manual intervention needed

**Setup:** Already configured in pipelines!

**When results are committed:**
- After each successful pipeline run
- Automatically pushed to `main` or `develop` branch
- Tracked in Git history

**To use in notebook:**

```python
# Cell 2 in notebook automatically reads from allure-results/
# No additional setup needed!

# Just run the notebook:
# jupyter notebook test_results_report.ipynb
```

**Advantages:**
- ✅ Fully automatic
- ✅ No manual downloads needed
- ✅ Git history tracks all results
- ✅ Works with CI/CD pipeline
- ✅ No credentials needed

---

## Method 2: PowerShell Script

**For manual downloads between pipeline runs**

### Prerequisites

1. Generate Azure DevOps Personal Access Token (PAT):
   - Go to: `https://dev.azure.com/RSATwithAzure/_usersSettings/tokens`
   - Click **New Token**
   - Name: `Playwright-Results-Sync`
   - Scopes:
     - ✓ Build (Read)
     - ✓ Code (Read)
   - Click **Create** and copy the token

### Usage

**Basic sync:**
```powershell
cd C:\Users\RamyaBIN\totp-playwright
.\scripts\sync-azure-results.ps1 -PATToken "your_token_here"
```

**Sync and update notebook:**
```powershell
.\scripts\sync-azure-results.ps1 -PATToken "your_token_here" -UpdateNotebook
```

**Display help:**
```powershell
.\scripts\sync-azure-results.ps1 -ShowHelp
```

### What the script does:

1. ✓ Authenticates with Azure DevOps
2. ✓ Fetches latest pipeline run
3. ✓ Downloads all test result artifacts
4. ✓ Extracts CSV, JSON, PNG files
5. ✓ Copies files to workspace
6. ✓ Optionally runs notebook

### Files downloaded:

- `test_results.csv` - Test results in tabular format
- `test_results.json` - Detailed test data (JSON)
- `test_results_visualization.png` - Test charts and graphs
- `test_cases_detailed.csv` - Individual test case details
- `allure-results/` - Raw Allure test results

---

## Method 3: Jupyter Notebook API

**For real-time API access without downloading**

### Setup in Notebook

Open `test_results_report.ipynb` and complete Section 1b:

```python
# In notebook cell: Configure Azure DevOps Integration
AZURE_DEVOPS_ORG = "RSATwithAzure"
AZURE_DEVOPS_PROJECT = "PlaywrightTests"
AZURE_DEVOPS_REPO = "totp-playwright"
PAT_TOKEN = "your_token_here"  # Set this!
```

### Get Token

```
https://dev.azure.com/RSATwithAzure/_usersSettings/tokens
```

### Use in Notebook

```python
# Run the integration setup cell
azure_config = setup_azure_devops_integration(
    AZURE_DEVOPS_ORG, 
    AZURE_DEVOPS_PROJECT, 
    AZURE_DEVOPS_REPO, 
    PAT_TOKEN
)

# Fetch latest artifacts
fetch_latest_pipeline_artifacts(azure_config)
```

### Advantages:

- ✅ Real-time data access
- ✅ No intermediate files
- ✅ Direct API queries
- ✅ Can fetch specific artifacts

### Disadvantages:

- ⚠️ Requires PAT token in notebook
- ⚠️ Slower than local files
- ⚠️ Depends on network connectivity

---

## Recommended Workflow

### For Active Development

```bash
# 1. Run tests locally
npm run test:sc03

# 2. Notebook reads local Allure results automatically
jupyter notebook test_results_report.ipynb

# 3. Analyze and iterate
```

### For CI/CD Pipeline

```bash
# 1. Push code to Azure DevOps
git add .
git commit -m "Update tests"
git push

# 2. Pipeline runs automatically:
#    - Executes tests
#    - Generates reports
#    - Auto-commits results to repo

# 3. Pull latest results locally
git pull

# 4. Run notebook
jupyter notebook test_results_report.ipynb
```

### For Scheduled Reports

```bash
# Daily task to sync pipeline results
# Windows Task Scheduler or Cron

# Run script
.\sync-azure-results.ps1 -PATToken $DEVOPS_TOKEN -UpdateNotebook

# Results automatically analyzed and exported
```

---

## File Structure

```
totp-playwright/
├── test_results_report.ipynb          # Main notebook
├── allure-results/                    # Test results (auto-synced)
│   ├── *.json                         # Individual test results
│   └── *.txt                          # Test attachments
├── test_results.csv                   # Exported results table
├── test_results.json                  # Structured results
├── test_results_visualization.png     # Charts and graphs
└── scripts/
    └── sync-azure-results.ps1         # Download helper script
```

---

## Troubleshooting

### Issue: Notebook can't find allure-results

**Solution:**
```python
import os
# Check if directory exists
print(os.path.exists('allure-results'))

# If False, run sync script
# .\scripts\sync-azure-results.ps1 -PATToken "token"
```

### Issue: "No Allure results found" in notebook

**Possible causes:**
1. Pipeline hasn't run yet
2. Allure directory is empty
3. Results weren't committed back

**Solution:**
```bash
# Check pipeline status
# Go to: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_build

# Or manually sync results
.\scripts\sync-azure-results.ps1 -PATToken "token"
```

### Issue: PAT token invalid

**Solution:**
1. Regenerate token: `https://dev.azure.com/RSATwithAzure/_usersSettings/tokens`
2. Verify scopes: Build (Read), Code (Read)
3. Token hasn't expired (they expire after time)
4. Update token in script or notebook

### Issue: Permission denied on repository

**Solution:**
```bash
# Verify git credentials
git config --list

# If needed, configure git
git config --global user.email "your@email.com"
git config --global user.name "Your Name"

# Try sync again
git push
```

### Issue: Notebook execution is slow

**Solution:**
1. Use Method 1 (Automatic Sync) - fastest
2. If using API method, check network
3. Consider running tests in parallel
4. Cache results locally

---

## Environment Variables

You can set environment variables to avoid hardcoding tokens:

```powershell
# PowerShell
$env:AZURE_DEVOPS_PAT = "your_token"
$env:AZURE_DEVOPS_ORG = "RSATwithAzure"

# Run script without token param
.\scripts\sync-azure-results.ps1
```

```bash
# Bash/Zsh
export AZURE_DEVOPS_PAT="your_token"
export AZURE_DEVOPS_ORG="RSATwithAzure"
```

---

## Security Best Practices

⚠️ **Important:** Never commit PAT tokens to repository!

### Safe Token Management

1. **Use Environment Variables:**
   ```powershell
   $env:AZURE_DEVOPS_PAT = "token_here"
   .\scripts\sync-azure-results.ps1
   ```

2. **Use .env File (not committed):**
   ```
   # .env (add to .gitignore)
   AZURE_DEVOPS_PAT=your_token_here
   ```

3. **Use GitHub/Azure Secrets:**
   - Store tokens in secret vaults
   - Reference in pipeline

4. **Limit Token Scope:**
   - Create token with minimum required permissions
   - Use separate tokens for different purposes

### Security Checklist

- ✓ PAT token not in code
- ✓ .env file in .gitignore
- ✓ Token scope is minimal
- ✓ Token permissions are "Read-only"
- ✓ Regenerate tokens periodically

---

## Next Steps

1. ✅ **Automatic Sync** is already configured
   - Just run tests and they auto-commit

2. 🔧 **Optional: Set up Script**
   - For manual downloads between runs

3. 📊 **Start analyzing:**
   ```bash
   jupyter notebook test_results_report.ipynb
   ```

4. 🔗 **Integrate with other tools:**
   - NotebookLM for insights
   - Email reports with results
   - Slack notifications

---

## Quick Reference

| Method | Setup | Speed | Automation | Best For |
|--------|-------|-------|-----------|----------|
| Auto Sync | ✅ Done | 🟢 Fast | 🤖 Full | Daily repo sync |
| PowerShell Script | 🔧 Manual | 🟡 Medium | 📋 Selectable | On-demand downloads |
| Notebook API | ⏱️ Config | 🔴 Slow | 🔄 Real-time | Direct access |

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Azure DevOps security logs
3. Check pipeline run logs: `https://dev.azure.com/RSATwithAzure/PlaywrightTests/_build`
4. Verify PAT token permissions and expiration

