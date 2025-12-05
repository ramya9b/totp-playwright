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
    
    if (currentUrl.includes('dynamics.com') || 
        currentUrl.includes('operations.dynamics') ||
        currentUrl.includes('businesscentral.dynamics')) {
      this.log('✅ Already on D365 - MFA not required or already completed');
      return;
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
    const waitTime = isCI ? 5000 : 2000; // Reduced from 8s to 5s since we already waited after password
    
    this.log(`⏱️ Waiting ${waitTime}ms for MFA screen to fully load (CI: ${isCI})...`);
    await this.page.waitForTimeout(waitTime);
    
    // Take screenshot to see what's on screen
    await this.page.screenshot({ path: 'screenshots/mfa-screen-before-detection.png', fullPage: true });
    this.log('📸 Screenshot saved: mfa-screen-before-detection.png');
    
    // Check for "I can't use my Microsoft Authenticator app right now" link
    const cantUseAppSelectors = [
      'a:has-text("I can\'t use my Microsoft Authenticator app right now")',
      'a:has-text("can\'t use")',
      'a:has-text("I can\'t use")',
      'button:has-text("I can\'t use")',
      'a:has-text("another way")',
      'a:has-text("different")',
      'a#signInAnotherWay',
      'div[role="link"]:has-text("can\'t use")'
    ];
    
    let foundAlternativeLink = false;
    for (const selector of cantUseAppSelectors) {
      const element = this.page.locator(selector);
      const timeout = isCI ? 8000 : 3000;
      if (await this.isElementVisible(element, timeout)) {
        this.log(`✅ Found "I can't use my Microsoft Authenticator app right now" link with selector: ${selector}`);
        await this.clickElement(element);
        this.log('✅ Clicked to use alternative method');
        
        // Wait longer for the alternative methods page to fully load
        await this.page.waitForTimeout(5000);
        
        // Take screenshot to see the options
        await this.page.screenshot({ path: 'screenshots/alternative-methods.png', fullPage: true });
        this.log('📸 Screenshot saved: alternative-methods.png');
        
        foundAlternativeLink = true;
        
        // Look for "Use a verification code from my mobile app" option
        const verificationCodeSelectors = [
          'div[data-value="PhoneAppOTP"]',
          'button[data-value="PhoneAppOTP"]',
          'div:has-text("Use a verification code")',
          'button:has-text("Use a verification code")',
          'div:has-text("verification code from my mobile app")',
          'div[role="button"]:has-text("verification code")',
          '[data-value*="OTP"]',
          'div[data-value="PhoneAppNotification"]', // Sometimes this is the parent
        ];
        
        for (const codeSelector of verificationCodeSelectors) {
          const codeElement = this.page.locator(codeSelector);
          if (await this.isElementVisible(codeElement, 5000)) {
            this.log(`✅ Found verification code option with selector: ${codeSelector}`);
            
            // Click and wait for TOTP field
            try {
              await this.clickElement(codeElement);
              this.log('✅ Clicked verification code option');
              
              // Wait for TOTP field to appear
              await this.page.waitForTimeout(5000);
              
              // Take screenshot
              await this.page.screenshot({ path: 'screenshots/after-selecting-totp-method.png', fullPage: true });
              this.log('📸 Screenshot saved: after-selecting-totp-method.png');
              
            } catch (clickError) {
              this.log(`⚠️ Error clicking verification code: ${clickError}`);
            }
            
            break;
          }
        }
        break;
      }
    }
    
    if (!foundAlternativeLink) {
      this.log('⚠️ No "I can\'t use my Microsoft Authenticator app right now" link found');
      this.log('🔍 Checking if TOTP field is already visible without clicking...');
    }
    
    // Only look for TOTP field directly - no other MFA methods
    const totpField = await this.findTOTPField();
    if (totpField) {
      this.log('🔐 TOTP field found - entering code');
      await this.handleTOTPEntry(totpField);
    } else {
      this.log('ℹ️ No TOTP field found - login may be complete');
    }
  }

  /**
   * Handle "Use my password instead" option to bypass Windows Hello
   */
  private async handleUsePasswordInstead(): Promise<boolean> {
    this.log('🔍 Checking for "Use my password instead" option...');
    
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
      this.log('🔍 Detected FIDO/Windows Hello screen - using direct element detection');
      
      // Wait for the page to be interactive
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.page.waitForTimeout(3000);
      
      // Use JavaScript to find and click the sign-in options link
      try {
        const clicked = await this.page.evaluate(() => {
          // Find all links and buttons
          const elements = Array.from(document.querySelectorAll('a, button, div[role="link"], div[role="button"]'));
          
          // Look for sign-in options or password-related text
          for (const element of elements) {
            const text = element.textContent || '';
            const htmlElement = element as HTMLElement;
            
            if (text.toLowerCase().includes('sign-in') || 
                text.toLowerCase().includes('options') || 
                text.toLowerCase().includes('password') ||
                text.toLowerCase().includes('another way')) {
              console.log('Found element:', text);
              htmlElement.click();
              return true;
            }
          }
          return false;
        });
        
        if (clicked) {
          this.log('✅ Clicked sign-in options using JavaScript');
          await this.page.waitForTimeout(3000);
          
          // Now click Password option
          const passwordClicked = await this.page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('div, button, a'));
            for (const element of elements) {
              const text = element.textContent || '';
              const htmlElement = element as HTMLElement;
              
              if (text.trim().toLowerCase() === 'password') {
                console.log('Found Password option');
                htmlElement.click();
                return true;
              }
            }
            return false;
          });
          
          if (passwordClicked) {
            this.log('✅ Clicked Password option using JavaScript');
            await this.page.waitForTimeout(3000);
            
            if (await this.isElementVisible(passwordField, 5000)) {
              this.log('✅ Password field now visible');
              return true;
            }
          }
        }
      } catch (error) {
        this.log(`⚠️ JavaScript clicking failed: ${error}`);
      }
      
      // If JavaScript failed, try pressing Tab + Enter to navigate
      try {
        this.log('🔧 Trying keyboard navigation...');
        await this.page.keyboard.press('Tab');
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Tab');
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(3000);
        
        // Check if we got to password selection
        const passwordClicked = await this.page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          for (const element of elements) {
            const text = element.textContent || '';
            const htmlElement = element as HTMLElement;
            if (text.trim().toLowerCase() === 'password') {
              htmlElement.click();
              return true;
            }
          }
          return false;
        });
        
        if (passwordClicked) {
          this.log('✅ Navigated to password using keyboard');
          await this.page.waitForTimeout(3000);
          
          if (await this.isElementVisible(passwordField, 5000)) {
            this.log('✅ Password field now visible');
            return true;
          }
        }
      } catch (error) {
        this.log(`⚠️ Keyboard navigation failed: ${error}`);
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
      'input[placeholder*="code" i]',
      'input[aria-label*="code" i]',
      'input[aria-label*="verification" i]',
      'input[type="tel"]',
      'input[type="text"][maxlength="6"]',
      'input[maxlength="6"]',
      'input[maxlength="8"]',
      'input[inputmode="numeric"]',
      'input[autocomplete="one-time-code"]',
      'input.form-control[type="text"]'
    ];
    
    const waitTimeout = this.getBrowserTimeout(12000);
    
    for (const selector of totpSelectors) {
      const field = this.page.locator(selector);
      if (await this.isElementVisible(field, waitTimeout)) {
        this.log(`🔐 TOTP field found: ${selector}`);
        return field;
      }
    }
    
    this.log('⚠️ No TOTP field found');
    return null;
  }

  /**
   * Generate and enter TOTP code
   */
  private async handleTOTPEntry(totpField: Locator): Promise<void> {
    this.log('🔐 Generating TOTP code...');
    
    const totp = new OTPAuth.TOTP({
      issuer: 'Microsoft',
      label: this.username,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: this.totpSecret,
    });
    
    const code = totp.generate();
    
    await this.fillInput(totpField, code);
    this.log(`✅ TOTP code entered: ${code}`);
    
    await this.submitTOTPCode();
    await this.page.waitForTimeout(5000);
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