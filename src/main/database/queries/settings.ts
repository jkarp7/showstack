import { getDatabase, saveDatabase } from '../index';
import type { AppSettings } from '../../../shared/types/settings.types';

/**
 * Get application settings
 */
export function getSettings(): AppSettings | null {
  const db = getDatabase();

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
  const db = getDatabase();
  const now = Date.now();
  const data = JSON.stringify(settings);

  // Check if settings exist
  const existing = db.exec(`SELECT id FROM app_settings WHERE id = 1`);

  if (existing[0] && existing[0].values.length > 0) {
    // Update existing
    db.run(`
      UPDATE app_settings
      SET data = ?, updated_at = ?
      WHERE id = 1
    `, [data, now]);
  } else {
    // Insert new
    db.run(`
      INSERT INTO app_settings (id, data, updated_at)
      VALUES (1, ?, ?)
    `, [data, now]);
  }

  saveDatabase();
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
