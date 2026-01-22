import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import * as OTPAuth from 'otpauth';

/**
 * MFA Page Object Model
 * Handles Multi-Factor Authentication interactions including TOTP
 */
export class MFAPage extends BasePage {
  private totpSecret: string;
  private username: string;

  constructor(page: Page, totpSecret: string, username: string) {
    super(page);
    this.totpSecret = totpSecret;
    this.username = username;
  }

  /**
   * Detect and handle MFA screen using multiple strategies
   */
  async handleMFAAuthentication(): Promise<void> {
    this.log('🔍 Detecting MFA screen...');

    // FIRST: Check if we're already past MFA (on D365 or "Stay signed in?")
    const currentUrl = this.page.url();
    this.log(`📍 Current URL: ${currentUrl}`);

    // Check the hostname (not the full URL) to avoid matching redirect parameters
    try {
      const urlObj = new URL(currentUrl);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes('dynamics.com') && !hostname.includes('login.microsoftonline.com')) {
        this.log('✅ Already on D365 - MFA not required or already completed');
        return;
      }
    } catch (error) {
      this.log(`⚠️ Could not parse URL: ${currentUrl}`);
    }

    // Check if "Stay signed in?" prompt is visible (means MFA was skipped)
    const staySignedInButton = this.page.locator('input[type="submit"][value="Yes"]');
    if (await this.isElementVisible(staySignedInButton, 2000)) {
      this.log('✅ "Stay signed in?" prompt visible - MFA appears to have been skipped');
      return;
    }

    // Check for "Use my password instead" option to bypass Windows Hello
    const usePasswordHandled = await this.handleUsePasswordInstead();
    if (usePasswordHandled) {
      this.log('✅ "Use my password instead" handled - continuing with password flow');
      return;
    }

    // Check if we're already on the password page - if so, skip MFA detection
    const passwordField = this.page.locator('input[type="password"][name="passwd"]');
    if (await this.isElementVisible(passwordField, 2000)) {
      this.log('✅ Password field detected - skipping MFA detection (already on password page)');
      return;
    }

    // CRITICAL: Wait longer in CI for Microsoft pages to fully load
    const isCI = process.env.CI === 'true';
    const initialWait = isCI ? 5000 : 2000;

    this.log(`⏱️ Waiting ${initialWait}ms for MFA screen to fully load (CI: ${isCI})...`);
    await this.page.waitForTimeout(initialWait);

    // Take screenshot to see what's on screen
    await this.page.screenshot({ path: 'screenshots/mfa-screen-before-detection.png', fullPage: true });
    this.log('📸 Screenshot saved: mfa-screen-before-detection.png');

    // Helper: Try to click any element whose visible text contains one of the keywords
    const clickOptionByKeywords = async (keywords: string[], timeout = 3000): Promise<boolean> => {
      this.log(`🔎 Looking for verification option keywords: ${keywords.join(', ')}`);
      try {
        // Search in main page first
        for (const kw of keywords) {
          const el = this.page.locator(`text=/${kw}/i`);
          if (await this.isElementVisible(el, timeout)) {
            this.log(`✅ Found option by keyword: ${kw}`);
            await this.clickElement(el);
            this.log(`✅ Clicked keyword option: ${kw}`);
            return true;
          }
        }

        // If not found in main page, scan frames
        for (const frame of this.page.frames()) {
          try {
            for (const kw of keywords) {
              const el = frame.locator(`text=/${kw}/i`);
              if (await this.isElementVisible(el, timeout)) {
                this.log(`✅ Found option in frame by keyword: ${kw}`);
                await el.click();
                this.log(`✅ Clicked frame keyword option: ${kw}`);
                return true;
              }
            }
          } catch (e) {
            // ignore frame errors
          }
        }
      } catch (error) {
        this.log(`⚠️ Error while searching for keyword options: ${error}`);
      }
      return false;
    };

    // Common phrases that indicate an alternative verification option
    const alternativePhrases = [
      "I can't use my Microsoft Authenticator",
      'I can\'t use',
      'Use a different verification option',
      'different verification option',
      'Use a verification code',
      'Use a verification code from my mobile app',
      'Enter code',
      'Text me',
      'Phone',
      'SMS',
      'Email',
      'Receive a code',
      'More verification options',
      'use a verification code',
    ];

