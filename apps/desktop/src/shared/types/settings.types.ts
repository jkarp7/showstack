/**
 * ShowStack Application Settings - Type Definitions
 *
 * Defines types for application-wide settings and preferences.
 */

export interface AppSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  disciplines: DisciplineSettings;
  export: ExportSettings;
  advanced: AdvancedSettings;
}

export interface GeneralSettings {
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  defaultFileLocation: string;
  showWelcomeScreen: boolean;
  checkUpdatesOnStartup: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  showRevisionHighlighting: boolean;
}

export interface DisciplineSettings {
  enabledDisciplines: string[]; // ['lighting', 'audio', etc.]
  defaultDiscipline: string;
  disciplineColors: Record<string, string>;
}

export interface ExportSettings {
  defaultFormat: 'pdf' | 'xlsx' | 'csv';
  includeLogoInPDF: boolean;
  logoPath?: string;
  pdfPageSize: 'letter' | 'a4';
  includeChangeTracking: boolean;
}

export interface AdvancedSettings {
  enableDebugMode: boolean;
  maxRevisions: number;
  enableExperimentalFeatures: boolean;
  cacheSize: number; // MB
}
