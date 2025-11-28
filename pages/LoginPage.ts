import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 * Handles Microsoft login page interactions
 */
export class LoginPage extends BasePage {
  // Locators
  private emailInput: Locator;
  private passwordInput: Locator;
  private submitButton: Locator;
  private nextButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[name="loginfmt"], input[type="email"]');
    this.passwordInput = page.locator('input[name="passwd"], input[type="password"]');
    this.submitButton = page.locator('input[type="submit"], button[type="submit"]');
    this.nextButton = page.locator('input[type="submit"], button[type="submit"]');
  }

  /**
   * Navigate to D365 login page
   */
  async navigateToLogin(url: string): Promise<void> {
    this.log('🚀 Navigating to D365 login page...');
    await this.navigateTo(url);
  }

  /**
   * Enter email address
   */
  async enterEmail(email: string): Promise<void> {
    this.log(`📧 Entering email: ${email.substring(0, 3)}***${email.substring(email.indexOf('@'))}`);
    
    await this.waitForElement('input[name="loginfmt"], input[type="email"]', 15000);
    await this.fillInput(this.emailInput, email);
    await this.clickElement(this.nextButton);
    
    this.log('✅ Email entered and submitted');
  }

  /**
   * Enter password
   */
  async enterPassword(password: string): Promise<void> {
    this.log('🔑 Entering password...');
    
    const passwordTimeout = this.getBrowserTimeout(10000);
    await this.waitForElement('input[name="passwd"], input[type="password"]', passwordTimeout);
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.submitButton);
    
    this.log('✅ Password entered and submitted');
    
    // Wait for password submission processing
    await this.waitWithBrowserTiming(4000);
  }

  /**
   * Check if already logged in (bypass login if session exists)
   */
  async isAlreadyLoggedIn(): Promise<boolean> {
    const currentUrl = this.getUrl();
    
    // If we're on login page, definitely not logged in
    if (currentUrl.includes('login.microsoftonline.com') || 
        currentUrl.includes('/login') || 
        currentUrl.includes('signin')) {
      return false;
    }
    
    // If we're on D365 and can see authenticated content, we're logged in
    if (currentUrl.includes('dynamics.com') || 
        currentUrl.includes('operations.dynamics') || 
        currentUrl.includes('sandbox.operations') ||
        currentUrl.includes('businesscentral.dynamics.com')) {
      
      // Double check by looking for login form elements
      const loginFormLocator = this.page.locator('input[name="loginfmt"], input[type="email"]');
      const hasLoginForm = await this.isElementVisible(loginFormLocator, 2000);
      return !hasLoginForm; // If no login form visible, we're logged in
    }
    
    return false;
  }

  /**
   * Wait for login redirect to complete
   */
  async waitForLoginSuccess(targetUrl: string): Promise<void> {
    this.log('⏳ Waiting for login redirect...');
    
    const timeout = this.getBrowserTimeout(60000);
    
    try {
      await this.page.waitForURL(url => {
        const urlStr = url.toString();
        return urlStr.includes('dynamics.com') || 
               urlStr.includes('operations.dynamics') || 
               urlStr.includes('sandbox.operations') ||
               urlStr.includes('businesscentral.dynamics.com');
      }, { timeout });
      
      this.log('🎉 Login redirect successful!');
    } catch (error) {
      this.log('⚠️ Login redirect timeout, checking current URL...');
      
      const currentUrl = this.getUrl();
      if (currentUrl.includes('dynamics.com') || 
          currentUrl.includes('operations.dynamics') ||
          currentUrl.includes('sandbox.operations')) {
        this.log('✅ Login appears successful despite timeout');
        return;
      }
      
      await this.saveDebugInfo('login-failure');
      throw new Error(`Login failed - still on: ${currentUrl}`);
    }
  }

  /**
   * Handle "Stay signed in?" prompt
   */
  async handleStaySignedInPrompt(): Promise<void> {
    this.log('🔍 Checking for "Stay signed in?" prompt...');
    
    const staySignedInSelectors = [
      'input[type="submit"][value="Yes"]',
      'input[type="button"][value="Yes"]',
      'button:has-text("Yes")',
      'input#idBtn_Back',
      'button[data-report-event="Signin_Submit"]',
      'input[value="Yes"]'
    ];
    
    const timeout = this.getBrowserTimeout(8000);
    let promptHandled = false;
    
    for (const selector of staySignedInSelectors) {
      const element = this.page.locator(selector);
      if (await this.isElementVisible(element, timeout)) {
        this.log('❓ Found "Stay signed in?" prompt');
        await this.clickElement(element);
        this.log(`✅ Clicked "Yes" to stay signed in`);
        await this.page.waitForTimeout(4000);
        promptHandled = true;
        break;
      }
    }
    
    if (!promptHandled) {
      this.log('ℹ️ No "Stay signed in?" prompt found');
    }
  }

  /**
   * Save authentication session
   */
  async saveSession(sessionPath: string = 'auth/D365AuthFile.json'): Promise<void> {
    const fs = require('fs');
    if (!fs.existsSync('auth')) {
      fs.mkdirSync('auth');
    }
    
    await this.page.context().storageState({ path: sessionPath });
    this.log(`💾 Session saved to ${sessionPath}`);
  }
}