import { test, expect } from '@playwright/test';

test.use({ storageState: 'auth/D365AuthFile.json' });

test('Home page title check', async ({ page }) => {
  await page.goto(process.env.D365_PAGE_URL || '');
  await expect(page).toHaveTitle(/Dashboard/);
});