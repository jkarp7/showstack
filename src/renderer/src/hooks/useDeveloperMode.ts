import { useSettingsStore } from '../store/settingsStore';

/**
 * Hook to access developer mode state
 * @returns {boolean} Whether developer mode is enabled
 */
export function useDeveloperMode(): boolean {
  return useSettingsStore((state) => state.advanced.developerMode);
}
