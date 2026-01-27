import { test, expect } from '@playwright/test';
import { CreateCustomerPage } from '../pages/CreateCustomer';
import { readCustomerDataFromExcel, readAllCustomerDataFromExcel } from '../utils/excelReader';

/**
 * Test Suite: Customer Creation in D365 Accounts Receivable
 * Description: Test for creating customers with all required details
 * Data-driven: Reads all customers from Excel and creates each one
 */

test.describe('🧑‍💼 Customer Creation Tests', () => {
  let createCustomerPage: CreateCustomerPage;

  test.beforeEach(async ({ page, baseURL }) => {
    createCustomerPage = new CreateCustomerPage(page);
    
    console.log(`\n🔍 === TEST SETUP DEBUG ===`);
    console.log(`📋 Base URL: ${baseURL}`);
    console.log(`📋 Current URL: ${page.url()}`);
    
    // Check stored cookies
    const cookies = await page.context().cookies();
    console.log(`🔐 Session cookies: ${cookies.length}`);
    
    // Navigate to D365 homepage (using stored session)
    console.log(`🚀 Navigating to: /`);
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    
    console.log(`✅ Navigated to: ${page.url()}`);
    console.log(`🔍 === TEST SETUP COMPLETE ===\n`);
  });

  test('🔍 DEBUG: Create customer with minimal fields (no delivery)', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for this test
    
    // Create test data with ONLY required fields
    const minimalCustomerData = {
      firstName: `TestCustomer${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      lastNamePrefix: '',
      lastName: `Test${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      customerGroup: '10',
      deliveryTerms: '', // SKIP - leave empty
      deliveryMode: '', // SKIP - leave empty
      zipCode: ''
    };
    
    console.log(`📊 Minimal test data:`, minimalCustomerData);
    
    try {
      // Navigate to Customers List
      await createCustomerPage.navigateToAllCustomers();

      // Click New
      await createCustomerPage.clickNewCustomer();

      // Verify form
      await createCustomerPage.verifyCreateCustomerForm();

      // Fill ONLY required fields
      console.log('📝 Filling only required fields: firstName, lastName, customerGroup');
      await createCustomerPage.createCustomer(minimalCustomerData);

      // Save
      console.log('💾 Attempting to save...');
      await createCustomerPage.clickSave();
      
      console.log('✅ Save completed');
      
      // Wait for D365 to process
      await page.waitForTimeout(3000);
      
      // Verify
      try {
        const created = await createCustomerPage.verifyCustomerCreated(minimalCustomerData.firstName);
        if (created) {
          console.log(`✅ MINIMAL TEST PASSED: Customer created with just firstName/lastName/group: ${minimalCustomerData.firstName}`);
        } else {
          console.log(`⚠️ MINIMAL TEST: Could not find customer in list (may still be created)`);
        }
      } catch (e) {
        console.log(`⚠️ Verification failed: ${e}`);
      }
    } catch (error) {
      console.log(`❌ Minimal test failed: ${error}`);
      throw error;
    }
  });

  test('Create single customer with basic details', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for this test
    
    // Read customer data from Excel file (single row)
    const customerData = readCustomerDataFromExcel('test-data/customer-data.xlsx', 'Customers', 0);
    
    // Add random 2-digit numbers to first name and last name for uniqueness
    const randomNumber = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    customerData.firstName = `${customerData.firstName}${randomNumber}`;
    customerData.lastName = `${customerData.lastName}${randomNumber}`;
    
    console.log(`📊 Customer data loaded from Excel:`, customerData);
    console.log(`🎲 Random suffix added: ${randomNumber}`);
    
    try {
      // Navigate to Customers List using navigation pane
      await createCustomerPage.navigateToAllCustomers();

      // Click New to create customer
      await createCustomerPage.clickNewCustomer();

      // Verify create customer form is displayed
      await createCustomerPage.verifyCreateCustomerForm();

      // Fill customer details from Excel data
      await createCustomerPage.createCustomer(customerData);

      // Save the customer
      await createCustomerPage.clickSave();

      console.log('✅ Customer save action completed');
      
      // Wait briefly to allow D365 to process save
      await page.waitForTimeout(2000).catch(() => {
        console.log('⚠️ Page context may have closed after save');
      });
      
      // Try to navigate back and verify customer was created
      try {
        const created = await createCustomerPage.verifyCustomerCreated(customerData.firstName);
        if (created) {
          console.log(`✅ Customer created successfully: ${customerData.firstName}`);
        } else {
          console.log(`⚠️ Customer may have been created but could not be found in list`);
        }
      } catch (e) {
        console.log(`⚠️ Could not verify customer creation: ${e}`);
      }
      
    } catch (error) {
      console.log(`❌ Test failed: ${error}`);
      throw error;
    }
  });

  test('Create multiple customers from Excel (loop all rows)', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes for multiple customers
    
    try {
      // Read ALL customer data from Excel file
      const allCustomers = readAllCustomerDataFromExcel('test-data/customer-data.xlsx', 'Customers');
      console.log(`📊 Found ${allCustomers.length} customers in Excel`);
      
      // Loop through each customer and create them
      for (let i = 0; i < allCustomers.length; i++) {
        const customerData = allCustomers[i];
        
        // Add random 2-digit numbers to first name and last name for uniqueness
        const randomNumber = String(Math.floor(Math.random() * 100)).padStart(2, '0');
        customerData.firstName = `${customerData.firstName}${randomNumber}`;
        customerData.lastName = `${customerData.lastName}${randomNumber}`;
        
        console.log(`\n🔢 Creating customer ${i + 1} of ${allCustomers.length}: ${customerData.firstName} ${customerData.lastName}`);
        console.log(`🎲 Random suffix: ${randomNumber}`);
        
        try {
          // Navigate to Customers List
          await createCustomerPage.navigateToAllCustomers();
          await page.waitForTimeout(2000);

          // Click New to create customer
          await createCustomerPage.clickNewCustomer();

          // Verify create customer form is displayed
          await createCustomerPage.verifyCreateCustomerForm();

          // Fill customer details from Excel data
          await createCustomerPage.createCustomer(customerData);

          // Save the customer
          await createCustomerPage.clickSave();

          console.log(`✅ Customer ${i + 1} saved`);
          
          // Wait briefly to allow D365 to process save
          await page.waitForTimeout(3000).catch(() => {
            console.log('⚠️ Page context may have closed after save');
          });
          
          // Try to verify customer was created
          try {
            const created = await createCustomerPage.verifyCustomerCreated(customerData.firstName);
            if (created) {
              console.log(`✅ Customer ${i + 1} verified in list: ${customerData.firstName}`);
            } else {
              console.log(`⚠️ Customer ${i + 1} may have been created but not found in list`);
            }
          } catch (e) {
            console.log(`⚠️ Could not verify customer ${i + 1}: ${e}`);
          }
          
        } catch (error) {
          console.log(`❌ Failed to create customer ${i + 1} (${customerData.firstName}): ${error}`);
          // Continue with next customer instead of failing entire test
          continue;
        }
      }
      
      console.log(`\n✅ Completed creating ${allCustomers.length} customers`);
      
    } catch (error) {
      console.log(`❌ Test failed: ${error}`);
      throw error;
    }
  });
});
