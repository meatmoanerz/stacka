# Feature Guide: Upload & Parse AMEX (SE) Statement PDF → Structured JSON (for Web/iOS)

> **Purpose**  
> Implement a production-grade pipeline where a user uploads an American Express Sweden statement/faktura PDF (consistent format), the backend parses it into clean structured data, and the app can consume it reliably (web + iOS).

This guide is written for **Claude Code** to implement the feature end-to-end in a typical stack:
- **Next.js (Vercel)** for web + API routes
- **Supabase** (Auth + Postgres + Storage) or S3-equivalent
- A **queue/worker** (recommended: separate Node service, or Supabase Edge Functions + queue) for background processing
- **OpenAI Responses API** with **PDF file input** and **Structured Outputs (strict JSON schema)** as a robust fallback

---

## 0) Statement PDF format assumptions (AMEX SE)

The PDF is consistent and includes (observed in sample):

**Page 1**
- Header: *“SAS Amex Premium … Faktura”*
- Fields:
  - `Fakturadatum: DD.MM.YY`
  - `Kortnummer som slutar på: XXXXX`
  - `Fakturans period: DD.MM.YY till DD.MM.YY`
  - Summary:
    - `Fakturans saldo 17.141,66 SEK`
    - `Föregående faktura 21.949,76`
    - `Nya inbetalningar -21.949,76`
    - `Lägsta belopp att betala 514,25 SEK`
    - `Nya köp 17.141,66`
    - `Förfallodag 27.08.25`
- Also includes Bankgiro/OCR (PII-ish; do not return to client unless explicitly needed)

**Page 3**
- Transaction and totals page
- Sections:
  - `Inbetalningar` (payments) – includes “Betalning Mottagen, Tack … CR”
  - `Nya köp för <Cardholder Name> …` possibly multiple cardholders (e.g. Tim / Emi) and extra card suffix
  - Transactions are listed with:
    - `Transaktionsdatum` `Processdatum` `Transaktionsuppgifter` `Belopp i SEK`
  - Totals:
    - `Summa nya köp för <Name> …`
    - `Summan av alla nya köp …`
    - Potential fee line: `Periodens Del Av Årsavgift För Kontot …`

**Dates**
- Swedish: `DD.MM.YY` → normalize to `YYYY-MM-DD` (assume 20YY)

**Money**
- Swedish: `17.141,66` (thousand separator `.` and decimal `,`)
- Normalize to number: `17141.66`  
- Keep `direction` + `type` to avoid ambiguity:
  - Purchases/fees → `direction="debit"` (money out)
  - Payments/CR → `direction="credit"` (money in)

---

## 1) High-level architecture (recommended)

### 1.1 Flow
1) **Client** uploads PDF to Storage (Supabase Storage / S3) via **signed URL**
2) Backend creates a `parse_jobs` record (`status="pending"`)
3) A **worker** consumes the job:
   - Pass 1: deterministic parsing (pdfplumber) for header/summary + attempt transactions
   - Pass 2: if confidence low, use **OpenAI** to parse PDF with **strict JSON schema**
   - Validate, normalize, and run sanity checks (totals)
4) Store the structured result in DB (`parse_results`)
5) Client polls `GET /api/parse-jobs/:id` or uses realtime/websocket to receive status updates

### 1.2 Why “deterministic first + LLM fallback”
Even when the PDF layout is stable, PDF text extraction can:
- split amounts into separate lines
- reorder columns
- merge headings with content

Deterministic parsing is cheap and fast; LLM fallback is robust for the layout/association problem.

---

## 2) Data contracts (DB + JSON)

### 2.1 Postgres tables (example)

#### `parse_jobs`
- `id` (uuid, pk)
- `user_id` (uuid, fk)
- `provider` (text) — `amex_se`
- `storage_path` (text) — path in storage bucket
- `status` (text) — `pending|processing|done|failed|needs_review`
- `error_code` (text, nullable)
- `error_message` (text, nullable)
- `created_at`, `updated_at`

