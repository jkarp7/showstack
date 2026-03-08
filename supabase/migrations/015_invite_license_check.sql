-- ============================================
-- Migration 015: Server-side license tier check in invite RPCs
-- ============================================
-- invite_to_project and invite_to_shop_order previously only enforced
-- ownership and role validation. An authenticated user on any tier could
-- bypass the client-side canCollaborate gate by calling the RPC directly.
--
-- Fix: add a server-side check that verifies the caller has an active license
-- with tier 'professional' or 'institutional' and cloud_sync enabled before
-- allowing them to send invitations. This mirrors the LicenseService
-- canCollaborate logic (tier IN ('professional', 'institutional') AND cloud_sync).
-- ============================================


-- ============================================
-- invite_to_project (replaces migration 010)
-- ============================================

CREATE OR REPLACE FUNCTION invite_to_project(
  p_project_id   TEXT,
  p_project_name TEXT,
  p_email        TEXT,
  p_role         TEXT
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

  -- Server-side license gate: caller must have an active professional or
  -- institutional license with cloud_sync enabled.
  -- Mirrors the client-side canCollaborate check in LicenseService.
  IF NOT EXISTS (
    SELECT 1 FROM licenses
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND tier IN ('professional', 'institutional')
      AND cloud_sync = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collaboration requires a Professional or Institutional license with active cloud sync');
  END IF;

  -- SECURITY NOTE: TOCTOU / first-caller-wins ownership risk
  -- If the project row does not exist in Supabase yet (offline-first: project
  -- was created locally and has not synced), any authenticated user who learns
  -- the project UUID can call invite_to_project first and claim ownership here.
  -- UUID v4 guessing is impractical, but a leaked UUID is a real (if low) risk.
  -- Full mitigation requires writing the project row to Supabase at creation time
  -- so the owner is established before anyone can call this function.
  -- See: NEXT_STEPS.md — "Project row sync on creation"
  --
  -- Upsert a minimal project stub so the row always exists in Supabase.
  -- Projects are created locally and may not have been synced yet.
  -- On conflict we do nothing — we never overwrite an existing owner.
  INSERT INTO projects (id, user_id, name, created_at, updated_at)
  VALUES (
    p_project_id,
    auth.uid(),
    p_project_name,
    extract(epoch from now())::bigint * 1000,
    extract(epoch from now())::bigint * 1000
  )
  ON CONFLICT (id) DO NOTHING;

  -- Fetch project owner (will always be non-null now)
  SELECT user_id INTO v_project_owner
  FROM projects
  WHERE id = p_project_id;

  IF v_project_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the project owner can invite members');
  END IF;

  -- Owners cannot be invited; only editor/viewer roles are valid
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

GRANT EXECUTE ON FUNCTION invite_to_project(TEXT, TEXT, TEXT, TEXT) TO authenticated;


-- ============================================
-- invite_to_shop_order (replaces migration 007)
-- ============================================

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

  -- Server-side license gate: caller must have an active professional or
  -- institutional license with cloud_sync enabled.
  IF NOT EXISTS (
    SELECT 1 FROM licenses
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND tier IN ('professional', 'institutional')
      AND cloud_sync = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collaboration requires a Professional or Institutional license with active cloud sync');
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

GRANT EXECUTE ON FUNCTION invite_to_shop_order(TEXT, TEXT, TEXT) TO authenticated;


-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 015 complete: server-side license tier check added to invite_to_project and invite_to_shop_order.';
END $$;
