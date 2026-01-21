-- Fix partner_connections RLS to allow looking up invite codes
-- Users need to be able to find pending connections by invite_code to join them

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated to manage own partner_connections" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_select" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_insert" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_update" ON partner_connections;
DROP POLICY IF EXISTS "partner_connections_delete" ON partner_connections;

-- Enable RLS
ALTER TABLE partner_connections ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can see their own connections (where they are user1 or user2)
CREATE POLICY "Users can view own connections"
  ON partner_connections FOR SELECT
  TO authenticated
  USING (
    user1_id = auth.uid() 
    OR user2_id = auth.uid()
    OR initiated_by = auth.uid()
  );

-- Policy 2: Anyone authenticated can look up pending connections by invite code
-- This is needed so users can join via invite code
CREATE POLICY "Users can lookup pending invites by code"
  ON partner_connections FOR SELECT
  TO authenticated
  USING (
    status = 'pending' 
    AND invite_code IS NOT NULL
    AND expires_at > now()
  );

-- Policy 3: Users can create connections (where they initiate)
CREATE POLICY "Users can create connections"
  ON partner_connections FOR INSERT
  TO authenticated
  WITH CHECK (initiated_by = auth.uid());

-- Policy 4: Users can update connections they're part of
CREATE POLICY "Users can update own connections"
  ON partner_connections FOR UPDATE
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid() OR initiated_by = auth.uid());

-- Policy 5: Users can delete connections they initiated
CREATE POLICY "Users can delete own connections"
  ON partner_connections FOR DELETE
  TO authenticated
  USING (initiated_by = auth.uid());

