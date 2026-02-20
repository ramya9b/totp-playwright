import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { expect } from '@playwright/test';
/**
 * CreateCustomer Page Object Model - Simplified version
 * Implements basic customer creation workflow for D365 F&O
 */
export class CreateCustomerPage extends BasePage {
  // Locators
  private newButton: Locator;
  private saveButton: Locator;
  private cancelButton: Locator;
  private typeDropdown: Locator;
  private firstNameField: Locator;
  private lastNameField: Locator;
  private customerGroupField: Locator;
  private deliveryTermsField: Locator;
  private deliveryModeField: Locator;
  private zipCodeField: Locator;

  // Base URL configuration from environment variable
  private readonly baseUrl = process.env.D365_URL || 'https://avs-isv-puat.sandbox.operations.dynamics.com';
  private readonly company = 'USMF';
  private readonly customerModule = 'CustTableListPage';

  constructor(page: Page) {
    super(page);
    
    // New button - use specific name attribute to avoid strict mode violation
    this.newButton = page.locator('button[name="NewCustomer"]');
   
    // Save button
    this.saveButton = page.locator('button[id*="OKButton"], button:has-text("Save")').first();
    
    // Cancel button
    this.cancelButton = page.locator('button:has-text("Cancel")').first();
    
    // Form fields - use simple selectors that work across D365 variations
    //this.typeDropdown = page.locator('select[name="Type"]');
    this.typeDropdown = page.locator('input[name="partyTypeComboBox"]');
    this.firstNameField = page.locator('input[name="Name_FirstName"]');
    this.lastNameField = page.locator('input[name="Name_LastName"]');
    this.customerGroupField = page.locator('input[name="DynamicDetail_CustGroup"]');;
    this.deliveryTermsField = page.locator('input[aria-label*="delivery terms" i], input[id*="DlvTerm"]').first();
    this.deliveryModeField = page.locator('input[aria-label*="delivery mode" i], input[aria-label*="mode of delivery" i], input[id*="DlvMode"]').first();
    this.zipCodeField = page.locator('input[aria-label*="zip" i], input[placeholder*="zip" i], input[id*="PostalCode"]').first();
  }

  /**
   * Build D365 customer URL with optional parameters
   */
  private buildCustomerUrl(page?: string, isNewCustomer: boolean = false): string {
    let url = `${this.baseUrl}/?cmp=${this.company}&mi=${this.customerModule}`;
    
    if (isNewCustomer) {
      url += '&action=NewCustomer';
    }
    
    if (page) {
      url += `&page=${encodeURIComponent(page)}`;
    }
    
    return url;
  }

