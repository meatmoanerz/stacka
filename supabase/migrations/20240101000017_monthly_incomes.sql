-- Migration: Monthly Incomes
-- Allows users to record income per budget period (e.g., "2025-12")

-- Create monthly_incomes table
CREATE TABLE IF NOT EXISTS monthly_incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL, -- Format: "2025-12"
  name TEXT NOT NULL,         -- "Lön", "Barnbidrag", etc.
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_incomes_user_id ON monthly_incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_incomes_period ON monthly_incomes(period);
CREATE INDEX IF NOT EXISTS idx_monthly_incomes_user_period ON monthly_incomes(user_id, period);

-- Enable RLS
ALTER TABLE monthly_incomes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own monthly incomes
CREATE POLICY "Users can view own monthly incomes"
  ON monthly_incomes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policy: Users can view partner's monthly incomes
CREATE POLICY "Users can view partner monthly incomes"
  ON monthly_incomes FOR SELECT
  TO authenticated
  USING (user_id = get_partner_id(auth.uid()));

-- RLS Policy: Users can insert their own monthly incomes
CREATE POLICY "Users can insert own monthly incomes"
  ON monthly_incomes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can update their own monthly incomes
CREATE POLICY "Users can update own monthly incomes"
  ON monthly_incomes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can delete their own monthly incomes
CREATE POLICY "Users can delete own monthly incomes"
  ON monthly_incomes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to get household monthly incomes for a period
CREATE OR REPLACE FUNCTION get_household_monthly_incomes(p_period VARCHAR(7))
RETURNS TABLE (
  id UUID,
  user_id UUID,
  period VARCHAR(7),
  name TEXT,
  amount DECIMAL(12,2),
  is_own BOOLEAN,
  owner_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_partner_id UUID;
BEGIN
  -- Get partner ID
  v_partner_id := get_partner_id(auth.uid());

  RETURN QUERY
  SELECT
    mi.id,
    mi.user_id,
    mi.period,
    mi.name,
    mi.amount,
    mi.user_id = auth.uid() AS is_own,
    p.first_name AS owner_name,
    mi.created_at
  FROM monthly_incomes mi
  JOIN profiles p ON p.id = mi.user_id
  WHERE mi.period = p_period
    AND (mi.user_id = auth.uid() OR mi.user_id = v_partner_id)
  ORDER BY mi.user_id = auth.uid() DESC, mi.created_at ASC;
END;
$$;

-- Function to get total household income for a period
CREATE OR REPLACE FUNCTION get_household_monthly_income_total(p_period VARCHAR(7))
RETURNS TABLE (
  total_income DECIMAL(12,2),
  user_income DECIMAL(12,2),
  partner_income DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_partner_id UUID;
  v_user_income DECIMAL(12,2);
  v_partner_income DECIMAL(12,2);
BEGIN
  -- Get partner ID
  v_partner_id := get_partner_id(auth.uid());

  -- Get user's income
  SELECT COALESCE(SUM(amount), 0) INTO v_user_income
  FROM monthly_incomes
  WHERE user_id = auth.uid() AND period = p_period;

  -- Get partner's income
  SELECT COALESCE(SUM(amount), 0) INTO v_partner_income
  FROM monthly_incomes
  WHERE user_id = v_partner_id AND period = p_period;

  RETURN QUERY SELECT
    v_user_income + v_partner_income AS total_income,
    v_user_income AS user_income,
    v_partner_income AS partner_income;
END;
$$;

-- Function to check if income exists for current period
CREATE OR REPLACE FUNCTION has_income_for_period(p_period VARCHAR(7))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM monthly_incomes
    WHERE user_id = auth.uid() AND period = p_period
  );
END;
$$;

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_monthly_incomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monthly_incomes_updated_at
  BEFORE UPDATE ON monthly_incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_incomes_updated_at();
