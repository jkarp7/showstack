// Paperwork Generator Type Definitions

// Report Types
export type FixtureReportType =
  | 'channel-hookup'
  | 'dimmer-schedule'
  | 'circuit-list'
  | 'dmx-addresses'
  | 'power-summary'
  | 'color-schedule'
  | 'gobo-schedule'
  | 'color-cut-report';

export type InfrastructureReportType =
  | 'infrastructure-list'
  | 'network-summary'
  | 'port-assignments'
  | 'infrastructure-power'
  | 'infrastructure-location';

export type ReportType = FixtureReportType | InfrastructureReportType;

// Page Setup
export type PageSize = 'letter' | 'legal' | 'a4' | 'tabloid';
export type Orientation = 'portrait' | 'landscape';
export type ColorMode = 'color' | 'bw';

export interface PageSetup {
  size: PageSize;
  orientation: Orientation;
  colorMode: ColorMode;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

// Legacy Metadata Options (kept for backward compatibility)
export interface MetadataOptions {
  showVenue: boolean;
  showDates: boolean;
  showDesigners: boolean;
  showProductionStaff: boolean;
  showProjectName: boolean;
  showPageNumbers: boolean;
  showGeneratedDate: boolean;
  showLogo: boolean;
  customTitle: string;
}

// Header Layout System (NEW)
export type HeaderLayoutPreset = 'standard' | 'minimal' | 'detailed' | 'logo-focused' | 'custom';

export interface HeaderLayoutFields {
  showTitle: boolean;
  showProjectName: boolean;
  showLogo: boolean;
  showVenue: boolean;
  showDesigner: boolean;
  showProductionStaff: boolean;
  showDates: boolean;
  showRevision: boolean;
  showGeneratedDate: boolean;
  customTitle?: string;
}

export interface HeaderLayoutConfig {
  preset: HeaderLayoutPreset;
  fields: HeaderLayoutFields;
}

// Custom Report
export interface CustomReport {
  id: string;
  name: string;
  description: string;
  reportType: ReportType;
  pageSetup: PageSetup;
  metadata: MetadataOptions; // DEPRECATED - keep for backward compatibility
  headerLayout?: HeaderLayoutConfig; // NEW - optional for migration
  created: number;
  updated: number;
}

// Report Template
export interface ReportTemplate {
  id: ReportType;
  name: string;
  description: string;
  icon: string;
}

// Preset Definitions
export const HEADER_PRESET_FIELDS: Record<HeaderLayoutPreset, HeaderLayoutFields> = {
  standard: {
    showTitle: true,
    showProjectName: true,
    showLogo: false,
    showVenue: true,
    showDesigner: true,
    showProductionStaff: false,
    showDates: false,
    showRevision: false,
    showGeneratedDate: true,
    customTitle: ''
  },
  minimal: {
    showTitle: true,
    showProjectName: false,
    showLogo: false,
    showVenue: false,
    showDesigner: false,
    showProductionStaff: false,
    showDates: false,
    showRevision: false,
    showGeneratedDate: false,
    customTitle: ''
  },
  detailed: {
    showTitle: true,
    showProjectName: true,
    showLogo: true,
    showVenue: true,
    showDesigner: true,
    showProductionStaff: true,
    showDates: true,
    showRevision: true,
    showGeneratedDate: true,
    customTitle: ''
  },
  'logo-focused': {
    showTitle: true,
    showProjectName: true,
    showLogo: true,
    showVenue: false,
    showDesigner: false,
    showProductionStaff: false,
    showDates: false,
    showRevision: false,
    showGeneratedDate: true,
    customTitle: ''
  },
  custom: {
    showTitle: true,
    showProjectName: true,
    showLogo: false,
    showVenue: true,
    showDesigner: true,
    showProductionStaff: false,
    showDates: false,
    showRevision: false,
    showGeneratedDate: true,
    customTitle: ''
  }
};

// Default Configurations
export const DEFAULT_PAGE_SETUP: PageSetup = {
  size: 'letter',
  orientation: 'portrait',
  colorMode: 'bw',
  marginTop: 0.5,
  marginBottom: 0.5,
  marginLeft: 0.25,
  marginRight: 0.25
};

export const DEFAULT_METADATA: MetadataOptions = {
  showVenue: true,
  showDates: true,
  showDesigners: true,
  showProductionStaff: false,
  showProjectName: true,
  showPageNumbers: true,
  showGeneratedDate: true,
  showLogo: false,
  customTitle: ''
};

export const DEFAULT_HEADER_LAYOUT: HeaderLayoutConfig = {
  preset: 'standard',
  fields: HEADER_PRESET_FIELDS.standard
};

// Migration Utility
/**
 * Migrates old MetadataOptions format to new HeaderLayoutConfig format
 * Used for backward compatibility when loading old saved reports
 */
export function migrateMetadataToHeaderLayout(metadata: MetadataOptions): HeaderLayoutConfig {
  return {
    preset: 'custom',
    fields: {
      showTitle: true,
      showProjectName: metadata.showProjectName,
      showLogo: metadata.showLogo,
      showVenue: metadata.showVenue,
      showDesigner: metadata.showDesigners,
      showProductionStaff: metadata.showProductionStaff,
      showDates: metadata.showDates,
      showRevision: false,
      showGeneratedDate: metadata.showGeneratedDate,
      customTitle: metadata.customTitle || ''
    }
  };
}

// localStorage Utilities
/**
 * Get the localStorage key for a project's header layout
 */
export function getHeaderLayoutStorageKey(projectId: string): string {
  return `showstack_paperwork_headerLayout_${projectId}`;
}

/**
 * Load header layout from localStorage for a project
 */
export function loadHeaderLayout(projectId: string): HeaderLayoutConfig | null {
  try {
    const key = getHeaderLayoutStorageKey(projectId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load header layout from localStorage:', error);
  }
  return null;
}

/**
 * Save header layout to localStorage for a project
 */
export function saveHeaderLayout(projectId: string, layout: HeaderLayoutConfig): void {
  try {
    const key = getHeaderLayoutStorageKey(projectId);
    localStorage.setItem(key, JSON.stringify(layout));
  } catch (error) {
    console.error('Failed to save header layout to localStorage:', error);
  }
}

/**
 * Clear header layout from localStorage for a project
 */
export function clearHeaderLayout(projectId: string): void {
  try {
    const key = getHeaderLayoutStorageKey(projectId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear header layout from localStorage:', error);
  }
}
