import { defineConfig } from '@playwright/test';
import { createAzurePlaywrightConfig, ServiceOS } from '@azure/playwright';
import { DefaultAzureCredential } from '@azure/identity';
import config from './playwright.config';

/* Learn more about service configuration at https://aka.ms/pww/docs/config */
export default defineConfig({
  timeout: 30_000,
  globalSetup: require.resolve('./global-setup.ts'),
  use: {
    // any shared settings like baseURL, storageState, etc.
    storageState: 'auth/D365AuthFile.json',
    baseURL: process.env.D365_URL,
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
  },
  /* Inherit reporters from main config (Allure, HTML, JSON, JUnit) */
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
        'Test Framework': 'Playwright',
        'Execution': 'Microsoft Playwright Testing Service'
      }
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['line'],
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  // Service configuration (picked up by Microsoft Playwright Testing)
  metadata: {
    playwrightService: {
      wsEndpoint: process.env.PLAYWRIGHT_SERVICE_URL,
      auth: {
        type: 'AccessToken',
        token: process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN,
      },
    },
  },
});
