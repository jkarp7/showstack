export interface PortAssignment {
  port: number;
  connected_to?: string; // Legacy free text

  // Port linking - structured connections
  linked_fixture_id?: string; // Link to fixture
  linked_equipment_id?: string; // Link to other infrastructure equipment
  linked_port?: number; // Port number on linked equipment

  type?: 'ethernet' | 'dmx' | 'fiber' | 'power' | 'other';
  vlan?: number;
  status?: 'active' | 'inactive' | 'error';
  notes?: string;
}

export interface InfrastructureEquipment {
  id: string;
  project_id: string;

  // Core identification
  name: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
  category?: 'network' | 'data_distribution' | 'audio' | 'video';

  // Network information
  ip_address?: string;
  mac_address?: string;
  subnet_mask?: string;
  gateway?: string;
  vlan_id?: number;
  hostname?: string;

  // Port assignments
  port_assignments?: PortAssignment[];
  port_count?: number;

  // Power information
  voltage?: number;
  amperage?: number;
  wattage?: number;
  phase?: string;

  // Power rack linking
  dimmer_rack_id?: string;
  dimmer_channel_number?: number;
  pd_rack_id?: string;
  pd_circuit_number?: number;
  pd_breaker_number?: number;
  circuit?: string;
  circuit_number?: number;

  // Location
  location?: string;
  position_x?: number;
  position_y?: number;
  position_z?: number;

  // Notes & Status
  notes?: string;
  status: string;

  // Metadata
  created_at: number;
  updated_at: number;
}

export interface InfrastructureStore {
  equipment: InfrastructureEquipment[];
  loading: boolean;
  currentProjectId: string | null;
  loadEquipment: (projectId: string) => Promise<void>;
  addEquipment: (
    equipment: Omit<InfrastructureEquipment, 'id' | 'created_at' | 'updated_at'>,
  ) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<InfrastructureEquipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<void>;
}
