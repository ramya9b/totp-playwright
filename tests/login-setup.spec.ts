import { test, chromium } from '@playwright/test';
import { allure } from 'allure-playwright';
import { AuthenticationManager } from '../pages';

/**
 * D365 Login with TOTP and Save Session
 * Simple login test that authenticates and saves session for reuse
 */
test.describe('🔐 D365 Authentication Setup', () => {
  test.beforeEach(async () => {
    await allure.epic('Authentication');
    await allure.feature('TOTP Login');
    await allure.story('Session Management');
  });

  test('D365 Login with TOTP and save session', async () => {
    await allure.severity('critical');
    await allure.tag('authentication');
    await allure.tag('totp');
    await allure.tag('session');
    await allure.tag('login');
    await allure.description('Performs complete D365 authentication with TOTP and saves session for subsequent tests');
    await allure.owner('Automation Team');
    await allure.link('https://operations.dynamics.com/', 'D365 Finance & Operations');
    test.setTimeout(180000); // 3 minutes timeout
  
    // Launch browser with stealth mode to prevent automation detection
    // Use headless mode in CI/CD, headed mode for local debugging
    const browser = await chromium.launch({
      headless: process.env.CI === 'true' || process.env.HEADLESS === 'true',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=WebAuthenticationUI',
        '--disable-web-security',
        '--no-first-run',
        '--no-service-autorun',
        '--password-store=basic'
      ]
    });
  
    // Create context with stealth settings
    const context = await browser.newContext({
      permissions: [],
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });
    
    // Remove automation indicators
    await context.addInitScript(() => {
      // Overwrite the `navigator.webdriver` property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Overwrite the `plugins` property to add fake plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Overwrite the `languages` property
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Remove automation-related properties
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });
    
    await context.clearCookies();
    const page = await context.newPage();
  
    console.log('🔧 Starting D365 TOTP login and session save (INCOGNITO MODE)...');
  
    try {
      const authManager = new AuthenticationManager(page);
      await authManager.performCompleteLogin(true);
      console.log('✅ D365 login completed and session saved successfully!');
      await allure.step('Verify login completion', async () => {
        // Login verification completed in AuthenticationManager
      });
    } catch (error) {
      console.error('❌ Login failed:', error);
      await allure.attachment('Error Details', JSON.stringify(error, null, 2), 'application/json');
      throw error;
    } finally {
      await context.close();
      await browser.close();
    }
  });
});