import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const DEFAULT_CATEGORIES = [
  // Fixed expenses
  { name: 'A-Kassa', cost_type: 'Fixed', subcategory: 'Home', is_default: true },
  { name: 'Avgift', cost_type: 'Fixed', subcategory: 'Housing', is_default: true },
  { name: 'El', cost_type: 'Fixed', subcategory: 'Home', is_default: true },
  { name: 'Hemförsäkring', cost_type: 'Fixed', subcategory: 'Home', is_default: true },
  { name: 'Bilkostnader', cost_type: 'Fixed', subcategory: 'Housing', is_default: true },
  { name: 'Prenumerationer', cost_type: 'Fixed', subcategory: 'Home', is_default: true },
  { name: 'Ränta bolån', cost_type: 'Fixed', subcategory: 'Loans', is_default: true },
  { name: 'Övrig försäkring', cost_type: 'Fixed', subcategory: 'Home', is_default: true },
  { name: 'Övrigt Fast', cost_type: 'Fixed', subcategory: 'Other', is_default: true },
  // Variable expenses
  { name: 'Mat', cost_type: 'Variable', subcategory: 'Home', is_default: true },
  { name: 'Hem', cost_type: 'Variable', subcategory: 'Home', is_default: true },
  { name: 'Kläder', cost_type: 'Variable', subcategory: 'Home', is_default: true },
  { name: 'Kollektivtrafik', cost_type: 'Variable', subcategory: 'Transport', is_default: true },
  { name: 'Drivmedel bil', cost_type: 'Variable', subcategory: 'Transport', is_default: true },
  { name: 'Nöje', cost_type: 'Variable', subcategory: 'Entertainment', is_default: true },
  { name: 'Restaurang', cost_type: 'Variable', subcategory: 'Entertainment', is_default: true },
  { name: 'Resor', cost_type: 'Variable', subcategory: 'Entertainment', is_default: true },
  { name: 'CSN', cost_type: 'Variable', subcategory: 'Other', is_default: true },
  { name: 'Övriga lån', cost_type: 'Variable', subcategory: 'Loans', is_default: true },
  { name: 'Kreditkort', cost_type: 'Variable', subcategory: 'Other', is_default: true },
  { name: 'Övrigt Rörligt', cost_type: 'Variable', subcategory: 'Other', is_default: true },
  // Savings
  { name: 'Amortering', cost_type: 'Savings', subcategory: 'Savings', is_default: true },
  { name: 'Buffert', cost_type: 'Savings', subcategory: 'Savings', is_default: true },
  { name: 'Boendespar', cost_type: 'Savings', subcategory: 'Savings', is_default: true },
  { name: 'Resespar', cost_type: 'Savings', subcategory: 'Savings', is_default: true },
  { name: 'Aktier/Fonder', cost_type: 'Savings', subcategory: 'Savings', is_default: true },
  { name: 'Övrigt sparande', cost_type: 'Savings', subcategory: 'Savings', is_default: true },
]

export async function POST(request: Request) {
  try {
    const { userId, email, firstName, lastName, salaryDay, onboardingCompleted } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    console.log('Setting up user:', userId, { firstName, lastName, salaryDay, onboardingCompleted })

    // 1. Check if profile exists
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('Profile check:', { existingProfile, profileCheckError })

    // 2. Create or update profile
    if (!existingProfile) {
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email || '',
          first_name: firstName || 'User',
          last_name: lastName || '',
          salary_day: salaryDay ? parseInt(salaryDay) : 25,
          onboarding_completed: onboardingCompleted ?? false,
          currency: 'SEK',
          language: 'sv',
          theme: 'light',
          ccm_enabled: false,
          ccm_invoice_break_date: 1,
        })
        .select()
        .single()

      console.log('Profile creation:', { newProfile, profileError })

      if (profileError) {
        return NextResponse.json({ 
          error: 'Failed to create profile', 
          details: profileError 
        }, { status: 500 })
      }
    } else {
      // Update existing profile
      const updateData: any = {}
      if (firstName) updateData.first_name = firstName
      if (lastName !== undefined) updateData.last_name = lastName
      if (salaryDay) updateData.salary_day = parseInt(salaryDay)
      if (onboardingCompleted !== undefined) updateData.onboarding_completed = onboardingCompleted

      if (Object.keys(updateData).length > 0) {
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single()

        console.log('Profile update:', { updatedProfile, updateError })

        if (updateError) {
          return NextResponse.json({ 
            error: 'Failed to update profile', 
            details: updateError 
          }, { status: 500 })
        }
      }
    }

    // 3. Check if categories exist
    const { data: existingCategories, error: catCheckError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    console.log('Categories check:', { count: existingCategories?.length, catCheckError })

    // 4. Create categories if they don't exist
    if (!existingCategories || existingCategories.length === 0) {
      const categoriesWithUserId = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        user_id: userId,
      }))

      const { data: newCategories, error: catError } = await supabaseAdmin
        .from('categories')
        .insert(categoriesWithUserId)
        .select()

      console.log('Categories creation:', { count: newCategories?.length, catError })

      if (catError) {
        return NextResponse.json({ 
          error: 'Failed to create categories', 
          details: catError 
        }, { status: 500 })
      }
    }

    // 5. Clean up duplicate incomes (keep the first one)
    const { data: allIncomes } = await supabaseAdmin
      .from('incomes')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (allIncomes && allIncomes.length > 1) {
      // Group by name and find duplicates
      const seen = new Set<string>()
      const duplicateIds: string[] = []
      
      for (const income of allIncomes) {
        if (seen.has(income.name)) {
          duplicateIds.push(income.id)
        } else {
          seen.add(income.name)
        }
      }

      if (duplicateIds.length > 0) {
        await supabaseAdmin
          .from('incomes')
          .delete()
          .in('id', duplicateIds)
        
        console.log('Cleaned up duplicate incomes:', duplicateIds.length)
      }
    }

    const duplicatesRemoved = allIncomes && allIncomes.length > 0
      ? allIncomes.length - new Set(allIncomes.map(i => i.name)).size
      : 0

    return NextResponse.json({ 
      success: true, 
      message: 'User setup complete',
      categoriesCreated: !existingCategories || existingCategories.length === 0,
      duplicatesRemoved,
      onboarding_completed: onboardingCompleted ?? false
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// GET route to check onboarding status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('onboarding_completed, first_name, last_name, salary_day')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch profile', 
        details: error 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      onboarding_completed: profile?.onboarding_completed ?? false,
      profile: profile
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

