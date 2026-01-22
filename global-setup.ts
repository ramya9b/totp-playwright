import { chromium, FullConfig } from '@playwright/test';
import { AuthenticationManager } from './pages';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Setup for Playwright Tests
 * Performs D365 TOTP login and saves authenticated session
 * This runs ONCE before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🔧 === GLOBAL SETUP: D365 Authentication ===\n');
  
  const authFile = path.join(process.cwd(), 'auth', 'D365AuthFile.json');
  const isCI = process.env.CI === 'true';
  
  // In CI: Use existing session file (downloaded from Secure Files)
  // Locally: Generate fresh session with TOTP
  if (isCI && fs.existsSync(authFile)) {
    console.log('✅ CI Environment: Using existing session file from Secure Files');
    console.log(`📄 Session file: ${authFile}`);
    console.log(`📊 Session file size: ${fs.statSync(authFile).size} bytes`);
    console.log('⏩ Skipping global setup - tests will use stored session');
    return; // Exit early - let tests use the session file
  }
  
  if (!isCI && fs.existsSync(authFile)) {
    console.log('🗑️  Local environment: Removing old session to generate fresh one...');
    fs.unlinkSync(authFile);
  }
  
  // Launch browser with stealth mode
  const isHeadless = process.env.HEADLESS === 'true';
  console.log(`🔧 Browser mode: ${isHeadless ? 'HEADLESS' : 'HEADED'}`);
  console.log(`🔧 CI environment: ${isCI}`);
  
  const browser = await chromium.launch({
    headless: isHeadless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=WebAuthenticationUI,WebAuthentication',
      '--disable-web-security',
      '--no-first-run',
      '--no-service-autorun',
      '--password-store=basic',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-sync',
      '--disable-translate',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-preconnect',
      '--disable-component-extensions-with-background-pages',
      '--disable-popup-blocking'
    ]
  });

  try {
    // Create context with stealth settings
    const context = await browser.newContext({
      permissions: [],
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });
    
    // Remove automation indicators and disable WebAuthn
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Disable WebAuthn/FIDO to force password-based authentication
      if (window.PublicKeyCredential) {
        delete (window as any).PublicKeyCredential;
      }
      
      // Disable credential management API
      if (navigator.credentials) {
        (navigator.credentials as any).get = async () => null;
        (navigator.credentials as any).store = async () => {};
      }
      
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });

    await context.clearCookies();
    const page = await context.newPage();

    console.log('🚀 Starting D365 TOTP authentication...');
    
    const authManager = new AuthenticationManager(page);
    await authManager.performCompleteLogin(true); // This already saves the session
    
    console.log(`✅ Global setup complete - session saved to ${authFile}`);
    console.log('📊 Session file size:', fs.statSync(authFile).size, 'bytes');
    
    await context.close();
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
