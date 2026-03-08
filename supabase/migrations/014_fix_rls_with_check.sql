-- ============================================
-- Migration 014: Fix missing WITH CHECK clauses on UPDATE policies
-- ============================================
-- Migration 006 UPDATE policies were missing WITH CHECK clauses, which means
-- PostgreSQL falls back to using the USING expression for both the row filter
-- AND the new-row validation. This allows two privilege escalation vectors:
--
-- 1. Ownership hijack (projects / shop_order_projects):
--    An accepted editor could change user_id on the project/shop-order row to
--    themselves, becoming the owner and gaining the ability to remove the
--    original owner.
--
-- 2. Role elevation (project_members / shop_order_members):
--    An invited viewer/editor could update their own membership row and change
--    their role to a higher privilege (e.g. viewer → editor).
--
-- Fix: add WITH CHECK clauses that:
--   • For project/shop-order rows: require user_id (ownership) to be unchanged
--     after the update. The subquery reads the current value before the write.
--   • For member rows: require the owner path to be unrestricted (they can
--     change any column), but restrict the self-update path so the member's
--     role cannot change (they may only update status to accept/decline).
-- ============================================

-- ============================================
-- PROJECTS
-- ============================================

DROP POLICY "Users can update projects they can edit" ON projects;

CREATE POLICY "Users can update projects they can edit"
  ON projects FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    -- Ownership (user_id) must not change.
    -- The subquery returns the current pre-update value; the bare column refers
    -- to the proposed new value. If they differ the update is rejected.
    user_id = (SELECT p2.user_id FROM projects p2 WHERE p2.id = projects.id)
  );

-- ============================================
-- SHOP ORDER PROJECTS
-- ============================================

DROP POLICY "Users can update shop orders they can edit" ON shop_order_projects;

CREATE POLICY "Users can update shop orders they can edit"
  ON shop_order_projects FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM shop_order_members som
      WHERE som.shop_order_id = shop_order_projects.id
        AND som.user_id = auth.uid()
        AND som.status = 'accepted'
        AND som.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    user_id = (SELECT sop2.user_id FROM shop_order_projects sop2 WHERE sop2.id = shop_order_projects.id)
  );

-- ============================================
-- PROJECT MEMBERS
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
    -- Invited user can only update status (accept/decline) — role must remain unchanged
    OR (
      project_members.user_id = auth.uid()
      AND role = (SELECT pm2.role FROM project_members pm2 WHERE pm2.id = project_members.id)
    )
  );

-- ============================================
-- SHOP ORDER MEMBERS
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
    -- Invited user can only update status — role must remain unchanged
    OR (
      shop_order_members.user_id = auth.uid()
      AND role = (SELECT som2.role FROM shop_order_members som2 WHERE som2.id = shop_order_members.id)
    )
  );

DO $$
BEGIN
  RAISE NOTICE 'Migration 014 complete: WITH CHECK clauses added to projects, shop_order_projects, project_members, and shop_order_members UPDATE policies.';
END $$;
