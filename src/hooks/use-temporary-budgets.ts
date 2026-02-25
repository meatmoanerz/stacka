'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  Budget,
  TemporaryBudget,
  TemporaryBudgetCategory,
  TemporaryBudgetWithCategories,
  TemporaryBudgetWithDetails,
  ExpenseWithCategory,
} from '@/types'
import type { InsertTables, UpdateTables } from '@/types/database'

// ============================================================
// Query hooks
// ============================================================

export function useTemporaryBudgets() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['temporary-budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temporary_budgets')
        .select('*, temporary_budget_categories(*)')
        .in('status', ['active', 'completed'])
        .order('start_date', { ascending: false })

      if (error) throw error
      return data as TemporaryBudgetWithCategories[]
    },
  })
}

export function useActiveTemporaryBudgets() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['temporary-budgets', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temporary_budgets')
        .select('*, temporary_budget_categories(*)')
        .eq('status', 'active')
        .order('start_date', { ascending: false })

      if (error) throw error
      return data as TemporaryBudgetWithCategories[]
    },
  })
}

export function useTemporaryBudget(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['temporary-budget', id],
    queryFn: async () => {
      // Fetch budget with categories
      const { data: budget, error: budgetError } = await supabase
        .from('temporary_budgets')
        .select('*, temporary_budget_categories(*)')
        .eq('id', id)
        .single()

      if (budgetError) throw budgetError

      // Fetch expenses for this project budget
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*, category:categories(*)')
        .eq('temporary_budget_id', id)
        .order('date', { ascending: false })

      if (expensesError) throw expensesError

      const budgetData = budget as TemporaryBudgetWithCategories
      return {
        ...budgetData,
        expenses: expenses as ExpenseWithCategory[],
      } as TemporaryBudgetWithDetails
    },
    enabled: !!id,
  })
}

export function useArchivedTemporaryBudgets() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['temporary-budgets', 'archived'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temporary_budgets')
        .select('*, temporary_budget_categories(*)')
        .eq('status', 'archived')
        .order('archived_at', { ascending: false })

      if (error) throw error
      return data as TemporaryBudgetWithCategories[]
    },
  })
}

export function useArchivedMonthlyBudgets() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['budgets', 'archived'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('budgets') as any)
        .select('*')
        .eq('is_archived', true)
        .order('period', { ascending: false })

      if (error) throw error
      return data as Budget[]
    },
  })
}

// ============================================================
// Mutation hooks
// ============================================================

export function useCreateTemporaryBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      budget,
      categories,
    }: {
      budget: Omit<InsertTables<'temporary_budgets'>, 'user_id'>
      categories: { name: string; budgeted_amount: number; sort_order: number }[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: budgetData, error: budgetError } = await (supabase.from('temporary_budgets') as any)
        .insert({
          ...budget,
          user_id: user.id,
        })
        .select()
        .single()

      if (budgetError) throw budgetError

      if (categories.length > 0) {
        const categoryRows = categories.map((cat) => ({
          temporary_budget_id: budgetData.id,
          name: cat.name,
          budgeted_amount: cat.budgeted_amount,
          sort_order: cat.sort_order,
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: catError } = await (supabase.from('temporary_budget_categories') as any)
          .insert(categoryRows)

        if (catError) throw catError
      }

      return budgetData as TemporaryBudget
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
    },
  })
}

export function useUpdateTemporaryBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'temporary_budgets'> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('temporary_budgets') as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as TemporaryBudget
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
      queryClient.invalidateQueries({ queryKey: ['temporary-budget', variables.id] })
    },
  })
}

export function useDeleteTemporaryBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // First remove temporary_budget references from expenses
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('expenses') as any)
        .update({
          temporary_budget_id: null,
          temporary_budget_category_id: null,
        })
        .eq('temporary_budget_id', id)

      const { error } = await supabase
        .from('temporary_budgets')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useArchiveTemporaryBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('temporary_budgets') as any)
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
    },
  })
}

export function useRestoreTemporaryBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('temporary_budgets') as any)
        .update({ status: 'active', archived_at: null })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
    },
  })
}

export function useCompleteTemporaryBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('temporary_budgets') as any)
        .update({ status: 'completed' })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
    },
  })
}

// ============================================================
// Category mutation hooks
// ============================================================

export function useCreateTemporaryBudgetCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: InsertTables<'temporary_budget_categories'>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('temporary_budget_categories') as any)
        .insert(category)
        .select()
        .single()

      if (error) throw error
      return data as TemporaryBudgetCategory
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budget', data.temporary_budget_id] })
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
    },
  })
}

export function useUpdateTemporaryBudgetCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      budgetId,
      ...updates
    }: UpdateTables<'temporary_budget_categories'> & { id: string; budgetId: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('temporary_budget_categories') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, budgetId } as TemporaryBudgetCategory & { budgetId: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budget', data.budgetId] })
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
    },
  })
}

export function useDeleteTemporaryBudgetCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, budgetId }: { id: string; budgetId: string }) => {
      // Remove category reference from expenses first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('expenses') as any)
        .update({ temporary_budget_category_id: null })
        .eq('temporary_budget_category_id', id)

      const { error } = await supabase
        .from('temporary_budget_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { budgetId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budget', data.budgetId] })
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
    },
  })
}

// ============================================================
// Monthly budget archive hooks
// ============================================================

export function useArchiveMonthlyBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('budgets') as any)
        .update({ is_archived: true })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useRestoreMonthlyBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('budgets') as any)
        .update({ is_archived: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

// ============================================================
// Update total_spent on temporary budget
// ============================================================

export function useUpdateTemporaryBudgetSpent() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (budgetId: string) => {
      // Calculate total spent from expenses
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: expenses, error: expError } = await (supabase.from('expenses') as any)
        .select('amount')
        .eq('temporary_budget_id', budgetId)

      if (expError) throw expError

      const totalSpent = ((expenses || []) as { amount: number }[]).reduce((sum, e) => sum + e.amount, 0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('temporary_budgets') as any)
        .update({ total_spent: totalSpent })
        .eq('id', budgetId)

      if (error) throw error
    },
    onSuccess: (_, budgetId) => {
      queryClient.invalidateQueries({ queryKey: ['temporary-budget', budgetId] })
      queryClient.invalidateQueries({ queryKey: ['temporary-budgets'] })
    },
  })
}
