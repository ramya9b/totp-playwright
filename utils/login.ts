import { Page } from '@playwright/test';
import * as OTPAuth from 'otpauth';
import dotenv from 'dotenv';

// Load environment variables (support .env and optional credentials.env for backward compatibility)
dotenv.config();
dotenv.config({ path: 'credentials.env' });

export async function loginToDynamics365(page: Page, saveSession = true) {
  // Support both old and current env var names for flexibility
  const DM365_PAGE_URL = process.env.DM365_PAGE_URL || process.env.D365_URL;
  const M365_OTP_SECRET = process.env.M365_OTP_SECRET || process.env.TOTP_SECRET;
  const { M365_USERNAME, M365_PASSWORD } = process.env;

  if (!DM365_PAGE_URL || !M365_USERNAME || !M365_PASSWORD || !M365_OTP_SECRET) {
    throw new Error('Missing required environment variables');
  }

  await page.goto(DM365_PAGE_URL);
  await page.waitForSelector('input[name="loginfmt"]');
  await page.fill('input[name="loginfmt"]', M365_USERNAME);
  await page.click('input[type="submit"]');

  await page.fill('input[name="passwd"]', M365_PASSWORD);
  await page.click('input[type="submit"]');

  // Always try to select TOTP/code-based MFA if available
  const otherWayLink = page.locator('a#signInAnotherWay');
  if (await otherWayLink.isVisible({ timeout: 10000 }).catch(() => false)) {
    await otherWayLink.click();
    // Wait for the list of MFA options to appear
    await page.waitForTimeout(1000); // Give time for options to render
    // Try multiple selectors for the TOTP/code option
    const codeOption = page.locator('div[data-value="PhoneAppOTP"], div[role="option"]:has-text("verification code"), div[role="option"]:has-text("code from your authenticator app"), div[role="option"]:has-text("code")');
    if (await codeOption.first().isVisible({ timeout: 10000 }).catch(() => false)) {
      await codeOption.first().click();
    } else {
      // Try clicking any option containing 'code'
      const fallbackOption = page.locator('div[role="option"]:has-text("code")');
      if (await fallbackOption.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await fallbackOption.first().click();
      }
    }
    await page.waitForTimeout(500); // Wait for transition
  }

  // Only handle OTP if the field appears (MFA enabled)
  const otpField = page.locator('input#idTxtBx_SAOTCC_OTC');
  if (await otpField.isVisible({ timeout: 10000 }).catch(() => false)) {
    const totp = new OTPAuth.TOTP({
      issuer: 'Microsoft',
      label: M365_USERNAME,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: M365_OTP_SECRET,
    });
    const code = totp.generate();
    await otpField.fill(code);
    await page.click('input[type="submit"]');
  }

  // Handle 'Stay signed in?' prompt if it appears
  const staySignedIn = page.locator('input[type=submit][value="Yes"]');
  if (await staySignedIn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await staySignedIn.click();
  }

  // Wait for Dynamics 365 URL or dashboard to load
  try {
    await page.waitForURL(DM365_PAGE_URL, { timeout: 60000 });
  } catch (e) {
    // Capture screenshot, HTML, and URL for debugging
    await page.screenshot({ path: 'auth/login-failure.png', fullPage: true });
    const html = await page.content();
    const currentUrl = page.url();
    const fs = require('fs');
    fs.writeFileSync('auth/login-failure.html', html);
    fs.writeFileSync('auth/login-failure-url.txt', currentUrl);
    console.error('❌ Login did not reach Dynamics 365. See auth/login-failure.png, .html, and .txt for details.');
    throw e;
  }

  if (saveSession) {
    await page.context().storageState({ path: 'auth/D365AuthFile.json' });
  }
}