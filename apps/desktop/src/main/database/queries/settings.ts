// @ts-nocheck
import { getAppDatabase, saveAppDatabase } from '../index';
import type { AppSettings } from '../../../shared/types/settings.types';

/**
 * Get application settings
 */
export function getSettings(): AppSettings | null {
  const db = getAppDatabase();

  const result = db.exec(`
    SELECT data FROM app_settings WHERE id = 1
  `);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const data = result[0].values[0][0] as string;
  return JSON.parse(data);
}

/**
 * Save application settings
 */
export function saveSettings(settings: AppSettings): void {
  const db = getAppDatabase();
  const now = Date.now();
  const data = JSON.stringify(settings);

  // Check if settings exist
  const existing = db.exec(`SELECT id FROM app_settings WHERE id = 1`);

  if (existing[0] && existing[0].values.length > 0) {
    // Update existing
    db.prepare(`
      UPDATE app_settings
      SET data = ?, updated_at = ?
      WHERE id = 1
    `).run(data, now);
  } else {
    // Insert new
    db.prepare(`
      INSERT INTO app_settings (id, data, updated_at)
      VALUES (1, ?, ?)
    `).run(1, data, now);
  }

  saveAppDatabase();
}

/**
 * Get default settings
 */
export function getDefaultSettings(): AppSettings {
  return {
    general: {
      autoSave: true,
      autoSaveInterval: 5,
      defaultFileLocation: '',
      showWelcomeScreen: true,
      checkUpdatesOnStartup: true
    },
    appearance: {
      theme: 'auto',
      fontSize: 'medium',
      compactMode: false,
      showRevisionHighlighting: true
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
        props: '#FFEAA7'
      }
    },
    export: {
      defaultFormat: 'pdf',
      includeLogoInPDF: true,
      pdfPageSize: 'letter',
      includeChangeTracking: true
    },
    advanced: {
      enableDebugMode: false,
      maxRevisions: 5,
      enableExperimentalFeatures: false,
      cacheSize: 100
    }
  };
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): void {
  saveSettings(getDefaultSettings());
}

/**
 * Get a specific setting value
 */
export function getSetting(key: string): string | null {
  const db = getAppDatabase();

  const result = db.exec(`
    SELECT value FROM app_settings_kv WHERE key = ?
  `, [key]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  return result[0].values[0][0] as string;
}

/**
 * Set a specific setting value
 */
export function setSetting(key: string, value: string): void {
  const db = getAppDatabase();
  const now = Date.now();

  // Check if setting exists
  const existing = db.exec(`SELECT key FROM app_settings_kv WHERE key = ?`, [key]);

  if (existing[0] && existing[0].values.length > 0) {
    // Update existing
    db.prepare(`
      UPDATE app_settings_kv
      SET value = ?, updated_at = ?
      WHERE key = ?
    `).run(value, now, key);
  } else {
    // Insert new
    db.prepare(`
      INSERT INTO app_settings_kv (key, value, updated_at)
      VALUES (?, ?, ?)
    `).run(key, value, now);
  }

  saveAppDatabase();
}
