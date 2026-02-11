import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Interface for customer data from Excel
 */
export interface CustomerTestData {
  firstName: string;
  lastNamePrefix: string;
  lastName: string;
  customerGroup: string;
  deliveryTerms: string;
  deliveryMode: string;
  zipCode: string;
}

/**
 * Validate Excel file integrity
 */
function validateExcelFile(filePath: string): void {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  // Check file size
  const stats = fs.statSync(filePath);
  console.log(`📊 Excel file size: ${stats.size} bytes`);

  if (stats.size === 0) {
    throw new Error(`Excel file is empty: ${filePath}`);
  }

  // Check if file is readable
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (error) {
    throw new Error(`Excel file is not readable: ${filePath} - ${error}`);
  }

  // Check ZIP signature (Excel files are ZIP files)
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);

  const zipSignature = buffer.readUInt32LE(0);
  const expectedSignature = 0x04034b50; // PK\x03\x04

  if (zipSignature !== expectedSignature) {
    console.warn(`⚠️ File signature mismatch. Expected: 0x${expectedSignature.toString(16)}, Got: 0x${zipSignature.toString(16)}`);
    console.warn(`⚠️ File may be corrupted or not a valid Excel file`);
  }

  console.log(`✅ Excel file validation passed`);
}

/**
 * Public function to validate Excel file before tests
 */
export function validateCustomerExcelFile(
  excelFilePath: string = 'test-data/customer-data.xlsx'
): void {
  const filePath = path.resolve(excelFilePath);
  validateExcelFile(filePath);
}

/**
 * Read customer test data from Excel file
 * @param excelFilePath - Path to the Excel file
 * @param sheetName - Name of the sheet to read (defaults to first sheet)
 * @param rowIndex - Row index to read (defaults to 1, which is the first data row after headers)
 * @returns Customer test data object
 */
export function readCustomerDataFromExcel(
  excelFilePath: string = 'test-data/customer-data.xlsx',
  sheetName?: string,
  rowIndex: number = 1
): CustomerTestData {
  // Resolve file path
  const filePath = path.resolve(excelFilePath);

  try {
    // Validate file integrity before reading
    validateExcelFile(filePath);

    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get sheet name (use first sheet if not specified)
    const sheet = sheetName || workbook.SheetNames[0];
    
    if (!workbook.Sheets[sheet]) {
      throw new Error(`Sheet "${sheet}" not found in Excel file`);
    }

    // Convert sheet to JSON
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: '' });

    if (!data || data.length === 0) {
      throw new Error('No data found in Excel sheet');
    }

    // Get the specific row (default to first row)
    const row = data[rowIndex];
    
    if (!row) {
      throw new Error(`Row ${rowIndex} not found in Excel sheet`);
    }

    // Map Excel columns to CustomerTestData interface
    const rowData = row as any;
    const customerData: CustomerTestData = {
      firstName: String(rowData['First Name'] || rowData['firstName'] || ''),
      lastNamePrefix: String(rowData['Last Name Prefix'] || rowData['lastNamePrefix'] || ''),
      lastName: String(rowData['Last Name'] || rowData['lastName'] || ''),
      customerGroup: String(rowData['Customer Group'] || rowData['customerGroup'] || ''),
      deliveryTerms: String(rowData['Delivery Terms'] || rowData['deliveryTerms'] || ''),
      deliveryMode: String(rowData['Delivery Mode'] || rowData['deliveryMode'] || ''),
      zipCode: String(rowData['ZIP Code'] || rowData['zipCode'] || '')
    };

    return customerData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error reading Excel file: ${errorMessage}`);
    throw error;
  }
}

/**
 * Read multiple rows of customer data from Excel
 * @param excelFilePath - Path to the Excel file
 * @param sheetName - Name of the sheet to read
 * @returns Array of customer test data objects
 */
export function readAllCustomerDataFromExcel(
  excelFilePath: string = 'test-data/customer-data.xlsx',
  sheetName?: string
): CustomerTestData[] {
  const filePath = path.resolve(excelFilePath);

  try {
    // Validate file integrity before reading
    validateExcelFile(filePath);

    const workbook = XLSX.readFile(filePath);
    const sheet = sheetName || workbook.SheetNames[0];

    if (!workbook.Sheets[sheet]) {
      throw new Error(`Sheet "${sheet}" not found in Excel file`);
    }

    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: '' });

    if (!data || data.length === 0) {
      throw new Error('No data found in Excel sheet');
    }

    // Map all rows to CustomerTestData interface
    return data.map((row: any) => ({
      firstName: String(row['First Name'] || row['firstName'] || ''),
      lastNamePrefix: String(row['Last Name Prefix'] || row['lastNamePrefix'] || ''),
      lastName: String(row['Last Name'] || row['lastName'] || ''),
      customerGroup: String(row['Customer Group'] || row['customerGroup'] || ''),
      deliveryTerms: String(row['Delivery Terms'] || row['deliveryTerms'] || ''),
      deliveryMode: String(row['Delivery Mode'] || row['deliveryMode'] || ''),
      zipCode: String(row['ZIP Code'] || row['zipCode'] || '')
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error reading all customer data from Excel: ${errorMessage}`);
    throw error;
  }
}
