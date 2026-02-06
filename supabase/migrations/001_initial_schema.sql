-- ============================================
-- ShowStack Database Schema for Supabase
-- ============================================
-- This migration creates the complete ShowStack schema in PostgreSQL
-- Adapted from SQLite schema in apps/desktop/src/main/database/
--
-- Key PostgreSQL Changes:
-- - INTEGER → BIGINT (timestamps)
-- - INTEGER DEFAULT 0 → BOOLEAN (flags)
-- - TEXT (JSON) → JSONB
-- - Added user_id columns for RLS policies
-- - UUID instead of TEXT for primary keys (future)
--
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Owner of the project

  name TEXT NOT NULL,
  description TEXT,
  logo_path TEXT,

  -- Design Team
  lighting_designer TEXT,
  lighting_designer_email TEXT,
  lighting_designer_phone TEXT,
  lighting_associates JSONB, -- Array of strings

  audio_designer TEXT,
  audio_designer_email TEXT,
  audio_designer_phone TEXT,
  audio_associates JSONB, -- Array of strings

  video_designer TEXT,
  video_designer_email TEXT,
  video_designer_phone TEXT,
  video_associates JSONB, -- Array of strings

  -- Production Staff
  electrician TEXT,
  electrician_email TEXT,
  electrician_phone TEXT,

  audio_tech TEXT,
  audio_tech_email TEXT,
  audio_tech_phone TEXT,

  video_tech TEXT,
  video_tech_email TEXT,
  video_tech_phone TEXT,

  production_manager TEXT,
  production_manager_email TEXT,
  production_manager_phone TEXT,
  production_manager_company TEXT,

  general_manager TEXT,
  general_manager_email TEXT,
  general_manager_phone TEXT,
  general_manager_company TEXT,

  -- Venue & Dates
  venue TEXT,
  venue_city TEXT,
  venue_state TEXT,
  show_dates JSONB, -- Object: {prep_start, prep_end, load_in, tech, previews, opening, closing, load_out}

  -- Power Phase Labels (project-wide customization)
  phase_label_a TEXT DEFAULT 'A',
  phase_label_b TEXT DEFAULT 'B',
  phase_label_c TEXT DEFAULT 'C',

  -- Modules
  enabled_modules JSONB, -- Array of module names

  -- Metadata
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ============================================
-- FIXTURES TABLE
-- ============================================

