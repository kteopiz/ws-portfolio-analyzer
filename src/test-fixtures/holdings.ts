// Synthetic holdings reports shared by parser and upload tests.
const holdingsHeaders = [
  'Account Name',
  'Account Type',
  'Account Classification',
  'Account Number',
  'Symbol',
  'Exchange',
  'MIC',
  'Name',
  'Security Type',
  'Quantity',
  'Position Direction',
  'Market Price',
  'Market Price Currency',
  'Book Value (CAD)',
  'Book Value Currency (CAD)',
  'Book Value (Market)',
  'Book Value Currency (Market)',
  'Market Value',
  'Market Value Currency',
  'Market Unrealized Returns',
  'Market Unrealized Returns Currency',
];

const holdingsHeader = holdingsHeaders.join(',');
const holdingFields = [
  'Practice TFSA',
  'TFSA',
  'Trade',
  'TEST-ACCOUNT-001',
  'DEMO',
  'TSX',
  'XTSE',
  'Demo Company',
  'EQUITY',
  '2.5',
  'LONG',
  '20',
  'CAD',
  '45',
  'CAD',
  '45',
  'CAD',
  '50',
  'CAD',
  '5',
  'CAD',
];
const holdingRecord = holdingFields.join(',');
const timestampRecord = 'As of 2026-10-20 16:30 GMT-04:00';

export const validHoldingsCsv = [holdingsHeader, holdingRecord, '', timestampRecord].join('\n');
export const expectedParsedHoldings = [
  {
    'Account Name': 'Practice TFSA',
    'Account Type': 'TFSA',
    'Account Classification': 'Trade',
    'Account Number': 'TEST-ACCOUNT-001',
    Symbol: 'DEMO',
    Exchange: 'TSX',
    MIC: 'XTSE',
    Name: 'Demo Company',
    'Security Type': 'EQUITY',
    Quantity: '2.5',
    'Position Direction': 'LONG',
    'Market Price': '20',
    'Market Price Currency': 'CAD',
    'Book Value (CAD)': '45',
    'Book Value Currency (CAD)': 'CAD',
    'Book Value (Market)': '45',
    'Book Value Currency (Market)': 'CAD',
    'Market Value': '50',
    'Market Value Currency': 'CAD',
    'Market Unrealized Returns': '5',
    'Market Unrealized Returns Currency': 'CAD',
  },
  { 'Account Name': timestampRecord },
];

// TooFewFields and TooManyFields. Both affect data record index 0 (displayed as 1).
export const csvWithTooFewFields = [
  holdingsHeader,
  holdingFields.slice(0, -1).join(','),
  '',
  timestampRecord,
].join('\n');
export const csvWithTooManyFields = [
  holdingsHeader,
  holdingRecord + ',EXTRA',
  '',
  timestampRecord,
].join('\n');

// MissingQuotes. The last record opens a quote and never closes it.
export const csvWithMissingQuotes = [holdingsHeader, holdingRecord, '', '"' + timestampRecord].join(
  '\n',
);

// InvalidQuotes. The x after the apparent closing quote is invalid.
export const csvWithInvalidQuotes = [
  holdingsHeader,
  holdingRecord.replace('Demo Company', '"Demo"x"'),
  '',
  timestampRecord,
].join('\n');

// UndetectableDelimiter. Nonempty input with no column separator.
export const csvWithUndetectableDelimiter = 'This file contains no CSV columns';

// Remove both header names and corresponding values to isolate header validation.
const missingColumnNames = ['Symbol', 'Quantity'];
export const csvWithMissingRequiredColumns = [
  holdingsHeaders.filter((field) => !missingColumnNames.includes(field)).join(','),
  holdingFields
    .filter((_, index) => !missingColumnNames.includes(holdingsHeaders[index]!))
    .join(','),
  '',
  timestampRecord,
].join('\n');

export const csvWithDuplicateFooter = [
  holdingsHeader,
  holdingRecord,
  '',
  timestampRecord,
  timestampRecord,
].join('\n');
export const csvWithInvalidTimestamp = [
  holdingsHeader,
  holdingRecord,
  '',
  'As of 2026-02-30 16:30 GMT-04:00',
].join('\n');
export const csvWithMissingFooter = [holdingsHeader, holdingRecord].join('\n');
export const csvWithNoHoldingData = [holdingsHeader, '', timestampRecord].join('\n');

// A short, unrelated record is malformed and surfaces TooFewFields first.
// The generic malformed-record fallback is masked by field-count errors for CSV input.
export const csvWithMalformedRow = [
  holdingsHeader,
  holdingRecord,
  'Unexpected report text',
  '',
  timestampRecord,
].join('\n');
