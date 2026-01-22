# 🎯 Quick Visual Guide - Push Code to Azure DevOps

## Step-by-Step Visual Flow

```
START HERE
    ↓
┌─────────────────────────────────────────┐
│  PHASE 1: CHECK CURRENT STATUS          │
│  ✓ Git installed?                       │
│  ✓ Repository initialized?              │
│  ✓ Git configured?                      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  PHASE 2: SETUP AZURE DEVOPS REPO       │
│  • Create new repo in Azure DevOps      │
│  • OR use existing repository           │
│  • Copy the Clone URL                   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  PHASE 3: CONNECT LOCAL TO AZURE        │
│  $ git remote add origin [URL]          │
│  $ git remote -v                        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  PHASE 4: PREPARE CODE                  │
│  $ git add .                            │
│  $ git commit -m "message"              │
│  $ git log --oneline                    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  PHASE 5: PUSH TO AZURE DEVOPS          │
│  $ git push -u origin main              │
│  (Enter credentials/PAT when asked)     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  PHASE 6: VERIFY ONLINE                 │
│  ✓ Check files in Azure DevOps          │
│  ✓ Verify commit history                │
│  ✓ Check branch                         │
└─────────────────────────────────────────┘
    ↓
  SUCCESS! 🎉
```

---

## Copy-Paste Commands

Run these **in order**:

```powershell
# Step 1: Navigate to project
cd c:\Users\RamyaBIN\totp-playwright

# Step 2: Check status
git status

# Step 3: Configure git (one-time)
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Step 4: Add remote (REPLACE WITH YOUR URL)
git remote add origin https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/totp-playwright

# Step 5: Verify remote
git remote -v

# Step 6: Stage files
git add .

# Step 7: Commit
git commit -m "Initial commit: Playwright automation with DevOps pipeline"

# Step 8: Push (you'll be asked for credentials)
git push -u origin main

# Step 9: Verify
git log --oneline -n 3
```

---

## Required Information

Before you start, have these ready:

```
Azure DevOps Organization:  _____________________
Azure DevOps Project:       _____________________
Repository Name:            _____________________
Clone URL:                  _____________________
Email Address:              _____________________
Personal Access Token:      _____________________
```

**How to get these:**

1. **Organization**: URL in dev.azure.com (e.g., `myorg`)
2. **Project**: Project name in Azure DevOps
3. **Repository**: Repo name (e.g., `totp-playwright`)
4. **Clone URL**: Click **Clone** button in Azure DevOps
5. **Email**: Your Azure DevOps account email
6. **PAT**: Create at dev.azure.com → Personal access tokens

---

## Personal Access Token (PAT) - Quick Setup

If you don't have a PAT:

```
1. Go to: https://dev.azure.com/YOUR-ORG
2. Click: Profile icon (top right) → Personal access tokens
3. Click: + New Token
4. Fill in:
   - Name: totp-playwright-push
   - Organization: Your org
   - Expiration: 90 days
   - Scopes: Code (Read & Write)
5. Click: Create
6. COPY the token (you won't see it again!)
7. Use this as your password when pushing
```

---

## Authentication When Pushing

When you run: `git push -u origin main`

You'll be prompted:
```
Username: [Your email or username]
Password: [Paste your Personal Access Token]
```

**Notes**:
- Username: Use your Azure DevOps email
- Password: Paste the PAT exactly (no spaces)
- Check "Remember credentials" to save time later

---

## After Push - What to Check

Go to **https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/REPO**

### In Azure DevOps, verify:

✅ **Files Tab**
- All your files visible
- `azure-pipelines.yml` ✓
- `tests/` folder ✓
- `pages/` folder ✓
- Documentation ✓

✅ **Branches Tab**
- `main` branch exists
- Shows as default branch

✅ **Commits Tab**
- Your initial commit visible
- Shows correct commit message
- Shows all files included

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| **Remote already exists** | `git remote remove origin` then add again |
| **Authentication failed** | Check PAT is valid, recreate if expired |
| **Branch not found** | Rename: `git branch -m master main` |
| **Updates rejected** | `git pull origin main --allow-unrelated-histories` |
| **Large files rejected** | Check `.gitignore` includes node_modules |
| **Can't find remote** | Run: `git remote -v` to verify URL |

---

## Timeline

| Step | Time | Action |
|------|------|--------|
| 1 | 2 min | Check git & configure |
| 2 | 3 min | Create Azure DevOps repo |
| 3 | 2 min | Connect local to Azure |
| 4 | 3 min | Stage & commit files |
| 5 | 5-10 min | Push to Azure DevOps |
| 6 | 2 min | Verify online |
| **Total** | **17-24 min** | **Complete** |

---

## Success Criteria

