-- Temporary Budgets (Project Budgets): time-limited budgets for specific projects
-- Examples: trips, renovations, events

-- Create temporary_budget_status enum
DO $$ BEGIN
  CREATE TYPE temporary_budget_status AS ENUM ('active', 'completed', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Main table for project budgets
CREATE TABLE IF NOT EXISTS temporary_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  total_budget NUMERIC NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SEK',
  exchange_rate NUMERIC NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  linked_budget_period TEXT,
  status temporary_budget_status NOT NULL DEFAULT 'active',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories within a project budget
CREATE TABLE IF NOT EXISTS temporary_budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temporary_budget_id UUID NOT NULL REFERENCES temporary_budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project budget columns to expenses
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS temporary_budget_id UUID REFERENCES temporary_budgets(id),
  ADD COLUMN IF NOT EXISTS temporary_budget_category_id UUID REFERENCES temporary_budget_categories(id),
  ADD COLUMN IF NOT EXISTS original_currency TEXT,
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC;

-- Add is_archived to monthly budgets for archive feature
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- RLS Policies for temporary_budgets
-- ============================================================
ALTER TABLE temporary_budgets ENABLE ROW LEVEL SECURITY;

-- Users can read their own project budgets
CREATE POLICY "temporary_budgets_select_own"
  ON temporary_budgets FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users can insert their own project budgets
CREATE POLICY "temporary_budgets_insert_own"
  ON temporary_budgets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own project budgets
CREATE POLICY "temporary_budgets_update_own"
  ON temporary_budgets FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users can delete their own project budgets
CREATE POLICY "temporary_budgets_delete_own"
  ON temporary_budgets FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Partners can read shared project budgets
CREATE POLICY "temporary_budgets_select_partner"
  ON temporary_budgets FOR SELECT
  TO authenticated
  USING (
    is_shared = true
    AND EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = temporary_budgets.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = temporary_budgets.user_id)
      )
    )
  );

-- Partners can update shared project budgets
CREATE POLICY "temporary_budgets_update_partner"
  ON temporary_budgets FOR UPDATE
  TO authenticated
  USING (
    is_shared = true
    AND EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = temporary_budgets.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = temporary_budgets.user_id)
      )
    )
  );

-- ============================================================
-- RLS Policies for temporary_budget_categories
-- ============================================================
ALTER TABLE temporary_budget_categories ENABLE ROW LEVEL SECURITY;

-- Users can read categories of their own project budgets
CREATE POLICY "temp_budget_categories_select_own"
  ON temporary_budget_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM temporary_budgets tb
      WHERE tb.id = temporary_budget_categories.temporary_budget_id
      AND tb.user_id = (SELECT auth.uid())
    )
  );

-- Users can insert categories into their own project budgets
CREATE POLICY "temp_budget_categories_insert_own"
  ON temporary_budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM temporary_budgets tb
      WHERE tb.id = temporary_budget_categories.temporary_budget_id
      AND tb.user_id = (SELECT auth.uid())
    )
  );

-- Users can update categories of their own project budgets
CREATE POLICY "temp_budget_categories_update_own"
  ON temporary_budget_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM temporary_budgets tb
      WHERE tb.id = temporary_budget_categories.temporary_budget_id
      AND tb.user_id = (SELECT auth.uid())
    )
  );

-- Users can delete categories of their own project budgets
CREATE POLICY "temp_budget_categories_delete_own"
  ON temporary_budget_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM temporary_budgets tb
      WHERE tb.id = temporary_budget_categories.temporary_budget_id
      AND tb.user_id = (SELECT auth.uid())
    )
  );

-- Partners can read categories of shared project budgets
CREATE POLICY "temp_budget_categories_select_partner"
  ON temporary_budget_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM temporary_budgets tb
      WHERE tb.id = temporary_budget_categories.temporary_budget_id
      AND tb.is_shared = true
      AND EXISTS (
        SELECT 1 FROM partner_connections pc
        WHERE pc.status = 'active'
        AND (
          (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = tb.user_id)
          OR
          (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = tb.user_id)
        )
      )
    )
  );

-- Partners can insert categories into shared project budgets
CREATE POLICY "temp_budget_categories_insert_partner"
  ON temporary_budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM temporary_budgets tb
      WHERE tb.id = temporary_budget_categories.temporary_budget_id
      AND tb.is_shared = true
      AND EXISTS (
        SELECT 1 FROM partner_connections pc
        WHERE pc.status = 'active'
        AND (
          (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = tb.user_id)
          OR
          (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = tb.user_id)
        )
      )
    )
  );

-- Partners can update categories of shared project budgets
CREATE POLICY "temp_budget_categories_update_partner"
  ON temporary_budget_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM temporary_budgets tb
      WHERE tb.id = temporary_budget_categories.temporary_budget_id
      AND tb.is_shared = true
      AND EXISTS (
        SELECT 1 FROM partner_connections pc
        WHERE pc.status = 'active'
        AND (
          (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = tb.user_id)
          OR
          (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = tb.user_id)
        )
      )
    )
  );

-- Partners can delete categories of shared project budgets
CREATE POLICY "temp_budget_categories_delete_partner"
  ON temporary_budget_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM temporary_budgets tb
      WHERE tb.id = temporary_budget_categories.temporary_budget_id
      AND tb.is_shared = true
      AND EXISTS (
        SELECT 1 FROM partner_connections pc
        WHERE pc.status = 'active'
        AND (
          (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = tb.user_id)
          OR
          (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = tb.user_id)
        )
      )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_temporary_budgets_user_id ON temporary_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_budgets_status ON temporary_budgets(status);
CREATE INDEX IF NOT EXISTS idx_temporary_budget_categories_budget_id ON temporary_budget_categories(temporary_budget_id);
CREATE INDEX IF NOT EXISTS idx_expenses_temporary_budget_id ON expenses(temporary_budget_id);
CREATE INDEX IF NOT EXISTS idx_expenses_temporary_budget_category_id ON expenses(temporary_budget_category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_is_archived ON budgets(is_archived);
