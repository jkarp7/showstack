-- ============================================
-- Migration 006: Collaboration RLS Policies
-- ============================================
-- Drops the single-user ownership policies from 003_rls_policies.sql and
-- replaces them with membership-aware policies. All existing owners retain
-- full access. Accepted members gain access based on their role.
--
-- Policy matrix for project tables:
--   SELECT  — owner OR any accepted member (owner/editor/viewer)
--   INSERT  — owner OR accepted editor
--   UPDATE  — owner OR accepted editor
--   DELETE  — owner OR accepted editor (project row itself: owner only)
--
-- NOTE: role IN ('owner', 'editor') — 'owner' is dead code throughout this file.
-- Ownership is tracked via projects.user_id (the first branch of every USING clause),
-- not via a project_members row. No member row ever carries role = 'owner'.
-- The 'owner' value is retained for forward-compatibility with the CHECK constraint
-- in migration 005 but will never match in practice.
-- See migration 013 for additional context.
--
-- user_preferences is additionally scoped to auth.uid() so each
-- collaborator only ever reads/writes their own UI preferences.
-- ============================================

-- ============================================
-- HELPER: reusable membership check fragments
-- ============================================
-- Rather than repeating the subquery inline, we rely on PostgreSQL's
-- ability to inline EXISTS subqueries efficiently (index-backed).
--
-- Project access check patterns used throughout:
--
--   Owner:
--     projects.user_id = auth.uid()
--
--   Accepted member (any role — for SELECT):
--     EXISTS (SELECT 1 FROM project_members pm
--             WHERE pm.project_id = <fk_col>
--               AND pm.user_id = auth.uid()
--               AND pm.status = 'accepted')
--
--   Accepted editor (for INSERT/UPDATE/DELETE on child rows):
--     EXISTS (SELECT 1 FROM project_members pm
--             WHERE pm.project_id = <fk_col>
--               AND pm.user_id = auth.uid()
--               AND pm.status = 'accepted'
--               AND pm.role IN ('owner', 'editor'))
-- ============================================


-- ============================================
-- PROJECTS
-- ============================================

DROP POLICY "Users can view their own projects" ON projects;
DROP POLICY "Users can insert their own projects" ON projects;
DROP POLICY "Users can update their own projects" ON projects;
DROP POLICY "Users can delete their own projects" ON projects;

CREATE POLICY "Users can view projects they have access to"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
    )
  );

-- INSERT: only the owner can create a project (unchanged)
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: owner or accepted editor
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
  );

-- DELETE: owner only
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- FIXTURES
-- ============================================

DROP POLICY "Users can view fixtures in their own projects" ON fixtures;
DROP POLICY "Users can insert fixtures into their own projects" ON fixtures;
DROP POLICY "Users can update fixtures in their own projects" ON fixtures;
DROP POLICY "Users can delete fixtures from their own projects" ON fixtures;

CREATE POLICY "Users can view fixtures in accessible projects"
  ON fixtures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = fixtures.project_id
        AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = fixtures.project_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert fixtures into editable projects"
  ON fixtures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = fixtures.project_id
        AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = fixtures.project_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can update fixtures in editable projects"
  ON fixtures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = fixtures.project_id
        AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = fixtures.project_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can delete fixtures from editable projects"
  ON fixtures FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = fixtures.project_id
        AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = fixtures.project_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('owner', 'editor')
    )
  );


-- ============================================
-- DIMMER RACKS
-- ============================================

DROP POLICY "Users can view dimmer racks in their own projects" ON dimmer_racks;
DROP POLICY "Users can insert dimmer racks into their own projects" ON dimmer_racks;
DROP POLICY "Users can update dimmer racks in their own projects" ON dimmer_racks;
DROP POLICY "Users can delete dimmer racks from their own projects" ON dimmer_racks;

CREATE POLICY "Users can view dimmer racks in accessible projects"
  ON dimmer_racks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = dimmer_racks.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = dimmer_racks.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted')
  );

CREATE POLICY "Users can insert dimmer racks into editable projects"
  ON dimmer_racks FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = dimmer_racks.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = dimmer_racks.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can update dimmer racks in editable projects"
  ON dimmer_racks FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = dimmer_racks.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = dimmer_racks.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can delete dimmer racks from editable projects"
  ON dimmer_racks FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = dimmer_racks.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = dimmer_racks.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );


