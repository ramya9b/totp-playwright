import { Page } from '@playwright/test';
import * as OTPAuth from 'otpauth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function loginToDynamics365(page: Page, saveSession = true) {
  const { D365_URL, M365_USERNAME, M365_PASSWORD, TOTP_SECRET } = process.env;

  if (!D365_URL || !M365_USERNAME || !M365_PASSWORD || !TOTP_SECRET) {
    throw new Error('Missing required environment variables');
  }

  // Get browser information for cross-browser handling
  const browserName = page.context().browser()?.browserType().name() || 'unknown';
  console.log('🚀 Starting D365 TOTP login...');
  console.log(`🌐 Browser: ${browserName}`);
  console.log(`📧 Email: ${M365_USERNAME.substring(0, 3)}***${M365_USERNAME.substring(M365_USERNAME.indexOf('@'))}`);
  
  await page.goto(D365_URL);
  
  // Enhanced email entry with browser-specific handling
  await page.waitForSelector('input[name="loginfmt"], input[type="email"]', { timeout: 15000 });
  await page.fill('input[name="loginfmt"], input[type="email"]', M365_USERNAME);
  await page.click('input[type="submit"], button[type="submit"]');
  console.log('✅ Email entered');

  // Wait for password field with browser-specific timeout
  const passwordTimeout = browserName === 'webkit' ? 15000 : 10000;
  await page.waitForSelector('input[name="passwd"], input[type="password"]', { timeout: passwordTimeout });
  await page.fill('input[name="passwd"], input[type="password"]', M365_PASSWORD);
  await page.click('input[type="submit"], button[type="submit"]');
  console.log('✅ Password entered');

  // Browser-specific wait times after password submission
  if (browserName === 'webkit') {
    await page.waitForTimeout(8000); // WebKit needs more time
  } else if (browserName === 'firefox') {
    await page.waitForTimeout(6000); // Firefox needs extra time
  } else {
    await page.waitForTimeout(4000);
  }
  
  // Enhanced MFA detection with comprehensive selectors
  const mfaDetectionStrategies = [
    // Strategy 1: Direct TOTP field detection
    async () => {
      const directTotpSelectors = [
        'input#idTxtBx_SAOTCC_OTC',
        'input[name="otc"]',
        'input[placeholder*="code" i]',
        'input[aria-label*="code" i]',
        'input[maxlength="6"]'
      ];
      
      for (const selector of directTotpSelectors) {
        if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`🔐 Direct TOTP field found: ${selector}`);
          return { type: 'direct-totp', element: page.locator(selector) };
        }
      }
      return null;
    },
    
    // Strategy 2: "Sign in another way" detection
    async () => {
      const anotherWaySelectors = [
        'a#signInAnotherWay',
        'a:has-text("Sign in another way")',
        'a[data-bind*="signInAnotherWay"]',
        'button:has-text("Sign in another way")',
        'a:has-text("Use another verification method")',
        'a:has-text("Try another way")'
      ];
      
      for (const selector of anotherWaySelectors) {
        if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`🔄 Found "Sign in another way": ${selector}`);
          return { type: 'another-way', element: page.locator(selector) };
        }
      }
      return null;
    },
    
    // Strategy 3: Direct verification code option detection
    async () => {
      const codeOptionSelectors = [
        'div[data-value="PhoneAppOTP"]',
        'button[data-value="PhoneAppOTP"]',
        'div:has-text("Use a verification code")',
        'button:has-text("Use a verification code")',
        'div:has-text("authenticator app")'
      ];
      
      for (const selector of codeOptionSelectors) {
        if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✅ Found direct verification code option: ${selector}`);
          return { type: 'direct-code-option', element: page.locator(selector) };
        }
      }
      return null;
    },
    
    // Strategy 4: Text-based MFA detection
    async () => {
      const textIndicators = [
        'More information required',
        'verify your identity',
        'Approve a request',
        'authenticator',
        'verification code',
        'Two-step verification'
      ];
      
      for (const text of textIndicators) {
        if (await page.locator(`div:has-text("${text}"), span:has-text("${text}"), p:has-text("${text}")`).isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`🔍 Found MFA text indicator: "${text}"`);
          return { type: 'text-indicator', text };
        }
      }
      return null;
    }
  ];
  
  // Execute MFA detection strategies
  let mfaResult = null;
  for (const strategy of mfaDetectionStrategies) {
    mfaResult = await strategy();
    if (mfaResult) {
      break;
    }
  }
  
  // Handle MFA based on detection result
  if (mfaResult) {
    console.log(`🔍 MFA detected with strategy: ${mfaResult.type}`);
    
    switch (mfaResult.type) {
      case 'direct-totp':
        // TOTP field is already visible, proceed to code entry
        if ('element' in mfaResult) {
          await handleTOTPEntry(page, mfaResult.element, browserName);
        }
        break;
        
      case 'another-way':
        // Click "Sign in another way" and then find verification code option
        if ('element' in mfaResult) {
          await mfaResult.element.click();
          console.log('🔄 Clicked "Sign in another way"');
        }
        
        // Browser-specific wait for menu
        if (browserName === 'webkit') {
          await page.waitForTimeout(6000);
        } else if (browserName === 'firefox') {
          await page.waitForTimeout(5000);
        } else {
          await page.waitForTimeout(4000);
        }
        
        await handleVerificationCodeSelection(page, browserName);
        break;
        
      case 'direct-code-option':
        // Verification code option is already visible
        if ('element' in mfaResult) {
          await mfaResult.element.click();
          console.log('✅ Clicked verification code option');
        }
        await page.waitForTimeout(3000);
        
        // Look for TOTP field
        const totpField = await findTOTPField(page, browserName);
        if (totpField) {
          await handleTOTPEntry(page, totpField, browserName);
        }
        break;
        
      case 'text-indicator':
        console.log('📝 MFA text detected, searching for interactive elements...');
        // Try to find clickable MFA elements
        await handleVerificationCodeSelection(page, browserName);
        break;
    }
  } else {
    console.log('ℹ️ No MFA screen detected - checking if login completed');
  }

  // Handle "Stay signed in?" prompt
  await handleStaySignedInPrompt(page, browserName);

  // Wait for successful login
  await waitForD365Login(page, D365_URL, browserName);

  if (saveSession) {
    // Ensure auth directory exists
    const fs = require('fs');
    if (!fs.existsSync('auth')) {
      fs.mkdirSync('auth');
    }
    
    await page.context().storageState({ path: 'auth/D365AuthFile.json' });
    console.log('💾 Session saved to auth/D365AuthFile.json');
  }
}

async function findTOTPField(page: Page, browserName: string): Promise<any> {
  const totpSelectors = [
    'input#idTxtBx_SAOTCC_OTC',
    'input[name="otc"]',
    'input[placeholder*="code" i]',
    'input[aria-label*="code" i]',
    'input[type="tel"]',
    'input[maxlength="6"]',
    'input[inputmode="numeric"]'
  ];
  
  const waitTimeout = browserName === 'webkit' ? 15000 : 12000;
  
  for (const selector of totpSelectors) {
    const field = page.locator(selector);
    if (await field.isVisible({ timeout: waitTimeout }).catch(() => false)) {
      console.log(`🔐 TOTP field found: ${selector}`);
      return field;
    }
  }
  
  console.log('⚠️ No TOTP field found');
  return null;
}

async function handleVerificationCodeSelection(page: Page, browserName: string) {
  const codeOptions = [
    'div[data-value="PhoneAppOTP"]',
    'button[data-value="PhoneAppOTP"]',
    'div:has-text("Use a verification code")',
    'button:has-text("Use a verification code")',
    'div:has-text("verification code")',
    'div[role="button"]:has-text("verification")',
    'a:has-text("verification code")',
    'div:has-text("authenticator app")'
  ];
  
  console.log('🔍 Looking for verification code option...');
  let codeOptionSelected = false;
  
  for (const selector of codeOptions) {
    try {
      const element = page.locator(selector);
      const timeout = browserName === 'webkit' ? 5000 : 3000;
      
      if (await element.isVisible({ timeout }).catch(() => false)) {
        console.log(`✅ Found verification code option: ${selector}`);
        await element.click();
        console.log('✅ Clicked verification code option');
        codeOptionSelected = true;
        
        // Wait for TOTP field to appear
        await page.waitForTimeout(3000);
        
        // Find and handle TOTP field
        const totpField = await findTOTPField(page, browserName);
        if (totpField) {
          await handleTOTPEntry(page, totpField, browserName);
        }
        break;
      }
    } catch (error) {
      console.log(`❌ Selector ${selector} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  if (!codeOptionSelected) {
    console.log('⚠️ Could not find verification code option');
    // Take debug screenshot
    await page.screenshot({ path: `screenshots/mfa-debug-${browserName}.png`, fullPage: true });
    console.log(`📸 Debug screenshot saved: mfa-debug-${browserName}.png`);
  }
}

async function handleTOTPEntry(page: Page, totpField: any, browserName: string) {
  console.log('🔐 Generating TOTP code...');
  
  const { M365_USERNAME, TOTP_SECRET } = process.env;
  
  const totp = new OTPAuth.TOTP({
    issuer: 'Microsoft',
    label: M365_USERNAME!,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: TOTP_SECRET!,
  });
  
  const code = totp.generate();
  
  // Clear field first (some browsers have pre-filled values)
  await totpField.clear();
  await totpField.fill(code);
  console.log(`✅ TOTP code entered: ${code}`);
  
  // Submit the form
  const submitSelectors = [
    'input[type="submit"]',
    'button[type="submit"]',
    'input[value="Submit"]',
    'button:has-text("Submit")',
    'button:has-text("Verify")'
  ];
  
  for (const selector of submitSelectors) {
    if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click(selector);
      console.log(`✅ Submitted TOTP with: ${selector}`);
      break;
    }
  }
  
  // Wait for processing
  await page.waitForTimeout(5000);
}

