-- ============================================
-- Migration 011: Enrich pending invitation RPCs + decline operations
-- ============================================
-- get_pending_project_invitations: now returns project_name and
--   invited_by_email by joining with projects and auth.users.
-- get_pending_shop_order_invitations: same treatment.
-- decline_project_invitation: sets status = 'declined' for the caller's
--   pending project invitation.
-- decline_shop_order_invitation: same for shop orders.
-- ============================================


-- ============================================
-- get_pending_project_invitations (enriched)
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_project_invitations()
RETURNS TABLE(
  id            UUID,
  project_id    TEXT,
  project_name  TEXT,
  email         TEXT,
  role          TEXT,
  invited_by    UUID,
  invited_by_email TEXT,
  status        TEXT,
  invited_at    BIGINT,
  accepted_at   BIGINT
)
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

  SELECT au.email INTO v_user_email
  FROM auth.users au
  WHERE au.id = auth.uid();

  RETURN QUERY
    SELECT
      pm.id,
      pm.project_id,
      COALESCE(p.name, pm.project_id) AS project_name,
      pm.email,
      pm.role,
      pm.invited_by,
      COALESCE(u.email, '') AS invited_by_email,
      pm.status,
      pm.invited_at,
      pm.accepted_at
    FROM project_members pm
    LEFT JOIN projects p ON p.id = pm.project_id
    LEFT JOIN auth.users u ON u.id = pm.invited_by
    WHERE lower(pm.email) = lower(v_user_email)
      AND pm.status = 'pending'
    ORDER BY pm.invited_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pending_project_invitations() TO authenticated;


-- ============================================
-- get_pending_shop_order_invitations (enriched)
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_shop_order_invitations()
RETURNS TABLE(
  id               UUID,
  shop_order_id    TEXT,
  shop_order_name  TEXT,
  email            TEXT,
  role             TEXT,
  invited_by       UUID,
  invited_by_email TEXT,
  status           TEXT,
  invited_at       BIGINT,
  accepted_at      BIGINT
)
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

  SELECT au.email INTO v_user_email
  FROM auth.users au
  WHERE au.id = auth.uid();

  RETURN QUERY
    SELECT
      som.id,
      som.shop_order_id,
      COALESCE(sop.production_name, som.shop_order_id) AS shop_order_name,
      som.email,
      som.role,
      som.invited_by,
      COALESCE(u.email, '') AS invited_by_email,
      som.status,
      som.invited_at,
      som.accepted_at
    FROM shop_order_members som
    LEFT JOIN shop_order_projects sop ON sop.id = som.shop_order_id
    LEFT JOIN auth.users u ON u.id = som.invited_by
    WHERE lower(som.email) = lower(v_user_email)
      AND som.status = 'pending'
    ORDER BY som.invited_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pending_shop_order_invitations() TO authenticated;


-- ============================================
-- decline_project_invitation
-- ============================================
CREATE OR REPLACE FUNCTION decline_project_invitation(
  p_project_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email    TEXT;
  v_rows_updated  INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  UPDATE project_members
  SET status = 'declined'
  WHERE project_id = p_project_id
    AND lower(email) = lower(v_user_email)
    AND status = 'pending';

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending invitation found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION decline_project_invitation(TEXT) TO authenticated;


-- ============================================
-- decline_shop_order_invitation
-- ============================================
CREATE OR REPLACE FUNCTION decline_shop_order_invitation(
  p_shop_order_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email    TEXT;
  v_rows_updated  INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  UPDATE shop_order_members
  SET status = 'declined'
  WHERE shop_order_id = p_shop_order_id
    AND lower(email) = lower(v_user_email)
    AND status = 'pending';

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending invitation found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION decline_shop_order_invitation(TEXT) TO authenticated;


-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 011 complete: enriched pending invitation RPCs and decline functions created.';
END $$;
