# Pipeline Architecture & Flow Diagram

## 📊 High-Level Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AZURE DEVOPS PIPELINES                           │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │  CI/CD   │  │  Daily   │  │ Weekly   │
            │ Trigger  │  │ Schedule │  │ Schedule │
            │(on push) │  │ (2 AM)   │  │(10 AM)   │
            └──────────┘  └──────────┘  └──────────┘
                    │            │            │
                    └────────────┼────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Trigger Pipeline Run   │
                    │  (azure-pipelines.yml)  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   CHECKOUT & SETUP      │
                    │  - Checkout latest code │
                    │  - Download auth files  │
                    │  - Setup directories    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ INSTALL DEPENDENCIES    │
                    │  - Node.js 20.x         │
                    │  - NPM packages         │
                    │  - Playwright browsers  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  EXECUTE TESTS          │
                    │  - Load authentication  │
                    │  - Run test specs       │
                    │  - Generate reports     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  PUBLISH RESULTS        │
                    │  - JUnit test results   │
                    │  - Playwright reports   │
                    │  - Allure reports       │
                    │  - Screenshots/videos   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  NOTIFY & ARCHIVE       │
                    │  - Email notifications  │
                    │  - Slack/Teams alerts   │
                    │  - Archive artifacts    │
                    └────────────┴────────────┘
```

---

## 🔄 Detailed Test Execution Flow

```
START
  │
  ├─► STAGE 1: CHECKOUT & SETUP
  │   ├─► Clone repository from main branch
  │   ├─► Create auth directory
  │   ├─► Download D365AuthFile.json from secure files
  │   └─► Copy auth file to auth/D365AuthFile.json
  │
  ├─► STAGE 2: ENVIRONMENT SETUP
  │   ├─► Install Node.js (v20.x)
  │   ├─► Verify npm version
  │   └─► Display version information
  │
  ├─► STAGE 3: DEPENDENCIES
  │   ├─► npm ci (clean install from package-lock.json)
  │   └─► Install all required packages
  │
  ├─► STAGE 4: PLAYWRIGHT SETUP
  │   ├─► npx playwright install
  │   ├─► Install browser dependencies (--with-deps)
  │   │   ├─► Chromium
  │   │   ├─► Firefox
  │   │   └─► WebKit
  │   └─► Verify installation
  │
  ├─► STAGE 5: AUTHENTICATION SETUP
  │   ├─► Load environment variables
  │   ├─► Set PLAYWRIGHT_SERVICE_URL
  │   ├─► Set PLAYWRIGHT_SERVICE_ACCESS_TOKEN
  │   ├─► Set D365_URL
  │   └─► Verify credentials are loaded
  │
  ├─► STAGE 6: TEST EXECUTION
  │   ├─► Configure Playwright (playwright.service.config.ts)
  │   ├─► Run tests with --workers=1 (single worker)
  │   │   └─► Execute test files in sequence:
  │   │       ├─► SC_01_login.setup.ts
  │   │       ├─► SC_02_homepage-verification.spec.ts
  │   │       └─► SC_03_createcustomer.spec.ts
  │   │           ├─► Single customer creation
  │   │           └─► Multiple customers (from Excel)
  │   └─► Capture test results
  │
  ├─► STAGE 7: REPORT GENERATION
  │   ├─► Playwright HTML report
  │   │   ├─► Test summary
  │   │   ├─► Individual test details
  │   │   ├─► Screenshots
  │   │   └─► Videos (if configured)
  │   │
  │   ├─► Allure Report generation
  │   │   ├─► Test statistics
  │   │   ├─► Timeline view
  │   │   ├─► Failure analysis
  │   │   └─► History trends
  │   │
  │   └─► JUnit XML format
  │       └─► Standard format for CI/CD tools
  │
  ├─► STAGE 8: PUBLISH ARTIFACTS
  │   ├─► Publish test results (JUnit)
  │   ├─► Publish Playwright report
  │   ├─► Publish Allure results
  │   ├─► Upload screenshots (on failure)
  │   └─► Upload videos (if present)
  │
  ├─► STAGE 9: NOTIFICATIONS
  │   ├─► Send email notification
  │   ├─► Post to Teams/Slack
  │   └─► Update dashboard
  │
  └─► END (Success/Failure)
```

---

## 📅 Trigger Schedule Timeline

```
AZURE DEVOPS SCHEDULE TRIGGERS
══════════════════════════════════════════════════════════════════

DAILY TRIGGER: Every 24 hours at 2:00 AM UTC
────────────────────────────────────────────────────────────────
  Mon   Tue   Wed   Thu   Fri   Sat   Sun   Mon   Tue
   │     │     │     │     │     │     │     │     │
   └─►2AM◄─────┴─────┴─────┴─────┴─────┴─────┴─────┘
      RUN     (24h)  (24h)  (24h)  (24h)  (24h)  (24h)  RUN


