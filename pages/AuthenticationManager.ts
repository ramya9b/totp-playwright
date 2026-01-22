import { Page, BrowserContext } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { MFAPage } from './MFAPage';
import { HomePage } from './HomePage';
import { ServicePrincipalAuth } from './ServicePrincipalAuth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Authentication Manager using Page Object Model
 * Orchestrates the complete login flow with TOTP authentication (local)
 * or Service Principal authentication (CI/CD)
 */
export class AuthenticationManager {
  private page: Page;
  private context: BrowserContext;
  private loginPage: LoginPage;
  private mfaPage: MFAPage;
  private homePage: HomePage;
  private servicePrincipalAuth: ServicePrincipalAuth | null = null;
  
  private d365Url: string;
  private username: string;
  private password: string;
  private totpSecret: string;
  private isCI: boolean;
  
  // Service Principal credentials (optional - for CI/CD)
  private azureClientId?: string;
  private azureClientSecret?: string;
  private azureTenantId?: string;

  constructor(page: Page) {
    this.page = page;
    this.context = page.context();
    
    // Check if running in CI environment
    this.isCI = process.env.CI === 'true';
    
    // Initialize environment variables
    this.d365Url = process.env.D365_URL!;
    this.username = process.env.M365_USERNAME || '';
    this.password = process.env.M365_PASSWORD || '';
    this.totpSecret = process.env.TOTP_SECRET || '';
    
    // Initialize Service Principal credentials if available (for CI)
    this.azureClientId = process.env.AZURE_CLIENT_ID;
    this.azureClientSecret = process.env.AZURE_CLIENT_SECRET;
    this.azureTenantId = process.env.AZURE_TENANT_ID;
    
    // Check if Service Principal credentials are available (takes priority over CI flag)
    const hasServicePrincipalCreds = !!(this.azureClientId && this.azureClientSecret && this.azureTenantId);
    
    console.log(`🔧 CI Environment: ${this.isCI}`);
    console.log(`🔧 Service Principal Credentials Available: ${hasServicePrincipalCreds}`);
    
    // NOTE: Service Principal authentication is disabled because D365 F&O UI doesn't accept
    // Service Principal Bearer tokens for browser-based access. It only works for API calls.
    // We always use TOTP authentication for UI automation.
    console.log('✅ Using TOTP authentication for D365 F&O UI automation');
    if (!this.d365Url || !this.username || !this.password || !this.totpSecret) {
      throw new Error('Missing required environment variables for TOTP authentication. Need: D365_URL, M365_USERNAME, M365_PASSWORD, TOTP_SECRET');
    }
    
    // Initialize page objects (always needed for fallback)
    this.loginPage = new LoginPage(page);
    this.mfaPage = new MFAPage(page, this.totpSecret, this.username);
    this.homePage = new HomePage(page);
  }

