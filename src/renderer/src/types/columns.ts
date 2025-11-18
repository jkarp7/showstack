export type ColumnKey =
  | 'position'
  | 'unit'
  | 'type'
  | 'purpose'
  | 'channel'
  | 'dimmer'
  | 'circuit'
  | 'color'
  | 'location'
  | 'notes'
  | 'gobo'
  | 'wattage';

export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  width: string;
  isRequired?: boolean; // Can't be hidden
}

export const COLUMN_CONFIGS: ColumnConfig[] = [
  { key: 'position', label: 'Position', width: 'w-32', isRequired: true },
  { key: 'unit', label: 'Unit#', width: 'w-20' },
  { key: 'type', label: 'Type', width: 'w-64' },
  { key: 'purpose', label: 'Purpose', width: 'w-48' },
  { key: 'channel', label: 'Chan', width: 'w-20' },
  { key: 'dimmer', label: 'Dim', width: 'w-20' },
  { key: 'circuit', label: 'Ckt', width: 'w-20' },
  { key: 'color', label: 'Color', width: 'w-24' },
  { key: 'gobo', label: 'Gobo', width: 'w-24' },
  { key: 'wattage', label: 'Wattage', width: 'w-20' },
  { key: 'location', label: 'Location', width: 'w-32' },
  { key: 'notes', label: 'Notes', width: 'flex-1 min-w-48' },
];

export type ColumnVisibility = Record<ColumnKey, boolean>;

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  position: true,
  unit: true,
  type: true,
  purpose: true,
  channel: true,
  dimmer: true,
  circuit: true,
  color: true,
  gobo: false,
  wattage: false,
  location: true,
  notes: true,
};
