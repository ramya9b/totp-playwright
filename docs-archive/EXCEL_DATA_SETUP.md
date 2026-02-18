# Excel Data Integration for Customer Creation Tests

## Overview
The customer creation test has been updated to read test data from an Excel file instead of hardcoded values.

## Files Created/Modified

### 1. **Utils: Excel Reader** (`utils/excelReader.ts`)
   - `readCustomerDataFromExcel()` - Reads a single row of customer data from Excel
   - `readAllCustomerDataFromExcel()` - Reads all rows of customer data from Excel
   - Supports flexible column naming (with spaces or camelCase)
   - Returns strongly-typed `CustomerTestData` interface

### 2. **Test Data** (`test-data/customer-data.xlsx`)
   - Excel file with sample customer test data
   - 3 pre-populated test cases:
     1. Test 0001 - Original test data (ZIP: 67001)
     2. Alice Van Johnson (ZIP: 90210)
     3. Bob De Smith (ZIP: 50001)
   - Columns:
     - First Name
     - Last Name Prefix
     - Last Name
     - Customer Group
     - Delivery Terms
     - Delivery Mode
     - ZIP Code

### 3. **Updated Test** (`tests/SC_03_createcustomer.spec.ts`)
   - Now imports `readCustomerDataFromExcel` function
   - Reads test data from Excel at runtime:
     ```typescript
     const customerData = readCustomerDataFromExcel('test-data/customer-data.xlsx', 'Customers', 0);
     ```
   - Logs loaded data for debugging

## Usage

### Running the Test
```bash
npm test -- tests/SC_03_createcustomer.spec.ts
```

### Adding More Test Data
Edit `test-data/customer-data.xlsx` and add new rows. Each row becomes a new test case scenario.

### Using Different Excel Files
```typescript
const customerData = readCustomerDataFromExcel('path/to/your/excel.xlsx', 'SheetName', rowIndex);
```

### Programmatically Generate More Test Data
Run the script to regenerate test data:
```bash
npx ts-node scripts/create-test-data.ts
```

## Benefits
✅ Data-driven testing - easily add more test scenarios  
✅ Separation of test logic and test data  
✅ Easy maintenance - update Excel instead of code  
✅ Type-safe with TypeScript interface  
✅ Multiple row support with `readAllCustomerDataFromExcel()`

## Test Results
- ✅ Test passes successfully reading data from Excel
- ✅ First name, last name, ZIP code filled correctly
- ✅ Customer saved successfully with Ctrl+S fallback
- Total test time: ~3.6 minutes

## Dependencies
- `xlsx` - Excel file reading library (installed)
