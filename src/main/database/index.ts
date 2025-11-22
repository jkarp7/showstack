import initSqlJs, { Database } from 'sql.js';
import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { SCHEMA } from './schema';

let db: Database | null = null;
let dbPath: string = '';

export async function initDatabase(): Promise<void> {
  dbPath = join(app.getPath('userData'), 'showstack.db');

  // Initialize sql.js
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create tables
  db.exec(SCHEMA);

  // Run migrations for existing databases
  runMigrations(db);

  // Create default project if none exists
  const result = db.exec('SELECT COUNT(*) as count FROM projects');
  const projectCount = result[0]?.values[0]?.[0] || 0;

  if (projectCount === 0) {
    db.run(
      'INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      ['default-project', 'Untitled Project', Date.now(), Date.now()]
    );
  }

  // Save database to disk
  saveDatabase();
}

function runMigrations(db: Database): void {
  // Projects table migrations
  const projectsTableInfo = db.exec("PRAGMA table_info(projects)");
  const projectsColumns = projectsTableInfo[0]?.values.map(row => row[1]) || [];

  if (!projectsColumns.includes('logo_path')) {
    console.log('Running migration: Adding logo_path to projects');
    db.run('ALTER TABLE projects ADD COLUMN logo_path TEXT');
  }

  if (!projectsColumns.includes('enabled_modules')) {
    console.log('Running migration: Adding enabled_modules to projects');
    db.run('ALTER TABLE projects ADD COLUMN enabled_modules TEXT');
  }

  // Design team fields - name columns
  if (!projectsColumns.includes('lighting_designer')) {
    console.log('Running migration: Adding design team name fields to projects');
    db.run('ALTER TABLE projects ADD COLUMN lighting_designer TEXT');
    db.run('ALTER TABLE projects ADD COLUMN lighting_associates TEXT'); // JSON array
    db.run('ALTER TABLE projects ADD COLUMN audio_designer TEXT');
    db.run('ALTER TABLE projects ADD COLUMN audio_associates TEXT'); // JSON array
    db.run('ALTER TABLE projects ADD COLUMN video_designer TEXT');
    db.run('ALTER TABLE projects ADD COLUMN video_associates TEXT'); // JSON array
  }

  // Design team fields - contact info
  if (!projectsColumns.includes('lighting_designer_email')) {
    console.log('Running migration: Adding design team contact fields to projects');
    db.run('ALTER TABLE projects ADD COLUMN lighting_designer_email TEXT');
    db.run('ALTER TABLE projects ADD COLUMN lighting_designer_phone TEXT');
    db.run('ALTER TABLE projects ADD COLUMN audio_designer_email TEXT');
    db.run('ALTER TABLE projects ADD COLUMN audio_designer_phone TEXT');
    db.run('ALTER TABLE projects ADD COLUMN video_designer_email TEXT');
    db.run('ALTER TABLE projects ADD COLUMN video_designer_phone TEXT');
  }

  // Production staff fields - name columns
  if (!projectsColumns.includes('electrician')) {
    console.log('Running migration: Adding production staff name fields to projects');
    db.run('ALTER TABLE projects ADD COLUMN electrician TEXT');
    db.run('ALTER TABLE projects ADD COLUMN audio_tech TEXT');
    db.run('ALTER TABLE projects ADD COLUMN video_tech TEXT');
    db.run('ALTER TABLE projects ADD COLUMN production_manager TEXT');
    db.run('ALTER TABLE projects ADD COLUMN production_manager_company TEXT');
    db.run('ALTER TABLE projects ADD COLUMN general_manager TEXT');
    db.run('ALTER TABLE projects ADD COLUMN general_manager_company TEXT');
  }

  // Production staff fields - contact info
  if (!projectsColumns.includes('electrician_email')) {
    console.log('Running migration: Adding production staff contact fields to projects');
    db.run('ALTER TABLE projects ADD COLUMN electrician_email TEXT');
    db.run('ALTER TABLE projects ADD COLUMN electrician_phone TEXT');
    db.run('ALTER TABLE projects ADD COLUMN audio_tech_email TEXT');
    db.run('ALTER TABLE projects ADD COLUMN audio_tech_phone TEXT');
    db.run('ALTER TABLE projects ADD COLUMN video_tech_email TEXT');
    db.run('ALTER TABLE projects ADD COLUMN video_tech_phone TEXT');
    db.run('ALTER TABLE projects ADD COLUMN production_manager_email TEXT');
    db.run('ALTER TABLE projects ADD COLUMN production_manager_phone TEXT');
    db.run('ALTER TABLE projects ADD COLUMN general_manager_email TEXT');
    db.run('ALTER TABLE projects ADD COLUMN general_manager_phone TEXT');
  }

  // Venue and dates - separate checks
  if (!projectsColumns.includes('venue')) {
    console.log('Running migration: Adding venue to projects');
    db.run('ALTER TABLE projects ADD COLUMN venue TEXT');
  }

  if (!projectsColumns.includes('venue_city')) {
    console.log('Running migration: Adding venue_city to projects');
    db.run('ALTER TABLE projects ADD COLUMN venue_city TEXT');
  }

  if (!projectsColumns.includes('venue_state')) {
    console.log('Running migration: Adding venue_state to projects');
    db.run('ALTER TABLE projects ADD COLUMN venue_state TEXT');
  }

  if (!projectsColumns.includes('show_dates')) {
    console.log('Running migration: Adding show_dates to projects');
    db.run('ALTER TABLE projects ADD COLUMN show_dates TEXT'); // JSON object
  }

  // Fixtures table migrations - add LightWright parity columns
  const fixturesTableInfo = db.exec("PRAGMA table_info(fixtures)");
  const fixturesColumns = fixturesTableInfo[0]?.values.map(row => row[1]) || [];

  const requiredColumns = [
    { name: 'manufacturer', type: 'TEXT' },
    { name: 'model', type: 'TEXT' },
    { name: 'universe', type: 'INTEGER' },
    { name: 'dmx_address', type: 'INTEGER' },
    { name: 'circuit_number', type: 'TEXT' },
    { name: 'gobo', type: 'TEXT' },
    { name: 'accessories', type: 'TEXT' },
    { name: 'system', type: 'TEXT' },
    { name: 'custom_fields', type: 'TEXT' },
  ];

  for (const column of requiredColumns) {
    if (!fixturesColumns.includes(column.name)) {
      console.log(`Running migration: Adding ${column.name} to fixtures`);
      db.run(`ALTER TABLE fixtures ADD COLUMN ${column.name} ${column.type}`);
    }
  }

  // Prep Projects table migrations
  const prepProjectsTableInfo = db.exec("PRAGMA table_info(prep_projects)");
  if (!prepProjectsTableInfo[0] || prepProjectsTableInfo[0].values.length === 0) {
    // Table doesn't exist - create it
    console.log('Running migration: Creating prep_projects table');
    db.run(`
      CREATE TABLE prep_projects (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        parent_project_id TEXT,
        production_name TEXT NOT NULL,
        venue TEXT,
        venue_city TEXT,
        venue_state TEXT,
        order_date INTEGER NOT NULL,
        original_order_date INTEGER,
        prep_start_date TEXT,
        prep_end_date TEXT,
        load_in_date TEXT,
        first_preview_date TEXT,
        opening_night_date TEXT,
        closing_date TEXT,
        load_out_date TEXT,
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
        additional_contacts TEXT,
        logo_url TEXT,
        logo_storage_path TEXT,
        disciplines TEXT NOT NULL DEFAULT '["lighting"]',
        current_revision INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  } else {
    const prepProjectsColumns = prepProjectsTableInfo[0].values.map(row => row[1]) || [];

    // Add parent_project_id if missing
    if (!prepProjectsColumns.includes('parent_project_id')) {
      console.log('Running migration: Adding parent_project_id to prep_projects');
      db.run('ALTER TABLE prep_projects ADD COLUMN parent_project_id TEXT');
    }

    // Add venue fields if missing
    if (!prepProjectsColumns.includes('venue_city')) {
      console.log('Running migration: Adding venue_city to prep_projects');
      db.run('ALTER TABLE prep_projects ADD COLUMN venue_city TEXT');
    }

    if (!prepProjectsColumns.includes('venue_state')) {
      console.log('Running migration: Adding venue_state to prep_projects');
      db.run('ALTER TABLE prep_projects ADD COLUMN venue_state TEXT');
    }

    // Add show date fields if missing
    const dateFields = ['prep_start_date', 'prep_end_date', 'load_in_date', 'first_preview_date', 'opening_night_date', 'closing_date', 'load_out_date'];
    for (const field of dateFields) {
      if (!prepProjectsColumns.includes(field)) {
        console.log(`Running migration: Adding ${field} to prep_projects`);
        db.run(`ALTER TABLE prep_projects ADD COLUMN ${field} TEXT`);
      }
    }

    // Add company fields if missing
    const companyFields = ['gm_company', 'pm_company'];
    for (const field of companyFields) {
      if (!prepProjectsColumns.includes(field)) {
        console.log(`Running migration: Adding ${field} to prep_projects`);
        db.run(`ALTER TABLE prep_projects ADD COLUMN ${field} TEXT`);
      }
    }
  }

  // Prep Sections table migrations
  const prepSectionsTableInfo = db.exec("PRAGMA table_info(prep_sections)");
  if (!prepSectionsTableInfo[0] || prepSectionsTableInfo[0].values.length === 0) {
    // Table doesn't exist - create it
    console.log('Running migration: Creating prep_sections table');
    db.run(`
      CREATE TABLE prep_sections (
        id TEXT PRIMARY KEY,
        prep_project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        discipline TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        page_break INTEGER DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (prep_project_id) REFERENCES prep_projects(id) ON DELETE CASCADE
      )
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_prep_sections_project ON prep_sections(prep_project_id)');
  } else {
    const prepSectionsColumns = prepSectionsTableInfo[0].values.map(row => row[1]) || [];

    if (!prepSectionsColumns.includes('notes')) {
      console.log('Running migration: Adding notes to prep_sections');
      db.run('ALTER TABLE prep_sections ADD COLUMN notes TEXT');
    }
  }

  // Prep Equipment Items table migrations
  const prepItemsTableInfo = db.exec("PRAGMA table_info(prep_equipment_items)");
  if (!prepItemsTableInfo[0] || prepItemsTableInfo[0].values.length === 0) {
    // Table doesn't exist - create it
    console.log('Running migration: Creating prep_equipment_items table');
    db.run(`
      CREATE TABLE prep_equipment_items (
        id TEXT PRIMARY KEY,
        section_id TEXT NOT NULL,
        description TEXT NOT NULL,
        active_qty INTEGER DEFAULT 0,
        spare_qty INTEGER DEFAULT 0,
        venue_qty INTEGER DEFAULT 0,
        total_qty INTEGER DEFAULT 0,
        venue_active INTEGER DEFAULT 0,
        venue_spare INTEGER DEFAULT 0,
        weight REAL,
        power REAL,
        notes TEXT,
        sort_order INTEGER NOT NULL,
        added_in_revision INTEGER,
        removed_in_revision INTEGER,
        modified_in_revision INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (section_id) REFERENCES prep_sections(id) ON DELETE CASCADE
      )
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_prep_items_section ON prep_equipment_items(section_id)');
  }

  // Prep Revisions table migrations
  const prepRevisionsTableInfo = db.exec("PRAGMA table_info(prep_revisions)");
  if (!prepRevisionsTableInfo[0] || prepRevisionsTableInfo[0].values.length === 0) {
    // Table doesn't exist - create it
    console.log('Running migration: Creating prep_revisions table');
    db.run(`
      CREATE TABLE prep_revisions (
        id TEXT PRIMARY KEY,
        prep_project_id TEXT NOT NULL,
        revision_number INTEGER NOT NULL,
        revision_date INTEGER NOT NULL,
        notes TEXT,
        change_log TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(prep_project_id, revision_number),
        FOREIGN KEY (prep_project_id) REFERENCES prep_projects(id) ON DELETE CASCADE
      )
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_prep_revisions_project ON prep_revisions(prep_project_id)');
  }

  // Prep Notes table migrations
  const prepNotesTableInfo = db.exec("PRAGMA table_info(prep_notes)");
  if (!prepNotesTableInfo[0] || prepNotesTableInfo[0].values.length === 0) {
    // Table doesn't exist - create it
    console.log('Running migration: Creating prep_notes table');
    db.run(`
      CREATE TABLE prep_notes (
        id TEXT PRIMARY KEY,
        prep_project_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('general_conditions', 'general_notes', 'fixture_notes', 'revision')),
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (prep_project_id) REFERENCES prep_projects(id) ON DELETE CASCADE
      )
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_prep_notes_project ON prep_notes(prep_project_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_prep_notes_type ON prep_notes(prep_project_id, type)');
  }

  // Prep Note Templates table migrations
  const prepNoteTemplatesTableInfo = db.exec("PRAGMA table_info(prep_note_templates)");
  if (!prepNoteTemplatesTableInfo[0] || prepNoteTemplatesTableInfo[0].values.length === 0) {
    // Table doesn't exist - create it
    console.log('Running migration: Creating prep_note_templates table');
    db.run(`
      CREATE TABLE prep_note_templates (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        type TEXT NOT NULL CHECK(type IN ('general_conditions', 'general_notes', 'fixture_notes')),
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_prep_note_templates_type ON prep_note_templates(type)');
    db.run('CREATE INDEX IF NOT EXISTS idx_prep_note_templates_default ON prep_note_templates(type, is_default)');
  }
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function saveDatabase(): void {
  if (!db) {
    throw new Error('Database not initialized');
  }
  const data = db.export();
  writeFileSync(dbPath, data);
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

export async function reloadDatabase(): Promise<void> {
  // Close current database
  if (db) {
    db.close();
    db = null;
  }

  // Reload from disk
  if (!dbPath) {
    throw new Error('Database path not initialized');
  }

  const SQL = await initSqlJs();
  const buffer = readFileSync(dbPath);
  db = new SQL.Database(buffer);

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Run migrations to ensure all tables exist
  runMigrations(db);
}
