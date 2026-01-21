-- Migration: CCM Invoices table
-- Stores actual invoice amounts from credit card statements per period

-- Create the ccm_invoices table
CREATE TABLE IF NOT EXISTS ccm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  actual_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint per user per period
  UNIQUE(user_id, period)
);

-- Create indexes
CREATE INDEX idx_ccm_invoices_user_id ON ccm_invoices(user_id);
CREATE INDEX idx_ccm_invoices_period ON ccm_invoices(period);

-- Enable RLS
ALTER TABLE ccm_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own invoices
CREATE POLICY "Users can view own ccm_invoices"
  ON ccm_invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own invoices
CREATE POLICY "Users can insert own ccm_invoices"
  ON ccm_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own invoices
CREATE POLICY "Users can update own ccm_invoices"
  ON ccm_invoices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own invoices
CREATE POLICY "Users can delete own ccm_invoices"
  ON ccm_invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Partner access - partners can view each other's CCM invoices
CREATE POLICY "Partners can view each other's ccm_invoices"
  ON ccm_invoices FOR SELECT
  USING (
    user_id = get_partner_id(auth.uid())
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ccm_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ccm_invoices_updated_at
  BEFORE UPDATE ON ccm_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_ccm_invoices_updated_at();
