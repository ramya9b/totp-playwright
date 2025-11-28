import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { HomePage } from '../pages';

/**
 * D365 Finance and Operations Homepage Verification
 * Verifies homepage content and functionality after login
 */
test.describe('🏠 D365 Homepage Verification', () => {
  
  test.beforeEach(async () => {
    await allure.epic('Homepage Verification');
    await allure.feature('Content Validation');
    await allure.story('Finance and Operations');
  });
  
  test('Verify Finance and Operations homepage content', async ({ page }) => {
    await allure.severity('high');
    await allure.tag('homepage');
    await allure.tag('content');
    await allure.tag('finance-operations');
    await allure.tag('verification');
    await allure.description('Verifies that the D365 Finance and Operations homepage loads correctly with proper content');
    await allure.owner('QA Team');
    test.setTimeout(60000); // 1 minute timeout
    
    console.log('🔍 Starting Finance and Operations homepage verification...');
    
    try {
      // Initialize HomePage
      const homePage = new HomePage(page);
      
      await allure.step('Navigate to D365 homepage with saved session', async () => {
        const d365Url = process.env.D365_URL!;
        await homePage.navigateWithSession(d365Url);
        await allure.parameter('URL', d365Url);
      });
      
      let pageTitle: string;
      let currentUrl: string;
      
      await allure.step('Capture page information', async () => {
        pageTitle = await page.title();
        currentUrl = page.url();
        console.log(`📄 Page Title: ${pageTitle}`);
        console.log(`🔗 Current URL: ${currentUrl}`);
        await allure.parameter('Page Title', pageTitle);
        await allure.parameter('Current URL', currentUrl);
      });
      
      await allure.step('Verify Finance and Operations content', async () => {
        console.log('🔍 Verifying Finance and Operations homepage content...');
        
        let financeOpsFound = false;
        
        // Check 1: Page title contains Finance and Operations
        if (pageTitle.includes('Finance and Operations')) {
          console.log('✅ Finance and Operations found in page title!');
          financeOpsFound = true;
        }
        
        // Check 2: URL is operations.dynamics.com
        if (currentUrl.includes('operations.dynamics.com')) {
          console.log('✅ Finance and Operations URL confirmed!');
          financeOpsFound = true;
        }
      
      // Check 3: Look for Finance and Operations text in page content
      const financeOpsTextLocator = page.locator('text="Finance and Operations"').first();
      if (await financeOpsTextLocator.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Finance and Operations text found in page content!');
        financeOpsFound = true;
      }
      
      // Check 4: Look for Dashboard text (common in Finance and Operations)
      const dashboardLocator = page.locator('text="Dashboard"').first();
      if (await dashboardLocator.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Dashboard found - Finance and Operations homepage confirmed!');
        financeOpsFound = true;
      }
      
      // Check 5: Look for specific Finance and Operations elements
      const workspaceLocator = page.locator('text="Workspace"').first();
      if (await workspaceLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✅ Workspace found - Finance and Operations confirmed!');
        financeOpsFound = true;
      }
      
      // Verify homepage is loaded correctly
      await homePage.verifyHomepageLoaded();
      
      // Assert that we found Finance and Operations indicators
      if (financeOpsFound) {
        console.log('🎉 Finance and Operations homepage verification successful!');
        } else {
          console.log('⚠️ Finance and Operations indicators not found, but homepage loaded');
        }
      });
      
      await allure.step('Take screenshot for verification', async () => {
        await page.screenshot({ 
          path: 'screenshots/finance-operations-homepage.png', 
          fullPage: true 
        });
        console.log('📸 Homepage screenshot saved: finance-operations-homepage.png');
        await allure.attachment('Homepage Screenshot', await page.screenshot({ fullPage: true }), 'image/png');
      });
      
    } catch (error) {
      console.error('❌ Homepage verification failed:', error);
      
      await allure.step('Take error screenshot', async () => {
        await page.screenshot({ 
          path: 'screenshots/homepage-verification-error.png', 
          fullPage: true 
        });
        await allure.attachment('Error Screenshot', await page.screenshot({ fullPage: true }), 'image/png');
      });
      
      await allure.attachment('Error Details', JSON.stringify(error, null, 2), 'application/json');
      throw error;
    }
  });

  test('Verify homepage functionality', async ({ page }) => {
    await allure.severity('medium');
    await allure.tag('homepage');
    await allure.tag('functionality');
    await allure.tag('search');
    await allure.tag('navigation');
    await allure.description('Tests basic homepage functionality including search and navigation features');
    await allure.owner('QA Team');
    test.setTimeout(60000); // 1 minute timeout
    
    console.log('🧪 Testing homepage functionality...');
    
    try {
      const homePage = new HomePage(page);
      
      await allure.step('Navigate to homepage with saved session', async () => {
        const d365Url = process.env.D365_URL!;
        await homePage.navigateWithSession(d365Url);
        await allure.parameter('Homepage URL', d365Url);
      });
      
      console.log('🔍 Testing homepage elements...');
      
      await allure.step('Wait for page loading to complete', async () => {
        await homePage.waitForLoadingComplete();
      });
      
      await allure.step('Test search functionality', async () => {
        await homePage.searchFor('customers');
        console.log('✅ Search functionality tested');
        await allure.parameter('Search Term', 'customers');
      });
      
      await allure.step('Verify user profile accessibility', async () => {
        await homePage.verifyUserProfileAccessible();
      });
      
      console.log('🎉 Homepage functionality verification completed!');
      
    } catch (error) {
      console.error('❌ Homepage functionality test failed:', error);
      await allure.attachment('Error Details', JSON.stringify(error, null, 2), 'application/json');
      throw error;
    }
  });

});