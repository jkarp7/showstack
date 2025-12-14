/**
 * Shell IPC Handlers
 * Handles shell operations like opening external URLs
 */

import { ipcMain, shell } from 'electron';

/**
 * Register shell IPC handlers
 */
export function registerShellHandlers(): void {
  // Open external URL in default browser
  ipcMain.handle('shell:openExternal', async (event, url: string) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Error opening external URL:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}
