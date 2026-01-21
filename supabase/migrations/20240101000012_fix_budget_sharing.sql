-- Fix budget sharing to include all budgets, not just those created after connection
-- Partners should be able to see all each other's budgets when connected

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view partner budgets" ON budgets;

-- Create new policy without time restriction
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
    )
  );

-- Also need to ensure budget_items can be viewed through partner budgets
DROP POLICY IF EXISTS "Users can view budget items" ON budget_items;

CREATE POLICY "Users can view own budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.id = budget_items.budget_id
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view partner budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.id = budget_items.budget_id
      AND EXISTS (
        SELECT 1 FROM partner_connections pc
        WHERE pc.status = 'active'
        AND (
          (pc.user1_id = auth.uid() AND pc.user2_id = b.user_id)
          OR
          (pc.user2_id = auth.uid() AND pc.user1_id = b.user_id)
        )
      )
    )
  );
