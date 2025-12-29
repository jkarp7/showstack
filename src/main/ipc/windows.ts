import { ipcMain, BrowserWindow } from 'electron';
import { windowManager } from '../services/WindowManager';

/**
 * Register window operation IPC handlers
 */
export function registerWindowHandlers(): void {
  /**
   * Open a project in a new window (or focus existing window)
   */
  ipcMain.handle('window:openProject', async (_, projectId: string): Promise<void> => {
    windowManager.createOrFocusProjectWindow(projectId);
  });

  /**
   * Get the current window's project ID (if any)
   */
  ipcMain.handle('window:getCurrentProjectId', (event): string | null => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;
    const info = windowManager.getWindowInfo(window.id);
    return info?.projectId || null;
  });

  console.log('✅ Window IPC handlers registered');
}
