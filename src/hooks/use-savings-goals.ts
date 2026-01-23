'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SavingsGoal, SavingsGoalWithCategory, SavingsGoalContributionWithExpense } from '@/types'
import type { UpdateTables } from '@/types/database'

export function useSavingsGoals() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['savings-goals'],
    queryFn: async () => {
      // First, get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('Fetching savings goals for user:', user.id)

      // First, try to get ALL savings goals for this user (no status filter) to debug
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allGoals, error: debugError } = await (supabase
        .from('savings_goals')
        .select('id, name, status, user_id, category_id')
        .eq('user_id', user.id) as any)

      console.log('DEBUG - All goals for user:', allGoals, 'Error:', debugError)

      // Now get the full data with joins
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase
        .from('savings_goals')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any)

      if (error) {
        console.error('Error fetching savings goals:', error)
        throw error
      }

      console.log('Savings goals result:', data?.length || 0, 'goals found')

      // Filter to active or null status in JS instead of in query
      const goals = (data || []).filter((goal: SavingsGoalWithCategory) => {
        const isActive = goal.status === 'active' || goal.status === null || goal.status === undefined
        if (!isActive) {
          console.log(`Goal "${goal.name}" filtered out - status: ${goal.status}`)
        }
        return isActive
      }) as SavingsGoalWithCategory[]

      console.log('After filtering:', goals.length, 'active goals')

      return goals
    },
  })
}

export function useSavingsGoal(id: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['savings-goals', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('savings_goals')
        .select(`
          *,
          category:categories(*),
          custom_goal_type:custom_goal_types(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as SavingsGoalWithCategory
    },
    enabled: !!id,
  })
}

export function useSavingsGoalContributions(goalId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['savings-goal-contributions', goalId],
    queryFn: async () => {
      if (!goalId) return []

      const { data, error } = await supabase
        .from('savings_goal_contributions')
        .select(`
          *,
          expense:expenses(*)
        `)
        .eq('savings_goal_id', goalId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as SavingsGoalContributionWithExpense[]
    },
    enabled: !!goalId,
  })
}

interface CreateSavingsGoalInput {
  name: string
  description?: string
  target_amount?: number
  target_date?: string
  starting_balance?: number
  starting_balance_user1?: number
  starting_balance_user2?: number
  monthly_savings_enabled?: boolean
  monthly_savings_amount?: number
  goal_category?: 'emergency' | 'vacation' | 'home' | 'car' | 'education' | 'retirement' | 'other'
  custom_goal_type_id?: string | null
  is_shared?: boolean
}

export function useCreateSavingsGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (goal: CreateSavingsGoalInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('Creating savings goal for user:', user.id, 'with name:', goal.name)

      // Step 1: Create a category with the same name as the savings goal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: categoryData, error: categoryError } = await (supabase.from('categories') as any)
        .insert({
          user_id: user.id,
          name: goal.name,
          cost_type: 'Savings',
          subcategory: 'Savings',
          is_default: false,
        })
        .select()
        .single()

      if (categoryError) {
        console.error('Failed to create category:', categoryError)
        throw new Error(`Kunde inte skapa kategori: ${categoryError.message}`)
      }

      console.log('Created category:', categoryData.id, categoryData.name)

      // Step 2: Create the savings goal with the new category
      // Be explicit about the fields to avoid spreading invalid properties
      const savingsGoalInsert = {
        user_id: user.id,
        category_id: categoryData.id,
        name: goal.name,
        description: goal.description || null,
        target_amount: goal.target_amount || null,
        target_date: goal.target_date || null,
        starting_balance: goal.starting_balance || 0,
        starting_balance_user1: goal.starting_balance_user1 || 0,
        starting_balance_user2: goal.starting_balance_user2 || 0,
        monthly_savings_enabled: goal.monthly_savings_enabled || false,
        monthly_savings_amount: goal.monthly_savings_amount || 0,
        goal_category: goal.goal_category || 'other',
        custom_goal_type_id: goal.custom_goal_type_id || null,
        is_shared: goal.is_shared || false,
        status: 'active', // Explicitly set status to 'active'
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: savingsGoalData, error: savingsGoalError } = await (supabase.from('savings_goals') as any)
        .insert(savingsGoalInsert)
        .select()
        .single()

      if (savingsGoalError) {
        console.error('Failed to create savings goal:', savingsGoalError)
        throw new Error(`Kunde inte skapa sparmål: ${savingsGoalError.message}`)
      }

      console.log('Created savings goal:', savingsGoalData.id, savingsGoalData.name, 'status:', savingsGoalData.status)

      // Step 3: Update the category to link back to the savings goal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('categories') as any)
        .update({ linked_savings_goal_id: savingsGoalData.id })
        .eq('id', categoryData.id)

      return savingsGoalData as SavingsGoal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
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

