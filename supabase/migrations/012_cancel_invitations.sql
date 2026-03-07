-- ============================================
-- Migration 012: Cancel pending invitations
-- ============================================
-- Owners can cancel (delete) a pending invitation they sent using the
-- member row's ID. The check is invited_by = auth.uid() so only the
-- inviter can cancel, and status = 'pending' so accepted rows are
-- unaffected.
-- ============================================


-- ============================================
-- cancel_project_invitation
-- ============================================
CREATE OR REPLACE FUNCTION cancel_project_invitation(
  p_member_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_deleted INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  DELETE FROM project_members
  WHERE id = p_member_id
    AND invited_by = auth.uid()
    AND status = 'pending';

  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;

  IF v_rows_deleted = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No pending invitation found or insufficient permissions'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_project_invitation(TEXT) TO authenticated;


-- ============================================
-- cancel_shop_order_invitation
-- ============================================
CREATE OR REPLACE FUNCTION cancel_shop_order_invitation(
  p_member_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_deleted INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  DELETE FROM shop_order_members
  WHERE id = p_member_id
    AND invited_by = auth.uid()
    AND status = 'pending';

  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;

  IF v_rows_deleted = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No pending invitation found or insufficient permissions'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_shop_order_invitation(TEXT) TO authenticated;


-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 012 complete: cancel_project_invitation and cancel_shop_order_invitation created.';
END $$;