#### `parse_results`
- `job_id` (uuid, pk/fk)
- `schema_version` (int) — start at 1
- `provider` (text)
- `result_json` (jsonb) — validated normalized output
- `raw_model_json` (jsonb, nullable) — optional (debug, protected)
- `confidence` (numeric) — 0..1
- `sanity_checks` (jsonb) — totals/rules results
- `created_at`

> Security: `parse_results.result_json` may contain sensitive transactional data. Use RLS so only owner can read.

---

## 3) API endpoints (Next.js)

### 3.1 `POST /api/statements/upload-url`
Returns a signed upload URL and a new job id.

**Request**
```json
{
  "filename": "amex_aug_2025.pdf",
  "contentType": "application/pdf",
  "provider": "amex_se"
}
```

**Response**
```json
{
  "jobId": "uuid",
  "uploadUrl": "https://signed-upload-url",
  "storagePath": "user-uuid/amex/job-uuid.pdf"
}
```

### 3.2 `POST /api/parse-jobs/:id/start` (optional)
If you want a separate “start parsing” action.
Often you just enqueue automatically when upload completes.

### 3.3 `GET /api/parse-jobs/:id`
Returns status and (when ready) the parsed output.

**Response (processing)**
```json
{ "jobId":"...", "status":"processing" }
```

**Response (done)**
```json
{
  "jobId":"...",
  "status":"done",
  "result": { ...normalized json... }
}
```

---

## 4) Worker design

### 4.1 Worker requirements
- Runs independently of Vercel request timeouts
- Has access to:
  - DB (Supabase/Postgres)
  - Storage (download PDF)
  - OpenAI API key

### 4.2 Job lifecycle
1) claim job: `UPDATE parse_jobs SET status='processing' WHERE id=:id AND status='pending'`
2) download file from storage
3) parse:
   - `deterministic_parse(pdf) -> {partial_result, confidence}`
   - if confidence < threshold: `llm_parse(pdf_url or file_id) -> structured_json`
4) normalize & validate
5) sanity checks (totals)
6) store results + set job status:
   - `done` if checks pass
   - `needs_review` if minor mismatch but usable
   - `failed` for hard failures

---

## 5) Deterministic parsing (Pass 1)

### 5.1 Libraries (Node vs Python)
**Python recommended** for PDF parsing:
- `pdfplumber` (layout-aware text extraction)
- Optionally `camelot`/`tabula-py` for table extraction experiments

**Node option**
- `pdf-parse` for text extraction (often weaker for layout)

Given you want reliability, do deterministic parsing in **Python** worker if possible.

### 5.2 Parsing strategy
#### 5.2.1 Extract page 1 fields with regex
From text:
- `Fakturadatum: (\d{2}\.\d{2}\.\d{2})`
- `Fakturans period: (\d{2}\.\d{2}\.\d{2}) till(\d{2}\.\d{2}\.\d{2})`
- `Förfallodag (\d{2}\.\d{2}\.\d{2})`
- `Fakturans saldo ([0-9\.]+,[0-9]{2})`
- `Lägsta belopp att betala ([0-9\.]+,[0-9]{2})`
- `Nya köp ([0-9\.]+,[0-9]{2})`
- `Nya inbetalningar (-?[0-9\.]+,[0-9]{2})`

#### 5.2.2 Parse page 3 transactions by section + row regex
A robust approach is to scan line-by-line and detect when you enter a new section.

**Section markers**
- `Inbetalningar`
- `Nya köp för` + name
- `Summa nya köp för` + name
- `Summan av alla nya köp`

**Transaction row pattern**
Many lines follow:
`DD.MM.YY DD.MM.YY <description...> <amount>`
Example:
`04.07.25 04.07.25 Coop Ljugarn Ljugarn 332,35`

Regex:
- Dates: `(\d{2}\.\d{2}\.\d{2})\s+(\d{2}\.\d{2}\.\d{2})`
- Amount: `(-?[0-9\.]+,[0-9]{2})$`
- Description: everything between

