import Papa from 'papaparse';
import * as fs from 'node:fs/promises';
import * as path from 'node:path'

// Defined by Wealthsimple from Holdings Report CSV
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

interface HoldingsDateRow {
    "Account Name": string;
};

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

    // look this over... not every row needs to be a row be a string
    return requiredFields.every((field) => typeof row[field] === 'string');
}

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

// TODO: this needs to come from a remote download later
    // - Add validation of the file type, actual CSV, not executable 
async function readHoldingsFile() {
    const filePath : string = path.join(
        '/Users/kylet/Desktop/repos/ws-portfolio-analyzer/src/parsers',
        'holdings-sample.csv'); 
    try {
        const data: string = await fs.readFile(filePath, 'utf8')
        return data
    } catch(e) {
        console.error('Error reading file', e);
        return "";
    }
}

//  needs to be validated as well
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

    // TODO: Act based on the parseErrors
        // malformed? -> do something
        // can get very specific based on this... ex. two date rows? try to fix with the user...
    return validData ? parseData : parseErrors;
}

function validatedParsedHoldingsCsv(data : unknown[], errors : Papa.ParseError[]) : boolean {
    // at least one holding row exists
    // all rows of holdings is holding row or a date row
    // date row exists 
    let holdingRowExists : boolean = false;
    let dateRowExists : boolean = false;
    let dateRowIdx : number | undefined = undefined;
    let idx = 0

    for (const row of data) {
        // 
        if (!isHoldingRow(row) && !isHoldingsDateRow(row)) {
            return false;
        }
        // at least one holding row must exist
        else if (!holdingRowExists && isHoldingRow(row)) {
            holdingRowExists = true;
        }
        // at least one date row must exist
        else if (!dateRowExists && isHoldingsDateRow(row)) {
            dateRowExists = true;
            dateRowIdx = idx;
        }
        else if (dateRowExists && isHoldingsDateRow(row)) {
            // TODO: if more then one date row exists how do we know which is correct?
            console.log('many date rows')
            return false;
        }
        idx++;
    }

    
    if (dateRowIdx === undefined || !holdingRowExists || !dateRowExists) {
        return false;
    }

    // errors:
    // date row error exists and we can explain it (exists matching row, and that row is is a HoldingsDateRow)
    // no unexplicable errors
    for (const err of errors) {
        if (err.type === "FieldMismatch" && err.code === "TooFewFields" && err.row === dateRowIdx) {
            console.log('explicable error for date row');
        } else {
            return false;
        }
    }
    return true;
}

const res = await getHoldingsData();

console.log(res)

// major to do list
    // - imitate user upload via express server -> new branch completely
    // - error handling / unit testing / JS docs in order
        // - some errors are essential to bubble up to notify user, determine the must propagate errors 
        // - JS doc excluding param types since TS, use for explain, tag, and examples
        // - clarify comments more 
        // - write unit tests using vitest
    // - add useful links for docs (papaparse error type, wealthsimple page to get holdings or smth instruction)

// What do we need from this data to actually do a current snapshot?
// API -> list of current tickers from holdings
// tbd...









