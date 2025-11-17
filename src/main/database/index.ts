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
    console.log('✅ Loaded existing database:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('✅ Created new database:', dbPath);
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
    console.log('✅ Created default project');
  }

  // Save database to disk
  saveDatabase();

  console.log('✅ Database initialized:', dbPath);
}

function runMigrations(db: Database): void {
  // Check if logo_path column exists
  const tableInfo = db.exec("PRAGMA table_info(projects)");
  const columns = tableInfo[0]?.values.map(row => row[1]) || [];

  if (!columns.includes('logo_path')) {
    console.log('Running migration: Adding logo_path to projects');
    db.run('ALTER TABLE projects ADD COLUMN logo_path TEXT');
  }

  if (!columns.includes('enabled_modules')) {
    console.log('Running migration: Adding enabled_modules to projects');
    db.run('ALTER TABLE projects ADD COLUMN enabled_modules TEXT');
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
