import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Service Principal (App Registration) Authentication for CI/CD
 * 
 * This approach uses Azure AD App Registration with client credentials
 * to authenticate without interactive MFA, suitable for automated pipelines.
 * 
 * Prerequisites:
 * 1. Create Azure AD App Registration
 * 2. Grant necessary API permissions for D365
 * 3. Create client secret
 * 4. Store credentials in pipeline variables:
 *    - AZURE_CLIENT_ID
 *    - AZURE_CLIENT_SECRET
 *    - AZURE_TENANT_ID
 */
export class ServicePrincipalAuth extends BasePage {
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private d365Url: string;

  constructor(
    page: Page,
    clientId: string,
    clientSecret: string,
    tenantId: string,
    d365Url: string
  ) {
    super(page);
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tenantId = tenantId;
    this.d365Url = d365Url;
  }

  /**
   * Authenticate using Service Principal (OAuth2 Client Credentials Flow)
   * This method skips login and navigates directly to D365 home page
   */
  async authenticate(): Promise<boolean> {
    try {
      this.log('🔐 Starting Service Principal authentication...');
      this.log(`📋 Tenant ID: ${this.tenantId}`);
      this.log(`📋 Client ID: ${this.clientId.substring(0, 8)}...`);

      // Step 0: Check if already authenticated
      this.log('🔍 Checking if already authenticated...');
      const alreadyAuthenticated = await this.checkExistingAuthentication();
      
      if (alreadyAuthenticated) {
        this.log('✅ Already authenticated - skipping token acquisition');
        return true;
      }

      // Step 1: Get OAuth2 token using client credentials
      this.log('🔑 Obtaining OAuth2 access token...');
      const token = await this.getAccessToken();
      
      if (!token) {
        this.log('❌ Failed to obtain access token');
        return false;
      }

      this.log('✅ Access token obtained successfully');

      // Step 2: Navigate directly to D365 home page (skip login)
      this.log('🏠 Navigating directly to D365 home page...');
      await this.navigateDirectlyToHomePage(token);

      // Step 3: Verify successful authentication
      const isAuthenticated = await this.verifyAuthentication();

      if (isAuthenticated) {
        this.log('✅ Service Principal authentication successful - home page loaded');
        return true;
      } else {
        this.log('❌ Service Principal authentication verification failed');
        return false;
      }
    } catch (error) {
      this.log(`❌ Service Principal authentication error: ${error}`);
      await this.saveDebugInfo('service-principal-auth-error');
      return false;
    }
  }