async function handleStaySignedInPrompt(page: Page, browserName: string) {
  console.log('🔍 Looking for "Stay signed in?" prompt...');
  
  const staySignedInSelectors = [
    'input[type="submit"][value="Yes"]',
    'input[type="button"][value="Yes"]',
    'button:has-text("Yes")',
    'input#idBtn_Back',
    'button[data-report-event="Signin_Submit"]',
    'input[value="Yes"]'
  ];
  
  const timeout = browserName === 'webkit' ? 12000 : 8000;
  let staySignedInHandled = false;
  
  for (const selector of staySignedInSelectors) {
    const element = page.locator(selector);
    if (await element.isVisible({ timeout }).catch(() => false)) {
      console.log('❓ Found "Stay signed in?" prompt');
      await element.click();
      console.log(`✅ Clicked "Yes" to stay signed in: ${selector}`);
      await page.waitForTimeout(4000);
      staySignedInHandled = true;
      break;
    }
  }
  
  if (!staySignedInHandled) {
    console.log('ℹ️ No "Stay signed in?" prompt found');
  }
}

async function waitForD365Login(page: Page, D365_URL: string, browserName: string) {
  console.log('⏳ Waiting for authentication processing to complete...');
  
  try {
    // Browser-specific timeout adjustments
    const timeout = browserName === 'webkit' ? 120000 : 60000; // 2 minutes for WebKit
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('ProcessAuth') || currentUrl.includes('login.microsoftonline.com')) {
      console.log('🔄 Processing authentication, waiting for redirect...');
      
      // WebKit-specific handling with multiple strategies
      if (browserName === 'webkit') {
        console.log('🐛 Using WebKit-specific redirect handling...');
        
        // Strategy 1: Try multiple page interactions to trigger redirect
        try {
          // Sometimes WebKit needs a page refresh or interaction to trigger redirect
          await page.waitForTimeout(10000); // Wait longer initially
          
          // Check if still on login page
          let checkUrl = page.url();
          if (checkUrl.includes('login.microsoftonline.com')) {
            console.log('🔄 Still on login page, trying page reload...');
            await page.reload();
            await page.waitForTimeout(8000);
            
            checkUrl = page.url();
            if (checkUrl.includes('login.microsoftonline.com')) {
              console.log('🔄 Trying to navigate directly to D365...');
              await page.goto(D365_URL);
              await page.waitForTimeout(10000);
            }
          }
          
          // Now wait for the D365 URL with extended timeout
          await page.waitForURL(url => {
            const urlStr = url.toString();
            return urlStr.includes('dynamics.com') || 
                   urlStr.includes('operations.dynamics') || 
                   urlStr.includes('sandbox.operations') ||
                   urlStr.includes('businesscentral.dynamics.com');
          }, { timeout: timeout - 20000 });
          
        } catch (webkitError) {
          // Final check - sometimes WebKit doesn't trigger the waitForURL but we're actually logged in
          const finalUrl = page.url();
          console.log(`📍 WebKit final URL check: ${finalUrl}`);
          
          if (finalUrl.includes('dynamics.com') || 
              finalUrl.includes('operations.dynamics') ||
              finalUrl.includes('sandbox.operations') ||
              finalUrl.includes('businesscentral.dynamics.com')) {
            console.log('✅ WebKit login successful - on D365 domain');
            return;
          }
          
          // If still on login page, try one more direct navigation
          if (finalUrl.includes('login.microsoftonline.com')) {
            console.log('🔄 WebKit final attempt - direct navigation to D365...');
            await page.goto(D365_URL);
            await page.waitForTimeout(15000);
            
            const veryFinalUrl = page.url();
            if (veryFinalUrl.includes('dynamics.com') || 
                veryFinalUrl.includes('operations.dynamics') ||
                veryFinalUrl.includes('sandbox.operations')) {
              console.log('✅ WebKit login successful after direct navigation');
              return;
            }
          }
          
          throw webkitError;
        }
      } else {
        // Firefox/Chromium handling - with Firefox recovery logic
        try {
          await page.waitForURL(url => {
            const urlStr = url.toString();
            return urlStr.includes('dynamics.com') || 
                   urlStr.includes('operations.dynamics') || 
                   urlStr.includes('sandbox.operations') ||
                   urlStr.includes('businesscentral.dynamics.com');
          }, { timeout });
        } catch (waitError) {
          // Firefox may also need recovery logic similar to WebKit
          if (browserName === 'firefox') {
            console.log('🦊 Using Firefox-specific redirect handling...');
            
            // Check if still on login page
            let checkUrl = page.url();
            if (checkUrl.includes('login.microsoftonline.com')) {
              console.log('🔄 Firefox still on login page, trying page reload...');
              await page.reload();
              await page.waitForTimeout(8000);
              
              checkUrl = page.url();
              if (checkUrl.includes('login.microsoftonline.com')) {
                console.log('🔄 Firefox trying direct navigation to D365...');
                await page.goto(D365_URL);
                await page.waitForTimeout(10000);
              }
            }
            
            // Final check for Firefox
            const finalUrl = page.url();
            if (finalUrl.includes('dynamics.com') || 
                finalUrl.includes('operations.dynamics') ||
                finalUrl.includes('sandbox.operations') ||
                finalUrl.includes('businesscentral.dynamics.com')) {
              console.log('✅ Firefox login successful after recovery');
              return;
            }
          }
          
          // Re-throw the error if not Firefox or recovery failed
          throw waitError;
        }
      }
    } else {
      // Try waiting for exact URL first
      await page.waitForURL(D365_URL, { timeout: timeout - 15000 });
    }
    
    console.log('🎉 Successfully logged into D365!');
    
  } catch (e) {
    // Enhanced error handling
    const currentUrl = page.url();
    console.log(`📍 Final URL after timeout: ${currentUrl}`);
    
    // Check if we're actually on a D365 domain despite the error
    if (currentUrl.includes('dynamics.com') || 
        currentUrl.includes('operations.dynamics') || 
        currentUrl.includes('sandbox.operations') ||
        currentUrl.includes('businesscentral.dynamics.com')) {
      console.log('✅ Login appears successful - on D365 domain');
      return;
    }
    
    // Check if we're still on Microsoft login
    if (currentUrl.includes('login.microsoftonline.com')) {
      console.log('⚠️ Still on Microsoft login page - authentication may have failed');
      
      // For WebKit and Firefox, try one final direct navigation attempt
      if (browserName === 'webkit' || browserName === 'firefox') {
        console.log(`🔄 ${browserName} emergency recovery - attempting direct navigation...`);
        try {
          await page.goto(D365_URL);
          await page.waitForTimeout(15000);
          
          const recoveryUrl = page.url();
          if (recoveryUrl.includes('dynamics.com') || 
              recoveryUrl.includes('operations.dynamics') ||
              recoveryUrl.includes('sandbox.operations')) {
            console.log(`✅ ${browserName} emergency recovery successful!`);
            return;
          }
        } catch (recoveryError) {
          console.log(`❌ ${browserName} emergency recovery failed`);
        }
      }
    }
    
    // Create debug information
    await page.screenshot({ path: `screenshots/login-failure-${browserName}.png`, fullPage: true });
    const html = await page.content();
    const fs = require('fs');
    
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }
    
    fs.writeFileSync(`screenshots/login-failure-${browserName}.html`, html);
    fs.writeFileSync(`screenshots/login-failure-${browserName}-url.txt`, currentUrl);
    
    console.error(`❌ Login failed for ${browserName}. Debug files saved to screenshots/`);
    console.error(`Current URL: ${currentUrl}`);
    throw e;
  }
}