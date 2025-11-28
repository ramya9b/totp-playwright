import { test } from '@playwright/test';
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

  test('D365 Login with TOTP and save session', async ({ page }) => {
    await allure.severity('critical');
    await allure.tag('authentication');
    await allure.tag('totp');
    await allure.tag('session');
    await allure.tag('login');
    await allure.description('Performs complete D365 authentication with TOTP and saves session for subsequent tests');
    await allure.owner('Automation Team');
    await allure.link('https://operations.dynamics.com/', 'D365 Finance & Operations');
  test.setTimeout(180000); // 3 minutes timeout
  
  console.log('🔧 Starting D365 TOTP login and session save...');
  
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
  }
  });
});