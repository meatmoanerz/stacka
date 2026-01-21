-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE cost_type AS ENUM ('Fixed', 'Variable', 'Savings');
CREATE TYPE subcategory_type AS ENUM ('Home', 'Housing', 'Transport', 'Entertainment', 'Loans', 'Savings', 'Other');
CREATE TYPE budget_item_type AS ENUM ('income', 'fixedExpense', 'variableExpense', 'savings');
CREATE TYPE cost_assignment AS ENUM ('shared', 'personal', 'partner');
CREATE TYPE goal_category AS ENUM ('emergency', 'vacation', 'home', 'car', 'education', 'retirement', 'other');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE connection_status AS ENUM ('pending', 'active', 'rejected', 'revoked');
CREATE TYPE analysis_status AS ENUM ('processing', 'completed', 'failed');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  salary_day INTEGER DEFAULT 25 CHECK (salary_day >= 1 AND salary_day <= 31),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  currency TEXT DEFAULT 'SEK',
  language TEXT DEFAULT 'sv',
  theme TEXT DEFAULT 'light',
  ccm_enabled BOOLEAN DEFAULT FALSE,
  ccm_invoice_break_date INTEGER DEFAULT 1 CHECK (ccm_invoice_break_date >= 1 AND ccm_invoice_break_date <= 31),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner connections
CREATE TABLE partner_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending',
  initiated_by UUID NOT NULL REFERENCES profiles(id),
  invite_code TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost_type cost_type NOT NULL,
  subcategory subcategory_type NOT NULL,
  default_value DECIMAL(12,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_shared_expense BOOLEAN DEFAULT FALSE,
  shared_with UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Incomes
CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES profiles(id),
  period TEXT NOT NULL, -- YYYY-MM format
  version TEXT DEFAULT '2.0',
  total_income DECIMAL(12,2) DEFAULT 0,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  total_cashflow_expenses DECIMAL(12,2) DEFAULT 0,
  total_ccm_expenses DECIMAL(12,2) DEFAULT 0,
  total_savings DECIMAL(12,2) DEFAULT 0,
  net_balance DECIMAL(12,2) DEFAULT 0,
  savings_ratio DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period)
);

-- Budget items
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  type budget_item_type NOT NULL,
  amount DECIMAL(12,2) DEFAULT 0,
  is_ccm BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget item assignments (for partner splitting)
CREATE TABLE budget_item_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id UUID NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(12,2) DEFAULT 0
);

-- Recurring expenses (need to create before expenses)
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  day_of_month INTEGER DEFAULT 1 CHECK (day_of_month >= 1 AND day_of_month <= 31),
  cost_assignment cost_assignment DEFAULT 'shared',
  assigned_to UUID REFERENCES profiles(id),
  is_ccm BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost_assignment cost_assignment DEFAULT 'personal',
  assigned_to UUID REFERENCES profiles(id),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_expense_id UUID REFERENCES recurring_expenses(id),
  is_ccm BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loan groups
CREATE TABLE loan_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#657166',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loans
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES loan_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  original_amount DECIMAL(14,2) NOT NULL CHECK (original_amount >= 0),
  current_balance DECIMAL(14,2) NOT NULL CHECK (current_balance >= 0),
  interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0),
  monthly_amortization DECIMAL(12,2) DEFAULT 0,
  last_amortization_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loan interest history
