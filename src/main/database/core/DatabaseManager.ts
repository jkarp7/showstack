/**
 * DatabaseManager - Manages database lifecycle and connections
 *
 * Responsibilities:
 * - Initialize app and project databases
 * - Provide database access
 * - Coordinate migrations
 * - Singleton pattern ensures single source of truth
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { APP_SCHEMA } from '../appSchema';
import { PROJECT_SCHEMA } from '../projectSchema';
import { MigrationRunner } from './MigrationRunner';
import { errorHandler } from '../../errors';
import { DatabaseError } from '../../errors';

export class DatabaseManager {
  private appDb: Database.Database | null = null;
  private projectDb: Database.Database | null = null;

  private appDbPath: string = '';
  private projectDbPath: string = '';

  /**
   * Initialize both app and project databases
   */
  async initialize(): Promise<void> {
    try {
      // Set paths
      this.appDbPath = join(app.getPath('userData'), 'showstack-app.db');
      this.projectDbPath = join(app.getPath('userData'), 'showstack-projects.db');

      // Initialize databases
      await this.initializeAppDatabase();
      await this.initializeProjectDatabase();

      console.log('✅ Database initialization complete');
    } catch (error) {
      console.error('❌ Fatal error during database initialization:', error);
      throw new DatabaseError(
        'Failed to initialize databases',
        'database:initialize',
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Initialize app-level database (settings, licenses, templates)
   */
  private async initializeAppDatabase(): Promise<void> {
    try {
      console.log('Initializing app database:', this.appDbPath);

      await errorHandler.executeWithRetry(
        async () => {
          // Create or open database
          this.appDb = new Database(this.appDbPath);

          // Enable WAL mode for auto-persistence and better concurrency
          this.appDb.pragma('journal_mode = WAL');

          // Enable foreign keys
          this.appDb.pragma('foreign_keys = ON');

          // Set synchronous mode to NORMAL for better performance
          this.appDb.pragma('synchronous = NORMAL');

          // Create tables from schema
          this.appDb.exec(APP_SCHEMA);
        },
        'app-database:initialize'
      );

      // Run migrations
      const migrationRunner = new MigrationRunner(this.appDb!, 'app', this.appDbPath);
      await migrationRunner.run();

      console.log('✅ App database initialized');
    } catch (error) {
      console.error('❌ Error initializing app database:', error);
      throw new DatabaseError(
        'Failed to initialize app database',
        'app-database:initialize',
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Initialize project-level database (all project data)
   */
  private async initializeProjectDatabase(): Promise<void> {
    try {
      console.log('Initializing project database:', this.projectDbPath);

      await errorHandler.executeWithRetry(
        async () => {
          // Create or open database
          this.projectDb = new Database(this.projectDbPath);

          // Enable WAL mode for auto-persistence and better concurrency
          this.projectDb.pragma('journal_mode = WAL');

          // Enable foreign keys
          this.projectDb.pragma('foreign_keys = ON');

          // Set synchronous mode to NORMAL for better performance
          this.projectDb.pragma('synchronous = NORMAL');

          // Create tables from schema
          this.projectDb.exec(PROJECT_SCHEMA);
        },
        'project-database:initialize'
      );

      // Run migrations
      const migrationRunner = new MigrationRunner(this.projectDb!, 'project', this.projectDbPath);
      await migrationRunner.run();

      // Create default project if none exists
      const result = this.projectDb!.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
      const projectCount = result?.count || 0;

      if (projectCount === 0) {
        this.projectDb!.prepare(
          'INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)'
        ).run('default-project', 'Untitled Project', Date.now(), Date.now());
      }

      // Create performance indexes
      const { createPerformanceIndexes } = await import('../indexes/performanceIndexes');
      createPerformanceIndexes(this.projectDb!);

      console.log('✅ Project database initialized');
    } catch (error) {
      console.error('❌ Error initializing project database:', error);
      throw new DatabaseError(
        'Failed to initialize project database',
        'project-database:initialize',
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get the app-level database (licenses, settings, templates)
   */
  getAppDatabase(): Database.Database {
    if (!this.appDb) {
      throw new DatabaseError(
        'App database not initialized. Call initialize() first.',
        'getAppDatabase',
        false
      );
    }
    return this.appDb;
  }

  /**
   * Get the project-level database (all project data)
   */
  getProjectDatabase(): Database.Database {
    if (!this.projectDb) {
      throw new DatabaseError(
        'Project database not initialized. Call initialize() first.',
        'getProjectDatabase',
        false
      );
    }
    return this.projectDb;
  }

  /**
   * Get database paths
   */
  getPaths(): { appDbPath: string; projectDbPath: string } {
    return {
      appDbPath: this.appDbPath,
      projectDbPath: this.projectDbPath
    };
  }

  /**
   * Reload project database from disk
   */
  async reloadProjectDatabase(): Promise<void> {
    try {
      console.log('Reloading project database from disk...');

      // Close current project database
      if (this.projectDb) {
        this.projectDb.close();
        this.projectDb = null;
      }

      await errorHandler.executeWithRetry(
        async () => {
          // Reload from disk (better-sqlite3 automatically reads from file)
          this.projectDb = new Database(this.projectDbPath);

          // Enable WAL mode
          this.projectDb.pragma('journal_mode = WAL');

          // Enable foreign keys
          this.projectDb.pragma('foreign_keys = ON');

          // Set synchronous mode to NORMAL for better performance
          this.projectDb.pragma('synchronous = NORMAL');
        },
        'project-database:reload'
      );

      // Run migrations to ensure all tables exist
      const migrationRunner = new MigrationRunner(this.projectDb!, 'project', this.projectDbPath);
      await migrationRunner.run();

      console.log('✅ Project database reloaded');
    } catch (error) {
      console.error('❌ Error reloading project database:', error);
      throw new DatabaseError(
        'Failed to reload project database',
        'project-database:reload',
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Validate that imported data is a valid SQLite database
   * Checks for SQLite magic number and minimum file size
   */
  private validateSQLiteDatabase(data: Uint8Array): void {
    // SQLite database files must be at least 100 bytes (header size)
    if (!data || data.length < 100) {
      throw new DatabaseError(
        'Invalid database file: file too small (minimum 100 bytes required)',
        'import:validation',
        false
      );
    }

    // Check for SQLite format 3 magic string
    // SQLite header starts with: "SQLite format 3\0" (16 bytes)
    const SQLITE_MAGIC = 'SQLite format 3\0';
    const headerString = String.fromCharCode(...data.slice(0, 16));

    if (headerString !== SQLITE_MAGIC) {
      throw new DatabaseError(
        'Invalid database file: not a valid SQLite format 3 database',
        'import:validation',
        false
      );
    }
  }

  /**
   * Replace project database with imported data
   * IMPORTANT: Only replaces PROJECT database, never touches APP database
   */
  async replaceProjectDatabase(importedData: Uint8Array): Promise<void> {
    try {
      console.log('Replacing project database with imported data...');

      // Validate that the imported data is a valid SQLite database
      this.validateSQLiteDatabase(importedData);

      const { writeFileSync } = await import('fs');

      // Close current project database
      if (this.projectDb) {
        this.projectDb.close();
        this.projectDb = null;
      }

      // Write imported data to file
      writeFileSync(this.projectDbPath, importedData);

      // Open the new database
      this.projectDb = new Database(this.projectDbPath);

      // Enable WAL mode
      this.projectDb.pragma('journal_mode = WAL');

      // Enable foreign keys
      this.projectDb.pragma('foreign_keys = ON');

      // Set synchronous mode to NORMAL for better performance
      this.projectDb.pragma('synchronous = NORMAL');

      // Run integrity check to ensure database is not corrupted
      const integrityCheck = this.projectDb.pragma('integrity_check') as Array<{ integrity_check: string }>;
      if (integrityCheck[0]?.integrity_check !== 'ok') {
        throw new DatabaseError(
          `Database integrity check failed: ${integrityCheck[0]?.integrity_check}`,
          'import:integrity',
          false
        );
      }

      console.log('✅ Project database replaced and validated');
    } catch (error) {
      console.error('❌ Error replacing project database:', error);
      throw new DatabaseError(
        'Failed to replace project database',
        'project-database:replace',
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Close both databases
   */
  close(): void {
    if (this.appDb) {
      this.appDb.close();
      this.appDb = null;
    }
    if (this.projectDb) {
      this.projectDb.close();
      this.projectDb = null;
    }
    console.log('✅ Databases closed');
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();
