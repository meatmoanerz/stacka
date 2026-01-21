'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RecurringExpenseRealtimePayload {
  id: string
  user_id: string
  category_id: string
  amount: number
  description: string
  day_of_month: number
  cost_assignment: 'personal' | 'shared' | 'partner'
  assigned_to: string | null
  is_ccm: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useRecurringExpensesRealtime(userId: string | undefined, partnerId: string | undefined) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    // Only setup realtime if we have a valid user
    if (!userId) return

    console.log('[Realtime] Setting up recurring expenses realtime subscription for user:', userId)
    if (partnerId) {
      console.log('[Realtime] Partner connected:', partnerId)
    }

    // Create a channel for realtime updates
    const channel = supabase
      .channel('recurring-expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'recurring_expenses',
        },
        async (payload: RealtimePostgresChangesPayload<RecurringExpenseRealtimePayload>) => {
          console.log('[Realtime] Recurring expense change detected:', payload.eventType, payload)

          const recurringExpense = payload.new as RecurringExpenseRealtimePayload
          const oldRecurringExpense = payload.old as RecurringExpenseRealtimePayload

          // Determine if this recurring expense is relevant to current user
          let isRelevant = false

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Show recurring expense if:
            // 1. User created it
            // 2. Partner created it AND it's shared
            // 3. Partner created it AND it's assigned to partner
            // 4. Recurring expense is assigned_to current user
            isRelevant =
              recurringExpense.user_id === userId ||
              (partnerId && recurringExpense.user_id === partnerId && recurringExpense.cost_assignment === 'shared') ||
              (partnerId && recurringExpense.user_id === partnerId && recurringExpense.cost_assignment === 'partner') ||
              recurringExpense.assigned_to === userId
          } else if (payload.eventType === 'DELETE') {
            // For deletes, we only have old data
            isRelevant =
              oldRecurringExpense.user_id === userId ||
              (partnerId && oldRecurringExpense.user_id === partnerId && oldRecurringExpense.cost_assignment === 'shared') ||
              (partnerId && oldRecurringExpense.user_id === partnerId && oldRecurringExpense.cost_assignment === 'partner') ||
              oldRecurringExpense.assigned_to === userId
          }

          if (!isRelevant) {
            console.log('[Realtime] Recurring expense not relevant to current user, ignoring')
            return
          }

          console.log('[Realtime] Recurring expense is relevant, invalidating queries')

          // Invalidate all recurring expense-related queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] })
          queryClient.invalidateQueries({ queryKey: ['active-recurring-expenses'] })
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Recurring expenses subscription status:', status)
        if (err) {
          console.error('[Realtime] Subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ Successfully subscribed to recurring expense changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] ❌ Channel error - Realtime may not be enabled in Supabase')
        } else if (status === 'TIMED_OUT') {
          console.error('[Realtime] ❌ Subscription timed out')
        }
      })

    // Cleanup function
    return () => {
      console.log('[Realtime] Cleaning up recurring expenses realtime subscription')
      channel.unsubscribe()
    }
  }, [userId, partnerId, supabase, queryClient])
}
