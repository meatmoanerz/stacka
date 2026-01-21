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
        .order('date', { ascending: false })

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

      const response = await fetch('/api/statement/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze statement')
      }

      return response.json()
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
        cost_assignment: 'personal' as const,
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
