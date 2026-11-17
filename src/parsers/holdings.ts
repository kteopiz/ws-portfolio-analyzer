import Papa from 'papaparse';

// Wealthsimple holdings report columns, before numeric values are converted.
interface HoldingsRow {
  'Account Name': string;
  'Account Type': string;
  'Account Classification': string;
  'Account Number': string;
  Symbol: string;
  Exchange: string;
  MIC: string;
  Name: string;
  'Security Type': string;
  Quantity: string;
  'Position Direction': string;
  'Market Price': string;
  'Market Price Currency': string;
  'Book Value (CAD)': string;
  'Book Value Currency (CAD)': string;
  'Book Value (Market)': string;
  'Book Value Currency (Market)': string;
  'Market Value': string;
  'Market Value Currency': string;
  'Market Unrealized Returns': string;
  'Market Unrealized Returns Currency': string;
}

// With header parsing enabled, the date report footer occupies the first column mapping the date to "Account Name"
interface HoldingsDateRow {
  'Account Name': string;
}

export type HoldingsParseResult =
  | { ok: true; data: (HoldingsRow | HoldingsDateRow)[] }
  | { ok: false; diagnostics: Papa.ParseError[]; parsingError: string };

type ReportValidation = {
  footerIndex: number | null;
  issue?: {
    code: 'DUPLICATE_FOOTER' | 'INVALID_REPORT';
    message: string;
  };
};

// https://www.papaparse.com/docs#errors
const papaParseCsvErrorMessages: Record<Papa.ParseError['code'], string> = {
  TooFewFields: 'A CSV row has fewer columns than the header.',
  TooManyFields: 'A CSV row has more columns than the header.',
  MissingQuotes: 'A quoted field is missing its closing quote.',
  InvalidQuotes: 'A CSV field contains invalid quotation marks.',
  UndetectableDelimiter: 'Could not detect the CSV column separator.',
};

const requiredHoldingsFields: (keyof HoldingsRow)[] = [
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

/**
 * Formats a Papa Parse diagnostic for the upload response.
 *
 * @param error - The diagnostic selected for display.
 * @returns A message that uses one-based record numbers for field-count errors
 * when Papa provides a row index.
 */
function formatCsvError(error: Papa.ParseError): string {
  if (
    (error.code === 'TooFewFields' || error.code === 'TooManyFields') &&
    error.row !== undefined
  ) {
    const comparison = error.code === 'TooFewFields' ? 'fewer' : 'more';
    return `CSV record ${error.row + 1} has ${comparison} columns than the header.`;
  }

  return papaParseCsvErrorMessages[error.code];
}

/**
 * Checks that every expected holdings column contains a string.
 * This checks row structure, not whether field contents are valid.
 *
 * @param value - Parsed CSV row to inspect.
 * @returns Whether the value matches the raw holdings row shape.
 */
function isHoldingRow(value: unknown): value is HoldingsRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  // CSV values remain strings because dynamic typing is not enabled. May change in future.
  return requiredHoldingsFields.every((field) => typeof row[field] === 'string');
}

/**
 * Recognizes a single-field footer by its "As of " prefix.
 *
 * @param value - Parsed CSV row to inspect.
 * @returns Whether the row contains a report timestamp to validate.
 */
function isHoldingsDateRow(value: unknown): value is HoldingsDateRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    Object.keys(row).length === 1 &&
    typeof row['Account Name'] === 'string' &&
    row['Account Name'].startsWith('As of ')
  );
}

/**
 * Checks the timestamp against the report format `As of YYYY-MM-DD HH:mm GMT±HH:mm`.
 *
 * @param timestamp - The full text of the timestamp footer.
 * @returns Whether the calendar date, time, and numeric UTC offset are valid.
 */
function isValidReportTimestamp(timestamp: string): boolean {
  const date =
    /^As of (\d{4}-\d{2}-\d{2}) (?:[01]\d|2[0-3]):[0-5]\d GMT[+-](?:[01]\d|2[0-3]):[0-5]\d$/.exec(
      timestamp,
    )?.[1];
  if (date === undefined) {
    return false;
  }

  // A round trip rejects impossible dates that JavaScript normalizes into the next month.
  const midnight = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(midnight.getTime()) && midnight.toISOString().slice(0, 10) === date;
}

