'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SavingsGoal, SavingsGoalWithCategory } from '@/types'
import type { InsertTables, UpdateTables } from '@/types/database'

export function useSavingsGoals() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['savings-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as SavingsGoalWithCategory[]
    },
  })
}

export function useCreateSavingsGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (goal: InsertTables<'savings_goals'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('savings_goals') as any)
        .insert({
          ...goal,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as SavingsGoal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
    },
  })
}

export function useUpdateSavingsGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTables<'savings_goals'> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('savings_goals') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SavingsGoal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
    },
  })
}

export function useDeleteSavingsGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('savings_goals') as any)
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
    },
  })
}

