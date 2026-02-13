import { app } from 'electron';
import { join } from 'path';
import { writeFile, unlink, access } from 'fs/promises';
import { databaseManager } from '../database/core/DatabaseManager';
import { backupService } from './BackupService';
import { logger } from '../utils/logger';

export interface RecoveryResult {
  crashDetected: boolean;
  integrityOk: boolean;
  restored: boolean;
  restoredFrom?: string;
  error?: string;
}

const MARKER_FILENAME = '.showstack-running';

export class CrashRecoveryService {
  private markerPath: string;

  constructor() {
    this.markerPath = join(app.getPath('userData'), MARKER_FILENAME);
  }

  /**
   * Main entry point: detect crash, validate integrity, restore if needed.
   */
  async checkAndRecover(): Promise<RecoveryResult> {
    const crashDetected = await this.wasCrashDetected();

    if (!crashDetected) {
      return { crashDetected: false, integrityOk: true, restored: false };
    }

    logger.warn('Previous session did not shut down cleanly');

    const integrityOk = await this.validateDatabaseIntegrity();

    if (integrityOk) {
      logger.info('Database integrity OK despite crash — no restore needed');
      return { crashDetected: true, integrityOk: true, restored: false };
    }

    logger.error('Database integrity check failed after crash — attempting restore');

    return this.attemptRestore();
  }

  /**
   * Write marker file to indicate the app is running.
   */
  async markRunning(): Promise<void> {
    try {
      await writeFile(this.markerPath, String(Date.now()));
    } catch (error) {
      logger.error('Failed to write crash marker file', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete marker file on clean shutdown.
   */
  async markCleanShutdown(): Promise<void> {
    try {
      await unlink(this.markerPath);
    } catch (error) {
      // ENOENT is expected if marker doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error('Failed to remove crash marker file', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Check if the marker file exists (indicates previous crash).
   */
  private async wasCrashDetected(): Promise<boolean> {
    try {
      await access(this.markerPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run PRAGMA integrity_check on both databases.
   */
  async validateDatabaseIntegrity(): Promise<boolean> {
    try {
      const appDb = databaseManager.getAppDatabase();
      const appResult = appDb.pragma('integrity_check') as Array<{
        integrity_check: string;
      }>;
      if (appResult[0]?.integrity_check !== 'ok') {
        logger.error('App database integrity check failed', {
          result: appResult[0]?.integrity_check,
        });
        return false;
      }

      const projectDb = databaseManager.getProjectDatabase();
      const projectResult = projectDb.pragma('integrity_check') as Array<{
        integrity_check: string;
      }>;
      if (projectResult[0]?.integrity_check !== 'ok') {
        logger.error('Project database integrity check failed', {
          result: projectResult[0]?.integrity_check,
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Database integrity validation threw an error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Find the latest valid backup and restore from it.
   */
  private async attemptRestore(): Promise<RecoveryResult> {
    try {
      const backupDirs = await backupService.getBackupDirs();

      // Iterate newest-first to find a valid backup
      for (let i = backupDirs.length - 1; i >= 0; i--) {
        const dir = backupDirs[i];
        const isValid = await backupService.validateBackup(dir);

        if (isValid) {
          logger.info(`Attempting restore from backup`, { backupDir: dir });
          const result = await backupService.restoreFromBackup(dir);

          if (result.success) {
            logger.info(`Successfully restored from backup`, { backupDir: dir });
            return {
              crashDetected: true,
              integrityOk: false,
              restored: true,
              restoredFrom: dir,
            };
          }

          logger.error(`Restore from backup failed`, {
            backupDir: dir,
            error: result.error,
          });
        }
      }

      // No valid backups found
      logger.error(
        'No valid backups available for restore — continuing with potentially corrupted database',
      );
      return {
        crashDetected: true,
        integrityOk: false,
        restored: false,
        error: 'No valid backups available',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Crash recovery restore failed', { error: message });
      return {
        crashDetected: true,
        integrityOk: false,
        restored: false,
        error: message,
      };
    }
  }
}

// Singleton instance
export const crashRecoveryService = new CrashRecoveryService();
