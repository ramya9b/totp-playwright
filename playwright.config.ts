import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 2 * 60 * 1000, // 2 minutes timeout
  outputDir: 'test-results',
  
  expect: {
    timeout: 10000,
  },
  
  /* Global test settings for visual reporting */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.D365_URL,

    /* Load pre-authenticated session - no login automation needed! */
    storageState: 'auth/D365AuthFile.json',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    
    /* Launch browser in incognito mode to avoid Windows Hello/cached credentials */
    contextOptions: {
      isMobile: false,
      hasTouch: false,
    },
  },

  /* Run tests in files in parallel */
  fullyParallel: false, // Set to false for session dependency
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Configure number of parallel workers */
  workers: process.env.CI ? 1 : 1, // Keep single worker for session management
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report', 
      open: 'never',
      showTrace: true
    }],
    ['allure-playwright', {
      outputFolder: 'allure-results',
      suiteTitle: true,
      detail: true,
      environmentInfo: {
        'Test Environment': 'D365 Finance & Operations',
        'Authentication': 'TOTP Multi-Factor',
        'Browser': 'Chromium',
        'Test Framework': 'Playwright'
      }
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['line'],
  ],

  /* Configure projects for major browsers */
  projects: [
    // Login setup project - no session storage
    {
      name: '🔐 Login Authentication',
      testMatch: '**/login-setup.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        headless: process.env.CI ? true : false,
        screenshot: 'on' as const,
        video: 'retain-on-failure' as const,
        trace: 'retain-on-failure' as const,
        trace: 'on' as const,
        // Launch in incognito mode to avoid Windows Hello
        launchOptions: {
          args: ['--incognito', '--no-first-run', '--disable-blink-features=AutomationControlled'],
        },
      },
    },
    
    // Homepage tests - use saved session
    {
      name: '🏠 Homepage Verification',
      testMatch: '**/homepage-verification.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'auth/D365AuthFile.json',
        headless: process.env.CI ? true : false,
        screenshot: 'on' as const,
        video: 'on' as const,
        trace: 'on' as const,
        // Launch in incognito mode
        launchOptions: {
          args: ['--incognito', '--no-first-run', '--disable-blink-features=AutomationControlled'],
        },
      },
      dependencies: ['🔐 Login Authentication'],
    },
  ],
});
