'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RecurringExpense, Category } from '@/types'
import type { InsertTables, UpdateTables } from '@/types/database'
import { toast } from 'sonner'
import { handleMutationError } from '@/lib/utils/error-handler'

export interface RecurringExpenseWithCategory extends RecurringExpense {
  category: Category
}

export function useRecurringExpenses() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .order('day_of_month', { ascending: true })
        .order('description', { ascending: true })

      if (error) throw error
      return data as RecurringExpenseWithCategory[]
    },
  })
}

export function useActiveRecurringExpenses() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['recurring-expenses', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('day_of_month', { ascending: true })
        .order('description', { ascending: true })

      if (error) throw error
      return data as RecurringExpenseWithCategory[]
    },
  })
}

export function useCreateRecurringExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expense: Omit<InsertTables<'recurring_expenses'>, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert({
          ...expense,
          user_id: user.id,
        } as any)
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
    },
  })
}

export function useUpdateRecurringExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'recurring_expenses'> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('recurring_expenses') as any)
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:categories(*)
        `)
        .single()

      if (error) throw error
      return data as RecurringExpenseWithCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
    },
  })
}

export function useDeleteRecurringExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
    },
  })
}

export function useToggleRecurringExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('recurring_expenses') as any)
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as RecurringExpense
    },
    onMutate: async ({ id, is_active }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['recurring-expenses'] })

      // Snapshot current data for all recurring expense queries
      const previousRecurringExpenses = queryClient.getQueriesData<RecurringExpenseWithCategory[]>({
        queryKey: ['recurring-expenses'],
      })

      // Optimistically update the is_active status
      queryClient.setQueriesData<RecurringExpenseWithCategory[]>(
        { queryKey: ['recurring-expenses'] },
        (old) => {
          if (!old) return []
          return old.map((expense) =>
            expense.id === id
              ? { ...expense, is_active, updated_at: new Date().toISOString() }
              : expense
          )
        }
      )

      return { previousRecurringExpenses }
    },
    onError: (error, _variables, context) => {
      // Rollback to previous data on error
      if (context?.previousRecurringExpenses) {
        context.previousRecurringExpenses.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      handleMutationError('recurring', 'toggle', error, toast.error)
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
    },
  })
}
