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
  
  /* Global setup runs ONCE before all tests to authenticate */
  globalSetup: require.resolve('./global-setup'),
  
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
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
    
    /* Launch browser in incognito mode to avoid Windows Hello/cached credentials */
    contextOptions: {
      isMobile: false,
      hasTouch: false,
    },
  },

  /* Run tests in files in parallel */
  fullyParallel: false, // Disable parallel execution - run tests sequentially
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Configure number of parallel workers - MUST BE 1 for session reuse */
  workers: 1, // Force sequential execution with single worker
  /* Max failures - stop after first failure in CI */
  maxFailures: process.env.CI ? 1 : undefined,
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
    // All tests use saved session from global setup
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'auth/D365AuthFile.json',
        headless: process.env.CI ? true : false,
        screenshot: 'on' as const,
        video: 'on' as const,
        trace: 'on' as const,
      },
    },
  ],
});
