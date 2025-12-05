import { test, chromium } from '@playwright/test';
import path from 'path';

/**
 * ONE-TIME SETUP: Run this locally to create authenticated session
 * This saves session cookies that can be reused in CI/CD
 * 
 * Run: npx playwright test setup-auth-once.spec.ts --headed
 */
test('Setup D365 authentication session (run once locally)', async () => {
  test.setTimeout(300000); // 5 minutes to complete manual login
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔓 Opening D365 login page...');
  console.log('👉 Please complete the login manually (including TOTP)');
  console.log('⏳ Waiting for you to reach the D365 homepage...');
  
  await page.goto(process.env.D365_URL!);
  
  // Wait for user to complete login manually
  await page.waitForURL(url => 
    url.toString().includes('dynamics.com') && 
    !url.toString().includes('login'), 
    { timeout: 300000 }
  );
  
  console.log('✅ Login detected! Saving session...');
  
  // Save authentication state
  await context.storageState({ path: 'auth/D365AuthFile.json' });
  
  console.log('💾 Session saved to auth/D365AuthFile.json');
  console.log('✅ You can now use this session in CI/CD pipelines!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Commit auth/D365AuthFile.json to a secure location');
  console.log('   2. Add it as a secret file in Azure DevOps Library');
  console.log('   3. Pipeline will download and use this session');
  
  await browser.close();
});
