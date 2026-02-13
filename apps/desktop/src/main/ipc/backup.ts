import { ipcMain } from 'electron';
import { backupService } from '../services/BackupService';
import { logger } from '../utils/logger';

/**
 * Register backup IPC handlers
 */
export function registerBackupHandlers(): void {
  ipcMain.handle('backup:create', async (_event, reason?: string) => {
    try {
      return await backupService.performBackup(reason);
    } catch (error) {
      logger.error('IPC backup:create failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('backup:list', async () => {
    try {
      return await backupService.listBackups();
    } catch (error) {
      logger.error('IPC backup:list failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  });

  ipcMain.handle('backup:restore', async (_event, backupDirName: string) => {
    // Validate input
    if (
      !backupDirName ||
      typeof backupDirName !== 'string' ||
      !backupDirName.startsWith('backup-') ||
      backupDirName.includes('/') ||
      backupDirName.includes('\\')
    ) {
      return { success: false, error: 'Invalid backup directory name' };
    }

    try {
      return await backupService.restoreFromBackup(backupDirName);
    } catch (error) {
      logger.error('IPC backup:restore failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('backup:delete', async (_event, backupDirName: string) => {
    // Validate input
    if (
      !backupDirName ||
      typeof backupDirName !== 'string' ||
      !backupDirName.startsWith('backup-') ||
      backupDirName.includes('/') ||
      backupDirName.includes('\\')
    ) {
      return { success: false, error: 'Invalid backup directory name' };
    }

    try {
      return await backupService.deleteBackup(backupDirName);
    } catch (error) {
      logger.error('IPC backup:delete failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}
