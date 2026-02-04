/**
 * Project-level database schema
 * This database stores all project data and is used for import/export
 */
export const PROJECT_SCHEMA = `
  -- ============================================
  -- PROJECTS TABLE
  -- ============================================

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_path TEXT,

    -- Design Team
    lighting_designer TEXT,
    lighting_designer_email TEXT,
    lighting_designer_phone TEXT,
    lighting_associates TEXT, -- JSON array
    audio_designer TEXT,
    audio_designer_email TEXT,
    audio_designer_phone TEXT,
    audio_associates TEXT, -- JSON array
    video_designer TEXT,
    video_designer_email TEXT,
    video_designer_phone TEXT,
    video_associates TEXT, -- JSON array

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
    show_dates TEXT, -- JSON object: {prep_start, prep_end, load_in, tech, previews, opening, closing, load_out}

    -- Power Phase Labels (project-wide customization)
    phase_label_a TEXT DEFAULT 'A',
    phase_label_b TEXT DEFAULT 'B',
    phase_label_c TEXT DEFAULT 'C',

    enabled_modules TEXT, -- JSON array of module names
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- ============================================
  -- PRODUCTION MODULE TABLES
  -- ============================================

  -- Fixtures table
  CREATE TABLE IF NOT EXISTS fixtures (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,

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
    accessories TEXT,      -- JSON array

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
    on_light_plot INTEGER DEFAULT 0, -- Boolean
    vw_uid TEXT,
    vw_symbol TEXT,

    -- ShowStack ID (LightWright: Lightwright ID)
    showstack_id TEXT,

    -- Status & Notes
    status TEXT DEFAULT 'active',
    notes TEXT,
    work_note_status TEXT,
    hidden INTEGER DEFAULT 0, -- Hide fixture from table view
    color_flag TEXT CHECK(color_flag IN ('hot', 'spare', 'special', 'dimmer_doubles', 'two_fer')), -- Label designation

    -- Custom fields (JSON) - LightWright: User Columns (24)
    custom_fields TEXT,

    -- Audit Trail (LightWright: When, What, and Who Changed)
    changed_at INTEGER,
    changed_what TEXT,
    changed_who TEXT,

    -- Metadata
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    -- Note: Foreign keys for power racks are added by migrations to handle existing databases
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_fixtures_project ON fixtures(project_id);
  CREATE INDEX IF NOT EXISTS idx_fixtures_position ON fixtures(project_id, position);
  CREATE INDEX IF NOT EXISTS idx_fixtures_channel ON fixtures(project_id, channel);
  CREATE INDEX IF NOT EXISTS idx_fixtures_location ON fixtures(project_id, location);

  -- Dimmer Racks table (power distribution for dimmed loads)
  CREATE TABLE IF NOT EXISTS dimmer_racks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,

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
    phase_template_id TEXT, -- Phase distribution template

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_template_id) REFERENCES phase_distribution_templates(id) ON DELETE SET NULL
  );

  -- Dimmer Rack Modules table (defines module types for circuit ranges)
  CREATE TABLE IF NOT EXISTS dimmer_rack_modules (
    id TEXT PRIMARY KEY,
    rack_id TEXT NOT NULL,
    start_circuit INTEGER NOT NULL,
    end_circuit INTEGER NOT NULL,
    module_type TEXT NOT NULL CHECK(module_type IN ('dimmer', 'relay', 'constant_current', 'thrupower')),
    watts_per_circuit REAL DEFAULT 2400,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (rack_id) REFERENCES dimmer_racks(id) ON DELETE CASCADE
  );

  -- PD (Power Distribution) Racks table (direct power for non-dimmed loads)
  CREATE TABLE IF NOT EXISTS pd_racks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,

    name TEXT NOT NULL,
    rack_identifier TEXT, -- Identifier for circuit naming (e.g., "Z", "FOH", "DECK")
    voltage INTEGER NOT NULL CHECK(voltage IN (120, 208, 230, 240)),
    is_dual_voltage INTEGER DEFAULT 0, -- Boolean: rack has both 120V and 208V outputs
    secondary_voltage INTEGER, -- Secondary voltage if dual voltage (e.g., 208 when primary is 120)
    circuit_count INTEGER NOT NULL CHECK(circuit_count IN (12, 24, 48, 96)),
    phase_config TEXT CHECK(phase_config IN ('single', 'split', 'three')),
    amps_per_breaker INTEGER DEFAULT 20,
    location TEXT,
    notes TEXT,
    building_service TEXT, -- Building electrical service (Service A, B, C, etc.)
    phase_template_id TEXT, -- Phase distribution template

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_template_id) REFERENCES phase_distribution_templates(id) ON DELETE SET NULL
  );

  -- Indexes for power racks
  CREATE INDEX IF NOT EXISTS idx_dimmer_racks_project ON dimmer_racks(project_id);
  CREATE INDEX IF NOT EXISTS idx_pd_racks_project ON pd_racks(project_id);
  -- Note: Indexes on fixtures power columns are created by migrations to handle existing databases

  -- Phase Distribution Templates table (save/load phase configurations for racks)
  CREATE TABLE IF NOT EXISTS phase_distribution_templates (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    phase_config TEXT NOT NULL CHECK(phase_config IN ('single', 'split', 'three')),
    circuit_count INTEGER NOT NULL CHECK(circuit_count IN (12, 24, 48, 96)),
    phase_distribution TEXT NOT NULL, -- JSON: {"1": "A", "2": "B", "3": "A", ...}
    is_system INTEGER DEFAULT 0, -- System templates (built-in) vs user templates
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_phase_templates_project ON phase_distribution_templates(project_id);
  CREATE INDEX IF NOT EXISTS idx_phase_templates_system ON phase_distribution_templates(is_system);

  -- Infrastructure Equipment table (network switches, opto splitters, DMX gateways, etc.)
  CREATE TABLE IF NOT EXISTS infrastructure_equipment (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,

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

    -- Port assignments (JSON array)
    -- Format: [{port: 1, connected_to: 'Device Name', type: 'ethernet/dmx/fiber', vlan: 10, status: 'active'}]
    port_assignments TEXT, -- JSON
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
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  -- Indexes for infrastructure equipment
  CREATE INDEX IF NOT EXISTS idx_infrastructure_project ON infrastructure_equipment(project_id);
  CREATE INDEX IF NOT EXISTS idx_infrastructure_category ON infrastructure_equipment(project_id, category);
  CREATE INDEX IF NOT EXISTS idx_infrastructure_location ON infrastructure_equipment(project_id, location);

  -- User Preferences table (per-project column settings, etc.)
  CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value TEXT NOT NULL, -- JSON
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(project_id, preference_key),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_preferences_project ON user_preferences(project_id);

  -- ============================================
  -- SHOP ORDER MODULE TABLES
  -- ============================================

  -- Shop Order Projects table (shop orders for equipment rental)
  CREATE TABLE IF NOT EXISTS shop_order_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    parent_project_id TEXT, -- Optional link to parent ShowStack project

    -- Production Information
    production_name TEXT NOT NULL,
    venue TEXT,
    venue_city TEXT,
    venue_state TEXT,
    order_date INTEGER NOT NULL,
    original_order_date INTEGER,

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

    -- Additional discipline contacts (JSON)
    additional_contacts TEXT,

    -- Logo
    logo_url TEXT,
    logo_storage_path TEXT,

    -- Disciplines (JSON array: ["lighting", "audio", "video", etc.])
    disciplines TEXT NOT NULL DEFAULT '["lighting"]',

    -- Current revision number (1-5)
    current_revision INTEGER DEFAULT 0,

    -- Metadata
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Shop Order Sections table (e.g., "Moving Lights", "LED Fixtures")
  CREATE TABLE IF NOT EXISTS shop_order_sections (
    id TEXT PRIMARY KEY,
    prep_project_id TEXT NOT NULL, -- TODO Phase 0.4: Rename to shop_order_project_id

    name TEXT NOT NULL,
    discipline TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    page_break INTEGER DEFAULT 0,
    notes TEXT, -- Optional section notes displayed below section header

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (prep_project_id) REFERENCES shop_order_projects(id) ON DELETE CASCADE
  );

  -- Shop Order Items table
  CREATE TABLE IF NOT EXISTS shop_order_items (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL,

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

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (section_id) REFERENCES shop_order_sections(id) ON DELETE CASCADE
  );

  -- Shop Order Revisions table
  CREATE TABLE IF NOT EXISTS shop_order_revisions (
    id TEXT PRIMARY KEY,
    prep_project_id TEXT NOT NULL, -- TODO Phase 0.4: Rename to shop_order_project_id

    revision_number INTEGER NOT NULL,
    revision_date INTEGER NOT NULL,
    notes TEXT,
    change_log TEXT, -- JSON: automatically generated change summary

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    UNIQUE(prep_project_id, revision_number),
    FOREIGN KEY (prep_project_id) REFERENCES shop_order_projects(id) ON DELETE CASCADE
  );

  -- Shop Order Notes table (3-tier: general conditions, general notes, fixture notes, revision)
  CREATE TABLE IF NOT EXISTS shop_order_notes (
    id TEXT PRIMARY KEY,
    prep_project_id TEXT NOT NULL, -- TODO Phase 0.4: Rename to shop_order_project_id

    type TEXT NOT NULL CHECK(type IN ('general_conditions', 'general_notes', 'fixture_notes', 'revision')),
    content TEXT NOT NULL,

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (prep_project_id) REFERENCES shop_order_projects(id) ON DELETE CASCADE
  );

  -- Shop Order Note Templates (for standard language)
  CREATE TABLE IF NOT EXISTS shop_order_note_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT,

    type TEXT NOT NULL CHECK(type IN ('general_conditions', 'general_notes', 'fixture_notes')),
    name TEXT NOT NULL, -- e.g., "Standard Lighting Conditions"
    content TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Indexes for Shop Order tables
  CREATE INDEX IF NOT EXISTS idx_shop_order_sections_project ON shop_order_sections(prep_project_id);
  CREATE INDEX IF NOT EXISTS idx_shop_order_items_section ON shop_order_items(section_id);
  CREATE INDEX IF NOT EXISTS idx_shop_order_revisions_project ON shop_order_revisions(prep_project_id);
  CREATE INDEX IF NOT EXISTS idx_shop_order_notes_project ON shop_order_notes(prep_project_id);
  CREATE INDEX IF NOT EXISTS idx_shop_order_notes_type ON shop_order_notes(prep_project_id, type);
  CREATE INDEX IF NOT EXISTS idx_shop_order_note_templates_type ON shop_order_note_templates(type);
  CREATE INDEX IF NOT EXISTS idx_shop_order_note_templates_default ON shop_order_note_templates(type, is_default);
`;
