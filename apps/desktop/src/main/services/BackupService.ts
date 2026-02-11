import { app } from 'electron';
import { join } from 'path';
import { mkdir, readdir, rm, readFile, writeFile, stat, copyFile } from 'fs/promises';
import { databaseManager } from '../database/core/DatabaseManager';
import { logger } from '../utils/logger';

export interface BackupMetadata {
  timestamp: number;
  reason?: string;
  appDbSize: number;
  projectDbSize: number;
  version: string;
}

export interface BackupResult {
  success: boolean;
  backupDir?: string;
  metadata?: BackupMetadata;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  restoredFrom?: string;
  error?: string;
}

const BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_BACKUPS = 10;
const INITIAL_BACKUP_DELAY_MS = 60 * 1000; // 1 minute
const BACKUP_DIR_PREFIX = 'backup-';

export class BackupService {
  private backupInterval: NodeJS.Timeout | null = null;
  private initialTimeout: NodeJS.Timeout | null = null;
  private isBackupInProgress = false;
  private backupsDir: string;

  constructor() {
    this.backupsDir = join(app.getPath('userData'), 'backups');
  }

  /**
   * Start the backup service: ensure directory, clean up incomplete backups,
   * schedule initial + recurring backups.
   */
  async start(): Promise<void> {
    if (this.backupInterval) {
      logger.info('Backup service already running');
      return;
    }

    logger.info('Starting backup service');

    // Ensure backups directory exists
    await mkdir(this.backupsDir, { recursive: true });

    // Clean up incomplete backups (dirs without metadata.json)
    await this.cleanupIncompleteBackups();

    // Schedule initial backup after delay
    this.initialTimeout = setTimeout(() => {
      this.performBackup('automatic').catch((error) => {
        logger.error('Initial automatic backup failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, INITIAL_BACKUP_DELAY_MS);

    // Schedule recurring backups
    this.backupInterval = setInterval(() => {
      this.performBackup('automatic').catch((error) => {
        logger.error('Scheduled automatic backup failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, BACKUP_INTERVAL_MS);

    // Don't prevent Node from exiting
    this.backupInterval.unref();
  }

  /**
   * Stop the backup service.
   */
  stop(): void {
    if (this.initialTimeout) {
      clearTimeout(this.initialTimeout);
      this.initialTimeout = null;
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      logger.info('Backup service stopped');
    }
  }

  /**
   * Check if the backup service is running.
   */
  isRunning(): boolean {
    return this.backupInterval !== null;
  }

  /**
   * Perform a backup of both databases.
   */
  async performBackup(reason?: string): Promise<BackupResult> {
    if (this.isBackupInProgress) {
      logger.info('Backup already in progress, skipping');
      return { success: false, error: 'Backup already in progress' };
    }

    this.isBackupInProgress = true;
    const timestamp = Date.now();
    const backupDirName = `${BACKUP_DIR_PREFIX}${timestamp}`;
    const backupDir = join(this.backupsDir, backupDirName);

    try {
      logger.info(`Starting backup`, { reason, backupDir: backupDirName });

      // Create backup directory
      await mkdir(backupDir, { recursive: true });

      // Force WAL checkpoint before backup
      databaseManager.forceCheckpoint();

      const { appDbPath, projectDbPath } = databaseManager.getPaths();

      // Backup both databases using better-sqlite3's backup API
      const appDb = databaseManager.getAppDatabase();
      const projectDb = databaseManager.getProjectDatabase();

      await appDb.backup(join(backupDir, 'showstack-app.db'));
      await projectDb.backup(join(backupDir, 'showstack-projects.db'));

      // Get file sizes
      const appDbStat = await stat(join(backupDir, 'showstack-app.db'));
      const projectDbStat = await stat(join(backupDir, 'showstack-projects.db'));

      // Write metadata last — if missing, backup is incomplete
      const metadata: BackupMetadata = {
        timestamp,
        reason,
        appDbSize: appDbStat.size,
        projectDbSize: projectDbStat.size,
        version: app.getVersion(),
      };

      await writeFile(join(backupDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

      logger.info(`Backup completed`, {
        backupDir: backupDirName,
        appDbSize: metadata.appDbSize,
        projectDbSize: metadata.projectDbSize,
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      return { success: true, backupDir: backupDirName, metadata };
    } catch (error) {
      logger.error('Backup failed', {
        error: error instanceof Error ? error.message : String(error),
        backupDir: backupDirName,
      });

      // Attempt to clean up failed backup directory
      try {
        await rm(backupDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Clean up old backups beyond MAX_BACKUPS, keeping newest.
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      const backupDirs = await this.getBackupDirs();

      if (backupDirs.length <= MAX_BACKUPS) {
        return;
      }

      // backupDirs sorted oldest-first, remove oldest beyond limit
      const toDelete = backupDirs.slice(0, backupDirs.length - MAX_BACKUPS);

      for (const dir of toDelete) {
        logger.info(`Removing old backup`, { backupDir: dir });
        await rm(join(this.backupsDir, dir), { recursive: true, force: true });
      }
    } catch (error) {
      logger.error('Failed to clean up old backups', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clean up incomplete backups (directories without metadata.json).
   */
  private async cleanupIncompleteBackups(): Promise<void> {
    try {
      const backupDirs = await this.getBackupDirs();

      for (const dir of backupDirs) {
        const metadataPath = join(this.backupsDir, dir, 'metadata.json');
        try {
          await stat(metadataPath);
        } catch {
          logger.info(`Removing incomplete backup`, { backupDir: dir });
          await rm(join(this.backupsDir, dir), { recursive: true, force: true });
        }
      }
    } catch (error) {
      logger.error('Failed to clean up incomplete backups', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get sorted list of backup directory names (oldest first).
   */
  async getBackupDirs(): Promise<string[]> {
    try {
      const entries = await readdir(this.backupsDir, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory() && e.name.startsWith(BACKUP_DIR_PREFIX))
        .map((e) => e.name)
        .sort(); // Lexicographic sort works because names contain timestamps
    } catch {
      return [];
    }
  }

  /**
   * List all valid backups with their metadata.
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const backupDirs = await this.getBackupDirs();
    const results: BackupMetadata[] = [];

    for (const dir of backupDirs) {
      try {
        const metadataPath = join(this.backupsDir, dir, 'metadata.json');
        const content = await readFile(metadataPath, 'utf-8');
        results.push(JSON.parse(content) as BackupMetadata);
      } catch {
        // Skip backups without valid metadata
      }
    }

    // Return sorted newest-first for display
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Validate that a backup directory contains all required files.
   */
  async validateBackup(backupDirName: string): Promise<boolean> {
    const backupDir = join(this.backupsDir, backupDirName);

    try {
      const appDbStat = await stat(join(backupDir, 'showstack-app.db'));
      const projectDbStat = await stat(join(backupDir, 'showstack-projects.db'));
      await stat(join(backupDir, 'metadata.json'));

      // Verify files have content
      return appDbStat.size > 0 && projectDbStat.size > 0;
    } catch {
      return false;
    }
  }

  /**
   * Restore databases from a backup.
   */
  async restoreFromBackup(backupDirName: string): Promise<RestoreResult> {
    // Validate directory name (prevent path traversal)
    if (
      !backupDirName.startsWith(BACKUP_DIR_PREFIX) ||
      backupDirName.includes('/') ||
      backupDirName.includes('\\')
    ) {
      return { success: false, error: 'Invalid backup directory name' };
    }

    const isValid = await this.validateBackup(backupDirName);
    if (!isValid) {
      return { success: false, error: 'Backup is invalid or incomplete' };
    }

    try {
      logger.info(`Restoring from backup`, { backupDir: backupDirName });

      const backupDir = join(this.backupsDir, backupDirName);
      const { appDbPath, projectDbPath } = databaseManager.getPaths();

      // Close databases before restore
      databaseManager.close();

      // Copy backup files to database paths
      await copyFile(join(backupDir, 'showstack-app.db'), appDbPath);
      await copyFile(join(backupDir, 'showstack-projects.db'), projectDbPath);

      // Reinitialize databases
      await databaseManager.initialize();

      logger.info(`Restore completed`, { backupDir: backupDirName });

      return { success: true, restoredFrom: backupDirName };
    } catch (error) {
      logger.error('Restore failed', {
        error: error instanceof Error ? error.message : String(error),
        backupDir: backupDirName,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete a specific backup.
   */
  async deleteBackup(backupDirName: string): Promise<{ success: boolean; error?: string }> {
    // Validate directory name (prevent path traversal)
    if (
      !backupDirName.startsWith(BACKUP_DIR_PREFIX) ||
      backupDirName.includes('/') ||
      backupDirName.includes('\\')
    ) {
      return { success: false, error: 'Invalid backup directory name' };
    }

    try {
      const backupDir = join(this.backupsDir, backupDirName);
      await rm(backupDir, { recursive: true, force: true });
      logger.info(`Deleted backup`, { backupDir: backupDirName });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Singleton instance
export const backupService = new BackupService();