-- ============================================
-- DIMMER RACK MODULES
-- ============================================

DROP POLICY "Users can view dimmer rack modules in their own racks" ON dimmer_rack_modules;
DROP POLICY "Users can insert dimmer rack modules into their own racks" ON dimmer_rack_modules;
DROP POLICY "Users can update dimmer rack modules in their own racks" ON dimmer_rack_modules;
DROP POLICY "Users can delete dimmer rack modules from their own racks" ON dimmer_rack_modules;

CREATE POLICY "Users can view dimmer rack modules in accessible projects"
  ON dimmer_rack_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN projects ON projects.id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
        AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN project_members pm ON pm.project_id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert dimmer rack modules into editable projects"
  ON dimmer_rack_modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN projects ON projects.id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
        AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN project_members pm ON pm.project_id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can update dimmer rack modules in editable projects"
  ON dimmer_rack_modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN projects ON projects.id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
        AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN project_members pm ON pm.project_id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can delete dimmer rack modules from editable projects"
  ON dimmer_rack_modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN projects ON projects.id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
        AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN project_members pm ON pm.project_id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('owner', 'editor')
    )
  );


-- ============================================
-- PD RACKS
-- ============================================

DROP POLICY "Users can view PD racks in their own projects" ON pd_racks;
DROP POLICY "Users can insert PD racks into their own projects" ON pd_racks;
DROP POLICY "Users can update PD racks in their own projects" ON pd_racks;
DROP POLICY "Users can delete PD racks from their own projects" ON pd_racks;

CREATE POLICY "Users can view PD racks in accessible projects"
  ON pd_racks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = pd_racks.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = pd_racks.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted')
  );

CREATE POLICY "Users can insert PD racks into editable projects"
  ON pd_racks FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = pd_racks.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = pd_racks.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can update PD racks in editable projects"
  ON pd_racks FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = pd_racks.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = pd_racks.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can delete PD racks from editable projects"
  ON pd_racks FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = pd_racks.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = pd_racks.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );


-- ============================================
-- PHASE DISTRIBUTION TEMPLATES
-- ============================================

DROP POLICY "Users can view phase templates in their own projects" ON phase_distribution_templates;
DROP POLICY "Users can insert phase templates into their own projects" ON phase_distribution_templates;
DROP POLICY "Users can update phase templates in their own projects" ON phase_distribution_templates;
DROP POLICY "Users can delete phase templates from their own projects" ON phase_distribution_templates;

CREATE POLICY "Users can view phase templates in accessible projects"
  ON phase_distribution_templates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_distribution_templates.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = phase_distribution_templates.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted')
  );

CREATE POLICY "Users can insert phase templates into editable projects"
  ON phase_distribution_templates FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_distribution_templates.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = phase_distribution_templates.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can update phase templates in editable projects"
  ON phase_distribution_templates FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_distribution_templates.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = phase_distribution_templates.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can delete phase templates from editable projects"
  ON phase_distribution_templates FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_distribution_templates.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = phase_distribution_templates.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );


-- ============================================
-- INFRASTRUCTURE EQUIPMENT
-- ============================================

DROP POLICY "Users can view infrastructure in their own projects" ON infrastructure_equipment;
DROP POLICY "Users can insert infrastructure into their own projects" ON infrastructure_equipment;
DROP POLICY "Users can update infrastructure in their own projects" ON infrastructure_equipment;
DROP POLICY "Users can delete infrastructure from their own projects" ON infrastructure_equipment;

CREATE POLICY "Users can view infrastructure in accessible projects"
  ON infrastructure_equipment FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = infrastructure_equipment.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = infrastructure_equipment.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted')
  );

CREATE POLICY "Users can insert infrastructure into editable projects"
  ON infrastructure_equipment FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = infrastructure_equipment.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = infrastructure_equipment.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can update infrastructure in editable projects"
  ON infrastructure_equipment FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = infrastructure_equipment.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = infrastructure_equipment.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can delete infrastructure from editable projects"
  ON infrastructure_equipment FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = infrastructure_equipment.project_id AND projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = infrastructure_equipment.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted' AND pm.role IN ('owner', 'editor'))
  );


-- ============================================
-- USER PREFERENCES
-- ============================================
-- Scoped to auth.uid() so each collaborator can only see their own prefs,
-- even on shared projects. The user must also have access to the project.

