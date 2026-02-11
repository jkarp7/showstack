import { ipcMain } from 'electron';
import { windowManager } from '../services/WindowManager';
import { logger } from '../utils/logger';

export function registerSettingsHandlers() {
  /**
   * Handle developer mode toggle
   */
  ipcMain.handle('settings:developer-mode-changed', async (_event, enabled: boolean) => {
    try {
      const windows = windowManager.getAllWindows();

      windows.forEach((window) => {
        if (!window.isDestroyed()) {
          if (enabled) {
            // Open DevTools
            window.webContents.openDevTools();
          } else {
            // Close DevTools
            window.webContents.closeDevTools();
          }
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to toggle developer mode:', {
        operation: 'settings:developer-mode-changed',
        enabled,
        error: error instanceof Error ? error.message : error,
      });

      throw new Error(
        `Unable to toggle developer mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Toggle DevTools for a specific window
   */
  ipcMain.handle('settings:toggle-devtools', async (event) => {
    try {
      const window = windowManager.getAllWindows().find((w) => w.webContents === event.sender);

      if (window && !window.isDestroyed()) {
        if (window.webContents.isDevToolsOpened()) {
          window.webContents.closeDevTools();
        } else {
          window.webContents.openDevTools();
        }
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      logger.error('Failed to toggle devtools:', {
        operation: 'settings:toggle-devtools',
        error: error instanceof Error ? error.message : error,
      });

      throw new Error(
        `Unable to toggle DevTools: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });
}
