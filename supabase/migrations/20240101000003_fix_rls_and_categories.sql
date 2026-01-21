-- Fix RLS policies for profiles - allow users to view and insert their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow viewing partner profile
CREATE POLICY "Users can view partner profile" ON profiles
  FOR SELECT USING (id = get_partner_id(auth.uid()));

-- Fix categories RLS - users need to be able to insert
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create a function to manually add default categories (can be called from app)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_default_categories(UUID) TO authenticated;

-- Create default categories for the existing user
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN SELECT id FROM profiles LOOP
    PERFORM create_user_default_categories(user_rec.id);
  END LOOP;
END $$;

