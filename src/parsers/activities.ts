import Papa from 'papaparse';

import {
  formatCsvError,
  type ActivityFieldIssue,
  type ActivityRowIssues,
  type ActivityTimestampIssue,
  type ParseResult,
} from './csv-utils.js';

// Wealthsimple activity report columns, with optional blank values converted to null.
export interface ActivitiesRow {
  effective_date: string;
  effective_time: string;
  settlement_date: string;
  account_id: string;
  account_name: string;
  account_type: string;
  activity_type: string;
  activity_sub_type: string;
  description: string;
  direction: string;
  symbol: string;
  name: string;
  currency: string;
  quantity: string;
  unit_price: string;
  commission: string;
  net_cash_amount: string;
}

export type ActivitiesParseResult = ParseResult<ActivitiesRow[]>;

const requiredActivitiesFields: (keyof ActivitiesRow)[] = [
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

// Fields that must contain non-empty values for each observed activity type.
const requiredTradeFields: (keyof ActivitiesRow)[] = [...requiredActivitiesFields];

const requiredMoneyMovementFields: (keyof ActivitiesRow)[] = [
  'effective_date',
  'effective_time',
  'account_id',
  'account_name',
  'account_type',
  'activity_type',
  'activity_sub_type',
  'description',
  'currency',
  'quantity',
  'net_cash_amount',
];

const requiredDividendsFields: (keyof ActivitiesRow)[] = [
  'effective_date',
  'effective_time',
  'account_id',
  'account_name',
  'account_type',
  'activity_type',
  'activity_sub_type',
  'description',
  'symbol',
  'name',
  'currency',
  'quantity',
  'net_cash_amount',
];

function isActivityRow(value: unknown): value is ActivitiesRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  // CSV values remain strings because dynamic typing is not enabled. May change in future.
  return requiredActivitiesFields.every((field) => typeof row[field] === 'string');
}

/** Checks a YYYY-MM-DD date, including whether the calendar date exists. */
function isValidActivityDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const midnight = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(midnight.getTime()) && midnight.toISOString().slice(0, 10) === date;
}

export function parseActivitiesFile(fileBufferString: string): ActivitiesParseResult {
  if (fileBufferString.trim() === '') {
    return { ok: false, diagnostics: [], parsingError: 'The CSV file is empty' };
  }

  const { data, errors, meta } = Papa.parse<ActivitiesRow>(fileBufferString, {
    header: true,
    skipEmptyLines: true,
  });

  const reject = (parsingError: string): ActivitiesParseResult => ({
    ok: false,
    diagnostics: errors,
    parsingError,
  });

  if (data.length === 0) {
    return reject('No activities found');
  }

  const csvError = errors.length > 0 ? errors[0] : null;
  if (csvError) {
    return reject(formatCsvError(csvError));
  }

  const headers = meta.fields ?? [];
  const missingFields = requiredActivitiesFields.filter((field) => !headers.includes(field));
  if (missingFields.length > 0) {
    return reject(`Missing required columns: ${missingFields.join(', ')}`);
  }

  // row by row validation below
  const rowIssues = validateActivitiesReport(data);

  if (rowIssues.length > 0) {
    return {
      ok: false,
      diagnostics: errors,
      parsingError: 'Some activity rows need correction',
      issues: rowIssues,
    };
  }
  return {
    ok: true,
    data: data,
  };
}

function validateActivitiesReport(rows: unknown[]): ActivityRowIssues[] {
  const issues: ActivityRowIssues[] = [];

  for (const [index, row] of rows.entries()) {
    if (!isActivityRow(row)) {
      const values =
        typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {};
      const invalidFields = requiredActivitiesFields.filter(
        (field) => typeof values[field] !== 'string',
      );

      issues.push({
        record: index + 1,
        fieldIssues: {
          fields: invalidFields,
          code: 'INVALID_TYPE',
          message: 'Expected string values for all activity fields',
        },
        timestampIssues: [],
      });
      continue;
    }

    const fieldIssues = validateActivitiesRequiredFields(row);
    const timestampIssues = validateActivityTimestamps(row);

    if (fieldIssues !== null || timestampIssues.length > 0) {
      issues.push({
        record: index + 1,
        fieldIssues,
        timestampIssues,
      });
    }
  }
  return issues;
}

function validateActivitiesRequiredFields(row: ActivitiesRow): ActivityFieldIssue | null {
  let requiredFields: (keyof ActivitiesRow)[];

  if (row.activity_type.trim() === '') {
    return {
      fields: ['activity_type'],
      code: 'REQUIRED_FIELD',
      message: `Activity type is empty.`,
    };
  }

  switch (row.activity_type) {
    case 'MoneyMovement':
      requiredFields = requiredMoneyMovementFields;
      break;
    case 'Trade':
      requiredFields = requiredTradeFields;
      break;
    case 'Dividend':
      requiredFields = requiredDividendsFields;
      break;
    default:
      // Possibility of data being incomplete. Create explicit log for any activity type unknown to me.
      return {
        fields: ['activity_type'],
        code: 'UNKNOWN_ACTIVITY_TYPE',
        message: `Unknown activity type: "${row.activity_type}"`,
      };
  }

  const emptyRequiredFields = requiredFields.filter((field) => row[field].trim() === '');

  if (emptyRequiredFields.length === 0) {
    return null;
  }

  return {
    fields: emptyRequiredFields,
    code: 'REQUIRED_FIELD',
    message: 'Required values empty',
  };
}

const activityTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

function validateActivityTimestamps(row: ActivitiesRow): ActivityTimestampIssue[] {
  const issues: ActivityTimestampIssue[] = [];
  if (row.effective_date.trim() !== '' && !isValidActivityDate(row.effective_date)) {
    issues.push({
      field: 'effective_date',
      code: 'INVALID_DATE',
      message: 'Effective date must be a valid date in YYYY-MM-DD format',
    });
  }

  if (row.effective_time.trim() !== '' && !activityTimePattern.test(row.effective_time)) {
    issues.push({
      field: 'effective_time',
      code: 'INVALID_TIME',
      message: 'Effective time must be a valid time in HH:mm:ss format',
    });
  }

  // Blank settlement dates are allowed here.
  // Activity-specific validation decides when one is required.
  if (row.settlement_date.trim() !== '' && !isValidActivityDate(row.settlement_date)) {
    issues.push({
      field: 'settlement_date',
      code: 'INVALID_DATE',
      message: 'Settlement date must be a valid date in YYYY-MM-DD format',
    });
  }
  return issues;
}
