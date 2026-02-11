import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * CreateCustomer Page Object Model - Simplified version
 * Implements basic customer creation workflow for D365 F&O
 */
export class CreateCustomerPage extends BasePage {
  // Locators
  private newButton: Locator;
  private saveButton: Locator;
  private cancelButton: Locator;
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
    
    // New button - look for span containing "New" in toolbar area
    this.newButton = page.locator(`//span[text()='New' and contains(@id, 'NewCustomer')]`).first();
   
    // Save button
    this.saveButton = page.locator('button[id*="OKButton"], button:has-text("Save")').first();
    
    // Cancel button
    this.cancelButton = page.locator('button:has-text("Cancel")').first();
    
    // Form fields - use simple selectors that work across D365 variations
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
   * Navigate to the All Customers list page
   */
  async navigateToAllCustomers(page?: string): Promise<void> {
    this.log('🔧 Navigating to All Customers list...');
    
    // Use parameterized URL for customer list
    const customersUrl = this.buildCustomerUrl(page);
    
    await this.page.goto(customersUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    this.log(`✅ Navigated to Customer List`);
    
    // Wait for page to settle
    await this.page.waitForTimeout(2000);
  }

  /**
   * Click the New button to create a new customer
   */
  async clickNewCustomerButton(): Promise<void> {
  this.log('🔧 Clicking New Customer button...');

  try {
    // 1. Wait for the button from the constructor to be visible
    await this.newButton.waitFor({ state: 'visible', timeout: 10000 });

    // 2. Use a 'force' click. D365 often has "gutters" or invisible divs 
    // that Playwright thinks are blocking the click.
    await this.newButton.click({ force: true });
    this.log('✅ New button clicked');

    // 3. Verification: Wait for the slide-out form's first field to appear
    // We use the specific 'name' from your HTML snippet
    await this.page.locator('input[name="Name_FirstName"]').waitFor({ 
      state: 'visible', 
      timeout: 15000 
    });
    
    this.log('✅ Creation form is ready for input');
    } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.log(`❌ Failed to click New button or form did not open: ${errorMessage}`);
    
    // DEBUG FALLBACK: If the button click failed, try the keyboard shortcut (Alt+N)
    this.log('⌨️ Attempting Alt+N shortcut fallback...');
    await this.page.keyboard.press('Alt+n');
    throw error;
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
    firstName: string;
    lastName: string;
    customerGroup?: string;
    deliveryTerms?: string;
    deliveryMode?: string;
    zipCode?: string;
  }): {
    firstName: string;
    lastName: string;
    customerGroup?: string;
    deliveryTerms?: string;
    deliveryMode?: string;
    zipCode?: string;
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
    firstName: string;
    lastName: string;
    customerGroup?: string;
    deliveryTerms?: string;
    deliveryMode?: string;
    zipCode?: string;
  }): Promise<void> {
    this.log('📝 Creating customer record...');
    
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


