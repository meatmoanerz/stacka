-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_interest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view partner profile" ON profiles
  FOR SELECT USING (id = get_partner_id(auth.uid()));

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Partner connections policies
CREATE POLICY "Users can view own connections" ON partner_connections
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create connections" ON partner_connections
  FOR INSERT WITH CHECK (initiated_by = auth.uid());

CREATE POLICY "Users can update own connections" ON partner_connections
  FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can delete own connections" ON partner_connections
  FOR DELETE USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Categories policies
CREATE POLICY "Users can view own and shared categories" ON categories
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id = get_partner_id(auth.uid())
    OR shared_with = auth.uid()
  );

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (user_id = auth.uid());

-- Incomes policies
CREATE POLICY "Users can view own incomes" ON incomes
  FOR SELECT USING (user_id = auth.uid() OR user_id = get_partner_id(auth.uid()));

CREATE POLICY "Users can insert own incomes" ON incomes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own incomes" ON incomes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own incomes" ON incomes
  FOR DELETE USING (user_id = auth.uid());

-- Budgets policies
CREATE POLICY "Users can view own and partner budgets" ON budgets
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id = get_partner_id(auth.uid())
  );

CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (user_id = auth.uid());

-- Budget items policies
CREATE POLICY "Users can view budget items" ON budget_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM budgets 
      WHERE budgets.id = budget_items.budget_id 
      AND (budgets.user_id = auth.uid() OR budgets.user_id = get_partner_id(auth.uid()))
    )
  );

CREATE POLICY "Users can manage budget items" ON budget_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM budgets 
      WHERE budgets.id = budget_items.budget_id 
      AND budgets.user_id = auth.uid()
    )
  );

-- Budget item assignments policies
CREATE POLICY "Users can view assignments" ON budget_item_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM budget_items bi
      JOIN budgets b ON b.id = bi.budget_id
      WHERE bi.id = budget_item_assignments.budget_item_id
      AND (b.user_id = auth.uid() OR b.user_id = get_partner_id(auth.uid()))
    )
  );

CREATE POLICY "Users can manage own assignments" ON budget_item_assignments
  FOR ALL USING (user_id = auth.uid());

-- Expenses policies
CREATE POLICY "Users can view own and partner expenses" ON expenses
  FOR SELECT USING (
    user_id = auth.uid() 
    OR user_id = get_partner_id(auth.uid())
  );

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (user_id = auth.uid());

-- Recurring expenses policies
CREATE POLICY "Users can view own recurring expenses" ON recurring_expenses
  FOR SELECT USING (user_id = auth.uid() OR user_id = get_partner_id(auth.uid()));

CREATE POLICY "Users can insert own recurring expenses" ON recurring_expenses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recurring expenses" ON recurring_expenses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recurring expenses" ON recurring_expenses
  FOR DELETE USING (user_id = auth.uid());

-- Loan groups policies
CREATE POLICY "Users can view own loan groups" ON loan_groups
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own loan groups" ON loan_groups
  FOR ALL USING (user_id = auth.uid());

-- Loans policies
CREATE POLICY "Users can view own loans" ON loans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own loans" ON loans
  FOR ALL USING (user_id = auth.uid());

-- Loan interest history policies
CREATE POLICY "Users can view own loan history" ON loan_interest_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loans 
      WHERE loans.id = loan_interest_history.loan_id 
      AND loans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own loan history" ON loan_interest_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM loans 
      WHERE loans.id = loan_interest_history.loan_id 
      AND loans.user_id = auth.uid()
    )
  );

-- Savings goals policies
CREATE POLICY "Users can view own and shared savings goals" ON savings_goals
  FOR SELECT USING (
    user_id = auth.uid() 
    OR partner_id = auth.uid()
    OR user_id = get_partner_id(auth.uid())
  );

CREATE POLICY "Users can insert own savings goals" ON savings_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own savings goals" ON savings_goals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own savings goals" ON savings_goals
  FOR DELETE USING (user_id = auth.uid());

-- Statement analyses policies
CREATE POLICY "Users can view own analyses" ON statement_analyses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own analyses" ON statement_analyses
  FOR ALL USING (user_id = auth.uid());

-- Statement transactions policies
CREATE POLICY "Users can view own transactions" ON statement_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM statement_analyses 
      WHERE statement_analyses.id = statement_transactions.analysis_id 
      AND statement_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own transactions" ON statement_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM statement_analyses 
      WHERE statement_analyses.id = statement_transactions.analysis_id 
      AND statement_analyses.user_id = auth.uid()
    )
  );

