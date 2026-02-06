/**
 * Tests for SettingsService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppSettings } from '../../../shared/types/settings.types';

// Mock the database queries for settings
vi.mock('../../database/queries/settings', () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  getDefaultSettings: vi.fn(),
  resetSettings: vi.fn(),
}));

// Import after mocking
import { SettingsService } from '../SettingsService';
import {
  getSettings,
  saveSettings as saveSettingsQuery,
  getDefaultSettings,
  resetSettings as resetSettingsQuery,
} from '../../database/queries/settings';

/**
 * Helper to build a complete AppSettings object with sensible defaults.
 * Accepts partial overrides at the top level for convenience.
 */
function buildSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    general: {
      autoSave: true,
      autoSaveInterval: 5,
      defaultFileLocation: '',
      showWelcomeScreen: true,
      checkUpdatesOnStartup: true,
    },
    appearance: {
      theme: 'auto',
      fontSize: 'medium',
      compactMode: false,
      showRevisionHighlighting: true,
    },
    disciplines: {
      enabledDisciplines: ['lighting'],
      defaultDiscipline: 'lighting',
      disciplineColors: {
        lighting: '#FFD700',
        rigging: '#FF6B6B',
        audio: '#4ECDC4',
        video: '#45B7D1',
        scenic: '#96CEB4',
        props: '#FFEAA7',
      },
    },
    export: {
      defaultFormat: 'pdf',
      includeLogoInPDF: true,
      pdfPageSize: 'letter',
      includeChangeTracking: true,
    },
    advanced: {
      enableDebugMode: false,
      maxRevisions: 5,
      enableExperimentalFeatures: false,
      cacheSize: 100,
    },
    ...overrides,
  };
}