/**
 * Parses a holdings report and selects the first failure to report.
 * Quote and delimiter errors take priority over missing headers. After scanning
 * the rows, the duplicate-footer check takes priority over field-count errors.
 *
 * @param fileBufferString - The decoded text of the uploaded CSV.
 * @returns The parsed rows, including the timestamp footer, or a user-facing
 * error with any Papa Parse diagnostics.
 */
export function parseHoldingsFile(fileBufferString: string): HoldingsParseResult {
  if (fileBufferString.trim() === '') {
    return { ok: false, diagnostics: [], parsingError: 'The CSV file is empty.' };
  }

  const { data, errors, meta } = Papa.parse<HoldingsRow | HoldingsDateRow>(fileBufferString, {
    header: true,
    skipEmptyLines: true,
  });

  const reject = (parsingError: string): HoldingsParseResult => ({
    ok: false,
    diagnostics: errors,
    parsingError,
  });

  // Check non-'FieldMismatch' Papa parse errors first, since all are never allowed
  const csvError = errors.find((error) => error.type !== 'FieldMismatch');
  if (csvError) {
    return reject(formatCsvError(csvError));
  }

  // Check fields of uploaded CSV vs. expected header structure
  const headers = meta.fields ?? [];
  const missingFields = requiredHoldingsFields.filter((field) => !headers.includes(field));
  if (missingFields.length > 0) {
    return reject(`Missing required columns: ${missingFields.join(', ')}.`);
  }

  // Validate uploaded CSV row by row
  const report = validateHoldingsReport(data);
  if (report.issue?.code === 'DUPLICATE_FOOTER') {
    return reject(report.issue.message);
  }

  // A single-field timestamp footer is expected to be shorter than the header, allow the error if found in the footer's tracked row.
  // Do not allow other FieldMismatch errors that are not at the footer's index/row
  const fieldMismatch = errors.find(
    (error) =>
      error.type === 'FieldMismatch' &&
      !(error.code === 'TooFewFields' && error.row === report.footerIndex),
  );
  if (fieldMismatch) {
    return reject(formatCsvError(fieldMismatch));
  }
  if (report.issue) {
    return reject(report.issue.message);
  }

  return { ok: true, data };
}

/**
 * Checks that the report contains holdings and exactly one valid timestamp footer.
 *
 * @param rows - The records produced by Papa Parse with the header excluded.
 * @returns The zero-based index of the first recognized footer, or `null` if
 * absent, and any report issue. The parser uses the index to identify the
 * expected field-count diagnostic for the one-field footer.
 */
function validateHoldingsReport(rows: (HoldingsRow | HoldingsDateRow)[]): ReportValidation {
  let hasHolding = false;
  let footer: { index: number; timestamp: string } | undefined;
  let malformedIndex: number | undefined;

  for (const [index, row] of rows.entries()) {
    if (isHoldingRow(row)) {
      hasHolding = true;
    } else if (isHoldingsDateRow(row)) {
      if (footer) {
        return {
          footerIndex: footer.index,
          issue: { code: 'DUPLICATE_FOOTER', message: 'Duplicate date timestamp row.' },
        };
      }
      footer = { index, timestamp: row['Account Name'] };
    } else {
      malformedIndex ??= index;
    }
  }

  const footerIndex = footer?.index ?? null;
  const invalid = (message: string): ReportValidation => ({
    footerIndex,
    issue: { code: 'INVALID_REPORT', message },
  });

  if (malformedIndex !== undefined) {
    return invalid(`CSV record ${malformedIndex + 1} is malformed.`);
  }
  if (!footer) {
    return invalid('No date timestamp row exists');
  }
  if (!isValidReportTimestamp(footer.timestamp)) {
    return invalid(
      'The report timestamp must contain a valid date, time, and offset in the format As of YYYY-MM-DD HH:mm GMT±HH:mm.',
    );
  }
  if (!hasHolding) {
    return invalid('No holding data exists');
  }

  return { footerIndex };
}

/*
 * FUTURE TODO
 * - Provide actionable validation messages, including duplicate date footers.
 * - Add Vitest coverage for valid reports, malformed rows, missing or duplicate
 *   footers, parser errors, and file-read failures.
 * - Define the data needed for a current portfolio snapshot, including ticker
 *   extraction and normalization for the market-data API.
 */
