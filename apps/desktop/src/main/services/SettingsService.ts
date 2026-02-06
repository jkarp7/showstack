import {
  getSettings,
  saveSettings as saveSettingsQuery,
  getDefaultSettings,
  resetSettings as resetSettingsQuery,
} from '../database/queries/settings';
import type { AppSettings } from '../../shared/types/settings.types';

/**
 * Settings Service
 *
 * Handles application settings with in-memory caching for performance.
 */
export class SettingsService {
  private cachedSettings: AppSettings | null = null;

  /**
   * Get current settings (cached)
   */
  getSettings(): AppSettings {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    const settings = getSettings();

    if (!settings) {
      // Initialize with defaults if no settings exist
      this.cachedSettings = getDefaultSettings();
      saveSettingsQuery(this.cachedSettings);
    } else {
      this.cachedSettings = settings;
    }

    return this.cachedSettings;
  }

  /**
   * Save settings
   */
  saveSettings(settings: AppSettings): void {
    saveSettingsQuery(settings);
    this.cachedSettings = settings;
  }

  /**
   * Update partial settings
   */
  updateSettings(updates: Partial<AppSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    this.saveSettings(updated);
  }

  /**
   * Reset to default settings
   */
  resetSettings(): void {
    resetSettingsQuery();
    this.cachedSettings = null; // Clear cache
  }

  /**
   * Clear cache (useful for testing or forcing reload)
   */
  clearCache(): void {
    this.cachedSettings = null;
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
