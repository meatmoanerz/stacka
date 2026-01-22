-- Savings Goal Contributions and Custom Goal Types
-- This migration adds support for:
-- 1. Tracking individual contributions (expenses) to savings goals
-- 2. Custom user-defined goal category types
-- 3. Linking categories to savings goals for auto-created categories

-- Add linked_savings_goal_id to categories table
-- This allows us to link an auto-created category back to its savings goal
ALTER TABLE categories ADD COLUMN IF NOT EXISTS linked_savings_goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_categories_linked_savings_goal ON categories(linked_savings_goal_id);

-- Create custom goal types table for user-defined goal types
CREATE TABLE IF NOT EXISTS custom_goal_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#657166',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create index for custom goal types
CREATE INDEX IF NOT EXISTS idx_custom_goal_types_user ON custom_goal_types(user_id);

-- Create savings goal contributions table
-- This tracks individual expense contributions to savings goals
CREATE TABLE IF NOT EXISTS savings_goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  savings_goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  user1_amount DECIMAL(12,2) DEFAULT 0,
  user2_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id) -- One expense can only contribute to one savings goal
);

-- Create indexes for contributions
CREATE INDEX IF NOT EXISTS idx_savings_goal_contributions_goal ON savings_goal_contributions(savings_goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_goal_contributions_expense ON savings_goal_contributions(expense_id);
CREATE INDEX IF NOT EXISTS idx_savings_goal_contributions_user ON savings_goal_contributions(user_id);

-- Add custom_goal_type_id to savings_goals table for custom types
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS custom_goal_type_id UUID REFERENCES custom_goal_types(id) ON DELETE SET NULL;

-- RLS Policies for custom_goal_types
ALTER TABLE custom_goal_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom goal types" ON custom_goal_types
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own custom goal types" ON custom_goal_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom goal types" ON custom_goal_types
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom goal types" ON custom_goal_types
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for savings_goal_contributions
ALTER TABLE savings_goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contributions" ON savings_goal_contributions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM savings_goals WHERE id = savings_goal_contributions.savings_goal_id
  ) OR auth.uid() IN (
    SELECT partner_id FROM savings_goals WHERE id = savings_goal_contributions.savings_goal_id AND partner_id IS NOT NULL
  ));

CREATE POLICY "Users can create contributions" ON savings_goal_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contributions" ON savings_goal_contributions
  FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-update savings goal totals when contribution is added
CREATE OR REPLACE FUNCTION update_savings_goal_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE savings_goals
    SET
      starting_balance = starting_balance + NEW.amount,
      starting_balance_user1 = starting_balance_user1 + NEW.user1_amount,
      starting_balance_user2 = starting_balance_user2 + NEW.user2_amount,
      updated_at = NOW()
    WHERE id = NEW.savings_goal_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE savings_goals
    SET
      starting_balance = starting_balance - OLD.amount,
      starting_balance_user1 = starting_balance_user1 - OLD.user1_amount,
      starting_balance_user2 = starting_balance_user2 - OLD.user2_amount,
      updated_at = NOW()
    WHERE id = OLD.savings_goal_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-updating savings goal totals
DROP TRIGGER IF EXISTS update_savings_goal_on_contribution_trigger ON savings_goal_contributions;
CREATE TRIGGER update_savings_goal_on_contribution_trigger
  AFTER INSERT OR DELETE ON savings_goal_contributions
  FOR EACH ROW EXECUTE FUNCTION update_savings_goal_on_contribution();

-- Function to get contributions for a savings goal
CREATE OR REPLACE FUNCTION get_savings_goal_contributions(goal_id UUID)
RETURNS TABLE (
  id UUID,
  expense_id UUID,
  amount DECIMAL,
  user1_amount DECIMAL,
  user2_amount DECIMAL,
  description TEXT,
  expense_date DATE,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sgc.id,
    sgc.expense_id,
    sgc.amount,
    sgc.user1_amount,
    sgc.user2_amount,
    e.description,
    e.date as expense_date,
    sgc.created_at
  FROM savings_goal_contributions sgc
  JOIN expenses e ON e.id = sgc.expense_id
  WHERE sgc.savings_goal_id = goal_id
  ORDER BY sgc.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;
