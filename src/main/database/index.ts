import initSqlJs, { Database } from 'sql.js';
import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { APP_SCHEMA } from './appSchema';
import { PROJECT_SCHEMA } from './projectSchema';
import { seedDefaultPageLayouts } from './seedDefaultLayouts';
import { seedDefaultPageLayoutsFromJSON } from './seedDefaultLayoutsFromJSON';
import { seedPaperworkTemplates } from './seedPaperworkTemplates';
import { seedPaperworkHeaderTemplate } from './seedPaperworkHeader';
import { resetPaperworkHeaderTemplate } from './resetPaperworkHeader';
import { updatePaperworkTemplateHeaders } from './updatePaperworkTemplateHeaders';
import { createLayoutTemplate } from './queries/layoutTemplates';
import * as fs from 'fs';
import * as path from 'path';

// Two separate databases
let appDb: Database | null = null;
let projectDb: Database | null = null;
let appDbPath: string = '';
let projectDbPath: string = '';

/**
 * Initialize both app-level and project-level databases
 */
export async function initDatabase(): Promise<void> {
  appDbPath = join(app.getPath('userData'), 'showstack-app.db');
  projectDbPath = join(app.getPath('userData'), 'showstack-projects.db');

  // Initialize sql.js
  const SQL = await initSqlJs();

  // ============================================
  // Initialize App Database (licenses, settings)
  // ============================================
  if (existsSync(appDbPath)) {
    const buffer = readFileSync(appDbPath);
    appDb = new SQL.Database(buffer);
  } else {
    appDb = new SQL.Database();
  }

  // Enable foreign keys
  appDb.run('PRAGMA foreign_keys = ON');

  // Create app tables
  appDb.exec(APP_SCHEMA);

  // Run app database migrations
  await runAppMigrations(appDb);

  // Save app database
  saveAppDatabase();

  // ============================================
  // Initialize Project Database (all project data)
  // ============================================
  if (existsSync(projectDbPath)) {
    const buffer = readFileSync(projectDbPath);
    projectDb = new SQL.Database(buffer);
  } else {
    projectDb = new SQL.Database();
  }

  // Enable foreign keys
  projectDb.run('PRAGMA foreign_keys = ON');

  // Create project tables
  projectDb.exec(PROJECT_SCHEMA);

  // Run project database migrations
  runProjectMigrations(projectDb);

  // Create default project if none exists
  const result = projectDb.exec('SELECT COUNT(*) as count FROM projects');
  const projectCount = result[0]?.values[0]?.[0] || 0;

  if (projectCount === 0) {
    projectDb.run(
      'INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      ['default-project', 'Untitled Project', Date.now(), Date.now()]
    );
  }

  // Save project database
  saveProjectDatabase();
}

/**
 * Migrations for app-level database
 */
async function runAppMigrations(db: Database): Promise<void> {
  // App database migrations (for licenses and settings)

  try {
    // Seed default page layouts if none exist (safe approach - only add if completely missing)
    const layoutResult = db.exec('SELECT COUNT(*) as count FROM page_layout_templates');
    const layoutCount = layoutResult[0]?.values[0]?.[0] || 0;

    if (layoutCount === 0) {
      console.log('No default page layouts found - seeding defaults...');
      seedDefaultPageLayoutsFromJSON();
      console.log('✅ Default page layouts seeded');
    } else {
      // Migration: Add v2 layouts with dynamic content if they don't exist
      const dynamicLayoutsResult = db.exec(`
        SELECT COUNT(*) as count FROM page_layout_elements
        WHERE element_type IN ('equipment_list', 'notes_content', 'revision_log')
      `);
      const hasDynamicLayouts = (dynamicLayoutsResult[0]?.values[0]?.[0] || 0) > 0;

      if (!hasDynamicLayouts) {
        console.log('Adding v2 layouts with dynamic content support...');

        // Unset all current defaults (they'll become v1 backups)
        db.run('UPDATE page_layout_templates SET is_default = 0');

        // Rename existing default layouts to indicate they're v1
        db.run(`
          UPDATE page_layout_templates
          SET name = name || ' (v1)'
          WHERE is_default = 0
          AND name NOT LIKE '%(v1)%'
        `);

        // Create new v2 layouts with dynamic content
        seedDefaultPageLayoutsFromJSON();

        // Save after migration
        saveAppDatabase();

        console.log('✅ V2 layouts with dynamic content added (old layouts preserved as v1)');
      }

      // Migration: Add paperwork-header layout if it doesn't exist
      const paperworkHeaderResult = db.exec(`
        SELECT COUNT(*) as count FROM page_layout_templates
        WHERE page_type = 'paperwork-header' AND is_default = 1
      `);
      const hasPaperworkHeader = (paperworkHeaderResult[0]?.values[0]?.[0] || 0) > 0;

      if (!hasPaperworkHeader) {
        console.log('Adding paperwork-header default layout...');

        // Load just the paperwork-header layout from JSON
        const layoutPath = path.join(__dirname, 'database', 'defaultLayouts', 'paperwork-header_default_layout.json');

        if (fs.existsSync(layoutPath)) {
          try {
            const fileContent = fs.readFileSync(layoutPath, 'utf-8');
            const data = JSON.parse(fileContent);

            const templateData = {
              name: data.template.name,
              description: data.template.description,
              page_type: data.template.page_type,
              grid_columns: data.template.grid_columns,
              grid_rows: data.template.grid_rows,
              grid_gap: data.template.grid_gap,
              page_width: data.template.page_width,
              page_height: data.template.page_height,
              is_default: data.template.is_default
            };

            const elementsData = data.elements.map((el: any) => ({
              element_type: el.element_type,
              config: JSON.stringify(el.config),
              grid_column: el.grid_column,
              grid_row: el.grid_row,
              column_span: el.column_span,
              row_span: el.row_span,
              layer: el.layer || 0,
              style: JSON.stringify(el.style)
            }));

            createLayoutTemplate(templateData, elementsData);
            saveAppDatabase();
            console.log('✅ Paperwork-header layout added');
          } catch (error) {
            console.error('❌ Error adding paperwork-header layout:', error);
          }
        } else {
          console.warn('⚠️  paperwork-header_default_layout.json not found');
        }
      }
    }

    // Seed paperwork templates if needed
    console.log('🌱 Checking paperwork template seeding...');
    await seedPaperworkTemplates();

    // Reset paperwork header template if it has old layout (with page numbers)
    resetPaperworkHeaderTemplate();

    // Seed default paperwork header template
    seedPaperworkHeaderTemplate();

    // Update existing paperwork templates to reference the default header
    updatePaperworkTemplateHeaders();

    console.log('✅ App database migrations complete');
  } catch (error) {
    console.error('❌ Error running app migrations:', error);
    // Continue anyway - don't block app startup
  }
}