CREATE TABLE loan_interest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  rate DECIMAL(5,2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings goals
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  partner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(14,2),
  target_date DATE,
  starting_balance DECIMAL(14,2) DEFAULT 0,
  starting_balance_user1 DECIMAL(14,2) DEFAULT 0,
  starting_balance_user2 DECIMAL(14,2) DEFAULT 0,
  monthly_savings_enabled BOOLEAN DEFAULT FALSE,
  monthly_savings_amount DECIMAL(12,2) DEFAULT 0,
  recurring_expense_id UUID REFERENCES recurring_expenses(id),
  goal_category goal_category DEFAULT 'other',
  status goal_status DEFAULT 'active',
  is_shared BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Statement analyses
CREATE TABLE statement_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  bank_name TEXT,
  transaction_count INTEGER DEFAULT 0,
  status analysis_status DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Statement transactions
CREATE TABLE statement_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES statement_analyses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  suggested_category_id UUID REFERENCES categories(id),
  confirmed_category_id UUID REFERENCES categories(id),
  is_expense BOOLEAN DEFAULT TRUE,
  is_saved BOOLEAN DEFAULT FALSE,
  expense_id UUID REFERENCES expenses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_categories_cost_type ON categories(cost_type);
CREATE INDEX idx_incomes_user ON incomes(user_id);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, period);
CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_recurring_user ON recurring_expenses(user_id);
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_group ON loans(group_id);
CREATE INDEX idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX idx_savings_goals_status ON savings_goals(status);
CREATE INDEX idx_statement_analyses_user ON statement_analyses(user_id);
CREATE INDEX idx_statement_transactions_analysis ON statement_transactions(analysis_id);

-- Helper function to get partner
CREATE OR REPLACE FUNCTION get_partner_id(user_id UUID)
RETURNS UUID AS $$
  SELECT CASE 
    WHEN user1_id = user_id THEN user2_id 
    ELSE user1_id 
  END
  FROM partner_connections 
  WHERE (user1_id = user_id OR user2_id = user_id) 
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON incomes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_recurring_expenses_updated_at BEFORE UPDATE ON recurring_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_loan_groups_updated_at BEFORE UPDATE ON loan_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Fixed expenses
  INSERT INTO categories (user_id, name, cost_type, subcategory, is_default) VALUES
    (NEW.id, 'A-Kassa', 'Fixed', 'Home', true),
    (NEW.id, 'Avgift', 'Fixed', 'Housing', true),
    (NEW.id, 'El', 'Fixed', 'Home', true),
    (NEW.id, 'Hemförsäkring', 'Fixed', 'Home', true),
    (NEW.id, 'Bilkostnader', 'Fixed', 'Housing', true),
    (NEW.id, 'Prenumerationer', 'Fixed', 'Home', true),
    (NEW.id, 'Ränta bolån', 'Fixed', 'Loans', true),
    (NEW.id, 'Övrig försäkring', 'Fixed', 'Home', true),
    (NEW.id, 'Övrigt Fast', 'Fixed', 'Other', true);
  
  -- Variable expenses
  INSERT INTO categories (user_id, name, cost_type, subcategory, is_default) VALUES
    (NEW.id, 'Mat', 'Variable', 'Home', true),
    (NEW.id, 'Hem', 'Variable', 'Home', true),
    (NEW.id, 'Kläder', 'Variable', 'Home', true),
    (NEW.id, 'Kollektivtrafik', 'Variable', 'Transport', true),
    (NEW.id, 'Drivmedel bil', 'Variable', 'Transport', true),
    (NEW.id, 'Nöje', 'Variable', 'Entertainment', true),
    (NEW.id, 'Restaurang', 'Variable', 'Entertainment', true),
    (NEW.id, 'Resor', 'Variable', 'Entertainment', true),
    (NEW.id, 'CSN', 'Variable', 'Other', true),
    (NEW.id, 'Övriga lån', 'Variable', 'Loans', true),
    (NEW.id, 'Kreditkort', 'Variable', 'Other', true),
    (NEW.id, 'Övrigt Rörligt', 'Variable', 'Other', true);
  
  -- Savings
  INSERT INTO categories (user_id, name, cost_type, subcategory, is_default) VALUES
    (NEW.id, 'Amortering', 'Savings', 'Savings', true),
    (NEW.id, 'Buffert', 'Savings', 'Savings', true),
    (NEW.id, 'Boendespar', 'Savings', 'Savings', true),
    (NEW.id, 'Resespar', 'Savings', 'Savings', true),
    (NEW.id, 'Aktier/Fonder', 'Savings', 'Savings', true),
    (NEW.id, 'Övrigt sparande', 'Savings', 'Savings', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

