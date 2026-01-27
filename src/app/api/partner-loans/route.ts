import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Service role client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get the current user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active connection using admin client
    const { data: connections, error: connError } = await supabaseAdmin
      .from('partner_connections')
      .select('*')
      .eq('status', 'active')

    if (connError) {
      return NextResponse.json({ error: connError.message }, { status: 500 })
    }

    // Find connection where user is either user1 or user2
    const connection = connections?.find(
      c => c.user1_id === user.id || c.user2_id === user.id
    )

    if (!connection) {
      return NextResponse.json({ loans: [] })
    }

    // Get partner ID
    const partnerId = connection.user1_id === user.id
      ? connection.user2_id
      : connection.user1_id

    // Get partner's shared loans using admin client
    const { data: loans, error: loansError } = await supabaseAdmin
      .from('loans')
      .select(`
        *,
        loan_group:loan_groups(*)
      `)
      .eq('user_id', partnerId)
      .eq('is_shared', true)
      .order('created_at', { ascending: false })

    if (loansError) {
      return NextResponse.json({ error: loansError.message }, { status: 500 })
    }

    // Get partner profile for display
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', partnerId)
      .single()

    if (partnerError) {
      return NextResponse.json({ error: partnerError.message }, { status: 500 })
    }

    return NextResponse.json({
      loans: loans || [],
      partnerId,
      partnerName: partner?.first_name || 'Partner'
    })
  } catch (error) {
    console.error('API /partner-loans error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
