-- =============================================
-- RLS Performance Optimization Migration
-- =============================================
-- Fixes two Supabase Database Linter warnings:
--
-- 1. Auth RLS InitPlan (103 warnings):
--    Wraps auth.uid() in (SELECT auth.uid()) so it evaluates ONCE per query
--    instead of once per row. Major performance improvement on large tables.
--
-- 2. Multiple Permissive Policies (73 warnings):
--    Consolidates duplicate SELECT/INSERT/UPDATE/DELETE policies into
--    single unified policies per action per table. Reduces redundant
--    policy evaluation overhead.
--
-- This migration drops ALL existing RLS policies and recreates them
-- cleanly to ensure no duplicates remain from naming mismatches in
-- previous migrations.
-- =============================================

BEGIN;

-- =============================================
-- 1. PROFILES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete own profile" ON profiles;
DROP POLICY IF EXISTS "Allow service_role full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read partner profile" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users with own id" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users on own profile" ON profiles;

-- Consolidated SELECT: own profile + partner profile in one policy
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = id)
      )
    )
  );

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "profiles_service_role"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 2. PARTNER_CONNECTIONS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "partner_connections_select" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_insert" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_update" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_delete" ON partner_connections;
DROP POLICY IF EXISTS "Allow authenticated to manage own partner_connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can view own connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can lookup pending invites by code" ON partner_connections;
DROP POLICY IF EXISTS "Users can create connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can update own connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can read own connections" ON partner_connections;
DROP POLICY IF EXISTS "Anyone can read pending invites" ON partner_connections;
DROP POLICY IF EXISTS "Users can create invites" ON partner_connections;
DROP POLICY IF EXISTS "Users can delete own invites" ON partner_connections;

-- Consolidated SELECT: own connections + pending invite lookup
CREATE POLICY "partner_connections_select"
  ON partner_connections FOR SELECT
  TO authenticated
  USING (
    user1_id = (SELECT auth.uid())
    OR user2_id = (SELECT auth.uid())
    OR initiated_by = (SELECT auth.uid())
    OR (status = 'pending' AND invite_code IS NOT NULL AND expires_at > now())
  );

CREATE POLICY "partner_connections_insert"
  ON partner_connections FOR INSERT
  TO authenticated
  WITH CHECK (initiated_by = (SELECT auth.uid()));

CREATE POLICY "partner_connections_update"
  ON partner_connections FOR UPDATE
  TO authenticated
  USING (
    user1_id = (SELECT auth.uid())
    OR user2_id = (SELECT auth.uid())
    OR initiated_by = (SELECT auth.uid())
  );

CREATE POLICY "partner_connections_delete"
  ON partner_connections FOR DELETE
  TO authenticated
  USING (initiated_by = (SELECT auth.uid()));

-- =============================================
-- 3. CATEGORIES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "categories_select_own" ON categories;
DROP POLICY IF EXISTS "categories_insert_own" ON categories;
DROP POLICY IF EXISTS "categories_update_own" ON categories;
DROP POLICY IF EXISTS "categories_delete_own" ON categories;
DROP POLICY IF EXISTS "Allow authenticated to read own categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated to insert own categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated to update own categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated to delete own categories" ON categories;
DROP POLICY IF EXISTS "Allow service_role full access on categories" ON categories;
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can view partner categories" ON categories;
DROP POLICY IF EXISTS "Users can view partner custom categories" ON categories;
DROP POLICY IF EXISTS "Users can create own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Users can view own and shared categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;

-- Consolidated SELECT: own categories + partner custom (non-default) categories
CREATE POLICY "categories_select"
  ON categories FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (
      is_default = false
      AND EXISTS (
        SELECT 1 FROM partner_connections pc
        WHERE pc.status = 'active'
        AND (
          (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = categories.user_id)
          OR
          (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = categories.user_id)
        )
      )
    )
  );

CREATE POLICY "categories_insert"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "categories_update"
  ON categories FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "categories_delete"
  ON categories FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "categories_service_role"
  ON categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 4. INCOMES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "incomes_select_own" ON incomes;
