'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { getCurrentBudgetPeriod, getPreviousBudgetPeriod } from '@/lib/utils/budget-period'
import type { MonthlyIncome, HouseholdMonthlyIncome } from '@/types'

// Pre-defined income types for suggestions
export const INCOME_TYPES = [
  'Lön',
  'Barnbidrag',
  'Studiebidrag',
  'Sjukpenning',
  'Föräldrapenning',
  'Pension',
  'A-kassa',
  'Övrigt',
] as const

export type IncomeType = typeof INCOME_TYPES[number]

// Get monthly incomes for a specific period
export function useMonthlyIncomes(period?: string) {
  const supabase = createClient()
  const { data: user } = useUser()
  const salaryDay = user?.salary_day || 25
  const currentPeriod = period || getCurrentBudgetPeriod(salaryDay).period

  return useQuery({
    queryKey: ['monthly-incomes', currentPeriod],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('monthly_incomes') as any)
        .select('*')
        .eq('period', currentPeriod)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as MonthlyIncome[]
    },
    enabled: !!user,
  })
}

// Get household monthly incomes (user + partner) for a period
export function useHouseholdMonthlyIncomes(period?: string) {
  const supabase = createClient()
  const { data: user } = useUser()
  const salaryDay = user?.salary_day || 25
  const currentPeriod = period || getCurrentBudgetPeriod(salaryDay).period

  return useQuery({
    queryKey: ['household-monthly-incomes', currentPeriod],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_household_monthly_incomes', { p_period: currentPeriod })

      if (error) {
        console.error('Error fetching household monthly incomes:', error)
        // Fallback to just user's incomes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: userIncomes } = await (supabase.from('monthly_incomes') as any)
          .select('*')
          .eq('period', currentPeriod)
          .order('created_at', { ascending: true })

        return ((userIncomes || []) as MonthlyIncome[]).map(income => ({
          id: income.id,
          user_id: income.user_id,
          period: income.period,
          name: income.name,
          amount: income.amount,
          is_own: true,
          owner_name: user?.first_name || 'Du',
          created_at: income.created_at,
        })) as HouseholdMonthlyIncome[]
      }

      return data as HouseholdMonthlyIncome[]
    },
    enabled: !!user,
  })
}

// Get total monthly income for a period
export function useMonthlyIncomeTotal(period?: string) {
  const supabase = createClient()
  const { data: user } = useUser()
  const salaryDay = user?.salary_day || 25
  const currentPeriod = period || getCurrentBudgetPeriod(salaryDay).period

  return useQuery({
    queryKey: ['monthly-income-total', currentPeriod],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_household_monthly_income_total', { p_period: currentPeriod })
        .single()

      if (error) {
        console.error('Error fetching monthly income total:', error)
        // Fallback: calculate from user's incomes only
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: incomes } = await (supabase.from('monthly_incomes') as any)
          .select('amount')
          .eq('period', currentPeriod)

        const total = ((incomes || []) as { amount: number }[]).reduce((sum, i) => sum + Number(i.amount), 0)
        return { total_income: total, user_income: total, partner_income: 0 }
      }

      return data as { total_income: number; user_income: number; partner_income: number }
    },
    enabled: !!user,
  })
}

// Check if user has income for current period
export function useHasIncomeForCurrentPeriod() {
  const supabase = createClient()
  const { data: user } = useUser()
  const salaryDay = user?.salary_day || 25
  const currentPeriod = getCurrentBudgetPeriod(salaryDay).period

  return useQuery({
    queryKey: ['has-income-for-period', currentPeriod],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('has_income_for_period', { p_period: currentPeriod })

      if (error) {
        console.error('Error checking income for period:', error)
        // Fallback: check manually
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: incomes } = await (supabase.from('monthly_incomes') as any)
          .select('id')
          .eq('period', currentPeriod)
          .limit(1)

        return ((incomes as { id: string }[] | null)?.length || 0) > 0
      }

      return data as boolean
    },
    enabled: !!user,
  })
}