/**
 * Migrations for project-level database
 */
function runProjectMigrations(db: Database): void {
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

  // Power rack assignment columns for fixtures
  const powerRackColumns = [
    { name: 'dimmer_rack_id', type: 'TEXT' },
    { name: 'dimmer_module_number', type: 'INTEGER' },
    { name: 'dimmer_channel_number', type: 'INTEGER' },
    { name: 'pd_rack_id', type: 'TEXT' },
    { name: 'pd_circuit_number', type: 'INTEGER' },
    { name: 'pd_breaker_number', type: 'INTEGER' },
  ];

  for (const column of powerRackColumns) {
    if (!fixturesColumns.includes(column.name)) {
      console.log(`Running migration: Adding ${column.name} to fixtures`);
      db.run(`ALTER TABLE fixtures ADD COLUMN ${column.name} ${column.type}`);
    }
  }

  // Add rack identifier columns for dimmer racks
  const dimmerRacksTableInfo = db.exec("PRAGMA table_info(dimmer_racks)");
  if (dimmerRacksTableInfo[0]) {
    const dimmerRacksColumns = dimmerRacksTableInfo[0].values.map(row => row[1]) || [];

    if (!dimmerRacksColumns.includes('rack_identifier')) {
      console.log('Running migration: Adding rack_identifier to dimmer_racks');
      db.run('ALTER TABLE dimmer_racks ADD COLUMN rack_identifier TEXT'); // Can be single letter or string like "FOH", "ML", etc.
    }
  }

  // Add rack identifier and dual voltage support for PD racks
  const pdRacksTableInfo = db.exec("PRAGMA table_info(pd_racks)");
  if (pdRacksTableInfo[0]) {
    const pdRacksColumns = pdRacksTableInfo[0].values.map(row => row[1]) || [];

    if (!pdRacksColumns.includes('rack_identifier')) {
      console.log('Running migration: Adding rack_identifier to pd_racks');
      db.run('ALTER TABLE pd_racks ADD COLUMN rack_identifier TEXT'); // Can be single letter or string like "FOH", "DECK", etc.
    }

    if (!pdRacksColumns.includes('is_dual_voltage')) {
      console.log('Running migration: Adding is_dual_voltage to pd_racks');
      db.run('ALTER TABLE pd_racks ADD COLUMN is_dual_voltage INTEGER DEFAULT 0');
    }

    if (!pdRacksColumns.includes('secondary_voltage')) {
      console.log('Running migration: Adding secondary_voltage to pd_racks');
      db.run('ALTER TABLE pd_racks ADD COLUMN secondary_voltage INTEGER');
    }
  }

  // Create dimmer_rack_modules table if it doesn't exist
  const dimmerRackModulesTableInfo = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='dimmer_rack_modules'");
  if (!dimmerRackModulesTableInfo[0] || dimmerRackModulesTableInfo[0].values.length === 0) {
    console.log('Running migration: Creating dimmer_rack_modules table');
    db.run(`
      CREATE TABLE dimmer_rack_modules (
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
      )
    `);
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
        logo_path TEXT,
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

    // Add logo_path if missing (unified logo field with Project type)
    if (!prepProjectsColumns.includes('logo_path')) {
      console.log('Running migration: Adding logo_path to prep_projects');
      db.run('ALTER TABLE prep_projects ADD COLUMN logo_path TEXT');
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

  // Add format column to prep_notes if it doesn't exist
  const prepNotesColumns = db.exec("PRAGMA table_info(prep_notes)");
  if (prepNotesColumns[0]) {
    const columns = prepNotesColumns[0].values.map(row => row[1]); // Column names are at index 1
    if (!columns.includes('format')) {
      console.log('Running migration: Adding format column to prep_notes');
      db.run("ALTER TABLE prep_notes ADD COLUMN format TEXT DEFAULT 'plain' CHECK(format IN ('plain', 'bullets', 'numbered'))");
    }
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

  // Infrastructure Equipment table migration
  const infrastructureTableInfo = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='infrastructure_equipment'");
  if (!infrastructureTableInfo[0] || infrastructureTableInfo[0].values.length === 0) {
    console.log('Running migration: Creating infrastructure_equipment table');
    db.run(`
      CREATE TABLE infrastructure_equipment (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        manufacturer TEXT,
        model TEXT,
        quantity INTEGER DEFAULT 1,
        category TEXT,
        ip_address TEXT,
        mac_address TEXT,
        subnet_mask TEXT,
        gateway TEXT,
        vlan_id INTEGER,
        hostname TEXT,
        port_assignments TEXT,
        port_count INTEGER DEFAULT 0,
        voltage INTEGER,
        amperage REAL,
        wattage REAL,
        phase TEXT,
        dimmer_rack_id TEXT,
        dimmer_channel_number INTEGER,
        pd_rack_id TEXT,
        pd_circuit_number INTEGER,
        pd_breaker_number INTEGER,
        circuit TEXT,
        circuit_number INTEGER,
        location TEXT,
        position_x REAL,
        position_y REAL,
        position_z REAL,
        notes TEXT,
        status TEXT DEFAULT 'Active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_infrastructure_project ON infrastructure_equipment(project_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_infrastructure_category ON infrastructure_equipment(project_id, category)');
    db.run('CREATE INDEX IF NOT EXISTS idx_infrastructure_location ON infrastructure_equipment(project_id, location)');
  } else {
    // If table exists, check if port_count column exists and add it if missing
    const infrastructureColumns = db.exec("PRAGMA table_info(infrastructure_equipment)");
    const columnNames = infrastructureColumns[0]?.values.map(row => row[1]) || [];

    if (!columnNames.includes('port_count')) {
      console.log('Running migration: Adding port_count to infrastructure_equipment');
      db.run('ALTER TABLE infrastructure_equipment ADD COLUMN port_count INTEGER DEFAULT 0');
    }
  }

  console.log('✅ Project database migrations complete');
}

/**
 * Get the app-level database (licenses, settings)
 */
export function getAppDatabase(): Database {
  if (!appDb) {
    throw new Error('App database not initialized');
  }
  return appDb;
}

/**
 * Get the project-level database (all project data)
 */
export function getDatabase(): Database {
  if (!projectDb) {
    throw new Error('Project database not initialized');
  }
  return projectDb;
}

/**
 * Save app database to disk
 */
export function saveAppDatabase(): void {
  if (!appDb) {
    throw new Error('App database not initialized');
  }
  const data = appDb.export();
  writeFileSync(appDbPath, data);
}

/**
 * Save project database to disk
 */
export function saveDatabase(): void {
  if (!projectDb) {
    throw new Error('Project database not initialized');
  }
  const data = projectDb.export();
  writeFileSync(projectDbPath, data);
}

// Alias for backwards compatibility
export const saveProjectDatabase = saveDatabase;

/**
 * Close both databases
 */
export function closeDatabase(): void {
  if (appDb) {
    saveAppDatabase();
    appDb.close();
    appDb = null;
  }
  if (projectDb) {
    saveProjectDatabase();
    projectDb.close();
    projectDb = null;
  }
}

/**
 * Reload project database from disk
 */
export async function reloadDatabase(): Promise<void> {
  // Close current project database
  if (projectDb) {
    projectDb.close();
    projectDb = null;
  }

  // Reload from disk
  if (!projectDbPath) {
    throw new Error('Database path not initialized');
  }

  const SQL = await initSqlJs();
  const buffer = readFileSync(projectDbPath);
  projectDb = new SQL.Database(buffer);

  // Enable foreign keys
  projectDb.run('PRAGMA foreign_keys = ON');

  // Run migrations to ensure all tables exist
  runProjectMigrations(projectDb);
}

/**
 * Replace project database with imported file
 * IMPORTANT: Only replaces PROJECT database, never touches APP database
 */
export async function replaceProjectDatabase(importedData: Uint8Array): Promise<void> {
  // Close current project database
  if (projectDb) {
    projectDb.close();
    projectDb = null;
  }

  // Write imported data to project database file
  writeFileSync(projectDbPath, importedData);

  // Reload the project database
  await reloadDatabase();
}
