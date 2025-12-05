# Azure Playwright Testing Setup Guide

## 🎯 What is Azure Playwright Testing?

Run your Playwright tests at scale in the cloud using Azure infrastructure:
- **Parallel execution** across multiple browsers
- **Scalable infrastructure** - Azure manages the resources
- **Faster CI/CD** - distribute tests across cloud runners
- **Cost-effective** - pay only for test execution time

---

## 📋 Prerequisites

1. **Azure Subscription** (you already have: RSATwithAzure)
2. **Azure CLI** installed
3. **Playwright tests** (you already have these)
4. **Azure DevOps** account

---

## 🚀 Setup Steps

### Option 1: Azure DevOps with Self-Hosted Agents (Recommended)

This runs tests in Azure Container Instances, much faster than hosted agents.

#### Step 1: Create Azure Container Instance

```powershell
# Login to Azure
az login

# Set subscription
az account set --subscription "Your-Subscription-ID"

# Create resource group
az group create --name playwright-testing-rg --location eastus

# Create container instance with Playwright
az container create `
  --resource-group playwright-testing-rg `
  --name playwright-runner `
  --image mcr.microsoft.com/playwright:v1.40.0-jammy `
  --cpu 4 `
  --memory 8 `
  --restart-policy Never `
  --environment-variables `
    D365_URL=$env:D365_URL
```

#### Step 2: Update Azure Pipeline

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

resources:
  containers:
  - container: playwright
    image: mcr.microsoft.com/playwright:v1.40.0-jammy

container: playwright

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
  
  - script: npm ci
    displayName: 'Install dependencies'
  
  - script: npx playwright install
    displayName: 'Install browsers'
  
  - script: npx playwright test --workers=4
    displayName: 'Run Playwright tests in parallel'
    env:
      D365_URL: $(D365_URL)
  
  - task: PublishTestResults@2
    condition: succeededOrFailed()
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: 'test-results/junit.xml'
```

---

### Option 2: Azure Container Apps (Serverless)

Deploy tests as a Container App that scales automatically.

#### Step 1: Create Container Registry

```powershell
az acr create `
  --resource-group playwright-testing-rg `
  --name playwrighttests `
  --sku Basic

# Login to registry
az acr login --name playwrighttests
```

#### Step 2: Create Dockerfile for Tests

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Install browsers
RUN npx playwright install

CMD ["npx", "playwright", "test", "--reporter=html"]
```

#### Step 3: Build and Push

```powershell
# Build image
docker build -t playwrighttests.azurecr.io/d365-tests:latest .

# Push to registry
docker push playwrighttests.azurecr.io/d365-tests:latest
```

#### Step 4: Deploy Container App

```powershell
# Create Container App environment
az containerapp env create `
  --name playwright-env `
  --resource-group playwright-testing-rg `
  --location eastus

# Deploy Container App
az containerapp create `
  --name d365-test-runner `
  --resource-group playwright-testing-rg `
  --environment playwright-env `
  --image playwrighttests.azurecr.io/d365-tests:latest `
  --target-port 80 `
  --ingress 'external' `
  --cpu 2 `
  --memory 4Gi `
  --env-vars D365_URL=secretref:d365url
```

---

### Option 3: GitHub Actions with Azure (Simple)

Use GitHub Actions with Azure-hosted runners.

```yaml
name: Playwright Tests on Azure

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.40.0-jammy
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run Playwright tests
      run: npx playwright test
      env:
        D365_URL: ${{ secrets.D365_URL }}
    
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

---

## 🎯 Which Option Should You Choose?

| Option | Best For | Pros | Cons |
|--------|----------|------|------|
| **Self-Hosted Agents** | Azure DevOps users | Full control, fast | Requires agent setup |
| **Container Apps** | Serverless, scale to zero | Auto-scaling, cost-effective | More complex setup |
| **GitHub Actions** | Quick start | Easiest setup | Limited to GitHub |

---

## 💰 Cost Estimation

- **Container Instances**: ~$0.02/hour (4 CPU, 8GB RAM)
- **Container Apps**: Pay per execution, ~$0.01 per test run
- **Azure DevOps**: First 1,800 minutes free, then $40/month

---

## 🚀 Recommended: Quick Start with Container Instance

Let me create a simple setup script:

```powershell
# Run this to set up Azure cloud testing
.\setup-azure-playwright-testing.ps1
```

---

Which option do you want to implement?
1. Self-hosted agents (fastest setup, works with existing Azure DevOps)
2. Container Apps (serverless, auto-scaling)
3. GitHub Actions (if you want to migrate from Azure DevOps)
