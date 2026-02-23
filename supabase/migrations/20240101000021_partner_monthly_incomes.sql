-- Migration: Allow partner monthly income management
-- Users can now insert/update/delete monthly incomes for their connected partner.

BEGIN;

-- Drop existing INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "monthly_incomes_insert" ON monthly_incomes;
DROP POLICY IF EXISTS "monthly_incomes_update" ON monthly_incomes;
DROP POLICY IF EXISTS "monthly_incomes_delete" ON monthly_incomes;

-- INSERT: own + partner incomes
CREATE POLICY "monthly_incomes_insert"
  ON monthly_incomes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = monthly_incomes.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = monthly_incomes.user_id)
      )
    )
  );

-- UPDATE: own + partner incomes
CREATE POLICY "monthly_incomes_update"
  ON monthly_incomes FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = monthly_incomes.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = monthly_incomes.user_id)
      )
    )
  );

-- DELETE: own + partner incomes
CREATE POLICY "monthly_incomes_delete"
  ON monthly_incomes FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = monthly_incomes.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = monthly_incomes.user_id)
      )
    )
  );

COMMIT;
