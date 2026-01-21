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
    prompt: `Du får data från ett American Express kontoutdrag.

Extrahera ALLA transaktioner och returnera dem i detta JSON-format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Beskrivning av köpet",
      "amount": 123.45,
      "reference": "Referensnummer om det finns"
    }
  ]
}

Regler:
- Datumet ska vara i ISO-format (YYYY-MM-DD)
- Amount ska vara ett tal (inte sträng)
- Utgifter är POSITIVA tal (pengar som lämnar kontot)
- Inbetalningar/krediteringar är NEGATIVA tal
- Ignorera sammanfattningsrader, saldon, etc - endast transaktioner
- Om en rad inte är en transaktion, hoppa över den`
  },
}

export function getBankConfig(bankId: string): BankConfig | undefined {
  return BANK_CONFIGS[bankId]
}

export function getAllBanks(): BankConfig[] {
  return Object.values(BANK_CONFIGS)
}
