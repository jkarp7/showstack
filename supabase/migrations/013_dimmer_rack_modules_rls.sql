-- ============================================
-- Migration 013: Simplify dimmer_rack_modules RLS
-- ============================================
-- Migration 008 added project_id directly to dimmer_rack_modules (denormalized,
-- kept in sync via trigger). Migration 006 created RLS policies that join through
-- dimmer_racks to reach the project — unnecessary now that project_id is a direct
-- column. This migration replaces those join-based policies with simpler
-- project_id-based equivalents, matching the pattern used by every other table.
--
-- NOTE: role IN ('owner', 'editor') — 'owner' is intentionally included for
-- forward-compatibility parity with migration 006, but it is dead code today.
-- Ownership is tracked via projects.user_id (first branch of the USING clause),
-- not via a project_members row. No member row ever carries role = 'owner'.
-- ============================================

DROP POLICY "Users can view dimmer rack modules in accessible projects" ON dimmer_rack_modules;
DROP POLICY "Users can insert dimmer rack modules into editable projects" ON dimmer_rack_modules;
DROP POLICY "Users can update dimmer rack modules in editable projects" ON dimmer_rack_modules;
DROP POLICY "Users can delete dimmer rack modules from editable projects" ON dimmer_rack_modules;

CREATE POLICY "Users can view dimmer rack modules in accessible projects"
  ON dimmer_rack_modules FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = dimmer_rack_modules.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = dimmer_rack_modules.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted')
  );

CREATE POLICY "Users can insert dimmer rack modules into editable projects"
  ON dimmer_rack_modules FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = dimmer_rack_modules.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = dimmer_rack_modules.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can update dimmer rack modules in editable projects"
  ON dimmer_rack_modules FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = dimmer_rack_modules.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = dimmer_rack_modules.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can delete dimmer rack modules from editable projects"
  ON dimmer_rack_modules FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = dimmer_rack_modules.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = dimmer_rack_modules.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

DO $$
BEGIN
  RAISE NOTICE 'Migration 013 complete: dimmer_rack_modules RLS updated to use project_id directly.';
END $$;
