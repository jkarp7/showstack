export const SCHEMA = `
  -- Projects table
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    venue TEXT,
    designer TEXT,
    logo_path TEXT,
    enabled_modules TEXT, -- JSON array of module names
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

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
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_fixtures_project ON fixtures(project_id);
  CREATE INDEX IF NOT EXISTS idx_fixtures_position ON fixtures(project_id, position);
  CREATE INDEX IF NOT EXISTS idx_fixtures_channel ON fixtures(project_id, channel);
  CREATE INDEX IF NOT EXISTS idx_fixtures_location ON fixtures(project_id, location);

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
  -- SHOWSTACK:PREP TABLES
  -- ============================================

  -- Prep Projects table (shop orders for equipment rental)
  CREATE TABLE IF NOT EXISTS prep_projects (
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

  -- Prep Sections table (e.g., "Moving Lights", "LED Fixtures")
  CREATE TABLE IF NOT EXISTS prep_sections (
    id TEXT PRIMARY KEY,
    prep_project_id TEXT NOT NULL,

    name TEXT NOT NULL,
    discipline TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    page_break INTEGER DEFAULT 0,
    notes TEXT, -- Optional section notes displayed below section header

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (prep_project_id) REFERENCES prep_projects(id) ON DELETE CASCADE
  );

  -- Prep Equipment Items table
  CREATE TABLE IF NOT EXISTS prep_equipment_items (
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

    FOREIGN KEY (section_id) REFERENCES prep_sections(id) ON DELETE CASCADE
  );

  -- Prep Revisions table
  CREATE TABLE IF NOT EXISTS prep_revisions (
    id TEXT PRIMARY KEY,
    prep_project_id TEXT NOT NULL,

    revision_number INTEGER NOT NULL,
    revision_date INTEGER NOT NULL,
    notes TEXT,
    change_log TEXT, -- JSON: automatically generated change summary

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    UNIQUE(prep_project_id, revision_number),
    FOREIGN KEY (prep_project_id) REFERENCES prep_projects(id) ON DELETE CASCADE
  );

  -- Prep Notes table (3-tier: general conditions, general notes, fixture notes, revision)
  CREATE TABLE IF NOT EXISTS prep_notes (
    id TEXT PRIMARY KEY,
    prep_project_id TEXT NOT NULL,

    type TEXT NOT NULL CHECK(type IN ('general_conditions', 'general_notes', 'fixture_notes', 'revision')),
    content TEXT NOT NULL,

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (prep_project_id) REFERENCES prep_projects(id) ON DELETE CASCADE
  );

  -- Prep Note Templates (for standard language)
  CREATE TABLE IF NOT EXISTS prep_note_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT,

    type TEXT NOT NULL CHECK(type IN ('general_conditions', 'general_notes', 'fixture_notes')),
    name TEXT NOT NULL, -- e.g., "Standard Lighting Conditions"
    content TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Indexes for Prep tables
  CREATE INDEX IF NOT EXISTS idx_prep_sections_project ON prep_sections(prep_project_id);
  CREATE INDEX IF NOT EXISTS idx_prep_items_section ON prep_equipment_items(section_id);
  CREATE INDEX IF NOT EXISTS idx_prep_revisions_project ON prep_revisions(prep_project_id);
  CREATE INDEX IF NOT EXISTS idx_prep_notes_project ON prep_notes(prep_project_id);
  CREATE INDEX IF NOT EXISTS idx_prep_notes_type ON prep_notes(prep_project_id, type);
  CREATE INDEX IF NOT EXISTS idx_prep_note_templates_type ON prep_note_templates(type);
  CREATE INDEX IF NOT EXISTS idx_prep_note_templates_default ON prep_note_templates(type, is_default);

  -- ============================================
  -- LICENSING & SETTINGS TABLES
  -- ============================================

  -- Application Settings (stored as JSON)
  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data TEXT NOT NULL, -- JSON stringified AppSettings
    updated_at INTEGER NOT NULL,
    CHECK (id = 1) -- Ensure only one settings record
  );

  -- User Licenses
  CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    license_key TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL CHECK(tier IN ('professional', 'student', 'institutional')),
    status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'suspended', 'deleted')),
    modules TEXT NOT NULL, -- JSON stringified ModuleAccess[]
    expiration_date INTEGER NOT NULL,
    last_verified INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Indexes for License tables
  CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
  CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
  CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
`;