  /**
   * Perform complete login flow
   * - Checks if already logged in first
   * - Uses Service Principal authentication in CI (if credentials available)
   * - Falls back to TOTP authentication in local or if Service Principal fails
   */
  async performCompleteLogin(saveSession: boolean = true): Promise<void> {
    console.log('🚀 Starting complete D365 authentication flow...');
    
    try {
      // Step 0: Check if already logged in (navigate to D365 URL first)
      console.log('🔍 Checking if already authenticated...');
      await this.page.goto(this.d365Url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      }).catch(() => {
        console.log('⚠️ Initial navigation check failed, will proceed with authentication');
      });

      // Check if we're already on D365 (not redirected to login)
      const currentUrl = this.page.url();
      const isAlreadyAuthenticated = currentUrl.includes('dynamics.com') && 
                                      !currentUrl.includes('login.microsoftonline.com') &&
                                      !currentUrl.includes('login.windows.net');
      
      if (isAlreadyAuthenticated) {
        console.log('✅ Already authenticated - skipping login flow');
        console.log(`📍 Current URL: ${currentUrl}`);
        
        // Verify session is actually valid by checking for D365 content
        const isSessionValid = await this.homePage.verifySessionValid().catch(() => false);
        
        if (isSessionValid) {
          console.log('✅ Session validated successfully');
          
          // Save session even when already logged in
          if (saveSession) {
            await this.loginPage.saveSession();
          }
          
          return;
        } else {
          console.log('⚠️ Session appears invalid, proceeding with authentication...');
        }
      }
      
      // Try Service Principal authentication first if in CI and credentials are available
      // NOTE: Disabled because Service Principal doesn't work for D365 F&O UI automation
      // if (this.servicePrincipalAuth) {
      //   console.log('🔑 Attempting Service Principal authentication (skip login flow)...');
      //   const success = await this.servicePrincipalAuth.authenticate();
      //   
      //   if (success) {
      //     console.log('✅ Service Principal authentication successful - home page loaded directly');
      //     console.log('⏩ Login flow skipped using Service Principal credentials');
      //     
      //     // Verify homepage is loaded
      //     await this.homePage.verifyHomepageLoaded();
      //     
      //     // Save session if requested
      //     if (saveSession) {
      //       await this.loginPage.saveSession();
      //     }
      //     
      //     return;
      //   } else {
      //     console.log('⚠️ Service Principal authentication failed, falling back to TOTP...');
      //   }
      // }
      
      // Use TOTP authentication (only supported method for D365 F&O UI)
      await this.performTOTPLogin(saveSession);
      
    } catch (error) {
      console.log(`❌ Authentication flow failed: ${error}`);
      await this.loginPage.saveDebugInfo('authentication-manager-error');
      throw error;
    }
  }

  /**
   * Perform TOTP-based login (original flow)
   * Used for local development or as fallback
   */
  private async performTOTPLogin(saveSession: boolean = true): Promise<void> {
    console.log('🚀 Starting TOTP authentication flow...');
    
    try {
      // Step 1: Navigate to login page
      await this.loginPage.navigateToLogin(this.d365Url);
      
      // Step 2: Check if already logged in
      if (await this.loginPage.isAlreadyLoggedIn()) {
        console.log('✅ Already logged in - skipping authentication');
        
        // Still save session even when already logged in
        if (saveSession) {
          await this.loginPage.saveSession();
        }
        
        return;
      }
      
      // Step 3: Enter email
      await this.loginPage.enterEmail(this.username);
      
      // Step 4: Handle Windows Hello bypass if needed
      await this.mfaPage.handleMFAAuthentication();
      
      // Step 5: Enter password
      const passwordEntered = await this.loginPage.enterPassword(this.password);
      
      // Step 6: Always handle MFA after password (for Microsoft Authenticator prompt and TOTP)
      if (passwordEntered) {
        await this.page.waitForTimeout(3000);
        this.loginPage.log('🔐 Handling MFA after password entry (Microsoft Authenticator / TOTP)');
        await this.mfaPage.handleMFAAuthentication();
      }
      
      // Step 7: Handle stay signed in prompt
      await this.loginPage.handleStaySignedInPrompt();
      
      // Step 8: Wait for successful login, but handle cases where the login flow closes the current page
      try {
        await this.loginPage.waitForLoginSuccess(this.d365Url);
      } catch (err) {
        // Sometimes auth redirects open a new tab/window (and close the auth page). Attempt to find and attach to that new page.
        this.loginPage.log('⚠️ waitForLoginSuccess failed - checking for D365 opened in a new page...');
        const dynPage = await this.findDynamicsPage(20000);
        if (dynPage) {
          this.loginPage.log('✅ Found D365 page opened in separate tab; adopting it for the session');
          await this.adoptPage(dynPage);
        } else {
          // Re-throw original error if we couldn't recover
          throw err;
        }
      }

      // Step 9: Verify homepage is loaded FIRST
      await this.homePage.verifyHomepageLoaded();
      
      // Step 10: Wait for network to be completely idle (all cookies/tokens set)
      this.loginPage.log('⏳ Waiting for network to settle...');
      try {
        await this.page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (e) {
        // D365 may not reach full networkidle, but if homepage is verified, proceed
        this.loginPage.log('⚠️ Network idle timeout, but homepage is verified - proceeding...');
        await this.page.waitForTimeout(2000);
      }
      
      // Step 11: Additional buffer to ensure D365 session is fully initialized
      this.loginPage.log('⏳ Additional 2-second buffer for session stability...');
      await this.page.waitForTimeout(2000);
      
      // Step 12: Log cookies for debugging
      const cookies = await this.page.context().cookies();
      this.loginPage.log(`🍪 Total cookies captured: ${cookies.length}`);
      
      // Log critical D365/Azure AD cookies
      const criticalCookies = cookies.filter(c => 
        c.name.includes('ESTSAUTH') || 
        c.name.includes('SignIn') ||
        c.name.includes('.AspNet.') ||
        c.name.includes('dynamics.com')
      );
      this.loginPage.log(`🔑 Critical auth cookies: ${criticalCookies.map(c => c.name).join(', ')}`);
      
      // Step 13: Save session AFTER network idle + buffer
      if (saveSession) {
        await this.loginPage.saveSession();
      }
      
      console.log('🎉 Complete authentication flow successful!');
      
    } catch (error) {
      console.error('❌ Authentication flow failed:', error);
      await this.loginPage.saveDebugInfo('authentication-failure');
      throw error;
    }
  }

  /**
   * Login using saved session (skip full authentication)
   */
  async loginWithSavedSession(sessionPath: string = 'auth/D365AuthFile.json'): Promise<boolean> {
    console.log('🔄 Attempting login with saved session...');
    
    try {
      const fs = require('fs');
      
      // Check if session file exists
      if (!fs.existsSync(sessionPath)) {
        console.log('❌ No saved session found');
        return false;
      }
      
      // Navigate to D365 (session should be automatically applied)
      await this.homePage.navigateWithSession(this.d365Url);
      
      // Verify session is valid
      if (await this.homePage.verifySessionValid()) {
        console.log('✅ Session login successful!');
        return true;
      } else {
        console.log('❌ Saved session is invalid');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Session login failed:', error);
      return false;
    }
  }

  /**
   * Attempt to locate a D365 page if the login flow opened a new tab/window
   * Returns the Page if found, or null if not.
   */
  private async findDynamicsPage(timeout: number = 10000): Promise<any | null> {
    // Check existing pages first
    const pages = this.context.pages();
    for (const p of pages) {
      try {
        const url = p.url();
        if (url && (url.includes('dynamics.com') || url.includes('operations.dynamics') || url.includes('sandbox.operations') || url.includes('businesscentral.dynamics.com'))) {
          return p;
        }
      } catch {
        // ignore
      }
    }

    // Listen for a new page event within timeout
    try {
      const newPage = await this.context.waitForEvent('page', { timeout });
      try {
        // Wait a bit for the new page to navigate
        await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
        const newUrl = newPage.url();
        if (newUrl && (newUrl.includes('dynamics.com') || newUrl.includes('operations.dynamics') || newUrl.includes('sandbox.operations') || newUrl.includes('businesscentral.dynamics.com'))) {
          return newPage;
        }

        // Wait for redirect to dynamics for a short period
        await newPage.waitForURL(url => url.toString().includes('dynamics.com') || url.toString().includes('operations.dynamics') || url.toString().includes('sandbox.operations') || url.toString().includes('businesscentral.dynamics.com'), { timeout: 20000 }).catch(() => {});
        return newPage;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Adopt a newly-opened D365 page so existing page objects point to it
   */
  private async adoptPage(newPage: any): Promise<void> {
    // Replace the page references used across page objects
    this.page = newPage;
    this.context = newPage.context();
    this.loginPage = new LoginPage(newPage);
    this.mfaPage = new MFAPage(newPage, this.totpSecret, this.username);
    this.homePage = new HomePage(newPage);

    // Give the new page a moment to stabilize
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    } catch {
      // ignore
    }
  }

  /**
   * Smart login: Try session first, fallback to full authentication
   */
  async smartLogin(sessionPath: string = 'auth/D365AuthFile.json'): Promise<void> {
    console.log('🧠 Starting smart authentication...');
    
    // First attempt: Use saved session
    const sessionSuccess = await this.loginWithSavedSession(sessionPath);
    
    if (sessionSuccess) {
      console.log('🎯 Smart login completed with saved session');
      return;
    }
    
    // Fallback: Perform full authentication
    console.log('🔄 Session failed, performing full authentication...');
    await this.performCompleteLogin(true);
    console.log('🎯 Smart login completed with full authentication');
  }

  /**
   * Get page objects for test usage
   */
  getPageObjects() {
    return {
      loginPage: this.loginPage,
      mfaPage: this.mfaPage,
      homePage: this.homePage
    };
  }

  /**
   * Check current authentication status
   */
  async getAuthenticationStatus(): Promise<{
    isAuthenticated: boolean;
    currentUrl: string;
    pageTitle: string;
  }> {
    try {
      const currentUrl = this.page.url();
      let pageTitle = '';
      
      try {
        pageTitle = await this.page.title();
      } catch (error) {
        console.log('⚠️ Could not get page title, navigation may be in progress');
        pageTitle = 'Navigation in progress';
      }
      
      const isAuthenticated = await this.homePage.verifySessionValid();

      return {
        isAuthenticated,
        currentUrl,
        pageTitle
      };
    } catch (error) {
      console.log('⚠️ Error getting authentication status:', error);
      return {
        isAuthenticated: false,
        currentUrl: this.page.url() || 'unknown',
        pageTitle: 'Error getting status'
      };
    }
  }  /**
   * Logout from D365 (if logout functionality is available)
   */
  async logout(): Promise<void> {
    console.log('🚪 Attempting to logout...');
    
    // Clear browser storage
    await this.context.clearCookies();
    await this.context.clearPermissions();
    
    // Navigate to logout URL (if available)
    try {
      await this.page.goto(`${this.d365Url}/logout`);
    } catch {
      // Logout URL might not exist, just clear session
    }
    
    console.log('✅ Logout completed');
  }

  /**
   * Refresh authentication if session expires during test
   */
  async refreshAuthentication(): Promise<void> {
    console.log('🔄 Refreshing authentication...');
    
    const currentUrl = this.page.url();
    if (currentUrl.includes('login.microsoftonline.com')) {
      // We're redirected to login, need full authentication
      await this.performCompleteLogin(true);
    } else {
      // Try to refresh by navigating back to D365
      await this.homePage.navigateWithSession(this.d365Url);
    }
  }
}