/**
 * DatabaseManager - Manages database lifecycle and connections
 *
 * Responsibilities:
 * - Initialize app and project databases
 * - Provide database access
 * - Coordinate migrations
 * - Singleton pattern ensures single source of truth
 */

import initSqlJs, { Database } from 'sql.js';
import { app } from 'electron';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { APP_SCHEMA } from '../appSchema';
import { PROJECT_SCHEMA } from '../projectSchema';
import { MigrationRunner } from './MigrationRunner';
import { errorHandler } from '../../errors';
import { DatabaseError } from '../../errors';

export class DatabaseManager {
  private appDb: Database | null = null;
  private projectDb: Database | null = null;

  private appDbPath: string = '';
  private projectDbPath: string = '';

  private SQL: any = null; // sql.js module

  /**
   * Initialize both app and project databases
   */
  async initialize(): Promise<void> {
    try {
      // Set paths
      this.appDbPath = join(app.getPath('userData'), 'showstack-app.db');
      this.projectDbPath = join(app.getPath('userData'), 'showstack-projects.db');

      // Initialize sql.js
      this.SQL = await initSqlJs();

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
          // Load existing database or create new
          if (existsSync(this.appDbPath)) {
            const buffer = readFileSync(this.appDbPath);
            this.appDb = new this.SQL.Database(buffer);
          } else {
            this.appDb = new this.SQL.Database();
          }

          // Enable foreign keys
          this.appDb!.run('PRAGMA foreign_keys = ON');

          // Create tables from schema
          this.appDb!.exec(APP_SCHEMA);
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
          // Load existing database or create new
          if (existsSync(this.projectDbPath)) {
            const buffer = readFileSync(this.projectDbPath);
            this.projectDb = new this.SQL.Database(buffer);
          } else {
            this.projectDb = new this.SQL.Database();
          }

          // Enable foreign keys
          this.projectDb!.run('PRAGMA foreign_keys = ON');

          // Create tables from schema
          this.projectDb!.exec(PROJECT_SCHEMA);
        },
        'project-database:initialize'
      );

      // Run migrations
      const migrationRunner = new MigrationRunner(this.projectDb!, 'project', this.projectDbPath);
      await migrationRunner.run();

      // Create default project if none exists
      const result = this.projectDb!.exec('SELECT COUNT(*) as count FROM projects');
      const projectCount = result[0]?.values[0]?.[0] || 0;

      if (projectCount === 0) {
        this.projectDb!.run(
          'INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
          ['default-project', 'Untitled Project', Date.now(), Date.now()]
        );
      }

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
  getAppDatabase(): Database {
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
  getProjectDatabase(): Database {
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
          // Reload from disk
          const buffer = readFileSync(this.projectDbPath);
          this.projectDb = new this.SQL.Database(buffer);

          // Enable foreign keys
          this.projectDb!.run('PRAGMA foreign_keys = ON');
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
   * Replace project database with imported data
   * IMPORTANT: Only replaces PROJECT database, never touches APP database
   */
  async replaceProjectDatabase(importedData: Uint8Array): Promise<void> {
    try {
      console.log('Replacing project database with imported data...');

      // Close current project database
      if (this.projectDb) {
        this.projectDb.close();
        this.projectDb = null;
      }

      // Create new database from imported data
      this.projectDb = new this.SQL.Database(importedData);

      console.log('✅ Project database replaced');
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