DROP POLICY "Users can view preferences in their own projects" ON user_preferences;
DROP POLICY "Users can insert preferences into their own projects" ON user_preferences;
DROP POLICY "Users can update preferences in their own projects" ON user_preferences;
DROP POLICY "Users can delete preferences from their own projects" ON user_preferences;

CREATE POLICY "Users can view their own preferences in accessible projects"
  ON user_preferences FOR SELECT
  USING (
    user_preferences.user_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM projects WHERE projects.id = user_preferences.project_id AND projects.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = user_preferences.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted')
    )
  );

CREATE POLICY "Users can insert their own preferences in accessible projects"
  ON user_preferences FOR INSERT
  WITH CHECK (
    user_preferences.user_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM projects WHERE projects.id = user_preferences.project_id AND projects.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = user_preferences.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted')
    )
  );

CREATE POLICY "Users can update their own preferences in accessible projects"
  ON user_preferences FOR UPDATE
  USING (
    user_preferences.user_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM projects WHERE projects.id = user_preferences.project_id AND projects.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = user_preferences.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted')
    )
  );

CREATE POLICY "Users can delete their own preferences in accessible projects"
  ON user_preferences FOR DELETE
  USING (
    user_preferences.user_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM projects WHERE projects.id = user_preferences.project_id AND projects.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = user_preferences.project_id AND pm.user_id = auth.uid() AND pm.status = 'accepted')
    )
  );


-- ============================================
-- PROJECT MEMBERS (self-referential RLS)
-- ============================================

-- SELECT: project owner OR the member themselves
CREATE POLICY "Project owners and members can view membership"
  ON project_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid())
    OR project_members.user_id = auth.uid()
  );

-- INSERT: only via the invite_to_project RPC (SECURITY DEFINER bypasses RLS).
-- This policy allows the project owner to insert directly if needed.
CREATE POLICY "Project owners can insert members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid())
  );

-- UPDATE: project owner (to change role) OR the invited user (to accept/decline)
CREATE POLICY "Project owners and invited users can update membership"
  ON project_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid())
    OR project_members.user_id = auth.uid()
  );

-- DELETE: project owner only
CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid())
  );


-- ============================================
-- SHOP ORDER PROJECTS
-- ============================================

DROP POLICY "Users can view their own shop orders" ON shop_order_projects;
DROP POLICY "Users can insert their own shop orders" ON shop_order_projects;
DROP POLICY "Users can update their own shop orders" ON shop_order_projects;
DROP POLICY "Users can delete their own shop orders" ON shop_order_projects;

CREATE POLICY "Users can view shop orders they have access to"
  ON shop_order_projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM shop_order_members som
      WHERE som.shop_order_id = shop_order_projects.id
        AND som.user_id = auth.uid()
        AND som.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert their own shop orders"
  ON shop_order_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
  );

CREATE POLICY "Users can delete their own shop orders"
  ON shop_order_projects FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- SHOP ORDER SECTIONS
-- ============================================

DROP POLICY "Users can view sections in their own shop orders" ON shop_order_sections;
DROP POLICY "Users can insert sections into their own shop orders" ON shop_order_sections;
DROP POLICY "Users can update sections in their own shop orders" ON shop_order_sections;
DROP POLICY "Users can delete sections from their own shop orders" ON shop_order_sections;

CREATE POLICY "Users can view sections in accessible shop orders"
  ON shop_order_sections FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_sections.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_sections.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted')
  );

CREATE POLICY "Users can insert sections into editable shop orders"
  ON shop_order_sections FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_sections.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_sections.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can update sections in editable shop orders"
  ON shop_order_sections FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_sections.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_sections.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can delete sections from editable shop orders"
  ON shop_order_sections FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_sections.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_sections.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor'))
  );


-- ============================================
-- SHOP ORDER ITEMS
-- ============================================

DROP POLICY "Users can view items in their own shop orders" ON shop_order_items;
DROP POLICY "Users can insert items into their own shop orders" ON shop_order_items;
DROP POLICY "Users can update items in their own shop orders" ON shop_order_items;
DROP POLICY "Users can delete items from their own shop orders" ON shop_order_items;

