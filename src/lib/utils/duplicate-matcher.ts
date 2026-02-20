import type { ExpenseWithCategory } from '@/types'

export interface DuplicateMatch {
  expense: ExpenseWithCategory
  score: number // Higher = more likely duplicate
  dateDistance: number // Days apart
  amountDiff: number // Absolute difference in kr
  commonWords: string[] // Shared words
}

interface Transaction {
  id: string
  date: string
  amount: number
  description: string | null
}

const DATE_TOLERANCE_DAYS = 2
const AMOUNT_TOLERANCE_KR = 5
const MIN_WORD_LENGTH = 2

/**
 * Extract meaningful words from a description string.
 * Preserves Swedish characters (åäö). Filters out short words.
 */
function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zåäö0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= MIN_WORD_LENGTH)
}

/**
 * Calculate the absolute difference in days between two date strings (YYYY-MM-DD).
 */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.abs(Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)))
}

/**
 * Find potential duplicate matches for statement transactions among existing expenses.
 *
 * Matching criteria (ALL THREE must be met):
 * - Date: within ±3 days
 * - Amount: within ±5 kr
 * - Description: at least 1 common word (≥2 characters)
 *
 * Returns a Map from transaction ID to sorted array of matches (best first).
 */
export function findDuplicates(
  transactions: Transaction[],
  expenses: ExpenseWithCategory[]
): Map<string, DuplicateMatch[]> {
  const result = new Map<string, DuplicateMatch[]>()

  for (const tx of transactions) {
    if (!tx.description) continue

    const txWords = extractWords(tx.description)
    if (txWords.length === 0) continue

    const matches: DuplicateMatch[] = []

    for (const expense of expenses) {
      // Check date distance
      const dateDistance = daysBetween(tx.date, expense.date)
      if (dateDistance > DATE_TOLERANCE_DAYS) continue

      // Check amount difference
      const amountDiff = Math.abs(tx.amount - expense.amount)
      if (amountDiff > AMOUNT_TOLERANCE_KR) continue

      // Check description overlap
      const expenseDescription = expense.description || ''
      const expenseWords = extractWords(expenseDescription)
      const commonWords = txWords.filter(w => expenseWords.includes(w))
      if (commonWords.length === 0) continue

      // Calculate score: more common words + closer date + closer amount = higher score
      const wordScore = commonWords.length * 10
      const dateScore = (DATE_TOLERANCE_DAYS - dateDistance) * 3
      const amountScore = amountDiff === 0 ? 10 : (AMOUNT_TOLERANCE_KR - amountDiff)
      const score = wordScore + dateScore + amountScore

      matches.push({
        expense,
        score,
        dateDistance,
        amountDiff,
        commonWords,
      })
    }

    if (matches.length > 0) {
      // Sort by score descending (best match first)
      matches.sort((a, b) => b.score - a.score)
      result.set(tx.id, matches)
    }
  }

  return result
}
