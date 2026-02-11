import { ipcMain, dialog, BrowserWindow } from 'electron';
import { logger } from '../utils/logger';

export function registerDialogHandlers(): void {
  // Show open dialog for selecting image files (logo upload)
  ipcMain.handle('dialog:openImage', async () => {
    try {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        throw new Error('No window available');
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Show Logo',
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      logger.error('Failed to open image dialog:', {
        operation: 'dialog:openImage',
        error: error instanceof Error ? error.message : error,
      });

      throw new Error(
        `Unable to open file dialog: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  // Show open dialog for selecting project files
  ipcMain.handle('dialog:openProject', async () => {
    try {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        throw new Error('No window available');
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Open Project File',
        properties: ['openFile'],
        filters: [
          { name: 'ShowStack Projects', extensions: ['showstack', 'ssp'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      logger.error('Failed to open project dialog:', {
        operation: 'dialog:openProject',
        error: error instanceof Error ? error.message : error,
      });

      throw new Error(
        `Unable to open file dialog: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  logger.info('✅ Dialog IPC handlers registered');
}
