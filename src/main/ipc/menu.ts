/**
 * Menu IPC Handlers
 * Handles communication between renderer process and menu system
 */

import { ipcMain, BrowserWindow } from 'electron';
import { menuState, MenuStateData } from '../menu/menuState';
import { buildMenu } from '../menu/menuTemplate';

/**
 * Register all menu-related IPC handlers
 */
export function registerMenuHandlers(): void {
  // Update menu state from renderer
  ipcMain.handle('menu:setState', async (event, newState: Partial<MenuStateData>) => {
    menuState.setState(newState);

    // Rebuild menu with new state
    const menu = buildMenu(menuState.getState());
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      window.setMenu(menu);
    }

    return { success: true };
  });

  // Get current menu state
  ipcMain.handle('menu:getState', async () => {
    return menuState.getState();
  });

  // Reset menu state
  ipcMain.handle('menu:reset', async () => {
    menuState.reset();

    // Rebuild menu with default state
    const menu = buildMenu(menuState.getState());
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.setMenu(menu);
    });

    return { success: true };
  });

  // Developer mode changed - open/close DevTools
  ipcMain.handle('menu:developerModeChanged', async (event, enabled: boolean) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (enabled) {
        window.webContents.openDevTools();
      } else {
        window.webContents.closeDevTools();
      }
    }
    return { success: true };
  });
}

/**
 * Initialize menu for a window
 */
export function initializeMenuForWindow(window: BrowserWindow): void {
  // Build initial menu
  const menu = buildMenu(menuState.getState());
  window.setMenu(menu);

  // Subscribe to state changes
  menuState.onStateChange((state) => {
    const updatedMenu = buildMenu(state);
    window.setMenu(updatedMenu);
  });
}
