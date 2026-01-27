import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

// Allowed tables for admin operations
const ALLOWED_TABLES = [
  'profiles',
  'partner_connections',
  'categories',
  'custom_goal_types',
  'incomes',
  'monthly_incomes',
  'budgets',
  'budget_items',
  'budget_item_assignments',
  'expenses',
  'recurring_expenses',
  'loan_groups',
  'loans',
  'loan_interest_history',
  'savings_goals',
  'savings_goal_contributions',
  'statement_analyses',
  'statement_transactions',
] as const

type AllowedTable = (typeof ALLOWED_TABLES)[number]

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable)
}

// GET - List rows with pagination and search
export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { table } = await params

  if (!isAllowedTable(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? true : false

    const supabase = createServiceClient()
    const offset = (page - 1) * limit

    // Get total count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from(table) as any)
      .select('*', { count: 'exact', head: true })

    // Get rows with pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from(table) as any)
      .select('*')
      .range(offset, offset + limit - 1)
      .order(sortBy, { ascending: sortOrder })

    // Apply search if provided (search in common text columns)
    if (search) {
      // Build search filter based on table
      const searchColumns = getSearchColumns(table)
      if (searchColumns.length > 0) {
        const searchFilters = searchColumns
          .map((col) => `${col}.ilike.%${search}%`)
          .join(',')
        query = query.or(searchFilters)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Table query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Error fetching table data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

// PATCH - Update a row
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { table } = await params

  if (!isAllowedTable(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Remove fields that shouldn't be updated
    delete updates.id
    delete updates.created_at

    // Add updated_at if the table has it
    if (tableHasUpdatedAt(table)) {
      updates.updated_at = new Date().toISOString()
    }

    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(table) as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating row:', error)
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a row
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { table } = await params

  if (!isAllowedTable(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table) as any)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting row:', error)
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    )
  }
}

// Helper to get searchable columns for each table
function getSearchColumns(table: string): string[] {
  const columnMap: Record<string, string[]> = {
    profiles: ['email', 'first_name', 'last_name'],
    categories: ['name'],
    incomes: ['name'],
    monthly_incomes: ['name', 'period'],
    expenses: ['description'],
    recurring_expenses: ['description'],
    budgets: ['period'],
    loans: ['name'],
    loan_groups: ['name', 'description'],
    savings_goals: ['name', 'description'],
    statement_analyses: ['file_name', 'bank_name'],
    statement_transactions: ['description'],
    custom_goal_types: ['name'],
  }
  return columnMap[table] || []
}

// Helper to check if table has updated_at column
function tableHasUpdatedAt(table: string): boolean {
  const tablesWithUpdatedAt = [
    'profiles',
    'categories',
    'incomes',
    'monthly_incomes',
    'budgets',
    'expenses',
    'recurring_expenses',
    'loan_groups',
    'loans',
    'savings_goals',
  ]
  return tablesWithUpdatedAt.includes(table)
}
