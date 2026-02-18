# 🎯 Your Azure DevOps - Customized Push Guide

## Your Azure DevOps Details

```
Organization:   RSATwithAzure
Project:        PlaywrightTests
URL:            https://dev.azure.com/RSATwithAzure/PlaywrightTests/
```

---

## ⚡ Quick Start (15 minutes)

### Step 1: Create Repository (if not exists)

1. Go to: **https://dev.azure.com/RSATwithAzure/PlaywrightTests/**
2. Click **Repos** (left sidebar)
3. Click **+ New repository** or **Initialize**
4. Create repository named: `totp-playwright`
5. Click **Create**

### Step 2: Get Your Clone URL

1. Go to: **https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright**
2. Click blue **Clone** button (top right)
3. Copy the **HTTPS URL**

**Your clone URL will be**:
```
https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright
```

### Step 3: Create Personal Access Token (5 minutes)

1. Go to: **https://dev.azure.com/RSATwithAzure**
2. Click your **profile icon** (top right)
3. Select **Personal access tokens**
4. Click **+ New Token**
5. Fill in:
   - **Name**: `totp-playwright-push`
   - **Organization**: `RSATwithAzure`
   - **Expiration**: 90 days
   - **Scopes**: Check ✓ Code (Read & Write)
6. Click **Create**
7. **COPY** the token (save it somewhere safe!)

### Step 4: Push Your Code

Copy and run these commands in PowerShell:

```powershell
# Navigate to your project
cd c:\Users\RamyaBIN\totp-playwright

# Configure git (one-time)
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Add Azure DevOps as remote
git remote add origin https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright

# Verify remote
git remote -v

# Stage all files
git add .

# Commit
git commit -m "Initial commit: Playwright test automation with Azure DevOps pipeline"

# Push to Azure DevOps (paste PAT when asked for password)
git push -u origin main

# Verify
git log --oneline -n 3
```

### Step 5: Verify Online

1. Go to: **https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright**
2. Click **Files** tab
3. ✅ You should see all your project files

---

## 🔐 When You See Credential Prompt

```
Username: [Your email or username]
Password: [Paste your Personal Access Token]
[✓] Remember my credentials
```

**Important**:
- Username: Your Azure email (e.g., your.name@company.com)
- Password: **Paste the Personal Access Token you created**
- Check "Remember credentials" to avoid re-entering

---

## 🔗 Key URLs for Your Account

### Main Links

| Task | URL |
|------|-----|
| **Your Organization** | https://dev.azure.com/RSATwithAzure |
| **Your Project** | https://dev.azure.com/RSATwithAzure/PlaywrightTests/ |
| **Your Repository** | https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright |
| **Personal Tokens** | https://dev.azure.com/RSATwithAzure/_usersSettings/tokens |
| **Files** | https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright?path=/ |
| **Commits** | https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright?path=/&_a=history |
| **Branches** | https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright?path=/&_a=branches |

---

## 📋 Copy-Ready Commands

### Clone URL for Your Account
```
https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright
```

### Git Remote Command (Ready to Copy)
```powershell
git remote add origin https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright
```

### Complete Push Sequence (Ready to Copy)
```powershell
cd c:\Users\RamyaBIN\totp-playwright
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"
git remote add origin https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright
git remote -v
git add .
git commit -m "Initial commit: Playwright test automation with Azure DevOps pipeline"
git push -u origin main
git log --oneline -n 3
```

---

## ✅ What You'll See (Success Indicators)

After `git push -u origin main`, you should see:

