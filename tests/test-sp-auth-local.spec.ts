import { test, chromium } from '@playwright/test';
import { AuthenticationManager } from './pages';

/**
 * Test Service Principal Authentication Locally
 * This test verifies that Service Principal auth works with your credentials
 */
test.describe('🔐 Service Principal Authentication Test (Local)', () => {
  
  test('Verify Service Principal auth and skip login', async () => {
    test.setTimeout(120000); // 2 minutes timeout
    
    console.log('');
    console.log('='.repeat(80));
    console.log('🧪 TESTING SERVICE PRINCIPAL AUTHENTICATION LOCALLY');
    console.log('='.repeat(80));
    console.log('');
    
    // Check credentials first
    const d365Url = process.env.D365_URL;
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    
    console.log('📋 Environment Variables:');
    console.log(`   D365_URL: ${d365Url ? '✅' : '❌'}`);
    console.log(`   AZURE_TENANT_ID: ${tenantId ? '✅' : '❌'}`);
    console.log(`   AZURE_CLIENT_ID: ${clientId ? '✅' : '❌'}`);
    console.log(`   AZURE_CLIENT_SECRET: ${clientSecret ? '✅ (***' + clientSecret.slice(-4) + ')' : '❌'}`);
    console.log('');
    
    if (!tenantId || !clientId || !clientSecret) {
      console.log('❌ Missing Service Principal credentials!');
      console.log('💡 Make sure your .env file has all required values');
      throw new Error('Missing Service Principal credentials');
    }
    
    // Launch browser in headed mode to see what happens
    const browser = await chromium.launch({
      headless: false, // Show browser
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=WebAuthenticationUI',
      ]
    });
    
    const context = await browser.newContext({
      permissions: [],
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    try {
      console.log('🚀 Initializing AuthenticationManager with Service Principal...');
      console.log('');
      
      const authManager = new AuthenticationManager(page);
      
      console.log('🔑 Performing authentication (should skip login)...');
      console.log('');
      
      await authManager.performCompleteLogin(false);
      
      console.log('');
      console.log('='.repeat(80));
      console.log('✅ SERVICE PRINCIPAL AUTHENTICATION SUCCESSFUL!');
      console.log('='.repeat(80));
      console.log('');
      
      const currentUrl = page.url();
      const pageTitle = await page.title();
      
      console.log('📍 Current URL:', currentUrl);
      console.log('📄 Page Title:', pageTitle);
      console.log('');
      
      // Verify we're on D365
      if (currentUrl.includes('dynamics.com') && !currentUrl.includes('login.microsoftonline.com')) {
        console.log('🎉 SUCCESS! We are on D365 home page!');
        console.log('⚡ Login was skipped using Service Principal!');
      } else {
        console.log('⚠️ Unexpected URL - might still be on login page');
      }
      
      console.log('');
      console.log('🖼️  Taking screenshot...');
      await page.screenshot({ path: 'screenshots/sp-auth-test-success.png', fullPage: true });
      console.log('✅ Screenshot saved: screenshots/sp-auth-test-success.png');
      
      // Wait to see the result
      console.log('');
      console.log('⏸️  Browser will stay open for 10 seconds so you can see the result...');
      await page.waitForTimeout(10000);
      
    } catch (error) {
      console.log('');
      console.log('='.repeat(80));
      console.log('❌ SERVICE PRINCIPAL AUTHENTICATION FAILED');
      console.log('='.repeat(80));
      console.log('');
      console.error('Error:', error);
      
      await page.screenshot({ path: 'screenshots/sp-auth-test-error.png', fullPage: true });
      console.log('📸 Error screenshot saved: screenshots/sp-auth-test-error.png');
      
      throw error;
    } finally {
      await context.close();
      await browser.close();
      console.log('');
      console.log('🏁 Test completed');
      console.log('');
    }
  });
});