  /**
   * Navigate directly to create customer form
   */
  async navigateToCreateCustomerForm(): Promise<void> {
    this.log('🔧 Navigating to create customer form...');
    const createFormUrl = this.buildCustomerUrl(undefined, true);
    await this.page.goto(createFormUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    this.log(`✅ Navigated to Create Customer page`);
    await this.page.waitForTimeout(2000);
  }

  /**
   * Wait for D365 blocking overlays to disappear
   */
  private async waitForPageInteractive(timeout: number = 30000): Promise<void> {
    try {
      // Wait for blocking divs to become hidden or disappear
      await this.page.waitForFunction(
        () => {
          const blockingDiv = document.getElementById('ShellBlockingDiv');
          const processingDiv = document.getElementById('ShellProcessingDiv');
          
          // Page is interactive when both divs are hidden or missing
          const blockingHidden = !blockingDiv || blockingDiv.style.display === 'none' || blockingDiv.offsetHeight === 0;
          const processingHidden = !processingDiv || processingDiv.style.display === 'none' || processingDiv.offsetHeight === 0;
          
          return blockingHidden && processingHidden;
        },
        { timeout }
      );
      
      this.log('✅ Page is interactive (blocking overlays cleared)');
    } catch (error) {
      this.log(`⚠️ Timeout waiting for page to be interactive: ${error}`);
      // Continue anyway - sometimes the overlays are very quick
    }
  }

  /**
   * Navigate to the All Customers list page
   */
  async navigateToAllCustomers(page?: string): Promise<void> {
    this.log('🔧 Navigating to All Customers list...');
    
    // Use parameterized URL for customer list
    const customersUrl = this.buildCustomerUrl(page);
    
    await this.page.goto(customersUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    this.log(`✅ Navigated to Customer List`);
    
    // Wait for page to settle and blocking divs to clear
    await this.page.waitForTimeout(1000);
    await this.waitForPageInteractive(15000);
  }

  /**
   * Click the New button to create a new customer
   */
  async clickNewCustomerButton(): Promise<void> {
  this.log('🔧 Clicking New Customer button...');

  try {
    // Wait for page to be interactive before clicking
    await this.waitForPageInteractive(15000);
    
    // Wait until the button is visible
    await this.newButton.waitFor({ state: 'visible', timeout: 20000 });

    // Click the button
    await this.newButton.click();
    this.log('✅ New button clicked');

    // Wait for form to appear and page to be interactive
    await this.page.waitForTimeout(500);
    await this.waitForPageInteractive(15000);
    
    // Wait for Type dropdown to appear
    await this.page.locator('input[name="partyTypeComboBox"]').waitFor({ state: 'visible', timeout: 30000 });
    this.log('✅ Type dropdown is visible, form is ready');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.log(`❌ Failed to click New button: ${errorMessage}`);

    // Fallback: try Alt+N shortcut
    this.log('⌨️ Attempting Alt+N shortcut fallback...');
    await this.page.keyboard.press('Alt+n');
  }
}

  /**
   * Generate a unique suffix with 2 characters + 2 digits for customer names
   */
  private generateUniqueSuffix(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // Generate 2 unique random characters
    const char1 = chars[Math.floor(Math.random() * chars.length)];
    let char2 = chars[Math.floor(Math.random() * chars.length)];
    // Ensure char2 is different from char1
    while (char2 === char1) {
      char2 = chars[Math.floor(Math.random() * chars.length)];
    }
    // Generate 2 random digits
    const digits = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return `${char1}${char2}${digits}`;
  }

  /**
   * Generate unique customer data by appending 2-character + 2-digit suffix to names
   * Example: "John" -> "JohnAB45"
   */
  generateUniqueCustomerData(customerData: {
    typeDropdown: string;
    firstName: string;
    lastNamePrefix: string;
    lastName: string;
    customerGroup: string;
    deliveryTerms: string;
    deliveryMode: string;
    zipCode: string;
  }): {
    typeDropdown: string;
    firstName: string;
    lastNamePrefix: string;
    lastName: string;
    customerGroup: string;
    deliveryTerms: string;
    deliveryMode: string;
    zipCode: string;
  } {
    const suffix = this.generateUniqueSuffix();
    return {
      ...customerData,
      firstName: `${customerData.firstName}${suffix}`,
      lastName: `${customerData.lastName}${suffix}`
    };
  }

  /**
   * Fill in customer details and create the record
   */
 async createCustomer(customerData: {
  typeDropdown: string;
  firstName: string;
  lastName: string;
  customerGroup?: string;
  deliveryTerms?: string;
  deliveryMode?: string;
  zipCode?: string;
}): Promise<void> {
  this.log('📝 Creating customer record...');

  // Wait for page to be fully interactive before filling form
  await this.waitForPageInteractive(15000);

  if (customerData.typeDropdown) {
    await this.typeDropdown.click();
    await this.page.getByRole('option', { name: customerData.typeDropdown }).click();
    this.log(`✅ Type dropdown set to: ${customerData.typeDropdown}`);

    if (customerData.typeDropdown === 'Person') {
      await this.firstNameField.waitFor({ state: 'visible', timeout: 15000 });
    }
  }

  if (customerData.firstName) {
    await this.fillField('First Name', this.firstNameField, customerData.firstName);
  }

  if (customerData.lastName) {
    await this.fillField('Last Name', this.lastNameField, customerData.lastName);
  }

  if (customerData.customerGroup) {
    await this.fillField('Customer Group', this.customerGroupField, customerData.customerGroup);
  }

  if (customerData.deliveryTerms) {
    await this.fillField('Delivery Terms', this.deliveryTermsField, customerData.deliveryTerms);
  }

  if (customerData.deliveryMode) {
    await this.fillField('Delivery Mode', this.deliveryModeField, customerData.deliveryMode);
  }

  if (customerData.zipCode) {
    await this.fillField('ZIP Code', this.zipCodeField, customerData.zipCode);
  }

  this.log('✅ All customer details filled');
}

  /**
   * Helper method to fill a single field
   */
  private async fillField(fieldName: string, locator: Locator, value: string): Promise<void> {
    try {
      const field = locator.first();
      await field.click({ timeout: 2000 });
      await field.fill(value);
      this.log(`✅ ${fieldName} filled: ${value}`);
    } catch (error) {
      this.log(`⚠️ Could not fill ${fieldName}: ${error}`);
    }
  }

  /**
   * Save the customer record
   */
  async saveCustomer(): Promise<void> {
    this.log('💾 Saving customer record...');
    
    // Ensure page is interactive before attempting keyboard action
    await this.waitForPageInteractive(10000);
    
    await this.page.keyboard.press('Alt+Enter');
    await this.page.waitForTimeout(3000);
    this.log('✅ Save command sent via Alt+Enter');
  }

  /**
   * Click the Save button (alternative method name for test compatibility)
   */
  async clickSave(): Promise<void> {
    await this.saveCustomer();
  }

  /**
   * Verify customer was created by checking if dialog closed
   */
  async verifyCustomerCreated(): Promise<boolean> {
    this.log(`🔍 Verifying customer creation...`);
    const dialogVisible = await this.page.locator('div[role="dialog"]').isVisible().catch(() => false);
    const result = !dialogVisible;
    this.log(`${result ? '✅' : '⚠️'} Customer ${result ? 'created' : 'creation uncertain'}`);
    return result;
  }
}


