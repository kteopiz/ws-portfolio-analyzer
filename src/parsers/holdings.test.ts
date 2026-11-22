import { expect, test } from 'vitest';
import { parseHoldingsFile } from './holdings.js';

import {
  validHoldingsCsv,
  expectedParsedHoldings,
  csvWithTooFewFields,
  csvWithTooManyFields,
  csvWithMissingQuotes,
  csvWithInvalidQuotes,
  csvWithUndetectableDelimiter,
  csvWithMissingRequiredColumns,
  csvWithDuplicateFooter,
  csvWithInvalidTimestamp,
  csvWithMissingFooter,
  csvWithNoHoldingData,
  csvWithMalformedRow,
} from '../test-fixtures/holdings.js';

test('empty file input', () => {
  expect(parseHoldingsFile('')).toEqual({
    ok: false,
    diagnostics: [],
    parsingError: 'The CSV file is empty',
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
    parsingError: 'CSV record 1 has fewer columns than the header',
  });
});

test('rejects a holdings record with too many fields', () => {
  expect(parseHoldingsFile(csvWithTooManyFields)).toMatchObject({
    ok: false,
    parsingError: 'CSV record 1 has more columns than the header',
  });
});

test('rejects a quoted field with a missing closing quote', () => {
  expect(parseHoldingsFile(csvWithMissingQuotes)).toMatchObject({
    ok: false,
    parsingError: 'A quoted field is missing its closing quote',
  });
});

test('rejects a field with invalid quotation marks', () => {
  expect(parseHoldingsFile(csvWithInvalidQuotes)).toMatchObject({
    ok: false,
    parsingError: 'A CSV field contains invalid quotation marks',
  });
});

test('rejects input whose delimiter cannot be detected', () => {
  expect(parseHoldingsFile(csvWithUndetectableDelimiter)).toMatchObject({
    ok: false,
    parsingError: 'Could not detect the CSV column separator',
  });
});

test('reports each missing required column', () => {
  expect(parseHoldingsFile(csvWithMissingRequiredColumns)).toMatchObject({
    ok: false,
    parsingError: 'Missing required columns: Symbol, Quantity',
  });
});

test('rejects a report with duplicate timestamp footers', () => {
  expect(parseHoldingsFile(csvWithDuplicateFooter)).toMatchObject({
    ok: false,
    parsingError: 'Duplicate date timestamp row',
  });
});

test('rejects a footer with an invalid calendar date', () => {
  expect(parseHoldingsFile(csvWithInvalidTimestamp)).toMatchObject({
    ok: false,
    parsingError:
      'The report timestamp must contain a valid date, time, and offset in the format As of YYYY-MM-DD HH:mm GMT±HH:mm',
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
    parsingError: 'CSV record 2 has fewer columns than the header',
  });
});
