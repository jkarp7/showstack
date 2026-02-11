import { ipcMain } from 'electron';
import { licenseService } from '../services/LicenseService';
import { settingsService } from '../services/SettingsService';
import type { ShowStackModule } from '../../shared/types/license.types';
import type { AppSettings } from '../../shared/types/settings.types';
import { errorHandler } from '../errors';
import { ValidationError } from '../errors';
import { logger } from '../utils/logger';

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
  ipcMain.handle('license:getStatus', async () => {
    try {
      return await errorHandler.executeWithRetry(
        async () => licenseService.getLicenseStatus(),
        'license:getStatus',
      );
    } catch (error) {
      logger.error('Failed to get license status:', {
        operation: 'license:getStatus',
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to load license status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Get current license information
   */
  ipcMain.handle('license:getCurrent', async () => {
    try {
      return await errorHandler.executeWithRetry(
        async () => licenseService.getCurrentLicense(),
        'license:getCurrent',
      );
    } catch (error) {
      logger.error('Failed to get current license:', {
        operation: 'license:getCurrent',
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to load license: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Check if user has access to a specific module
   */
  ipcMain.handle('license:hasModule', async (_, module: ShowStackModule) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => licenseService.hasModuleAccess(module),
        'license:hasModule',
      );
    } catch (error) {
      logger.error('Failed to check module access:', {
        operation: 'license:hasModule',
        module,
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to check module access: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Get features for a specific module
   */
  ipcMain.handle('license:getModuleFeatures', async (_, module: ShowStackModule) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => licenseService.getModuleFeatures(module),
        'license:getModuleFeatures',
      );
    } catch (error) {
      logger.error('Failed to get module features:', {
        operation: 'license:getModuleFeatures',
        module,
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to load module features: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Get all available modules
   */
  ipcMain.handle('license:getAvailableModules', async () => {
    try {
      return await errorHandler.executeWithRetry(
        async () => licenseService.getAvailableModules(),
        'license:getAvailableModules',
      );
    } catch (error) {
      logger.error('Failed to get available modules:', {
        operation: 'license:getAvailableModules',
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to load available modules: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Check if user can use a specific feature
   */
  ipcMain.handle('license:canUseFeature', async (_, module: ShowStackModule, feature: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => licenseService.canUseFeature(module, feature),
        'license:canUseFeature',
      );
    } catch (error) {
      logger.error('Failed to check feature access:', {
        operation: 'license:canUseFeature',
        module,
        feature,
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to check feature access: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Activate a new license
   */
  ipcMain.handle(
    'license:activate',
    async (_, licenseKey: string, email: string, modules: ShowStackModule[]) => {
      try {
        // Validation
        if (!licenseKey || licenseKey.trim().length === 0) {
          throw new ValidationError('License key is required', 'licenseKey', licenseKey);
        }
        if (!email || email.trim().length === 0) {
          throw new ValidationError('Email is required', 'email', email);
        }

        return await errorHandler.executeWithRetry(
          async () => licenseService.activateLicense(licenseKey, email, modules),
          'license:activate',
        );
      } catch (error) {
        logger.error('Failed to activate license:', {
          operation: 'license:activate',
          email,
          error: error instanceof Error ? error.message : error,
        });

        if (error instanceof ValidationError) {
          throw new Error(error.toUserMessage());
        }
        throw new Error(
          `Unable to activate license: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  );

  /**
   * Verify license online (manual trigger)
   */
  ipcMain.handle('license:verifyOnline', async () => {
    try {
      return await errorHandler.executeWithRetry(async () => {
        const license = licenseService.getCurrentLicense();
        if (!license) return false;
        return await licenseService.verifyLicenseOnline(license.licenseKey);
      }, 'license:verifyOnline');
    } catch (error) {
      logger.error('Failed to verify license online:', {
        operation: 'license:verifyOnline',
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to verify license: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  // ============================================
  // SETTINGS OPERATIONS
  // ============================================

  /**
   * Get application settings
   */
  ipcMain.handle('settings:get', async () => {
    try {
      return await errorHandler.executeWithRetry(
        async () => settingsService.getSettings(),
        'settings:get',
      );
    } catch (error) {
      logger.error('Failed to get settings:', {
        operation: 'settings:get',
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to load settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Save application settings
   */
  ipcMain.handle('settings:save', async (_, settings: AppSettings) => {
    try {
      await errorHandler.executeWithRetry(
        async () => settingsService.saveSettings(settings),
        'settings:save',
      );
      return { success: true };
    } catch (error) {
      logger.error('Failed to save settings:', {
        operation: 'settings:save',
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Update partial settings
   */
  ipcMain.handle('settings:update', async (_, updates: Partial<AppSettings>) => {
    try {
      await errorHandler.executeWithRetry(
        async () => settingsService.updateSettings(updates),
        'settings:update',
      );
      return { success: true };
    } catch (error) {
      logger.error('Failed to update settings:', {
        operation: 'settings:update',
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Reset settings to defaults
   */
  ipcMain.handle('settings:reset', async () => {
    try {
      await errorHandler.executeWithRetry(
        async () => settingsService.resetSettings(),
        'settings:reset',
      );
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset settings:', {
        operation: 'settings:reset',
        error: error instanceof Error ? error.message : error,
      });
      throw new Error(
        `Unable to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });
}
