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

    console.log('API /partner: Looking for partner for user:', user.id)

    // Get active connection using admin client
    const { data: connections, error: connError } = await supabaseAdmin
      .from('partner_connections')
      .select('*')
      .eq('status', 'active')

    console.log('API /partner: All active connections:', connections, 'Error:', connError)

    if (connError) {
      return NextResponse.json({ error: connError.message }, { status: 500 })
    }

    // Find connection where user is either user1 or user2
    const connection = connections?.find(
      c => c.user1_id === user.id || c.user2_id === user.id
    )

    console.log('API /partner: Found connection:', connection)

    if (!connection) {
      return NextResponse.json({ partner: null, connection: null })
    }

    // Get partner ID
    const partnerId = connection.user1_id === user.id
      ? connection.user2_id
      : connection.user1_id

    console.log('API /partner: Partner ID:', partnerId)

    // Get partner profile using admin client
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single()

    console.log('API /partner: Partner profile:', partner, 'Error:', partnerError)

    if (partnerError) {
      return NextResponse.json({ error: partnerError.message }, { status: 500 })
    }

    return NextResponse.json({ partner, connection })
  } catch (error) {
    console.error('API /partner error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

