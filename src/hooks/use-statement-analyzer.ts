'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

type StatementAnalysis = Tables<'statement_analyses'>
type StatementTransaction = Tables<'statement_transactions'>

export type StatementTransactionWithCategory = StatementTransaction & {
  confirmed_category: Tables<'categories'> | null
}

export function useStatementAnalyses() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['statement-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('statement_analyses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as StatementAnalysis[]
    }
  })
}

export function useStatementAnalysis(analysisId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['statement-analysis', analysisId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('statement_analyses')
        .select('*')
        .eq('id', analysisId)
        .single()

      if (error) throw error
      return data as StatementAnalysis
    },
    enabled: !!analysisId
  })
}

export function useStatementTransactions(analysisId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['statement-transactions', analysisId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('statement_transactions')
        .select(`
          *,
          confirmed_category:categories!confirmed_category_id(*)
        `)
        .eq('analysis_id', analysisId)
        .order('date', { ascending: true })

      if (error) throw error
      return data as StatementTransactionWithCategory[]
    },
    enabled: !!analysisId
  })
}

export function useAnalyzeStatement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      bankId,
      userId
    }: {
      file: File
      bankId: string
      userId: string
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bankId', bankId)
      formData.append('userId', userId)

      // Add timeout handling (3 minutes for PDF processing with OpenAI)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000)

      try {
        const response = await fetch('/api/statement/analyze', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.details || errorData.error || 'Failed to analyze statement')
        }

        return response.json()
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Analysen tog för lång tid. Försök igen med en mindre fil.')
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statement-analyses'] })
    }
  })
}

export function useUpdateTransactionCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      transactionId,
      categoryId
    }: {
      transactionId: string
      categoryId: string
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('statement_transactions') as any)
        .update({ confirmed_category_id: categoryId })
        .eq('id', transactionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statement-transactions'] })
    }
  })
}

export function useBulkUpdateTransactionCategories() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      transactionIds,
      categoryId
    }: {
      transactionIds: string[]
      categoryId: string
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('statement_transactions') as any)
        .update({ confirmed_category_id: categoryId })
        .in('id', transactionIds)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statement-transactions'] })
    }
  })
}

export function useUpdateTransactionCostAssignment() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      transactionId,
      costAssignment
    }: {
      transactionId: string
      costAssignment: 'personal' | 'shared' | 'partner'
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('statement_transactions') as any)
        .update({ cost_assignment: costAssignment })
        .eq('id', transactionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statement-transactions'] })
    }
  })
}

export function useUpdateTransactionAmount() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      transactionId,
      amount
    }: {
      transactionId: string
      amount: number
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('statement_transactions') as any)
        .update({ amount })
        .eq('id', transactionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statement-transactions'] })
    }
  })
}

export function useUpdateAnalysisInvoiceTotal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      analysisId,
      invoiceTotal
    }: {
      analysisId: string
      invoiceTotal: number
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('statement_analyses') as any)
        .update({ invoice_total: invoiceTotal })
        .eq('id', analysisId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['statement-analysis', variables.analysisId] })
      queryClient.invalidateQueries({ queryKey: ['statement-analyses'] })
    }
  })
}

export function useImportTransactions() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      transactions,
      userId
    }: {
      transactions: StatementTransactionWithCategory[]
      userId: string
    }) => {
      const validTransactions = transactions.filter(t =>
        t.confirmed_category_id && !t.is_saved && t.is_expense
      )

      if (validTransactions.length === 0) {
        throw new Error('No valid transactions to import')
      }

      const expenses = validTransactions.map(t => ({
        user_id: userId,
        category_id: t.confirmed_category_id!,
        amount: t.amount,
        description: t.description,
        date: t.date,
        cost_assignment: t.cost_assignment || 'shared',
        is_ccm: false,
        is_recurring: false,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: createdExpenses, error } = await (supabase.from('expenses') as any)
        .insert(expenses)
        .select()

      if (error) throw error

      const transactionIds = validTransactions.map(t => t.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('statement_transactions') as any)
        .update({ is_saved: true })
        .in('id', transactionIds)

      return createdExpenses
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statement-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}
