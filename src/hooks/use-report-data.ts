'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getRecentPeriods, getPeriodDates } from '@/lib/utils/budget-period'
import { format } from 'date-fns'
import type { ExpenseWithCategory } from '@/types'

export interface PeriodSummary {
  period: string
  displayName: string
  totalExpenses: number
  totalIncome: number
}

/**
 * Fetches 12 months of expense + income data in two queries,
 * then buckets them client-side by budget period.
 */
export function useReportHistory(salaryDay: number) {
  const supabase = createClient()
  const periods = getRecentPeriods(salaryDay, 12)

  // Get overall date range
  const earliest = periods[periods.length - 1]
  const latest = periods[0]
  const earliestDates = getPeriodDates(earliest.period, salaryDay)
  const latestDates = getPeriodDates(latest.period, salaryDay)

  return useQuery({
    queryKey: ['report-history', salaryDay],
    queryFn: async () => {
      // Fetch all expenses in the 12-month date range
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('*, category:categories(*)')
        .gte('date', format(earliestDates.startDate, 'yyyy-MM-dd'))
        .lte('date', format(latestDates.endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false })

      if (expError) throw expError

      // Fetch monthly incomes for the 12 periods
      const periodStrings = periods.map(p => p.period)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rpcResult = { data: null as any, error: null as any }
      try {
        rpcResult = await (supabase.rpc as any)(
          'get_household_monthly_income_total_batch',
          { p_periods: periodStrings }
        )
      } catch {
        // RPC doesn't exist, fall through to fallback
      }
      const { data: incomes, error: incError } = rpcResult

      // Fallback: fetch individual incomes if batch RPC doesn't exist
      const incomeMap: Record<string, number> = {}
      if (incomes && !incError) {
        for (const row of incomes as { period: string; total_income: number }[]) {
          incomeMap[row.period] = row.total_income
        }
      } else {
        // Fallback: query monthly_incomes directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rawIncomes } = await (supabase.from('monthly_incomes') as any)
          .select('period, amount')
          .in('period', periodStrings)

        if (rawIncomes) {
          for (const row of rawIncomes as { period: string; amount: number }[]) {
            incomeMap[row.period] = (incomeMap[row.period] || 0) + Number(row.amount)
          }
        }
      }

      // Bucket expenses into periods, excluding CCM expenses to avoid double counting
      const allExpenses = (expenses || []) as ExpenseWithCategory[]
      const summaries: PeriodSummary[] = periods.map(p => {
        const { startDate, endDate } = getPeriodDates(p.period, salaryDay)
        const periodExpenses = allExpenses.filter(exp => {
          const d = new Date(exp.date)
          return d >= startDate && d <= endDate && !exp.is_ccm
        })
        const totalExpenses = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0)

        return {
          period: p.period,
          displayName: p.displayName,
          totalExpenses,
          totalIncome: incomeMap[p.period] || 0,
        }
      })

      // Always show all 12 periods (oldest first for chart)
      return summaries.reverse()
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!salaryDay,
  })
}

/**
 * Get the budget period object for navigation (prev/next period from a given period string).
 */
export function getAdjacentPeriod(periodStr: string, direction: 'prev' | 'next'): string {
  const [year, month] = periodStr.split('-').map(Number)
  if (direction === 'next') {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
  } else {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`
  }
}
