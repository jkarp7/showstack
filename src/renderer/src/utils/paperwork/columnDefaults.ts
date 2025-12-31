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

export const COLUMN_DEFAULTS: Record<string, PaperworkColumnConfig[]> = {
  'channel-hookup': [
    createColumn('channel', { width: 7, shortLabel: 'Ch' }),
    createColumn('dimmer', { width: 8, shortLabel: 'Dim' }),
    createColumn('position', { width: 12, shortLabel: 'Pos' }),
    createColumn('unit', { width: 6, shortLabel: 'U#' }),
    createColumn('type', { width: 16, shortLabel: 'Type' }),
    createColumn('wattage', { width: 8, format: 'power', shortLabel: 'Watts' }),
    createColumn('purpose', { width: 15, shortLabel: 'Purp' }),
    createColumn('color', { width: 10, shortLabel: 'Clr' }),
    createColumn('notes', { width: 18, shortLabel: 'Notes' })
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
    createColumn('amperage', { width: 12, format: 'number', shortLabel: 'Amps' }),
    createColumn('total_watts', { width: 15, format: 'power', label: 'Total Watts', shortLabel: 'Tot W' }),
    createColumn('total_amps', { width: 13, format: 'number', label: 'Total Amps', shortLabel: 'Tot A' }),
    createColumn('notes', { width: 13, shortLabel: 'Notes' })
  ],

  'color-schedule': [
    createColumn('color', { width: 15, shortLabel: 'Clr' }),
    createColumn('quantity', { width: 10, format: 'number', shortLabel: 'Qty' }),
    createColumn('type', { width: 20, shortLabel: 'Type' }),
    createColumn('position', { width: 15, shortLabel: 'Pos' }),
    createColumn('unit', { width: 8, shortLabel: 'U#' }),
    createColumn('channel', { width: 8, shortLabel: 'Ch' }),
    createColumn('notes', { width: 24, shortLabel: 'Notes' })
  ],

  'gobo-schedule': [
    createColumn('gobo', { width: 20, shortLabel: 'Gobo' }),
    createColumn('quantity', { width: 10, format: 'number', shortLabel: 'Qty' }),
    createColumn('type', { width: 20, shortLabel: 'Type' }),
    createColumn('position', { width: 15, shortLabel: 'Pos' }),
    createColumn('channel', { width: 8, shortLabel: 'Ch' }),
    createColumn('notes', { width: 27, shortLabel: 'Notes' })
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
