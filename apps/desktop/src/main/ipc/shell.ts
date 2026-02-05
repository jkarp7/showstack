/**
 * Shell IPC Handlers
 * Handles shell operations like opening external URLs
 */

import { ipcMain, shell } from 'electron';
import { ValidationError } from '../errors';

/**
 * Register shell IPC handlers
 */
export function registerShellHandlers(): void {
  // Open external URL in default browser
  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    try {
      // Validation
      if (!url || url.trim().length === 0) {
        throw new ValidationError('URL is required', 'url', url);
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new ValidationError('Invalid URL format', 'url', url);
      }

      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Failed to open external URL:', {
        operation: 'shell:openExternal',
        url: url?.substring(0, 50), // Log only first 50 chars
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        return { success: false, error: error.toUserMessage() };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}
