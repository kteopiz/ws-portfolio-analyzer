import type Papa from 'papaparse';
import { type ActivitiesRow } from './activities.js';

export type ActivityTimestampIssue = {
  field: 'effective_date' | 'effective_time' | 'settlement_date';
  code: 'INVALID_DATE' | 'INVALID_TIME';
  message: string;
};

export type ActivityFieldIssue = {
  fields: (keyof ActivitiesRow)[];
  code: 'REQUIRED_FIELD' | 'INVALID_TYPE' | 'UNKNOWN_ACTIVITY_TYPE';
  message: string;
};

export type ActivityRowIssues = {
  record: number;
  fieldIssues: ActivityFieldIssue | null;
  timestampIssues: ActivityTimestampIssue[];
};

export type ParseResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      diagnostics: Papa.ParseError[];
      parsingError: string;
      issues?: ActivityRowIssues[];
    };

// https://www.papaparse.com/docs#errors
const papaParseCsvErrorMessages: Record<Papa.ParseError['code'], string> = {
  TooFewFields: 'A CSV row has fewer columns than the header',
  TooManyFields: 'A CSV row has more columns than the header',
  MissingQuotes: 'A quoted field is missing its closing quote',
  InvalidQuotes: 'A CSV field contains invalid quotation marks',
  UndetectableDelimiter: 'Could not detect the CSV column separator',
};

/**
 * Formats a Papa Parse diagnostic for the upload response.
 *
 * @param error - The diagnostic selected for display.
 * @returns A message that uses one-based record numbers for field-count errors
 * when Papa provides a row index.
 */
export function formatCsvError(error: Papa.ParseError): string {
  if (
    (error.code === 'TooFewFields' || error.code === 'TooManyFields') &&
    error.row !== undefined
  ) {
    const comparison = error.code === 'TooFewFields' ? 'fewer' : 'more';
    return `CSV record ${error.row + 1} has ${comparison} columns than the header`;
  }

  return papaParseCsvErrorMessages[error.code];
}
