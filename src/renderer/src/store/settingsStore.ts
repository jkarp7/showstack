import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Workspace Preferences
export interface WorkspaceSettings {
  defaultView: 'projects' | 'prep' | 'designer' | 'last';
  gridDisplay: boolean;
  snapToGrid: boolean;
  gridSize: number;
  units: 'imperial' | 'metric';
}

// Editor Settings
export interface EditorSettings {
  autoSaveInterval: number; // seconds
  undoDepth: number;
  showToolbar: boolean;
}

// Project Defaults
export interface ContactDefaults {
  name: string;
  email: string;
}

export interface ProjectDefaultsSettings {
  productionName: string;
  venue: string;
  designer: string;
  contacts: {
    generalManager: ContactDefaults;
    productionManager: ContactDefaults;
    masterElectrician: ContactDefaults;
  };
}

// Project Management
export interface ProjectManagementSettings {
  showRecentCount: number;
  autoArchive: boolean;
  archiveDays: number;
}

// Print Settings
export type PaperSize = 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3';
export type Orientation = 'portrait' | 'landscape';

export interface PrintSettingsConfig {
  paperSize: PaperSize;
  orientation: Orientation;
  dpi: 150 | 300 | 600;
  includeWatermark: boolean;
}

// Advanced Settings
export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface AdvancedSettings {
  developerMode: boolean;
  memoryLimit: number; // MB
  cacheSize: number; // MB
  renderQuality: RenderQuality;
}

// Complete Settings State
export interface SettingsState {
  workspace: WorkspaceSettings;
  editor: EditorSettings;
  projectDefaults: ProjectDefaultsSettings;
  projectManagement: ProjectManagementSettings;
  print: PrintSettingsConfig;
  advanced: AdvancedSettings;

  // Actions
  updateWorkspace: (settings: Partial<WorkspaceSettings>) => void;
  updateEditor: (settings: Partial<EditorSettings>) => void;
  updateProjectDefaults: (settings: Partial<ProjectDefaultsSettings>) => void;
  updateProjectManagement: (settings: Partial<ProjectManagementSettings>) => void;
  updatePrint: (settings: Partial<PrintSettingsConfig>) => void;
  updateAdvanced: (settings: Partial<AdvancedSettings>) => void;
  resetToDefaults: () => void;
}

// Default settings
const defaultSettings = {
  workspace: {
    defaultView: 'projects' as const,
    gridDisplay: true,
    snapToGrid: true,
    gridSize: 10,
    units: 'imperial' as const,
  },
  editor: {
    autoSaveInterval: 30,
    undoDepth: 50,
    showToolbar: true,
  },
  projectDefaults: {
    productionName: '',
    venue: '',
    designer: '',
    contacts: {
      generalManager: { name: '', email: '' },
      productionManager: { name: '', email: '' },
      masterElectrician: { name: '', email: '' },
    },
  },
  projectManagement: {
    showRecentCount: 10,
    autoArchive: false,
    archiveDays: 90,
  },
  print: {
    paperSize: 'letter' as const,
    orientation: 'portrait' as const,
    dpi: 300 as const,
    includeWatermark: false,
  },
  advanced: {
    developerMode: false,
    memoryLimit: 2048,
    cacheSize: 500,
    renderQuality: 'high' as const,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultSettings,

      // Actions
      updateWorkspace: (settings) =>
        set((state) => ({
          workspace: { ...state.workspace, ...settings },
        })),

      updateEditor: (settings) =>
        set((state) => ({
          editor: { ...state.editor, ...settings },
        })),

      updateProjectDefaults: (settings) =>
        set((state) => ({
          projectDefaults: { ...state.projectDefaults, ...settings },
        })),

      updateProjectManagement: (settings) =>
        set((state) => ({
          projectManagement: { ...state.projectManagement, ...settings },
        })),

      updatePrint: (settings) =>
        set((state) => ({
          print: { ...state.print, ...settings },
        })),

      updateAdvanced: (settings) =>
        set((state) => ({
          advanced: { ...state.advanced, ...settings },
        })),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'showstack-settings',
    }
  )
);
