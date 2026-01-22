'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseWithCategory, Category } from '@/types'
import type { InsertTables, UpdateTables } from '@/types/database'
import { getBudgetPeriod, getPeriodDates } from '@/lib/utils/budget-period'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { handleMutationError, generateTempId } from '@/lib/utils/error-handler'

/**
 * Extended type for optimistic expenses that includes a flag to identify them
 */
export interface OptimisticExpenseWithCategory extends ExpenseWithCategory {
  _isOptimistic?: boolean
}

interface UseExpensesOptions {
  period?: string
  salaryDay?: number
  limit?: number
  categoryId?: string
}

export function useExpenses(options?: UseExpensesOptions) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['expenses', options],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      // Filter by period if provided
      if (options?.period && options?.salaryDay) {
        const { startDate, endDate } = getPeriodDates(options.period, options.salaryDay)
        
        query = query
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
      }

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query
      if (error) throw error
      return data as ExpenseWithCategory[]
    },
  })
}

export function useRecentExpenses(limit: number = 5) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['expenses', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data as ExpenseWithCategory[]
    },
  })
}

export function useExpensesByPeriod(periodOrSalaryDay: string | number, salaryDay?: number) {
  const supabase = createClient()
  
  // Determine if first arg is a period string or salaryDay
  let periodStr: string
  let dates: { startDate: Date; endDate: Date }
  
  if (typeof periodOrSalaryDay === 'string') {
    // Called with period string and salaryDay
    periodStr = periodOrSalaryDay
    dates = getPeriodDates(periodStr, salaryDay || 25)
  } else {
    // Called with just salaryDay (backward compatible)
    const period = getBudgetPeriod(new Date(), periodOrSalaryDay)
    periodStr = period.period
    dates = { startDate: period.startDate, endDate: period.endDate }
  }

  return useQuery({
    queryKey: ['expenses', 'period', periodStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .gte('date', format(dates.startDate, 'yyyy-MM-dd'))
        .lte('date', format(dates.endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false })

      if (error) throw error
      return data as ExpenseWithCategory[]
    },
    enabled: !!periodStr,
  })
}

export function useCreateExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expense: InsertTables<'expenses'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('expenses') as any)
        .insert({
          ...expense,
          user_id: user.id,
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error
      return data as ExpenseWithCategory
    },
    onMutate: async (newExpense) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['expenses'] })

      // Snapshot current data for all expense queries
      const previousExpenses = queryClient.getQueriesData<OptimisticExpenseWithCategory[]>({
        queryKey: ['expenses'],
      })

      // Get the category for the optimistic expense
      const categories = queryClient.getQueryData<Category[]>(['categories'])
      const category = categories?.find(c => c.id === newExpense.category_id)

      // Create optimistic expense with temp ID
      const optimisticExpense: OptimisticExpenseWithCategory = {
        id: generateTempId(),
        user_id: newExpense.user_id || '',
        category_id: newExpense.category_id,
        amount: newExpense.amount,
        description: newExpense.description,
        date: newExpense.date || format(new Date(), 'yyyy-MM-dd'),
        cost_assignment: newExpense.cost_assignment || 'shared',
        assigned_to: newExpense.assigned_to || null,
        is_recurring: newExpense.is_recurring || false,
        recurring_expense_id: newExpense.recurring_expense_id || null,
        is_ccm: newExpense.is_ccm || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: category || {
          id: newExpense.category_id,
          user_id: '',
          name: 'Laddar...',
          cost_type: 'Variable',
          subcategory: 'Other',
          default_value: 0,
          is_default: false,
          is_shared_expense: false,
          shared_with: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        _isOptimistic: true,
      }

      // Optimistically update all expense queries
      queryClient.setQueriesData<OptimisticExpenseWithCategory[]>(
        { queryKey: ['expenses'] },
        (old) => {
          if (!old) return [optimisticExpense]
          // Insert at the beginning (most recent first)
          return [optimisticExpense, ...old]
        }
      )

      return { previousExpenses }
    },
    onError: (error, _newExpense, context) => {
      // Rollback to previous data on error
      if (context?.previousExpenses) {
        context.previousExpenses.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      handleMutationError('expense', 'create', error, toast.error)
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'expenses'> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('expenses') as any)
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error
      return data as ExpenseWithCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['expenses'] })

      // Snapshot current data for all expense queries
      const previousExpenses = queryClient.getQueriesData<ExpenseWithCategory[]>({
        queryKey: ['expenses'],
      })

      // Optimistically remove the expense from all queries
      queryClient.setQueriesData<ExpenseWithCategory[]>(
        { queryKey: ['expenses'] },
        (old) => {
          if (!old) return []
          return old.filter((expense) => expense.id !== deletedId)
        }
      )

      return { previousExpenses }
    },
    onError: (error, _deletedId, context) => {
      // Rollback to previous data on error
      if (context?.previousExpenses) {
        context.previousExpenses.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      handleMutationError('expense', 'delete', error, toast.error)
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

/**
 * Get CCM (Credit Card) expenses grouped by invoice period
 * Invoice period is based on the user's ccm_invoice_break_date setting
 */
export function useCCMExpenses(invoiceBreakDate: number = 1) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['expenses', 'ccm', invoiceBreakDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_ccm', true)
        .order('date', { ascending: false })

      if (error) throw error
      return data as ExpenseWithCategory[]
    },
  })
}

/**
 * Calculate invoice period for a given expense date
 * If expense date is >= break date, it belongs to next month's invoice
 * If expense date is < break date, it belongs to current month's invoice
 */
export function getInvoicePeriod(expenseDate: string, invoiceBreakDate: number): string {
  const date = new Date(expenseDate)
  const day = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()

  // If the expense is on or after the break date, it goes to next month's invoice
  if (day >= invoiceBreakDate) {
    const nextMonth = month + 1
    if (nextMonth > 11) {
      return `${year + 1}-01`
    }
    return `${year}-${String(nextMonth + 1).padStart(2, '0')}`
  }

  // Otherwise, it belongs to this month's invoice
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/**
 * Group CCM expenses by invoice period
 */
export function groupExpensesByInvoicePeriod(
  expenses: ExpenseWithCategory[],
  invoiceBreakDate: number
): Map<string, ExpenseWithCategory[]> {
  const grouped = new Map<string, ExpenseWithCategory[]>()

  expenses.forEach((expense) => {
    const period = getInvoicePeriod(expense.date, invoiceBreakDate)
    const existing = grouped.get(period) || []
    grouped.set(period, [...existing, expense])
  })

  // Sort periods in descending order (newest first)
  const sortedPeriods = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a))
  const sortedMap = new Map<string, ExpenseWithCategory[]>()
  sortedPeriods.forEach((period) => {
    sortedMap.set(period, grouped.get(period)!)
  })

  return sortedMap
}

