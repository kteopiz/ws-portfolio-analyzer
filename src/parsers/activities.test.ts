import { expect, test } from 'vitest';
import { parseActivitiesFile } from './activities.js';
import * as fixtures from '../test-fixtures/activities.js';

test('parses buys, sells, dividends, and money movements as strings', () => {
  expect(parseActivitiesFile(fixtures.validActivitiesCsv)).toEqual({
    ok: true,
    data: fixtures.expectedParsedActivities,
  });
});

test('rejects an empty file', () => {
  expect(parseActivitiesFile(fixtures.csvWithEmptyFile)).toMatchObject({
    ok: false,
    parsingError: 'The CSV file is empty',
  });
});

test('rejects a whitespace-only file', () => {
  expect(parseActivitiesFile(fixtures.csvWithWhitespaceOnlyFile)).toMatchObject({
    ok: false,
    parsingError: 'The CSV file is empty',
  });
});

test('rejects a header-only file', () => {
  expect(parseActivitiesFile(fixtures.csvWithNoActivityData)).toMatchObject({
    ok: false,
    parsingError: 'No activities found',
  });
});

test('rejects too few fields', () => {
  expect(parseActivitiesFile(fixtures.csvWithTooFewFields)).toMatchObject({
    ok: false,
    parsingError: 'CSV record 1 has fewer columns than the header',
  });
});

test('rejects too many fields', () => {
  expect(parseActivitiesFile(fixtures.csvWithTooManyFields)).toMatchObject({
    ok: false,
    parsingError: 'CSV record 1 has more columns than the header',
  });
});

test('rejects missing closing quotes', () => {
  expect(parseActivitiesFile(fixtures.csvWithMissingQuotes)).toMatchObject({
    ok: false,
    parsingError: 'A quoted field is missing its closing quote',
  });
});

test('rejects invalid quotes', () => {
  expect(parseActivitiesFile(fixtures.csvWithInvalidQuotes)).toMatchObject({
    ok: false,
    parsingError: 'A CSV field contains invalid quotation marks',
  });
});

test('rejects an undetectable delimiter', () => {
  expect(parseActivitiesFile(fixtures.csvWithUndetectableDelimiter)).toMatchObject({
    ok: false,
    parsingError: 'Could not detect the CSV column separator',
  });
});

test('reports all missing required columns', () => {
  expect(parseActivitiesFile(fixtures.csvWithMissingRequiredColumns)).toMatchObject({
    ok: false,
    parsingError: 'Missing required columns: symbol, quantity',
  });
});

test('rejects a malformed record after a valid record', () => {
  expect(parseActivitiesFile(fixtures.csvWithMalformedRow)).toMatchObject({
    ok: false,
    parsingError: 'CSV record 2 has fewer columns than the header',
  });
});

test('rejects an unknown activity type', () => {
  expect(parseActivitiesFile(fixtures.csvWithUnknownActivityType)).toMatchObject({
    ok: false,
    diagnostics: [],
    parsingError: 'Some activity rows need correction',
    issues: [
      {
        record: 1,
        fieldIssues: { fields: ['activity_type'], code: 'UNKNOWN_ACTIVITY_TYPE' },
        timestampIssues: [],
      },
    ],
  });
});

test('rejects an empty activity type', () => {
  expect(parseActivitiesFile(fixtures.csvWithEmptyActivityType)).toMatchObject({
    ok: false,
    diagnostics: [],
    parsingError: 'Some activity rows need correction',
    issues: [
      {
        record: 1,
        fieldIssues: { fields: ['activity_type'], code: 'REQUIRED_FIELD' },
        timestampIssues: [],
      },
    ],
  });
});

test('rejects a whitespace-only activity type', () => {
  expect(parseActivitiesFile(fixtures.csvWithWhitespaceActivityType)).toMatchObject({
    ok: false,
    diagnostics: [],
    parsingError: 'Some activity rows need correction',
    issues: [
      {
        record: 1,
        fieldIssues: { fields: ['activity_type'], code: 'REQUIRED_FIELD' },
        timestampIssues: [],
      },
    ],
  });
});

test('reports all empty trade requirements', () => {
  expect(parseActivitiesFile(fixtures.csvWithTradeMissingRequiredValues)).toMatchObject({
    ok: false,
    diagnostics: [],
    parsingError: 'Some activity rows need correction',
    issues: [
      {
        record: 1,
        fieldIssues: {
          fields: ['settlement_date', 'symbol', 'quantity', 'commission'],
          code: 'REQUIRED_FIELD',
        },
        timestampIssues: [],
      },
    ],
  });
});

test('requires symbol and name for dividends', () => {
  expect(parseActivitiesFile(fixtures.csvWithDividendMissingRequiredValues)).toMatchObject({
    ok: false,
    diagnostics: [],
    parsingError: 'Some activity rows need correction',
    issues: [
      {
        record: 1,
        fieldIssues: { fields: ['symbol', 'name'], code: 'REQUIRED_FIELD' },
        timestampIssues: [],
      },
    ],
  });
});

test('reports empty money movement requirements', () => {
  expect(parseActivitiesFile(fixtures.csvWithMoneyMovementMissingRequiredValues)).toMatchObject({
    ok: false,
    diagnostics: [],
    parsingError: 'Some activity rows need correction',
    issues: [
      {
        record: 1,
        fieldIssues: {
          fields: ['account_id', 'currency', 'net_cash_amount'],
          code: 'REQUIRED_FIELD',
        },
        timestampIssues: [],
      },
    ],
  });
});

