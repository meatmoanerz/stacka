-- Add group purchase fields to expenses table
-- This supports the CCM "Gruppköp" feature where a user pays a full bill
-- (e.g., restaurant check) with their credit card but only owns a portion,
-- with others reimbursing via Swish.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS is_group_purchase BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS group_purchase_total DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS group_purchase_user_share DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS group_purchase_partner_share DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS group_purchase_swish_amount DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS group_purchase_swish_recipient TEXT NULL
    CHECK (group_purchase_swish_recipient IN ('user', 'partner', 'shared'));

COMMENT ON COLUMN expenses.is_group_purchase IS 'Flag indicating this is a group purchase (user paid full amount, received Swish back)';
COMMENT ON COLUMN expenses.group_purchase_total IS 'Total amount paid on credit card';
COMMENT ON COLUMN expenses.group_purchase_user_share IS 'User actual share of the expense';
COMMENT ON COLUMN expenses.group_purchase_partner_share IS 'Partner actual share of the expense';
COMMENT ON COLUMN expenses.group_purchase_swish_amount IS 'Amount received back via Swish (total - user_share - partner_share)';
COMMENT ON COLUMN expenses.group_purchase_swish_recipient IS 'Who received the Swish payments: user, partner, or shared (50/50)';