DROP POLICY IF EXISTS "incomes_insert_own" ON incomes;
DROP POLICY IF EXISTS "incomes_update_own" ON incomes;
DROP POLICY IF EXISTS "incomes_delete_own" ON incomes;
DROP POLICY IF EXISTS "Allow authenticated to read own incomes" ON incomes;
DROP POLICY IF EXISTS "Allow authenticated to insert own incomes" ON incomes;
DROP POLICY IF EXISTS "Allow authenticated to update own incomes" ON incomes;
DROP POLICY IF EXISTS "Allow authenticated to delete own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can view own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can view partner incomes" ON incomes;
DROP POLICY IF EXISTS "Users can create own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete own incomes" ON incomes;

-- Incomes: own only (partner income accessed via SECURITY DEFINER functions)
CREATE POLICY "incomes_select"
  ON incomes FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "incomes_insert"
  ON incomes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "incomes_update"
  ON incomes FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "incomes_delete"
  ON incomes FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- =============================================
-- 5. BUDGETS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "budgets_select_own" ON budgets;
DROP POLICY IF EXISTS "budgets_insert_own" ON budgets;
DROP POLICY IF EXISTS "budgets_update_own" ON budgets;
DROP POLICY IF EXISTS "budgets_delete_own" ON budgets;
DROP POLICY IF EXISTS "Allow authenticated to read own budgets" ON budgets;
DROP POLICY IF EXISTS "Allow authenticated to insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Allow authenticated to update own budgets" ON budgets;
DROP POLICY IF EXISTS "Allow authenticated to delete own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view partner budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view own and partner budgets" ON budgets;
DROP POLICY IF EXISTS "Users can create own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update partner budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete partner budgets" ON budgets;

-- Consolidated SELECT: own + partner budgets
CREATE POLICY "budgets_select"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = budgets.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = budgets.user_id)
      )
    )
  );

CREATE POLICY "budgets_insert"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Consolidated UPDATE: own + partner budgets
CREATE POLICY "budgets_update"
  ON budgets FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = budgets.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = budgets.user_id)
      )
    )
  );

-- Consolidated DELETE: own + partner budgets
CREATE POLICY "budgets_delete"
  ON budgets FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = budgets.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = budgets.user_id)
      )
    )
  );

-- =============================================
-- 6. BUDGET_ITEMS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated to manage budget_items" ON budget_items;
DROP POLICY IF EXISTS "Users can manage budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can view budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can view own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can view partner budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert partner budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update partner budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can delete partner budget items" ON budget_items;

-- Consolidated SELECT: own + partner budget items (through budgets join)
CREATE POLICY "budget_items_select"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.id = budget_items.budget_id
      AND (
        b.user_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM partner_connections pc
          WHERE pc.status = 'active'
          AND (
            (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = b.user_id)
            OR
            (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = b.user_id)
          )
        )
      )
    )
  );

-- Consolidated INSERT: own + partner budget items
CREATE POLICY "budget_items_insert"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.id = budget_items.budget_id
      AND (
        b.user_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM partner_connections pc
          WHERE pc.status = 'active'
          AND (
            (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = b.user_id)
            OR
            (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = b.user_id)
          )
        )
      )
    )
  );

-- Consolidated UPDATE: own + partner budget items
CREATE POLICY "budget_items_update"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.id = budget_items.budget_id
      AND (
        b.user_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM partner_connections pc
          WHERE pc.status = 'active'
          AND (
            (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = b.user_id)
            OR
            (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = b.user_id)
          )
        )
      )
    )
  );

-- Consolidated DELETE: own + partner budget items
CREATE POLICY "budget_items_delete"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.id = budget_items.budget_id
      AND (
        b.user_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM partner_connections pc
          WHERE pc.status = 'active'
          AND (
            (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = b.user_id)
            OR
            (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = b.user_id)
          )
        )
      )
    )
  );

-- =============================================
-- 7. BUDGET_ITEM_ASSIGNMENTS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view assignments" ON budget_item_assignments;
DROP POLICY IF EXISTS "Users can manage own assignments" ON budget_item_assignments;

