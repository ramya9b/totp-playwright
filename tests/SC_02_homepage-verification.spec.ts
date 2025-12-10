import { test, expect } from '@playwright/test';

test.use({ storageState: 'auth/D365AuthFile.json' });

test('Home page title check', async ({ page }) => {
  await page.goto('/'); // Uses baseURL from config
  await expect(page).toHaveTitle(/Dashboard/);
});