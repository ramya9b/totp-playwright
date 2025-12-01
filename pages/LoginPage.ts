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
   * Handle account selection if it appears
   */
  async handleAccountSelection(email: string): Promise<boolean> {
    this.log('🔍 Checking for account selection screen...');
    
    // Wait a bit for the page to render
    await this.page.waitForTimeout(3000);
    
    // Check if we're on account selection/reprocess screen
    const currentUrl = this.getUrl();
    if (!currentUrl.includes('select_account') && !currentUrl.includes('reprocess')) {
      this.log('ℹ️ Not on account selection screen');
      return false;
    }
    
    this.log('✅ Detected account selection/reprocess screen');
    
    // Save HTML snapshot for debugging
    const fs = require('fs');
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }
    const html = await this.page.content();
    fs.writeFileSync('screenshots/account-selection-page.html', html);
    await this.page.screenshot({ path: 'screenshots/account-selection-page.png', fullPage: true });
    this.log('📸 Saved account selection page snapshot');
    
    // Strategy 1: Look for exact email match in clickable elements
    const accountSelectors = [
      `div[data-test-id*="${email}"]`,
      `div[data-test-id]:has-text("${email}")`,
      `div.table-cell:has-text("${email}")`,
      `div.table:has-text("${email}")`,
      `div[role="button"]:has-text("${email}")`,
      `button:has-text("${email}")`,
      `div[title*="${email}"]`,
      `div.row:has-text("${email}")`,
      `[data-bind*="account"]:has-text("${email}")`,
      `a:has-text("${email}")`,
      `span:has-text("${email}")`,
    ];
    
    for (const selector of accountSelectors) {
      const accountElement = this.page.locator(selector).first();
      if (await this.isElementVisible(accountElement, 2000)) {
        this.log(`✅ Found account tile: ${selector}`);
        // Try clicking the element or its parent
        try {
          await this.clickElement(accountElement);
          this.log('✅ Clicked account tile');
          await this.page.waitForTimeout(3000);
          return true;
        } catch {
          // Try clicking parent
          const parent = accountElement.locator('..');
          if (await this.isElementVisible(parent, 1000)) {
            await parent.click();
            this.log('✅ Clicked account tile parent');
            await this.page.waitForTimeout(3000);
            return true;
          }
        }
      }
    }
    
    // Strategy 2: Look for email username (before @) in elements
    const username = email.split('@')[0];
    const usernameSelectors = [
      `div:has-text("${username}")`,
      `[data-test-id]:has-text("${username}")`,
    ];
    
    for (const selector of usernameSelectors) {
      const element = this.page.locator(selector).first();
      if (await this.isElementVisible(element, 2000)) {
        this.log(`✅ Found account by username: ${selector}`);
        await this.clickElement(element);
        this.log('✅ Clicked account by username');
        await this.page.waitForTimeout(3000);
        return true;
      }
    }
    
    // Strategy 3: Look for any clickable tile/row and click the first one
    const genericSelectors = [
      'div[data-test-id][role="button"]',
      'div.table-row[role="button"]',
      'div.tile[data-test-id]',
    ];
    
    for (const selector of genericSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        this.log(`✅ Found ${count} account tiles, clicking first one`);
        await elements.first().click();
        this.log('✅ Clicked first account tile');
        await this.page.waitForTimeout(3000);
        return true;
      }
    }
    
    // Strategy 4: Log all buttons/clickable elements for debugging
    this.log('🔍 Scanning for all clickable elements...');
    const allButtons = await this.page.locator('button, input[type="submit"], input[type="button"], div[role="button"], a[role="button"]').all();
    this.log(`Found ${allButtons.length} clickable elements total`);
    
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const text = await allButtons[i].textContent().catch(() => 'N/A');
      const tag = await allButtons[i].evaluate(el => el.tagName).catch(() => 'N/A');
      const classes = await allButtons[i].evaluate(el => el.className).catch(() => 'N/A');
      this.log(`  [${i}] ${tag}.${classes}: "${text}"`);
    }
    
    this.log('⚠️ Could not find clickable account element');
    await this.saveDebugInfo('account-selection-failure');
    return false;
  }

  /**
   * Enter email address
   */
  async enterEmail(email: string): Promise<void> {
    this.log(`📧 Entering email: ${email.substring(0, 3)}***${email.substring(email.indexOf('@'))}`);
    
    // First check if account selection screen is present
    const accountSelected = await this.handleAccountSelection(email);
    
    if (accountSelected) {
      this.log('✅ Account selected from picker');
      return; // Skip email entry if account was selected
    }
    
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
    
    // Check for account selection screen after password
    const email = process.env.M365_USERNAME!;
    await this.handleAccountSelection(email);
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
    
    // Use longer timeout in CI environment
    const isCI = process.env.CI === 'true';
    const timeout = isCI ? 120000 : this.getBrowserTimeout(60000); // 2 minutes in CI
    
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
      
      // Check if we're on a reprocess/account selection screen
      if (currentUrl.includes('reprocess') || currentUrl.includes('select_account')) {
        this.log('🔄 Detected reprocess/account selection, attempting recovery...');
        
        // Try to handle account selection again
        const email = process.env.M365_USERNAME!;
        const accountHandled = await this.handleAccountSelection(email);
        
        if (accountHandled) {
          // Wait again for redirect after account selection
          await this.page.waitForURL(url => {
            const urlStr = url.toString();
            return urlStr.includes('dynamics.com') || 
                   urlStr.includes('operations.dynamics') || 
                   urlStr.includes('sandbox.operations') ||
                   urlStr.includes('businesscentral.dynamics.com');
          }, { timeout: 60000 });
          
          this.log('✅ Login successful after account selection recovery');
          return;
        }
        
        // If account selection didn't work, try clicking through any remaining prompts
        const continueSelectors = [
          'input[type="submit"]',
          'button[type="submit"]',
          'input[value="Continue"]',
          'button:has-text("Continue")',
          'input[value="Next"]',
          'button:has-text("Next")'
        ];
        
        for (const selector of continueSelectors) {
          const element = this.page.locator(selector);
          if (await this.isElementVisible(element, 2000)) {
            this.log(`🔄 Clicking continue button: ${selector}`);
            await this.clickElement(element);
            await this.page.waitForTimeout(3000);
            
            // Check if we're now on D365
            const newUrl = this.getUrl();
            if (newUrl.includes('dynamics.com') || 
                newUrl.includes('operations.dynamics') ||
                newUrl.includes('sandbox.operations')) {
              this.log('✅ Login successful after continue button');
              return;
            }
          }
        }
      }
      
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