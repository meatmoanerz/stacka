export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  defaultRate: number // How many SEK per 1 unit of this currency
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'SEK', name: 'Svensk krona', symbol: 'kr', defaultRate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', defaultRate: 11.5 },
  { code: 'USD', name: 'US Dollar', symbol: '$', defaultRate: 10.5 },
  { code: 'GBP', name: 'Brittiskt pund', symbol: '£', defaultRate: 13.5 },
  { code: 'NOK', name: 'Norsk krona', symbol: 'kr', defaultRate: 1.0 },
  { code: 'DKK', name: 'Dansk krona', symbol: 'kr', defaultRate: 1.55 },
  { code: 'CHF', name: 'Schweizisk franc', symbol: 'CHF', defaultRate: 12.0 },
  { code: 'THB', name: 'Thailändsk baht', symbol: '฿', defaultRate: 0.31 },
  { code: 'JPY', name: 'Japansk yen', symbol: '¥', defaultRate: 0.07 },
  { code: 'PLN', name: 'Polsk zloty', symbol: 'zł', defaultRate: 2.7 },
  { code: 'TRY', name: 'Turkisk lira', symbol: '₺', defaultRate: 0.30 },
  { code: 'HRK', name: 'Kroatisk kuna', symbol: 'kn', defaultRate: 1.53 },
  { code: 'CZK', name: 'Tjeckisk koruna', symbol: 'Kč', defaultRate: 0.46 },
  { code: 'HUF', name: 'Ungersk forint', symbol: 'Ft', defaultRate: 0.029 },
  { code: 'AUD', name: 'Australisk dollar', symbol: 'A$', defaultRate: 6.8 },
  { code: 'CAD', name: 'Kanadensisk dollar', symbol: 'C$', defaultRate: 7.7 },
  { code: 'ISK', name: 'Isländsk krona', symbol: 'kr', defaultRate: 0.077 },
]

export function getCurrency(code: string): CurrencyInfo | undefined {
  return CURRENCIES.find(c => c.code === code)
}

export function convertToSEK(amount: number, exchangeRate: number): number {
  return Math.round(amount * exchangeRate)
}

export function convertFromSEK(amountSEK: number, exchangeRate: number): number {
  if (exchangeRate === 0) return 0
  return Math.round(amountSEK / exchangeRate)
}

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode)
  if (!currency || currencyCode === 'SEK') {
    return `${new Intl.NumberFormat('sv-SE').format(amount)} kr`
  }
  return `${new Intl.NumberFormat('sv-SE').format(amount)} ${currency.symbol}`
}