// Create monthly income (own or partner's)
export function useCreateMonthlyIncome() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (income: {
      period: string
      name: string
      amount: number
      forPartner?: boolean
    }) => {
      if (income.forPartner) {
        // Use API route to bypass RLS for partner
        const response = await fetch('/api/partner-monthly-incomes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            period: income.period,
            name: income.name,
            amount: income.amount,
          }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to create partner income')
        return result.income as MonthlyIncome
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('monthly_incomes') as any)
        .insert({
          user_id: user.id,
          period: income.period,
          name: income.name,
          amount: income.amount,
        })
        .select()
        .single()

      if (error) throw error
      return data as MonthlyIncome
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['monthly-incomes', variables.period] })
      queryClient.invalidateQueries({ queryKey: ['household-monthly-incomes', variables.period] })
      queryClient.invalidateQueries({ queryKey: ['monthly-income-total', variables.period] })
      queryClient.invalidateQueries({ queryKey: ['has-income-for-period'] })
    },
  })
}

// Update monthly income (own or partner's)
export function useUpdateMonthlyIncome() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, forPartner, ...updates }: {
      id: string
      name?: string
      amount?: number
      forPartner?: boolean
    }) => {
      if (forPartner) {
        const response = await fetch('/api/partner-monthly-incomes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to update partner income')
        return result.income as MonthlyIncome
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('monthly_incomes') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MonthlyIncome
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['monthly-incomes', data.period] })
      queryClient.invalidateQueries({ queryKey: ['household-monthly-incomes', data.period] })
      queryClient.invalidateQueries({ queryKey: ['monthly-income-total', data.period] })
    },
  })
}

// Delete monthly income (own or partner's)
export function useDeleteMonthlyIncome() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, period, forPartner }: { id: string; period: string; forPartner?: boolean }) => {
      if (forPartner) {
        const response = await fetch(`/api/partner-monthly-incomes?id=${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to delete partner income')
        return { id, period }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('monthly_incomes') as any)
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, period }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['monthly-incomes', data.period] })
      queryClient.invalidateQueries({ queryKey: ['household-monthly-incomes', data.period] })
      queryClient.invalidateQueries({ queryKey: ['monthly-income-total', data.period] })
      queryClient.invalidateQueries({ queryKey: ['has-income-for-period'] })
    },
  })
}

// Copy incomes from previous period to current period
export function useCopyPreviousPeriodIncomes() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { data: user } = useUser()
  const salaryDay = user?.salary_day || 25

  return useMutation({
    mutationFn: async (targetPeriod?: string) => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      const currentPeriod = targetPeriod || getCurrentBudgetPeriod(salaryDay).period
      const previousPeriod = getPreviousBudgetPeriod(salaryDay).period

      // Get previous period incomes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: previousIncomes, error: fetchError } = await (supabase.from('monthly_incomes') as any)
        .select('name, amount')
        .eq('period', previousPeriod)
        .eq('user_id', authUser.id)

      if (fetchError) throw fetchError
      if (!previousIncomes || previousIncomes.length === 0) {
        throw new Error('Inga inkomster att kopiera från förra månaden')
      }

      // Insert for new period
      const newIncomes = (previousIncomes as { name: string; amount: number }[]).map(income => ({
        user_id: authUser.id,
        period: currentPeriod,
        name: income.name,
        amount: income.amount,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: insertError } = await (supabase.from('monthly_incomes') as any)
        .insert(newIncomes)
        .select()

      if (insertError) throw insertError
      return { incomes: data as MonthlyIncome[], period: currentPeriod }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['monthly-incomes', data.period] })
      queryClient.invalidateQueries({ queryKey: ['household-monthly-incomes', data.period] })
      queryClient.invalidateQueries({ queryKey: ['monthly-income-total', data.period] })
      queryClient.invalidateQueries({ queryKey: ['has-income-for-period'] })
    },
  })
}
