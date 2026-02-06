import { ipcMain, BrowserWindow } from 'electron';
import { windowManager } from '../services/WindowManager';
import { ValidationError } from '../errors';

/**
 * Register window operation IPC handlers
 */
export function registerWindowHandlers(): void {
  /**
   * Open a project in a new window (or focus existing window)
   */
  ipcMain.handle('window:openProject', async (_, projectId: string): Promise<void> => {
    try {
      // Validation
      if (!projectId || projectId.trim().length === 0) {
        throw new ValidationError('Project ID is required', 'projectId', projectId);
      }

      windowManager.createOrFocusProjectWindow(projectId);
    } catch (error) {
      console.error('Failed to open project window:', {
        operation: 'window:openProject',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      throw new Error(`Unable to open project window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  /**
   * Get the current window's project ID (if any)
   */
  ipcMain.handle('window:getCurrentProjectId', (event): string | null => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) return null;
      const info = windowManager.getWindowInfo(window.id);
      return info?.projectId || null;
    } catch (error) {
      console.error('Failed to get current project ID:', {
        operation: 'window:getCurrentProjectId',
        error: error instanceof Error ? error.message : error
      });
      return null;
    }
  });

  console.log('✅ Window IPC handlers registered');
}
