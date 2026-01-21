import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import type { PostgrestError } from '@supabase/supabase-js'

type Income = Database['public']['Tables']['incomes']['Row']
type PartnerConnection = Database['public']['Tables']['partner_connections']['Row']

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('household-incomes: Unauthorized', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('household-incomes: Fetching for user:', user.id)

    // Use service client to bypass RLS for reading partner data
    const adminClient = createServiceClient()

    // Get user's incomes
    const { data: userIncomes, error: userIncomesError } = await adminClient
      .from('incomes')
      .select('*')
      .eq('user_id', user.id)
      .order('name') as { data: Income[] | null; error: PostgrestError | null }

    console.log('household-incomes: User incomes:', userIncomes?.length, userIncomesError)

    // Get partner connection - using correct column names (user1_id, user2_id) and status ('active')
    const { data: connection, error: connectionError } = await adminClient
      .from('partner_connections')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .maybeSingle() as { data: PartnerConnection | null; error: PostgrestError | null }

    console.log('household-incomes: Connection:', connection, connectionError)

    let partnerIncomes: Income[] = []
    let partnerId: string | null = null
    let partnerProfile: { first_name: string; last_name: string } | null = null

    if (connection && !connectionError) {
      // Determine partner ID based on which field contains current user
      partnerId = connection.user1_id === user.id ? connection.user2_id : connection.user1_id
      console.log('household-incomes: Partner ID:', partnerId)

      // Get partner's incomes using service client (bypasses RLS)
      const { data: pIncomes, error: pError } = await adminClient
        .from('incomes')
        .select('*')
        .eq('user_id', partnerId)
        .order('name') as { data: Income[] | null; error: PostgrestError | null }

      console.log('household-incomes: Partner incomes:', pIncomes, pError)

      if (pError) {
        console.error('Error fetching partner incomes:', pError)
      } else {
        partnerIncomes = pIncomes || []
      }

      // Get partner profile for name
      const { data: pProfile } = await adminClient
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', partnerId)
        .single() as { data: { first_name: string; last_name: string } | null }

      partnerProfile = pProfile
      console.log('household-incomes: Partner profile:', pProfile)
    }

    const response = {
      userIncomes: userIncomes || [],
      partnerIncomes: partnerIncomes || [],
      userId: user.id,
      partnerId,
      partnerName: partnerProfile?.first_name || null,
    }

    console.log('household-incomes: Response summary - user incomes:', response.userIncomes.length, 'partner incomes:', response.partnerIncomes.length)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Household incomes API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

