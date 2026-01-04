import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper function to generate UUID for anonymous ID
function generateAnonymousId(): string {
  return crypto.randomUUID();
}

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
export type ColorMode = 'color' | 'bw';

export interface PrintSettingsConfig {
  paperSize: PaperSize;
  orientation: Orientation;
  dpi: 150 | 300 | 600;
  includeWatermark: boolean;
  colorMode: ColorMode;
}

// Advanced Settings
export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface AdvancedSettings {
  developerMode: boolean;
  memoryLimit: number; // MB
  cacheSize: number; // MB
  renderQuality: RenderQuality;
}

// Privacy Settings
export interface PrivacySettings {
  telemetryEnabled: boolean;
  crashReportsEnabled: boolean;
  anonymousId: string; // Generated UUID
  dataRetentionDays: number; // How long to keep local data
}

// User Profile Settings
export interface UserProfileSettings {
  name: string;
  email: string;
  company: string;
  role: string;
  phone: string;
  designerCredit: string;
  avatarPath?: string; // Path to uploaded avatar image
}

// Power Services Settings
export interface ServiceDefinition {
  name: string;
  capacity_amps: number;
}

export interface PowerServicesSettings {
  services: ServiceDefinition[];
}

// Complete Settings State
export interface SettingsState {
  workspace: WorkspaceSettings;
  editor: EditorSettings;
  projectDefaults: ProjectDefaultsSettings;
  projectManagement: ProjectManagementSettings;
  print: PrintSettingsConfig;
  advanced: AdvancedSettings;
  privacy: PrivacySettings;
  userProfile: UserProfileSettings;
  powerServices: PowerServicesSettings;

  // Actions
  updateWorkspace: (settings: Partial<WorkspaceSettings>) => void;
  updateEditor: (settings: Partial<EditorSettings>) => void;
  updateProjectDefaults: (settings: Partial<ProjectDefaultsSettings>) => void;
  updateProjectManagement: (settings: Partial<ProjectManagementSettings>) => void;
  updatePrint: (settings: Partial<PrintSettingsConfig>) => void;
  updateAdvanced: (settings: Partial<AdvancedSettings>) => void;
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
  updateUserProfile: (settings: Partial<UserProfileSettings>) => void;
  updatePowerServices: (settings: Partial<PowerServicesSettings>) => void;
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
    colorMode: 'color' as const,
  },
  advanced: {
    developerMode: false,
    memoryLimit: 2048,
    cacheSize: 500,
    renderQuality: 'high' as const,
  },
  privacy: {
    telemetryEnabled: false,
    crashReportsEnabled: false,
    anonymousId: generateAnonymousId(),
    dataRetentionDays: 90,
  },
  userProfile: {
    name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    designerCredit: '',
    avatarPath: undefined,
  },
  powerServices: {
    services: [
      { name: 'Service A', capacity_amps: 400 },
      { name: 'Service B', capacity_amps: 400 },
      { name: 'Service C', capacity_amps: 200 }
    ],
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

      updatePrivacy: (settings) =>
        set((state) => ({
          privacy: { ...state.privacy, ...settings },
        })),

      updateUserProfile: (settings) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...settings },
        })),

      updatePowerServices: (settings) =>
        set((state) => ({
          powerServices: { ...state.powerServices, ...settings },
        })),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'showstack-settings',
    }
  )
);
