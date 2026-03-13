import { app } from 'electron';
import { join } from 'path';
import { mkdir, readdir, rm, readFile, writeFile, stat, copyFile, unlink } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { databaseManager } from '../database/core/DatabaseManager';
import { logger } from '../utils/logger';

const execFileAsync = promisify(execFile);

const BackupMetadataSchema = z.object({
  timestamp: z.number(),
  reason: z.string().optional(),
  appDbSize: z.number(),
  projectDbSize: z.number(),
  version: z.string(),
});

export type BackupMetadata = z.infer<typeof BackupMetadataSchema>;

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
const BACKUP_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const MIN_DISK_SPACE_MB = 500; // Minimum floor for disk space check (MB)

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
   * Get free disk space in MB for the backups directory.
   * Returns null if unable to determine (non-critical).
   */
  private async getFreeDiskSpaceMB(): Promise<number | null> {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execFileAsync('wmic', [
          'logicaldisk',
          'where',
          `DeviceID='${this.backupsDir.charAt(0)}:'`,
          'get',
          'FreeSpace',
          '/value',
        ]);
        const match = stdout.match(/FreeSpace=(\d+)/);
        if (match) {
          return Math.round(parseInt(match[1], 10) / 1024 / 1024);
        }
      } else {
        const { stdout } = await execFileAsync('df', ['-k', this.backupsDir]);
        const lines = stdout.trim().split('\n');
        if (lines.length >= 2) {
          const parts = lines[1].split(/\s+/);
          const availableKB = parseInt(parts[3], 10);
          if (!isNaN(availableKB)) {
            return Math.round(availableKB / 1024);
          }
        }
      }
    } catch (error) {
      logger.warn('Unable to verify disk space before backup', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return null;
  }

  /**
   * Compress a file using gzip and delete the original.
   */
  private async compressFile(srcPath: string, destPath: string): Promise<void> {
    await pipeline(createReadStream(srcPath), createGzip(), createWriteStream(destPath));
    await unlink(srcPath);
  }

  /**
   * Decompress a gzip file to a destination path.
   */
  private async decompressFile(srcPath: string, destPath: string): Promise<void> {
    await pipeline(createReadStream(srcPath), createGunzip(), createWriteStream(destPath));
  }

  /**
   * Wrap a promise with a timeout.
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${operation} timed out after ${timeoutMs / 1000}s`));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
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
      // Calculate required disk space based on source DB sizes
      const { appDbPath, projectDbPath } = databaseManager.getPaths();
      const sourceAppStat = await stat(appDbPath).catch(() => null);
      const sourceProjectStat = await stat(projectDbPath).catch(() => null);
      const totalDbSizeMB = Math.ceil(
        ((sourceAppStat?.size ?? 0) + (sourceProjectStat?.size ?? 0)) / (1024 * 1024),
      );
      const requiredMB = Math.max(totalDbSizeMB * 2, MIN_DISK_SPACE_MB);

      const freeMB = await this.getFreeDiskSpaceMB();
      if (freeMB !== null && freeMB < requiredMB) {
        logger.warn('Skipping backup — insufficient disk space', {
          freeSpaceMB: freeMB,
          requiredMB,
        });
        return {
          success: false,
          error: `Insufficient disk space: ${freeMB}MB free, ${requiredMB}MB required`,
        };
      }

      logger.info(`Starting backup`, { reason, backupDir: backupDirName });

      // Create backup directory
      await mkdir(backupDir, { recursive: true });

      // Force WAL checkpoint before backup, retry once if busy
      let checkpointResult = databaseManager.forceCheckpoint();
      if (checkpointResult.appBusy || checkpointResult.projectBusy) {
        logger.info('WAL checkpoint found busy database, retrying after 1s', {
          appBusy: checkpointResult.appBusy,
          projectBusy: checkpointResult.projectBusy,
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        checkpointResult = databaseManager.forceCheckpoint();
        if (checkpointResult.appBusy || checkpointResult.projectBusy) {
          logger.warn('WAL checkpoint still busy after retry, proceeding with best-effort backup', {
            appBusy: checkpointResult.appBusy,
            projectBusy: checkpointResult.projectBusy,
          });
        }
      }

      // Backup both databases using better-sqlite3's backup API (with timeout)
      const appDb = databaseManager.getAppDatabase();
      const projectDb = databaseManager.getProjectDatabase();

      const appBackupPath = join(backupDir, 'showstack-app.db');
      const projectBackupPath = join(backupDir, 'showstack-projects.db');
      const appBackupGzPath = `${appBackupPath}.gz`;
      const projectBackupGzPath = `${projectBackupPath}.gz`;

      await this.withTimeout(appDb.backup(appBackupPath), BACKUP_TIMEOUT_MS, 'App database backup');
      await this.withTimeout(
        projectDb.backup(projectBackupPath),
        BACKUP_TIMEOUT_MS,
        'Project database backup',
      );

      // Verify backup integrity before compression (requires uncompressed file)
      await this.verifyBackupIntegrity(appBackupPath, 'app');
      await this.verifyBackupIntegrity(projectBackupPath, 'project');

      // Compress backups to save disk space (~60-80% reduction for SQLite files)
      await this.compressFile(appBackupPath, appBackupGzPath);
      await this.compressFile(projectBackupPath, projectBackupGzPath);

      // Get compressed file sizes for metadata
      const appDbStat = await stat(appBackupGzPath);
      const projectDbStat = await stat(projectBackupGzPath);

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
   * Verify a backup database file's integrity using PRAGMA quick_check.
   * Opens the file in read-only mode, runs the check, and closes immediately.
   */
  private async verifyBackupIntegrity(dbPath: string, dbName: string): Promise<void> {
    const Database = (await import('better-sqlite3')).default;
    let db: InstanceType<typeof Database> | null = null;
    try {
      db = new Database(dbPath, { readonly: true });
      const result = db.pragma('quick_check') as Array<{ quick_check: string }>;
      if (result[0]?.quick_check !== 'ok') {
        throw new Error(`Integrity check failed for ${dbName} backup: ${result[0]?.quick_check}`);
      }
      logger.debug(`Backup integrity verified`, { database: dbName });
    } finally {
      if (db) {
        db.close();
      }
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
        const parsed = JSON.parse(content);
        const validated = BackupMetadataSchema.parse(parsed);
        results.push(validated);
      } catch (error) {
        logger.warn('Skipping backup with invalid metadata', {
          backupDir: dir,
          error: error instanceof Error ? error.message : String(error),
        });
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
      await stat(join(backupDir, 'metadata.json'));

      // Support both compressed (new) and uncompressed (legacy) backup formats
      const appDbGzStat = await stat(join(backupDir, 'showstack-app.db.gz')).catch(() => null);
      const appDbStat =
        appDbGzStat ?? (await stat(join(backupDir, 'showstack-app.db')).catch(() => null));
      const projectDbGzStat = await stat(join(backupDir, 'showstack-projects.db.gz')).catch(
        () => null,
      );
      const projectDbStat =
        projectDbGzStat ?? (await stat(join(backupDir, 'showstack-projects.db')).catch(() => null));

      return (appDbStat?.size ?? 0) > 0 && (projectDbStat?.size ?? 0) > 0;
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

    const backupDir = join(this.backupsDir, backupDirName);
    const { appDbPath, projectDbPath } = databaseManager.getPaths();
    const tempDir = join(this.backupsDir, '.restore-rollback');

    try {
      // Check version compatibility
      const metadataContent = await readFile(join(backupDir, 'metadata.json'), 'utf-8');
      const metadata = BackupMetadataSchema.parse(JSON.parse(metadataContent));
      const currentMajor = app.getVersion().split('.')[0];
      const backupMajor = metadata.version.split('.')[0];
      if (currentMajor !== backupMajor) {
        return {
          success: false,
          error: `Version mismatch: backup is v${metadata.version} (major ${backupMajor}), current app is v${app.getVersion()} (major ${currentMajor})`,
        };
      }

      logger.info(`Restoring from backup`, { backupDir: backupDirName });

      // Save current DB files for rollback before overwriting
      await mkdir(tempDir, { recursive: true });
      await copyFile(appDbPath, join(tempDir, 'showstack-app.db'));
      await copyFile(projectDbPath, join(tempDir, 'showstack-projects.db'));

      // Close databases before restore
      databaseManager.close();

      try {
        // Restore backup files — support both compressed (.db.gz) and legacy (.db) formats
        const appGzPath = join(backupDir, 'showstack-app.db.gz');
        const projectGzPath = join(backupDir, 'showstack-projects.db.gz');
        const appLegacyPath = join(backupDir, 'showstack-app.db');
        const projectLegacyPath = join(backupDir, 'showstack-projects.db');

        const appGzExists = await stat(appGzPath)
          .then(() => true)
          .catch(() => false);
        const projectGzExists = await stat(projectGzPath)
          .then(() => true)
          .catch(() => false);

        if (appGzExists) {
          await this.decompressFile(appGzPath, appDbPath);
        } else {
          await copyFile(appLegacyPath, appDbPath);
        }

        if (projectGzExists) {
          await this.decompressFile(projectGzPath, projectDbPath);
        } else {
          await copyFile(projectLegacyPath, projectDbPath);
        }

        // Reinitialize databases
        await databaseManager.initialize();
      } catch (restoreError) {
        // Rollback: restore original files
        logger.error('Restore failed, rolling back to original databases', {
          error: restoreError instanceof Error ? restoreError.message : String(restoreError),
        });

        await copyFile(join(tempDir, 'showstack-app.db'), appDbPath);
        await copyFile(join(tempDir, 'showstack-projects.db'), projectDbPath);
        await databaseManager.initialize();

        throw restoreError;
      }

      // Clean up rollback files on success
      await rm(tempDir, { recursive: true, force: true });

      logger.info(`Restore completed`, { backupDir: backupDirName });

      return { success: true, restoredFrom: backupDirName };
    } catch (error) {
      // Clean up temp dir if it still exists
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }

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
