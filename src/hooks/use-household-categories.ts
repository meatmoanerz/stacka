'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface HouseholdCategory {
  id: string
  user_id: string
  category_id: string
  created_at: string
}

export function useHouseholdCategories() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['household-categories'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('household_categories') as any)
        .select('*')

      if (error) throw error
      return data as HouseholdCategory[]
    },
  })
}

export function useHouseholdCategoryIds() {
  const { data: householdCategories = [] } = useHouseholdCategories()
  return new Set(householdCategories.map(hc => hc.category_id))
}

export function useToggleHouseholdCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoryId, isHousehold }: { categoryId: string; isHousehold: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (isHousehold) {
        // Remove
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('household_categories') as any)
          .delete()
          .eq('user_id', user.id)
          .eq('category_id', categoryId)

        if (error) throw error
      } else {
        // Add
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('household_categories') as any)
          .insert({ user_id: user.id, category_id: categoryId })

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-categories'] })
    },
    onError: () => {
      toast.error('Kunde inte uppdatera hushållskategori')
    },
  })
}
