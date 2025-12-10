import { defineConfig } from '@playwright/test';
import { createAzurePlaywrightConfig, ServiceOS } from '@azure/playwright';
import { DefaultAzureCredential } from '@azure/identity';
import config from './playwright.config';

/* Learn more about service configuration at https://aka.ms/pww/docs/config */
export default defineConfig({
  timeout: 30_000,
  use: {
    // any shared settings like baseURL, storageState, etc.
  },
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
