import { defineConfig } from '@playwright/test';
import { getServiceConfig, ServiceOS } from '@azure/microsoft-playwright-testing';
import config from './playwright.config';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Ensure access token is available for authentication
if (process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN) {
  console.log('✅ Using access token authentication');
}

/* Learn more about service configuration at https://aka.ms/mpt/config */
export default defineConfig(
  config,
  getServiceConfig(config, {
    exposeNetwork: '<loopback>',
    timeout: 30000,
    os: ServiceOS.LINUX,
    useCloudHostedBrowsers: true // Set to false if you want to only use reporting and not cloud hosted browsers
  }),
  {
    /* Use standard Playwright reporters instead of MPT reporter to avoid initialization errors */
    reporter: [
      ['list'],
      ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ['json', { outputFile: 'test-results/results.json' }],
      ['junit', { outputFile: 'test-results/results.xml' }]
    ],
    
    /* DISABLE global setup for cloud browsers - each test should handle its own authentication */
    globalSetup: undefined,
  }
);
