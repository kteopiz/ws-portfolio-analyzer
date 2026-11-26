import type { ActivitiesRow } from '../parsers/activities.js';

// Synthetic reports only; no personal account data.
const activityHeaders: (keyof ActivitiesRow)[] = [
  'effective_date',
  'effective_time',
  'settlement_date',
  'account_id',
  'account_name',
  'account_type',
  'activity_type',
  'activity_sub_type',
  'description',
  'direction',
  'symbol',
  'name',
  'currency',
  'quantity',
  'unit_price',
  'commission',
  'net_cash_amount',
];

const trade: ActivitiesRow = {
  effective_date: '2024-02-29',
  effective_time: '09:30:00',
  settlement_date: '2024-03-01',
  account_id: 'TEST-ACCOUNT-001',
  account_name: 'Practice TFSA',
  account_type: 'TFSA',
  activity_type: 'Trade',
  activity_sub_type: 'BUY',
  description: 'Purchase of Demo Company',
  direction: 'BUY',
  symbol: 'DEMO',
  name: 'Demo Company',
  currency: 'CAD',
  quantity: '2.5',
  unit_price: '20',
  commission: '0',
  net_cash_amount: '-50',
};

const sell: ActivitiesRow = {
  ...trade,
  activity_sub_type: 'SELL',
  description: 'Sale of Demo Company',
  direction: 'SELL',
  net_cash_amount: '50',
};

const dividend: ActivitiesRow = {
  ...trade,
  activity_type: 'Dividend',
  activity_sub_type: '-',
  description: 'Dividend from Demo Company',
  settlement_date: '',
  direction: '',
  unit_price: '',
  commission: '',
  net_cash_amount: '1.25',
};

const moneyMovement: ActivitiesRow = {
  ...trade,
  activity_type: 'MoneyMovement',
  activity_sub_type: 'EFT',
  description: 'Test deposit',
  settlement_date: '',
  direction: '',
  symbol: '',
  name: '',
  quantity: '0',
  unit_price: '',
  commission: '',
  net_cash_amount: '100',
};

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function record(row: ActivitiesRow, headers = activityHeaders): string {
  return headers.map((field) => escapeCell(row[field])).join(',');
}

function report(rows: ActivitiesRow[], headers = activityHeaders): string {
  return [headers.join(','), ...rows.map((row) => record(row, headers))].join('\n');
}

export const expectedParsedActivities: ActivitiesRow[] = [trade, sell, dividend, moneyMovement];
export const validActivitiesCsv = report(expectedParsedActivities);
export const csvWithEmptyFile = '';
export const csvWithWhitespaceOnlyFile = ' \t\n  \n';
export const csvWithNoActivityData = report([]);

const header = activityHeaders.join(',');
export const csvWithTooFewFields = [
  header,
  activityHeaders
    .slice(0, -1)
    .map((field) => trade[field])
    .join(','),
].join('\n');
export const csvWithTooManyFields = [header, record(trade) + ',EXTRA'].join('\n');
export const csvWithMissingQuotes = [
  header,
  record(trade).replace('Purchase of Demo Company', '"Purchase of Demo Company'),
].join('\n');
export const csvWithInvalidQuotes = [
  header,
  record(trade).replace('Purchase of Demo Company', '"Purchase"x"'),
].join('\n');

// Include a data record so the no-activities check does not mask the delimiter error.
export const csvWithUndetectableDelimiter = 'Not a CSV header\nNot a CSV record';

// Remove corresponding cells as well as headers to avoid field-count errors.
export const csvWithMissingRequiredColumns = report(
  [trade],
  activityHeaders.filter((field) => field !== 'symbol' && field !== 'quantity'),
);

// A malformed CSV record reaches Papa's field-count check before row validation.
export const csvWithMalformedRow = [header, record(trade), 'Unexpected report text'].join('\n');

export const csvWithUnknownActivityType = report([{ ...trade, activity_type: 'Unknown' }]);
export const csvWithEmptyActivityType = report([{ ...trade, activity_type: '' }]);
export const csvWithWhitespaceActivityType = report([{ ...trade, activity_type: ' \t ' }]);
export const csvWithTradeMissingRequiredValues = report([
  { ...trade, symbol: '', settlement_date: '', quantity: '', commission: '' },
]);
export const csvWithDividendMissingRequiredValues = report([{ ...dividend, symbol: '', name: '' }]);
export const csvWithMoneyMovementMissingRequiredValues = report([
  { ...moneyMovement, account_id: '', currency: '', net_cash_amount: '' },
]);
export const csvWithWhitespaceRequiredValues = report([
  { ...trade, symbol: '   ', quantity: '\t' },
]);

export const csvWithInvalidEffectiveDate = report([{ ...trade, effective_date: '2023-02-29' }]);
export const csvWithInvalidEffectiveDateFormat = report([
  { ...trade, effective_date: '29/02/2024' },
]);
export const csvWithInvalidEffectiveTime = report([{ ...trade, effective_time: '24:00:00' }]);
export const csvWithInvalidEffectiveTimeFormat = report([{ ...trade, effective_time: '9:30:00' }]);
export const csvWithInvalidSettlementDate = report([{ ...trade, settlement_date: '2024-04-31' }]);
export const csvWithInvalidSettlementDateFormat = report([
  { ...trade, settlement_date: '01/03/2024' },
]);
export const csvWithAllTimestampErrors = report([
  {
    ...trade,
    effective_date: '2023-02-29',
    effective_time: '12:60:00',
    settlement_date: '2024-04-31',
  },
]);
export const csvWithEmptyTimestamps = report([
  { ...trade, effective_date: '', effective_time: '', settlement_date: '' },
]);

// Valid rows between bad rows verify that record numbers preserve original positions.
export const csvWithMultipleInvalidRows = report([
  { ...trade, symbol: '' },
  dividend,
  { ...trade, effective_date: '2023-02-29' },
  moneyMovement,
  { ...trade, quantity: '', effective_time: '25:00:00' },
]);

export const expectedParsedActivitiesWithQuotedFields: ActivitiesRow[] = [
  { ...trade, description: 'Purchase, including "Demo" shares\nSynthetic second line' },
];
export const csvWithQuotedFields = report(expectedParsedActivitiesWithQuotedFields);
export const csvWithBlankLines = '\n' + validActivitiesCsv.replaceAll('\n', '\n\n') + '\n';
export const csvWithCrlf = validActivitiesCsv.replaceAll('\n', '\r\n');
