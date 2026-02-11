/**
 * Menu IPC Handlers
 * Handles communication between renderer process and menu system
 */

import { ipcMain, BrowserWindow, Menu } from 'electron';
import { menuState, MenuStateData } from '../menu/menuState';
import { buildMenu } from '../menu/menuTemplate';
import { logger } from '../utils/logger';

/**
 * Register all menu-related IPC handlers
 */
export function registerMenuHandlers(): void {
  // Update menu state from renderer
  ipcMain.handle('menu:setState', async (event, newState: Partial<MenuStateData>) => {
    try {
      menuState.setState(newState);

      // Rebuild menu with new state
      const menu = buildMenu(menuState.getState());
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.setMenu(menu);
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to set menu state:', {
        operation: 'menu:setState',
        error: error instanceof Error ? error.message : error,
      });

      throw new Error(
        `Unable to update menu: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  // Get current menu state
  ipcMain.handle('menu:getState', async () => {
    try {
      return menuState.getState();
    } catch (error) {
      logger.error('Failed to get menu state:', {
        operation: 'menu:getState',
        error: error instanceof Error ? error.message : error,
      });

      throw new Error(
        `Unable to get menu state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  // Reset menu state
  ipcMain.handle('menu:reset', async () => {
    try {
      menuState.reset();

      // Rebuild menu with default state
      const menu = buildMenu(menuState.getState());
      const windows = BrowserWindow.getAllWindows();
      windows.forEach((window) => {
        window.setMenu(menu);
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to reset menu:', {
        operation: 'menu:reset',
        error: error instanceof Error ? error.message : error,
      });

      throw new Error(
        `Unable to reset menu: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  // Developer mode changed - open/close DevTools
  ipcMain.handle('menu:developerModeChanged', async (event, enabled: boolean) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        if (enabled) {
          window.webContents.openDevTools();
        } else {
          window.webContents.closeDevTools();
        }
      }
      return { success: true };
    } catch (error) {
      logger.error('Failed to toggle developer mode:', {
        operation: 'menu:developerModeChanged',
        enabled,
        error: error instanceof Error ? error.message : error,
      });

      throw new Error(
        `Unable to toggle developer mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });
}

/**
 * Initialize application menu (called once at startup)
 */
export function initializeApplicationMenu(): void {
  logger.info('🍔 Initializing application menu, platform:', process.platform);

  // Import app to check and set name
  const { app } = require('electron');
  logger.info('🏷️  Current app name:', app.getName());

  // Force set app name right before menu creation
  app.setName('ShowStack');
  logger.info('🏷️  App name after setName:', app.getName());

  // Clear any default Electron menu first
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(null);
    logger.info('🧹 Cleared default menu');
  }

  // Build initial menu
  const menu = buildMenu(menuState.getState());

  logger.info('🍔 Menu has', menu.items.length, 'top-level items');
  logger.info('🍔 Menu items:', menu.items.map((item) => item.label).join(', '));

  // On macOS, set application menu (global)
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(menu);
    logger.info('✅ Application menu set for macOS');
  }

  // Subscribe to state changes (only once, not per-window)
  menuState.onStateChange((state) => {
    const updatedMenu = buildMenu(state);
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(updatedMenu);
    } else {
      // On Windows/Linux, update all window menus
      const windows = BrowserWindow.getAllWindows();
      windows.forEach((window) => {
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
    logger.info('✅ Window menu set for', process.platform);
  }
  // On macOS, menu is already set globally, nothing to do
}