describe('SettingsService', () => {
  let service: SettingsService;
  const defaultSettings: AppSettings = buildSettings();

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SettingsService();

    // By default, getDefaultSettings returns the standard defaults
    vi.mocked(getDefaultSettings).mockReturnValue(defaultSettings);
  });

  // ------------------------------------------------------------------
  // getSettings
  // ------------------------------------------------------------------
  describe('getSettings', () => {
    it('should return default settings when database has no settings', () => {
      vi.mocked(getSettings).mockReturnValue(null);

      const result = service.getSettings();

      expect(getSettings).toHaveBeenCalledTimes(1);
      expect(getDefaultSettings).toHaveBeenCalledTimes(1);
      // Should persist defaults to DB
      expect(saveSettingsQuery).toHaveBeenCalledWith(defaultSettings);
      expect(result).toEqual(defaultSettings);
    });

    it('should return settings from database when they exist', () => {
      const storedSettings = buildSettings({
        general: {
          autoSave: false,
          autoSaveInterval: 10,
          defaultFileLocation: '/tmp',
          showWelcomeScreen: false,
          checkUpdatesOnStartup: false,
        },
      });
      vi.mocked(getSettings).mockReturnValue(storedSettings);

      const result = service.getSettings();

      expect(getSettings).toHaveBeenCalledTimes(1);
      expect(getDefaultSettings).not.toHaveBeenCalled();
      expect(saveSettingsQuery).not.toHaveBeenCalled();
      expect(result).toEqual(storedSettings);
    });

    it('should return cached settings on subsequent calls without hitting the database', () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings);

      const first = service.getSettings();
      const second = service.getSettings();
      const third = service.getSettings();

      // Database should only be queried once
      expect(getSettings).toHaveBeenCalledTimes(1);
      expect(first).toBe(second);
      expect(second).toBe(third);
    });

    it('should cache default settings after first call when database is empty', () => {
      vi.mocked(getSettings).mockReturnValue(null);

      service.getSettings();
      service.getSettings();

      // getSettings (database query) called once, getDefaultSettings called once
      expect(getSettings).toHaveBeenCalledTimes(1);
      expect(getDefaultSettings).toHaveBeenCalledTimes(1);
      expect(saveSettingsQuery).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------
  // saveSettings
  // ------------------------------------------------------------------
  describe('saveSettings', () => {
    it('should persist settings to the database and update cache', () => {
      const newSettings = buildSettings({
        appearance: {
          theme: 'dark',
          fontSize: 'large',
          compactMode: true,
          showRevisionHighlighting: false,
        },
      });

      service.saveSettings(newSettings);

      expect(saveSettingsQuery).toHaveBeenCalledWith(newSettings);
    });

    it('should update the cache so subsequent getSettings returns saved settings', () => {
      const newSettings = buildSettings({
        appearance: {
          theme: 'dark',
          fontSize: 'large',
          compactMode: true,
          showRevisionHighlighting: false,
        },
      });

      service.saveSettings(newSettings);
      const result = service.getSettings();

      // Should NOT query the database again because cache was set by saveSettings
      expect(getSettings).not.toHaveBeenCalled();
      expect(result).toEqual(newSettings);
    });

    it('should overwrite previously cached settings', () => {
      // Seed cache with initial settings
      vi.mocked(getSettings).mockReturnValue(defaultSettings);
      service.getSettings();

      // Save new settings
      const updatedSettings = buildSettings({
        advanced: {
          enableDebugMode: true,
          maxRevisions: 10,
          enableExperimentalFeatures: true,
          cacheSize: 200,
        },
      });
      service.saveSettings(updatedSettings);

      const result = service.getSettings();
      expect(result).toEqual(updatedSettings);
      // Database query only called once (the initial seed), not on the final getSettings
      expect(getSettings).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------
  // updateSettings
  // ------------------------------------------------------------------
  describe('updateSettings', () => {
    it('should merge partial updates into existing settings', () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings);

      const updates: Partial<AppSettings> = {
        appearance: {
          theme: 'dark',
          fontSize: 'small',
          compactMode: true,
          showRevisionHighlighting: false,
        },
      };

      service.updateSettings(updates);

      const expectedSettings = { ...defaultSettings, ...updates };
      expect(saveSettingsQuery).toHaveBeenCalledWith(expectedSettings);
    });

    it('should preserve fields not included in the update', () => {
      const storedSettings = buildSettings({
        general: {
          autoSave: false,
          autoSaveInterval: 15,
          defaultFileLocation: '/custom',
          showWelcomeScreen: false,
          checkUpdatesOnStartup: true,
        },
      });
      vi.mocked(getSettings).mockReturnValue(storedSettings);

      service.updateSettings({
        advanced: {
          enableDebugMode: true,
          maxRevisions: 20,
          enableExperimentalFeatures: false,
          cacheSize: 500,
        },
      });

      // The saved settings should retain the original general settings
      const savedArg = vi.mocked(saveSettingsQuery).mock.calls[0][0];
      expect(savedArg.general).toEqual(storedSettings.general);
      expect(savedArg.advanced.enableDebugMode).toBe(true);
      expect(savedArg.advanced.maxRevisions).toBe(20);
    });

    it('should update the cache with merged settings', () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings);

      service.updateSettings({
        appearance: {
          theme: 'light',
          fontSize: 'medium',
          compactMode: false,
          showRevisionHighlighting: true,
        },
      });

      // Subsequent getSettings should use cache, not hit the database again
      const result = service.getSettings();
      expect(result.appearance.theme).toBe('light');
      // getSettings on database called only once (during updateSettings -> getSettings)
      expect(getSettings).toHaveBeenCalledTimes(1);
    });

    it('should handle empty updates without changing settings', () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings);

      service.updateSettings({});

      // Should still save (spread produces same object)
      expect(saveSettingsQuery).toHaveBeenCalledTimes(1);
      const savedArg = vi.mocked(saveSettingsQuery).mock.calls[0][0];
      expect(savedArg).toEqual(defaultSettings);
    });
  });

  // ------------------------------------------------------------------
  // resetSettings
  // ------------------------------------------------------------------
  describe('resetSettings', () => {
    it('should call resetSettingsQuery', () => {
      service.resetSettings();

      expect(resetSettingsQuery).toHaveBeenCalledTimes(1);
    });

    it('should clear the in-memory cache', () => {
      // Seed cache
      vi.mocked(getSettings).mockReturnValue(defaultSettings);
      service.getSettings();

      // Reset
      service.resetSettings();

      // Next getSettings should hit database again since cache was cleared
      vi.mocked(getSettings).mockReturnValue(null);
      service.getSettings();

      // getSettings (db query) should have been called twice total
      expect(getSettings).toHaveBeenCalledTimes(2);
    });

    it('should work even if cache was never populated', () => {
      // Should not throw
      service.resetSettings();

      expect(resetSettingsQuery).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------
  // clearCache
  // ------------------------------------------------------------------
  describe('clearCache', () => {
    it('should force a database re-read on next getSettings call', () => {
      const initialSettings = buildSettings();
      const updatedSettings = buildSettings({
        appearance: {
          theme: 'dark',
          fontSize: 'large',
          compactMode: true,
          showRevisionHighlighting: false,
        },
      });

      // First call seeds cache
      vi.mocked(getSettings).mockReturnValue(initialSettings);
      service.getSettings();
      expect(getSettings).toHaveBeenCalledTimes(1);

      // Clear cache and set new return value
      service.clearCache();
      vi.mocked(getSettings).mockReturnValue(updatedSettings);

      const result = service.getSettings();

      // Should have queried database again
      expect(getSettings).toHaveBeenCalledTimes(2);
      expect(result).toEqual(updatedSettings);
    });

    it('should not call any database functions', () => {
      service.clearCache();

      expect(getSettings).not.toHaveBeenCalled();
      expect(saveSettingsQuery).not.toHaveBeenCalled();
      expect(resetSettingsQuery).not.toHaveBeenCalled();
      expect(getDefaultSettings).not.toHaveBeenCalled();
    });

    it('should work when called multiple times in a row', () => {
      vi.mocked(getSettings).mockReturnValue(defaultSettings);
      service.getSettings();

      service.clearCache();
      service.clearCache();
      service.clearCache();

      // Should not throw and next getSettings should query the database
      service.getSettings();
      expect(getSettings).toHaveBeenCalledTimes(2);
    });
  });

  // ------------------------------------------------------------------
  // Integration-style scenarios
  // ------------------------------------------------------------------
  describe('cache lifecycle', () => {
    it('should handle a full lifecycle: load -> update -> clear -> reload', () => {
      const initial = buildSettings();
      const fromDb = buildSettings({
        appearance: {
          theme: 'dark',
          fontSize: 'medium',
          compactMode: false,
          showRevisionHighlighting: true,
        },
      });

      // Step 1: Initial load from empty database
      vi.mocked(getSettings).mockReturnValue(null);
      const loaded = service.getSettings();
      expect(loaded).toEqual(defaultSettings);
      expect(saveSettingsQuery).toHaveBeenCalledTimes(1);

      // Step 2: Update settings
      service.updateSettings({
        advanced: {
          enableDebugMode: true,
          maxRevisions: 50,
          enableExperimentalFeatures: true,
          cacheSize: 1000,
        },
      });
      expect(saveSettingsQuery).toHaveBeenCalledTimes(2);

      // Step 3: Clear cache and reload (simulating external DB change)
      service.clearCache();
      vi.mocked(getSettings).mockReturnValue(fromDb);
      const reloaded = service.getSettings();
      expect(reloaded.appearance.theme).toBe('dark');
    });

    it('should handle save after reset correctly', () => {
      // Seed cache
      vi.mocked(getSettings).mockReturnValue(defaultSettings);
      service.getSettings();

      // Reset
      service.resetSettings();

      // Save new settings
      const newSettings = buildSettings({
        general: {
          autoSave: false,
          autoSaveInterval: 30,
          defaultFileLocation: '/new/path',
          showWelcomeScreen: false,
          checkUpdatesOnStartup: false,
        },
      });
      service.saveSettings(newSettings);

      // Should return saved settings from cache
      const result = service.getSettings();
      expect(result).toEqual(newSettings);
    });
  });
});
