-- Allow expenses without a category (for project-only tracking)
ALTER TABLE expenses ALTER COLUMN category_id DROP NOT NULL;
