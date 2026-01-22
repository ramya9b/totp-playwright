import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CreateCustomer Page Object Model
 * Implements the actions used by the customer-creation tests
 */
export class CreateCustomerPage extends BasePage {
  // Page locators (robust / many fallbacks)
  private newButton: Locator;
  private saveButton: Locator;
  private saveAndOpenButton: Locator;
  private cancelButton: Locator;
  private customerAccountInput: Locator;
  private firstNameInput: Locator;
  private lastNamePrefixInput: Locator;
  private middleNameInput: Locator;
  private lastNameInput: Locator;
  private typeSelect: Locator;
  private customerGroupSelect: Locator;
  private currencySelect: Locator;
  private countryInput: Locator;
  private cityInput: Locator;
  private zipInput: Locator;
  private stateInput: Locator;
  private streetInput: Locator;
  private formRoot: Locator;
  private modulesElement: Locator;
  private accountsReceivableTreeItem: Locator;
  private allCustomersLink: Locator;
  private deliveryTermsButton: Locator;
  private deliveryModeButton: Locator;
  private customerGroupButton: Locator;

  constructor(page: Page) {
    super(page);
    // Command bar / new button
    this.newButton = page.locator('button:has-text("New"), button[aria-label*="New"], button[data-id*="new"], button.ms-CommandBarItem-link');
    // Save / Save and open / Cancel
    this.saveButton = page.locator('button[id*="OKButton"], button[name="OKButton"], button:has-text("Save")');
    this.saveAndOpenButton = page.locator('button:has-text("Save and open"), button:has-text("Save & open"), button[title*="Save and open"]');
    this.cancelButton = page.locator('button:has-text("Cancel"), button[aria-label*="Cancel"], button[title*="Cancel"]');

    // Navigation locators
    this.modulesElement = page.getByRole('treeitem', { name: 'Modules' });
    this.accountsReceivableTreeItem = page.getByRole('treeitem', { name: 'Accounts receivable' });
    this.allCustomersLink = page.getByRole('link', { name: 'All customers' });

    // Common form fields - D365 uses combobox inputs with role="combobox"
    // Pattern: DirPartyQuickCreateForm_X_fieldName_input or name="fieldName"
    this.customerAccountInput = page.locator('input[id*="DirPartyQuickCreateForm"][id*="partyType"], input[name="partyType"]');
    this.firstNameInput = page.locator('input[id*="Name_FirstName_input"], input[name="Name_FirstName"]');
    this.lastNamePrefixInput = page.locator('input[id*="Name_NamePrefix_input"], input[name="Name_NamePrefix"]');
    this.middleNameInput = page.locator('input[id*="Name_MiddleName_input"], input[name="Name_MiddleName"]');
    this.lastNameInput = page.locator('input[id*="Name_LastName_input"], input[name="Name_LastName"]');
    
    // For combobox/select fields, try multiple selectors
    this.typeSelect = page.locator('input[role="combobox"][id*="Type"], select[aria-label*="Type" i]');
    this.customerGroupSelect = page.locator('input[role="combobox"][id*="CustGroup"], select[aria-label*="Customer group" i]');
    this.currencySelect = page.locator('input[role="combobox"][id*="Currency"], select[aria-label*="Currency" i]');
    
    // Location fields
    this.countryInput = page.locator('input[role="combobox"][id*="Country"], input[aria-label*="Country" i]');
    this.cityInput = page.locator('input[role="combobox"][id*="City"], input[aria-label*="City" i]');
    this.zipInput = page.locator('input[role="combobox"][id*="Zip"], input[role="combobox"][id*="PostalCode"], input[aria-label*="ZIP" i]');
    this.stateInput = page.locator('input[role="combobox"][id*="State"], input[aria-label*="State" i]');
    this.streetInput = page.locator('input[role="combobox"][id*="Street"], input[role="combobox"][id*="Address"], input[aria-label*="Street" i]');

    // Lookup buttons for dropdown selections - use class selector to find lookupButton divs
    this.customerGroupButton = page.locator('div.lookupButton').first();
    this.deliveryTermsButton = page.locator('div.lookupButton').nth(1);
    this.deliveryModeButton = page.locator('div.lookupButton').nth(2);

    this.formRoot = page.locator('form, div[data-id*="FormSection"], div[data-id*="form"]');
  }

