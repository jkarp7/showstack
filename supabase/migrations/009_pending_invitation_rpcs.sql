-- ============================================
-- Migration 009: Pending Invitation Query RPCs
-- ============================================
-- The PowerSync sync rules only sync project_members / shop_order_members rows
-- to users who are already ACCEPTED members. Pending invitations are never
-- synced down to the invitee's local PowerSync database, so reading locally
-- would always return empty.
--
-- These SECURITY DEFINER functions let the invitee query Supabase directly
-- by their authenticated email to discover pending invitations without
-- needing those rows to be in their local DB.
-- ============================================


-- ============================================
-- get_pending_project_invitations
-- Returns all pending project_members rows where the caller's email matches.
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_project_invitations()
RETURNS SETOF project_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  RETURN QUERY
    SELECT *
    FROM project_members
    WHERE lower(email) = lower(v_user_email)
      AND status = 'pending'
    ORDER BY invited_at DESC;
END;
$$;


-- ============================================
-- get_pending_shop_order_invitations
-- Returns all pending shop_order_members rows where the caller's email matches.
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_shop_order_invitations()
RETURNS SETOF shop_order_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  RETURN QUERY
    SELECT *
    FROM shop_order_members
    WHERE lower(email) = lower(v_user_email)
      AND status = 'pending'
    ORDER BY invited_at DESC;
END;
$$;


-- ============================================
-- GRANT EXECUTE to authenticated users
-- ============================================

GRANT EXECUTE ON FUNCTION get_pending_project_invitations()   TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_shop_order_invitations() TO authenticated;


-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 009 complete: get_pending_project_invitations and get_pending_shop_order_invitations created.';
END $$;