CREATE TABLE fixtures (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Position & Identification
  position TEXT,
  unit_number INTEGER,
  type TEXT,
  manufacturer TEXT,
  model TEXT,
  purpose TEXT,
  mark TEXT,

  -- Control (LightWright: Address, Channel, Universe, DMX #)
  channel TEXT,
  universe INTEGER,
  dmx_address INTEGER,
  mode TEXT,
  console_level TEXT,

  -- Power (LightWright: Dimmer, Circuit Name, Circuit #, Load/Wattage, Dimmer Phase)
  dimmer TEXT,
  circuit TEXT,           -- Circuit name
  circuit_number TEXT,    -- Circuit #
  phase TEXT CHECK(phase IN ('A', 'B', 'C')),
  wattage REAL,          -- Load
  amperage REAL,

  -- Power Distribution Assignments
  dimmer_rack_id TEXT,
  dimmer_module_number INTEGER,
  dimmer_channel_number INTEGER,
  pd_rack_id TEXT,
  pd_circuit_number INTEGER,
  pd_breaker_number INTEGER,

  -- Color & Accessories (LightWright: Color, Gobo, Gobo Size, Accessory, Color Frame)
  color TEXT,
  color_frame TEXT,
  gobo TEXT,
  gobo_size TEXT,
  template_size TEXT,
  accessories JSONB,      -- Array

  -- Cables (LightWright: Cable, Data Cable)
  cable TEXT,
  data_cable TEXT,

  -- Location (LightWright: Position, Location for VW coordinates)
  location TEXT,
  position_x REAL,
  position_y REAL,
  position_z REAL,

  -- Focus (LightWright: Focus L/R, U/D, Note, Cut, Status)
  focus_lr TEXT,
  focus_ud TEXT,
  focus_note TEXT,
  focus_cut_us TEXT,
  focus_cut_ds TEXT,
  focus_cut_sr TEXT,
  focus_cut_sl TEXT,
  focus_cut_top TEXT,
  focus_cut_bottom TEXT,
  focus_status TEXT,

  -- System & Scenery (LightWright: System, Scenery)
  system TEXT,
  scenery TEXT,

  -- Vectorworks Integration (LightWright: Vectorworks submenu)
  vw_layer TEXT,
  vw_label_legend TEXT,
  vw_class TEXT,
  vw_x_coordinate REAL,
  vw_y_coordinate REAL,
  vw_z_coordinate REAL,
  vw_symbol_rotation REAL,
  vw_focus_point TEXT,
  on_light_plot BOOLEAN DEFAULT FALSE, -- Was INTEGER DEFAULT 0
  vw_uid TEXT,
  vw_symbol TEXT,

  -- ShowStack ID (LightWright: Lightwright ID)
  showstack_id TEXT,

  -- Status & Notes
  status TEXT DEFAULT 'active',
  notes TEXT,
  work_note_status TEXT,
  hidden BOOLEAN DEFAULT FALSE, -- Hide fixture from table view
  color_flag TEXT CHECK(color_flag IN ('hot', 'spare', 'special', 'dimmer_doubles', 'two_fer')), -- Label designation

  -- Custom fields (JSONB) - LightWright: User Columns (24)
  custom_fields JSONB,

  -- Audit Trail (LightWright: When, What, and Who Changed)
  changed_at BIGINT,
  changed_what TEXT,
  changed_who TEXT,

  -- Metadata
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ============================================
-- DIMMER RACKS TABLE
-- ============================================

CREATE TABLE dimmer_racks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  rack_identifier TEXT, -- Identifier for circuit naming (e.g., "A", "FOH", "ML", "DECK")
  manufacturer TEXT,
  model TEXT,
  circuit_count INTEGER NOT NULL CHECK(circuit_count IN (12, 24, 48, 96)),
  module_type TEXT DEFAULT 'dimmer' CHECK(module_type IN ('dimmer', 'relay', 'constant_current')),
  channels_per_module INTEGER DEFAULT 12,
  watts_per_module REAL DEFAULT 2400,
  location TEXT,
  notes TEXT,
  building_service TEXT, -- Building electrical service (Service A, B, C, etc.)
  phase_template_id TEXT, -- Phase distribution template (FK added after phase_distribution_templates)

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ============================================
-- DIMMER RACK MODULES TABLE
-- ============================================

CREATE TABLE dimmer_rack_modules (
  id TEXT PRIMARY KEY,
  rack_id TEXT NOT NULL REFERENCES dimmer_racks(id) ON DELETE CASCADE,

  start_circuit INTEGER NOT NULL,
  end_circuit INTEGER NOT NULL,
  module_type TEXT NOT NULL CHECK(module_type IN ('dimmer', 'relay', 'constant_current', 'thrupower')),
  watts_per_circuit REAL DEFAULT 2400,
  notes TEXT,

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ============================================
-- PD (POWER DISTRIBUTION) RACKS TABLE
-- ============================================

CREATE TABLE pd_racks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  rack_identifier TEXT, -- Identifier for circuit naming (e.g., "Z", "FOH", "DECK")
  voltage INTEGER NOT NULL CHECK(voltage IN (120, 208, 230, 240)),
  is_dual_voltage BOOLEAN DEFAULT FALSE,
  secondary_voltage INTEGER, -- Secondary voltage if dual voltage (e.g., 208 when primary is 120)
  circuit_count INTEGER NOT NULL CHECK(circuit_count IN (12, 24, 48, 96)),
  phase_config TEXT CHECK(phase_config IN ('single', 'split', 'three')),
  amps_per_breaker INTEGER DEFAULT 20,
  location TEXT,
  notes TEXT,
  building_service TEXT, -- Building electrical service (Service A, B, C, etc.)
  phase_template_id TEXT, -- Phase distribution template (FK added after phase_distribution_templates)

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ============================================
-- PHASE DISTRIBUTION TEMPLATES TABLE
-- ============================================

CREATE TABLE phase_distribution_templates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  phase_config TEXT NOT NULL CHECK(phase_config IN ('single', 'split', 'three')),
  circuit_count INTEGER NOT NULL CHECK(circuit_count IN (12, 24, 48, 96)),
  phase_distribution JSONB NOT NULL, -- Object: {"1": "A", "2": "B", "3": "A", ...}
  is_system BOOLEAN DEFAULT FALSE, -- System templates (built-in) vs user templates

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Add foreign key constraints for phase_template_id
ALTER TABLE dimmer_racks
  ADD CONSTRAINT fk_dimmer_racks_phase_template
  FOREIGN KEY (phase_template_id) REFERENCES phase_distribution_templates(id) ON DELETE SET NULL;

ALTER TABLE pd_racks
  ADD CONSTRAINT fk_pd_racks_phase_template
  FOREIGN KEY (phase_template_id) REFERENCES phase_distribution_templates(id) ON DELETE SET NULL;

-- ============================================
-- INFRASTRUCTURE EQUIPMENT TABLE
-- ============================================

CREATE TABLE infrastructure_equipment (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Core identification
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  quantity INTEGER DEFAULT 1,
  category TEXT, -- 'network', 'data_distribution', 'audio', 'video'

  -- Network information (for network switches, routers, etc.)
  ip_address TEXT,
  mac_address TEXT,
  subnet_mask TEXT,
  gateway TEXT,
  vlan_id INTEGER,
  hostname TEXT,

  -- Port assignments (JSONB array)
  -- Format: [{port: 1, connected_to: 'Device Name', type: 'ethernet/dmx/fiber', vlan: 10, status: 'active'}]
  port_assignments JSONB,
  port_count INTEGER DEFAULT 0,

  -- Power information
  voltage INTEGER,
  amperage REAL,
  wattage REAL,
  phase TEXT,

  -- Power rack linking (same as fixtures)
  dimmer_rack_id TEXT,
  dimmer_channel_number INTEGER,
  pd_rack_id TEXT,
  pd_circuit_number INTEGER,
  pd_breaker_number INTEGER,
  circuit TEXT,
  circuit_number INTEGER,

  -- Location
  location TEXT,
  position_x REAL,
  position_y REAL,
  position_z REAL,

  -- Notes & Status
  notes TEXT,
  status TEXT DEFAULT 'Active', -- 'Active', 'Spare', 'Needs Repair', 'Offline'

  -- Metadata
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================

CREATE TABLE user_preferences (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,

  UNIQUE(project_id, preference_key)
);

-- ============================================
-- SHOP ORDER MODULE TABLES
-- ============================================

-- Shop Order Projects table (shop orders for equipment rental)
CREATE TABLE shop_order_projects (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_project_id TEXT, -- Optional link to parent ShowStack project

  -- Production Information
  production_name TEXT NOT NULL,
  venue TEXT,
  venue_city TEXT,
  venue_state TEXT,
  order_date BIGINT NOT NULL,
  original_order_date BIGINT,

  -- Show Dates
  prep_start_date TEXT,
  prep_end_date TEXT,
  load_in_date TEXT,
  first_preview_date TEXT,
  opening_night_date TEXT,
  closing_date TEXT,
  load_out_date TEXT,

  -- Contact Information
  gm_name TEXT,
  gm_company TEXT,
  gm_email TEXT,
  gm_phone TEXT,
  pm_name TEXT,
  pm_company TEXT,
  pm_email TEXT,
  pm_phone TEXT,
  ld_name TEXT,
  ld_email TEXT,
  ld_phone TEXT,
  ald_name TEXT,
  ald_email TEXT,
  ald_phone TEXT,
  pe_name TEXT,
  pe_email TEXT,
  pe_phone TEXT,

  -- Additional discipline contacts (JSONB)
  additional_contacts JSONB,

  -- Logo
  logo_url TEXT,
  logo_storage_path TEXT,

  -- Disciplines (JSONB array: ["lighting", "audio", "video", etc.])
  disciplines JSONB NOT NULL DEFAULT '["lighting"]'::jsonb,

  -- Current revision number (0-5)
  current_revision INTEGER DEFAULT 0,

  -- Metadata
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Shop Order Sections table (e.g., "Moving Lights", "LED Fixtures")
CREATE TABLE shop_order_sections (
  id TEXT PRIMARY KEY,
  prep_project_id TEXT NOT NULL REFERENCES shop_order_projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  page_break BOOLEAN DEFAULT FALSE,
  notes TEXT, -- Optional section notes displayed below section header

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Shop Order Items table
CREATE TABLE shop_order_items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES shop_order_sections(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  active_qty INTEGER DEFAULT 0,
  spare_qty INTEGER DEFAULT 0,
  venue_qty INTEGER DEFAULT 0,

  -- Calculated fields (stored for performance)
  total_qty INTEGER DEFAULT 0,
  venue_active INTEGER DEFAULT 0,
  venue_spare INTEGER DEFAULT 0,

  -- Optional fields
  weight REAL,
  power REAL,
  notes TEXT,

  sort_order INTEGER NOT NULL,

  -- Revision tracking
  added_in_revision INTEGER,
  removed_in_revision INTEGER,
  modified_in_revision INTEGER,

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Shop Order Revisions table
CREATE TABLE shop_order_revisions (
  id TEXT PRIMARY KEY,
  prep_project_id TEXT NOT NULL REFERENCES shop_order_projects(id) ON DELETE CASCADE,

  revision_number INTEGER NOT NULL,
  revision_date BIGINT NOT NULL,
  notes TEXT,
  change_log JSONB, -- Automatically generated change summary

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,

  UNIQUE(prep_project_id, revision_number)
);

-- Shop Order Notes table (3-tier: general conditions, general notes, fixture notes, revision)
CREATE TABLE shop_order_notes (
  id TEXT PRIMARY KEY,
  prep_project_id TEXT NOT NULL REFERENCES shop_order_projects(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK(type IN ('general_conditions', 'general_notes', 'fixture_notes', 'revision')),
  content TEXT NOT NULL,

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Shop Order Note Templates (for standard language)
CREATE TABLE shop_order_note_templates (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK(type IN ('general_conditions', 'general_notes', 'fixture_notes')),
  name TEXT NOT NULL, -- e.g., "Standard Lighting Conditions"
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ============================================
-- APP-LEVEL TABLES (User Preferences & Templates)
-- ============================================

-- Page Layout Templates (visual design for each page type)
CREATE TABLE page_layout_templates (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  page_type TEXT NOT NULL, -- 'cover', 'contacts', 'notes', etc.
  grid_columns INTEGER NOT NULL DEFAULT 12,
  grid_rows INTEGER NOT NULL DEFAULT 20,
  grid_gap INTEGER NOT NULL DEFAULT 8, -- pixels
  page_width INTEGER NOT NULL DEFAULT 816, -- 8.5" at 96 DPI
  page_height INTEGER NOT NULL DEFAULT 1056, -- 11" at 96 DPI
  config JSONB, -- backgroundColor, etc.
  is_default BOOLEAN DEFAULT FALSE,

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Layout Elements (items placed on the canvas)
CREATE TABLE page_layout_elements (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES page_layout_templates(id) ON DELETE CASCADE,

  element_type TEXT NOT NULL CHECK(element_type IN ('dataField', 'text', 'image', 'table', 'shape', 'equipment_list', 'notes_content', 'revision_log')),
  config JSONB NOT NULL, -- Type-specific configuration
  grid_column INTEGER NOT NULL,
  grid_row INTEGER NOT NULL,
  column_span INTEGER NOT NULL DEFAULT 1,
  row_span INTEGER NOT NULL DEFAULT 1,
  layer INTEGER NOT NULL DEFAULT 0,
  style JSONB NOT NULL, -- Font, color, alignment, borders, etc.

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Paperwork Templates (column configurations for all 12 report types)
CREATE TABLE paperwork_templates (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL, -- 'channel-hookup', 'dimmer-schedule', etc.

  -- References to page_layout_templates for header/footer
  header_template_id TEXT REFERENCES page_layout_templates(id),
  footer_template_id TEXT REFERENCES page_layout_templates(id),

  -- Column configuration (JSONB array of PaperworkColumnConfig)
  column_config JSONB NOT NULL,

  -- Organization configuration (JSONB object of ReportOrganization)
  organization_config JSONB NOT NULL,

  -- Page setup (JSONB object of PageSetup)
  page_setup JSONB NOT NULL,

  is_system BOOLEAN DEFAULT FALSE, -- System templates cannot be deleted

  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

-- If this runs successfully, the schema is deployed!
DO $$
BEGIN
  RAISE NOTICE 'ShowStack schema deployed successfully! % tables created.', (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  );
END $$;
