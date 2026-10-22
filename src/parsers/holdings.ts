import Papa from 'papaparse';
import * as fs from 'node:fs/promises';
import * as path from 'node:path'

// Wealthsimple holdings report columns, before numeric values are converted.
interface HoldingsRow {
  "Account Name": string;
  "Account Type": string;
  "Account Classification": string;
  "Account Number": string;
  "Symbol": string;
  "Exchange": string;
  "MIC": string;
  "Name": string;
  "Security Type": string;
  "Quantity": string;
  "Position Direction": string;
  "Market Price": string;   
  "Market Price Currency": string;
  "Book Value (CAD)": string;
  "Book Value Currency (CAD)": string;
  "Book Value (Market)": string;
  "Book Value Currency (Market)": string;
  "Market Value": string;
  "Market Value Currency": string;
  "Market Unrealized Returns": string;
  "Market Unrealized Returns Currency": string;
};

// With header parsing enabled, the date report footer occupies the first column mapping the date to "Account Name"
interface HoldingsDateRow {
    "Account Name": string;
};

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

    const requiredFields: (keyof HoldingsRow)[] = [
        "Account Name",
        "Account Type",
        "Account Classification",
        "Account Number",
        "Symbol",
        "Exchange",
        "MIC",
        "Name",
        "Security Type",
        "Quantity",
        "Position Direction",
        "Market Price",
        "Market Price Currency",
        "Book Value (CAD)",
        "Book Value Currency (CAD)",
        "Book Value (Market)",
        "Book Value Currency (Market)",
        "Market Value",
        "Market Value Currency",
        "Market Unrealized Returns",
        "Market Unrealized Returns Currency"
    ];

    const row = value as Record<string, unknown>;

    // CSV values remain strings because dynamic typing is not enabled. May change in future.
    return requiredFields.every((field) => typeof row[field] === 'string');
}

/**
 * Recognizes the report footer by its "As of YYYY-MM-DD" prefix.
 * The prefix check does not validate the calendar date or trailing timestamp.
 *
 * @param value - Parsed CSV row to inspect.
 * @returns Whether the first column matches the report date prefix.
 */
function isHoldingsDateRow(value: unknown): value is HoldingsDateRow {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const row = value as Record<string, unknown>;
    const dateRegex = /^As of \d{4}-\d{2}-\d{2}\b/;

    return (
        typeof row["Account Name"] === "string" &&
        dateRegex.test(row["Account Name"])
);
}

/**
 * Reads the local sample holdings report as UTF-8 text.
 *
 * @returns File contents, or an empty string if the file cannot be read.
 */
async function readHoldingsFile() {
    const filePath : string = path.join(
        '/Users/kylet/Desktop/repos/ws-portfolio-analyzer/src/parsers',
        'holdings-sample.csv'); 
    try {
        const data: string = await fs.readFile(filePath, 'utf8')
        return data
    } catch {
        return "";
    }
}

/**
 * Parses the sample report and checks its rows and parser errors.
 * Papa Parse type definitions: https://www.papaparse.com/docs#results
 * 
 * @returns Parsed rows, including the date footer, when validation succeeds;
 * otherwise Papa Parse errors. An empty or unreadable file returns an empty
 * array, as can a validation failure with no parser errors.
 */
async function getHoldingsData(): Promise<HoldingsRow[] | Papa.ParseError[]> {
    let rawHoldingsFileData : string = await readHoldingsFile();

    if (rawHoldingsFileData === "") {
        return [];
    }
    
    const parsedCsvToJson = Papa.parse<HoldingsRow>(rawHoldingsFileData, {
    header: true,
    skipEmptyLines: true,
        });

    const parseData = parsedCsvToJson.data
    const parseErrors : Papa.ParseError[] = parsedCsvToJson.errors
        
    const validData = validatedParsedHoldingsCsv(parseData, parseErrors)

    return validData ? parseData : parseErrors;
}

/**
 * Checks report rows for holdings and a single recognized date footer.
 * Only a TooFewFields parser error on that footer is accepted.
 *
 * @param data - Rows returned by Papa Parse.
 * @param errors - Parser errors associated with those rows.
 * @returns Whether the rows and parser errors pass the report checks.
 */
function validatedParsedHoldingsCsv(data : unknown[], errors : Papa.ParseError[]) : boolean {
    let holdingRowExists : boolean = false;
    let dateRowExists : boolean = false;
    let dateRowIdx : number | undefined = undefined;
    let idx = 0

    for (const row of data) {
        if (!isHoldingRow(row) && !isHoldingsDateRow(row)) {
            return false;
        }
        // Record the first holding row so an otherwise empty report is rejected.
        else if (!holdingRowExists && isHoldingRow(row)) {
            holdingRowExists = true;
        }
        // Track the footer index to identify its expected field-count error.
        else if (!dateRowExists && isHoldingsDateRow(row)) {
            dateRowExists = true;
            dateRowIdx = idx;
        }
        else if (dateRowExists && isHoldingsDateRow(row)) {
            // Reject additional date footers rather than choosing one.
            return false;
        }
        idx++;
    }

    
    if (dateRowIdx === undefined || !holdingRowExists || !dateRowExists) {
        return false;
    }

    // The single-column footer has fewer fields than the holdings header.
    for (const err of errors) {
        // Pass error if detection of date row field
        if (err.type === "FieldMismatch" && err.code === "TooFewFields" && err.row === dateRowIdx) {
            continue;
        } else {
        // Other error unrelated to malformed rows, or non-existence of rows exists
            return false;
        }
    }
    return true;
}

/*
 * FUTURE TODO
 * - (OTHER BRANCH) - Add an Express upload flow on a separate feature branch and replace the
 *   hard-coded sample path with an input supplied by the caller.
 * - Validate uploaded content and expected CSV structure.
 * - Define field-level validation and conversion rules for numeric values,
 *   required values, and the report timestamp.
 * - Distinguish file-read failures, empty input, parser errors, and report
 *   validation failures; decide which errors must reach the API caller.
 * - Provide actionable validation messages, including duplicate date footers.
 * - Add Vitest coverage for valid reports, malformed rows, missing or duplicate
 *   footers, parser errors, and file-read failures.
 * - Define the data needed for a current portfolio snapshot, including ticker
 *   extraction and normalization for the market-data API.
 */
