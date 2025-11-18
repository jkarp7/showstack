// LightWright-compatible column keys
export type ColumnKey =
  // DISPLAYED BY DEFAULT in LightWright
  | 'address'          // Auto-calc: universe/dmx_address
  | 'dimmer'
  | 'position'
  | 'unit'             // Unit #
  | 'type'             // Instrument Type
  | 'wattage'          // Load
  | 'accessories'      // Accessory
  | 'purpose'
  | 'color'
  | 'gobo'
  | 'channel'
  // OPTIONAL in LightWright
  | 'gobo_size'
  | 'circuit'          // Circuit Name
  | 'circuit_number'   // Circuit #
  | 'cable'
  | 'data_cable'
  | 'mark'
  | 'universe'         // Auto-populates from address
  | 'dmx_address'      // DMX # - Auto-populates from address
  | 'system'
  | 'scenery'
  | 'focus_lr'
  | 'focus_ud'
  | 'focus_note'
  | 'focus_cut_us'
  | 'focus_cut_ds'
  | 'focus_cut_sr'
  | 'focus_cut_sl'
  | 'focus_cut_top'
  | 'focus_cut_bottom'
  | 'focus_status'
  | 'vw_layer'
  | 'vw_label_legend'
  | 'vw_class'
  | 'vw_x_coordinate'
  | 'vw_y_coordinate'
  | 'vw_z_coordinate'
  | 'vw_symbol_rotation'
  | 'vw_focus_point'
  | 'on_light_plot'
  | 'vw_uid'
  | 'vw_symbol'
  | 'showstack_id'
  | 'console_level'
  | 'phase'            // Dimmer Phase
  | 'work_note_status'
  | 'color_frame'
  | 'changed_at'
  | 'changed_what'
  | 'changed_who'
  | 'location'
  | 'notes'
  // User columns (will be user1-user24)
  | 'user1' | 'user2' | 'user3' | 'user4' | 'user5' | 'user6'
  | 'user7' | 'user8' | 'user9' | 'user10' | 'user11' | 'user12'
  | 'user13' | 'user14' | 'user15' | 'user16' | 'user17' | 'user18'
  | 'user19' | 'user20' | 'user21' | 'user22' | 'user23' | 'user24';

export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  width: string;
  isRequired?: boolean;  // Can't be hidden
  isComputed?: boolean;  // Computed from other fields
  group?: string;        // For grouping in menu (e.g., "Focus Cut", "Vectorworks")
}

