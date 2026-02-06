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
import { logger } from '../../utils/logger';

/**
 * WAL (Write-Ahead Logging) status information
 */
export interface WalStatus {
  database: string;
  walPages: number;
  checkpointedPages: number;
  isBusy: boolean;
  estimatedWalSizeBytes: number;
}

/**
 * WAL checkpoint configuration options
 */
export interface WalCheckpointConfig {
  /** Interval between automatic checkpoints in milliseconds (default: 300000 = 5 minutes) */
  checkpointIntervalMs: number;
  /** WAL page count threshold for warning logs (default: 10000 pages) */
  sizeWarningThreshold: number;
}

const DEFAULT_WAL_CONFIG: WalCheckpointConfig = {
  checkpointIntervalMs: 5 * 60 * 1000, // 5 minutes
  sizeWarningThreshold: 10000 // pages
};

export class DatabaseManager {
  private appDb: Database.Database | null = null;
  private projectDb: Database.Database | null = null;

  private appDbPath: string = '';
  private projectDbPath: string = '';

  private walCheckpointInterval?: NodeJS.Timeout;
  private walConfig: WalCheckpointConfig = { ...DEFAULT_WAL_CONFIG };

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

      // Start periodic WAL checkpointing
      this.startPeriodicCheckpointing();

      logger.info('Database initialization complete');
    } catch (error) {
      logger.error('Fatal error during database initialization', error instanceof Error ? error : new Error(String(error)));
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
      logger.info('Initializing app database');
      logger.debug('App database path', { path: this.appDbPath });

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

      logger.info('App database initialized');
    } catch (error) {
      logger.error('Error initializing app database', error instanceof Error ? error : new Error(String(error)));
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
      logger.info('Initializing project database');
      logger.debug('Project database path', { path: this.projectDbPath });

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

      logger.info('Project database initialized');
    } catch (error) {
      logger.error('Error initializing project database', error instanceof Error ? error : new Error(String(error)));
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
      logger.info('Reloading project database from disk');

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

      logger.info('Project database reloaded');
    } catch (error) {
      logger.error('Error reloading project database', error instanceof Error ? error : new Error(String(error)));
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
      logger.info('Replacing project database with imported data');

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

      logger.info('Project database replaced and validated');
    } catch (error) {
      logger.error('Error replacing project database', error instanceof Error ? error : new Error(String(error)));
      throw new DatabaseError(
        'Failed to replace project database',
        'project-database:replace',
        false,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Start periodic WAL checkpointing to prevent WAL file growth.
   * Runs checkpoint every 5 minutes in PASSIVE mode (non-blocking).
   *
   * WAL (Write-Ahead Logging) files can grow unbounded without periodic
   * checkpointing. This ensures disk space is reclaimed and backup
   * reliability is maintained.
   */
  startPeriodicCheckpointing(): void {
    // Defensive cleanup: stop any existing interval to prevent memory leaks
    // if this method is called multiple times
    this.stopPeriodicCheckpointing();

    logger.info('Starting periodic WAL checkpointing', {
      intervalMs: this.walConfig.checkpointIntervalMs
    });

    this.walCheckpointInterval = setInterval(() => {
      this.performCheckpoint('PASSIVE');
    }, this.walConfig.checkpointIntervalMs);

    // Don't prevent Node from exiting
    this.walCheckpointInterval.unref();
  }

  /**
   * Stop periodic WAL checkpointing.
   * Called automatically on database close.
   */
  stopPeriodicCheckpointing(): void {
    if (this.walCheckpointInterval) {
      clearInterval(this.walCheckpointInterval);
      this.walCheckpointInterval = undefined;
      logger.info('Stopped periodic WAL checkpointing');
    }
  }

  /**
   * Perform WAL checkpoint on both databases.
   *
   * @param mode - Checkpoint mode:
   *   - PASSIVE: Non-blocking, checkpoints as much as possible
   *   - FULL: Blocks until complete, checkpoints entire WAL
   *   - RESTART: Like FULL, but also restarts WAL file
   *   - TRUNCATE: Like RESTART, but also truncates WAL file to zero bytes
   */
  private performCheckpoint(mode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE' = 'PASSIVE'): void {
    // Checkpoint each database separately to identify failures
    if (this.appDb) {
      try {
        const appResult = this.appDb.pragma(`wal_checkpoint(${mode})`) as Array<{ busy: number; log: number; checkpointed: number }>;
        if (appResult[0]?.log > this.walConfig.sizeWarningThreshold) {
          logger.warn('App database WAL file growing large', {
            database: 'app',
            logPages: appResult[0].log,
            checkpointedPages: appResult[0].checkpointed,
            threshold: this.walConfig.sizeWarningThreshold
          });
        }
      } catch (error) {
        logger.error('Failed to checkpoint WAL', {
          database: 'app',
          mode,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (this.projectDb) {
      try {
        const projectResult = this.projectDb.pragma(`wal_checkpoint(${mode})`) as Array<{ busy: number; log: number; checkpointed: number }>;
        if (projectResult[0]?.log > this.walConfig.sizeWarningThreshold) {
          logger.warn('Project database WAL file growing large', {
            database: 'project',
            logPages: projectResult[0].log,
            checkpointedPages: projectResult[0].checkpointed,
            threshold: this.walConfig.sizeWarningThreshold
          });
        }
      } catch (error) {
        logger.error('Failed to checkpoint WAL', {
          database: 'project',
          mode,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.debug('WAL checkpoint completed', { mode });
  }

  /**
   * Force a full WAL checkpoint and truncate WAL files.
   * Use sparingly - this blocks until complete.
   * Recommended to call before app quit for clean shutdown.
   */
  forceCheckpoint(): void {
    logger.info('Forcing WAL checkpoint (TRUNCATE mode)');
    this.performCheckpoint('TRUNCATE');
  }

  /**
   * Configure WAL checkpoint settings.
   * Call before initialize() or after stopPeriodicCheckpointing() for changes to take effect.
   *
   * @param config - Partial configuration to merge with defaults
   */
  configureWalCheckpoint(config: Partial<WalCheckpointConfig>): void {
    this.walConfig = { ...this.walConfig, ...config };
    logger.info('WAL checkpoint configuration updated', this.walConfig);
  }

  /**
   * Get current WAL checkpoint configuration
   */
  getWalConfig(): Readonly<WalCheckpointConfig> {
    return { ...this.walConfig };
  }

  /**
   * Get current WAL status for both databases.
   * Useful for monitoring and debugging.
   */
  getWalStatus(): { app: WalStatus | null; project: WalStatus | null } {
    const getStatus = (db: Database.Database | null, name: string): WalStatus | null => {
      if (!db) return null;

      try {
        const checkpoint = db.pragma('wal_checkpoint(PASSIVE)') as Array<{ busy: number; log: number; checkpointed: number }>;
        const pageSize = db.pragma('page_size') as Array<{ page_size: number }>;

        return {
          database: name,
          walPages: checkpoint[0]?.log || 0,
          checkpointedPages: checkpoint[0]?.checkpointed || 0,
          isBusy: (checkpoint[0]?.busy || 0) > 0,
          estimatedWalSizeBytes: (checkpoint[0]?.log || 0) * (pageSize[0]?.page_size || 4096)
        };
      } catch (error) {
        logger.error(`Failed to get WAL status for ${name}`, error instanceof Error ? error : new Error(String(error)));
        return null;
      }
    };

    return {
      app: getStatus(this.appDb, 'app'),
      project: getStatus(this.projectDb, 'project')
    };
  }

  /**
   * Close both databases.
   * Performs final checkpoint before closing for clean shutdown.
   */
  close(): void {
    // Stop periodic checkpointing
    this.stopPeriodicCheckpointing();

    // Force final checkpoint before closing
    this.forceCheckpoint();

    if (this.appDb) {
      this.appDb.close();
      this.appDb = null;
    }
    if (this.projectDb) {
      this.projectDb.close();
      this.projectDb = null;
    }
    logger.info('Databases closed');
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();
