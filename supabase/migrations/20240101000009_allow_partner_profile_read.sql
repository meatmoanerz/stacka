-- Allow users to read their partner's profile

-- Add policy to allow reading partner profiles
CREATE POLICY "Users can read partner profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- User can read their own profile
    auth.uid() = id
    OR
    -- User can read profile of someone they're connected to
    EXISTS (
      SELECT 1 FROM partner_connections pc
      WHERE pc.status = 'active'
      AND (
        (pc.user1_id = auth.uid() AND pc.user2_id = id)
        OR
        (pc.user2_id = auth.uid() AND pc.user1_id = id)
      )
    )
  );

-- Drop the old restrictive policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON profiles;

