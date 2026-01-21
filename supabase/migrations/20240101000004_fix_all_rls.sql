-- Drop ALL existing policies and recreate them properly
-- This ensures a clean slate

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Disable RLS temporarily to verify data access, then re-enable with correct policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Simple policy: users can do everything with their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE 
  USING (auth.uid() = id);

-- CATEGORIES
DROP POLICY IF EXISTS "Users can view own and shared categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_own" ON categories FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "categories_insert_own" ON categories FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_update_own" ON categories FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "categories_delete_own" ON categories FOR DELETE 
  USING (user_id = auth.uid());

-- INCOMES
DROP POLICY IF EXISTS "Users can view own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can insert own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete own incomes" ON incomes;

ALTER TABLE incomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incomes_select_own" ON incomes FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "incomes_insert_own" ON incomes FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "incomes_update_own" ON incomes FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "incomes_delete_own" ON incomes FOR DELETE 
  USING (user_id = auth.uid());

-- BUDGETS
DROP POLICY IF EXISTS "Users can view own and partner budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;

ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own" ON budgets FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "budgets_insert_own" ON budgets FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets_update_own" ON budgets FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "budgets_delete_own" ON budgets FOR DELETE 
  USING (user_id = auth.uid());

-- EXPENSES  
DROP POLICY IF EXISTS "Users can view own and partner expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_own" ON expenses FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "expenses_insert_own" ON expenses FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "expenses_update_own" ON expenses FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "expenses_delete_own" ON expenses FOR DELETE 
  USING (user_id = auth.uid());

-- SAVINGS_GOALS
DROP POLICY IF EXISTS "Users can view own and shared savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can insert own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can update own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can delete own savings goals" ON savings_goals;

ALTER TABLE savings_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_goals_select_own" ON savings_goals FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "savings_goals_insert_own" ON savings_goals FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "savings_goals_update_own" ON savings_goals FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "savings_goals_delete_own" ON savings_goals FOR DELETE 
  USING (user_id = auth.uid());

-- PARTNER_CONNECTIONS
DROP POLICY IF EXISTS "Users can view own connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can create connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can update own connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON partner_connections;

ALTER TABLE partner_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_connections_select" ON partner_connections FOR SELECT 
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "partner_connections_insert" ON partner_connections FOR INSERT 
  WITH CHECK (initiated_by = auth.uid());

CREATE POLICY "partner_connections_update" ON partner_connections FOR UPDATE 
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "partner_connections_delete" ON partner_connections FOR DELETE 
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Recreate the default categories function with SECURITY DEFINER
-- This allows it to bypass RLS when inserting categories
CREATE OR REPLACE FUNCTION create_user_default_categories(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if user already has categories
  IF EXISTS (SELECT 1 FROM categories WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN;
  END IF;

  -- Fixed expenses
  INSERT INTO categories (user_id, name, cost_type, subcategory, is_default) VALUES
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
  INSERT INTO categories (user_id, name, cost_type, subcategory, is_default) VALUES
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
  INSERT INTO categories (user_id, name, cost_type, subcategory, is_default) VALUES
    (p_user_id, 'Amortering', 'Savings', 'Savings', true),
    (p_user_id, 'Buffert', 'Savings', 'Savings', true),
    (p_user_id, 'Boendespar', 'Savings', 'Savings', true),
    (p_user_id, 'Resespar', 'Savings', 'Savings', true),
    (p_user_id, 'Aktier/Fonder', 'Savings', 'Savings', true),
    (p_user_id, 'Övrigt sparande', 'Savings', 'Savings', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_default_categories(UUID) TO authenticated;

-- Create default categories for ALL existing users who don't have them
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN SELECT id FROM profiles LOOP
    BEGIN
      PERFORM create_user_default_categories(user_rec.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create categories for user %: %', user_rec.id, SQLERRM;
    END;
  END LOOP;
END $$;

