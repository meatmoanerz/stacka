-- Create a function to join a partner connection
-- This function uses SECURITY DEFINER to bypass RLS for the update
CREATE OR REPLACE FUNCTION join_partner_connection(p_invite_code TEXT, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_connection RECORD;
  v_result JSON;
BEGIN
  -- Find the pending connection with this code
  SELECT * INTO v_connection
  FROM partner_connections
  WHERE invite_code = UPPER(p_invite_code)
    AND status = 'pending'
    AND expires_at > NOW();

  -- Check if connection exists
  IF v_connection IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'invalid_or_expired_code');
  END IF;

  -- Check if user is trying to join their own invite
  IF v_connection.initiated_by = p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'cannot_join_own_invite');
  END IF;

  -- Check if user is already connected to someone
  IF EXISTS (
    SELECT 1 FROM partner_connections
    WHERE (user1_id = p_user_id OR user2_id = p_user_id)
      AND status = 'active'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'already_connected');
  END IF;

  -- Update the connection
  UPDATE partner_connections
  SET 
    user2_id = p_user_id,
    status = 'active',
    invite_code = NULL  -- Clear the code once used
  WHERE id = v_connection.id;

  RETURN json_build_object(
    'success', true, 
    'connection_id', v_connection.id,
    'partner_id', v_connection.initiated_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION join_partner_connection(TEXT, UUID) TO authenticated;