test('treats whitespace-only required values as empty', () => {
  expect(parseActivitiesFile(fixtures.csvWithWhitespaceRequiredValues)).toMatchObject({
    ok: false,
    diagnostics: [],
    parsingError: 'Some activity rows need correction',
    issues: [
      {
        record: 1,
        fieldIssues: { fields: ['symbol', 'quantity'], code: 'REQUIRED_FIELD' },
        timestampIssues: [],
      },
    ],
  });
});

test('reports blank timestamps only as required-field issues', () => {
  expect(parseActivitiesFile(fixtures.csvWithEmptyTimestamps)).toMatchObject({
    ok: false,
    diagnostics: [],
    parsingError: 'Some activity rows need correction',
    issues: [
      {
        record: 1,
        fieldIssues: {
          fields: ['effective_date', 'effective_time', 'settlement_date'],
          code: 'REQUIRED_FIELD',
        },
        timestampIssues: [],
      },
    ],
  });
});

test('rejects an impossible effective date', () => {
  expect(parseActivitiesFile(fixtures.csvWithInvalidEffectiveDate)).toMatchObject({
    ok: false,
    diagnostics: [],
    issues: [
      {
        record: 1,
        fieldIssues: null,
        timestampIssues: [{ field: 'effective_date', code: 'INVALID_DATE' }],
      },
    ],
  });
});

test('rejects an incorrect effective date format', () => {
  expect(parseActivitiesFile(fixtures.csvWithInvalidEffectiveDateFormat)).toMatchObject({
    ok: false,
    diagnostics: [],
    issues: [
      {
        record: 1,
        fieldIssues: null,
        timestampIssues: [{ field: 'effective_date', code: 'INVALID_DATE' }],
      },
    ],
  });
});

test('rejects an out-of-range effective time', () => {
  expect(parseActivitiesFile(fixtures.csvWithInvalidEffectiveTime)).toMatchObject({
    ok: false,
    diagnostics: [],
    issues: [
      {
        record: 1,
        fieldIssues: null,
        timestampIssues: [{ field: 'effective_time', code: 'INVALID_TIME' }],
      },
    ],
  });
});

test('rejects an incorrect effective time format', () => {
  expect(parseActivitiesFile(fixtures.csvWithInvalidEffectiveTimeFormat)).toMatchObject({
    ok: false,
    diagnostics: [],
    issues: [
      {
        record: 1,
        fieldIssues: null,
        timestampIssues: [{ field: 'effective_time', code: 'INVALID_TIME' }],
      },
    ],
  });
});

test('rejects an impossible settlement date', () => {
  expect(parseActivitiesFile(fixtures.csvWithInvalidSettlementDate)).toMatchObject({
    ok: false,
    diagnostics: [],
    issues: [
      {
        record: 1,
        fieldIssues: null,
        timestampIssues: [{ field: 'settlement_date', code: 'INVALID_DATE' }],
      },
    ],
  });
});

test('rejects an incorrect settlement date format', () => {
  expect(parseActivitiesFile(fixtures.csvWithInvalidSettlementDateFormat)).toMatchObject({
    ok: false,
    diagnostics: [],
    issues: [
      {
        record: 1,
        fieldIssues: null,
        timestampIssues: [{ field: 'settlement_date', code: 'INVALID_DATE' }],
      },
    ],
  });
});

test('collects all three timestamp errors on one record', () => {
  expect(parseActivitiesFile(fixtures.csvWithAllTimestampErrors)).toMatchObject({
    ok: false,
    issues: [
      {
        record: 1,
        fieldIssues: null,
        timestampIssues: [
          { field: 'effective_date', code: 'INVALID_DATE' },
          { field: 'effective_time', code: 'INVALID_TIME' },
          { field: 'settlement_date', code: 'INVALID_DATE' },
        ],
      },
    ],
  });
});

test('groups both validators by record and continues past valid and invalid rows', () => {
  expect(parseActivitiesFile(fixtures.csvWithMultipleInvalidRows)).toMatchObject({
    ok: false,
    issues: [
      {
        record: 1,
        fieldIssues: { fields: ['symbol'], code: 'REQUIRED_FIELD' },
        timestampIssues: [],
      },
      {
        record: 3,
        fieldIssues: null,
        timestampIssues: [{ field: 'effective_date', code: 'INVALID_DATE' }],
      },
      {
        record: 5,
        fieldIssues: { fields: ['quantity'], code: 'REQUIRED_FIELD' },
        timestampIssues: [{ field: 'effective_time', code: 'INVALID_TIME' }],
      },
    ],
  });
});

test('preserves quoted commas, quotation marks, and embedded newlines', () => {
  expect(parseActivitiesFile(fixtures.csvWithQuotedFields)).toEqual({
    ok: true,
    data: fixtures.expectedParsedActivitiesWithQuotedFields,
  });
});

test('skips blank lines', () => {
  expect(parseActivitiesFile(fixtures.csvWithBlankLines)).toEqual({
    ok: true,
    data: fixtures.expectedParsedActivities,
  });
});

test('accepts CRLF line endings', () => {
  expect(parseActivitiesFile(fixtures.csvWithCrlf)).toEqual({
    ok: true,
    data: fixtures.expectedParsedActivities,
  });
});
