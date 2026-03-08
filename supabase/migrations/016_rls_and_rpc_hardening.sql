-- ============================================
-- Migration 016: RLS and RPC hardening
-- ============================================
-- Addresses three security issues identified in code review:
--
-- 1. HIGH: project_members / shop_order_members UPDATE WITH CHECK (migration 014)
--    did not lock the foreign key (project_id / shop_order_id) immutable on the
--    self-update path. An accepted member could change their own row's project_id
--    to any project UUID, immediately granting themselves access to that project's
--    data via the USING clause.
--    Fix: add project_id (and shop_order_id) immutability to the invited-user
--    branch of the WITH CHECK expression.
--
-- 2. MEDIUM: project_members / shop_order_members INSERT policies (migration 006)
--    only checked project ownership, not the invited_by column. An attacker could
--    directly INSERT a row with invited_by set to a victim's UUID and then call
--    get_pending_project_invitations to leak that user's email.
--    Fix: add invited_by = auth.uid() to both INSERT WITH CHECK clauses.
--
-- 3. MEDIUM: cancel_project_invitation / cancel_shop_order_invitation (migration 012)
--    accepted p_member_id as TEXT. Changed to UUID so the database rejects
--    non-UUID strings before any query is executed. Requires dropping the old
--    TEXT-typed overloads and recreating with UUID.
-- ============================================


-- ============================================
-- 1. FIX project_members UPDATE: lock project_id immutable on self-update path
-- ============================================

DROP POLICY "Project owners and invited users can update membership" ON project_members;

CREATE POLICY "Project owners and invited users can update membership"
  ON project_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid())
    OR project_members.user_id = auth.uid()
  )
  WITH CHECK (
    -- Project owner can update any column (role, status, etc.)
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid())
    -- Invited user can only update status (accept/decline):
    --   • role must remain unchanged
    --   • project_id must remain unchanged (prevents cross-project membership hijack)
    OR (
      project_members.user_id = auth.uid()
      AND role = (SELECT pm2.role FROM project_members pm2 WHERE pm2.id = project_members.id)
      AND project_id = (SELECT pm2.project_id FROM project_members pm2 WHERE pm2.id = project_members.id)
    )
  );


-- ============================================
-- 1. FIX shop_order_members UPDATE: lock shop_order_id immutable on self-update path
-- ============================================

DROP POLICY "Shop order owners and invited users can update membership" ON shop_order_members;

CREATE POLICY "Shop order owners and invited users can update membership"
  ON shop_order_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_members.shop_order_id AND sop.user_id = auth.uid())
    OR shop_order_members.user_id = auth.uid()
  )
  WITH CHECK (
    -- Shop order owner can update any column
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_members.shop_order_id AND sop.user_id = auth.uid())
    -- Invited user can only update status — role and shop_order_id must remain unchanged
    OR (
      shop_order_members.user_id = auth.uid()
      AND role = (SELECT som2.role FROM shop_order_members som2 WHERE som2.id = shop_order_members.id)
      AND shop_order_id = (SELECT som2.shop_order_id FROM shop_order_members som2 WHERE som2.id = shop_order_members.id)
    )
  );


-- ============================================
-- 2. FIX project_members INSERT: enforce invited_by = auth.uid()
-- ============================================

DROP POLICY "Project owners can insert members" ON project_members;

CREATE POLICY "Project owners can insert members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid())
    -- Prevent setting invited_by to an arbitrary UUID to leak another user's email
    -- via get_pending_project_invitations
    AND invited_by = auth.uid()
  );


-- ============================================
-- 2. FIX shop_order_members INSERT: enforce invited_by = auth.uid()
-- ============================================

DROP POLICY "Shop order owners can insert members" ON shop_order_members;

CREATE POLICY "Shop order owners can insert members"
  ON shop_order_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_members.shop_order_id AND sop.user_id = auth.uid())
    AND invited_by = auth.uid()
  );


-- ============================================
-- 3. FIX cancel RPCs: change p_member_id from TEXT to UUID
-- ============================================
-- DROP the TEXT-typed overloads first; CREATE OR REPLACE cannot change parameter types.

DROP FUNCTION IF EXISTS cancel_project_invitation(TEXT);

CREATE OR REPLACE FUNCTION cancel_project_invitation(
  p_member_id UUID
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

GRANT EXECUTE ON FUNCTION cancel_project_invitation(UUID) TO authenticated;


DROP FUNCTION IF EXISTS cancel_shop_order_invitation(TEXT);

CREATE OR REPLACE FUNCTION cancel_shop_order_invitation(
  p_member_id UUID
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

GRANT EXECUTE ON FUNCTION cancel_shop_order_invitation(UUID) TO authenticated;


-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 016 complete: project_id/shop_order_id immutability locked in UPDATE WITH CHECK; invited_by enforced in INSERT WITH CHECK; cancel RPCs changed to UUID parameter type.';
END $$;
