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
