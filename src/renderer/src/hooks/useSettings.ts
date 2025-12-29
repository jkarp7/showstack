import { useState, useEffect } from 'react';
import type { AppSettings } from '../../../shared/types/settings.types';

/**
 * Hook for accessing and managing application settings
 *
 * Provides current settings, loading state, and methods to update or reset settings.
 * Settings are cached on the backend for performance.
 *
 * @returns Object with settings, loading state, and update/reset functions
 *
 * @example
 * ```tsx
 * const { settings, loading, updateSettings, resetSettings } = useSettings();
 *
 * if (loading) return <div>Loading...</div>;
 *
 * return (
 *   <div>
 *     <label>
 *       <input
 *         type="checkbox"
 *         checked={settings?.general.autoSave}
 *         onChange={(e) => updateSettings({
 *           general: { ...settings.general, autoSave: e.target.checked }
 *         })}
 *       />
 *       Enable Auto-Save
 *     </label>
 *   </div>
 * );
 * ```
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await window.api.settings.get();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateSettings(partial: Partial<AppSettings>) {
    if (!settings) return;

    // Optimistically update UI
    const updated = { ...settings, ...partial };
    setSettings(updated);

    try {
      await window.api.settings.save(updated);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Revert on error
      setSettings(settings);
      throw error;
    }
  }

  async function resetSettings() {
    try {
      await window.api.settings.reset();
      await loadSettings();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  return {
    settings,
    loading,
    updateSettings,
    resetSettings
  };
}
