/**
 * Application-level database schema
 * This database stores app-wide data that should NEVER be affected by project files
 */
export const APP_SCHEMA = `
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

  -- Key-Value Settings (for specific settings like admin password)
  CREATE TABLE IF NOT EXISTS app_settings_kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- User Licenses
  CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    license_key TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL CHECK(tier IN ('professional', 'student', 'institutional', 'demo')),
    status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'suspended', 'deleted')),
    modules TEXT NOT NULL, -- JSON stringified ModuleAccess[]
    expiration_date INTEGER NOT NULL,
    maintenance_end_date INTEGER, -- Unix timestamp, defaults to expiration_date if null
    user_id TEXT,
    cloud_sync INTEGER NOT NULL DEFAULT 1, -- 1=enabled, 0=disabled; default true for backwards compat
    last_verified INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Indexes for License tables
  CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
  CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
  CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

  -- ============================================
  -- PAGE LAYOUT TEMPLATES (USER PREFERENCES)
  -- ============================================

  -- Page Layout Templates (visual design for each page type)
  -- Stored at app level so users can reuse templates across projects
  CREATE TABLE IF NOT EXISTS page_layout_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    page_type TEXT NOT NULL, -- 'cover', 'contacts', 'notes', etc.
    grid_columns INTEGER NOT NULL DEFAULT 12,
    grid_rows INTEGER NOT NULL DEFAULT 20,
    grid_gap INTEGER NOT NULL DEFAULT 8, -- pixels
    page_width INTEGER NOT NULL DEFAULT 816, -- 8.5" at 96 DPI
    page_height INTEGER NOT NULL DEFAULT 1056, -- 11" at 96 DPI
    config TEXT, -- JSON: backgroundColor, etc.
    is_default INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Layout Elements (items placed on the canvas)
  CREATE TABLE IF NOT EXISTS page_layout_elements (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    element_type TEXT NOT NULL CHECK(element_type IN ('dataField', 'text', 'image', 'table', 'shape', 'equipment_list', 'notes_content', 'revision_log')),
    config TEXT NOT NULL, -- JSON: type-specific configuration
    grid_column INTEGER NOT NULL,
    grid_row INTEGER NOT NULL,
    column_span INTEGER NOT NULL DEFAULT 1,
    row_span INTEGER NOT NULL DEFAULT 1,
    layer INTEGER NOT NULL DEFAULT 0,
    style TEXT NOT NULL, -- JSON: font, color, alignment, borders, etc.
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (template_id) REFERENCES page_layout_templates(id) ON DELETE CASCADE
  );

  -- Indexes for layout templates
  CREATE INDEX IF NOT EXISTS idx_layout_templates_user ON page_layout_templates(user_id);
  CREATE INDEX IF NOT EXISTS idx_layout_templates_type ON page_layout_templates(page_type);
  CREATE INDEX IF NOT EXISTS idx_layout_elements_template ON page_layout_elements(template_id);

  -- ============================================
  -- PAPERWORK TEMPLATES (REPORT CONFIGURATIONS)
  -- ============================================

  -- Paperwork Templates (column configurations for all 12 report types)
  -- Stored at app level so users can reuse templates across projects
  CREATE TABLE IF NOT EXISTS paperwork_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL, -- 'channel-hookup', 'dimmer-schedule', etc.

    -- References to page_layout_templates for header/footer
    header_template_id TEXT,
    footer_template_id TEXT,

    -- Column configuration (JSON array of PaperworkColumnConfig)
    column_config TEXT NOT NULL,

    -- Organization configuration (JSON object of ReportOrganization)
    organization_config TEXT NOT NULL,

    -- Page setup (JSON object of PageSetup)
    page_setup TEXT NOT NULL,

    is_system INTEGER DEFAULT 0, -- System templates cannot be deleted
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (header_template_id) REFERENCES page_layout_templates(id),
    FOREIGN KEY (footer_template_id) REFERENCES page_layout_templates(id)
  );

  -- Indexes for paperwork templates
  CREATE INDEX IF NOT EXISTS idx_paperwork_templates_type ON paperwork_templates(report_type);
  CREATE INDEX IF NOT EXISTS idx_paperwork_templates_user ON paperwork_templates(user_id);
  CREATE INDEX IF NOT EXISTS idx_paperwork_templates_system ON paperwork_templates(is_system);

  -- ============================================
  -- GDTF FIXTURE LIBRARY CACHE
  -- ============================================

  -- Cached GDTF fixture entries (populated from bundled set on first launch,
  -- and from CDN downloads in Phase 3). modes_json avoids re-unzipping on lookup.
  CREATE TABLE IF NOT EXISTS gdtf_cache (
    id TEXT PRIMARY KEY,            -- "{manufacturer}/{model}" slug
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    revision_id TEXT,               -- GDTF-Share revision hash (NULL for bundled)
    source TEXT NOT NULL DEFAULT 'bundled', -- 'bundled' | 'cdn'
    cached_at INTEGER NOT NULL,
    file_path TEXT NOT NULL,        -- Absolute path to .gdtf ZIP file
    modes_json TEXT NOT NULL        -- JSON: [{name, channel_count}]
  );

  CREATE INDEX IF NOT EXISTS idx_gdtf_cache_manufacturer ON gdtf_cache(manufacturer);
  CREATE INDEX IF NOT EXISTS idx_gdtf_cache_search ON gdtf_cache(manufacturer, model);
`;
