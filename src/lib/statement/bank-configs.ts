export interface BankConfig {
  id: string
  name: string
  supportedFormats: ('csv' | 'pdf')[]
  prompt: string
}

export const BANK_CONFIGS: Record<string, BankConfig> = {
  amex: {
    id: 'amex',
    name: 'American Express',
    supportedFormats: ['csv', 'pdf'],
    prompt: `Du analyserar en American Express Sweden faktura (PDF).

STEG 1 - FAKTURATOTAL:
På SIDA 1, hitta "Fakturans saldo" under "Sammanfattning".
Exempel: "Fakturans saldo    17.141,66    SEK" → invoice_total: 17141.66

STEG 2 - TRANSAKTIONER:
Gå till sektionen "Nya köp". Det finns TVÅ tabeller - en för varje kortinnehavare.

KRITISKT - HUR DU IDENTIFIERAR EN GILTIG TRANSAKTION:
En giltig transaktionsrad BÖRJAR ALLTID med ett datum i formatet DD.MM.YY.
Om raden INTE börjar med ett datum (t.ex. "02.07.25") är det INTE en transaktion.

GILTIGA RADER (börjar med datum):
✓ "02.07.25  02.07.25  Coop Ljugarn  Ljugarn  117,72"
✓ "08.07.25  08.07.25  Stora Coop Visby  Visby  424,46"

OGILTIGA RADER (börjar INTE med datum - IGNORERA HELT):
✗ "Summa nya köp för Tim Samuel..."  ← INTE en transaktion, det är en summeringsrad
✗ "Summan av alla nya köp  17.141,66"  ← INTE en transaktion
✗ "Periodens Del Av Årsavgift För Kontot  135,00"  ← INTE en transaktion, det är en avgift
✗ "Nya köp för Tim Samuel..."  ← INTE en transaktion, det är en rubrik
✗ "Transaktions-datum  Processdatum..."  ← INTE en transaktion, det är kolumnrubriker

RADSTRUKTUR (vänster till höger):
| DD.MM.YY | DD.MM.YY | Butikens namn + ort | Belopp |

PARSNING - LÄS VARJE RAD SEPARAT:
Rad: "02.07.25  02.07.25  Coop Ljugarn  Ljugarn  117,72"
→ date: "2025-07-02"
→ description: "Coop Ljugarn Ljugarn"
→ amount: 117.72

Rad: "04.07.25  04.07.25  Coop Ljugarn  Ljugarn  332,35"
→ date: "2025-07-04"
→ description: "Coop Ljugarn Ljugarn"
→ amount: 332.35

BLANDA ALDRIG data mellan rader!

KORTINNEHAVARE:
- Rader under "Nya köp för Tim Samuel Munguambe Bergholm" → cardholder: "Tim Samuel Munguambe Bergholm"
- Rader under "Nya köp för Emi Amanda Takahashi" → cardholder: "Emi Amanda Takahashi"

KONVERTERING:
- Datum: "02.07.25" → "2025-07-02"
- Belopp: "1.234,56" → 1234.56

RETURNERA:
{
  "invoice_total": 17141.66,
  "transactions": [
    {"date": "2025-07-02", "description": "Coop Ljugarn Ljugarn", "amount": 117.72, "cardholder": "Tim Samuel Munguambe Bergholm"}
  ]
}

VALIDERING: Summan av transactions.amount ska vara nära invoice_total (inom 1 kr).
Om inte - du har troligen inkluderat rader som inte är transaktioner.`
  },
}

export function getBankConfig(bankId: string): BankConfig | undefined {
  return BANK_CONFIGS[bankId]
}

export function getAllBanks(): BankConfig[] {
  return Object.values(BANK_CONFIGS)
}
