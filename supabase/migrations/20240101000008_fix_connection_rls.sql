-- Fix RLS policies for partner_connections to allow reading active connections

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can lookup pending invites by code" ON partner_connections;
DROP POLICY IF EXISTS "Users can create connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can update own connections" ON partner_connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON partner_connections;

-- Enable RLS
ALTER TABLE partner_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read connections they are part of (user1 or user2)
CREATE POLICY "Users can read own connections"
  ON partner_connections FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user1_id 
    OR auth.uid() = user2_id 
    OR auth.uid() = initiated_by
  );

-- Policy: Anyone can read pending invites by code (for joining)
CREATE POLICY "Anyone can read pending invites"
  ON partner_connections FOR SELECT
  TO authenticated
  USING (
    status = 'pending' 
    AND invite_code IS NOT NULL
  );

-- Policy: Users can create their own invites
CREATE POLICY "Users can create invites"
  ON partner_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = initiated_by);

-- Policy: Users can update connections they are part of
CREATE POLICY "Users can update own connections"
  ON partner_connections FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user1_id 
    OR auth.uid() = user2_id 
    OR auth.uid() = initiated_by
  );

-- Policy: Users can delete their pending invites
CREATE POLICY "Users can delete own invites"
  ON partner_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = initiated_by);

