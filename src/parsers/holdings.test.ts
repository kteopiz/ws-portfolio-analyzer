import { expect, test } from 'vitest';
import { parseHoldingsFile } from './holdings.js';

// Synthetic data for tests written through parseHoldingsFile.
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

const validHoldingsCsv = [holdingsHeader, holdingRecord, '', timestampRecord].join('\n');
const expectedParsedHoldings = [
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
const csvWithTooFewFields = [
  holdingsHeader,
  holdingFields.slice(0, -1).join(','),
  '',
  timestampRecord,
].join('\n');
const csvWithTooManyFields = [holdingsHeader, holdingRecord + ',EXTRA', '', timestampRecord].join(
  '\n',
);

// MissingQuotes. The last record opens a quote and never closes it.
const csvWithMissingQuotes = [holdingsHeader, holdingRecord, '', '"' + timestampRecord].join('\n');

// InvalidQuotes. The x after the apparent closing quote is invalid.
const csvWithInvalidQuotes = [
  holdingsHeader,
  holdingRecord.replace('Demo Company', '"Demo"x"'),
  '',
  timestampRecord,
].join('\n');

// UndetectableDelimiter. Nonempty input with no column separator.
const csvWithUndetectableDelimiter = 'This file contains no CSV columns';

// Remove both header names and corresponding values to isolate header validation.
const missingColumnNames = ['Symbol', 'Quantity'];
const csvWithMissingRequiredColumns = [
  holdingsHeaders.filter((field) => !missingColumnNames.includes(field)).join(','),
  holdingFields
    .filter((_, index) => !missingColumnNames.includes(holdingsHeaders[index]!))
    .join(','),
  '',
  timestampRecord,
].join('\n');

const csvWithDuplicateFooter = [
  holdingsHeader,
  holdingRecord,
  '',
  timestampRecord,
  timestampRecord,
].join('\n');
const csvWithInvalidTimestamp = [
  holdingsHeader,
  holdingRecord,
  '',
  'As of 2026-02-30 16:30 GMT-04:00',
].join('\n');
const csvWithMissingFooter = [holdingsHeader, holdingRecord].join('\n');
const csvWithNoHoldingData = [holdingsHeader, '', timestampRecord].join('\n');

// A short, unrelated record is malformed and surfaces TooFewFields first.
// The generic malformed-record fallback is masked by field-count errors for CSV input.
const csvWithMalformedRow = [
  holdingsHeader,
  holdingRecord,
  'Unexpected report text',
  '',
  timestampRecord,
].join('\n');

test('empty file input', () => {
  expect(parseHoldingsFile('')).toEqual({
    ok: false,
    diagnostics: [],
    parsingError: 'The CSV file is empty.',
  });
});

test('returns parsed holdings and the timestamp for a valid report', () => {
  expect(parseHoldingsFile(validHoldingsCsv)).toEqual({
    ok: true,
    data: expectedParsedHoldings,
  });
});

test('rejects a holdings record with too few fields', () => {
  expect(parseHoldingsFile(csvWithTooFewFields)).toMatchObject({
    ok: false,
    parsingError: 'CSV record 1 has fewer columns than the header.',
  });
});

test('rejects a holdings record with too many fields', () => {
  expect(parseHoldingsFile(csvWithTooManyFields)).toMatchObject({
    ok: false,
    parsingError: 'CSV record 1 has more columns than the header.',
  });
});

test('rejects a quoted field with a missing closing quote', () => {
  expect(parseHoldingsFile(csvWithMissingQuotes)).toMatchObject({
    ok: false,
    parsingError: 'A quoted field is missing its closing quote.',
  });
});

test('rejects a field with invalid quotation marks', () => {
  expect(parseHoldingsFile(csvWithInvalidQuotes)).toMatchObject({
    ok: false,
    parsingError: 'A CSV field contains invalid quotation marks.',
  });
});

test('rejects input whose delimiter cannot be detected', () => {
  expect(parseHoldingsFile(csvWithUndetectableDelimiter)).toMatchObject({
    ok: false,
    parsingError: 'Could not detect the CSV column separator.',
  });
});

test('reports each missing required column', () => {
  expect(parseHoldingsFile(csvWithMissingRequiredColumns)).toMatchObject({
    ok: false,
    parsingError: 'Missing required columns: Symbol, Quantity.',
  });
});

test('rejects a report with duplicate timestamp footers', () => {
  expect(parseHoldingsFile(csvWithDuplicateFooter)).toMatchObject({
    ok: false,
    parsingError: 'Duplicate date timestamp row.',
  });
});

test('rejects a footer with an invalid calendar date', () => {
  expect(parseHoldingsFile(csvWithInvalidTimestamp)).toMatchObject({
    ok: false,
    parsingError:
      'The report timestamp must contain a valid date, time, and offset in the format As of YYYY-MM-DD HH:mm GMT±HH:mm.',
  });
});

test('rejects a report with no timestamp footer', () => {
  expect(parseHoldingsFile(csvWithMissingFooter)).toMatchObject({
    ok: false,
    parsingError: 'No date timestamp row exists',
  });
});

test('rejects a report with no holdings', () => {
  expect(parseHoldingsFile(csvWithNoHoldingData)).toMatchObject({
    ok: false,
    parsingError: 'No holding data exists',
  });
});

test('reports the field-count error for a malformed record', () => {
  expect(parseHoldingsFile(csvWithMalformedRow)).toMatchObject({
    ok: false,
    parsingError: 'CSV record 2 has fewer columns than the header.',
  });
});
