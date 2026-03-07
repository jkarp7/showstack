-- ============================================
-- Migration 010: invite_to_project upserts the project row
-- ============================================
-- Projects are stored in the local SQLite and never written to Supabase
-- directly, so the projects table in Supabase is empty for locally-created
-- projects. invite_to_project previously returned "Project not found" for
-- every local project.
--
-- Fix: accept p_project_name and upsert a minimal project stub before the
-- ownership check. Since SECURITY DEFINER runs as the function owner and
-- we trust auth.uid() as the calling user, we set user_id = auth.uid() on
-- INSERT. On conflict (project already exists) we leave user_id unchanged
-- so an existing owner cannot be overwritten by a different caller.
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
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 010 complete: invite_to_project now accepts p_project_name and upserts the project stub.';
END $$;
