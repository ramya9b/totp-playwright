import { Page, expect } from '@playwright/test';

export class CreateCustomer {
  constructor(private page: Page) {}

  /**
   * Navigate to the Accounts Receivable module and open All Customers page
   */
  async navigateToAllCustomers(): Promise<void> {
    await this.page.getByRole('treeitem', { name: 'Accounts receivable' }).click();
    await this.page.getByRole('link', { name: 'All customers' }).click();
    
    // Wait for the customers list page to load
    await this.page.waitForURL('**/CustTableListPage**');
  }

  /**
   * Navigate directly to the Customers list page
   */
  async goToCustomersListPage(): Promise<void> {
    await this.page.goto(
      'https://avs-isv-puat.sandbox.operations.dynamics.com/?cmp=USMF&mi=CustTableListPage'
    );
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click the New button to create a new customer
   */
  async clickNewButton(): Promise<void> {
    await this.page.locator('button[name="NewCustomer"]').click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill in basic customer information (First Name, Last Name Prefix, Last Name)
   */
  async fillBasicCustomerInfo(
    firstName: string,
    lastNamePrefix: string,
    lastName: string
  ): Promise<void> {
    // Fill First name
    const firstNameCombo = this.page.getByRole('combobox', { name: 'First name' });
    await firstNameCombo.click();
    await firstNameCombo.fill(firstName);
    await firstNameCombo.press('Tab');

    // Fill Last name prefix
    const lastNamePrefixCombo = this.page.getByRole('combobox', {
      name: 'Last name prefix',
    });
    await lastNamePrefixCombo.click();
    await lastNamePrefixCombo.fill(lastNamePrefix);

    // Fill Last name
    const lastNameCombo = this.page.getByRole('combobox', {
      name: 'Last name',
      exact: true,
    });
    await lastNameCombo.click();
    await lastNameCombo.fill(lastName);
  }

  /**
   * Select Customer Group by clicking the lookup button
   */
  async selectCustomerGroup(): Promise<void> {
    const custGroupLookup = this.page.locator(
      '#DirPartyQuickCreateForm_4_DynamicDetail_CustGroup > .lookupDock-buttonContainer > .lookupButton'
    );
    await custGroupLookup.click();
    await this.page.waitForLoadState('networkidle');

    // Select the first item in the lookup
    const firstItem = this.page.locator('#Sel_5916_0_0_input');
    await firstItem.click();
  }

  /**
   * Select Delivery Terms by clicking the lookup button
   */
  async selectDeliveryTerms(): Promise<void> {
    const dlvTermLookup = this.page.locator(
      '#DirPartyQuickCreateForm_4_DynamicDetail_DlvTerm > .lookupDock-buttonContainer > .lookupButton'
    );
    await dlvTermLookup.click();
    await this.page.waitForLoadState('networkidle');

    // Select CFR from grid
    const cfrCell = this.page.getByRole('gridcell', { name: 'CFR' });
    await cfrCell.getByLabel('Delivery terms').click();
  }

  /**
   * Select Mode of Delivery by clicking the lookup button
   */
  async selectDeliveryMode(): Promise<void> {
    const dlvModeLookup = this.page.locator(
      '#DirPartyQuickCreateForm_4_DynamicDetail_DlvMode > .lookupDock-buttonContainer > .lookupButton'
    );
    await dlvModeLookup.click();
    await this.page.waitForLoadState('networkidle');

    // Select Truck from grid
    const truckRow = this.page.getByRole('row', { name: 'Truck' });
    await truckRow.getByLabel('Mode of delivery').click();
  }

  /**
   * Fill in ZIP/Postal code
   */
  async fillZipCode(zipCode: string): Promise<void> {
    const zipCodeCombo = this.page.getByRole('combobox', {
      name: 'ZIP/postal code',
    });
    await zipCodeCombo.click();
    await zipCodeCombo.fill(zipCode);

    // Click the lookup button to select from suggestions
    const zipCodeLookup = this.page.locator(
      '#DirPartyQuickCreateForm_4_LogisticsPostalAddress_ZipCode > .lookupDock-buttonContainer > .lookupButton'
    );
    await zipCodeLookup.click();
    await this.page.waitForLoadState('networkidle');

    // Select the first result
    const firstResult = this.page
      .locator('#Grid_6008_0-row-0 > .fixedDataTableRowLayout_body > div > .fixedDataTableCellGroupLayout_cellGroup > .fixedDataTableCellLayout_main > .fixedDataTableCellLayout_wrap1')
      .first();
    await firstResult.click();
  }

  /**
   * Complete the customer creation form by filling all required fields
   */
  async fillCompleteCustomerForm(
    firstName: string,
    lastNamePrefix: string,
    lastName: string,
    zipCode: string
  ): Promise<void> {
    // Fill basic info
    await this.fillBasicCustomerInfo(firstName, lastNamePrefix, lastName);

    // Select Customer Group
    await this.selectCustomerGroup();

    // Select Delivery Terms
    await this.selectDeliveryTerms();

    // Select Mode of Delivery
    await this.selectDeliveryMode();

    // Fill ZIP Code
    await this.fillZipCode(zipCode);

    // Click on Address group to ensure focus
    const addressGroup = this.page.getByRole('group', { name: 'Address' });
    await addressGroup.click();
  }

  /**
   * Save the customer record
   */
  async saveCustomer(): Promise<void> {
    const saveButton = this.page.getByRole('button', { name: 'Save', exact: true });
    await saveButton.click();
    
    // Wait for save to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Complete end-to-end customer creation
   */
  async createCustomer(
    firstName: string,
    lastNamePrefix: string,
    lastName: string,
    zipCode: string
  ): Promise<void> {
    // Navigate to customers list
    await this.goToCustomersListPage();

    // Click New button
    await this.clickNewButton();

    // Fill in all customer information
    await this.fillCompleteCustomerForm(
      firstName,
      lastNamePrefix,
      lastName,
      zipCode
    );

    // Save the customer
    await this.saveCustomer();

    // Verify we're back on the customers list
    await this.page.waitForURL('**/CustTableListPage**');
  }
}

