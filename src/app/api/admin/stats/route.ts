import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { subDays, subMonths, startOfDay, format } from 'date-fns'

export async function GET(request: Request) {
  // Verify admin session
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const supabase = createServiceClient()
    const now = new Date()

    // Calculate date range based on period
    let startDate: Date
    switch (period) {
      case 'today':
        startDate = startOfDay(now)
        break
      case '7d':
        startDate = subDays(now, 7)
        break
      case '30d':
        startDate = subDays(now, 30)
        break
      case '12m':
        startDate = subMonths(now, 12)
        break
      default:
        startDate = subDays(now, 30)
    }

    const startDateStr = format(startDate, 'yyyy-MM-dd')
    const thirtyDaysAgo = format(subDays(now, 30), 'yyyy-MM-dd')

    // Fetch all stats in parallel
    const [
      totalUsersResult,
      newUsersResult,
      activeUsersResult,
      totalExpensesResult,
      partnerConnectionsResult,
      ccmEnabledResult,
      onboardingCompletedResult,
      expensesByPeriodResult,
    ] = await Promise.all([
      // Total users
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      // New users in period
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDateStr),

      // Active users (created expense in last 30 days)
      supabase
        .from('expenses')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo),

      // Total expenses in period
      supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDateStr),

      // Active partner connections
      supabase
        .from('partner_connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Users with CCM enabled
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('ccm_enabled', true),

      // Users who completed onboarding
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('onboarding_completed', true),

      // Expenses aggregated by date for chart
      supabase
        .from('expenses')
        .select('created_at, amount')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true }),
    ])

    // Calculate unique active users
    const activeUserIds = activeUsersResult.data as { user_id: string }[] | null
    const uniqueActiveUsers = new Set(
      activeUserIds?.map((e) => e.user_id) || []
    ).size

    // Calculate average expenses per user
    const totalUsers = totalUsersResult.count || 1
    const totalExpenses = totalExpensesResult.count || 0
    const avgExpensesPerUser = Math.round(totalExpenses / Math.max(totalUsers, 1))

    // Calculate onboarding rate
    const onboardingCompleted = onboardingCompletedResult.count || 0
    const onboardingRate = totalUsers > 0
      ? Math.round((onboardingCompleted / totalUsers) * 100)
      : 0

    // Aggregate daily activity for chart
    const dailyActivity: Record<string, { count: number; amount: number }> = {}
    const expensesData = expensesByPeriodResult.data as { created_at: string; amount: number }[] | null
    expensesData?.forEach((expense) => {
      const date = format(new Date(expense.created_at), 'yyyy-MM-dd')
      if (!dailyActivity[date]) {
        dailyActivity[date] = { count: 0, amount: 0 }
      }
      dailyActivity[date].count += 1
      dailyActivity[date].amount += expense.amount
    })

    const activityChart = Object.entries(dailyActivity)
      .map(([date, data]) => ({
        date,
        expenses: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      totalUsers: totalUsersResult.count || 0,
      newUsers: newUsersResult.count || 0,
      activeUsers: uniqueActiveUsers,
      totalExpenses: totalExpenses,
      partnerConnections: partnerConnectionsResult.count || 0,
      ccmEnabledUsers: ccmEnabledResult.count || 0,
      avgExpensesPerUser,
      onboardingRate,
      activityChart,
      period,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