    // Try clicking common alternative-link phrases
    let clickedAlternative = await clickOptionByKeywords(alternativePhrases, isCI ? 8000 : 3000);
    if (clickedAlternative) {
      // Wait for options to appear
      await this.page.waitForTimeout(3000);
      await this.page.screenshot({ path: 'screenshots/alternative-methods-extended.png', fullPage: true });
      this.log('📸 Screenshot saved: alternative-methods-extended.png');
      
      // After showing alternatives, try to click on "Use a verification code" or "Enter code"
      const verificationCodeOptions = [
        'use a verification code',
        'use a verification code from my mobile app',
        'enter code',
        'enter a code',
        'verification code'
      ];
      
      const codeOptionClicked = await clickOptionByKeywords(verificationCodeOptions, 3000);
      if (codeOptionClicked) {
        this.log('✅ Clicked "Use a verification code" from alternatives');
        await this.page.waitForTimeout(2000);
      }
    }

    // If still no TOTP field, look for any explicit options (PhoneAppOTP and SMS-like options)
    const explicitOptionKeywords = ['PhoneAppOTP', 'OTP', 'Authenticator app', 'Text', 'SMS', 'Phone call', 'Email code'];
    const explicitClicked = await clickOptionByKeywords(explicitOptionKeywords, isCI ? 5000 : 2000);
    if (explicitClicked) {
      await this.page.waitForTimeout(2000);
      await this.page.screenshot({ path: 'screenshots/explicit-verification-option-clicked.png', fullPage: true });
      this.log('📸 Screenshot saved: explicit-verification-option-clicked.png');

      // After selecting Authenticator app, look for sub-options like "I have a code" or "Enter code"
      const authenticatorCodeKeywords = [
        'I have a code',
        'code from authenticator',
        'code from your authenticator',
        'enter code',
        'enter a code',
        'have a verification code',
        'use a verification code',
        'use a verification code from my mobile app',
        'verification code from my authenticator app'
      ];
      
      let foundAuthenticatorCode = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const authCodeClicked = await clickOptionByKeywords(authenticatorCodeKeywords, 3000);
        if (authCodeClicked) {
          this.log(`✅ Clicked authenticator code option (attempt ${attempt + 1})`);
          foundAuthenticatorCode = true;
          await this.page.waitForTimeout(2000);
          break;
        }
        if (attempt < 2) {
          this.log(`⚠️ Authenticator code option not found, retrying... (${attempt + 1}/3)`);
          await this.page.waitForTimeout(1000);
        }
      }

