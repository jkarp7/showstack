/**
 * Default Column Configurations
 * Pre-configured column sets for all 12 report types
 */

import { PaperworkColumnConfig } from '../../types/paperworkTemplate';

function createColumn(
  field: string,
  overrides: Partial<PaperworkColumnConfig> = {}
): PaperworkColumnConfig {
  return {
    id: `col-${field}`,
    field,
    label: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
    width: 10,
    visible: true,
    ...overrides
  };
}

// All available infrastructure fields
const ALL_INFRASTRUCTURE_COLUMNS: PaperworkColumnConfig[] = [
  // Core identification
  createColumn('name', { shortLabel: 'Name' }),
  createColumn('manufacturer', { shortLabel: 'Mfr' }),
  createColumn('model', { shortLabel: 'Model' }),
  createColumn('quantity', { format: 'number', shortLabel: 'Qty' }),
  createColumn('category', { shortLabel: 'Cat' }),

  // Network information
  createColumn('ip_address', { shortLabel: 'IP', label: 'IP Address' }),
  createColumn('mac_address', { shortLabel: 'MAC', label: 'MAC Address' }),
  createColumn('subnet_mask', { shortLabel: 'Subnet', label: 'Subnet Mask' }),
  createColumn('gateway', { shortLabel: 'Gateway' }),
  createColumn('vlan_id', { shortLabel: 'VLAN', label: 'VLAN ID' }),
  createColumn('hostname', { shortLabel: 'Host' }),

  // Port assignments
  createColumn('port', { shortLabel: 'Port' }),
  createColumn('connected_to', { shortLabel: 'Conn To', label: 'Connected To' }),
  createColumn('port_type', { shortLabel: 'Type', label: 'Port Type' }),
  createColumn('port_count', { format: 'number', shortLabel: 'Ports', label: 'Port Count' }),

  // Power information
  createColumn('voltage', { format: 'number', shortLabel: 'Volts' }),
  createColumn('amperage', { format: 'number', shortLabel: 'Amps' }),
  createColumn('wattage', { format: 'power', shortLabel: 'Watts' }),
  createColumn('phase', { shortLabel: 'Phase' }),
  createColumn('circuit', { shortLabel: 'Ckt' }),
  createColumn('circuit_number', { shortLabel: 'Ckt#', label: 'Circuit Number' }),

  // Location
  createColumn('location', { shortLabel: 'Loc' }),
  createColumn('type', { shortLabel: 'Type' }),

  // Status & Notes
  createColumn('status', { shortLabel: 'Stat' }),
  createColumn('notes', { shortLabel: 'Notes' })
];

// All available fixture fields
const ALL_FIXTURE_COLUMNS: PaperworkColumnConfig[] = [
  // Position & Identification
  createColumn('position', { shortLabel: 'Pos' }),
  createColumn('unit', { shortLabel: 'U#', label: 'Unit' }),
  createColumn('type', { shortLabel: 'Type' }),
  createColumn('manufacturer', { shortLabel: 'Mfr' }),
  createColumn('model', { shortLabel: 'Model' }),
  createColumn('purpose', { shortLabel: 'Purp' }),
  createColumn('mark', { shortLabel: 'Mark' }),

  // Control
  createColumn('channel', { shortLabel: 'Ch' }),
  createColumn('universe', { shortLabel: 'Univ' }),
  createColumn('dmx_address', { shortLabel: 'DMX', label: 'DMX Address' }),
  createColumn('mode', { shortLabel: 'Mode' }),
  createColumn('console_level', { shortLabel: 'Level', label: 'Console Level' }),

  // Power
  createColumn('dimmer', { shortLabel: 'Dim' }),
  createColumn('circuit', { shortLabel: 'Ckt' }),
  createColumn('circuit_number', { shortLabel: 'Ckt#', label: 'Circuit Number' }),
  createColumn('phase', { shortLabel: 'Phase' }),
  createColumn('wattage', { format: 'power', shortLabel: 'Watts' }),
  createColumn('amperage', { format: 'number', shortLabel: 'Amps' }),

  // Color & Accessories
  createColumn('color', { shortLabel: 'Clr' }),
  createColumn('color_frame', { shortLabel: 'Frame', label: 'Color Frame' }),
  createColumn('gobo', { shortLabel: 'Gobo' }),
  createColumn('gobo_size', { shortLabel: 'Size', label: 'Gobo Size' }),
  createColumn('template_size', { shortLabel: 'Tmpl', label: 'Template Size' }),
  createColumn('accessories', { shortLabel: 'Acc' }),

  // Cables
  createColumn('cable', { shortLabel: 'Cable' }),
  createColumn('data_cable', { shortLabel: 'Data', label: 'Data Cable' }),

  // Location
  createColumn('location', { shortLabel: 'Loc' }),

  // Focus
  createColumn('focus_lr', { shortLabel: 'L/R', label: 'Focus L/R' }),
  createColumn('focus_ud', { shortLabel: 'U/D', label: 'Focus U/D' }),
  createColumn('focus_note', { shortLabel: 'Note', label: 'Focus Note' }),
  createColumn('focus_status', { shortLabel: 'Status', label: 'Focus Status' }),

  // System & Scenery
  createColumn('system', { shortLabel: 'Sys' }),
  createColumn('scenery', { shortLabel: 'Scnry' }),

  // Status & Notes
  createColumn('status', { shortLabel: 'Stat' }),
  createColumn('notes', { shortLabel: 'Notes' }),
  createColumn('work_note_status', { shortLabel: 'Work', label: 'Work Note' })
];

