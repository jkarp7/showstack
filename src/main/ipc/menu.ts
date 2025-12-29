/**
 * Menu IPC Handlers
 * Handles communication between renderer process and menu system
 */

import { ipcMain, BrowserWindow, Menu } from 'electron';
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
 * Initialize application menu (called once at startup)
 */
export function initializeApplicationMenu(): void {
  console.log('🍔 Initializing application menu, platform:', process.platform);

  // Import app to check and set name
  const { app } = require('electron');
  console.log('🏷️  Current app name:', app.getName());

  // Force set app name right before menu creation
  app.setName('ShowStack');
  console.log('🏷️  App name after setName:', app.getName());

  // Clear any default Electron menu first
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(null);
    console.log('🧹 Cleared default menu');
  }

  // Build initial menu
  const menu = buildMenu(menuState.getState());

  console.log('🍔 Menu has', menu.items.length, 'top-level items');
  console.log('🍔 Menu items:', menu.items.map(item => item.label).join(', '));

  // On macOS, set application menu (global)
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(menu);
    console.log('✅ Application menu set for macOS');
  }

  // Subscribe to state changes (only once, not per-window)
  menuState.onStateChange((state) => {
    const updatedMenu = buildMenu(state);
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(updatedMenu);
    } else {
      // On Windows/Linux, update all window menus
      const windows = BrowserWindow.getAllWindows();
      windows.forEach(window => {
        window.setMenu(updatedMenu);
      });
    }
  });
}

/**
 * Initialize menu for a window (Windows/Linux only)
 */
export function initializeMenuForWindow(window: BrowserWindow): void {
  // On Windows/Linux, set per-window menu
  if (process.platform !== 'darwin') {
    const menu = buildMenu(menuState.getState());
    window.setMenu(menu);
    console.log('✅ Window menu set for', process.platform);
  }
  // On macOS, menu is already set globally, nothing to do
}
