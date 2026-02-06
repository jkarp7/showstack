import { useSettingsStore } from '../store/settingsStore';

/**
 * Feature Flags
 *
 * Use this to gate unreleased or experimental features.
 * Features can be enabled individually or all at once in developer mode.
 */
export interface FeatureFlags {
  // Collaboration features
  collaboration: boolean;
  realTimeSync: boolean;
  teamComments: boolean;

  // AI/ML features
  aiAssistant: boolean;
  smartSuggestions: boolean;
  autoFixErrors: boolean;

  // Advanced reporting
  advancedReports: boolean;
  customCharts: boolean;
  dataExport: boolean;

  // Integration features
  cloudBackup: boolean;
  thirdPartyIntegrations: boolean;

  // Experimental features
  betaFeatures: boolean;
  experimentalUI: boolean;
}

/**
 * Default feature flag values
 * Set to true to enable a feature for all users
 */
const defaultFlags: FeatureFlags = {
  // Collaboration (not yet implemented)
  collaboration: false,
  realTimeSync: false,
  teamComments: false,

  // AI features (future)
  aiAssistant: false,
  smartSuggestions: false,
  autoFixErrors: false,

  // Advanced reporting (in development)
  advancedReports: false,
  customCharts: false,
  dataExport: true, // Already implemented

  // Integration features
  cloudBackup: false,
  thirdPartyIntegrations: false,

  // Experimental
  betaFeatures: false,
  experimentalUI: false,
};

/**
 * Get the current feature flags
 * In developer mode, all flags can be overridden
 */
export function getFeatureFlags(): FeatureFlags {
  const isDeveloperMode = useSettingsStore.getState()?.advanced?.developerMode ?? false;

  if (isDeveloperMode) {
    // In developer mode, enable all features
    return Object.keys(defaultFlags).reduce((acc, key) => {
      acc[key as keyof FeatureFlags] = true;
      return acc;
    }, {} as FeatureFlags);
  }

  return { ...defaultFlags };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

/**
 * Hook to check if a feature is enabled
 * This will reactively update if settings change
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  const isDeveloperMode = useSettingsStore((state) => state.advanced.developerMode);

  if (isDeveloperMode) {
    return true;
  }

  return defaultFlags[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): (keyof FeatureFlags)[] {
  const flags = getFeatureFlags();
  return (Object.keys(flags) as (keyof FeatureFlags)[]).filter((key) => flags[key]);
}

/**
 * Feature flag descriptions for UI display
 */
export const featureFlagDescriptions: Record<keyof FeatureFlags, string> = {
  collaboration: 'Real-time collaboration with team members',
  realTimeSync: 'Sync changes in real-time across devices',
  teamComments: 'Add comments and annotations for team review',

  aiAssistant: 'AI-powered assistant for common tasks',
  smartSuggestions: 'Intelligent suggestions based on your workflow',
  autoFixErrors: 'Automatically fix common errors and issues',

  advancedReports: 'Advanced reporting with custom layouts',
  customCharts: 'Create custom charts and visualizations',
  dataExport: 'Export data in multiple formats',

  cloudBackup: 'Automatic cloud backup of projects',
  thirdPartyIntegrations: 'Integrate with third-party services',

  betaFeatures: 'Early access to beta features',
  experimentalUI: 'Try experimental UI improvements',
};
