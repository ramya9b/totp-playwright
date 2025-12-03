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
    this.username = process.env.M365_USERNAME!;
    this.password = process.env.M365_PASSWORD!;
    this.totpSecret = process.env.TOTP_SECRET!;
    
    // Initialize Service Principal credentials if available (for CI)
    this.azureClientId = process.env.AZURE_CLIENT_ID;
    this.azureClientSecret = process.env.AZURE_CLIENT_SECRET;
    this.azureTenantId = process.env.AZURE_TENANT_ID;
    
    // Validate required environment variables based on environment
    if (this.isCI && this.azureClientId && this.azureClientSecret && this.azureTenantId) {
      console.log('✅ Running in CI mode with Service Principal authentication');
      this.servicePrincipalAuth = new ServicePrincipalAuth(
        page,
        this.azureClientId,
        this.azureClientSecret,
        this.azureTenantId,
        this.d365Url
      );
    } else {
      console.log('✅ Running in local mode with TOTP authentication');
      if (!this.d365Url || !this.username || !this.password || !this.totpSecret) {
        throw new Error('Missing required environment variables for TOTP authentication');
      }
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
      if (this.servicePrincipalAuth) {
        console.log('🔑 Attempting Service Principal (App Registration) authentication...');
        const success = await this.servicePrincipalAuth.authenticate();
        
        if (success) {
          console.log('✅ Service Principal authentication successful');
          
          // Save session if requested
          if (saveSession) {
            await this.loginPage.saveSession();
          }
          
          return;
        } else {
          console.log('⚠️ Service Principal authentication failed, falling back to TOTP...');
        }
      }
      
      // Fallback to TOTP authentication (original flow)
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
      
      // Step 8: Wait for successful login
      await this.loginPage.waitForLoginSuccess(this.d365Url);
      
      // Step 9: Save session if requested
      if (saveSession) {
        await this.loginPage.saveSession();
      }
      
      // Step 8: Verify homepage is loaded
      await this.homePage.verifyHomepageLoaded();
      
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