  /**
   * Get OAuth2 access token using client credentials flow
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      this.log('🔑 Requesting OAuth2 access token...');

      const tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      // Use the specific D365 instance URL as the resource scope
      // Extract base URL from D365 URL (e.g., https://avs-isv-puat.sandbox.operations.dynamics.com)
      const d365BaseUrl = new URL(this.d365Url).origin;
      const scope = `${d365BaseUrl}/.default`;

      // Prepare form data for token request
      const formData = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: scope,
      });

      this.log(`📡 Token endpoint: ${tokenEndpoint}`);
      this.log(`📡 Scope: ${scope}`);

      // Make token request using Playwright's page.request API
      const response = await this.page.request.post(tokenEndpoint, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: formData.toString(),
      });

      if (!response.ok()) {
        const errorText = await response.text();
        this.log(`❌ Token request failed: ${response.status()} ${response.statusText()}`);
        this.log(`❌ Error response: ${errorText}`);
        return null;
      }

      const tokenResponse = await response.json();
      
      if (!tokenResponse.access_token) {
        this.log('❌ No access token in response');
        return null;
      }

      this.log('✅ Access token received');
      return tokenResponse.access_token;
    } catch (error) {
      this.log(`❌ Error getting access token: ${error}`);
      return null;
    }
  }

  /**
   * Navigate directly to D365 home page, bypassing login screens
   */
  private async navigateDirectlyToHomePage(token: string): Promise<void> {
    try {
      this.log('🏠 Navigating directly to D365 home page (skip login)...');

      // Set up route interception to add auth token to all requests
      await this.page.route('**/*', async (route) => {
        const headers = {
          ...route.request().headers(),
          'Authorization': `Bearer ${token}`,
        };
        await route.continue({ headers });
      });

      this.log('🔐 Authorization headers configured for all requests');

      // Navigate directly to D365 home page URL
      await this.page.goto(this.d365Url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      this.log('📍 Direct navigation to home page complete');

      // Wait for page to fully load
      await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        this.log('⚠️ Network idle timeout - continuing anyway');
      });

      // Additional wait for D365 to initialize
      await this.page.waitForTimeout(3000);

      this.log('✅ Home page navigation complete');

    } catch (error) {
      this.log(`❌ Error navigating to home page: ${error}`);
      throw error;
    }
  }

  /**
   * Check if user is already authenticated to D365
   */
  private async checkExistingAuthentication(): Promise<boolean> {
    try {
      const currentUrl = this.page.url();
      
      // If we're already on D365 domain (not login page), check if session is valid
      if (currentUrl.includes('dynamics.com') && 
          !currentUrl.includes('login.microsoftonline.com') &&
          !currentUrl.includes('login.windows.net')) {
        
        this.log('📍 Already on D365 domain, verifying session...');
        
        // Try to find D365-specific content
        try {
          const d365Content = await Promise.race([
            this.page.locator('[data-id="mainContent"]').count(),
            this.page.locator('[role="main"]').count(),
            this.page.locator('.ms-Nav').count()
          ]);
          
          if (d365Content > 0) {
            this.log('✅ Valid D365 session detected');
            return true;
          }
        } catch (error) {
          this.log('⚠️ Could not verify D365 content, assuming not authenticated');
        }
      }
      
      return false;
    } catch (error) {
      this.log(`⚠️ Error checking existing authentication: ${error}`);
      return false;
    }
  }

  /**
   * Verify that authentication was successful
   */
  private async verifyAuthentication(): Promise<boolean> {
    try {
      this.log('🔍 Verifying authentication status...');

      const currentUrl = this.page.url();
      this.log(`📍 Current URL: ${currentUrl}`);

      // Check if we're on D365 (not redirected to login)
      const isOnD365 = currentUrl.includes('dynamics.com') && 
                       !currentUrl.includes('login.microsoftonline.com');

      if (isOnD365) {
        this.log('✅ Successfully authenticated - on D365 domain');
        
        // Additional check: Look for D365-specific elements
        const d365Indicator = await this.page.locator('[data-id="mainContent"]').count();
        if (d365Indicator > 0) {
          this.log('✅ D365 main content detected');
        }
        
        return true;
      } else {
        this.log('⚠️ Not on D365 domain - authentication may have failed');
        await this.takeScreenshot('service-principal-verification-failed');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error verifying authentication: ${error}`);
      return false;
    }
  }

  /**
   * Alternative approach: Direct token injection via localStorage/sessionStorage
   * Use this if the header injection approach doesn't work
   */
  async authenticateWithStorageInjection(token: string): Promise<boolean> {
    try {
      this.log('🔐 Using storage injection authentication method...');

      // Navigate to D365 domain first
      await this.page.goto(this.d365Url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Inject token into browser storage
      await this.page.evaluate((accessToken) => {
        // Store in both localStorage and sessionStorage
        localStorage.setItem('msal.access.token', accessToken);
        sessionStorage.setItem('msal.access.token', accessToken);
        
        // Also try common OAuth storage keys
        localStorage.setItem('adal.access.token.key', accessToken);
        localStorage.setItem('access_token', accessToken);
      }, token);

      this.log('✅ Token injected into browser storage');

      // Reload to apply authentication
      await this.page.reload({ waitUntil: 'networkidle', timeout: 30000 });

      this.log('🔄 Page reloaded with injected token');

      return await this.verifyAuthentication();
    } catch (error) {
      this.log(`❌ Storage injection error: ${error}`);
      return false;
    }
  }
}
