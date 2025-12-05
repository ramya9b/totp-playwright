require('dotenv').config();
const { chromium } = require('@playwright/test');

(async () => {
  console.log('🔓 Starting D365 authentication setup...');
  console.log('📌 Target URL:', process.env.D365_URL);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  console.log('🌐 Opening D365 login page...');
  console.log('👉 Please complete the login manually (including TOTP/MFA)');
  console.log('⏳ Script will wait up to 5 minutes for you to reach D365 homepage...');
  console.log('');
  
  await page.goto(process.env.D365_URL);
  
  // Wait for successful login (URL without 'login')
  await page.waitForURL(url => {
    const urlString = url.toString();
    const isD365 = urlString.includes('dynamics.com');
    const notLogin = !urlString.includes('login') && !urlString.includes('microsoft');
    console.log(`Current URL: ${urlString} | D365: ${isD365} | Not login: ${notLogin}`);
    return isD365 && notLogin;
  }, { 
    timeout: 300000 // 5 minutes
  });
  
  console.log('✅ Login detected! You are now on D365 homepage');
  console.log('💾 Saving authentication session...');
  
  await context.storageState({ path: 'auth/D365AuthFile.json' });
  
  console.log('✅✅ Session saved successfully to: auth/D365AuthFile.json');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Upload auth/D365AuthFile.json to Azure DevOps Secure Files');
  console.log('   2. Update pipeline to use azure-pipelines-session-auth.yml');
  console.log('   3. Run pipeline - no TOTP automation needed!');
  console.log('');
  console.log('🔄 Session lifetime: ~30-90 days (refresh when expired)');
  
  await browser.close();
})();
