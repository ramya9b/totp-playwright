import { test } from '@playwright/test';
import { loginToDynamics365 } from '../utils/login';

test('Login and save session', async ({ page }) => {
  await loginToDynamics365(page, true);
});