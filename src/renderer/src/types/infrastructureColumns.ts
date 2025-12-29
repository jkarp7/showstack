export type InfrastructureColumnKey =
  | 'name' | 'manufacturer' | 'model' | 'quantity' | 'category'
  | 'ip_address' | 'mac_address' | 'subnet_mask' | 'gateway' | 'vlan_id' | 'hostname'
  | 'port_count' | 'voltage' | 'amperage' | 'wattage' | 'phase'
  | 'circuit' | 'circuit_number' | 'dimmer_rack' | 'pd_rack'
  | 'location' | 'position_x' | 'position_y' | 'position_z'
  | 'notes' | 'status';

export interface InfrastructureColumnConfig {
  key: InfrastructureColumnKey;
  label: string;
  width: string;
  isRequired?: boolean;
  group?: string;
}

export const INFRASTRUCTURE_COLUMN_CONFIGS: InfrastructureColumnConfig[] = [
  // Core
  { key: 'name', label: 'Name', width: 'w-48', isRequired: true },
  { key: 'manufacturer', label: 'Manufacturer', width: 'w-32' },
  { key: 'model', label: 'Model', width: 'w-32' },
  { key: 'quantity', label: 'Qty', width: 'w-16' },
  { key: 'category', label: 'Category', width: 'w-32' },

  // Network
  { key: 'ip_address', label: 'IP Address', width: 'w-32', group: 'Network' },
  { key: 'mac_address', label: 'MAC Address', width: 'w-36', group: 'Network' },
  { key: 'subnet_mask', label: 'Subnet', width: 'w-32', group: 'Network' },
  { key: 'gateway', label: 'Gateway', width: 'w-32', group: 'Network' },
  { key: 'vlan_id', label: 'VLAN', width: 'w-20', group: 'Network' },
  { key: 'hostname', label: 'Hostname', width: 'w-32', group: 'Network' },

  // Ports
  { key: 'port_count', label: 'Ports', width: 'w-20', group: 'Ports' },

  // Power
  { key: 'voltage', label: 'Voltage', width: 'w-20', group: 'Power' },
  { key: 'amperage', label: 'Amperage', width: 'w-24', group: 'Power' },
  { key: 'wattage', label: 'Wattage', width: 'w-24', group: 'Power' },
  { key: 'phase', label: 'Phase', width: 'w-20', group: 'Power' },
  { key: 'circuit', label: 'Circuit', width: 'w-24', group: 'Power' },
  { key: 'circuit_number', label: 'Circuit #', width: 'w-24', group: 'Power' },
  { key: 'dimmer_rack', label: 'Dimmer Rack', width: 'w-32', group: 'Power' },
  { key: 'pd_rack', label: 'PD Rack', width: 'w-32', group: 'Power' },

  // Location
  { key: 'location', label: 'Location', width: 'w-32', group: 'Location' },
  { key: 'position_x', label: 'X', width: 'w-20', group: 'Location' },
  { key: 'position_y', label: 'Y', width: 'w-20', group: 'Location' },
  { key: 'position_z', label: 'Z', width: 'w-20', group: 'Location' },

  // Other
  { key: 'notes', label: 'Notes', width: 'w-48' },
  { key: 'status', label: 'Status', width: 'w-24' }
];

export const DEFAULT_INFRASTRUCTURE_COLUMN_VISIBILITY: Record<InfrastructureColumnKey, boolean> = {
  // Core - visible
  name: true,
  manufacturer: true,
  model: true,
  quantity: true,
  category: true,

  // Network - hidden by default
  ip_address: false,
  mac_address: false,
  subnet_mask: false,
  gateway: false,
  vlan_id: false,
  hostname: false,

  // Ports
  port_count: false,

  // Power - hidden by default
  voltage: false,
  amperage: false,
  wattage: false,
  phase: false,
  circuit: false,
  circuit_number: false,
  dimmer_rack: false,
  pd_rack: false,

  // Location - some visible
  location: true,
  position_x: false,
  position_y: false,
  position_z: false,

  // Other
  notes: true,
  status: true
};

export const DEFAULT_INFRASTRUCTURE_COLUMN_ORDER: InfrastructureColumnKey[] = [
  'name',
  'manufacturer',
  'model',
  'quantity',
  'category',
  'location',
  'notes',
  'status'
];
