import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import type { PostgrestError } from '@supabase/supabase-js'

// Secret key for cron authentication - should match CRON_SECRET env var
const CRON_SECRET = process.env.CRON_SECRET

// Type definitions for this route
type RecurringExpenseRow = Database['public']['Tables']['recurring_expenses']['Row']
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']

interface RecurringExpenseWithCategory extends RecurringExpenseRow {
  categories: { name: string; icon?: string } | null
}

/**
 * API route to process recurring expenses.
 * This should be called daily by a cron job.
 *
 * It will:
 * 1. Find all active recurring expenses where day_of_month matches today
 * 2. Check if they haven't already been registered this month
 * 3. Create expense entries for those that need to be registered
 *
 * Security: Requires CRON_SECRET header for authentication
 *
 * Usage with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-recurring-expenses",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 *
 * Or use external cron service (cron-job.org, etc.)
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (skip in development)
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        console.log('[Cron] Unauthorized request - invalid or missing CRON_SECRET')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const adminClient = createServiceClient()
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Get first and last day of current month for duplicate checking
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]

    console.log(`[Cron] Processing recurring expenses for day ${currentDay} of month`)
    console.log(`[Cron] Date range for duplicate check: ${firstDayOfMonth} to ${lastDayOfMonth}`)

    // Get all active recurring expenses for today's day of month
    // Also handle end of month: if today is last day of month, also get expenses with day > current day
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const isLastDayOfMonth = currentDay === lastDayOfCurrentMonth

    let query = adminClient
      .from('recurring_expenses')
      .select('*, categories(name, icon)')
      .eq('is_active', true)

    if (isLastDayOfMonth) {
      // On last day of month, process all recurring expenses with day >= current day
      // This handles months where day_of_month doesn't exist (e.g., day 31 in February)
      query = query.gte('day_of_month', currentDay)
    } else {
      query = query.eq('day_of_month', currentDay)
    }

    const { data: recurringExpenses, error: fetchError } = await query as {
      data: RecurringExpenseWithCategory[] | null
      error: PostgrestError | null
    }

    if (fetchError) {
      console.error('[Cron] Error fetching recurring expenses:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!recurringExpenses || recurringExpenses.length === 0) {
      console.log('[Cron] No recurring expenses to process for today')
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No recurring expenses scheduled for today'
      })
    }

    console.log(`[Cron] Found ${recurringExpenses.length} recurring expenses to process`)

    // Get existing expenses this month that are linked to recurring expenses
    // This prevents duplicate creation
    const recurringIds = recurringExpenses.map(r => r.id)
    const { data: existingExpenses, error: existingError } = await adminClient
      .from('expenses')
      .select('recurring_expense_id')
      .in('recurring_expense_id', recurringIds)
      .gte('date', firstDayOfMonth)
      .lte('date', lastDayOfMonth) as {
        data: { recurring_expense_id: string | null }[] | null
        error: PostgrestError | null
      }

    if (existingError) {
      console.error('[Cron] Error checking existing expenses:', existingError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const alreadyProcessedIds = new Set(
      existingExpenses?.map(e => e.recurring_expense_id).filter(Boolean) || []
    )

    // Filter out already processed recurring expenses
    const toProcess = recurringExpenses.filter(r => !alreadyProcessedIds.has(r.id))

    if (toProcess.length === 0) {
      console.log('[Cron] All recurring expenses for today already processed')
      return NextResponse.json({
        success: true,
        processed: 0,
        skipped: recurringExpenses.length,
        message: 'All recurring expenses already processed this month'
      })
    }

    console.log(`[Cron] Processing ${toProcess.length} expenses (${alreadyProcessedIds.size} already done)`)

    // Create expense entries for each recurring expense
    const expensesToCreate: ExpenseInsert[] = toProcess.map(recurring => {
      // Calculate the actual date to use
      // If day_of_month is greater than days in current month, use last day
      const dayToUse = Math.min(recurring.day_of_month, lastDayOfCurrentMonth)
      const expenseDate = new Date(currentYear, currentMonth, dayToUse)
        .toISOString()
        .split('T')[0]

      return {
        user_id: recurring.user_id,
        category_id: recurring.category_id,
        amount: recurring.amount,
        description: recurring.description,
        date: expenseDate,
        cost_assignment: recurring.cost_assignment,
        assigned_to: recurring.assigned_to,
        is_ccm: recurring.is_ccm,
        is_recurring: true,
        recurring_expense_id: recurring.id,
      }
    })

    const { data: createdExpenses, error: createError } = await adminClient
      .from('expenses')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(expensesToCreate as any)
      .select()

    if (createError) {
      console.error('[Cron] Error creating expenses:', createError)
      return NextResponse.json({ error: 'Failed to create expenses' }, { status: 500 })
    }

    console.log(`[Cron] Successfully created ${createdExpenses?.length || 0} expenses`)

    // Log details for debugging
    const summary = toProcess.map(r => ({
      description: r.description,
      amount: r.amount,
      user_id: r.user_id,
    }))

    return NextResponse.json({
      success: true,
      processed: createdExpenses?.length || 0,
      skipped: alreadyProcessedIds.size,
      details: summary,
      message: `Successfully processed ${createdExpenses?.length || 0} recurring expenses`,
    })

  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also support POST for flexibility with different cron services
export async function POST(request: Request) {
  return GET(request)
}
