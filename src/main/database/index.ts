import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { SCHEMA } from './schema';

let db: Database.Database | null = null;

export async function initDatabase(): Promise<void> {
  const dbPath = join(app.getPath('userData'), 'showstack.db');

  db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
  });

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(SCHEMA);

  // Create default project if none exists
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    db.prepare(`
      INSERT INTO projects (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run('default-project', 'Untitled Project', Date.now(), Date.now());
    console.log('✅ Created default project');
  }

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
