import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import type { PostgrestError } from '@supabase/supabase-js'

type PartnerConnection = Database['public']['Tables']['partner_connections']['Row']

async function getPartnerIdForUser(adminClient: ReturnType<typeof createServiceClient>, userId: string): Promise<string | null> {
  const { data: connection } = await adminClient
    .from('partner_connections')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'active')
    .maybeSingle() as { data: PartnerConnection | null; error: PostgrestError | null }

  if (!connection) return null
  return connection.user1_id === userId ? connection.user2_id : connection.user1_id
}

// POST - Create a monthly income (optionally for partner)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { period, name, amount, for_partner } = body as {
      period: string
      name: string
      amount: number
      for_partner?: boolean
    }

    if (!period || !name || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let targetUserId = user.id

    if (for_partner) {
      const adminClient = createServiceClient()
      const partnerId = await getPartnerIdForUser(adminClient, user.id)
      if (!partnerId) {
        return NextResponse.json({ error: 'No partner connected' }, { status: 400 })
      }
      targetUserId = partnerId
    }

    // Use service client to insert (bypasses RLS for partner inserts)
    const adminClient = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient.from('monthly_incomes') as any)
      .insert({
        user_id: targetUserId,
        period,
        name,
        amount,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating monthly income:', error)
      return NextResponse.json({ error: 'Failed to create income' }, { status: 500 })
    }

    return NextResponse.json({ income: data })
  } catch (error) {
    console.error('Monthly incomes API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a monthly income (supports partner incomes)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, amount } = body as {
      id: string
      name?: string
      amount?: number
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing income id' }, { status: 400 })
    }

    const adminClient = createServiceClient()

    // Verify the income belongs to user or their partner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: income } = await (adminClient.from('monthly_incomes') as any)
      .select('user_id')
      .eq('id', id)
      .single() as { data: { user_id: string } | null }

    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    // Check ownership: must be user's own or their partner's
    if (income.user_id !== user.id) {
      const partnerId = await getPartnerIdForUser(adminClient, user.id)
      if (income.user_id !== partnerId) {
        return NextResponse.json({ error: 'Not authorized to update this income' }, { status: 403 })
      }
    }

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (amount !== undefined) updates.amount = amount

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient.from('monthly_incomes') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating monthly income:', error)
      return NextResponse.json({ error: 'Failed to update income' }, { status: 500 })
    }

    return NextResponse.json({ income: data })
  } catch (error) {
    console.error('Monthly incomes API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a monthly income (supports partner incomes)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing income id' }, { status: 400 })
    }

    const adminClient = createServiceClient()

    // Verify the income belongs to user or their partner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: income } = await (adminClient.from('monthly_incomes') as any)
      .select('user_id')
      .eq('id', id)
      .single() as { data: { user_id: string } | null }

    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    // Check ownership: must be user's own or their partner's
    if (income.user_id !== user.id) {
      const partnerId = await getPartnerIdForUser(adminClient, user.id)
      if (income.user_id !== partnerId) {
        return NextResponse.json({ error: 'Not authorized to delete this income' }, { status: 403 })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminClient.from('monthly_incomes') as any)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting monthly income:', error)
      return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Monthly incomes API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
