-- Allow partners to edit and delete each other's budgets
-- Partners should have full CRUD access to shared budgets

-- Add UPDATE policy for partner budgets
CREATE POLICY "Users can update partner budgets"
  ON budgets FOR UPDATE
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
  )
  WITH CHECK (
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

-- Add DELETE policy for partner budgets
CREATE POLICY "Users can delete partner budgets"
  ON budgets FOR DELETE
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

-- Also allow partners to modify budget_items
CREATE POLICY "Users can insert partner budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
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

CREATE POLICY "Users can update partner budget items"
  ON budget_items FOR UPDATE
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
  )
  WITH CHECK (
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

CREATE POLICY "Users can delete partner budget items"
  ON budget_items FOR DELETE
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