```
Enumerating objects: 500, done.
Counting objects: 100% (500/500), done.
Compressing objects: 100% (400/400), done.
Writing objects: 100% (500/500), 50.00 MiB, done.
Total 500 (delta 300), reused 0 (delta 0), pack-reused 0

To https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ **If you see this → SUCCESS!**

---

## 🔍 Verify Files Online

### After Push, Check These URLs:

1. **Files Tab**
   - URL: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright?path=/
   - Should show all your project files

2. **Commits Tab**
   - URL: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright?path=/&_a=history
   - Should show your initial commit

3. **Branches Tab**
   - URL: https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright?path=/&_a=branches
   - Should show `main` branch as default

---

## 🆘 Troubleshooting

### Issue: "fatal: remote origin already exists"

**Solution**:
```powershell
git remote remove origin
git remote add origin https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright
```

### Issue: "Authentication failed"

**Solution 1 - Clear Cached Credentials**:
```powershell
git credential-manager-core erase https://dev.azure.com
git push -u origin main
```

**Solution 2 - Create New Token**:
1. Go to: https://dev.azure.com/RSATwithAzure/_usersSettings/tokens
2. Check if previous token expired
3. Create new token
4. Try push again with new token

### Issue: "remote URL is incorrect"

**Check Current URL**:
```powershell
git remote -v
```

**Fix URL**:
```powershell
git remote set-url origin https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright
```

### Issue: "branch 'main' does not exist"

**Solution**:
```powershell
git branch -m master main
git push -u origin main
```

---

## 📊 Timeline

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Create repo & get clone URL |
| 2 | 5 min | Create Personal Access Token |
| 3 | 2 min | Configure git locally |
| 4 | 1 min | Connect to Azure DevOps |
| 5 | 5-10 min | Push code (first time) |
| 6 | 2 min | Verify files online |
| **Total** | **20-25 min** | **Complete** |

---

## 🎯 After Push Complete

### Next Step: Setup Azure Pipelines

1. Go to: **https://dev.azure.com/RSATwithAzure/PlaywrightTests/**
2. Click **Pipelines** (left sidebar)
3. Click **Create Pipeline**
4. Select **Azure Repos Git**
5. Choose **totp-playwright** repository
6. Select **Existing YAML file**
7. Select `azure-pipelines.yml` from main branch
8. Click **Save**

### Then: Configure Secrets

1. Go to: **https://dev.azure.com/RSATwithAzure/PlaywrightTests/**
2. Click **Pipelines** → **Library** → **Variable groups**
3. Create new group: `Playwright-Testing-Secrets`
4. Add your credentials

### Then: Upload Auth File

1. Go to: **https://dev.azure.com/RSATwithAzure/PlaywrightTests/**
2. Click **Pipelines** → **Library** → **Secure files**
3. Upload `auth/D365AuthFile.json`

---

## 💡 Pro Tips

### Tip 1: Remember Credentials
After first push, check:
- ✓ Remember my credentials
- Won't need to re-enter PAT

### Tip 2: Use HTTPS (Recommended for Beginners)
The URL format I provided (HTTPS) is easier than SSH.

### Tip 3: Keep PAT Safe
- Save your Personal Access Token securely
- Don't share it
- Rotate every 90 days

### Tip 4: First Push Takes Time
- Initial push: 5-10 minutes (files + dependencies)
- Future pushes: Much faster
- This is normal!

### Tip 5: Check Status Frequently
```powershell
git status          # See what's changed
git log --oneline   # See commit history
git remote -v       # See remote URLs
```

---

## 📱 Quick Reference Card

**Your Organization**: `RSATwithAzure`  
**Your Project**: `PlaywrightTests`  
**Your Clone URL**: `https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright`  

**Commands You'll Run**:
```powershell
git remote add origin https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git/totp-playwright
git add .
git commit -m "Initial commit: Playwright test automation with Azure DevOps pipeline"
git push -u origin main
```

**Passwords/Credentials**:
- **Username**: Your Azure email
- **Password**: Your Personal Access Token (not your Azure password!)

---

## ✨ Success Path

```
1. Create repo in Azure DevOps
        ↓
2. Get clone URL
        ↓
3. Create Personal Access Token
        ↓
4. Run git commands
        ↓
5. Verify files online
        ↓
6. Setup pipeline
        ↓
7. Configure secrets
        ↓
8. Upload auth file
        ↓
9. Run tests! 🎉
```

---

## 📞 Need Help?

### Quick Links for Your Account

| Need | Link |
|------|------|
| **Repos** | https://dev.azure.com/RSATwithAzure/PlaywrightTests/_git |
| **Pipelines** | https://dev.azure.com/RSATwithAzure/PlaywrightTests/_build |
| **Tokens** | https://dev.azure.com/RSATwithAzure/_usersSettings/tokens |
| **Settings** | https://dev.azure.com/RSATwithAzure/PlaywrightTests/_settings |

---

**Ready to push? Follow the Quick Start above!** 🚀

For more details, see:
- [QUICK-PUSH-GUIDE.md](./QUICK-PUSH-GUIDE.md)
- [PUSH-CODE-TO-DEVOPS.md](./PUSH-CODE-TO-DEVOPS.md)
