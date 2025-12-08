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
  
  // Always perform fresh authentication to ensure complete session capture
  // Previous session files may be incomplete or expired
  if (fs.existsSync(authFile)) {
    console.log('🗑️  Removing old session file to force fresh authentication...');
    fs.unlinkSync(authFile);
  }
  
  // Launch browser with stealth mode
  const isHeadless = process.env.CI === 'true' || process.env.HEADLESS === 'true';
  console.log(`🔧 Browser mode: ${isHeadless ? 'HEADLESS' : 'HEADED'}`);
  console.log(`🔧 CI environment: ${process.env.CI || 'false'}`);
  
  const browser = await chromium.launch({
    headless: isHeadless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=WebAuthenticationUI',
      '--disable-web-security',
      '--no-first-run',
      '--no-service-autorun',
      '--password-store=basic',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu'
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
    
    // Remove automation indicators
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
      
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });

    await context.clearCookies();
    const page = await context.newPage();

    console.log('🚀 Starting D365 TOTP authentication...');
    
    const authManager = new AuthenticationManager(page);
    await authManager.performCompleteLogin(true);
    
    // Ensure session file is created
    if (!fs.existsSync('auth')) {
      fs.mkdirSync('auth', { recursive: true });
    }
    
    // Save storage state for all tests to reuse
    await context.storageState({ path: authFile });
    
    console.log(`✅ Global setup complete - session saved to ${authFile}`);
    console.log('📊 Session file size:', fs.statSync(authFile).size, 'bytes');
    
    // Wait a bit to ensure session is fully established
    await page.waitForTimeout(2000);
    
    await context.close();
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
