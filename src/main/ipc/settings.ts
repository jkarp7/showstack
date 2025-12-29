import { ipcMain } from 'electron';
import { windowManager } from '../services/WindowManager';

export function registerSettingsHandlers() {
  /**
   * Handle developer mode toggle
   */
  ipcMain.handle('settings:developer-mode-changed', async (_event, enabled: boolean) => {
    const windows = windowManager.getAllWindows();

    windows.forEach(window => {
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
  });

  /**
   * Toggle DevTools for a specific window
   */
  ipcMain.handle('settings:toggle-devtools', async (event) => {
    const window = windowManager.getAllWindows().find(
      w => w.webContents === event.sender
    );

    if (window && !window.isDestroyed()) {
      if (window.webContents.isDevToolsOpened()) {
        window.webContents.closeDevTools();
      } else {
        window.webContents.openDevTools();
      }
      return { success: true };
    }

    return { success: false };
  });
}
