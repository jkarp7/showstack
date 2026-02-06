-- ============================================
-- ShowStack Row-Level Security (RLS) Policies
-- ============================================
-- Ensures users can only access their own data
-- Based on Supabase Auth
--
-- Policy Structure:
-- 1. Enable RLS on all tables
-- 2. Users can only see their own projects
-- 3. Users can see all child records of their projects
-- 4. Service role bypasses RLS for admin operations
--
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimmer_racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimmer_rack_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pd_racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_distribution_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_layout_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE paperwork_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROJECTS POLICIES
-- ============================================

-- Users can view their own projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FIXTURES POLICIES
-- ============================================

-- Users can view fixtures in their own projects
CREATE POLICY "Users can view fixtures in their own projects"
  ON fixtures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = fixtures.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can insert fixtures into their own projects
CREATE POLICY "Users can insert fixtures into their own projects"
  ON fixtures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = fixtures.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can update fixtures in their own projects
CREATE POLICY "Users can update fixtures in their own projects"
  ON fixtures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = fixtures.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can delete fixtures from their own projects
CREATE POLICY "Users can delete fixtures from their own projects"
  ON fixtures FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = fixtures.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- DIMMER RACKS POLICIES
-- ============================================

CREATE POLICY "Users can view dimmer racks in their own projects"
  ON dimmer_racks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = dimmer_racks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dimmer racks into their own projects"
  ON dimmer_racks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = dimmer_racks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dimmer racks in their own projects"
  ON dimmer_racks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = dimmer_racks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dimmer racks from their own projects"
  ON dimmer_racks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = dimmer_racks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- DIMMER RACK MODULES POLICIES
-- ============================================

CREATE POLICY "Users can view dimmer rack modules in their own racks"
  ON dimmer_rack_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN projects ON projects.id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dimmer rack modules into their own racks"
  ON dimmer_rack_modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN projects ON projects.id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dimmer rack modules in their own racks"
  ON dimmer_rack_modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN projects ON projects.id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dimmer rack modules from their own racks"
  ON dimmer_rack_modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dimmer_racks
      JOIN projects ON projects.id = dimmer_racks.project_id
      WHERE dimmer_racks.id = dimmer_rack_modules.rack_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- PD RACKS POLICIES
-- ============================================

CREATE POLICY "Users can view PD racks in their own projects"
  ON pd_racks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pd_racks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert PD racks into their own projects"
  ON pd_racks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pd_racks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update PD racks in their own projects"
  ON pd_racks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pd_racks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete PD racks from their own projects"
  ON pd_racks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pd_racks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- PHASE DISTRIBUTION TEMPLATES POLICIES
-- ============================================

CREATE POLICY "Users can view phase templates in their own projects"
  ON phase_distribution_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = phase_distribution_templates.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert phase templates into their own projects"
  ON phase_distribution_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = phase_distribution_templates.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update phase templates in their own projects"
  ON phase_distribution_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = phase_distribution_templates.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete phase templates from their own projects"
  ON phase_distribution_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = phase_distribution_templates.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- INFRASTRUCTURE EQUIPMENT POLICIES
-- ============================================

CREATE POLICY "Users can view infrastructure in their own projects"
  ON infrastructure_equipment FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = infrastructure_equipment.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert infrastructure into their own projects"
  ON infrastructure_equipment FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = infrastructure_equipment.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update infrastructure in their own projects"
  ON infrastructure_equipment FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = infrastructure_equipment.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete infrastructure from their own projects"
  ON infrastructure_equipment FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = infrastructure_equipment.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- USER PREFERENCES POLICIES
-- ============================================

CREATE POLICY "Users can view preferences in their own projects"
  ON user_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = user_preferences.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert preferences into their own projects"
  ON user_preferences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = user_preferences.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update preferences in their own projects"
  ON user_preferences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = user_preferences.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete preferences from their own projects"
  ON user_preferences FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = user_preferences.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- SHOP ORDER PROJECTS POLICIES
-- ============================================

CREATE POLICY "Users can view their own shop orders"
  ON shop_order_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shop orders"
  ON shop_order_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shop orders"
  ON shop_order_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shop orders"
  ON shop_order_projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SHOP ORDER SECTIONS POLICIES (via shop_order_projects)
