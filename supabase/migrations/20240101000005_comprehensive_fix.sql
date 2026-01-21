-- =============================================
-- COMPREHENSIVE FIX FOR ALL RLS AND TRIGGER ISSUES
-- =============================================

-- First, let's recreate the handle_new_user trigger to ensure it works
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name,
    salary_day,
    onboarding_completed,
    currency,
    language,
    theme,
    ccm_enabled,
    ccm_invoice_break_date
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1), 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    25,
    false,
    'SEK',
    'sv',
    'light',
    false,
    1
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for any existing auth users that don't have profiles
INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name,
  salary_day,
  onboarding_completed,
  currency,
  language,
  theme,
  ccm_enabled,
  ccm_invoice_break_date
)
SELECT 
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'name', split_part(COALESCE(au.email, ''), '@', 1), 'User'),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  25,
  false,
  'SEK',
  'sv',
  'light',
  false,
  1
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FIX RLS POLICIES - More permissive for authenticated users
-- =============================================

-- PROFILES - Drop all and recreate
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users with own id" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users on own profile" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies
CREATE POLICY "Allow authenticated users to read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Also allow service_role to do everything
CREATE POLICY "Allow service_role full access on profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- CATEGORIES
-- =============================================

DROP POLICY IF EXISTS "categories_select_own" ON categories;
DROP POLICY IF EXISTS "categories_insert_own" ON categories;
DROP POLICY IF EXISTS "categories_update_own" ON categories;
DROP POLICY IF EXISTS "categories_delete_own" ON categories;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to read own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated to insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow service_role full access on categories"
  ON categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- INCOMES
-- =============================================

DROP POLICY IF EXISTS "incomes_select_own" ON incomes;
DROP POLICY IF EXISTS "incomes_insert_own" ON incomes;
DROP POLICY IF EXISTS "incomes_update_own" ON incomes;
DROP POLICY IF EXISTS "incomes_delete_own" ON incomes;

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to read own incomes"
  ON incomes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated to insert own incomes"
  ON incomes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to update own incomes"
  ON incomes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to delete own incomes"
  ON incomes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- BUDGETS
-- =============================================

DROP POLICY IF EXISTS "budgets_select_own" ON budgets;
DROP POLICY IF EXISTS "budgets_insert_own" ON budgets;
DROP POLICY IF EXISTS "budgets_update_own" ON budgets;
DROP POLICY IF EXISTS "budgets_delete_own" ON budgets;

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to read own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated to insert own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- EXPENSES
-- =============================================

DROP POLICY IF EXISTS "expenses_select_own" ON expenses;
DROP POLICY IF EXISTS "expenses_insert_own" ON expenses;
DROP POLICY IF EXISTS "expenses_update_own" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_own" ON expenses;

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to read own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated to insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- PARTNER_CONNECTIONS
-- =============================================

DROP POLICY IF EXISTS "partner_connections_select" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_insert" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_update" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_delete" ON partner_connections;

ALTER TABLE partner_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to manage own partner_connections"
  ON partner_connections FOR ALL
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid())
  WITH CHECK (initiated_by = auth.uid());

-- =============================================
-- SAVINGS_GOALS
-- =============================================

DROP POLICY IF EXISTS "savings_goals_select_own" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals_insert_own" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals_update_own" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals_delete_own" ON savings_goals;

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to read own savings_goals"
  ON savings_goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated to insert own savings_goals"
  ON savings_goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to update own savings_goals"
  ON savings_goals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow authenticated to delete own savings_goals"
  ON savings_goals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- BUDGET_ITEMS - needs to reference parent budget
-- =============================================

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to manage budget_items" ON budget_items;
CREATE POLICY "Allow authenticated to manage budget_items"
  ON budget_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets b WHERE b.id = budget_items.budget_id AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets b WHERE b.id = budget_items.budget_id AND b.user_id = auth.uid()
    )
  );

