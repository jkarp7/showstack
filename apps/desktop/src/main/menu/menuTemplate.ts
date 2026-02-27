// @ts-nocheck
/**
 * Context-Aware Application Menu Template
 * Dynamically builds Electron native menu based on current page context
 */

import { Menu, MenuItemConstructorOptions, BrowserWindow, app } from 'electron';
import { MenuStateData } from './menuState';
import { logger } from '../utils/logger';

/**
 * Build the application menu based on current context
 */
export function buildMenu(state: MenuStateData): Menu {
  const isMac = process.platform === 'darwin';
  const template: MenuItemConstructorOptions[] = [];

  logger.info('🏗️ Building menu for context:', state.context, 'isMac:', isMac);

  // macOS app menu
  if (isMac) {
    template.push({
      label: 'ShowStack',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings...',
          accelerator: 'Cmd+,',
          click: () => sendToRenderer('menu:settings'),
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  // File menu
  template.push(buildFileMenu(state, isMac));

  // Edit menu
  template.push(buildEditMenu(state, isMac));

  // View menu
  template.push(buildViewMenu(state));

  // Project menu (only when project is open)
  if (state.projectId) {
    template.push(buildProjectMenu(state));
  }

  // Tools menu
  template.push(buildToolsMenu(state, isMac));

  // Window menu
  template.push(buildWindowMenu(isMac));

  // Help menu
  template.push(buildHelpMenu());

  return Menu.buildFromTemplate(template);
}

/**
 * File Menu
 */
function buildFileMenu(state: MenuStateData, isMac: boolean): MenuItemConstructorOptions {
  const isToolContext = ['equipment', 'shop-order'].includes(state.context);
  const isProjectContext = state.context === 'project' || state.context === 'landing';

  return {
    label: 'File',
    submenu: [
      // New
      {
        label: isToolContext ? 'New File' : 'New Project',
        accelerator: 'CmdOrCtrl+N',
        click: () => sendToRenderer('menu:new'),
      },
      // Open
      {
        label: 'Open...',
        accelerator: 'CmdOrCtrl+O',
        click: () => sendToRenderer('menu:open'),
      },
      // Recent (placeholder - will be populated dynamically)
      {
        label: isToolContext ? 'Recent Files' : 'Recent Projects',
        submenu: [
          {
            label: 'No Recent Items',
            enabled: false,
          },
        ],
      },
      { type: 'separator' },
      // Save
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        enabled: isToolContext && state.isDirty,
        click: () => sendToRenderer('menu:save'),
      },
      // Save As
      {
        label: 'Save As...',
        accelerator: 'CmdOrCtrl+Shift+S',
        enabled: isToolContext,
        click: () => sendToRenderer('menu:saveAs'),
      },
      // Save as Copy (project context only)
      {
        label: 'Save as Copy',
        enabled: state.context === 'project' && !!state.projectId,
        click: () => sendToRenderer('menu:saveAsCopy'),
      },
      // Export Project (project context only)
      {
        label: 'Export Project...',
        enabled: state.context === 'project' && !!state.projectId,
        click: () => sendToRenderer('menu:exportProject'),
      },
      { type: 'separator' },
      // Export
      {
        label: 'Export',
        submenu: [
          {
            label: 'Export to CSV',
            enabled: state.context === 'equipment',
            click: () => sendToRenderer('menu:export:csv'),
          },
          { type: 'separator' },
          {
            label: 'Export for ETC Eos...',
            enabled: state.context === 'equipment',
            click: () => sendToRenderer('menu:export:eos'),
          },
          {
            label: 'Export for GrandMA2...',
            enabled: state.context === 'equipment',
            click: () => sendToRenderer('menu:export:grandma2'),
          },
          {
            label: 'Export for GrandMA3...',
            enabled: state.context === 'equipment',
            click: () => sendToRenderer('menu:export:grandma3'),
          },
        ],
      },
      // Print
      {
        label: 'Print...',
        accelerator: 'CmdOrCtrl+P',
        enabled: isToolContext,
        click: () => sendToRenderer('menu:print'),
      },
      { type: 'separator' },
      // Close Window
      {
        label: 'Close Window',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      },
      // Quit (non-macOS)
      ...(!isMac ? [{ type: 'separator' as const }, { role: 'quit' as const }] : []),
    ],
  };
}

/**
 * Edit Menu
 */
function buildEditMenu(state: MenuStateData, isMac: boolean): MenuItemConstructorOptions {
  const isToolContext = ['equipment', 'shop-order'].includes(state.context);
  const isEquipment = state.context === 'equipment';
  const isShopOrder = state.context === 'shop-order';

  return {
    label: 'Edit',
    submenu: [
      // Undo/Redo
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        enabled: isToolContext && state.canUndo,
        click: () => sendToRenderer('menu:undo'),
      },
      {
        label: 'Redo',
        accelerator: 'CmdOrCtrl+Shift+Z',
        enabled: isToolContext && state.canRedo,
        click: () => sendToRenderer('menu:redo'),
      },
      { type: 'separator' },
      // Standard edit operations
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      { type: 'separator' },
      // Tool-specific actions
      {
        label: 'Add Fixture',
        accelerator: 'CmdOrCtrl+Shift+N',
        enabled: isEquipment,
        click: () => sendToRenderer('menu:addFixture'),
      },
      {
        label: 'Add Section',
        enabled: isShopOrder,
        click: () => sendToRenderer('menu:addSection'),
      },
      {
        label: 'Bulk Edit...',
        enabled: isEquipment && state.hasSelection,
        click: () => sendToRenderer('menu:bulkEdit'),
      },
      {
        label: 'Duplicate',
        accelerator: 'CmdOrCtrl+D',
        enabled: isToolContext && state.hasSelection,
        click: () => sendToRenderer('menu:duplicate'),
      },
      { type: 'separator' },
      // Selection
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        enabled: isToolContext,
        click: () => sendToRenderer('menu:selectAll'),
      },
      {
        label: 'Deselect All',
        accelerator: 'Escape',
        enabled: isToolContext && state.hasSelection,
        click: () => sendToRenderer('menu:deselectAll'),
      },
    ],
  };
}

