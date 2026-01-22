import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model class
 * Contains common functionality shared across all page objects
 */
export class BasePage {
  protected page: Page;
  protected browserName: string;

  constructor(page: Page) {
    this.page = page;
    this.browserName = page.context().browser()?.browserType().name() || 'unknown';
  }

  /**
   * Navigate to a specific URL
   */
  async navigateTo(url: string): Promise<void> {
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (err: any) {
      // Ignore navigation interruption caused by immediate redirect to account provider
      const msg = (err && err.message) ? err.message as string : '';
      if (msg.includes('interrupted by another navigation') || msg.includes('Navigation cancelled')) {
        this.log(`⚠️ Navigation was interrupted by a redirect (expected for auth flows): ${msg}`);
        return;
      }
      // Re-throw unexpected errors
      throw err;
    }
  }

  /**
   * Get current page URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // D365 often doesn't reach true 'networkidle' due to background activity
      // Fallback to checking DOM is ready
      this.log('⚠️ networkidle timeout, falling back to domcontentloaded');
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    }
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(filename: string): Promise<void> {
    await this.page.screenshot({ 
      path: `screenshots/${filename}-${this.browserName}.png`, 
      fullPage: true 
    });
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    await this.page.waitForSelector(selector, { timeout });
    return this.page.locator(selector);
  }

  /**
   * Click element with retry logic
   */
  async clickElement(locator: Locator): Promise<void> {
    await locator.click();
  }

  /**
   * Fill input field
   */
  async fillInput(locator: Locator, value: string): Promise<void> {
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Wait with browser-specific timing
   */
  async waitWithBrowserTiming(baseTime: number): Promise<void> {
    let waitTime = baseTime;
    
    if (this.browserName === 'webkit') {
      waitTime = baseTime * 2; // WebKit needs more time
    } else if (this.browserName === 'firefox') {
      waitTime = baseTime * 1.5; // Firefox needs extra time
    }
    
    await this.page.waitForTimeout(waitTime);
  }

  /**
   * Check if element is visible with timeout
   */
  async isElementVisible(locator: Locator, timeout: number = 2000): Promise<boolean> {
    try {
      return await locator.isVisible({ timeout });
    } catch {
      return false;
    }
  }

  /**
   * Get browser-specific timeout
   */
  getBrowserTimeout(baseTimeout: number): number {
    if (this.browserName === 'webkit') {
      return baseTimeout * 2;
    } else if (this.browserName === 'firefox') {
      return baseTimeout * 1.2;
    }
    return baseTimeout;
  }

  /**
   * Log action with browser context
   */
  log(message: string): void {
    console.log(`🌐 [${this.browserName}] ${message}`);
  }

  /**
   * Save page state for debugging
   */
  async saveDebugInfo(prefix: string): Promise<void> {
    const fs = require('fs');
    
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }
    
    await this.takeScreenshot(`${prefix}-debug`);
    const html = await this.page.content();
    fs.writeFileSync(`screenshots/${prefix}-debug-${this.browserName}.html`, html);
    fs.writeFileSync(`screenshots/${prefix}-debug-${this.browserName}-url.txt`, this.getUrl());
  }
}