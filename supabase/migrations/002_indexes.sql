-- ============================================
-- ShowStack Performance Indexes
-- ============================================
-- Indexes optimized for common query patterns
-- Based on apps/desktop/src/main/database/projectSchema.ts
--
-- ============================================

-- ============================================
-- PROJECTS INDEXES
-- ============================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated ON projects(updated_at DESC);
CREATE INDEX idx_projects_created ON projects(created_at DESC);
CREATE INDEX idx_projects_name ON projects(name);

-- ============================================
-- FIXTURES INDEXES
-- ============================================

CREATE INDEX idx_fixtures_project ON fixtures(project_id);
CREATE INDEX idx_fixtures_position ON fixtures(project_id, position);
CREATE INDEX idx_fixtures_channel ON fixtures(project_id, channel);
CREATE INDEX idx_fixtures_location ON fixtures(project_id, location);
CREATE INDEX idx_fixtures_type ON fixtures(project_id, type);
CREATE INDEX idx_fixtures_updated ON fixtures(updated_at DESC);
CREATE INDEX idx_fixtures_manufacturer ON fixtures(project_id, manufacturer);
CREATE INDEX idx_fixtures_dmx ON fixtures(project_id, universe, dmx_address);

-- Power rack indexes
CREATE INDEX idx_fixtures_dimmer_rack ON fixtures(dimmer_rack_id) WHERE dimmer_rack_id IS NOT NULL;
CREATE INDEX idx_fixtures_pd_rack ON fixtures(pd_rack_id) WHERE pd_rack_id IS NOT NULL;

-- ============================================
-- DIMMER RACKS INDEXES
-- ============================================

CREATE INDEX idx_dimmer_racks_project ON dimmer_racks(project_id);
CREATE INDEX idx_dimmer_racks_location ON dimmer_racks(project_id, location);

-- ============================================
-- DIMMER RACK MODULES INDEXES
-- ============================================

CREATE INDEX idx_dimmer_modules_rack ON dimmer_rack_modules(rack_id);
CREATE INDEX idx_dimmer_modules_position ON dimmer_rack_modules(rack_id, start_circuit, end_circuit);

-- ============================================
-- PD RACKS INDEXES
-- ============================================

CREATE INDEX idx_pd_racks_project ON pd_racks(project_id);
CREATE INDEX idx_pd_racks_location ON pd_racks(project_id, location);

-- ============================================
-- PHASE DISTRIBUTION TEMPLATES INDEXES
-- ============================================

CREATE INDEX idx_phase_templates_project ON phase_distribution_templates(project_id);
CREATE INDEX idx_phase_templates_system ON phase_distribution_templates(is_system);

-- ============================================
-- INFRASTRUCTURE EQUIPMENT INDEXES
-- ============================================

CREATE INDEX idx_infrastructure_project ON infrastructure_equipment(project_id);
CREATE INDEX idx_infrastructure_category ON infrastructure_equipment(project_id, category);
CREATE INDEX idx_infrastructure_location ON infrastructure_equipment(project_id, location);
CREATE INDEX idx_infrastructure_type ON infrastructure_equipment(project_id, manufacturer, model);
CREATE INDEX idx_infrastructure_status ON infrastructure_equipment(status);

-- ============================================
-- USER PREFERENCES INDEXES
-- ============================================

CREATE INDEX idx_preferences_project ON user_preferences(project_id);
CREATE INDEX idx_preferences_key ON user_preferences(project_id, preference_key);

-- ============================================
-- SHOP ORDER PROJECTS INDEXES
-- ============================================

CREATE INDEX idx_shop_order_projects_user ON shop_order_projects(user_id);
CREATE INDEX idx_shop_order_projects_updated ON shop_order_projects(updated_at DESC);
CREATE INDEX idx_shop_order_projects_created ON shop_order_projects(created_at DESC);

-- ============================================
-- SHOP ORDER SECTIONS INDEXES
-- ============================================

CREATE INDEX idx_shop_order_sections_project ON shop_order_sections(prep_project_id);
CREATE INDEX idx_shop_order_sections_order ON shop_order_sections(prep_project_id, sort_order);

-- ============================================
-- SHOP ORDER ITEMS INDEXES
-- ============================================

CREATE INDEX idx_shop_order_items_section ON shop_order_items(section_id);
CREATE INDEX idx_shop_order_items_order ON shop_order_items(section_id, sort_order);

-- ============================================
-- SHOP ORDER REVISIONS INDEXES
-- ============================================

CREATE INDEX idx_shop_order_revisions_project ON shop_order_revisions(prep_project_id);
CREATE INDEX idx_shop_order_revisions_created ON shop_order_revisions(revision_date DESC);

-- ============================================
-- SHOP ORDER NOTES INDEXES
-- ============================================

CREATE INDEX idx_shop_order_notes_project ON shop_order_notes(prep_project_id);
CREATE INDEX idx_shop_order_notes_type ON shop_order_notes(prep_project_id, type);

-- ============================================
-- SHOP ORDER NOTE TEMPLATES INDEXES
-- ============================================

CREATE INDEX idx_shop_order_note_templates_user ON shop_order_note_templates(user_id);
CREATE INDEX idx_shop_order_note_templates_type ON shop_order_note_templates(type);
CREATE INDEX idx_shop_order_note_templates_default ON shop_order_note_templates(type, is_default);

-- ============================================
-- PAGE LAYOUT TEMPLATES INDEXES
-- ============================================

CREATE INDEX idx_layout_templates_user ON page_layout_templates(user_id);
CREATE INDEX idx_layout_templates_type ON page_layout_templates(page_type);
CREATE INDEX idx_layout_templates_default ON page_layout_templates(page_type, is_default);

-- ============================================
-- PAGE LAYOUT ELEMENTS INDEXES
-- ============================================

CREATE INDEX idx_layout_elements_template ON page_layout_elements(template_id);

-- ============================================
-- PAPERWORK TEMPLATES INDEXES
-- ============================================

CREATE INDEX idx_paperwork_templates_user ON paperwork_templates(user_id);
CREATE INDEX idx_paperwork_templates_type ON paperwork_templates(report_type);
CREATE INDEX idx_paperwork_templates_system ON paperwork_templates(is_system);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Indexes created successfully! % indexes created.', (
    SELECT COUNT(*) FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN (
      'projects', 'fixtures', 'dimmer_racks', 'dimmer_rack_modules',
      'pd_racks', 'phase_distribution_templates', 'infrastructure_equipment',
      'user_preferences', 'shop_order_projects', 'shop_order_sections',
      'shop_order_items', 'shop_order_revisions', 'shop_order_notes',
      'shop_order_note_templates', 'page_layout_templates',
      'page_layout_elements', 'paperwork_templates'
    )
  );
END $$;