-- SELECT: through budget_items -> budgets (own + partner)
CREATE POLICY "budget_item_assignments_select"
  ON budget_item_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN budgets b ON b.id = bi.budget_id
      WHERE bi.id = budget_item_assignments.budget_item_id
      AND (
        b.user_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM partner_connections pc
          WHERE pc.status = 'active'
          AND (
            (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = b.user_id)
            OR
            (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = b.user_id)
          )
        )
      )
    )
  );

-- ALL: users manage own assignments
CREATE POLICY "budget_item_assignments_manage"
  ON budget_item_assignments FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================
-- 8. EXPENSES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "expenses_select_own" ON expenses;
DROP POLICY IF EXISTS "expenses_insert_own" ON expenses;
DROP POLICY IF EXISTS "expenses_update_own" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_own" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated to read own expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated to insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated to update own expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated to delete own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view partner expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view own and partner expenses" ON expenses;

-- Consolidated SELECT: own + partner expenses (partner limited to post-connection)
CREATE POLICY "expenses_select"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = expenses.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = expenses.user_id)
      )
      AND expenses.created_at >= pc.created_at
    )
  );

CREATE POLICY "expenses_insert"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "expenses_update"
  ON expenses FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "expenses_delete"
  ON expenses FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- =============================================
-- 9. RECURRING_EXPENSES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated to manage recurring_expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "Users can view own recurring expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "Users can insert own recurring expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "Users can update own recurring expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "Users can delete own recurring expenses" ON recurring_expenses;

CREATE POLICY "recurring_expenses_manage"
  ON recurring_expenses FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================
-- 10. LOAN_GROUPS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated to manage loan_groups" ON loan_groups;
DROP POLICY IF EXISTS "Users can view own loan groups" ON loan_groups;
DROP POLICY IF EXISTS "Users can manage own loan groups" ON loan_groups;

CREATE POLICY "loan_groups_manage"
  ON loan_groups FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================
-- 11. LOANS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated to manage loans" ON loans;
DROP POLICY IF EXISTS "Users can view own loans" ON loans;
DROP POLICY IF EXISTS "Users can manage own loans" ON loans;

CREATE POLICY "loans_manage"
  ON loans FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================
-- 12. LOAN_INTEREST_HISTORY
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own loan history" ON loan_interest_history;
DROP POLICY IF EXISTS "Users can manage own loan history" ON loan_interest_history;

-- Consolidated: single ALL policy through loans join
CREATE POLICY "loan_interest_history_manage"
  ON loan_interest_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_interest_history.loan_id
      AND loans.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_interest_history.loan_id
      AND loans.user_id = (SELECT auth.uid())
    )
  );

-- =============================================
-- 13. SAVINGS_GOALS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "savings_goals_select_own" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals_insert_own" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals_update_own" ON savings_goals;
DROP POLICY IF EXISTS "savings_goals_delete_own" ON savings_goals;
DROP POLICY IF EXISTS "Allow authenticated to read own savings_goals" ON savings_goals;
DROP POLICY IF EXISTS "Allow authenticated to insert own savings_goals" ON savings_goals;
DROP POLICY IF EXISTS "Allow authenticated to update own savings_goals" ON savings_goals;
DROP POLICY IF EXISTS "Allow authenticated to delete own savings_goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can view own and shared savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can insert own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can update own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can delete own savings goals" ON savings_goals;

-- Consolidated SELECT: own + partner_id + partner via connection
CREATE POLICY "savings_goals_select"
  ON savings_goals FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR partner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = savings_goals.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = savings_goals.user_id)
      )
    )
  );

CREATE POLICY "savings_goals_insert"
  ON savings_goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "savings_goals_update"
  ON savings_goals FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "savings_goals_delete"
  ON savings_goals FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- =============================================
-- 14. STATEMENT_ANALYSES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated to manage statement_analyses" ON statement_analyses;
DROP POLICY IF EXISTS "Users can view own analyses" ON statement_analyses;
DROP POLICY IF EXISTS "Users can manage own analyses" ON statement_analyses;

