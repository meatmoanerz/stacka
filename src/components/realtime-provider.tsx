'use client'

import { useUser, usePartner } from '@/hooks/use-user'
import { useExpensesRealtime } from '@/hooks/use-expenses-realtime'
import { useRecurringExpensesRealtime } from '@/hooks/use-recurring-expenses-realtime'

/**
 * RealtimeProvider sets up Supabase Realtime subscriptions for the current user.
 * This component should be mounted inside the app layout after authentication.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser()
  const { data: partner } = usePartner()

  // Setup realtime subscription for expenses
  // Only activates if user is logged in
  useExpensesRealtime(user?.id, partner?.id)

  // Setup realtime subscription for recurring expenses
  useRecurringExpensesRealtime(user?.id, partner?.id)

  // This component doesn't render anything, it just sets up subscriptions
  return <>{children}</>
}
