import { ipcMain } from 'electron';
import { licenseService } from '../services/LicenseService';
import { settingsService } from '../services/SettingsService';
import type { ShowStackModule } from '../../shared/types/license.types';
import type { AppSettings } from '../../shared/types/settings.types';

/**
 * Register all license and settings IPC handlers
 */
export function registerLicenseHandlers(): void {
  // ============================================
  // LICENSE OPERATIONS
  // ============================================

  /**
   * Get current license validation status
   */
  ipcMain.handle('license:getStatus', () => {
    return licenseService.getLicenseStatus();
  });

  /**
   * Get current license information
   */
  ipcMain.handle('license:getCurrent', () => {
    return licenseService.getCurrentLicense();
  });

  /**
   * Check if user has access to a specific module
   */
  ipcMain.handle('license:hasModule', (_, module: ShowStackModule) => {
    return licenseService.hasModuleAccess(module);
  });

  /**
   * Get features for a specific module
   */
  ipcMain.handle('license:getModuleFeatures', (_, module: ShowStackModule) => {
    return licenseService.getModuleFeatures(module);
  });

  /**
   * Get all available modules
   */
  ipcMain.handle('license:getAvailableModules', () => {
    return licenseService.getAvailableModules();
  });

  /**
   * Check if user can use a specific feature
   */
  ipcMain.handle('license:canUseFeature', (_, module: ShowStackModule, feature: string) => {
    return licenseService.canUseFeature(module, feature);
  });

  /**
   * Activate a new license
   */
  ipcMain.handle('license:activate', (_, licenseKey: string, email: string, modules: ShowStackModule[]) => {
    return licenseService.activateLicense(licenseKey, email, modules);
  });

  /**
   * Verify license online (manual trigger)
   */
  ipcMain.handle('license:verifyOnline', async () => {
    const license = licenseService.getCurrentLicense();
    if (!license) return false;
    return await licenseService.verifyLicenseOnline(license.licenseKey);
  });

  // ============================================
  // SETTINGS OPERATIONS
  // ============================================

  /**
   * Get application settings
   */
  ipcMain.handle('settings:get', () => {
    return settingsService.getSettings();
  });

  /**
   * Save application settings
   */
  ipcMain.handle('settings:save', (_, settings: AppSettings) => {
    settingsService.saveSettings(settings);
    return { success: true };
  });

  /**
   * Update partial settings
   */
  ipcMain.handle('settings:update', (_, updates: Partial<AppSettings>) => {
    settingsService.updateSettings(updates);
    return { success: true };
  });

  /**
   * Reset settings to defaults
   */
  ipcMain.handle('settings:reset', () => {
    settingsService.resetSettings();
    return { success: true };
  });
}
