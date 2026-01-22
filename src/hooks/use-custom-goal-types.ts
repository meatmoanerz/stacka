'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { CustomGoalType } from '@/types'
import type { InsertTables } from '@/types/database'

export function useCustomGoalTypes() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['custom-goal-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_goal_types')
        .select('*')
        .order('name')

      if (error) throw error
      return data as CustomGoalType[]
    },
  })
}

export function useCreateCustomGoalType() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (goalType: Omit<InsertTables<'custom_goal_types'>, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('custom_goal_types') as any)
        .insert({
          ...goalType,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as CustomGoalType
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-goal-types'] })
    },
  })
}

export function useDeleteCustomGoalType() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_goal_types')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-goal-types'] })
    },
  })
}