-- =============================================
-- OTHER TABLES
-- =============================================

-- recurring_expenses
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated to manage recurring_expenses" ON recurring_expenses;
CREATE POLICY "Allow authenticated to manage recurring_expenses"
  ON recurring_expenses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- loans
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated to manage loans" ON loans;
CREATE POLICY "Allow authenticated to manage loans"
  ON loans FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- loan_groups
ALTER TABLE loan_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated to manage loan_groups" ON loan_groups;
CREATE POLICY "Allow authenticated to manage loan_groups"
  ON loan_groups FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- statement_analyses
ALTER TABLE statement_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated to manage statement_analyses" ON statement_analyses;
CREATE POLICY "Allow authenticated to manage statement_analyses"
  ON statement_analyses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- RECREATE THE DEFAULT CATEGORIES FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.create_user_default_categories(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if user already has categories
  IF EXISTS (SELECT 1 FROM public.categories WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN;
  END IF;

  -- Fixed expenses
  INSERT INTO public.categories (user_id, name, cost_type, subcategory, is_default) VALUES
    (p_user_id, 'A-Kassa', 'Fixed', 'Home', true),
    (p_user_id, 'Avgift', 'Fixed', 'Housing', true),
    (p_user_id, 'El', 'Fixed', 'Home', true),
    (p_user_id, 'Hemförsäkring', 'Fixed', 'Home', true),
    (p_user_id, 'Bilkostnader', 'Fixed', 'Housing', true),
    (p_user_id, 'Prenumerationer', 'Fixed', 'Home', true),
    (p_user_id, 'Ränta bolån', 'Fixed', 'Loans', true),
    (p_user_id, 'Övrig försäkring', 'Fixed', 'Home', true),
    (p_user_id, 'Övrigt Fast', 'Fixed', 'Other', true);
  
  -- Variable expenses
  INSERT INTO public.categories (user_id, name, cost_type, subcategory, is_default) VALUES
    (p_user_id, 'Mat', 'Variable', 'Home', true),
    (p_user_id, 'Hem', 'Variable', 'Home', true),
    (p_user_id, 'Kläder', 'Variable', 'Home', true),
    (p_user_id, 'Kollektivtrafik', 'Variable', 'Transport', true),
    (p_user_id, 'Drivmedel bil', 'Variable', 'Transport', true),
    (p_user_id, 'Nöje', 'Variable', 'Entertainment', true),
    (p_user_id, 'Restaurang', 'Variable', 'Entertainment', true),
    (p_user_id, 'Resor', 'Variable', 'Entertainment', true),
    (p_user_id, 'CSN', 'Variable', 'Other', true),
    (p_user_id, 'Övriga lån', 'Variable', 'Loans', true),
    (p_user_id, 'Kreditkort', 'Variable', 'Other', true),
    (p_user_id, 'Övrigt Rörligt', 'Variable', 'Other', true);
  
  -- Savings
  INSERT INTO public.categories (user_id, name, cost_type, subcategory, is_default) VALUES
    (p_user_id, 'Amortering', 'Savings', 'Savings', true),
    (p_user_id, 'Buffert', 'Savings', 'Savings', true),
    (p_user_id, 'Boendespar', 'Savings', 'Savings', true),
    (p_user_id, 'Resespar', 'Savings', 'Savings', true),
    (p_user_id, 'Aktier/Fonder', 'Savings', 'Savings', true),
    (p_user_id, 'Övrigt sparande', 'Savings', 'Savings', true);
    
EXCEPTION
  WHEN unique_violation THEN
    -- Categories already exist, ignore
    RETURN;
  WHEN others THEN
    RAISE LOG 'Error creating categories for user %: %', p_user_id, SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_default_categories(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_default_categories(UUID) TO service_role;

-- Create default categories for existing users
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN SELECT id FROM public.profiles LOOP
    PERFORM public.create_user_default_categories(user_rec.id);
  END LOOP;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in category creation loop: %', SQLERRM;
END $$;

