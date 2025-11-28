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
    
    const mfaDetectionStrategies = [
      () => this.detectDirectTOTPField(),
      () => this.detectSignInAnotherWay(),
      () => this.detectDirectCodeOption(),
      () => this.detectMFATextIndicators()
    ];
    
    let mfaResult = null;
    for (const strategy of mfaDetectionStrategies) {
      mfaResult = await strategy();
      if (mfaResult) {
        break;
      }
    }
    
    if (mfaResult) {
      this.log(`🔍 MFA detected with strategy: ${mfaResult.type}`);
      await this.processMFAResult(mfaResult);
    } else {
      this.log('ℹ️ No MFA screen detected - checking if login completed');
    }
  }

  /**
   * Strategy 1: Direct TOTP field detection
   */
  private async detectDirectTOTPField(): Promise<any> {
    const directTotpSelectors = [
      'input#idTxtBx_SAOTCC_OTC',
      'input[name="otc"]',
      'input[placeholder*="code" i]',
      'input[aria-label*="code" i]',
      'input[maxlength="6"]'
    ];
    
    for (const selector of directTotpSelectors) {
      const element = this.page.locator(selector);
      if (await this.isElementVisible(element, 2000)) {
        this.log(`🔐 Direct TOTP field found: ${selector}`);
        return { type: 'direct-totp', element };
      }
    }
    return null;
  }

  /**
   * Strategy 2: "Sign in another way" detection
   */
  private async detectSignInAnotherWay(): Promise<any> {
    const anotherWaySelectors = [
      'a#signInAnotherWay',
      'a:has-text("Sign in another way")',
      'a[data-bind*="signInAnotherWay"]',
      'button:has-text("Sign in another way")',
      'a:has-text("Use another verification method")',
      'a:has-text("Try another way")'
    ];
    
    for (const selector of anotherWaySelectors) {
      const element = this.page.locator(selector);
      if (await this.isElementVisible(element, 2000)) {
        this.log(`🔄 Found "Sign in another way": ${selector}`);
        return { type: 'another-way', element };
      }
    }
    return null;
  }

  /**
   * Strategy 3: Direct verification code option detection
   */
  private async detectDirectCodeOption(): Promise<any> {
    const codeOptionSelectors = [
      'div[data-value="PhoneAppOTP"]',
      'button[data-value="PhoneAppOTP"]',
      'div:has-text("Use a verification code")',
      'button:has-text("Use a verification code")',
      'div:has-text("authenticator app")'
    ];
    
    for (const selector of codeOptionSelectors) {
      const element = this.page.locator(selector);
      if (await this.isElementVisible(element, 2000)) {
        this.log(`✅ Found direct verification code option: ${selector}`);
        return { type: 'direct-code-option', element };
      }
    }
    return null;
  }

  /**
   * Strategy 4: Text-based MFA detection
   */
  private async detectMFATextIndicators(): Promise<any> {
    const textIndicators = [
      'More information required',
      'verify your identity',
      'Approve a request',
      'authenticator',
      'verification code',
      'Two-step verification'
    ];
    
    for (const text of textIndicators) {
      const element = this.page.locator(`div:has-text("${text}"), span:has-text("${text}"), p:has-text("${text}")`);
      if (await this.isElementVisible(element, 1000)) {
        this.log(`🔍 Found MFA text indicator: "${text}"`);
        return { type: 'text-indicator', text };
      }
    }
    return null;
  }

  /**
   * Process MFA detection result
   */
  private async processMFAResult(mfaResult: any): Promise<void> {
    switch (mfaResult.type) {
      case 'direct-totp':
        if ('element' in mfaResult) {
          await this.handleTOTPEntry(mfaResult.element);
        }
        break;
        
      case 'another-way':
        if ('element' in mfaResult) {
          await mfaResult.element.click();
          this.log('🔄 Clicked "Sign in another way"');
          await this.waitWithBrowserTiming(4000);
          await this.handleVerificationCodeSelection();
        }
        break;
        
      case 'direct-code-option':
        if ('element' in mfaResult) {
          await mfaResult.element.click();
          this.log('✅ Clicked verification code option');
          await this.page.waitForTimeout(3000);
          
          const totpField = await this.findTOTPField();
          if (totpField) {
            await this.handleTOTPEntry(totpField);
          }
        }
        break;
        
      case 'text-indicator':
        this.log('📝 MFA text detected, searching for interactive elements...');
        await this.handleVerificationCodeSelection();
        break;
    }
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
   * Handle verification code selection from menu
   */
  private async handleVerificationCodeSelection(): Promise<void> {
    const codeOptions = [
      'div[data-value="PhoneAppOTP"]',
      'button[data-value="PhoneAppOTP"]',
      'div:has-text("Use a verification code")',
      'button:has-text("Use a verification code")',
      'div:has-text("verification code")',
      'div[role="button"]:has-text("verification")',
      'a:has-text("verification code")',
      'div:has-text("authenticator app")'
    ];
    
    this.log('🔍 Looking for verification code option...');
    let codeOptionSelected = false;
    
    for (const selector of codeOptions) {
      try {
        const element = this.page.locator(selector);
        const timeout = this.getBrowserTimeout(3000);
        
        if (await this.isElementVisible(element, timeout)) {
          this.log(`✅ Found verification code option: ${selector}`);
          await this.clickElement(element);
          this.log('✅ Clicked verification code option');
          codeOptionSelected = true;
          
          await this.page.waitForTimeout(3000);
          
          const totpField = await this.findTOTPField();
          if (totpField) {
            await this.handleTOTPEntry(totpField);
          }
          break;
        }
      } catch (error) {
        this.log(`❌ Selector ${selector} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (!codeOptionSelected) {
      this.log('⚠️ Could not find verification code option');
      await this.takeScreenshot('mfa-debug');
    }
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