Pseudo:
- If line matches row pattern:
  - capture trans_date, process_date
  - capture amount
  - capture description
  - assign `cardholder` based on current section (or default)
  - classify type:
    - if description contains `Betalning Mottagen` OR line contains `CR` near it → `type=payment`, `direction=credit`
    - if description contains `Årsavgift` → `type=fee`, `direction=debit`
    - else → `type=purchase`, `direction=debit`

**Important quirk**
Sometimes `CR` appears on its own line (e.g. after the payment row).  
Implementation: keep a short “lookback buffer” of last parsed row; if a subsequent line equals `CR`, mark last row as credit.

#### 5.2.3 Confidence scoring
Compute a confidence number:
- +0.2 if page1 header fields parsed (date, period, due_date)
- +0.2 if `Summan av alla nya köp` parsed
- +0.4 if transaction count > 0 and amounts parsed for most lines
- +0.2 if totals match within tolerance

If confidence < `0.85`, use LLM fallback.

---

## 6) OpenAI parsing (Pass 2 fallback)

### 6.1 Official approach to parse PDFs with OpenAI
Use the **Responses API** and provide the PDF as an `input_file` (via file_id or file_url).  
See OpenAI docs:
- PDF inputs guide: https://platform.openai.com/docs/guides/pdf-files
- Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- Responses API reference: https://platform.openai.com/docs/api-reference/responses
- Files API (optional): https://platform.openai.com/docs/api-reference/files

### 6.2 Choose file input method
**Option A: Signed URL**
- Generate a short-lived signed URL from storage
- Provide it as `input_file` with `file_url`
- Pros: simplest, no extra OpenAI file management
- Cons: ensure URL TTL covers request duration

**Option B: Upload to OpenAI Files**
- Upload with `purpose: "user_data"` and (optionally) `expires_after` to auto-expire
- Pros: stable reference during parsing, supports longer workflows
- Cons: extra step + manage deletion/expiry

### 6.3 Strict JSON schema (schema_version = 1)
Use **Structured Outputs (json_schema, strict=true)**.  
Note: strict mode requires `additionalProperties:false` and all properties listed as required in each object.

**Schema (v1)**
- `provider`: literal `amex_se`
- `schema_version`: 1
- `invoice`: header fields
- `cardholders`: list with `name`, `card_suffix?`, `transactions[]`, `totals`
- `grand_totals`: `new_purchases_total`, `payments_total`, `invoice_total`, `min_payment`
- `notes`: optional (for parsing comments), but keep minimal

(Claude Code: implement a JSON schema object and pass it as `text.format: { type:"json_schema", ... }`.)

### 6.4 Prompt rules (very important)
Use a short, strict prompt focused on your document:

- Only use data from the PDF. No guessing.
- Transaction rows are the ones with 2 dates + description + amount in SEK.
- Credit rows:
  - Payment row “Betalning Mottagen, Tack”
  - If `CR` appears alone on the next line, it applies to the previous transaction
- Normalize:
  - date `DD.MM.YY` → `YYYY-MM-DD` (assume 20YY)
  - money `1.539,78` → `1539.78`
- Output must match schema exactly.

### 6.5 Post-processing validation
Even with strict schema, validate:
- totals match within tolerance (±1 SEK or ±0.01)
- transaction arrays not empty
- dates parse correctly

If validation fails:
- retry once with a “repair” prompt that includes the validation error
- else mark `needs_review`

---

## 7) Normalization utilities

### 7.1 Swedish money → number
Input: `17.141,66`  
Process:
- remove dots: `17141,66`
- replace comma with dot: `17141.66`
- parse float

### 7.2 Date `DD.MM.YY` → `YYYY-MM-DD`
- `YY` → `20YY` (for now; if you ever parse older statements, update logic)
- Use a strict parser; reject invalid values

### 7.3 Classification
Rules:
- `type=payment` if description contains `Betalning Mottagen`
- `type=fee` if contains `Årsavgift` or `Periodens Del Av Årsavgift`
- else `type=purchase`
Direction:
- `credit` for payments (`CR`)
- else `debit`

---

## 8) Sanity checks (must-have)

