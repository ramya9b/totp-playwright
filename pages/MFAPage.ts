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
    
    // Check for "I can't use my Microsoft Authenticator app right now" link
    const cantUseAppSelectors = [
      'a:has-text("I can\'t use my Microsoft Authenticator app right now")',
      'a:has-text("can\'t use")',
      'a:has-text("I can\'t use")',
      'button:has-text("I can\'t use")',
      'a#signInAnotherWay'
    ];
    
    for (const selector of cantUseAppSelectors) {
      const element = this.page.locator(selector);
      if (await this.isElementVisible(element, 3000)) {
        this.log('✅ Found "I can\'t use my Microsoft Authenticator app right now" link');
        await this.clickElement(element);
        this.log('✅ Clicked to use alternative method');
        await this.page.waitForTimeout(3000);
        
        // Look for "Use a verification code from my mobile app" option
        const verificationCodeSelectors = [
          'div[data-value="PhoneAppOTP"]',
          'button[data-value="PhoneAppOTP"]',
          'div:has-text("Use a verification code")',
          'button:has-text("Use a verification code")',
          'div:has-text("verification code from my mobile app")',
          'div[role="button"]:has-text("verification code")'
        ];
        
        for (const codeSelector of verificationCodeSelectors) {
          const codeElement = this.page.locator(codeSelector);
          if (await this.isElementVisible(codeElement, 3000)) {
            this.log('✅ Found verification code option');
            await this.clickElement(codeElement);
            this.log('✅ Clicked verification code option');
            await this.page.waitForTimeout(3000);
            break;
          }
        }
        break;
      }
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
      'input[type="tel"]',
      'input[maxlength="6"]',
      'input[inputmode="numeric"]'
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