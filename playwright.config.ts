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
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
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
  reporter: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME ? [
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME }],
  ] : [
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
        headless: false,
        screenshot: 'on' as const,
        video: 'on' as const,
        trace: 'on' as const,
      },
    },
    
    // Homepage tests - use saved session
    {
      name: '🏠 Homepage Verification',
      testMatch: '**/homepage-verification.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'auth/D365AuthFile.json',
        headless: false,
        screenshot: 'on' as const,
        video: 'on' as const,
        trace: 'on' as const,
      },
      dependencies: ['🔐 Login Authentication'],
    },
  ],
});