Compute:
- `sum_debits = sum(amount where direction=debit)`
- `sum_credits = sum(amount where direction=credit)` (keep negative or positive depending on your chosen convention)
- Compare to extracted totals:
  - `Summan av alla nya köp`
  - `Summa nya inbetalningar`
  - `Fakturans saldo` (page 1)

**Recommended convention**
- Store `amount` always as signed:
  - debit = positive
  - credit = negative
Then:
- `sum_all = sum(amount)`
- should match invoice total / saldo (depending on what AMEX reports on that page)

If mismatch > tolerance:
- set `status="needs_review"`
- store `sanity_checks` with diffs

---

## 9) Security & privacy (bank data)

- OpenAI key only on server/worker
- Never log full PDF content or raw extracted lines in plaintext logs
- Use encrypted storage at rest (Supabase/S3 does this; still follow best practices)
- Limit retention:
  - delete PDF after parsing (or keep only if user opts in)
  - if uploading to OpenAI Files, set `expires_after` or delete after completion
- Add rate limits per user (avoid abuse)

---

## 10) Testing plan

### 10.1 Unit tests
- money parsing
- date parsing
- CR handling (line after payment row)
- section detection for multiple cardholders

### 10.2 Golden-file tests
Maintain a `tests/fixtures/amex/*.pdf` set (anonymized if possible) and expected JSON outputs.
Run:
- deterministic parse expected match
- if not, confirm LLM fallback produces expected

### 10.3 Monitoring
Track:
- parse success rate
- deterministic vs LLM ratio
- mismatch rates in sanity checks
- average cost per statement (LLM calls)

---

## 11) Suggested repo structure

```
/apps/web
  /pages/api
    /statements/upload-url.ts
    /parse-jobs/[id].ts
/packages/shared
  /schemas/amex_v1.ts
  /utils/money.ts
  /utils/date.ts
/services/worker
  /src
    jobs/consume.ts
    parsers/amex/deterministic.py   (if python) OR deterministic.ts (if node)
    parsers/amex/llm.ts
    validate.ts
    sanity.ts
```

---

## 12) Implementation checklist

- [ ] DB tables + RLS
- [ ] Storage bucket + signed upload flow
- [ ] Job creation endpoint
- [ ] Worker queue + consumer
- [ ] Deterministic parser with confidence score
- [ ] OpenAI fallback with strict JSON schema
- [ ] Validation + normalization
- [ ] Sanity checks + status mapping
- [ ] Client polling UI
- [ ] Retention policy + deletion

---

## 13) Notes on model/API usage

- Use the **Responses API** (recommended by OpenAI for new projects).  
- Use **Structured Outputs** with strict JSON schema to avoid malformed output.
- Provide the PDF as `input_file` via `file_url` or uploaded `file_id`.

Reference docs:
- PDF inputs: https://platform.openai.com/docs/guides/pdf-files  
- Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs  
- Responses API: https://platform.openai.com/docs/api-reference/responses  
- Files API: https://platform.openai.com/docs/api-reference/files  

---

## 14) Appendix: Suggested output JSON shape (example)

```json
{
  "provider": "amex_se",
  "schema_version": 1,
  "invoice": {
    "statement_date": "2025-08-02",
    "period_start": "2025-07-03",
    "period_end": "2025-08-02",
    "due_date": "2025-08-27",
    "currency": "SEK",
    "invoice_total": 17141.66,
    "min_payment": 514.25
  },
  "cardholders": [
    {
      "name": "Emi Amanda Takahashi",
      "card_suffix": "01015",
      "transactions": [
        {
          "trans_date": "2025-07-04",
          "process_date": "2025-07-04",
          "description_raw": "Coop Ljugarn Ljugarn",
          "amount": 332.35,
          "direction": "debit",
          "type": "purchase"
        }
      ],
      "totals": { "new_purchases_total": 10766.56 }
    },
    {
      "name": "Tim Samuel Munguambe Bergholm",
      "card_suffix": "01007",
      "transactions": [],
      "totals": { "new_purchases_total": 6375.10 }
    }
  ],
  "grand_totals": {
    "new_purchases_total": 17141.66,
    "payments_total": -21949.76
  }
}
```