/**
 * View Menu
 */
function buildViewMenu(state: MenuStateData): MenuItemConstructorOptions {
  const isEquipment = state.context === 'equipment';

  return {
    label: 'View',
    submenu: [
      // Equipment Manager specific
      {
        label: 'Columns',
        enabled: isEquipment,
        submenu: [
          {
            label: 'Column Visibility...',
            click: () => sendToRenderer('menu:columns'),
          },
          {
            label: 'User Columns...',
            click: () => sendToRenderer('menu:userColumns'),
          },
        ],
      },
      {
        label: 'Sort By',
        enabled: isEquipment,
        submenu: [
          {
            label: 'Sort Options...',
            click: () => sendToRenderer('menu:sort'),
          },
          {
            label: 'Clear Sort',
            click: () => sendToRenderer('menu:clearSort'),
          },
        ],
      },
      {
        label: 'Filters',
        enabled: isEquipment,
        submenu: [
          {
            label: 'Filter Options...',
            click: () => sendToRenderer('menu:filters'),
          },
          {
            label: 'Clear Filters',
            click: () => sendToRenderer('menu:clearFilters'),
          },
        ],
      },
      {
        label: 'Reset View',
        enabled: isEquipment,
        click: () => sendToRenderer('menu:resetView'),
      },
      { type: 'separator' },
      // Theme
      {
        label: 'Toggle Dark Mode',
        accelerator: 'CmdOrCtrl+Shift+D',
        click: () => sendToRenderer('menu:toggleDarkMode'),
      },
      { type: 'separator' },
      // Zoom
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+Plus',
        role: 'zoomIn',
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        role: 'zoomOut',
      },
      {
        label: 'Reset Zoom',
        accelerator: 'CmdOrCtrl+0',
        role: 'resetZoom',
      },
      { type: 'separator' },
      // Developer Tools
      {
        label: 'Toggle Developer Tools',
        accelerator: 'CmdOrCtrl+Alt+I',
        role: 'toggleDevTools',
      },
      { role: 'reload' },
      { role: 'forceReload' },
    ],
  };
}