CREATE POLICY "statement_analyses_manage"
  ON statement_analyses FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================
-- 15. STATEMENT_TRANSACTIONS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own transactions" ON statement_transactions;
DROP POLICY IF EXISTS "Users can manage own transactions" ON statement_transactions;

-- Consolidated: single ALL policy through analyses join
CREATE POLICY "statement_transactions_manage"
  ON statement_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM statement_analyses
      WHERE statement_analyses.id = statement_transactions.analysis_id
      AND statement_analyses.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM statement_analyses
      WHERE statement_analyses.id = statement_transactions.analysis_id
      AND statement_analyses.user_id = (SELECT auth.uid())
    )
  );

-- =============================================
-- 16. CCM_INVOICES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own ccm_invoices" ON ccm_invoices;
DROP POLICY IF EXISTS "Users can insert own ccm_invoices" ON ccm_invoices;
DROP POLICY IF EXISTS "Users can update own ccm_invoices" ON ccm_invoices;
DROP POLICY IF EXISTS "Users can delete own ccm_invoices" ON ccm_invoices;
DROP POLICY IF EXISTS "Partners can view each other's ccm_invoices" ON ccm_invoices;

-- Consolidated SELECT: own + partner invoices (using EXISTS instead of get_partner_id)
CREATE POLICY "ccm_invoices_select"
  ON ccm_invoices FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = (SELECT auth.uid()) AND pc.user2_id = ccm_invoices.user_id)
        OR
        (pc.user2_id = (SELECT auth.uid()) AND pc.user1_id = ccm_invoices.user_id)
      )
    )
  );

CREATE POLICY "ccm_invoices_insert"
  ON ccm_invoices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "ccm_invoices_update"
  ON ccm_invoices FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "ccm_invoices_delete"
  ON ccm_invoices FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- =============================================
-- 17. CUSTOM_GOAL_TYPES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own custom goal types" ON custom_goal_types;
DROP POLICY IF EXISTS "Users can create own custom goal types" ON custom_goal_types;
DROP POLICY IF EXISTS "Users can update own custom goal types" ON custom_goal_types;
DROP POLICY IF EXISTS "Users can delete own custom goal types" ON custom_goal_types;

CREATE POLICY "custom_goal_types_manage"
  ON custom_goal_types FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================
-- 18. SAVINGS_GOAL_CONTRIBUTIONS
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own contributions" ON savings_goal_contributions;
DROP POLICY IF EXISTS "Users can create contributions" ON savings_goal_contributions;
DROP POLICY IF EXISTS "Users can delete own contributions" ON savings_goal_contributions;

-- Consolidated SELECT: own + goal owner + goal partner
CREATE POLICY "savings_goal_contributions_select"
  ON savings_goal_contributions FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM savings_goals sg
      WHERE sg.id = savings_goal_contributions.savings_goal_id
      AND (
        sg.user_id = (SELECT auth.uid())
        OR sg.partner_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "savings_goal_contributions_insert"
  ON savings_goal_contributions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "savings_goal_contributions_delete"
  ON savings_goal_contributions FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- =============================================
-- 19. MONTHLY_INCOMES
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own monthly incomes" ON monthly_incomes;
DROP POLICY IF EXISTS "Users can view partner monthly incomes" ON monthly_incomes;
DROP POLICY IF EXISTS "Users can insert own monthly incomes" ON monthly_incomes;
DROP POLICY IF EXISTS "Users can update own monthly incomes" ON monthly_incomes;
DROP POLICY IF EXISTS "Users can delete own monthly incomes" ON monthly_incomes;

-- Consolidated SELECT: own + partner (using EXISTS instead of get_partner_id)
CREATE POLICY "monthly_incomes_select"
  ON monthly_incomes FOR SELECT
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

CREATE POLICY "monthly_incomes_insert"
  ON monthly_incomes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "monthly_incomes_update"
  ON monthly_incomes FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "monthly_incomes_delete"
  ON monthly_incomes FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMIT;