export const COLUMN_DEFAULTS: Record<string, PaperworkColumnConfig[]> = {
  'channel-hookup': [
    createColumn('channel', { width: 7, shortLabel: 'Ch', visible: true }),
    createColumn('dimmer', { width: 8, shortLabel: 'Dim', visible: true }),
    createColumn('position', { width: 12, shortLabel: 'Pos', visible: true }),
    createColumn('unit', { width: 6, shortLabel: 'U#', visible: true }),
    createColumn('type', { width: 16, shortLabel: 'Type', visible: true }),
    createColumn('wattage', { width: 8, format: 'power', shortLabel: 'Watts', visible: true }),
    createColumn('purpose', { width: 15, shortLabel: 'Purp', visible: true }),
    createColumn('color', { width: 10, shortLabel: 'Clr', visible: true }),
    createColumn('notes', { width: 18, shortLabel: 'Notes', visible: true })
  ],

  'dimmer-schedule': [
    createColumn('dimmer', { width: 10, shortLabel: 'Dim' }),
    createColumn('channel', { width: 8, shortLabel: 'Ch' }),
    createColumn('position', { width: 15, shortLabel: 'Pos' }),
    createColumn('unit', { width: 8, shortLabel: 'U#' }),
    createColumn('type', { width: 20, shortLabel: 'Type' }),
    createColumn('wattage', { width: 10, format: 'power', shortLabel: 'Watts' }),
    createColumn('color', { width: 12, shortLabel: 'Clr' }),
    createColumn('notes', { width: 17, shortLabel: 'Notes' })
  ],

  'circuit-list': [
    createColumn('circuit', { width: 10, shortLabel: 'Ckt' }),
    createColumn('position', { width: 15, shortLabel: 'Pos' }),
    createColumn('unit', { width: 8, shortLabel: 'U#' }),
    createColumn('type', { width: 18, shortLabel: 'Type' }),
    createColumn('dimmer', { width: 10, shortLabel: 'Dim' }),
    createColumn('channel', { width: 8, shortLabel: 'Ch' }),
    createColumn('wattage', { width: 10, format: 'power', shortLabel: 'Watts' }),
    createColumn('notes', { width: 21, shortLabel: 'Notes' })
  ],

  'dmx-addresses': [
    createColumn('universe', { width: 10, shortLabel: 'Univ' }),
    createColumn('dmx_address', { width: 10, label: 'DMX Address', shortLabel: 'DMX' }),
    createColumn('channel', { width: 8, shortLabel: 'Ch' }),
    createColumn('position', { width: 15, shortLabel: 'Pos' }),
    createColumn('unit', { width: 8, shortLabel: 'U#' }),
    createColumn('type', { width: 20, shortLabel: 'Type' }),
    createColumn('manufacturer', { width: 15, shortLabel: 'Mfr' }),
    createColumn('notes', { width: 14, shortLabel: 'Notes' })
  ],

  'power-summary': [
    createColumn('type', { width: 25, shortLabel: 'Type' }),
    createColumn('quantity', { width: 10, format: 'number', shortLabel: 'Qty' }),
    createColumn('wattage', { width: 12, format: 'power', shortLabel: 'Watts' }),
    createColumn('amperage', { width: 12, format: 'amperage', shortLabel: 'Amps' }),
    createColumn('total_watts', { width: 15, format: 'power', label: 'Total Watts', shortLabel: 'Tot W' }),
    createColumn('total_amps', { width: 13, format: 'amperage', label: 'Total Amps', shortLabel: 'Tot A' }),
    createColumn('notes', { width: 13, shortLabel: 'Notes' })
  ],

  'color-schedule': [
    createColumn('color', { width: 15, shortLabel: 'Clr' }),
    createColumn('type', { width: 20, shortLabel: 'Type' }),
    createColumn('position', { width: 15, shortLabel: 'Pos' }),
    createColumn('unit', { width: 8, shortLabel: 'U#' }),
    createColumn('channel', { width: 8, shortLabel: 'Ch' }),
    createColumn('purpose', { width: 15, shortLabel: 'Purp' }),
    createColumn('notes', { width: 19, shortLabel: 'Notes' })
  ],

  'gobo-schedule': [
    createColumn('gobo', { width: 20, shortLabel: 'Gobo' }),
    createColumn('type', { width: 20, shortLabel: 'Type' }),
    createColumn('position', { width: 15, shortLabel: 'Pos' }),
    createColumn('unit', { width: 8, shortLabel: 'U#' }),
    createColumn('channel', { width: 8, shortLabel: 'Ch' }),
    createColumn('purpose', { width: 12, shortLabel: 'Purp' }),
    createColumn('notes', { width: 17, shortLabel: 'Notes' })
  ],

  'infrastructure-list': [
    createColumn('name', { width: 20, shortLabel: 'Name' }),
    createColumn('type', { width: 15, shortLabel: 'Type' }),
    createColumn('manufacturer', { width: 15, shortLabel: 'Mfr' }),
    createColumn('model', { width: 15, shortLabel: 'Model' }),
    createColumn('location', { width: 15, shortLabel: 'Loc' }),
    createColumn('status', { width: 10, shortLabel: 'Stat' }),
    createColumn('notes', { width: 10, shortLabel: 'Notes' })
  ],

  'network-summary': [
    createColumn('name', { width: 18, shortLabel: 'Name' }),
    createColumn('ip_address', { width: 12, label: 'IP Address', shortLabel: 'IP' }),
    createColumn('mac_address', { width: 15, label: 'MAC Address', shortLabel: 'MAC' }),
    createColumn('hostname', { width: 15, shortLabel: 'Host' }),
    createColumn('location', { width: 15, shortLabel: 'Loc' }),
    createColumn('status', { width: 10, shortLabel: 'Stat' }),
    createColumn('notes', { width: 15, shortLabel: 'Notes' })
  ],

  'port-assignments': [
    createColumn('name', { width: 20, shortLabel: 'Name' }),
    createColumn('port', { width: 10, shortLabel: 'Port' }),
    createColumn('connected_to', { width: 20, label: 'Connected To', shortLabel: 'Conn To' }),
    createColumn('port_type', { width: 12, label: 'Port Type', shortLabel: 'Type' }),
    createColumn('location', { width: 15, shortLabel: 'Loc' }),
    createColumn('notes', { width: 23, shortLabel: 'Notes' })
  ],

  'infrastructure-power': [
    createColumn('name', { width: 20, shortLabel: 'Name' }),
    createColumn('type', { width: 15, shortLabel: 'Type' }),
    createColumn('voltage', { width: 10, format: 'number', shortLabel: 'Volts' }),
    createColumn('amperage', { width: 10, format: 'number', shortLabel: 'Amps' }),
    createColumn('wattage', { width: 12, format: 'power', shortLabel: 'Watts' }),
    createColumn('circuit', { width: 12, shortLabel: 'Ckt' }),
    createColumn('location', { width: 21, shortLabel: 'Loc' })
  ],

  'infrastructure-location': [
    createColumn('location', { width: 20, shortLabel: 'Loc' }),
    createColumn('name', { width: 20, shortLabel: 'Name' }),
    createColumn('type', { width: 15, shortLabel: 'Type' }),
    createColumn('manufacturer', { width: 15, shortLabel: 'Mfr' }),
    createColumn('status', { width: 10, shortLabel: 'Stat' }),
    createColumn('notes', { width: 20, shortLabel: 'Notes' })
  ]
};

/**
 * Get all available columns for a report type (includes all equipment manager fields)
 */
export function getAllAvailableColumns(reportType: string): PaperworkColumnConfig[] {
  const isInfrastructureReport = [
    'infrastructure-list',
    'network-summary',
    'port-assignments',
    'infrastructure-power',
    'infrastructure-location'
  ].includes(reportType);

  return isInfrastructureReport ? ALL_INFRASTRUCTURE_COLUMNS : ALL_FIXTURE_COLUMNS;
}
