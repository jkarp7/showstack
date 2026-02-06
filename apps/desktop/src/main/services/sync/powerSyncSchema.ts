/**
 * PowerSync Schema Definition
 *
 * Defines the local SQLite schema for PowerSync sync.
 * Must match the Supabase PostgreSQL schema structure.
 *
 * PowerSync types map to SQLite:
 * - column.text → TEXT
 * - column.integer → INTEGER
 * - column.real → REAL
 *
 * Note: JSONB columns from Postgres are stored as TEXT (JSON strings)
 * Note: BIGINT timestamps are stored as INTEGER
 * Note: UUID columns are stored as TEXT
 */

import { column, Schema, Table } from '@powersync/web';

// ============================================
// PROJECTS TABLE
// ============================================

const projects = new Table({
  // Core
  user_id: column.text,
  name: column.text,
  description: column.text,
  logo_path: column.text,

  // Design Team - Lighting
  lighting_designer: column.text,
  lighting_designer_email: column.text,
  lighting_designer_phone: column.text,
  lighting_associates: column.text, // JSONB → TEXT

  // Design Team - Audio
  audio_designer: column.text,
  audio_designer_email: column.text,
  audio_designer_phone: column.text,
  audio_associates: column.text, // JSONB → TEXT

  // Design Team - Video
  video_designer: column.text,
  video_designer_email: column.text,
  video_designer_phone: column.text,
  video_associates: column.text, // JSONB → TEXT

  // Production Staff
  electrician: column.text,
  electrician_email: column.text,
  electrician_phone: column.text,

  audio_tech: column.text,
  audio_tech_email: column.text,
  audio_tech_phone: column.text,

  video_tech: column.text,
  video_tech_email: column.text,
  video_tech_phone: column.text,

  production_manager: column.text,
  production_manager_email: column.text,
  production_manager_phone: column.text,
  production_manager_company: column.text,

  general_manager: column.text,
  general_manager_email: column.text,
  general_manager_phone: column.text,
  general_manager_company: column.text,

  // Venue & Dates
  venue: column.text,
  venue_city: column.text,
  venue_state: column.text,
  show_dates: column.text, // JSONB → TEXT

  // Phase Labels
  phase_label_a: column.text,
  phase_label_b: column.text,
  phase_label_c: column.text,

  // Modules
  enabled_modules: column.text, // JSONB → TEXT

  // Metadata
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// FIXTURES TABLE
// ============================================

const fixtures = new Table({
  project_id: column.text,

  // Position & Identification
  position: column.text,
  unit_number: column.integer,
  type: column.text,
  manufacturer: column.text,
  model: column.text,
  purpose: column.text,
  mark: column.text,

  // Control
  channel: column.text,
  universe: column.integer,
  dmx_address: column.integer,
  mode: column.text,
  console_level: column.text,

  // Power
  dimmer: column.text,
  circuit: column.text,
  circuit_number: column.text,
  phase: column.text,
  wattage: column.real,
  amperage: column.real,

  // Power Distribution Assignments
  dimmer_rack_id: column.text,
  dimmer_module_number: column.integer,
  dimmer_channel_number: column.integer,
  pd_rack_id: column.text,
  pd_circuit_number: column.integer,
  pd_breaker_number: column.integer,

  // Color & Accessories
  color: column.text,
  color_frame: column.text,
  gobo: column.text,
  gobo_size: column.text,
  template_size: column.text,
  accessories: column.text, // JSONB → TEXT

  // Cables
  cable: column.text,
  data_cable: column.text,

  // Location
  location: column.text,
  position_x: column.real,
  position_y: column.real,
  position_z: column.real,

  // Focus
  focus_lr: column.text,
  focus_ud: column.text,
  focus_note: column.text,
  focus_cut_us: column.text,
  focus_cut_ds: column.text,
  focus_cut_sr: column.text,
  focus_cut_sl: column.text,
  focus_cut_top: column.text,
  focus_cut_bottom: column.text,
  focus_status: column.text,

  // System & Scenery
  system: column.text,
  scenery: column.text,

  // Vectorworks Integration
  vw_layer: column.text,
  vw_label_legend: column.text,
  vw_class: column.text,
  vw_x_coordinate: column.real,
  vw_y_coordinate: column.real,
  vw_z_coordinate: column.real,
  vw_symbol_rotation: column.real,
  vw_focus_point: column.text,
  on_light_plot: column.integer, // BOOLEAN → INTEGER (0/1)
  vw_uid: column.text,
  vw_symbol: column.text,

  // ShowStack ID
  showstack_id: column.text,

  // Status & Notes
  status: column.text,
  notes: column.text,
  work_note_status: column.text,
  hidden: column.integer, // BOOLEAN → INTEGER (0/1)
  color_flag: column.text,

  // Custom fields
  custom_fields: column.text, // JSONB → TEXT

  // Audit Trail
  changed_at: column.integer,
  changed_what: column.text,
  changed_who: column.text,

  // Metadata
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// DIMMER RACKS TABLE
// ============================================

const dimmer_racks = new Table({
  project_id: column.text,
  name: column.text,
  rack_identifier: column.text,
  manufacturer: column.text,
  model: column.text,
  circuit_count: column.integer,
  module_type: column.text,
  channels_per_module: column.integer,
  watts_per_module: column.real,
  location: column.text,
  notes: column.text,
  building_service: column.text,
  phase_template_id: column.text,
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// DIMMER RACK MODULES TABLE
// ============================================

const dimmer_rack_modules = new Table({
  rack_id: column.text,
  start_circuit: column.integer,
  end_circuit: column.integer,
  module_type: column.text,
  watts_per_circuit: column.real,
  notes: column.text,
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// PD RACKS TABLE
// ============================================

const pd_racks = new Table({
  project_id: column.text,
  name: column.text,
  rack_identifier: column.text,
  voltage: column.integer,
  is_dual_voltage: column.integer, // BOOLEAN → INTEGER
  secondary_voltage: column.integer,
  circuit_count: column.integer,
  phase_config: column.text,
  amps_per_breaker: column.integer,
  location: column.text,
  notes: column.text,
  building_service: column.text,
  phase_template_id: column.text,
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// PHASE DISTRIBUTION TEMPLATES TABLE
// ============================================

const phase_distribution_templates = new Table({
  project_id: column.text,
  name: column.text,
  description: column.text,
  phase_config: column.text,
  circuit_count: column.integer,
  phase_distribution: column.text, // JSONB → TEXT
  is_system: column.integer, // BOOLEAN → INTEGER
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// INFRASTRUCTURE EQUIPMENT TABLE
// ============================================

const infrastructure_equipment = new Table({
  project_id: column.text,

  // Core identification
  name: column.text,
  manufacturer: column.text,
  model: column.text,
  quantity: column.integer,
  category: column.text,

  // Network information
  ip_address: column.text,
  mac_address: column.text,
  subnet_mask: column.text,
  gateway: column.text,
  vlan_id: column.integer,
  hostname: column.text,

  // Port assignments
  port_assignments: column.text, // JSONB → TEXT
  port_count: column.integer,

  // Power information
  voltage: column.integer,
  amperage: column.real,
  wattage: column.real,
  phase: column.text,

  // Power rack linking
  dimmer_rack_id: column.text,
  dimmer_channel_number: column.integer,
  pd_rack_id: column.text,
  pd_circuit_number: column.integer,
  pd_breaker_number: column.integer,
  circuit: column.text,
  circuit_number: column.integer,

  // Location
  location: column.text,
  position_x: column.real,
  position_y: column.real,
  position_z: column.real,

  // Notes & Status
  notes: column.text,
  status: column.text,

  // Metadata
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// USER PREFERENCES TABLE
// ============================================

const user_preferences = new Table({
  project_id: column.text,
  preference_key: column.text,
  preference_value: column.text, // JSONB → TEXT
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// SHOP ORDER PROJECTS TABLE
// ============================================

const shop_order_projects = new Table({
  user_id: column.text,
  parent_project_id: column.text,

  // Production Information
  production_name: column.text,
  venue: column.text,
  venue_city: column.text,
  venue_state: column.text,
  order_date: column.integer,
  original_order_date: column.integer,

  // Show Dates
  prep_start_date: column.text,
  prep_end_date: column.text,
  load_in_date: column.text,
  first_preview_date: column.text,
  opening_night_date: column.text,
  closing_date: column.text,
  load_out_date: column.text,

  // Contact Information
  gm_name: column.text,
  gm_company: column.text,
  gm_email: column.text,
  gm_phone: column.text,
  pm_name: column.text,
  pm_company: column.text,
  pm_email: column.text,
  pm_phone: column.text,
  ld_name: column.text,
  ld_email: column.text,
  ld_phone: column.text,
  ald_name: column.text,
  ald_email: column.text,
  ald_phone: column.text,
  pe_name: column.text,
  pe_email: column.text,
  pe_phone: column.text,

  // Additional contacts
  additional_contacts: column.text, // JSONB → TEXT

  // Logo
  logo_url: column.text,
  logo_storage_path: column.text,

  // Disciplines
  disciplines: column.text, // JSONB → TEXT

  // Revision
  current_revision: column.integer,

  // Metadata
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// SHOP ORDER SECTIONS TABLE
// ============================================

const shop_order_sections = new Table({
  prep_project_id: column.text,
  name: column.text,
  discipline: column.text,
  sort_order: column.integer,
  page_break: column.integer, // BOOLEAN → INTEGER
  notes: column.text,
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// SHOP ORDER ITEMS TABLE
// ============================================

const shop_order_items = new Table({
  section_id: column.text,
  description: column.text,
  active_qty: column.integer,
  spare_qty: column.integer,
  venue_qty: column.integer,
  total_qty: column.integer,
  venue_active: column.integer,
  venue_spare: column.integer,
  weight: column.real,
  power: column.real,
  notes: column.text,
  sort_order: column.integer,
  added_in_revision: column.integer,
  removed_in_revision: column.integer,
  modified_in_revision: column.integer,
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// SHOP ORDER REVISIONS TABLE
// ============================================

const shop_order_revisions = new Table({
  prep_project_id: column.text,
  revision_number: column.integer,
  revision_date: column.integer,
  notes: column.text,
  change_log: column.text, // JSONB → TEXT
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// SHOP ORDER NOTES TABLE
// ============================================

const shop_order_notes = new Table({
  prep_project_id: column.text,
  type: column.text,
  content: column.text,
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// SHOP ORDER NOTE TEMPLATES TABLE
// ============================================

const shop_order_note_templates = new Table({
  user_id: column.text,
  type: column.text,
  name: column.text,
  content: column.text,
  is_default: column.integer, // BOOLEAN → INTEGER
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// PAGE LAYOUT TEMPLATES TABLE
// ============================================

const page_layout_templates = new Table({
  user_id: column.text,
  name: column.text,
  description: column.text,
  page_type: column.text,
  grid_columns: column.integer,
  grid_rows: column.integer,
  grid_gap: column.integer,
  page_width: column.integer,
  page_height: column.integer,
  config: column.text, // JSONB → TEXT
  is_default: column.integer, // BOOLEAN → INTEGER
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// PAGE LAYOUT ELEMENTS TABLE
// ============================================

const page_layout_elements = new Table({
  template_id: column.text,
  element_type: column.text,
  config: column.text, // JSONB → TEXT
  grid_column: column.integer,
  grid_row: column.integer,
  column_span: column.integer,
  row_span: column.integer,
  layer: column.integer,
  style: column.text, // JSONB → TEXT
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// PAPERWORK TEMPLATES TABLE
// ============================================

const paperwork_templates = new Table({
  user_id: column.text,
  name: column.text,
  description: column.text,
  report_type: column.text,
  header_template_id: column.text,
  footer_template_id: column.text,
  column_config: column.text, // JSONB → TEXT
  organization_config: column.text, // JSONB → TEXT
  page_setup: column.text, // JSONB → TEXT
  is_system: column.integer, // BOOLEAN → INTEGER
  created_at: column.integer,
  updated_at: column.integer,
});

// ============================================
// EXPORT SCHEMA
// ============================================

export const AppSchema = new Schema({
  projects,
  fixtures,
  dimmer_racks,
  dimmer_rack_modules,
  pd_racks,
  phase_distribution_templates,
  infrastructure_equipment,
  user_preferences,
  shop_order_projects,
  shop_order_sections,
  shop_order_items,
  shop_order_revisions,
  shop_order_notes,
  shop_order_note_templates,
  page_layout_templates,
  page_layout_elements,
  paperwork_templates,
});

// Export individual tables for type inference
export {
  projects,
  fixtures,
  dimmer_racks,
  dimmer_rack_modules,
  pd_racks,
  phase_distribution_templates,
  infrastructure_equipment,
  user_preferences,
  shop_order_projects,
  shop_order_sections,
  shop_order_items,
  shop_order_revisions,
  shop_order_notes,
  shop_order_note_templates,
  page_layout_templates,
  page_layout_elements,
  paperwork_templates,
};

// Type for the schema
export type Database = (typeof AppSchema)['types'];
