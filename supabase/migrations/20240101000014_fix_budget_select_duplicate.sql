-- Fix duplicate SELECT policies for budgets that cause 406 errors
-- Combine own and partner SELECT policies into one unified policy

-- Drop all existing SELECT policies for budgets
DROP POLICY IF EXISTS "budgets_select_own" ON budgets;
DROP POLICY IF EXISTS "Allow authenticated to read own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view partner budgets" ON budgets;

-- Create single unified SELECT policy
CREATE POLICY "Users can view own and partner budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = auth.uid() AND pc.user2_id = budgets.user_id)
        OR
        (pc.user2_id = auth.uid() AND pc.user1_id = budgets.user_id)
      )
    )
  );
