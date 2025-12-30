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
    createColumn('channel', { width: 7 }),
    createColumn('dimmer', { width: 8 }),
    createColumn('position', { width: 12 }),
    createColumn('unit', { width: 6 }),
    createColumn('type', { width: 16 }),
    createColumn('wattage', { width: 8, format: 'power' }),
    createColumn('purpose', { width: 15 }),
    createColumn('color', { width: 10 }),
    createColumn('notes', { width: 18 })
  ],

  'dimmer-schedule': [
    createColumn('dimmer', { width: 10 }),
    createColumn('channel', { width: 8 }),
    createColumn('position', { width: 15 }),
    createColumn('unit', { width: 8 }),
    createColumn('type', { width: 20 }),
    createColumn('wattage', { width: 10, format: 'power' }),
    createColumn('color', { width: 12 }),
    createColumn('notes', { width: 17 })
  ],

  'circuit-list': [
    createColumn('circuit', { width: 10 }),
    createColumn('position', { width: 15 }),
    createColumn('unit', { width: 8 }),
    createColumn('type', { width: 18 }),
    createColumn('dimmer', { width: 10 }),
    createColumn('channel', { width: 8 }),
    createColumn('wattage', { width: 10, format: 'power' }),
    createColumn('notes', { width: 21 })
  ],

  'dmx-addresses': [
    createColumn('universe', { width: 10 }),
    createColumn('dmx_address', { width: 10, label: 'DMX Address' }),
    createColumn('channel', { width: 8 }),
    createColumn('position', { width: 15 }),
    createColumn('unit', { width: 8 }),
    createColumn('type', { width: 20 }),
    createColumn('manufacturer', { width: 15 }),
    createColumn('notes', { width: 14 })
  ],

  'power-summary': [
    createColumn('type', { width: 25 }),
    createColumn('quantity', { width: 10, format: 'number' }),
    createColumn('wattage', { width: 12, format: 'power' }),
    createColumn('amperage', { width: 12, format: 'number' }),
    createColumn('total_watts', { width: 15, format: 'power', label: 'Total Watts' }),
    createColumn('total_amps', { width: 13, format: 'number', label: 'Total Amps' }),
    createColumn('notes', { width: 13 })
  ],

  'color-schedule': [
    createColumn('color', { width: 15 }),
    createColumn('quantity', { width: 10, format: 'number' }),
    createColumn('type', { width: 20 }),
    createColumn('position', { width: 15 }),
    createColumn('unit', { width: 8 }),
    createColumn('channel', { width: 8 }),
    createColumn('notes', { width: 24 })
  ],

  'gobo-schedule': [
    createColumn('gobo', { width: 20 }),
    createColumn('quantity', { width: 10, format: 'number' }),
    createColumn('type', { width: 20 }),
    createColumn('position', { width: 15 }),
    createColumn('channel', { width: 8 }),
    createColumn('notes', { width: 27 })
  ],

  'infrastructure-list': [
    createColumn('name', { width: 20 }),
    createColumn('type', { width: 15 }),
    createColumn('manufacturer', { width: 15 }),
    createColumn('model', { width: 15 }),
    createColumn('location', { width: 15 }),
    createColumn('status', { width: 10 }),
    createColumn('notes', { width: 10 })
  ],

  'network-summary': [
    createColumn('name', { width: 18 }),
    createColumn('ip_address', { width: 12, label: 'IP Address' }),
    createColumn('mac_address', { width: 15, label: 'MAC Address' }),
    createColumn('hostname', { width: 15 }),
    createColumn('location', { width: 15 }),
    createColumn('status', { width: 10 }),
    createColumn('notes', { width: 15 })
  ],

  'port-assignments': [
    createColumn('name', { width: 20 }),
    createColumn('port', { width: 10 }),
    createColumn('connected_to', { width: 20, label: 'Connected To' }),
    createColumn('port_type', { width: 12, label: 'Port Type' }),
    createColumn('location', { width: 15 }),
    createColumn('notes', { width: 23 })
  ],

  'infrastructure-power': [
    createColumn('name', { width: 20 }),
    createColumn('type', { width: 15 }),
    createColumn('voltage', { width: 10, format: 'number' }),
    createColumn('amperage', { width: 10, format: 'number' }),
    createColumn('wattage', { width: 12, format: 'power' }),
    createColumn('circuit', { width: 12 }),
    createColumn('location', { width: 21 })
  ],

  'infrastructure-location': [
    createColumn('location', { width: 20 }),
    createColumn('name', { width: 20 }),
    createColumn('type', { width: 15 }),
    createColumn('manufacturer', { width: 15 }),
    createColumn('status', { width: 10 }),
    createColumn('notes', { width: 20 })
  ]
};
