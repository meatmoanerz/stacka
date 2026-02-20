'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ExpenseWithCategory } from '@/types'

interface UpdateGroupPurchaseData {
  id: string
  totalAmount: number
  description: string
  category_id: string
  date: string
  userShare: number
  partnerShare: number
  swishRecipient: 'user' | 'partner' | 'shared'
}

interface CreateGroupPurchaseData {
  totalAmount: number
  description: string
  category_id: string
  date: string
  userShare: number
  partnerShare: number
  swishRecipient: 'user' | 'partner' | 'shared'
}

export function useCreateGroupPurchase() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGroupPurchaseData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const swishAmount = data.totalAmount - data.userShare - data.partnerShare

      // Determine cost_assignment based on shares
      let costAssignment: 'personal' | 'shared' | 'partner'
      if (data.partnerShare > 0 && data.userShare > 0) {
        costAssignment = 'shared'
      } else if (data.partnerShare > 0 && data.userShare === 0) {
        costAssignment = 'partner'
      } else {
        costAssignment = 'personal'
      }

      // The expense amount stored is the user+partner share (budget impact)
      // The group_purchase_total stores the full CC amount
      const budgetAmount = data.userShare + data.partnerShare

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: expense, error } = await (supabase.from('expenses') as any)
        .insert({
          user_id: user.id,
          category_id: data.category_id,
          amount: budgetAmount,
          description: data.description,
          date: data.date,
          is_ccm: true,
          cost_assignment: costAssignment,
          is_group_purchase: true,
          group_purchase_total: data.totalAmount,
          group_purchase_user_share: data.userShare,
          group_purchase_partner_share: data.partnerShare,
          group_purchase_swish_amount: swishAmount,
          group_purchase_swish_recipient: data.swishRecipient,
        })
        .select(`*, category:categories(*)`)
        .single()

      if (error) throw error
      return expense as ExpenseWithCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Gruppköp sparat!')
    },
    onError: (error) => {
      console.error('Failed to create group purchase:', error)
      toast.error('Kunde inte spara gruppköp')
    },
  })
}

export function useUpdateGroupPurchase() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateGroupPurchaseData) => {
      const swishAmount = data.totalAmount - data.userShare - data.partnerShare

      let costAssignment: 'personal' | 'shared' | 'partner'
      if (data.partnerShare > 0 && data.userShare > 0) {
        costAssignment = 'shared'
      } else if (data.partnerShare > 0 && data.userShare === 0) {
        costAssignment = 'partner'
      } else {
        costAssignment = 'personal'
      }

      const budgetAmount = data.userShare + data.partnerShare

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: expense, error } = await (supabase.from('expenses') as any)
        .update({
          category_id: data.category_id,
          amount: budgetAmount,
          description: data.description,
          date: data.date,
          cost_assignment: costAssignment,
          group_purchase_total: data.totalAmount,
          group_purchase_user_share: data.userShare,
          group_purchase_partner_share: data.partnerShare,
          group_purchase_swish_amount: swishAmount,
          group_purchase_swish_recipient: data.swishRecipient,
        })
        .eq('id', data.id)
        .select(`*, category:categories(*)`)
        .single()

      if (error) throw error
      return expense as ExpenseWithCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Gruppköp uppdaterat!')
    },
    onError: (error) => {
      console.error('Failed to update group purchase:', error)
      toast.error('Kunde inte uppdatera gruppköp')
    },
  })
}
