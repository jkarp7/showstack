/**
 * DatabaseWriter - Handles database persistence to disk
 *
 * Responsibilities:
 * - Save databases to disk
 * - Handle write errors gracefully
 * - Provide sync save operations
 */

import { Database } from 'sql.js';
import { writeFileSync } from 'fs';
import { errorHandler } from '../../errors';
import { DatabaseError } from '../../errors';

export class DatabaseWriter {
  /**
   * Save database to disk synchronously
   */
  save(db: Database, dbPath: string, dbName: string): void {
    try {
      const data = db.export();
      writeFileSync(dbPath, data);
      console.log(`✅ ${dbName} database saved to disk`);
    } catch (error) {
      console.error(`❌ Error saving ${dbName} database:`, error);
      throw new DatabaseError(
        `Failed to save ${dbName} database to disk`,
        'database:save',
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Save database to disk asynchronously with retry
   */
  async saveWithRetry(db: Database, dbPath: string, dbName: string): Promise<void> {
    try {
      await errorHandler.executeWithRetry(
        async () => {
          const data = db.export();
          writeFileSync(dbPath, data);
        },
        `database:save:${dbName}`
      );
      console.log(`✅ ${dbName} database saved to disk (with retry)`);
    } catch (error) {
      console.error(`❌ Error saving ${dbName} database:`, error);
      throw new DatabaseError(
        `Failed to save ${dbName} database after retries`,
        `database:save:${dbName}`,
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// Singleton instance
export const databaseWriter = new DatabaseWriter();
