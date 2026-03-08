-- ============================================
-- Migration 007: Collaboration RPCs
-- ============================================
-- Server-side functions for invite/accept/remove operations on projects
-- and shop orders. All functions use SECURITY DEFINER so they can bypass
-- RLS and perform the ownership checks themselves — this is the standard
-- Supabase pattern for privileged mutations.
--
-- Note: projects.id and shop_order_projects.id are TEXT, not UUID.
-- project_members.user_id and shop_order_members.user_id are UUID
-- (referencing auth.users.id).
-- ============================================


-- ============================================
-- PROJECT RPCs
-- ============================================

-- invite_to_project
-- Validates that the caller is the project owner, then creates a pending
-- project_members record for the given email + role.
CREATE OR REPLACE FUNCTION invite_to_project(
  p_project_id TEXT,
  p_email      TEXT,
  p_role       TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_owner UUID;
  v_member_id     UUID;
BEGIN
  -- Caller must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Fetch project owner
  SELECT user_id INTO v_project_owner
  FROM projects
  WHERE id = p_project_id;

  IF v_project_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project not found');
  END IF;

  IF v_project_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the project owner can invite members');
  END IF;

  -- Owners cannot be invited; only editor/viewer roles are valid for invitations
  IF p_role NOT IN ('editor', 'viewer') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role — must be editor or viewer');
  END IF;

  -- Prevent owner from inviting themselves
  IF lower(p_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot invite yourself');
  END IF;

  -- Insert; ON CONFLICT returns NULL into v_member_id (duplicate invite)
  INSERT INTO project_members (project_id, email, role, invited_by, invited_at)
  VALUES (p_project_id, lower(p_email), p_role, auth.uid(), extract(epoch from now())::bigint * 1000)
  ON CONFLICT (project_id, email) DO NOTHING
  RETURNING id INTO v_member_id;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This email has already been invited to the project');
  END IF;

  RETURN jsonb_build_object('success', true, 'member_id', v_member_id);
END;
$$;


-- accept_project_invitation
-- Called by the signed-in user after clicking an invitation link. Matches
-- on email (case-insensitive) and updates the pending record.
CREATE OR REPLACE FUNCTION accept_project_invitation(
  p_project_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_rows_updated INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  UPDATE project_members
  SET
    user_id     = auth.uid(),
    status      = 'accepted',
    accepted_at = extract(epoch from now())::bigint * 1000
  WHERE project_id = p_project_id
    AND lower(email) = lower(v_user_email)
    AND status = 'pending';

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending invitation found for your account on this project');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- remove_project_member
-- Removes an accepted or pending member. Only the project owner can call this.
CREATE OR REPLACE FUNCTION remove_project_member(
  p_project_id TEXT,
  p_user_id    UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_owner UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT user_id INTO v_project_owner
  FROM projects
  WHERE id = p_project_id;

  IF v_project_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project not found');
  END IF;

  IF v_project_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the project owner can remove members');
  END IF;

  -- Cannot remove the owner themselves
  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'The project owner cannot be removed');
  END IF;

  DELETE FROM project_members
  WHERE project_id = p_project_id
    AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ============================================
-- SHOP ORDER RPCs
-- ============================================

-- invite_to_shop_order
CREATE OR REPLACE FUNCTION invite_to_shop_order(
  p_shop_order_id TEXT,
  p_email         TEXT,
  p_role          TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_owner UUID;
  v_member_id   UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT user_id INTO v_order_owner
  FROM shop_order_projects
  WHERE id = p_shop_order_id;

  IF v_order_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shop order not found');
  END IF;

  IF v_order_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the shop order owner can invite members');
  END IF;

  IF p_role NOT IN ('editor', 'viewer') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role — must be editor or viewer');
  END IF;

  IF lower(p_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot invite yourself');
  END IF;

  INSERT INTO shop_order_members (shop_order_id, email, role, invited_by, invited_at)
  VALUES (p_shop_order_id, lower(p_email), p_role, auth.uid(), extract(epoch from now())::bigint * 1000)
  ON CONFLICT (shop_order_id, email) DO NOTHING
  RETURNING id INTO v_member_id;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This email has already been invited to the shop order');
  END IF;

  RETURN jsonb_build_object('success', true, 'member_id', v_member_id);
END;
$$;


-- accept_shop_order_invitation
CREATE OR REPLACE FUNCTION accept_shop_order_invitation(
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
  SET
    user_id     = auth.uid(),
    status      = 'accepted',
    accepted_at = extract(epoch from now())::bigint * 1000
  WHERE shop_order_id = p_shop_order_id
    AND lower(email) = lower(v_user_email)
    AND status = 'pending';

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending invitation found for your account on this shop order');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- remove_shop_order_member
CREATE OR REPLACE FUNCTION remove_shop_order_member(
  p_shop_order_id TEXT,
  p_user_id       UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_owner UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT user_id INTO v_order_owner
  FROM shop_order_projects
  WHERE id = p_shop_order_id;

  IF v_order_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shop order not found');
  END IF;

  IF v_order_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the shop order owner can remove members');
  END IF;

  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'The shop order owner cannot be removed');
  END IF;

  DELETE FROM shop_order_members
  WHERE shop_order_id = p_shop_order_id
    AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ============================================
-- GRANT EXECUTE to authenticated users
-- ============================================

GRANT EXECUTE ON FUNCTION invite_to_project(TEXT, TEXT, TEXT)           TO authenticated;
GRANT EXECUTE ON FUNCTION accept_project_invitation(TEXT)                TO authenticated;
GRANT EXECUTE ON FUNCTION remove_project_member(TEXT, UUID)              TO authenticated;
GRANT EXECUTE ON FUNCTION invite_to_shop_order(TEXT, TEXT, TEXT)         TO authenticated;
GRANT EXECUTE ON FUNCTION accept_shop_order_invitation(TEXT)             TO authenticated;
GRANT EXECUTE ON FUNCTION remove_shop_order_member(TEXT, UUID)           TO authenticated;


-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 007 complete: collaboration RPCs created for projects and shop orders.';
END $$;