-- ============================================

CREATE POLICY "Users can view sections in their own shop orders"
  ON shop_order_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_sections.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sections into their own shop orders"
  ON shop_order_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_sections.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sections in their own shop orders"
  ON shop_order_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_sections.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sections from their own shop orders"
  ON shop_order_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_sections.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

-- ============================================
-- SHOP ORDER ITEMS POLICIES (via sections → shop_order_projects)
-- ============================================

CREATE POLICY "Users can view items in their own shop orders"
  ON shop_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_sections
      JOIN shop_order_projects ON shop_order_projects.id = shop_order_sections.prep_project_id
      WHERE shop_order_sections.id = shop_order_items.section_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items into their own shop orders"
  ON shop_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_order_sections
      JOIN shop_order_projects ON shop_order_projects.id = shop_order_sections.prep_project_id
      WHERE shop_order_sections.id = shop_order_items.section_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their own shop orders"
  ON shop_order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_sections
      JOIN shop_order_projects ON shop_order_projects.id = shop_order_sections.prep_project_id
      WHERE shop_order_sections.id = shop_order_items.section_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their own shop orders"
  ON shop_order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_sections
      JOIN shop_order_projects ON shop_order_projects.id = shop_order_sections.prep_project_id
      WHERE shop_order_sections.id = shop_order_items.section_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

-- ============================================
-- SHOP ORDER REVISIONS POLICIES
-- ============================================

CREATE POLICY "Users can view revisions in their own shop orders"
  ON shop_order_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_revisions.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert revisions into their own shop orders"
  ON shop_order_revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_revisions.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update revisions in their own shop orders"
  ON shop_order_revisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_revisions.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete revisions from their own shop orders"
  ON shop_order_revisions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_revisions.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

-- ============================================
-- SHOP ORDER NOTES POLICIES
-- ============================================

CREATE POLICY "Users can view notes in their own shop orders"
  ON shop_order_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_notes.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes into their own shop orders"
  ON shop_order_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_notes.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes in their own shop orders"
  ON shop_order_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_notes.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes from their own shop orders"
  ON shop_order_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shop_order_projects
      WHERE shop_order_projects.id = shop_order_notes.prep_project_id
      AND shop_order_projects.user_id = auth.uid()
    )
  );

-- ============================================
-- SHOP ORDER NOTE TEMPLATES POLICIES
-- ============================================

CREATE POLICY "Users can view their own note templates"
  ON shop_order_note_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own note templates"
  ON shop_order_note_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own note templates"
  ON shop_order_note_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own note templates"
  ON shop_order_note_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PAGE LAYOUT TEMPLATES POLICIES
-- ============================================

CREATE POLICY "Users can view their own page layout templates"
  ON page_layout_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own page layout templates"
  ON page_layout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own page layout templates"
  ON page_layout_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own page layout templates"
  ON page_layout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PAGE LAYOUT ELEMENTS POLICIES (via page_layout_templates)
-- ============================================

CREATE POLICY "Users can view elements in their own templates"
  ON page_layout_elements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM page_layout_templates
      WHERE page_layout_templates.id = page_layout_elements.template_id
      AND page_layout_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert elements into their own templates"
  ON page_layout_elements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM page_layout_templates
      WHERE page_layout_templates.id = page_layout_elements.template_id
      AND page_layout_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update elements in their own templates"
  ON page_layout_elements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM page_layout_templates
      WHERE page_layout_templates.id = page_layout_elements.template_id
      AND page_layout_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete elements from their own templates"
  ON page_layout_elements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM page_layout_templates
      WHERE page_layout_templates.id = page_layout_elements.template_id
      AND page_layout_templates.user_id = auth.uid()
    )
  );

-- ============================================
-- PAPERWORK TEMPLATES POLICIES
-- ============================================

CREATE POLICY "Users can view their own paperwork templates"
  ON paperwork_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own paperwork templates"
  ON paperwork_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paperwork templates"
  ON paperwork_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own paperwork templates"
  ON paperwork_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies created successfully! All tables are now secure.';
END $$;
