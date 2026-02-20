-- Household Categories: tracks which categories count as "household costs" for the report
CREATE TABLE IF NOT EXISTS household_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- RLS policies
ALTER TABLE household_categories ENABLE ROW LEVEL SECURITY;

-- Users can manage their own household categories
CREATE POLICY "household_categories_select_own"
  ON household_categories FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "household_categories_insert_own"
  ON household_categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "household_categories_delete_own"
  ON household_categories FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Partners can read each other's household categories
CREATE POLICY "household_categories_select_partner"
  ON household_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = household_categories.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = household_categories.user_id)
      )
    )
  );
