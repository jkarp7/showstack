import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { initDatabase } from './database';
import { windowManager } from './services/WindowManager';
import { registerFixtureHandlers } from './ipc/fixtures';
import { registerProjectHandlers } from './ipc/projects';
import { registerDialogHandlers } from './ipc/dialogs';
import { registerPreferencesHandlers } from './ipc/preferences';
import { registerFileHandlers } from './ipc/files';
import { registerWindowHandlers } from './ipc/windows';
import { registerShopOrderHandlers } from './ipc/shop-order';
import { registerPaperworkHandlers } from './ipc/paperwork';
import { registerLabelPrinterHandlers } from './ipc/labelPrinter';
import { registerLicenseHandlers } from './ipc/license';
import { registerAdminHandlers } from './ipc/admin';
import { registerSettingsHandlers } from './ipc/settings';
import { registerMenuHandlers, initializeApplicationMenu } from './ipc/menu';
import { registerShellHandlers } from './ipc/shell';
import { registerDimmerRackHandlers } from './ipc/dimmerRacks';
import { registerDimmerRackModuleHandlers } from './ipc/dimmerRackModules';
import { registerPDRackHandlers } from './ipc/pdRacks';
import { registerPhaseTemplateHandlers } from './ipc/phaseTemplates';
import { registerInfrastructureHandlers } from './ipc/infrastructure';
import { backgroundVerifier } from './services/BackgroundVerifier';
import { licenseService } from './services/LicenseService';

// Set app name for macOS menu bar
app.setName('ShowStack');

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

app.on('ready', async () => {
  // Initialize database
  await initDatabase();

  // Register IPC handlers
  registerFixtureHandlers();
  registerProjectHandlers();
  registerDialogHandlers();
  registerPreferencesHandlers();
  registerFileHandlers();
  registerWindowHandlers();
  registerShopOrderHandlers();
  registerPaperworkHandlers();
  registerLabelPrinterHandlers();
  registerLicenseHandlers();
  registerAdminHandlers();
  registerSettingsHandlers();
  registerMenuHandlers();
  registerShellHandlers();
  registerDimmerRackHandlers();
  registerDimmerRackModuleHandlers();
  registerPDRackHandlers();
  registerPhaseTemplateHandlers();
  registerInfrastructureHandlers();

  // Start background license verification (non-blocking)
  backgroundVerifier.start();

  // Initial license check (non-blocking)
  licenseService.checkAndVerifyIfNeeded().catch(err => {
    console.log('Initial license verification skipped (offline mode)');
  });

  // Initialize application menu BEFORE creating any windows (critical for macOS)
  initializeApplicationMenu();

  // Create landing window
  windowManager.createLandingWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    windowManager.createLandingWindow();
  }
});

app.on('before-quit', () => {
  // Stop background verification
  backgroundVerifier.stop();
});