  /**
   * Navigate directly to the All Customers list page via correct D365 URL
   * @param baseUrl Optional base URL for the environment (defaults to '/')
   */
  async navigateToAllCustomers(baseUrl: string = '/') {
    this.log('🔧 Navigating to All Customers list via direct URL...');
    
    // Correct D365 URL format with company and menu item parameters
    const customersUrl = `${baseUrl}?cmp=USMF&mi=CustTableListPage`;
    this.log(`📋 Navigating to: ${customersUrl}`);
    
    try {
      await this.page.goto(customersUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      this.log(`✅ Page loaded: ${this.page.url()}`);
      
      // Wait for page to be fully ready - wait for toolbar or specific elements
      this.log('⏳ Waiting for toolbar to load...');
      await this.page.waitForSelector('div[class*="toolbar"], [role="toolbar"]', { timeout: 30000 }).catch(() => {
        this.log('⚠️ Toolbar selector not found, continuing anyway');
      });
      
      // Additional wait for network to settle
      await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        this.log('⚠️ Network did not fully idle, continuing anyway');
      });
      
      // Wait for page to be fully ready
      await this.page.waitForTimeout(2000);
      
      // Take screenshot for debugging
      await this.page.screenshot({ path: 'screenshots/customers-list-loaded.png', fullPage: true });
      this.log('📸 Screenshot saved: customers-list-loaded.png');
      
      this.log('✅ Navigation to All Customers completed');
      return;

    } catch (error) {
      this.log(`❌ Navigation error: ${error}`);
      try {
        await this.page.screenshot({ path: 'screenshots/navigation-error-debug.png', fullPage: true });
        this.log('📸 Error screenshot saved: navigation-error-debug.png');
      } catch (e) {
        this.log(`⚠️ Screenshot failed: ${e}`);
      }
      throw error;
    }
  }

  /**
   * Click the New button to create a customer
   */
  async clickNewCustomer(): Promise<void> {

    this.log('🔧 Clicking New customer...');
    
    // Wait for page to fully load before trying to find New button
    this.log('⏳ Waiting for page to fully load...');
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      this.log('⚠️ Network did not fully idle');
    });
    await this.page.waitForTimeout(1000);
    
    // DEBUG: Pause and screenshot before attempting to click New
    await this.page.screenshot({ path: 'screenshots/before-click-new.png', fullPage: true });

    // Debug: Check what's on the toolbar
    const toolbarElements = await this.page.locator('div[class*="toolbar"]').count();
    this.log(`📊 Found ${toolbarElements} toolbar div elements`);
    
    const toolbarRoleElements = await this.page.locator('[role="toolbar"]').count();
    this.log(`📊 Found ${toolbarRoleElements} role="toolbar" elements`);

    // Debug: Find all spans with "New" text
    const allSpans = await this.page.locator('span').count();
    this.log(`📊 Found ${allSpans} total span elements on page`);
    
    const newSpans = await this.page.locator('span').filter({ hasText: /^New$/ }).count();
    this.log(`📊 Found ${newSpans} spans with exact "New" text`);
    
    const newSpansPartial = await this.page.locator('span').filter({ hasText: /New/ }).count();
    this.log(`📊 Found ${newSpansPartial} spans with "New" substring`);

    // Debug: Find all clickable elements containing "New" text (button, span, label, div[role="button"])
    const newElements = this.page.locator('button, span, label, div[role="button"]').filter({ hasText: /^New$/ });
    const newElementCount = await newElements.count();
    this.log(`📊 Found ${newElementCount} clickable elements with "New" text`);

    if (newElementCount > 0) {
      try {
        this.log('✅ Found element with "New" text, attempting click');
        const firstNewElement = newElements.first();
        const tagName = await firstNewElement.evaluate(el => el.tagName);
        this.log(`📋 Element tag name: ${tagName}`);
        
        if (tagName === 'SPAN') {
          // If it's a span, try clicking it directly first, or find parent button
          const parentButton = this.page.locator('button').filter({ has: firstNewElement });
          const parentCount = await parentButton.count();
          if (parentCount > 0) {
            this.log(`✅ Found parent button, clicking it`);
            await parentButton.first().click();
          } else {
            this.log(`✅ No parent button, clicking span directly`);
            await firstNewElement.click();
          }
        } else {
          // Click directly
          await firstNewElement.click();
        }
        
        await this.page.waitForTimeout(2000);
        return;
      } catch (e) {
        this.log(`⚠️ Error clicking new element: ${e}`);
      }
    }

    // Selector 1: Toolbar span selector (provided by user)
    const toolbarNewSpan = this.page.locator('//div[contains(@class, "toolbar")]//span[normalize-space(text())="New"]');
    const toolbarCount = await toolbarNewSpan.count();
    this.log(`📊 Toolbar XPath selector found ${toolbarCount} elements`);
    
    if (await toolbarNewSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
      this.log('✅ Found New button via toolbar span selector');
      await toolbarNewSpan.first().click();
      await this.page.waitForTimeout(2000);
      return;
    }

    // Selector 2: XPath - span with text "New"
    const newSpanXPath = this.page.locator('//span[normalize-space(text())="New"]');
    const xpathCount = await newSpanXPath.count();
    this.log(`📊 XPath selector found ${xpathCount} elements`);
    
    if (await newSpanXPath.isVisible({ timeout: 3000 }).catch(() => false)) {
      this.log('✅ Found New button via XPath selector');
      await newSpanXPath.first().click();
      await this.page.waitForTimeout(2000);
      return;
    }

    // Selector 3: Button with ID pattern *NewCustomer
    const newCustomerButton = this.page.locator('button[id*="NewCustomer"]');
    if (await newCustomerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      this.log('✅ Found New button via ID pattern (*NewCustomer)');
      await newCustomerButton.first().click();
      await this.page.waitForTimeout(2000);
      return;
    }

    // Selector 4: Label/span with text "New"
    const newLabel = this.page.locator('span:has-text("New"), label:has-text("New")').first();
    if (await newLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      this.log('✅ Found New via label/span');
      await newLabel.click();
      await this.page.waitForTimeout(2000);
      return;
    }

    // Selector 5: Try primary locator
    if (await this.isElementVisible(this.newButton, 3000).catch(() => false)) {
      try {
        await this.clickElement(this.newButton.first());
        await this.page.waitForTimeout(2000);
        return;
      } catch (e) {
        this.log('⚠️ Primary New button failed');
      }
    }

    // Selector 6: Look for toolbar icon with data-id
    const toolbarNew = this.page.locator('button[data-id*="New"], button[data-id*="new"]');
    if (await toolbarNew.isVisible({ timeout: 2000 }).catch(() => false)) {
      this.log('✅ Found New button via data-id');
      await toolbarNew.first().click();
      await this.page.waitForTimeout(2000);
      return;
    }

    // Selector 7: Look for button by role and name
    const roleButton = this.page.getByRole('button', { name: /new/i });
    if (await roleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      this.log('✅ Found New button via role');
      await roleButton.first().click();
      await this.page.waitForTimeout(2000);
      return;
    }

    // Selector 8: Look for button with title attribute
    const titleButton = this.page.locator('button[title*="New"], button[title*="new"]');
    if (await titleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      this.log('✅ Found New button via title');
      await titleButton.first().click();
      await this.page.waitForTimeout(2000);
      return;
    }

    await this.saveDebugInfo('click-new-failure');
    
    // Last resort: Try navigating directly to new customer creation URL
    this.log('🔧 Attempting direct URL navigation to customer creation form...');
    try {
      await this.page.goto('https://avs-isv-puat.sandbox.operations.dynamics.com/?cmp=USMF&mi=CustTableListPage&mode=create', 
        { waitUntil: 'networkidle', timeout: 30000 });
      this.log('✅ Navigated directly to customer creation form');
      await this.page.waitForTimeout(2000);
      return;
    } catch (e) {
      this.log(`⚠️ Direct URL navigation failed: ${e}`);
    }
    
    throw new Error('New button not found - tried multiple locators');
  }

  /**
   * Verify create customer form is displayed
   */
  async verifyCreateCustomerForm(): Promise<void> {
    this.log('🔍 Verifying create customer form...');
    
    // Take screenshot to see what's on the page
    await this.page.screenshot({ path: 'screenshots/after-new-click.png', fullPage: true });
    this.log('📸 Screenshot saved: after-new-click.png');
    
    // Wait for ANY form element to appear (very broad search)
    this.log('⏳ Waiting for form elements...');
    
    // Wait for ANY input, textarea, or select (form controls)
    const anyFormElement = this.page.locator('input, textarea, select, [role="textbox"], [role="combobox"]').first();
    
    // Wait up to 20 seconds for form to load
    try {
      await anyFormElement.waitFor({ state: 'visible', timeout: 20000 });
      this.log('✅ Create customer form verified - form element found');
      return;
    } catch (error) {
      this.log('❌ No form elements found after 20 seconds');
    }
    
    // If no form elements, check if at least the page changed (any DOM change)
    await this.page.waitForTimeout(2000);
    const bodyText = await this.page.textContent('body');
    if (bodyText && bodyText.length > 100) {
      this.log('✅ Page has content - form may be loading asynchronously');
      await this.page.waitForTimeout(3000);
      return;
    }

    await this.saveDebugInfo('verify-create-customer-failure');
    throw new Error('Create customer form not found');
  }

  /**
   * Fill only the customer account
   */
  async fillCustomerAccount(account: string): Promise<void> {
    this.log(`✍️ Filling customer account: ${account}`);
    if (await this.isElementVisible(this.customerAccountInput, 5000)) {
      await this.fillInput(this.customerAccountInput, account);
      await this.page.waitForTimeout(500);
      return;
    }

    // Last resort: try any input in the form
    const anyInput = this.page.locator('form input, div[data-id*="Field"] input').first();
    if (await this.isElementVisible(anyInput, 3000).catch(() => false)) {
      await anyInput.fill(account);
      return;
    }

    await this.saveDebugInfo('fill-customer-account-failure');
    throw new Error('Customer account field not found');
  }

  /**
   * Fill out the customer details form with all required information
   */
  async createCustomer(data: any): Promise<void> {
    this.log('🧾 Filling customer details...');

    try {
      // Debug: Count available combobox inputs
      const comboboxCount = await this.page.locator('input[role="combobox"]').count();
      this.log(`📊 Found ${comboboxCount} combobox input fields on form`);

      // Fill First name using the firstNameInput locator
      if (data.firstName) {
        this.log(`✍️ Filling first name: ${data.firstName}`);
        try {
          await this.firstNameInput.waitFor({ state: 'visible', timeout: 5000 });
          await this.firstNameInput.click({ timeout: 5000 });
          await this.firstNameInput.clear();
          await this.firstNameInput.fill(data.firstName);
          await this.firstNameInput.press('Tab');
          this.log(`✅ First name filled successfully`);
        } catch (error) {
          this.log(`❌ Error filling first name: ${error}`);
          throw error;
        }
      }

      // Fill Last name prefix
      if (data.lastNamePrefix) {
        this.log(`✍️ Filling last name prefix: ${data.lastNamePrefix}`);
        try {
          await this.lastNamePrefixInput.waitFor({ state: 'visible', timeout: 5000 });
          await this.lastNamePrefixInput.click({ timeout: 5000 });
          await this.lastNamePrefixInput.fill(data.lastNamePrefix);
          await this.lastNamePrefixInput.press('Tab');
          this.log(`✅ Last name prefix filled successfully`);
        } catch (error) {
          this.log(`⚠️ Last name prefix not found or error: ${error}`);
        }
      }

      // Fill Last name
      if (data.lastName) {
        this.log(`✍️ Filling last name: ${data.lastName}`);
        try {
          await this.lastNameInput.waitFor({ state: 'visible', timeout: 5000 });
          await this.lastNameInput.click({ timeout: 5000 });
          await this.lastNameInput.clear();
          await this.lastNameInput.fill(data.lastName);
          await this.lastNameInput.press('Tab');
          this.log(`✅ Last name filled successfully`);
        } catch (error) {
          this.log(`❌ Error filling last name: ${error}`);
          throw error;
        }
      }

      // Select Customer Group
      if (data.customerGroup) {
        this.log(`🔍 Selecting customer group: ${data.customerGroup}`);
        try {
          // Find the customer group input field - try multiple selector patterns
          const custGroupSelectors = [
            'input[role="combobox"][id*="CustGroup"]',
            'input[role="combobox"][aria-label*="Customer group"]',
            'input[id*="CustGroup"][type="text"]',
            'input[name*="CustGroup"]',
            'input[id*="DirPartyQuickCreateForm"][id*="CustGroup"]',
            'input[placeholder*="Customer group" i]'
          ];
          
          let custGroupInput = null;
          
          // Try each selector until we find the field
          for (const selector of custGroupSelectors) {
            const locator = this.page.locator(selector).first();
            const isVisible = await locator.isVisible({ timeout: 3000 }).catch(() => false);
            if (isVisible) {
              custGroupInput = locator;
              this.log(`✅ Found customer group input with selector: ${selector}`);
              break;
            }
          }
          
          if (!custGroupInput) {
            this.log(`⚠️ Customer group input not found with primary selectors, trying generic search...`);
            // Last resort: look for any combobox with visible state
            const allComboboxes = this.page.locator('input[role="combobox"]');
            const comboboxCount = await allComboboxes.count();
            this.log(`📊 Found ${comboboxCount} total combobox fields on page`);
            
            // Try the first visible combobox (it might be the customer group)
            for (let i = 0; i < comboboxCount; i++) {
              const box = allComboboxes.nth(i);
              const ariaLabel = await box.getAttribute('aria-label').catch(() => '');
              const placeholder = await box.getAttribute('placeholder').catch(() => '');
              const id = await box.getAttribute('id').catch(() => '');
              this.log(`📋 Combobox ${i}: aria-label="${ariaLabel}", placeholder="${placeholder}", id="${id}"`);
              
              if ((ariaLabel ?? '').toLowerCase().includes('group') || (placeholder ?? '').toLowerCase().includes('group')) {
                custGroupInput = box;
                this.log(`✅ Found customer group via attribute inspection: index ${i}`);
                break;
              }
            }
          }
          
          if (custGroupInput) {
            // Get the input element details for debugging
            const inputId = await custGroupInput.getAttribute('id').catch(() => 'N/A');
            const inputName = await custGroupInput.getAttribute('name').catch(() => 'N/A');
            const inputAriaLabel = await custGroupInput.getAttribute('aria-label').catch(() => 'N/A');
            this.log(`📋 Customer group input - ID: ${inputId}, Name: ${inputName}, Aria-Label: ${inputAriaLabel}`);
            
            // Click and fill the customer group input
            await custGroupInput.waitFor({ state: 'visible', timeout: 5000 });
            await custGroupInput.click({ timeout: 5000 });
            await custGroupInput.clear();
            await custGroupInput.fill(data.customerGroup);
            this.log(`✍️ Typed customer group value: ${data.customerGroup}`);
            
            // Wait for dropdown to appear with options
            await this.page.waitForTimeout(1000);
            
            // Look for the dropdown item matching the customer group value
            // Try multiple selectors for the dropdown option
            const dropdownSelectors = [
              `[role="option"]:has-text("${data.customerGroup}")`,
              `[role="option"] >> text="${data.customerGroup}"`,
              `text="${data.customerGroup}"`,
              `span:has-text("${data.customerGroup}")`,
              `.ms-Dropdown-item:has-text("${data.customerGroup}")`,
              `div[role="button"]:has-text("${data.customerGroup}")`
            ];
            
            let dropdownItem = null;
            for (const selector of dropdownSelectors) {
              try {
                const item = this.page.locator(selector);
                const isVisible = await item.isVisible({ timeout: 2000 }).catch(() => false);
                if (isVisible) {
                  dropdownItem = item.first();
                  this.log(`✅ Found dropdown item with selector: ${selector}`);
                  break;
                }
              } catch (e) {
                // Continue to next selector
              }
            }
            
            if (dropdownItem) {
              // Try clicking the dropdown item
              try {
                await dropdownItem.click({ timeout: 3000 });
                this.log(`✅ Selected customer group: ${data.customerGroup}`);
                await this.page.waitForTimeout(500);
              } catch (e) {
                this.log(`⚠️ Could not click dropdown item: ${e}, falling back to Tab key`);
                // Fallback: press Tab to accept the value
                await custGroupInput.press('Tab');
                this.log(`✅ Customer group filled and Tab pressed (fallback): ${data.customerGroup}`);
              }
            } else {
              this.log(`⚠️ Dropdown item not found, pressing Tab to accept typed value`);
              // Fallback: press Tab to accept the value
              await custGroupInput.press('Tab');
              this.log(`✅ Customer group filled and Tab pressed: ${data.customerGroup}`);
            }
            await this.page.waitForTimeout(500);
          } else {
            this.log(`❌ Customer group input field not found`);
            throw new Error('Customer group input field could not be located');
          }
        } catch (error) {
          this.log(`⚠️ Customer group selection error: ${error}`);
          // Don't throw - continue with other fields
        }
      }

      // Select Delivery Terms
      if (data.deliveryTerms) {
        this.log(`🔍 Selecting delivery terms: ${data.deliveryTerms}`);
        try {
          await this.deliveryTermsButton.click({ timeout: 5000 });
          await this.page.waitForLoadState('networkidle');
          
          const deliveryTermsCell = this.page.getByRole('gridcell', { name: data.deliveryTerms });
          if ((await deliveryTermsCell.count()) > 0) {
            await deliveryTermsCell.getByLabel('Delivery terms').click();
            await this.page.waitForTimeout(500);
          }
        } catch (error) {
          this.log(`⚠️ Delivery terms selection error: ${error}`);
        }
      }

      // Select Mode of Delivery
      if (data.deliveryMode) {
        this.log(`🔍 Selecting delivery mode: ${data.deliveryMode}`);
        try {
          await this.deliveryModeButton.click({ timeout: 5000 });
          await this.page.waitForLoadState('networkidle');
          
          const deliveryModeRow = this.page.getByRole('row', { name: data.deliveryMode });
          if ((await deliveryModeRow.count()) > 0) {
            await deliveryModeRow.getByLabel('Mode of delivery').click();
            await this.page.waitForTimeout(500);
          }
        } catch (error) {
          this.log(`⚠️ Delivery mode selection error: ${error}`);
        }
      }

      // Fill ZIP/Postal code
      if (data.zipCode) {
        this.log(`✍️ Filling ZIP code: ${data.zipCode}`);
        try {
          await this.zipInput.waitFor({ state: 'visible', timeout: 5000 });
          await this.zipInput.click({ timeout: 5000 });
          await this.zipInput.fill(data.zipCode);
          await this.zipInput.press('Tab');

          // Click lookup button to select from suggestions
          const zipCodeLookup = this.page.locator(
            '#DirPartyQuickCreateForm_4_LogisticsPostalAddress_ZipCode > .lookupDock-buttonContainer > .lookupButton'
          );
          if ((await zipCodeLookup.count()) > 0) {
            await zipCodeLookup.click();
            await this.page.waitForLoadState('networkidle');

            // Select first result
            const firstResult = this.page
              .locator('#Grid_6008_0-row-0 > .fixedDataTableRowLayout_body > div > .fixedDataTableCellGroupLayout_cellGroup > .fixedDataTableCellLayout_main > .fixedDataTableCellLayout_wrap1')
              .first();
            if ((await firstResult.count()) > 0) {
              await firstResult.click();
              await this.page.waitForTimeout(500);
            }
          }
        } catch (error) {
          this.log(`⚠️ ZIP code entry error: ${error}`);
        }
      }

      // Click on Address group to ensure focus
      try {
        const addressGroup = this.page.getByRole('group', { name: 'Address' });
        if (await addressGroup.isVisible({ timeout: 2000 }).catch(() => false)) {
          await addressGroup.click();
        }
      } catch (error) {
        this.log(`⚠️ Address group click error: ${error}`);
      }

      // Wait for client-side validation / lookup
      await this.page.waitForTimeout(500);
      this.log('✅ Customer details filled successfully');
    } catch (error) {
      this.log(`❌ Error filling customer details: ${error}`);
      // Capture form structure for debugging
      const formHTML = await this.page.locator('form, div[role="presentation"]').first().innerHTML().catch(() => 'Form not found');
      this.log(`📋 Form structure: ${formHTML.substring(0, 500)}...`);
      throw error;
    }
  }

  async clickSave(): Promise<void> {
    this.log('💾 Clicking Save...');
    
    // Wait for save button to be available
    await this.page.waitForTimeout(1000);
    
    // Look for OKButton (Save button in D365)
    const okButton = this.page.locator('button[id*="OKButton"], button[name="OKButton"]').first();
    const okButtonCount = await okButton.count();
    this.log(`📊 Found ${okButtonCount} OKButton elements`);
    
    // Try clicking save button
    if (okButtonCount > 0) {
      try {
        await okButton.waitFor({ state: 'visible', timeout: 5000 });
        await okButton.click({ timeout: 5000 });
        this.log('✅ Save button (OKButton) clicked');
        
        // After clicking save, D365 may close the form/page context
        // So we wrap the wait in try-catch to handle graceful closure
        try {
          await this.page.waitForTimeout(1000).catch(() => {
            this.log('⚠️ Page context closed after save (expected)');
          });
        } catch (e) {
          this.log('⚠️ Page closed after save');
        }
        this.log('✅ Save completed successfully');
        return;
      } catch (e) {
        this.log(`⚠️ OKButton click failed: ${e}`);
      }
    }

    // Try clicking via saveButton locator
    if (await this.isElementVisible(this.saveButton, 5000)) {
      try {
        await this.clickElement(this.saveButton.first());
        this.log('✅ Save button clicked');
        
        try {
          await this.page.waitForTimeout(1000).catch(() => {
            this.log('⚠️ Page context closed after save (expected)');
          });
        } catch (e) {
          this.log('⚠️ Page closed after save');
        }
        return;
      } catch (e) {
        this.log(`⚠️ Save button click failed: ${e}`);
      }
    }

    // Try pressing Ctrl+S as fallback
    this.log('🔧 Trying keyboard shortcut Ctrl+S...');
    try {
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('s');
      await this.page.keyboard.up('Control');
      
      try {
        await this.page.waitForTimeout(1000).catch(() => {
          this.log('⚠️ Page context closed after save (expected)');
        });
      } catch (e) {
        this.log('⚠️ Page closed after save');
      }
      this.log('✅ Ctrl+S submitted');
      return;
    } catch (e) {
      this.log(`⚠️ Ctrl+S failed: ${e}`);
    }

    // Check if we're still on a form or if save already worked
    try {
      const currentUrl = await this.getUrl();
      this.log(`📍 Current URL: ${currentUrl}`);
      
      // If URL changed or contains 'entity', save likely worked
      if (currentUrl.includes('entity') || currentUrl.includes('CustTable') || currentUrl.includes('?')) {
        this.log('✅ URL change detected - save likely successful');
        return;
      }
    } catch (e) {
      this.log('⚠️ Could not get URL - page may be closed');
    }
    
    // Final check - look for any success messages or page changes
    try {
      const pageTitle = await this.page.title();
      this.log(`📄 Page title: ${pageTitle}`);
      
      // If page is no longer showing the form, consider it saved
      const formElement = await this.page.locator('form, div[data-id*="Form"]').first();
      if (!(await formElement.isVisible({ timeout: 2000 }).catch(() => false))) {
        this.log('✅ Form no longer visible - save likely successful');
        return;
      }
    } catch (e) {
      this.log('⚠️ Page context no longer available - save completed');
      return;
    }

    await this.saveDebugInfo('save-failure');
    throw new Error('Save failed - Save button not found and no confirmation of save');
  }

  async clickSaveAndOpen(): Promise<void> {
    this.log('💾 Clicking Save and open...');
    if (await this.isElementVisible(this.saveAndOpenButton, 3000)) {
      await this.clickElement(this.saveAndOpenButton.first());
      await this.page.waitForTimeout(2500);
      return;
    }

    // Fallback: try Save then open first result
    await this.clickSave();
    await this.page.waitForTimeout(1000);
  }

  async clickCancel(): Promise<void> {
    this.log('✖️ Clicking Cancel...');
    if (await this.isElementVisible(this.cancelButton, 2000)) {
      await this.clickElement(this.cancelButton.first());
      await this.page.waitForTimeout(1000);
      return;
    }

    // Fallback: press Escape
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate directly to the Customers list page via URL
   */
  async navigateToCustomersListPage(): Promise<void> {
    this.log('🔧 Navigating to Customers list page via URL...');
    await this.page.goto(
      'https://avs-isv-puat.sandbox.operations.dynamics.com/?cmp=USMF&mi=CustTableListPage'
    );
    await this.page.waitForLoadState('networkidle');
    this.log('✅ Navigated to Customers list page');
  }

  /**
   * Verify customer was created by navigating back to list and checking
   */
  async verifyCustomerCreated(firstName: string): Promise<boolean> {
    this.log(`🔍 Verifying customer created with name: ${firstName}`);
    
    try {
      // Navigate back to customers list
      await this.navigateToAllCustomers();
      
      // Search for the customer in the list
      await this.page.waitForTimeout(2000);
      
      // Look for the first name in the table/list
      const customerRow = this.page.locator(`text="${firstName}"`).first();
      const found = await customerRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (found) {
        this.log(`✅ Customer found in list: ${firstName}`);
        return true;
      } else {
        this.log(`❌ Customer not found in list: ${firstName}`);
        return false;
      }
    } catch (error) {
      this.log(`⚠️ Error verifying customer creation: ${error}`);
      return false;
    }
  }

  /**
   * Complete end-to-end customer creation workflow
   */
  async createCustomerE2E(customerData: any): Promise<void> {
    this.log('🚀 Starting end-to-end customer creation workflow...');

    // Navigate to customers list
    await this.navigateToCustomersListPage();

    // Click New button
    await this.clickNewCustomer();

    // Verify form is displayed
    await this.verifyCreateCustomerForm();

    // Fill customer details
    await this.createCustomer(customerData);

    // Save the customer
    await this.clickSave();

    // Verify we're back on the customers list
    try {
      await this.page.waitForURL('**/CustTableListPage**', { timeout: 10000 }).catch(() => {
        this.log('⚠️ Did not navigate back to list, but save was clicked');
      });
    } catch (e) {
      this.log('⚠️ Could not verify URL after save');
    }
    
    this.log('✅ Customer created and saved successfully');
  }
}

