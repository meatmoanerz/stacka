export interface BankConfig {
  id: string
  name: string
  supportedFormats: ('csv' | 'pdf')[]
  pdfProcessingMode: 'image' | 'native-pdf'
  prompt: string
}

export const BANK_CONFIGS: Record<string, BankConfig> = {
  amex: {
    id: 'amex',
    name: 'American Express',
    supportedFormats: ['csv', 'pdf'],
    pdfProcessingMode: 'native-pdf',
    prompt: `You are extracting structured data from an American Express Sweden invoice (PDF).
Return ONLY valid JSON. No prose, no markdown.

NON-NEGOTIABLE RULES:
- Never guess. If you cannot confidently match a transaction row, DO NOT create a transaction. Add a parsing warning instead.
- Never mix data between rows.
- Never mix data between columns (the tables may be two-column on the page).

OUTPUT JSON (strict):
{
  "invoice_total": number,
  "previous_invoice_total": number,
  "payments_total": number,
  "new_purchases_total": number,
  "currency": "SEK",
  "transactions": [
    {
      "transaction_date": "YYYY-MM-DD",
      "process_date": "YYYY-MM-DD",
      "description": string,
      "amount": number,
      "cardholder": string,
      "section": "payments" | "purchases",
      "raw_row": string
    }
  ],
  "checks": {
    "sum_purchases": number,
    "sum_payments": number,
    "sum_all_transactions": number,
    "expected_new_purchases_total": number,
    "expected_payments_total": number,
    "expected_invoice_total": number,
    "diff_invoice_total": number,
    "diff_new_purchases_total": number,
    "diff_payments_total": number,
    "cardholder_subtotals": [
      { "cardholder": string, "expected": number, "actual": number, "diff": number }
    ]
  },
  "parsing_warnings": [
    { "type": string, "page": number|null, "context": string }
  ]
}

STEP 1 — TOTALS (PAGE 1):
On page 1, extract these SEK totals:
- invoice_total from "Fakturans saldo"
- previous_invoice_total from "Föregående faktura"
- payments_total from "Nya inbetalningar"
- new_purchases_total from "Nya köp"
Number conversion: "37.828,13" -> 37828.13

STEP 2 — TRANSACTIONS (PAGES 2+):
Extract transactions from:
A) the "Inbetalningar" section (set section="payments")
B) the "Nya köp" section (set section="purchases") — there may be TWO tables, one per cardholder.

CARDHOLDER:
- Under the heading "Nya köp för <NAME>", all following valid transaction rows belong to that cardholder until the next cardholder heading appears.
- For "Inbetalningar": if no name is shown, use the main cardmember name from page 1.

CRITICAL: TWO-COLUMN TABLES
The page may contain the same table laid out in TWO COLUMNS (left and right).
You MUST read:
1) all rows in the LEFT column from top to bottom,
2) then all rows in the RIGHT column from top to bottom.
Never combine a date from the left column with an amount from the right column (or vice versa).

CRITICAL: WHAT COUNTS AS A VALID TRANSACTION ROW
A row is a valid transaction ONLY if, within the SAME row-segment, it matches:
DD.MM.YY  DD.MM.YY  <text>  <amount> [CR?]
Rules:
- The row MUST start with a date in format DD.MM.YY (e.g., 02.07.25).
- It MUST contain a second date DD.MM.YY immediately after (process date).
- It MUST contain an amount in Swedish format at the END of the same row-segment: 123,45 or 1.234,56.
- If "CR" appears in the same transaction segment OR the amount has a leading "-", the amount is NEGATIVE.
- If the amount is not present in the same row-segment, DO NOT create a transaction (add a warning).

INVALID ROWS (IGNORE COMPLETELY):
- Headings, column headers, and subtotal/summary lines that start with e.g. "Summa", "Summan", "Nya köp för", "Transaktions-".
- Any line that does NOT start with a date.
- Subtotal lines at the bottom of tables (e.g., "Summa nya köp för ...", "Summan av alla nya köp").

ROW PARSING (for each valid row):
- transaction_date: convert first date "02.07.25" -> "2025-07-02"
- process_date: convert second date
- description: all text between process_date and the amount (keep merchant + city as one string, normalize whitespace)
- amount: convert Swedish number to float (1.234,56 -> 1234.56)
- raw_row: store the exact row text you used to create this transaction

ANTI "OFF-BY-ONE" / ANTI "GHOST ROW" RULES:
- NEVER attach an amount to a description if the amount is not visible in the same row-segment.
- If you see a date pair + description but no amount in the same row-segment:
  add warning type="missing_amount_same_row" and skip it.
- If you see an amount with no matching row starting with a date pair:
  add warning type="orphan_amount" and skip it.
- If multiple date-pairs appear in one extracted line (because of column merging), split it into separate row-segments and parse each independently.
  Each segment must still satisfy the "valid row" rules above.

STEP 3 — SUBTOTALS PER CARDHOLDER (WITHIN "NYA KÖP"):
For each cardholder table:
- Extract the expected subtotal from "Summa nya köp för <NAME>".
- Compute the actual subtotal by summing all parsed transactions for that cardholder with section="purchases".
- Add an entry to checks.cardholder_subtotals with expected/actual/diff.

STEP 4 — VALIDATION:
Compute:
- sum_purchases = sum(amount) where section="purchases"
- sum_payments  = sum(amount) where section="payments"
- sum_all_transactions = sum_purchases + sum_payments
- diff_new_purchases_total = new_purchases_total - sum_purchases
- diff_payments_total      = payments_total - sum_payments
- diff_invoice_total       = invoice_total - sum_all_transactions

Rules:
- diff_new_purchases_total should be within 1.00 SEK. Otherwise add warning type="purchases_total_mismatch".
- diff_payments_total should be within 1.00 SEK. Otherwise add warning type="payments_total_mismatch".
- diff_invoice_total should be within 1.00 SEK. Otherwise add warning type="invoice_total_mismatch".
Return the best possible data without guessing.`
  },
  seb: {
    id: 'seb',
    name: 'SEB',
    supportedFormats: ['csv'],
    pdfProcessingMode: 'native-pdf',
    prompt: '',
  },
  swedbank: {
    id: 'swedbank',
    name: 'Swedbank',
    supportedFormats: ['csv'],
    pdfProcessingMode: 'native-pdf',
    prompt: '',
  },
}

export function getBankConfig(bankId: string): BankConfig | undefined {
  return BANK_CONFIGS[bankId]
}

export function getAllBanks(): BankConfig[] {
  return Object.values(BANK_CONFIGS)
}