You'll know it worked when:

✅ No errors during `git push`  
✅ Can see files in Azure DevOps online  
✅ Commit history shows your work  
✅ All test files visible  
✅ Documentation files present  
✅ Can access repository from browser  

---

## Next After Pushing

Once code is in Azure DevOps:

1. **Create Pipeline** - Go to Pipelines → Create Pipeline
2. **Configure Secrets** - Add variable group with credentials
3. **Upload Auth File** - Upload D365AuthFile.json
4. **Run First Test** - Click Run to test pipeline
5. **Monitor** - Watch test execution

---

## Important Files

Make sure these are in your push:

```
✓ azure-pipelines.yml          (Pipeline configuration)
✓ Jenkinsfile                   (Jenkins alternative)
✓ playwright.config.ts          (Test configuration)
✓ package.json                  (Dependencies)
✓ tests/                        (All test files)
✓ pages/                        (Page objects)
✓ utils/                        (Helper utilities)
✓ Documentation files           (All .md guides)

✗ node_modules/                 (Too large, in .gitignore)
✗ auth/D365AuthFile.json       (Sensitive, in .gitignore)
✗ test-results/                 (Generated, in .gitignore)
✗ screenshots/                  (Generated, in .gitignore)
```

---

## Quick Decision Tree

```
Does your Azure DevOps repo exist?
├─ YES → Jump to Phase 3 (Connect local to Azure)
└─ NO → Start at Phase 2 (Create repo)

Do you have a Personal Access Token?
├─ YES → Ready to push
└─ NO → Create one (5 minutes)

Are you on the main branch?
├─ YES → Ready to push
└─ NO → Run: git branch -m master main

Errors during push?
├─ YES → Check Troubleshooting section
└─ NO → Verify files online
```

---

## Commands You'll Need

### Most Important (Required)
```powershell
git add .
git commit -m "message"
git push -u origin main
```

### Very Important (Verification)
```powershell
git status
git remote -v
git log --oneline
```

### Important (Configuration)
```powershell
git config --global user.name "Name"
git config --global user.email "email"
git remote add origin URL
```

### Sometimes Needed (Fixes)
```powershell
git remote remove origin
git branch -m master main
git pull origin main --allow-unrelated-histories
```

---

## Video/Screenshot Spots

When looking at Azure DevOps:

### Clone Button Location
```
Repos → [Your Repo] → [Clone button - top right]
Click to copy HTTPS URL
```

### Personal Access Token Location
```
https://dev.azure.com/[ORG]
Profile Icon (top right) → Personal access tokens
[+ New Token button]
```

### Files Verification
```
https://dev.azure.com/[ORG]/[PROJECT]/_git/[REPO]
Files tab → Should see all your project files
```

### Commit History
```
https://dev.azure.com/[ORG]/[PROJECT]/_git/[REPO]
Commits tab → Should see your initial commit
```

---

## Estimated Difficulty

**Technical Level**: ⭐⭐☆☆☆ (Beginner friendly)

**Why**:
- Straightforward git commands
- Azure DevOps UI is intuitive
- Clear error messages if something goes wrong
- Can retry anytime

**Time to Complete**: 15-30 minutes  
**Success Rate**: 95%+ (if you follow steps)

---

## Key Reminders

1. ✅ Have your **Clone URL** ready before starting
2. ✅ Use **Personal Access Token**, not your password
3. ✅ First push takes longer (5-10 minutes)
4. ✅ Check **[Remember credentials]** to save time
5. ✅ **Verify** files are online after pushing
6. ✅ **Ask for help** if stuck (clear error messages appear)

---

## Still Need Help?

### Common Questions

**Q: Where do I find my Clone URL?**
A: In Azure DevOps repo, click blue "Clone" button (top right)

**Q: What's a Personal Access Token?**
A: A secure password replacement for git commands

**Q: How long does push take?**
A: First time 5-10 minutes, after that instant

**Q: Do I need to do this again?**
A: No, just for initial push. Later: `git push` (no flags)

**Q: What if I mess up?**
A: Most changes are reversible. See Troubleshooting section

---

## Success Message You'll See

After `git push -u origin main`, you should see:

```
Enumerating objects: 500, done.
Counting objects: 100% (500/500), done.
Compressing objects: 100% (400/400), done.
Writing objects: 100% (500/500), 50.00 MiB, done.
Total 500 (delta 300), reused 0 (delta 0), pack-reused 0

To https://dev.azure.com/myorg/myproject/_git/totp-playwright
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ If you see this → **SUCCESS!**

---

**Ready to start? Pick a command above and begin!** 🚀

For detailed help, see: [PUSH-CODE-TO-DEVOPS.md](./PUSH-CODE-TO-DEVOPS.md)
