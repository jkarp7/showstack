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
import { backgroundVerifier } from './services/BackgroundVerifier';
import { backupService } from './services/BackupService';
import { crashRecoveryService } from './services/CrashRecoveryService';
import { licenseService } from './services/LicenseService';
import { performanceMonitor } from './monitoring/PerformanceMonitor';

const MEMORY_MONITOR_INTERVAL_MS = 5 * 60 * 1000;

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
  try {
    // Initialize database
    await initDatabase();

    // Check for crash and recover if needed
    const recoveryResult = await crashRecoveryService.checkAndRecover();
    if (recoveryResult.crashDetected) {
      logger.warn('Previous crash detected', { ...recoveryResult });
    }
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

  // Mark app as running for crash detection
  crashRecoveryService.markRunning();

  // Initial license check (non-blocking)
  licenseService.checkAndVerifyIfNeeded().catch(() => {
    logger.info('Initial license verification skipped (offline mode)');
  });

  // Initialize application menu BEFORE creating any windows (critical for macOS)
  initializeApplicationMenu();

  // Create landing window
  windowManager.createLandingWindow();

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
