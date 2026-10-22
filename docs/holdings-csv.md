# Wealthsimple holdings CSV structure

Correct as of **October 21, 2026**. This is our own description of the observed format, not an official Wealthsimple CSV specification. We do not know when Wealthsimple will change the format; changes to columns, values, or the timestamp footer could break this application's parsing and validation.

## Downloading a holdings report

See Wealthsimple's [instructions for requesting a holdings report](https://help.wealthsimple.com/hc/en-ca/articles/35654428540571-Request-a-custom-statement#holdings-report).

On the Wealthsimple website, open the profile menu, navigate to Documents, and start generating a document. Choose the holdings CSV report, select the desired snapshot date and accounts, then download the CSV.

## File layout

The CSV is organized as follows:

1. A header row with 21 comma-separated column names.
2. Holdings rows describing security and cash positions.
3. A blank line.
4. A final, single-field timestamp row describing when the holdings snapshot applies.

The header names are unquoted. Holdings values are double-quoted, including numeric values and empty fields. Quantities may be fractional, monetary values can have more than two decimal places, and unrealized returns may be negative.

## Holdings columns

The following columns appear in header order.

| # | Column | Description |
| --- | --- | --- |
| 1 | `Account Name` | Account label. |
| 2 | `Account Type` | Account type. |
| 3 | `Account Classification` | Account service classification. |
| 4 | `Account Number` | Account identifier. |
| 5 | `Symbol` | Security ticker or currency code. |
| 6 | `Exchange` | Exchange on which the security is listed; may be empty for cash. |
| 7 | `MIC` | Market identifier code; may be empty for cash. |
| 8 | `Name` | Security name or currency label. |
| 9 | `Security Type` | Classification of the asset held. |
| 10 | `Quantity` | Position quantity, including fractional amounts. |
| 11 | `Position Direction` | Direction of the position. |
| 12 | `Market Price` | Price per unit. |
| 13 | `Market Price Currency` | Currency associated with the market price. |
| 14 | `Book Value (CAD)` | Book value expressed in CAD. |
| 15 | `Book Value Currency (CAD)` | Currency label for the CAD book value. |
| 16 | `Book Value (Market)` | Book value in the market currency. |
| 17 | `Book Value Currency (Market)` | Currency label for the market book value. |
| 18 | `Market Value` | Position market value. |
| 19 | `Market Value Currency` | Currency associated with the market value. |
| 20 | `Market Unrealized Returns` | Unrealized gain or loss amount. |
| 21 | `Market Unrealized Returns Currency` | Currency associated with unrealized returns. |

## Final timestamp row

**The final timestamp row is a key part of the holdings CSV.** It records the date and time of the holdings snapshot, including its UTC offset.

It appears as the last non-empty row, after a blank line, and contains one double-quoted field in the format `As of YYYY-MM-DD HH:mm GMT±HH:mm`. Unlike a holdings row, it does not contain all 21 columns; it is metadata for the report as a whole.