WEEKLY TRIGGER: Every Monday at 10:00 AM UTC
────────────────────────────────────────────────────────────────
  Mon       Tue   Wed   Thu   Fri   Sat   Sun   Mon
   │         │     │     │     │     │     │     │
  10AM◄──────┴─────┴─────┴─────┴─────┴─────┴─────┴──► 10AM RUN
   RUN    (7 days)           (7 days)


COMBINED SCHEDULE VIEW
────────────────────────────────────────────────────────────────
  SUNDAY
    7:30 PM (previous) Daily run ──────────────────────► 2:00 AM UTC
    
  MONDAY
   10:00 AM UTC ◄──────── Weekly scheduled run
    2:00 AM UTC (next) ◄──────── Daily run + Monday weekly combined
    
  TUESDAY - FRIDAY - SATURDAY
    2:00 AM UTC ◄──────── Daily run (every day at 2:00 AM)
```

---

## 🔐 Authentication & Secrets Flow

```
                  AZURE DEVOPS
                  ────────────
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    ┌────────┐  ┌──────────┐  ┌───────────┐
    │ Secure │  │ Variable │  │ Pipeline  │
    │ Files  │  │ Groups   │  │ Variables │
    └────┬───┘  └────┬─────┘  └─────┬─────┘
         │           │              │
         │       ┌───┴───┐          │
         │       │       │          │
         ▼       ▼       ▼          │
    ┌─────────┐ ┌──────────────┐   │
    │D365Auth │ │Playwright... │   │
    │File.json│ │AccessToken   │   │
    │         │ │D365_USERNAME │   │
    │         │ │D365_PASSWORD │   │
    └────┬────┘ └──────┬───────┘   │
         │              │          │
         │          ┌───┴──────────┘
         │          │
         ▼          ▼
    PIPELINE RUN
    ────────────
    ├─► Download D365AuthFile.json (from Secure Files)
    ├─► Load PLAYWRIGHT_SERVICE_ACCESS_TOKEN (from Variable Group)
    ├─► Set D365_URL environment variable
    ├─► Setup authentication directory
    └─► Pass credentials to test execution
        │
        ▼
    TEST RUNNER
    ───────────
    ├─► Authenticate with D365
    ├─► Connect to Playwright Service
    └─► Execute automated tests
```

---

## 📊 Test Execution Stages in Detail

```
STAGE: CHECKOUT & SETUP
═══════════════════════════════════════════════════════════════
   Task 1: Checkout repository
      Status: ✓ Clone repository from Azure Repos
      Time: ~5 seconds
      
   Task 2: Download D365AuthFile
      Status: ✓ Download from Secure Files
      Time: ~2 seconds
      Credentials: Valid authentication session
      
   Task 3: Setup directories
      Status: ✓ Create auth/ directory
      Time: ~1 second

STAGE: INSTALL NODE.JS & DEPENDENCIES  
═══════════════════════════════════════════════════════════════
   Task 1: Install Node.js
      Version: 20.x (LTS)
      Time: ~10 seconds
      
   Task 2: Install dependencies
      Command: npm ci
      Time: ~30-45 seconds
      Packages: 80+ (from package.json)
      
   Task 3: Display versions
      Node: v20.x.x
      NPM: 9.x.x
      Time: ~1 second

STAGE: INSTALL PLAYWRIGHT
═══════════════════════════════════════════════════════════════
   Task 1: Install browsers
      Command: npx playwright install --with-deps
      Browsers: Chromium, Firefox, WebKit
      Time: ~60-90 seconds
      OS Dependencies: Included (--with-deps flag)
      
   Task 2: Verify installation
      Status: ✓ All browsers ready
      Time: ~2 seconds

STAGE: TEST EXECUTION
═══════════════════════════════════════════════════════════════
   Task 1: Load configuration
      File: playwright.service.config.ts
      Service: Microsoft Playwright Testing
      Time: ~1 second
      
   Task 2: Execute tests
      Command: npx playwright test
      Config: Service configuration
      Workers: 1 (single worker, sequential)
      Timeout: 30 minutes per test file
      
   Test Files:
      SC_01_login.setup.ts
         Duration: ~2 minutes
         Status: ✓ Login successful
         
      SC_02_homepage-verification.spec.ts
         Duration: ~1 minute
         Status: ✓ Homepage verified
         
      SC_03_createcustomer.spec.ts
         Duration: ~5-10 minutes
         Tests: 2 (single + multiple customer creation)
         Status: ✓ Customers created
         
   Task 3: Generate reports
      Playwright Report: HTML format
      JUnit Report: XML format
      Time: ~10 seconds

