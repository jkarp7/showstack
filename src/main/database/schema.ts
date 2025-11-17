export const SCHEMA = `
  -- Projects table
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    venue TEXT,
    designer TEXT,
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

    -- Control
    channel TEXT,
    universe INTEGER,
    dmx_address INTEGER,
    mode TEXT,

    -- Power
    dimmer TEXT,
    circuit TEXT,
    phase TEXT CHECK(phase IN ('A', 'B', 'C')),
    wattage REAL,
    amperage REAL,

    -- Color & Accessories
    color TEXT,
    gobo TEXT,
    template_size TEXT,
    accessories TEXT, -- JSON array

    -- Location
    location TEXT,
    position_x REAL,
    position_y REAL,
    position_z REAL,

    -- Status
    status TEXT DEFAULT 'active',
    notes TEXT,

    -- Custom fields (JSON)
    custom_fields TEXT,

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
`;