// Column configurations matching LightWright order and grouping
export const COLUMN_CONFIGS: ColumnConfig[] = [
  // DISPLAYED BY DEFAULT in LightWright
  { key: 'address', label: 'Address', width: 'w-24' }, // Editable - parses to universe/dmx_address
  { key: 'dimmer', label: 'Dim', width: 'w-20' },
  { key: 'position', label: 'Position', width: 'w-32', isRequired: true },
  { key: 'unit', label: 'Unit#', width: 'w-20' },
  { key: 'type', label: 'Type', width: 'w-64' },
  { key: 'wattage', label: 'Load', width: 'w-20' },
  { key: 'accessories', label: 'Accessory', width: 'w-32' },
  { key: 'purpose', label: 'Purpose', width: 'w-48' },
  { key: 'color', label: 'Color', width: 'w-24' },
  { key: 'gobo', label: 'Gobo', width: 'w-24' },
  { key: 'channel', label: 'Chan', width: 'w-20' },

  // OPTIONAL in LightWright
  { key: 'gobo_size', label: 'Gobo Size', width: 'w-24' },
  { key: 'circuit', label: 'Circuit Name', width: 'w-24' },
  { key: 'circuit_number', label: 'Circuit #', width: 'w-20' },
  { key: 'cable', label: 'Cable', width: 'w-24' },
  { key: 'data_cable', label: 'Data Cable', width: 'w-24' },
  { key: 'mark', label: 'Mark', width: 'w-20' },
  { key: 'universe', label: 'Universe', width: 'w-20' }, // Can be edited directly or via Address
  { key: 'dmx_address', label: 'DMX #', width: 'w-20' }, // Can be edited directly or via Address
  { key: 'system', label: 'System', width: 'w-24' },
  { key: 'scenery', label: 'Scenery', width: 'w-32' },
  { key: 'focus_lr', label: 'Focus L/R', width: 'w-24' },
  { key: 'focus_ud', label: 'Focus U/D', width: 'w-24' },
  { key: 'focus_note', label: 'Focus Note', width: 'w-48' },
  { key: 'focus_cut_us', label: 'Cut: US', width: 'w-20', group: 'Focus Cut' },
  { key: 'focus_cut_ds', label: 'Cut: DS', width: 'w-20', group: 'Focus Cut' },
  { key: 'focus_cut_sr', label: 'Cut: SR', width: 'w-20', group: 'Focus Cut' },
  { key: 'focus_cut_sl', label: 'Cut: SL', width: 'w-20', group: 'Focus Cut' },
  { key: 'focus_cut_top', label: 'Cut: Top', width: 'w-20', group: 'Focus Cut' },
  { key: 'focus_cut_bottom', label: 'Cut: Bottom', width: 'w-24', group: 'Focus Cut' },
  { key: 'focus_status', label: 'Focus Status', width: 'w-24' },
  { key: 'vw_layer', label: 'VW Layer', width: 'w-24', group: 'Vectorworks' },
  { key: 'vw_label_legend', label: 'VW Label Legend', width: 'w-32', group: 'Vectorworks' },
  { key: 'vw_class', label: 'VW Class', width: 'w-24', group: 'Vectorworks' },
  { key: 'vw_x_coordinate', label: 'VW X', width: 'w-20', group: 'Vectorworks' },
  { key: 'vw_y_coordinate', label: 'VW Y', width: 'w-20', group: 'Vectorworks' },
  { key: 'vw_z_coordinate', label: 'VW Z', width: 'w-20', group: 'Vectorworks' },
  { key: 'vw_symbol_rotation', label: 'VW Rotation', width: 'w-24', group: 'Vectorworks' },
  { key: 'vw_focus_point', label: 'VW Focus Point', width: 'w-32', group: 'Vectorworks' },
  { key: 'on_light_plot', label: 'On Light Plot', width: 'w-24', group: 'Vectorworks' },
  { key: 'vw_uid', label: 'VW UID', width: 'w-32', group: 'Vectorworks' },
  { key: 'vw_symbol', label: 'VW Symbol', width: 'w-32', group: 'Vectorworks' },
  { key: 'showstack_id', label: 'ShowStack ID', width: 'w-32' },
  { key: 'console_level', label: 'Console Level', width: 'w-24' },
  { key: 'phase', label: 'Dimmer Phase', width: 'w-24' },
  { key: 'work_note_status', label: 'Work Note Status', width: 'w-32' },
  { key: 'color_frame', label: 'Color Frame', width: 'w-24' },
  { key: 'changed_at', label: 'When Changed', width: 'w-32' },
  { key: 'changed_what', label: 'What Changed', width: 'w-32' },
  { key: 'changed_who', label: 'Who Changed', width: 'w-24' },
  { key: 'location', label: 'Location', width: 'w-32' },
  { key: 'notes', label: 'Notes', width: 'flex-1 min-w-48' },

  // User-definable columns (24)
  { key: 'user1', label: 'User 1', width: 'w-24' },
  { key: 'user2', label: 'User 2', width: 'w-24' },
  { key: 'user3', label: 'User 3', width: 'w-24' },
  { key: 'user4', label: 'User 4', width: 'w-24' },
  { key: 'user5', label: 'User 5', width: 'w-24' },
  { key: 'user6', label: 'User 6', width: 'w-24' },
  { key: 'user7', label: 'User 7', width: 'w-24' },
  { key: 'user8', label: 'User 8', width: 'w-24' },
  { key: 'user9', label: 'User 9', width: 'w-24' },
  { key: 'user10', label: 'User 10', width: 'w-24' },
  { key: 'user11', label: 'User 11', width: 'w-24' },
  { key: 'user12', label: 'User 12', width: 'w-24' },
  { key: 'user13', label: 'User 13', width: 'w-24' },
  { key: 'user14', label: 'User 14', width: 'w-24' },
  { key: 'user15', label: 'User 15', width: 'w-24' },
  { key: 'user16', label: 'User 16', width: 'w-24' },
  { key: 'user17', label: 'User 17', width: 'w-24' },
  { key: 'user18', label: 'User 18', width: 'w-24' },
  { key: 'user19', label: 'User 19', width: 'w-24' },
  { key: 'user20', label: 'User 20', width: 'w-24' },
  { key: 'user21', label: 'User 21', width: 'w-24' },
  { key: 'user22', label: 'User 22', width: 'w-24' },
  { key: 'user23', label: 'User 23', width: 'w-24' },
  { key: 'user24', label: 'User 24', width: 'w-24' },
];

export type ColumnVisibility = Record<ColumnKey, boolean>;

// Default visibility matching LightWright defaults
export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  // DISPLAYED BY DEFAULT in LightWright
  address: true,
  dimmer: true,
  position: true,
  unit: true,
  type: true,
  wattage: true,        // Load
  accessories: true,
  purpose: true,
  color: true,
  gobo: true,
  channel: true,

  // OPTIONAL (hidden by default)
  gobo_size: false,
  circuit: false,
  circuit_number: false,
  cable: false,
  data_cable: false,
  mark: false,
  universe: false,
  dmx_address: false,
  system: false,
  scenery: false,
  focus_lr: false,
  focus_ud: false,
  focus_note: false,
  focus_cut_us: false,
  focus_cut_ds: false,
  focus_cut_sr: false,
  focus_cut_sl: false,
  focus_cut_top: false,
  focus_cut_bottom: false,
  focus_status: false,
  vw_layer: false,
  vw_label_legend: false,
  vw_class: false,
  vw_x_coordinate: false,
  vw_y_coordinate: false,
  vw_z_coordinate: false,
  vw_symbol_rotation: false,
  vw_focus_point: false,
  on_light_plot: false,
  vw_uid: false,
  vw_symbol: false,
  showstack_id: false,
  console_level: false,
  phase: false,
  work_note_status: false,
  color_frame: false,
  changed_at: false,
  changed_what: false,
  changed_who: false,
  location: false,
  notes: true,

  // User columns (hidden by default)
  user1: false,
  user2: false,
  user3: false,
  user4: false,
  user5: false,
  user6: false,
  user7: false,
  user8: false,
  user9: false,
  user10: false,
  user11: false,
  user12: false,
  user13: false,
  user14: false,
  user15: false,
  user16: false,
  user17: false,
  user18: false,
  user19: false,
  user20: false,
  user21: false,
  user22: false,
  user23: false,
  user24: false,
};
