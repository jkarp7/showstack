import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';

let db: Database.Database | null = null;

export async function initDatabase(): Promise<void> {
  const dbPath = join(app.getPath('userData'), 'showstack.db');

  db = new Database(dbPath, {
    verbose: console.log // Log SQL in development
  });

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // TODO: Create tables (will be added in Week 2)
  console.log('✅ Database initialized:', dbPath);
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
