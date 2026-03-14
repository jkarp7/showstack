import { app, BrowserWindow } from 'electron';
import { loadEnv } from './config/env';
import { initSentry } from './services/sentry';
import { initDatabase } from './database';
import { windowManager } from './services/WindowManager';
import { logger } from './utils/logger';

// Load environment variables before anything else
loadEnv();

// Initialize Sentry early (no-op if SENTRY_DSN not set)
initSentry();
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
import { registerSyncHandlers, initializePowerSync, disposePowerSync } from './ipc/sync';
import { registerHealthHandlers } from './ipc/health';
import { registerBackupHandlers } from './ipc/backup';
import { registerCollaborationHandlers } from './ipc/collaboration';
import { registerGroupHandlers } from './ipc/groups';
import { backgroundVerifier } from './services/BackgroundVerifier';
import { backupService } from './services/BackupService';
import { crashRecoveryService } from './services/CrashRecoveryService';
import { licenseService } from './services/LicenseService';
import { performanceMonitor } from './monitoring/PerformanceMonitor';

const MEMORY_MONITOR_INTERVAL_MS = 5 * 60 * 1000;

// Set app name for macOS menu bar
app.setName('ShowStack');

// Register custom URL scheme for email verification callbacks.
// Supabase redirects to showstack://auth/callback after email confirmation.
// Must be called before app ready on macOS.
if (process.defaultApp) {
  // Dev: Electron is the default app, pass the app path as argv[1]
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('showstack', process.execPath, [process.argv[1]]);
  }
} else {
  app.setAsDefaultProtocolClient('showstack');
}

/**
 * Forward a deep-link URL to the renderer so it can complete auth.
 * The URL has the form: showstack://auth/callback#access_token=...&type=signup
 */
function handleDeepLink(url: string): void {
  logger.info('Received deep link URL', { url });
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('auth:deepLink', url);
  }
}

// Disable hardware acceleration on Linux
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

// Single instance lock — also receives deep links on Windows/Linux via argv
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Windows/Linux: deep link arrives as argv when a second instance is launched
app.on('second-instance', (_event, commandLine) => {
  const url = commandLine.find((arg) => arg.startsWith('showstack://'));
  if (url) {
    handleDeepLink(url);
  }
  // Focus the existing window
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('ready', async () => {
  try {
    // Initialize database
    await initDatabase();

    // Check for crash and recover if needed
    const recoveryResult = await crashRecoveryService.checkAndRecover();
    if (recoveryResult.crashDetected) {
      logger.warn('Previous crash detected', { ...recoveryResult });
    }

    // Mark app as running immediately after recovery check completes.
    // This minimizes the window where a crash would go undetected.
    await crashRecoveryService.markRunning();
  } catch (err) {
    logger.error('Database initialization failed', err instanceof Error ? err : undefined);
  }

  // Register IPC handlers (always, even if DB init fails)
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
  registerSyncHandlers();
  registerHealthHandlers();
  registerBackupHandlers();
  registerCollaborationHandlers();
  registerGroupHandlers();

  // Initialize PowerSync (non-blocking, works offline)
  initializePowerSync().catch((err) => {
    logger.info('[Sync] PowerSync initialization deferred:', err.message);
  });

  // Start background license verification (non-blocking)
  backgroundVerifier.start();

  // Start backup service (non-blocking)
  backupService.start().catch((err) => {
    logger.error('Failed to start backup service', err instanceof Error ? err : undefined);
  });

  // Initial license check (non-blocking)
  licenseService.checkAndVerifyIfNeeded().catch(() => {
    logger.info('Initial license verification skipped (offline mode)');
  });

  // Initialize application menu BEFORE creating any windows (critical for macOS)
  initializeApplicationMenu();

  // Create landing window
  windowManager.createLandingWindow();

  // Windows/Linux: on the very first launch via a showstack:// URL the URL
  // arrives in process.argv (no second-instance fires). Send it to the
  // renderer once the window finishes loading.
  if (process.platform !== 'darwin') {
    const deepLinkUrl = process.argv.find((arg) => arg.startsWith('showstack://'));
    if (deepLinkUrl) {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        win.webContents.once('did-finish-load', () => handleDeepLink(deepLinkUrl));
      }
    }
  }

  // Start periodic performance monitoring
  setInterval(() => {
    performanceMonitor.trackMemoryUsage();
  }, MEMORY_MONITOR_INTERVAL_MS);

  // Log initial memory baseline
  performanceMonitor.trackMemoryUsage();
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

// macOS: deep link arrives as open-url event
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

app.on('before-quit', async () => {
  // Mark clean shutdown for crash detection
  await crashRecoveryService.markCleanShutdown();

  // Stop backup service
  backupService.stop();

  // Stop background verification
  backgroundVerifier.stop();

  // Cleanup PowerSync
  await disposePowerSync();
});
