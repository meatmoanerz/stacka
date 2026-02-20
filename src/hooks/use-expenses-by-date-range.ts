'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, addDays } from 'date-fns'
import type { ExpenseWithCategory } from '@/types'

const BUFFER_DAYS = 2

/**
 * Fetch expenses within a date range (with ±3 day buffer for duplicate matching).
 * Uses plain date filtering — no budget period logic.
 * RLS automatically includes partner's expenses.
 */
export function useExpensesByDateRange(minDate: string | null, maxDate: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['expenses', 'date-range', minDate, maxDate],
    queryFn: async () => {
      if (!minDate || !maxDate) return []

      const from = format(subDays(new Date(minDate), BUFFER_DAYS), 'yyyy-MM-dd')
      const to = format(addDays(new Date(maxDate), BUFFER_DAYS), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false })

      if (error) throw error
      return data as ExpenseWithCategory[]
    },
    enabled: !!minDate && !!maxDate,
  })
}
