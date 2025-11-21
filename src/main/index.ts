import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { createWindow } from './window';
import { initDatabase } from './database';
import { registerFixtureHandlers } from './ipc/fixtures';
import { registerProjectHandlers } from './ipc/projects';
import { registerDialogHandlers } from './ipc/dialogs';
import { registerPreferencesHandlers } from './ipc/preferences';
import { registerFileHandlers } from './ipc/files';
import { registerPrepHandlers } from './ipc/prep';

// Disable hardware acceleration on Linux
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

app.on('ready', async () => {
  // Initialize database
  await initDatabase();

  // Register IPC handlers
  registerFixtureHandlers();
  registerProjectHandlers();
  registerDialogHandlers();
  registerPreferencesHandlers();
  registerFileHandlers();
  registerPrepHandlers();

  // Create main window
  mainWindow = createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});
