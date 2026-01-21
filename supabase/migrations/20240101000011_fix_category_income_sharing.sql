-- Fix category sharing: Don't show partner's default categories (to avoid duplicates)
-- Fix income sharing: Only show own incomes on profile page

-- Drop existing category policies
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can view partner categories" ON categories;

-- Policy: Users can view their own categories (all)
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can view partner's CUSTOM categories only (not default ones)
-- This avoids duplicate default categories
CREATE POLICY "Users can view partner custom categories"
  ON categories FOR SELECT
  TO authenticated
  USING (
    is_default = false
    AND EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = auth.uid() AND pc.user2_id = categories.user_id)
        OR
        (pc.user2_id = auth.uid() AND pc.user1_id = categories.user_id)
      )
    )
  );

-- Drop existing income policies  
DROP POLICY IF EXISTS "Users can view own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can view partner incomes" ON incomes;

-- Policy: Users can ONLY view their own incomes (not partner's)
-- Budget creation will use a server function to get combined household income
CREATE POLICY "Users can view own incomes"
  ON incomes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create a function to get combined household income for budget calculations
CREATE OR REPLACE FUNCTION get_household_income()
RETURNS TABLE (
  total_income NUMERIC,
  user_income NUMERIC,
  partner_income NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_partner_id UUID;
  v_user_income NUMERIC;
  v_partner_income NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  -- Get partner ID if connected
  SELECT 
    CASE 
      WHEN pc.user1_id = v_user_id THEN pc.user2_id
      ELSE pc.user1_id
    END INTO v_partner_id
  FROM partner_connections pc
  WHERE pc.status = 'active'
    AND (pc.user1_id = v_user_id OR pc.user2_id = v_user_id)
  LIMIT 1;

  -- Get user's income
  SELECT COALESCE(SUM(amount), 0) INTO v_user_income
  FROM incomes
  WHERE user_id = v_user_id;

  -- Get partner's income if connected
  IF v_partner_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_partner_income
    FROM incomes
    WHERE user_id = v_partner_id;
  ELSE
    v_partner_income := 0;
  END IF;

  RETURN QUERY SELECT 
    v_user_income + v_partner_income AS total_income,
    v_user_income AS user_income,
    v_partner_income AS partner_income;
END;
$$;

