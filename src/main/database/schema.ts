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
`;
