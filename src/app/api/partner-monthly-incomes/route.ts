import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API route for managing partner's monthly incomes.
 * Uses service role client to bypass RLS and write to partner's monthly_incomes.
 * Validates that the authenticated user actually has an active partner connection.
 */

async function getPartnerIdForUser(userId: string) {
  const adminClient = createServiceClient()
  const { data: connection } = await adminClient
    .from('partner_connections')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'active')
    .maybeSingle()

  if (!connection) return null
  return connection.user1_id === userId ? connection.user2_id : connection.user1_id
}

// Create a monthly income for the partner
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partnerId = await getPartnerIdForUser(user.id)
    if (!partnerId) {
      return NextResponse.json({ error: 'No active partner connection' }, { status: 400 })
    }

    const body = await request.json()
    const { period, name, amount } = body

    if (!period || !name || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const adminClient = createServiceClient()
    const { data, error } = await adminClient
      .from('monthly_incomes')
      .insert({
        user_id: partnerId,
        period,
        name,
        amount,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ income: data })
  } catch (error) {
    console.error('Partner monthly income POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update a partner's monthly income
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partnerId = await getPartnerIdForUser(user.id)
    if (!partnerId) {
      return NextResponse.json({ error: 'No active partner connection' }, { status: 400 })
    }

    const body = await request.json()
    const { id, name, amount } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing income id' }, { status: 400 })
    }

    const adminClient = createServiceClient()

    // Verify the income belongs to the partner
    const { data: existing } = await adminClient
      .from('monthly_incomes')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== partnerId) {
      return NextResponse.json({ error: 'Income not found or not partner\'s' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (amount !== undefined) updates.amount = amount

    const { data, error } = await adminClient
      .from('monthly_incomes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ income: data })
  } catch (error) {
    console.error('Partner monthly income PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete a partner's monthly income
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partnerId = await getPartnerIdForUser(user.id)
    if (!partnerId) {
      return NextResponse.json({ error: 'No active partner connection' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing income id' }, { status: 400 })
    }

    const adminClient = createServiceClient()

    // Verify the income belongs to the partner
    const { data: existing } = await adminClient
      .from('monthly_incomes')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== partnerId) {
      return NextResponse.json({ error: 'Income not found or not partner\'s' }, { status: 404 })
    }

    const { error } = await adminClient
      .from('monthly_incomes')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Partner monthly income DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
