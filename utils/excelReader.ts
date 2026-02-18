import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Interface for customer data from Excel
 */
export interface CustomerTestData {
  typeDropdown: string;
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
  sheetName: string = 'Customers',
  rowIndex: number = 0
): CustomerTestData {
  const workbook = XLSX.readFile(excelFilePath);
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in Excel file`);
  }
  
  const rows = XLSX.utils.sheet_to_json(worksheet);
  
  if (rowIndex >= rows.length) {
    throw new Error(`Row ${rowIndex} not found in sheet ${sheetName}`);
  }
  
  const row = rows[rowIndex] as any;
  
  const result: CustomerTestData = {
  typeDropdown: row.Type ?? '',   // ✅ map Excel "Type" column
  firstName: row.FirstName ?? '',
  lastNamePrefix: row.LastNamePrefix ?? '',
  lastName: row.LastName ?? '',
  customerGroup: row.CustomerGroup ?? '10',
  deliveryTerms: row.DeliveryTerms ?? '',
  deliveryMode: row.DeliveryMode ?? '',
  zipCode: row.ZipCode ?? ''
};
  
  return result;
}

/**
 * Read multiple rows of customer data from Excel
 * @param excelFilePath - Path to the Excel file
 * @param sheetName - Name of the sheet to read
 * @returns Array of customer test data objects
 */
export function readAllCustomerDataFromExcel(
  excelFilePath: string = 'test-data/customer-data.xlsx',
  sheetName: string = 'Customers'
): CustomerTestData[] {
  const workbook = XLSX.readFile(excelFilePath);
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in Excel file`);
  }
  
  const rows = XLSX.utils.sheet_to_json(worksheet);
  
  return rows.map((row: any): CustomerTestData => {
  return {
    typeDropdown: row.Type ?? '',   // ✅ map here too
    firstName: row.FirstName ?? '',
    lastNamePrefix: row.LastNamePrefix ?? '',
    lastName: row.LastName ?? '',
    customerGroup: row.CustomerGroup ?? '10',
    deliveryTerms: row.DeliveryTerms ?? '',
    deliveryMode: row.DeliveryMode ?? '',
    zipCode: row.ZipCode ?? ''
  };
});
}
