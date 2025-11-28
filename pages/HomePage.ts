import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Homepage Page Object Model
 * Handles D365 homepage interactions and navigation
 */
export class HomePage extends BasePage {
  // Common D365 homepage elements
  private appTiles: Locator;
  private userProfile: Locator;
  private searchBox: Locator;
  private navigationMenu: Locator;
  private settingsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.appTiles = page.locator('[data-testid="app-tile"], .app-tile, [role="button"][aria-label*="app"]');
    this.userProfile = page.locator('[data-testid="user-profile"], .user-profile, [aria-label*="profile"]');
    this.searchBox = page.locator('input[placeholder*="Search"], [data-testid="search"], .search-box input');
    this.navigationMenu = page.locator('.navigation-menu, [data-testid="nav-menu"], .navbar');
    this.settingsButton = page.locator('[data-testid="settings"], [aria-label*="Settings"], .settings-button');
  }

  /**
   * Verify user is on D365 homepage
   */
  async verifyHomepageLoaded(): Promise<void> {
    this.log('🏠 Verifying D365 homepage is loaded...');
    
    const currentUrl = this.getUrl();
    
    // Check if URL contains D365 domain
    const isDynamicsUrl = currentUrl.includes('dynamics.com') || 
                         currentUrl.includes('operations.dynamics') || 
                         currentUrl.includes('sandbox.operations') ||
                         currentUrl.includes('businesscentral.dynamics.com');
    
    if (!isDynamicsUrl) {
      throw new Error(`Not on D365 homepage. Current URL: ${currentUrl}`);
    }
    
    // Wait for page to fully load
    await this.waitForPageLoad();
    
    this.log('✅ D365 homepage verified and loaded');
  }

  /**
   * Navigate to D365 using saved session
   */
  async navigateWithSession(d365Url: string): Promise<void> {
    this.log('🔄 Navigating to D365 with saved session...');
    
    await this.navigateTo(d365Url);
    await this.waitForPageLoad();
    
    // Verify we're on D365 and not redirected to login
    const currentUrl = this.getUrl();
    if (currentUrl.includes('login.microsoftonline.com')) {
      throw new Error('Session expired - redirected to login page');
    }
    
    await this.verifyHomepageLoaded();
  }

  /**
   * Search for content on homepage
   */
  async searchFor(searchTerm: string): Promise<void> {
    this.log(`🔍 Searching for: ${searchTerm}`);
    
    if (await this.isElementVisible(this.searchBox, 5000)) {
      await this.fillInput(this.searchBox, searchTerm);
      await this.page.keyboard.press('Enter');
      await this.waitForPageLoad();
      this.log(`✅ Search completed for: ${searchTerm}`);
    } else {
      this.log('⚠️ Search box not found on homepage');
    }
  }

  /**
   * Click on a specific app tile
   */
  async clickAppTile(appName: string): Promise<void> {
    this.log(`🎯 Clicking on app tile: ${appName}`);
    
    const appTile = this.page.locator(`[aria-label*="${appName}"], [title*="${appName}"], :has-text("${appName}")`);
    
    if (await this.isElementVisible(appTile, 10000)) {
      await this.clickElement(appTile);
      await this.waitForPageLoad();
      this.log(`✅ Successfully clicked app tile: ${appName}`);
    } else {
      this.log(`⚠️ App tile not found: ${appName}`);
      await this.takeScreenshot(`app-tile-not-found-${appName}`);
    }
  }

  /**
   * Verify specific app tiles are present
   */
  async verifyAppTilesPresent(expectedApps: string[]): Promise<void> {
    this.log('🔍 Verifying app tiles are present...');
    
    for (const appName of expectedApps) {
      const appTile = this.page.locator(`[aria-label*="${appName}"], [title*="${appName}"], :has-text("${appName}")`);
      const isVisible = await this.isElementVisible(appTile, 5000);
      
      if (isVisible) {
        this.log(`✅ Found app tile: ${appName}`);
      } else {
        this.log(`❌ Missing app tile: ${appName}`);
      }
    }
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if user profile is accessible
   */
  async verifyUserProfileAccessible(): Promise<void> {
    this.log('👤 Verifying user profile is accessible...');
    
    if (await this.isElementVisible(this.userProfile, 5000)) {
      this.log('✅ User profile is accessible');
    } else {
      this.log('⚠️ User profile not found or not accessible');
    }
  }

  /**
   * Navigate to settings (if available)
   */
  async navigateToSettings(): Promise<void> {
    this.log('⚙️ Navigating to settings...');
    
    if (await this.isElementVisible(this.settingsButton, 5000)) {
      await this.clickElement(this.settingsButton);
      await this.waitForPageLoad();
      this.log('✅ Settings page loaded');
    } else {
      this.log('⚠️ Settings button not found');
    }
  }

  /**
   * Wait for any loading indicators to disappear
   */
  async waitForLoadingComplete(): Promise<void> {
    this.log('⏳ Waiting for page loading to complete...');
    
    const loadingSelectors = [
      '.loading-spinner',
      '[data-testid="loading"]',
      '.spinner',
      '[aria-label*="Loading"]',
      '.loading-indicator'
    ];
    
    for (const selector of loadingSelectors) {
      const loadingElement = this.page.locator(selector);
      try {
        await loadingElement.waitFor({ state: 'hidden', timeout: 10000 });
      } catch {
        // Loading element might not be present, continue
      }
    }
    
    await this.waitForPageLoad();
    this.log('✅ Page loading completed');
  }

  /**
   * Take screenshot of homepage for verification
   */
  async captureHomepageScreenshot(filename: string = 'homepage'): Promise<void> {
    await this.takeScreenshot(filename);
    this.log(`📸 Homepage screenshot captured: ${filename}`);
  }

  /**
   * Verify session is still valid
   */
  async verifySessionValid(): Promise<boolean> {
    try {
      const currentUrl = this.getUrl();
      
      // If we're redirected to login, session is invalid
      if (currentUrl.includes('login.microsoftonline.com') || currentUrl.includes('signin')) {
        this.log('❌ Session invalid - redirected to login');
        return false;
      }
      
      // If we're on D365 domain, session is likely valid
      if (currentUrl.includes('dynamics.com') || 
          currentUrl.includes('operations.dynamics') ||
          currentUrl.includes('sandbox.operations')) {
        this.log('✅ Session appears valid');
        return true;
      }
      
      // Handle special cases
      if (currentUrl === 'about:blank' || currentUrl === '') {
        this.log('⚠️ Page not loaded yet');
        return false;
      }
      
      this.log('⚠️ Session validity unclear');
      return false;
    } catch (error) {
      this.log(`⚠️ Error checking session validity: ${error}`);
      return false;
    }
  }

  /**
   * Log current page information
   */
  async logPageInfo(): Promise<void> {
    const title = await this.getPageTitle();
    const url = this.getUrl();
    
    this.log(`📄 Page Title: ${title}`);
    this.log(`🔗 Current URL: ${url}`);
  }
}