CREATE POLICY "Users can view items in accessible shop orders"
  ON shop_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_sections sec
      JOIN shop_order_projects sop ON sop.id = sec.prep_project_id
      WHERE sec.id = shop_order_items.section_id AND sop.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM shop_order_sections sec
      JOIN shop_order_members som ON som.shop_order_id = sec.prep_project_id
      WHERE sec.id = shop_order_items.section_id AND som.user_id = auth.uid() AND som.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert items into editable shop orders"
  ON shop_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_order_sections sec
      JOIN shop_order_projects sop ON sop.id = sec.prep_project_id
      WHERE sec.id = shop_order_items.section_id AND sop.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM shop_order_sections sec
      JOIN shop_order_members som ON som.shop_order_id = sec.prep_project_id
      WHERE sec.id = shop_order_items.section_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can update items in editable shop orders"
  ON shop_order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_sections sec
      JOIN shop_order_projects sop ON sop.id = sec.prep_project_id
      WHERE sec.id = shop_order_items.section_id AND sop.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM shop_order_sections sec
      JOIN shop_order_members som ON som.shop_order_id = sec.prep_project_id
      WHERE sec.id = shop_order_items.section_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can delete items from editable shop orders"
  ON shop_order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_sections sec
      JOIN shop_order_projects sop ON sop.id = sec.prep_project_id
      WHERE sec.id = shop_order_items.section_id AND sop.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM shop_order_sections sec
      JOIN shop_order_members som ON som.shop_order_id = sec.prep_project_id
      WHERE sec.id = shop_order_items.section_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor')
    )
  );


-- ============================================
-- SHOP ORDER REVISIONS
-- ============================================

DROP POLICY "Users can view revisions in their own shop orders" ON shop_order_revisions;
DROP POLICY "Users can insert revisions into their own shop orders" ON shop_order_revisions;
DROP POLICY "Users can update revisions in their own shop orders" ON shop_order_revisions;
DROP POLICY "Users can delete revisions from their own shop orders" ON shop_order_revisions;

CREATE POLICY "Users can view revisions in accessible shop orders"
  ON shop_order_revisions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_revisions.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_revisions.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted')
  );

CREATE POLICY "Users can insert revisions into editable shop orders"
  ON shop_order_revisions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_revisions.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_revisions.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can update revisions in editable shop orders"
  ON shop_order_revisions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_revisions.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_revisions.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can delete revisions from editable shop orders"
  ON shop_order_revisions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_revisions.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_revisions.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor'))
  );


-- ============================================
-- SHOP ORDER NOTES
-- ============================================

DROP POLICY "Users can view notes in their own shop orders" ON shop_order_notes;
DROP POLICY "Users can insert notes into their own shop orders" ON shop_order_notes;
DROP POLICY "Users can update notes in their own shop orders" ON shop_order_notes;
DROP POLICY "Users can delete notes from their own shop orders" ON shop_order_notes;

CREATE POLICY "Users can view notes in accessible shop orders"
  ON shop_order_notes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_notes.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_notes.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted')
  );

CREATE POLICY "Users can insert notes into editable shop orders"
  ON shop_order_notes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_notes.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_notes.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can update notes in editable shop orders"
  ON shop_order_notes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_notes.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_notes.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor'))
  );

CREATE POLICY "Users can delete notes from editable shop orders"
  ON shop_order_notes FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_notes.prep_project_id AND sop.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM shop_order_members som WHERE som.shop_order_id = shop_order_notes.prep_project_id AND som.user_id = auth.uid() AND som.status = 'accepted' AND som.role IN ('owner', 'editor'))
  );


-- ============================================
-- SHOP ORDER MEMBERS (self-referential RLS)
-- ============================================

-- SELECT: shop order owner OR the member themselves
CREATE POLICY "Shop order owners and members can view membership"
  ON shop_order_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_members.shop_order_id AND sop.user_id = auth.uid())
    OR shop_order_members.user_id = auth.uid()
  );

CREATE POLICY "Shop order owners can insert members"
  ON shop_order_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_members.shop_order_id AND sop.user_id = auth.uid())
  );

CREATE POLICY "Shop order owners and invited users can update membership"
  ON shop_order_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_members.shop_order_id AND sop.user_id = auth.uid())
    OR shop_order_members.user_id = auth.uid()
  );

CREATE POLICY "Shop order owners can remove members"
  ON shop_order_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM shop_order_projects sop WHERE sop.id = shop_order_members.shop_order_id AND sop.user_id = auth.uid())
  );


-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 006 complete: collaboration RLS policies applied to all tables.';
END $$;
