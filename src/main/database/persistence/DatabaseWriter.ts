/**
 * DatabaseWriter - Handles database persistence to disk
 *
 * NOTE: With better-sqlite3's WAL mode, manual saves are no longer needed.
 * All writes are automatically persisted to disk.
 * This class is kept for backwards compatibility but methods are now no-ops.
 *
 * Legacy Responsibilities (no longer needed):
 * - Save databases to disk
 * - Handle write errors gracefully
 * - Provide sync save operations
 */

import Database from 'better-sqlite3';

export class DatabaseWriter {
  /**
   * Save database to disk synchronously
   * NOTE: With WAL mode, this is a no-op. All writes are auto-persisted.
   */
  save(db: Database.Database, dbPath: string, dbName: string): void {
    // WAL mode handles auto-persistence - no manual save needed
    console.log(`[DatabaseWriter] save() called for ${dbName} - WAL mode handles auto-persistence`);
  }

  /**
   * Save database to disk asynchronously with retry
   * NOTE: With WAL mode, this is a no-op. All writes are auto-persisted.
   */
  async saveWithRetry(db: Database.Database, dbPath: string, dbName: string): Promise<void> {
    // WAL mode handles auto-persistence - no manual save needed
    console.log(`[DatabaseWriter] saveWithRetry() called for ${dbName} - WAL mode handles auto-persistence`);
  }
}

// Singleton instance
export const databaseWriter = new DatabaseWriter();
