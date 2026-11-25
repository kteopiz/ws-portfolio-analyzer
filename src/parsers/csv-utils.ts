import type Papa from 'papaparse';

export type ParseResult<T> =
  { ok: true; data: T } | { ok: false; diagnostics: Papa.ParseError[]; parsingError: string };

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
