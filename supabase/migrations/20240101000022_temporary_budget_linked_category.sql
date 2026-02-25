-- Add linked_category_id to temporary_budgets for monthly budget category allocation
ALTER TABLE temporary_budgets
  ADD COLUMN IF NOT EXISTS linked_category_id UUID REFERENCES categories(id);
