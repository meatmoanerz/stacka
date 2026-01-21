-- Partner expense sharing: users can see partner's expenses created after connection

-- Drop existing expense policies and recreate with partner support
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view partner expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own expenses
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can view partner's expenses (created after connection)
CREATE POLICY "Users can view partner expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = auth.uid() AND pc.user2_id = expenses.user_id)
        OR
        (pc.user2_id = auth.uid() AND pc.user1_id = expenses.user_id)
      )
      -- Only show expenses created after the connection was established
      AND expenses.created_at >= pc.created_at
    )
  );

-- Policy: Users can create their own expenses
CREATE POLICY "Users can create own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own expenses
CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can delete their own expenses
CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Also update budgets RLS
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view partner budgets" ON budgets;
DROP POLICY IF EXISTS "Users can create own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own budgets
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can view partner's budgets
CREATE POLICY "Users can view partner budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = auth.uid() AND pc.user2_id = budgets.user_id)
        OR
        (pc.user2_id = auth.uid() AND pc.user1_id = budgets.user_id)
      )
      AND budgets.created_at >= pc.created_at
    )
  );

-- Policy: Users can create their own budgets
CREATE POLICY "Users can create own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own budgets
CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can delete their own budgets
CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Also need to share incomes for proper budget calculations
DROP POLICY IF EXISTS "Users can view own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can view partner incomes" ON incomes;
DROP POLICY IF EXISTS "Users can create own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete own incomes" ON incomes;

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own incomes"
  ON incomes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view partner incomes"
  ON incomes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = auth.uid() AND pc.user2_id = incomes.user_id)
        OR
        (pc.user2_id = auth.uid() AND pc.user1_id = incomes.user_id)
      )
    )
  );

CREATE POLICY "Users can create own incomes"
  ON incomes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own incomes"
  ON incomes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own incomes"
  ON incomes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Categories should also be shared for partner expense viewing
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can view partner categories" ON categories;
DROP POLICY IF EXISTS "Users can create own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view partner categories"
  ON categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = auth.uid() AND pc.user2_id = categories.user_id)
        OR
        (pc.user2_id = auth.uid() AND pc.user1_id = categories.user_id)
      )
    )
  );

CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

