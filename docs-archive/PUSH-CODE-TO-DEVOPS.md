# 📤 Moving Code from Local to Azure DevOps Repository

Complete step-by-step guide to push your Playwright automation project to Azure DevOps.

---

## ✅ Prerequisites

Before you start, ensure you have:

- [ ] **Git installed** on your machine (`git --version` to verify)
- [ ] **Azure DevOps account** (create at https://dev.azure.com)
- [ ] **Azure DevOps project** created
- [ ] **Git repository** in your Azure DevOps project (or create new)
- [ ] **Credentials ready** (Personal Access Token or credentials)
- [ ] Local code in `c:\Users\RamyaBIN\totp-playwright`

---

## 🚀 Step-by-Step Process

### Phase 1: Check Current Status

#### Step 1.1: Verify Git is Installed
```powershell
git --version
```
**Expected Output**: `git version 2.x.x.windows.1`

#### Step 1.2: Check if Git Repository Exists Locally
```powershell
cd c:\Users\RamyaBIN\totp-playwright
git status
```

**If you see**: Repository info → Skip to Phase 2  
**If you see error**: "not a git repository" → Start with Phase 1.3

#### Step 1.3: Initialize Git Repository (if needed)
```powershell
cd c:\Users\RamyaBIN\totp-playwright
git init
```

#### Step 1.4: Configure Git (if first time)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

### Phase 2: Create/Setup Azure DevOps Repository

#### Option A: Create New Repository in Azure DevOps

1. Go to **https://dev.azure.com/YOUR-ORG/YOUR-PROJECT**
2. Click **Repos** (left sidebar)
3. Click **+ New repository** (or "Initialize repository")
4. Choose:
   - **Repository name**: `totp-playwright`
   - **Add a README**: Uncheck (we have our own)
   - **Add .gitignore**: Check (select "Node")
   - **Add a license**: Optional
5. Click **Create**
6. Copy the **clone URL** (HTTPS or SSH)

**You'll see a URL like**:
```
https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/totp-playwright
```

#### Option B: Use Existing Repository

1. Go to **https://dev.azure.com/YOUR-ORG/YOUR-PROJECT**
2. Click **Repos** → **Your repository name**
3. Click **Clone** (blue button, top right)
4. Copy the **HTTPS URL** (recommended for beginners)

**Format**:
```
https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/REPO-NAME
```

---

### Phase 3: Connect Local Repository to Azure DevOps

#### Step 3.1: Add Remote Repository

Replace `YOUR-CLONE-URL` with your actual Azure DevOps repository URL:

```powershell
cd c:\Users\RamyaBIN\totp-playwright

git remote add origin https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/totp-playwright
```

**Example** (replace with your actual URL):
```powershell
git remote add origin https://dev.azure.com/myorg/myproject/_git/totp-playwright
```

#### Step 3.2: Verify Remote Connection

```powershell
git remote -v
```

**Expected Output**:
```
origin  https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/totp-playwright (fetch)
origin  https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/totp-playwright (push)
```

#### Step 3.3: Check Git Status

```powershell
git status
```

**Expected Output**: Shows untracked files (your project files)

---

### Phase 4: Prepare and Commit Code

#### Step 4.1: Check What Will Be Committed

```powershell
git status
```

This shows all files that will be added.

#### Step 4.2: Add All Files (RECOMMENDED)

```powershell
git add .
```

This stages all files in the current directory.

#### Step 4.3: Verify Staged Files

```powershell
git status
```

**Expected Output**: Lists files in green (ready to commit)

#### Step 4.4: Check .gitignore

Open `.gitignore` and verify these are **excluded** (not committed):
```
node_modules/
.env
auth/D365AuthFile.json
test-results/
screenshots/
allure-results/
playwright-report/
```

#### Step 4.5: Commit Files

```powershell
git commit -m "Initial commit: Playwright test automation with DevOps pipeline"
```

**Better commit message examples**:
```powershell
git commit -m "feat: Add Playwright test automation with Azure DevOps pipeline

- Daily and weekly scheduled execution (2 AM UTC, 10 AM Monday)
- Tests for D365 customer creation and authentication
- Comprehensive test reporting (Playwright, Allure)
- Setup documentation for deployment"
```

#### Step 4.6: Verify Commit

```powershell
git log --oneline -n 5
```

**Expected Output**: Shows your recent commits

---

### Phase 5: Push Code to Azure DevOps

#### Step 5.1: Push to Main Branch

```powershell
git push -u origin main
```

**First time?** You'll be asked to authenticate:
- **Username**: Your Azure DevOps username or email
- **Password**: Your Personal Access Token (NOT your password)

**Note**: If prompted for credentials on Windows, use:
- **Username**: Leave blank or use email
- **Password**: Paste your PAT (Personal Access Token)

#### Step 5.2: Create Personal Access Token (if needed)

If you don't have a PAT:

1. Go to **https://dev.azure.com/YOUR-ORG**
2. Click your **profile icon** (top right)
3. Select **Personal access tokens**
4. Click **+ New Token**
5. Configure:
   - **Name**: `totp-playwright-push`
   - **Organization**: Your organization
   - **Expiration**: 90 days (or longer)
   - **Scopes**: Check "Code (Read & Write)"
6. Click **Create**
7. **Copy the token** (you'll only see it once!)
8. **Use this token** as password when pushing

#### Step 5.3: Handle Authentication

**Windows Credential Manager** (First Time):
1. Git will prompt for username and password
2. Enter username: Your Azure DevOps email
3. Enter password: Paste your Personal Access Token
4. Check "Remember credentials" to avoid re-entering

**Alternative: Use SSH Keys**
```powershell
# Generate SSH key
ssh-keygen -t rsa -b 4096 -f $env:USERPROFILE\.ssh\id_rsa

# Add to Azure DevOps
# Settings → SSH public keys → Add key
# Paste contents of id_rsa.pub
```

#### Step 5.4: Wait for Push to Complete

This may take 1-5 minutes depending on:
- File size
- Network speed
- Server load

**You'll see output like**:
```
Enumerating objects: 500, done.
Counting objects: 100% (500/500), done.
Compressing objects: 100% (400/400), done.
Writing objects: 100% (500/500), 50.00 MiB, done.
...
To https://dev.azure.com/myorg/myproject/_git/totp-playwright
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

### Phase 6: Verify Code in Azure DevOps

#### Step 6.1: Check Repository Online

1. Go to **https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/REPO-NAME**
2. Click **Files** tab
3. Verify your files are there:
   - `azure-pipelines.yml` ✓
   - `package.json` ✓
   - `tests/` folder ✓
   - `pages/` folder ✓
   - Documentation files ✓

#### Step 6.2: Check Branch

1. Click **Branches** tab
2. Verify `main` branch exists
3. Check it shows your commit

#### Step 6.3: View Commit History

1. Click **Commits** tab
2. See your initial commit
3. Verify all files are included

---

## 📋 Complete Command Sequence

Run these commands in order (copy-paste friendly):

```powershell
# Navigate to project
cd c:\Users\RamyaBIN\totp-playwright

# Check git status
git status

# Configure git (one-time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Add remote (replace with your URL)
git remote add origin https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/totp-playwright

# Verify remote
git remote -v

# Stage all files
git add .

# Verify what's being committed
git status

# Commit
git commit -m "Initial commit: Playwright test automation with Azure DevOps pipeline"

# Push to Azure DevOps (first time, enter your PAT when prompted)
git push -u origin main

# Verify push
git log --oneline -n 3
```

---

## 🔑 Important Information to Have Ready

Before starting, gather these details:

| Item | Where to Find | Example |
|------|---------------|---------|
| **Azure DevOps URL** | Browser address bar | https://dev.azure.com/myorg |
| **Organization** | URL path | `myorg` |
| **Project Name** | URL path | `myproject` |
| **Repository Name** | After creation | `totp-playwright` |
| **Clone URL** | Repos → Clone button | https://dev.azure.com/myorg/myproject/_git/totp-playwright |
| **Email** | Your Azure account | user@company.com |
| **Personal Access Token** | Personal Access Tokens page | (secret token) |

---

## ⚠️ Troubleshooting

### Issue 1: "fatal: remote origin already exists"

**Cause**: Remote was already configured

**Solution**:
```powershell
# Remove existing remote
git remote remove origin

# Add correct remote
git remote add origin https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/totp-playwright
```

### Issue 2: "Authentication failed"

**Cause**: Invalid credentials or Personal Access Token

**Solutions**:

**Option 1: Use Cached Credentials**
```powershell
# Remove cached credentials
git credential-manager-core erase https://dev.azure.com

# Try push again (you'll be prompted to re-enter)
git push -u origin main
```

**Option 2: Use SSH Instead**
```powershell
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -f $env:USERPROFILE\.ssh\id_rsa

# Add SSH key to Azure DevOps (Settings → SSH public keys)
# Then change remote URL
git remote set-url origin git@ssh.dev.azure.com:v3/YOUR-ORG/YOUR-PROJECT/totp-playwright
```

**Option 3: Verify Personal Access Token**
- Check token hasn't expired
- Verify "Code (Read & Write)" scope is enabled
- Create new token if needed
- Use token exactly as copied (no extra spaces)

### Issue 3: "fatal: 'origin' does not appear to be a 'git' repository"

**Cause**: Remote URL is incorrect

**Solution**:
```powershell
# Check current remote
git remote -v

# If empty or wrong, fix it
git remote set-url origin https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git/totp-playwright
```

### Issue 4: "branch 'main' does not exist"

**Cause**: Repository doesn't have a main branch yet

**Solution**:
```powershell
# Check current branch
git branch

# If on 'master', rename to 'main'
git branch -m master main

# Push to create main branch
git push -u origin main
```

### Issue 5: Large files rejected

**Cause**: Git file size limits

**Solution**: Check that these are in `.gitignore`:
```
node_modules/
playwright-report/
allure-results/
test-results/
.env
auth/D365AuthFile.json
```

Run before committing:
```powershell
git clean -fd node_modules
git rm -r --cached node_modules
```

### Issue 6: "Updates were rejected because the remote contains work"

**Cause**: Repository not empty (has README or files)

**Solution**:
```powershell
# Pull existing content first
git pull origin main --allow-unrelated-histories

# Then push
git push -u origin main
```

---

## 🔄 Future Commits (After Initial Push)

Once code is in Azure DevOps, use this simplified process:

### Make Changes Locally
```powershell
# Edit files as needed
# For example, update a test file
```

### Commit and Push
```powershell
cd c:\Users\RamyaBIN\totp-playwright

# See what changed
git status

# Stage changes
git add .

# Commit with message
git commit -m "Update: Add new customer creation test scenario"

# Push to Azure DevOps
git push
```

### View Changes in Azure DevOps
1. Go to **Repos** → **Commits**
2. See your new commit
3. Click commit to view file changes

---

## 📊 Verification Checklist

After pushing to Azure DevOps:

- [ ] Repository exists in Azure DevOps
- [ ] Can access at: https://dev.azure.com/ORG/PROJECT/_git/REPO
- [ ] Files visible in **Files** tab
- [ ] `azure-pipelines.yml` present
- [ ] `package.json` present
- [ ] `tests/` folder with test files
- [ ] Documentation files visible
- [ ] Commit history shows your commit
- [ ] `main` branch is default branch
- [ ] No merge conflicts

---

## ✅ Next Steps After Push

Once code is in Azure DevOps:

1. **Create Pipeline**
   - Go to **Pipelines** → **Create Pipeline**
   - Select **Azure Repos Git**
   - Choose your repository
   - Select `azure-pipelines.yml`
   - Click **Save**

2. **Configure Secrets**
   - **Pipelines** → **Library** → **Variable groups**
   - Create `Playwright-Testing-Secrets`
   - Add your tokens and credentials

3. **Upload Auth File**
   - **Pipelines** → **Library** → **Secure files**
   - Upload `auth/D365AuthFile.json`

4. **Run First Test**
   - Pipeline → **Run** → **Run pipeline**
   - Monitor execution

---

## 💡 Pro Tips

### Tip 1: Use VS Code for Git
VS Code has built-in Git support:
1. Open project in VS Code
2. Click **Source Control** (left sidebar)
3. Stage files with checkmark
4. Write commit message
5. Click commit button
6. Click push button

### Tip 2: Keep Commit Messages Clear
```powershell
# Good
git commit -m "Add customer creation test with Excel data"

# Bad
git commit -m "updates"
```

### Tip 3: Push Frequently
- Push after meaningful work
- Makes code safe (backed up)
- Enables collaboration
- Creates audit trail

### Tip 4: Use .gitignore Properly
Before first commit, ensure `.gitignore` contains:
```
node_modules/
.env
*.log
auth/D365AuthFile.json
test-results/
screenshots/
allure-results/
playwright-report/
.DS_Store
```

### Tip 5: Credential Caching
Save time after first push:
```powershell
git config --global credential.helper wincred
```
(Windows Credential Manager will remember your PAT)

---

## 📞 Need Help?

### Common URLs

| Need | URL |
|------|-----|
| Create Project | https://dev.azure.com/ → + New project |
| Access Repos | https://dev.azure.com/YOUR-ORG/YOUR-PROJECT/_git |
| Personal Tokens | https://dev.azure.com/YOUR-ORG/_usersSettings/tokens |
| Git Help | https://git-scm.com/book/en/v2 |

### Commands Reference

| Task | Command |
|------|---------|
| Check status | `git status` |
| View history | `git log --oneline` |
| Create branch | `git checkout -b branch-name` |
| Switch branch | `git checkout branch-name` |
| Delete local branch | `git branch -d branch-name` |
| View remotes | `git remote -v` |
| Change remote | `git remote set-url origin NEW-URL` |
| Undo last commit | `git reset --soft HEAD~1` |
| Force push (careful!) | `git push -f origin main` |

---

## 🎯 Timeline

**Total Time**: 15-30 minutes

| Phase | Time | Task |
|-------|------|------|
| **Phase 1** | 2 min | Check git status |
| **Phase 2** | 3 min | Create/setup Azure DevOps repo |
| **Phase 3** | 2 min | Connect local to Azure DevOps |
| **Phase 4** | 3 min | Stage and commit files |
| **Phase 5** | 5-10 min | Push to Azure DevOps |
| **Phase 6** | 2 min | Verify files online |

**Total**: 17-24 minutes (plus initial setup time if needed)

---

**Ready to push? Start with Phase 1 above!** 🚀

For detailed Azure DevOps help, see:
- [Azure Repos Documentation](https://docs.microsoft.com/en-us/azure/devops/repos/)
- [Git Command Reference](https://git-scm.com/docs)
- [Personal Access Tokens](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