STAGE: PUBLISH RESULTS
═══════════════════════════════════════════════════════════════
   Task 1: Publish test results
      Format: JUnit
      Destination: Pipeline artifacts
      Time: ~5 seconds
      
   Task 2: Upload Playwright report
      Format: HTML with interactive UI
      Size: ~5-10 MB
      Time: ~10 seconds
      
   Task 3: Upload Allure results
      Format: JSON + HTML report
      Size: ~1-2 MB
      Time: ~5 seconds
      
   Task 4: Archive artifacts
      Screenshots: If tests failed
      Videos: If configured
      Time: ~5-10 seconds

TOTAL EXECUTION TIME: ~10-15 minutes
═══════════════════════════════════════════════════════════════
```

---

## 🎯 Pipeline Dependencies

```
                          TRIGGERS
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
         [CI/CD Push] [Daily 2AM] [Weekly 10AM]
                │            │            │
                └────────────┼────────────┘
                             ▼
                        CHECKOUT
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
         [Repository]                [Secure Files]
         (azure-pipelines.yml)   (D365AuthFile.json)
              │                          │
              ├──────────────┬───────────┘
              │              │
              ▼              ▼
        [Load Pipeline]  [Download Auth]
              │              │
              ├──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       [Node.js Install]          [Setup Secrets]
              │                      (Variable Group)
              ▼                             │
       [npm install]                       │
              │                            │
              ▼                            │
    [Playwright install] ◄──────────────────┘
              │
              ▼
         [Run Tests]
              │
        ┌─────┼─────┬────────┐
        ▼     ▼     ▼        ▼
     [Auth] [Home] [Create] [Report]
        │     │     │        │
        └─────┴─────┴────────┤
                             ▼
                      [Generate Reports]
                             │
                        ┌────┴────┐
                        ▼         ▼
                   [Publish]  [Notify]
                        │         │
                        └────┬────┘
                             ▼
                        [Complete]
```

---

## 📈 Artifact Output Structure

```
Pipeline Run
│
├── Published
│   ├── Playwright-HTML-Report/
│   │   ├── index.html (Main report)
│   │   ├── data/
│   │   │   ├── test-1.json
│   │   │   ├── test-2.json
│   │   │   └── ...
│   │   └── trace/
│   │       ├── trace_1.zip
│   │       └── ...
│   │
│   ├── Allure-Results/
│   │   ├── allure-results/
│   │   │   ├── attachment.txt
│   │   │   ├── result-1.json
│   │   │   └── ...
│   │   └── allure-report/
│   │       ├── index.html
│   │       ├── data/
│   │       └── assets/
│   │
│   ├── Test-Results/
│   │   ├── junit.xml
│   │   ├── results.json
│   │   └── results.xml
│   │
│   └── Screenshots & Videos/ (if failed)
│       ├── failure-1.png
│       ├── failure-2.png
│       └── video-1.webm
│
└── Logs
    └── Full console output
```

---

## 🔄 Scheduled Execution Timeline (Example Week)

```
MONDAY
──────────────────────────────────────────────────────────
  2:00 AM UTC    Daily Test Execution Starts
               + Weekly Test Execution Starts
               = 1 Combined Run
  
  2:10 - 2:15 AM Setup & Dependencies
  2:15 - 2:20 AM Browser Installation  
  2:20 - 2:25 AM Auth Setup
  2:25 - 2:35 AM Tests Running
              ├─ Login Test
              ├─ Homepage Test
              └─ Customer Creation Test
  2:35 - 2:40 AM Report Generation
  2:40 - 2:45 AM Publish & Notify
  
  ✓ Reports Available in Azure DevOps
  ✓ Email/Slack notification sent
  ✓ Artifacts archived
  

TUESDAY - SUNDAY
──────────────────────────────────────────────────────────
  2:00 AM UTC    Daily Test Execution Starts
  
  (Same process as above)
  
  ✓ Reports published daily
  ✓ Results tracked over time
```

---

## 🎯 Success Indicators

```
Pipeline Health Indicators
═══════════════════════════════════════════════════════════

Excellent (100% Success)
   ✓ All scheduled runs complete successfully
   ✓ All tests pass consistently
   ✓ Reports generate without errors
   ✓ Execution time stable (~10-15 min)
   ✓ No authentication failures

Good (90%+ Success)
   ✓ Most runs complete successfully
   ✓ Some occasional test flakiness
   ✓ Reports mostly complete
   ✓ Execution time within expected range
   ✓ Rare authentication issues

Fair (70-89% Success)
   ⚠ Intermittent failures
   ⚠ Some tests failing consistently
   ⚠ Report generation occasionally fails
   ⚠ Execution time longer than expected
   ⚠ Some authentication issues

Poor (<70% Success)
   ✗ Frequent failures
   ✗ Most tests failing
   ✗ Report generation failing
   ✗ Execution timeouts
   ✗ Authentication problems
   → Action Required: Review logs and troubleshoot
```

---

This document provides a visual understanding of how the pipeline works, when it runs, and what happens at each stage. Refer back to this when you need to understand the architecture or debug issues.
