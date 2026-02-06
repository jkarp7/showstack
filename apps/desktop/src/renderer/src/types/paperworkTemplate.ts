/**
 * Paperwork Template Type Definitions
 * Types for the paperwork template system
 */

import { ReportType } from './paperwork';

/**
 * Column format types for display formatting
 */
export type ColumnFormatType = 'text' | 'number' | 'power' | 'amperage' | 'boolean' | 'date' | 'color';

/**
 * Column display mode for header labels
 */
export type ColumnDisplayMode = 'full' | 'short' | 'custom';

/**
 * Column configuration for paperwork report tables
 */
export interface PaperworkColumnConfig {
  id: string;
  field: string; // 'channel', 'dimmer', 'position', etc.
  label: string; // Full label
  shortLabel?: string; // Short/abbreviated label
  customLabel?: string; // User-defined custom label
  displayMode?: ColumnDisplayMode; // Which label to display (default: 'full')
  width: number; // percentage
  visible: boolean;
  format?: ColumnFormatType;
  combinedWith?: string[]; // e.g., ['position', 'unit'] -> "FOH 1"
  separator?: string; // Separator for merged columns (default: ' • ')
}

/**
 * Grouping and sorting configuration
 */
export interface ReportOrganization {
  groupBy?: string; // 'dimmer', 'circuit', 'position', 'type', 'none'
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  showGroupHeaders?: boolean;
  groupPageBreaks?: boolean;
}

/**
 * Font style options
 */
export interface FontStyle {
  fontFamily?: string; // e.g., 'Arial', 'Times New Roman', 'Helvetica'
  fontSize?: number; // Base font size in points (default: 10)
  headerFontSize?: number; // Header font size in points (default: 11)
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  lineHeight?: number; // Line height multiplier (default: 1.2)
}

/**
 * Page setup configuration
 */
export interface PageSetup {
  size: 'letter' | 'legal' | 'a4' | 'tabloid';
  orientation: 'portrait' | 'landscape';
  colorMode: 'color' | 'bw';
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  fontStyle?: FontStyle; // Font customization settings
}

/**
 * Complete paperwork template configuration
 */
export interface PaperworkTemplate {
  id: string;
  name: string;
  description?: string;
  reportType: ReportType;

  // Header/Footer layout (references page_layout_templates)
  headerTemplateId?: string;
  footerTemplateId?: string;

  // Column configuration for report body
  columns: PaperworkColumnConfig[];
  organization: ReportOrganization;

  // Page setup
  pageSetup: PageSetup;

  // Metadata
  isSystem: boolean;
  created_at: number;
  updated_at: number;
}

/**
 * Input type for creating paperwork templates (without auto-generated fields)
 */
export type PaperworkTemplateInput = Omit<PaperworkTemplate, 'id' | 'created_at' | 'updated_at'>;

/**
 * Update type for modifying paperwork templates
 */
export type PaperworkTemplateUpdate = Partial<Omit<PaperworkTemplate, 'id' | 'created_at' | 'updated_at' | 'isSystem'>>;

/**
 * Helper type for column field names based on report type
 */
export type FixtureColumnField =
  | 'channel'
  | 'dimmer'
  | 'circuit'
  | 'position'
  | 'unit'
  | 'type'
  | 'manufacturer'
  | 'model'
  | 'wattage'
  | 'amperage'
  | 'purpose'
  | 'color'
  | 'gobo'
  | 'accessories'
  | 'universe'
  | 'dmx_address'
  | 'notes';

export type InfrastructureColumnField =
  | 'name'
  | 'manufacturer'
  | 'model'
  | 'type'
  | 'category'
  | 'ip_address'
  | 'mac_address'
  | 'hostname'
  | 'port_count'
  | 'location'
  | 'voltage'
  | 'wattage'
  | 'amperage'
  | 'circuit'
  | 'status'
  | 'notes';

export type ColumnField = FixtureColumnField | InfrastructureColumnField;

// Re-export ReportType for convenience
export type { ReportType };
