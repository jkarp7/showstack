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

  // Design team fields
  if (!projectsColumns.includes('lighting_designer')) {
    console.log('Running migration: Adding design team fields to projects');
    db.run('ALTER TABLE projects ADD COLUMN lighting_designer TEXT');
    db.run('ALTER TABLE projects ADD COLUMN lighting_associates TEXT'); // JSON array
    db.run('ALTER TABLE projects ADD COLUMN audio_designer TEXT');
    db.run('ALTER TABLE projects ADD COLUMN audio_associates TEXT'); // JSON array
    db.run('ALTER TABLE projects ADD COLUMN video_designer TEXT');
    db.run('ALTER TABLE projects ADD COLUMN video_associates TEXT'); // JSON array
  }

  // Production staff fields
  if (!projectsColumns.includes('electrician')) {
    console.log('Running migration: Adding production staff fields to projects');
    db.run('ALTER TABLE projects ADD COLUMN electrician TEXT');
    db.run('ALTER TABLE projects ADD COLUMN audio_tech TEXT');
    db.run('ALTER TABLE projects ADD COLUMN video_tech TEXT');
    db.run('ALTER TABLE projects ADD COLUMN production_manager TEXT');
    db.run('ALTER TABLE projects ADD COLUMN production_manager_company TEXT');
    db.run('ALTER TABLE projects ADD COLUMN general_manager TEXT');
    db.run('ALTER TABLE projects ADD COLUMN general_manager_company TEXT');
  }

  // Venue and dates
  if (!projectsColumns.includes('venue')) {
    console.log('Running migration: Adding venue and show_dates to projects');
    db.run('ALTER TABLE projects ADD COLUMN venue TEXT');
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
