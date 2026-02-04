/**
 * Paperwork-specific Data Field Definitions
 *
 * Extends the Prep ElementPalette with additional data fields specific to
 * paperwork reports, including report metadata, fixture summaries, and
 * infrastructure summaries.
 */

import type { DataFieldType } from '../types/shopOrder';

interface PaperworkDataFieldDefinition {
  fieldType: DataFieldType;
  label: string;
  description: string;
  icon: string;
  category: 'report' | 'fixture-summary' | 'infrastructure-summary';
  formatHint?: string;
}

/**
 * Data fields specific to paperwork reports
 * These fields are not available in the Prep module's ElementPalette
 */
export const PAPERWORK_DATA_FIELDS: PaperworkDataFieldDefinition[] = [
  // Report-specific fields
  {
    fieldType: 'report_title' as DataFieldType,
    label: 'Report Title',
    description: 'Dynamic report title based on report type',
    icon: '📋',
    category: 'report',
    formatHint: 'e.g., "Channel Hookup - Sample Production"'
  },
  {
    fieldType: 'revision_date' as DataFieldType,
    label: 'Revision Date',
    description: 'Date of last revision',
    icon: '📅',
    category: 'report',
    formatHint: 'Date format'
  },
  {
    fieldType: 'generated_date' as DataFieldType,
    label: 'Generated Date',
    description: 'Date when report was generated',
    icon: '🕒',
    category: 'report',
    formatHint: 'Auto-populated with current date'
  },

  // Fixture summary fields
  {
    fieldType: 'total_fixtures' as DataFieldType,
    label: 'Total Fixtures',
    description: 'Total count of all fixtures',
    icon: '💡',
    category: 'fixture-summary',
    formatHint: 'Number'
  },
  {
    fieldType: 'total_wattage' as DataFieldType,
    label: 'Total Wattage',
    description: 'Sum of all fixture wattages',
    icon: '⚡',
    category: 'fixture-summary',
    formatHint: 'Watts (W)'
  },
  {
    fieldType: 'total_amperage' as DataFieldType,
    label: 'Total Amperage',
    description: 'Sum of all fixture amperage',
    icon: '🔌',
    category: 'fixture-summary',
    formatHint: 'Amps (A)'
  },
  {
    fieldType: 'universe_count' as DataFieldType,
    label: 'DMX Universe Count',
    description: 'Number of DMX universes in use',
    icon: '🌐',
    category: 'fixture-summary',
    formatHint: 'Number'
  },
  {
    fieldType: 'fixture_type_count' as DataFieldType,
    label: 'Fixture Types',
    description: 'Number of unique fixture types',
    icon: '🏷️',
    category: 'fixture-summary',
    formatHint: 'Number'
  },

  // Infrastructure summary fields
  {
    fieldType: 'total_infrastructure' as DataFieldType,
    label: 'Total Infrastructure',
    description: 'Total count of all infrastructure equipment',
    icon: '🔧',
    category: 'infrastructure-summary',
    formatHint: 'Number'
  },
  {
    fieldType: 'network_equipment_count' as DataFieldType,
    label: 'Network Equipment',
    description: 'Count of network equipment (switches, routers)',
    icon: '🌐',
    category: 'infrastructure-summary',
    formatHint: 'Number'
  },
  {
    fieldType: 'audio_equipment_count' as DataFieldType,
    label: 'Audio Equipment',
    description: 'Count of audio infrastructure',
    icon: '🔊',
    category: 'infrastructure-summary',
    formatHint: 'Number'
  },
  {
    fieldType: 'video_equipment_count' as DataFieldType,
    label: 'Video Equipment',
    description: 'Count of video infrastructure',
    icon: '📹',
    category: 'infrastructure-summary',
    formatHint: 'Number'
  },
  {
    fieldType: 'data_distribution_count' as DataFieldType,
    label: 'Data Distribution',
    description: 'Count of data distribution equipment',
    icon: '📡',
    category: 'infrastructure-summary',
    formatHint: 'Number'
  },
  {
    fieldType: 'total_ports' as DataFieldType,
    label: 'Total Ports',
    description: 'Total configured ports across all infrastructure',
    icon: '🔌',
    category: 'infrastructure-summary',
    formatHint: 'Number'
  },
  {
    fieldType: 'active_infrastructure' as DataFieldType,
    label: 'Active Equipment',
    description: 'Count of active infrastructure equipment',
    icon: '✅',
    category: 'infrastructure-summary',
    formatHint: 'Number'
  },
  {
    fieldType: 'inactive_infrastructure' as DataFieldType,
    label: 'Inactive Equipment',
    description: 'Count of inactive infrastructure equipment',
    icon: '❌',
    category: 'infrastructure-summary',
    formatHint: 'Number'
  }
];

/**
 * Get all data fields for a specific category
 */
export function getPaperworkDataFieldsByCategory(
  category: 'report' | 'fixture-summary' | 'infrastructure-summary'
): PaperworkDataFieldDefinition[] {
  return PAPERWORK_DATA_FIELDS.filter(field => field.category === category);
}

/**
 * Get a data field definition by field type
 */
export function getPaperworkDataField(fieldType: string): PaperworkDataFieldDefinition | undefined {
  return PAPERWORK_DATA_FIELDS.find(field => field.fieldType === fieldType);
}

/**
 * Check if a field type is a paperwork-specific field
 */
export function isPaperworkDataField(fieldType: string): boolean {
  return PAPERWORK_DATA_FIELDS.some(field => field.fieldType === fieldType);
}

/**
 * Get combined palette elements for paperwork headers
 * This should be used in the ElementPalette when designing paperwork headers
 */
export function getPaperworkPaletteElements() {
  return PAPERWORK_DATA_FIELDS.map(field => ({
    type: 'dataField' as const,
    subType: field.fieldType,
    label: field.label,
    description: field.description,
    icon: field.icon,
    category: 'data' as const
  }));
}