/**
 * Project Menu (only shown when project is open)
 */
function buildProjectMenu(state: MenuStateData): MenuItemConstructorOptions {
  return {
    label: 'Project',
    submenu: [
      {
        label: 'Edit Project Info...',
        click: () => sendToRenderer('menu:editProject'),
      },
      {
        label: 'Project Settings...',
        click: () => sendToRenderer('menu:projectSettings'),
      },
      { type: 'separator' },
      {
        label: 'Sync Now',
        accelerator: 'CmdOrCtrl+Shift+Y',
        enabled: false, // Will be enabled in Phase 5
        click: () => sendToRenderer('menu:sync'),
      },
      {
        label: 'Manage Team...',
        enabled: false, // Will be enabled in Phase 6
        click: () => sendToRenderer('menu:manageTeam'),
      },
      {
        label: 'Share Project...',
        enabled: false, // Will be enabled in Phase 6
        click: () => sendToRenderer('menu:shareProject'),
      },
    ],
  };
}

/**
 * Tools Menu
 */
function buildToolsMenu(state: MenuStateData, isMac: boolean): MenuItemConstructorOptions {
  return {
    label: 'Tools',
    submenu: [
      {
        label: 'Developer Panel',
        accelerator: 'CmdOrCtrl+Alt+D',
        click: () => sendToRenderer('menu:developerPanel'),
      },
      // Settings (non-macOS)
      ...(!isMac
        ? [
            { type: 'separator' as const },
            {
              label: 'Settings...',
              accelerator: 'CmdOrCtrl+,',
              click: () => sendToRenderer('menu:settings'),
            },
          ]
        : []),
    ],
  };
}

/**
 * Window Menu
 */
function buildWindowMenu(isMac: boolean): MenuItemConstructorOptions {
  return {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [
            { type: 'separator' as const },
            { role: 'front' as const },
            { type: 'separator' as const },
          ]
        : []),
      { type: 'separator' },
      {
        label: 'Home',
        accelerator: 'CmdOrCtrl+Shift+H',
        click: () => sendToRenderer('menu:home'),
      },
      {
        label: 'Account',
        click: () => sendToRenderer('menu:account'),
      },
    ],
  };
}

/**
 * Help Menu
 */
function buildHelpMenu(): MenuItemConstructorOptions {
  return {
    label: 'Help',
    submenu: [
      {
        label: 'ShowStack Documentation',
        click: () => sendToRenderer('menu:help:docs'),
      },
      {
        label: 'Console Export Guide',
        click: () => sendToRenderer('menu:help:consoleExport'),
      },
      {
        label: 'Keyboard Shortcuts',
        accelerator: 'CmdOrCtrl+/',
        click: () => sendToRenderer('menu:help:shortcuts'),
      },
      { type: 'separator' },
      {
        label: 'Check for Updates',
        click: () => sendToRenderer('menu:help:updates'),
      },
      {
        label: 'Admin Panel',
        accelerator: 'CmdOrCtrl+Shift+A',
        click: () => sendToRenderer('menu:admin'),
      },
      { type: 'separator' },
      {
        label: 'About ShowStack',
        click: () => sendToRenderer('menu:help:about'),
      },
    ],
  };
}

/**
 * Send menu action to renderer process
 */
function sendToRenderer(channel: string, ...args: any[]): void {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.webContents.send(channel, ...args);
  }
}
