/**
 * Mock data for testing
 * Provides reusable mock fixtures, projects, and other test data
 */

/**
 * Mock fixture data for testing
 */
export const mockFixture = {
  id: 'fixture-1',
  project_id: 'project-1',
  position: '1',
  type: 'Moving Light',
  purpose: 'Key Light',
  wattage: 1200,
  amps: 10,
  weight: 65,
  dimmer_rack_id: 'rack-1',
  dimmer_channel_number: 1,
  dimmer_circuit: 'AA',
  unit_number: 101,
  gel_color: 'R80',
  channel: '1',
  universe: 1,
  address: 1,
  quantity: 1,
  created_at: Date.now(),
  updated_at: Date.now(),
};

/**
 * Mock dimmer rack for power calculations
 */
export const mockDimmerRack = {
  id: 'rack-1',
  project_id: 'project-1',
  name: 'Dimmer Rack A',
  rack_identifier: 'A',
  rack_type: 'dimmer' as const,
  circuit_count: 96,
  channels_per_module: 12,
  watts_per_module: 2400,
  location: 'Stage Right',
  phase: 'A' as const,
  service_type: '208V 3-Phase',
  notes: '',
  created_at: Date.now(),
  updated_at: Date.now(),
};

/**
 * Mock PD rack
 */
export const mockPDRack = {
  id: 'pd-rack-1',
  project_id: 'project-1',
  name: 'PD Rack 1',
  rack_identifier: 'PD1',
  rack_type: 'pd' as const,
  circuit_count: 48,
  channels_per_module: 6,
  watts_per_module: 0,
  location: 'Downstage',
  phase: 'B' as const,
  service_type: '208V 3-Phase',
  notes: '',
  created_at: Date.now(),
  updated_at: Date.now(),
};

/**
 * Mock prep project
 */
export const mockPrepProject = {
  id: 'prep-1',
  production_name: 'Test Production',
  venue: 'Test Venue',
  order_date: Date.now(),
  disciplines: ['lighting'],
  current_revision: 0,
  created_at: Date.now(),
  updated_at: Date.now(),
};

/**
 * Mock prep equipment item
 */
export const mockPrepEquipmentItem = {
  id: 'equipment-1',
  project_id: 'prep-1',
  section_id: 'section-1',
  description: 'ETC Source Four 750W',
  category: 'Lighting',
  prep_qty: 10,
  active_qty: 10,
  strike_qty: 10,
  unit: 'ea',
  notes: '',
  sort_order: 0,
  created_at: Date.now(),
  updated_at: Date.now(),
};

/**
 * Mock layout element
 */
export const mockLayoutElement = {
  id: 'element-1',
  layout_id: 'layout-1',
  element_type: 'text' as const,
  config: {
    content: 'Test Text',
    placeholder: 'Enter text'
  },
  style: {
    fontSize: 12,
    fontFamily: 'Arial',
    fontWeight: 'normal' as const,
    fontStyle: 'normal' as const,
    textAlign: 'left' as const,
    color: '#000000',
  },
  grid_column: 0,
  grid_row: 0,
  column_span: 4,
  row_span: 2,
  layer: 0,
  created_at: Date.now(),
  updated_at: Date.now(),
};

/**
 * Mock port assignment
 */
export const mockPortAssignment = {
  port: 1,
  connected_to: '',
  linked_fixture_id: '',
  linked_equipment_id: '',
  linked_port: undefined,
  type: 'ethernet' as const,
  vlan: undefined,
  status: 'active' as const,
  notes: '',
};

/**
 * Mock infrastructure equipment
 */
export const mockInfrastructureEquipment = {
  id: 'infra-equipment-1',
  project_id: 'project-1',
  name: 'Network Switch 1',
  type: 'switch',
  manufacturer: 'Cisco',
  model: 'SG350-28',
  location: 'Rack 1',
  port_count: 28,
  notes: '',
  created_at: Date.now(),
  updated_at: Date.now(),
};

/**
 * Create a mock fixture with custom properties
 */
export function createMockFixture(overrides: Partial<typeof mockFixture> = {}) {
  return {
    ...mockFixture,
    ...overrides,
    id: overrides.id || `fixture-${Date.now()}`,
  };
}

/**
 * Create multiple mock fixtures
 */
export function createMockFixtures(count: number, baseOverrides: Partial<typeof mockFixture> = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockFixture({
      ...baseOverrides,
      id: `fixture-${i + 1}`,
      position: `${i + 1}`,
      unit_number: (baseOverrides.unit_number || 100) + i,
    })
  );
}

// Add more mock data as needed...