      // Some flows render the option as a non-clickable div; try JS-clicking its nearest clickable ancestor
      if (!foundAuthenticatorCode) {
        try {
          const jsClicked = await this.page.evaluate(() => {
            const candidates = Array.from(document.querySelectorAll('div, button, a'));
            // Look for multiple variations
            const keywords = ['use a verification code', 'use a verification code from my mobile app', 'i have a code', 'enter code from your authenticator'];
            for (const keyword of keywords) {
              const match = candidates.find(e => (e.textContent || '').toLowerCase().includes(keyword));
              if (match) {
                // Try clicking the element directly, or its parent if not clickable
                try { (match as HTMLElement).click(); return true; } catch {}
                let parent = match.parentElement;
                while (parent) {
                  try { (parent as HTMLElement).click(); return true; } catch {};
                  parent = parent.parentElement;
                }
              }
            }
            return false;
          });
          if (jsClicked) {
            this.log('✅ JS-clicked authenticator code option (or nearest ancestor)');
            await this.page.waitForTimeout(2000);
          }
        } catch (e) {
          this.log(`⚠️ JS click attempt failed: ${e}`);
        }
      }
    }

    // Implement a polling loop to wait for the TOTP field (longer in CI)
    const maxWait = isCI ? 60000 : 15000; // up to 60s in CI
    const pollInterval = 1500;
    let elapsed = 0;
    let totpField: Locator | null = null;

    while (elapsed < maxWait) {
      // First, try to find and click any submit/next/continue buttons that might be needed
      const nextButtonKeywords = ['next', 'continue', 'submit', 'verify', 'send code', 'enter code'];
      const submitClicked = await clickOptionByKeywords(nextButtonKeywords, 500);
      if (submitClicked) {
        this.log('✅ Clicked potential "Next/Continue/Submit" button to advance to TOTP entry');
        await this.page.waitForTimeout(2000);
      }

      // Try to find TOTP in main page
      totpField = await this.findTOTPField();
      if (totpField) break;

      // Try to find TOTP inside frames manually
      for (const frame of this.page.frames()) {
        try {
          for (const sel of [
            'input[placeholder*="code" i]',
            'input[aria-label*="code" i]',
            'input[name="otc"]',
            'input[maxlength="6"]',
          ]) {
            const fLocator = frame.locator(sel);
            if (await this.isElementVisible(fLocator, 1000)) {
              this.log(`🔐 Found TOTP field inside a frame: ${sel}`);
              // Wrap a proxy locator using main page frame locator
              totpField = fLocator as any;
              break;
            }
          }
          if (totpField) break;
        } catch (e) {
          // ignore frame errors
        }
      }

      if (totpField) break;

      // If we see a button like 'Send code' or 'Text me' - click it to trigger field
      const triggerKeywords = ['Send code', 'Send a code', 'Text me', 'Text', 'Send SMS', 'Email', 'Send verification code'];
      const triggered = await clickOptionByKeywords(triggerKeywords, 1000);
      if (triggered) {
        this.log('🔔 Clicked a "send code" type option to trigger TOTP field');
        await this.page.waitForTimeout(2000);
      }

      await this.page.waitForTimeout(pollInterval);
      elapsed += pollInterval;
    }

    if (!totpField) {
      this.log('⚠️ No TOTP field found after extended polling - attempting deeper DOM & keyboard scan');

      // Try keyboard tab scanning to find a focusable numeric input (sometimes the field is focusable but not visible)
      try {
        this.log('🔧 Attempting Tab scan for focused input');
        for (let i = 0; i < 12; i++) {
          await this.page.keyboard.press('Tab');
          await this.page.waitForTimeout(250);
          const activeInfo = await this.page.evaluate(() => {
            const a = document.activeElement as HTMLElement | null;
            if (!a) return null;
            return {
              tag: a.tagName,
              type: (a as HTMLInputElement).type || null,
              aria: a.getAttribute('aria-label'),
              placeholder: (a as HTMLInputElement).placeholder || null,
              maxlength: (a as HTMLInputElement).getAttribute('maxlength') || null,
              role: a.getAttribute('role') || null,
              text: a.textContent?.trim() || null
            };
          });

          if (activeInfo && activeInfo.tag === 'INPUT' && (activeInfo.maxlength === '6' || /code|otp|verification|passcode|one-time/i.test(String(activeInfo.placeholder || '') + String(activeInfo.aria || '') + String(activeInfo.text || '')))) {
            this.log(`✅ Found focused input during tab scan: ${JSON.stringify(activeInfo)}`);
            // Use this focused input as totpField
            const focused = this.page.locator(':focus');
            totpField = focused;
            break;
          }
        }
      } catch (e) {
        this.log(`⚠️ Tab scanning failed: ${e}`);
      }

      // If still no field, attempt to locate potential inputs via a DOM heuristic and click the first matching one
      if (!totpField) {
        this.log('🔎 Running DOM heuristic to find numeric/code inputs');
        const possibleSelectors = [
          'input[mask*="0"]',
          'input[inputmode="numeric"]',
          'input[type="tel"]',
          'input[type="text"][maxlength="6"]',
          'input[type="text"][maxlength="8"]',
          'input[aria-label*="code" i]',
          'input[placeholder*="code" i]'
        ];

        for (const sel of possibleSelectors) {
          try {
            const cand = this.page.locator(sel).first();
            if (await this.isElementVisible(cand, 500)) {
              this.log(`✅ Found candidate TOTP input with selector: ${sel}`);
              await cand.click();
              totpField = cand;
              break;
            }
          } catch {
            // ignore
          }
        }
      }

      // If still not found, gather verbose element list for debugging and bailing out
      if (!totpField) {
        this.log('⚠️ Still no TOTP field after deep scan - collecting verbose element snapshot');
        await this.page.screenshot({ path: 'screenshots/mfa-no-totp-found-deep.png', fullPage: true });

        try {
          const debugText = await this.page.evaluate(() => {
            const out: string[] = [];
            const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"], input[type="submit"], input[type="button"]'));
            out.push(`Buttons/Clickable elements count: ${buttons.length}`);
            buttons.slice(0, 200).forEach((b, i) => {
              const txt = (b.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 200);
              const cls = (b as HTMLElement).className || '';
              out.push(`[${i}] ${b.tagName}.${cls}: "${txt}"`);
            });

            const inputs = Array.from(document.querySelectorAll('input'));
            out.push(`Inputs count: ${inputs.length}`);
            inputs.slice(0, 200).forEach((inp, i) => {
              const t = (inp as HTMLInputElement).type || '';
              const plc = (inp as HTMLInputElement).placeholder || '';
              const aria = (inp as HTMLElement).getAttribute('aria-label') || '';
              const max = (inp as HTMLInputElement).getAttribute('maxlength') || '';
              out.push(`[${i}] input[type=${t} maxlength=${max} aria='${aria}' placeholder='${plc}']`);
            });

            return out.join('\n');
          });

          const fs = require('fs');
          fs.writeFileSync('screenshots/mfa-elements-verbose.txt', debugText);
          this.log('📋 Wrote screenshots/mfa-elements-verbose.txt');
        } catch (e) {
          this.log(`⚠️ Failed to write verbose element snapshot: ${e}`);
        }

        await this.saveDebugInfo('mfa-no-totp-found');
        return;
      }
    }

    // If we found a totp field, proceed with entry
    this.log('✅ TOTP field found - proceeding to enter code');

    // CRITICAL: Wait for field to be fully interactive before generating code
    await totpField.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1000);

    try {
      await this.handleTOTPEntry(totpField);
    } catch (err) {
      this.log(`⚠️ Error during TOTP entry: ${err}`);
      // Attempt a single retry after waiting for fresh window
      await this.page.waitForTimeout(32000);
      const retryField = await this.findTOTPField();
      if (retryField) {
        await this.handleTOTPEntry(retryField);
      } else {
        this.log('❌ Retry failed - TOTP field not found for retry');
        await this.page.screenshot({ path: 'screenshots/totp-final-failure.png', fullPage: true });
        await this.saveDebugInfo('totp-final-failure');
        throw new Error('TOTP authentication could not be completed');
      }
    }

    // After submitting TOTP, wait a short period for next redirect
    await this.page.waitForTimeout(3000);

    // If we detect any error messages, capture and retry once more
    const errorMessage = this.page.locator('text=/didn\'t enter.*expected.*code|incorrect.*code|invalid.*code/i');
    if (await this.isElementVisible(errorMessage, 2000)) {
      this.log('❌ TOTP was rejected - attempting a single retry after fresh window');
      await this.page.screenshot({ path: 'screenshots/totp-error-retry.png', fullPage: true });
      await this.page.waitForTimeout(32000);
      const retryField2 = await this.findTOTPField();
      if (retryField2) {
        await this.handleTOTPEntry(retryField2);
      }
    }

    this.log('✅ MFA handling complete (or skipped if D365 reached)');
  }

  /**
   * Handle "Use my password instead" option to bypass Windows Hello
   */
  private async handleUsePasswordInstead(): Promise<boolean> {
    this.log('🔍 Checking for "Use my password instead" option...');
    
    // First, try to disable WebAuthn JavaScript to force password flow
    try {
      await this.page.evaluate(() => {
        // Disable PublicKeyCredential to prevent FIDO
        if ((window as any).PublicKeyCredential) {
          delete (window as any).PublicKeyCredential;
        }
      });
      this.log('✅ Disabled WebAuthn/PublicKeyCredential');
    } catch (e) {
      this.log(`⚠️ Could not disable WebAuthn: ${e}`);
    }
    
    // Wait longer for page to fully load after email entry
    await this.page.waitForTimeout(5000);
    
    // Check current URL
    const currentUrl = this.page.url();
    this.log(`📍 Current URL: ${currentUrl}`);
    
    // Take screenshot to see what's on screen
    await this.page.screenshot({ path: 'screenshots/after-email-entry.png', fullPage: true });
    this.log('📸 Screenshot saved: after-email-entry.png');
    
    // Check if password field already exists (already on password page)
    const passwordField = this.page.locator('input[type="password"][name="passwd"]');
    if (await this.isElementVisible(passwordField, 2000)) {
      this.log('✅ Password field already visible - no need to bypass Windows Hello');
      return false;
    }
    
    // If on FIDO/Windows Hello screen, use direct element clicking
    if (currentUrl.includes('/fido/')) {
      this.log('🔍 Detected FIDO/Windows Hello screen - using aggressive bypass strategy');
      
      // Wait for the page to be interactive
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.page.waitForTimeout(3000);
      
      // Strategy 1: Look for "Use my password instead" link
      const usePasswordKeywords = [
        'Use my password instead',
        'use password',
        'password sign-in',
        'Sign in with password',
        'Use a password'
      ];
      
      for (const keyword of usePasswordKeywords) {
        const elements = await this.page.locator(`text=/${keyword}/i`).all();
        if (elements.length > 0) {
          this.log(`✅ Found "Use my password instead" option: ${keyword}`);
          try {
            await elements[0].click({ timeout: 5000 });
            this.log('✅ Clicked "Use my password instead"');
            await this.page.waitForTimeout(3000);
            
            if (await this.isElementVisible(passwordField, 5000)) {
              this.log('✅ Password field now visible after clicking "Use my password instead"');
              return true;
            }
          } catch (e) {
            this.log(`⚠️ Click failed, trying alternative method: ${e}`);
          }
        }
      }
      
      // Strategy 2: Use JavaScript to find and click the sign-in options link
      try {
        const clicked = await this.page.evaluate(() => {
          // Find all clickable elements
          const elements = Array.from(document.querySelectorAll('a, button, div[role="link"], div[role="button"], div[tabindex="0"]'));
          
          // Look for sign-in options or password-related text
          for (const element of elements) {
            const text = (element.textContent || '').toLowerCase();
            const htmlElement = element as HTMLElement;
            
            if (text.includes('use my password instead') || 
                text.includes('use password') ||
                text.includes('password sign-in') ||
                text.includes('sign-in options') || 
                text.includes('another way') ||
                text.includes('different option')) {
              console.log('Found password option:', element.textContent);
              htmlElement.click();
              return true;
            }
          }
          return false;
        });
        
        if (clicked) {
          this.log('✅ Clicked "Use my password instead" using JavaScript');
          await this.page.waitForTimeout(3000);
          
          if (await this.isElementVisible(passwordField, 5000)) {
            this.log('✅ Password field now visible');
            return true;
          }
        }
      } catch (error) {
        this.log(`⚠️ JavaScript clicking failed: ${error}`);
      }
      
      // Strategy 3: Try pressing Escape to close FIDO dialog
      try {
        this.log('🔧 Attempting Escape key to close FIDO dialog...');
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(2000);
        
        if (await this.isElementVisible(passwordField, 5000)) {
          this.log('✅ Password field visible after Escape key');
          return true;
        }
      } catch (error) {
        this.log(`⚠️ Escape key attempt failed: ${error}`);
      }
      
      // Strategy 4: Try Tab navigation to find password option
      try {
        this.log('🔧 Trying Tab key navigation...');
        for (let i = 0; i < 5; i++) {
          await this.page.keyboard.press('Tab');
          await this.page.waitForTimeout(300);
        }
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(3000);
        
        if (await this.isElementVisible(passwordField, 5000)) {
          this.log('✅ Password field visible after Tab navigation');
          return true;
        }
      } catch (error) {
        this.log(`⚠️ Tab navigation failed: ${error}`);
      }
    }
    
    this.log('ℹ️ No "Use my password instead" option found');
    return false;
  }

  /**
   * Find TOTP input field
   */
  private async findTOTPField(): Promise<Locator | null> {
    const totpSelectors = [
      'input#idTxtBx_SAOTCC_OTC',
      'input[name="otc"]',
      'input[name="verificationCode"]',
      'input[name="code"]',
      'input[placeholder*="code" i]',
      'input[placeholder*="verification" i]',
      'input[placeholder*="authenticator" i]',
      'input[aria-label*="code" i]',
      'input[aria-label*="verification" i]',
      'input[aria-label*="authenticator" i]',
      'input[aria-label*="totp" i]',
      'input[type="tel"]',
      'input[type="text"][maxlength="6"]',
      'input[maxlength="6"]',
      'input[maxlength="8"]',
      'input[inputmode="numeric"]',
      'input[autocomplete="one-time-code"]',
      'input.form-control[type="text"]',
      'input[data-testid*="code" i]',
      'input[data-testid*="verification" i]'
    ];
    
    const waitTimeout = this.getBrowserTimeout(12000);
    
    for (const selector of totpSelectors) {
      const field = this.page.locator(selector);
      if (await this.isElementVisible(field, waitTimeout)) {
        this.log(`🔐 TOTP field found: ${selector}`);
        return field;
      }
    }
    
    this.log('⚠️ No TOTP field found with standard selectors');
    return null;
  }

  /**
   * Generate and enter TOTP code
   * NOTE: This is called AFTER the TOTP field is already found and visible
   */
  private async handleTOTPEntry(totpField: Locator): Promise<void> {
    this.log('🔐 TOTP field is ready - preparing for code entry...');
    this.log(`🕐 Current system time: ${new Date().toISOString()}`);
    
    // Take screenshot before code generation
    await this.page.screenshot({ path: 'screenshots/before-totp-entry.png', fullPage: true });
    this.log('📸 Screenshot: before-totp-entry.png');
    
    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
      issuer: 'Microsoft',
      label: this.username,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: this.totpSecret,
    });
    
    // Clear any existing value first
    this.log('🧹 Clearing TOTP field...');
    await totpField.click({ clickCount: 3 }); // Triple-click to select all
    await this.page.keyboard.press('Backspace');
    await this.page.waitForTimeout(200);
    await totpField.focus();
    await this.page.waitForTimeout(200);
    
    // Check current time window
    let currentTime = Math.floor(Date.now() / 1000);
    let timeRemaining = 30 - (currentTime % 30);
    this.log(`⏱️ Current TOTP window has ${timeRemaining} seconds remaining`);
    
    // CRITICAL: If less than 20 seconds remain, wait for fresh window
    if (timeRemaining < 20) {
      this.log(`⏳ Less than 20s remaining - waiting for fresh TOTP window...`);
      const waitTime = timeRemaining + 2;
      this.log(`⏳ Waiting ${waitTime} seconds...`);
      await this.page.waitForTimeout(waitTime * 1000);
      this.log('✅ Now in fresh TOTP window');
    }
    
    // ============================================
    // GENERATE CODE AT ABSOLUTE LAST MOMENT
    // ============================================
    this.log('🔑 Generating TOTP code RIGHT NOW (immediately before typing)...');
    const code = totp.generate();
    currentTime = Math.floor(Date.now() / 1000);
    timeRemaining = 30 - (currentTime % 30);
    
    this.log(`🔑 TOTP Code: ${code}`);
    this.log(`🕐 Generated at: ${new Date().toISOString()}`);
    this.log(`⏱️ Valid for: ${timeRemaining} seconds`);
    
    // Show debugging codes
    const nextCode = totp.generate({ timestamp: (currentTime + 30) * 1000 });
    const prevCode = totp.generate({ timestamp: (currentTime - 30) * 1000 });
    this.log(`📋 Debug - Previous: ${prevCode} | Current: ${code} | Next: ${nextCode}`);
    
    // ============================================
    // IMMEDIATELY TYPE THE CODE (NO DELAYS)
    // ============================================
    this.log(`⌨️ Typing code immediately: ${code}`);
    
    // Type INSTANTLY without character delays
    await totpField.fill(code);
    await this.page.waitForTimeout(300);
    
    // Verify entry
    const enteredValue = await totpField.inputValue();
    this.log(`🔍 Entered value: "${enteredValue}"`);
    
    if (enteredValue !== code) {
      this.log(`⚠️ MISMATCH! Expected: "${code}", Got: "${enteredValue}"`);
      await this.page.screenshot({ path: 'screenshots/totp-entry-mismatch.png', fullPage: true });
      
      // Regenerate and retry
      this.log('🔄 Clearing and regenerating...');
      await totpField.clear();
      await this.page.waitForTimeout(200);
      
      const freshCode = totp.generate();
      this.log(`🔑 Fresh code: ${freshCode}`);
      await totpField.fill(freshCode);
      await this.page.waitForTimeout(200);
    } else {
      this.log(`✅ Code entered correctly: ${code}`);
    }
    
    // Take screenshot before submit
    await this.page.screenshot({ path: 'screenshots/before-totp-submit.png', fullPage: true });
    this.log('📸 Screenshot: before-totp-submit.png');
    
    // Small delay before submitting
    await this.page.waitForTimeout(300);
    
    this.log('🕐 Submitting code immediately...');
    
    await this.submitTOTPCode();
    
    // Wait for submission to process
    await this.page.waitForTimeout(3000);
    
    // Take screenshot after submit
    await this.page.screenshot({ path: 'screenshots/after-totp-submit.png', fullPage: true });
    this.log('📸 Screenshot: after-totp-submit.png');
  }

  /**
   * Submit TOTP code
   */
  private async submitTOTPCode(): Promise<void> {
    const submitSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'input[value="Submit"]',
      'button:has-text("Submit")',
      'button:has-text("Verify")'
    ];
    
    for (const selector of submitSelectors) {
      const element = this.page.locator(selector);
      if (await this.isElementVisible(element, 2000)) {
        await this.clickElement(element);
        this.log(`✅ Submitted TOTP with: ${selector}`);
        break;
      }
    }
  }
}