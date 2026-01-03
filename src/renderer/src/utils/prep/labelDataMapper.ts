/**
 * Label Data Mapper
 *
 * Maps equipment/fixture data to label fields for batch printing.
 * Supports all common label data fields used in theatrical lighting.
 */

import type { Fixture } from '../../types';

/**
 * Label data interface - represents all fields that can be used on labels
 */
export interface LabelData {
  // Position & Identification
  position?: string;
  unitNumber?: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  purpose?: string;
  mark?: string;

  // Control
  channel?: string;
  universe?: string;
  dmxAddress?: string;
  address?: string; // Combined universe/dmx_address
  mode?: string;
  consoleLevel?: string;

  // Power
  dimmer?: string;
  circuit?: string;
  circuitNumber?: string;
  phase?: string;
  wattage?: string;
  amperage?: string;

  // Color & Accessories
  color?: string;
  colorFrame?: string;
  gobo?: string;
  goboSize?: string;
  templateSize?: string;
  accessories?: string;

  // Cables
  cable?: string;
  dataCable?: string;

  // Location
  location?: string;

  // System & Status
  system?: string;
  status?: string;
  notes?: string;

  // Custom fields for flexibility
  custom1?: string;
  custom2?: string;
  custom3?: string;
  custom4?: string;
}

/**
 * Map a single fixture to label data
 */
export function mapFixtureToLabelData(fixture: Fixture): LabelData {
  return {
    // Position & Identification
    position: fixture.position || '',
    unitNumber: fixture.unit_number?.toString() || fixture.unit?.toString() || '',
    type: fixture.type || '',
    manufacturer: fixture.manufacturer || '',
    model: fixture.model || '',
    purpose: fixture.purpose || '',
    mark: fixture.mark || '',

    // Control
    channel: fixture.channel || '',
    universe: fixture.universe?.toString() || '',
    dmxAddress: fixture.dmx_address?.toString() || '',
    address: fixture.address || (fixture.universe && fixture.dmx_address
      ? `${fixture.universe}/${fixture.dmx_address}`
      : ''),
    mode: fixture.mode || '',
    consoleLevel: fixture.console_level || '',

    // Power
    dimmer: fixture.dimmer || '',
    circuit: fixture.circuit || '',
    circuitNumber: fixture.circuit_number || '',
    phase: fixture.phase || '',
    wattage: fixture.wattage?.toString() || '',
    amperage: fixture.amperage?.toString() || '',

    // Color & Accessories
    color: fixture.color || '',
    colorFrame: fixture.color_frame || '',
    gobo: fixture.gobo || '',
    goboSize: fixture.gobo_size || '',
    templateSize: fixture.template_size || '',
    accessories: fixture.accessories?.join(', ') || '',

    // Cables
    cable: fixture.cable || '',
    dataCable: fixture.data_cable || '',

    // Location
    location: fixture.location || '',

    // System & Status
    system: fixture.system || '',
    status: fixture.status || '',
    notes: fixture.notes || '',

    // Custom fields - can be mapped from fixture.custom_fields if needed
    custom1: '',
    custom2: '',
    custom3: '',
    custom4: ''
  };
}

/**
 * Map multiple fixtures to label data array for batch printing
 */
export function mapFixturesToLabelData(fixtures: Fixture[]): LabelData[] {
  return fixtures.map(mapFixtureToLabelData);
}

/**
 * Get label data for specific fixture IDs
 */
export async function getLabelDataForFixtures(
  fixtureIds: string[],
  projectId: string
): Promise<LabelData[]> {
  try {
    // Load fixtures from database
    const allFixtures = await window.api.fixtures.getByProject(projectId);

    // Filter to requested IDs
    const selectedFixtures = allFixtures.filter(f => fixtureIds.includes(f.id));

    // Map to label data
    return mapFixturesToLabelData(selectedFixtures);
  } catch (error) {
    console.error('Failed to get label data for fixtures:', error);
    return [];
  }
}

/**
 * Get label data for all fixtures in a project
 */
export async function getAllLabelDataForProject(projectId: string): Promise<LabelData[]> {
  try {
    const fixtures = await window.api.fixtures.getByProject(projectId);
    return mapFixturesToLabelData(fixtures);
  } catch (error) {
    console.error('Failed to get label data for project:', error);
    return [];
  }
}

/**
 * Create sample label data for preview purposes
 */
export function createSampleLabelData(): LabelData {
  return {
    position: '1st Electric',
    unitNumber: '12',
    type: 'Source Four 19°',
    manufacturer: 'ETC',
    model: 'S4-19',
    purpose: 'DS Special',
    mark: 'A',
    channel: '145',
    universe: '1',
    dmxAddress: '234',
    address: '1/234',
    mode: 'Direct',
    dimmer: 'R23',
    circuit: 'C-145',
    circuitNumber: '145',
    phase: 'A',
    wattage: '750',
    color: 'R02',
    colorFrame: '7.5"',
    gobo: 'R77729',
    cable: 'Soco 50\'',
    dataCable: 'DMX 25\'',
    location: 'Stage Right',
    system: 'FOH',
    status: 'Hung',
    notes: 'Focus to DSC'
  };
}

/**
 * Get available data fields for label design
 */
export function getAvailableLabelFields(): Array<{
  key: keyof LabelData;
  label: string;
  category: string;
}> {
  return [
    // Position & Identification
    { key: 'position', label: 'Position', category: 'Identification' },
    { key: 'unitNumber', label: 'Unit #', category: 'Identification' },
    { key: 'type', label: 'Instrument Type', category: 'Identification' },
    { key: 'manufacturer', label: 'Manufacturer', category: 'Identification' },
    { key: 'model', label: 'Model', category: 'Identification' },
    { key: 'purpose', label: 'Purpose', category: 'Identification' },
    { key: 'mark', label: 'Mark', category: 'Identification' },

    // Control
    { key: 'channel', label: 'Channel', category: 'Control' },
    { key: 'universe', label: 'Universe', category: 'Control' },
    { key: 'dmxAddress', label: 'DMX Address', category: 'Control' },
    { key: 'address', label: 'Address (Universe/DMX)', category: 'Control' },
    { key: 'mode', label: 'Mode', category: 'Control' },
    { key: 'consoleLevel', label: 'Console Level', category: 'Control' },

    // Power
    { key: 'dimmer', label: 'Dimmer', category: 'Power' },
    { key: 'circuit', label: 'Circuit', category: 'Power' },
    { key: 'circuitNumber', label: 'Circuit #', category: 'Power' },
    { key: 'phase', label: 'Phase', category: 'Power' },
    { key: 'wattage', label: 'Wattage', category: 'Power' },
    { key: 'amperage', label: 'Amperage', category: 'Power' },

    // Color & Accessories
    { key: 'color', label: 'Color', category: 'Color & Accessories' },
    { key: 'colorFrame', label: 'Color Frame', category: 'Color & Accessories' },
    { key: 'gobo', label: 'Gobo', category: 'Color & Accessories' },
    { key: 'goboSize', label: 'Gobo Size', category: 'Color & Accessories' },
    { key: 'templateSize', label: 'Template Size', category: 'Color & Accessories' },
    { key: 'accessories', label: 'Accessories', category: 'Color & Accessories' },

    // Cables
    { key: 'cable', label: 'Cable', category: 'Cables' },
    { key: 'dataCable', label: 'Data Cable', category: 'Cables' },

    // Location & System
    { key: 'location', label: 'Location', category: 'Location' },
    { key: 'system', label: 'System', category: 'System' },
    { key: 'status', label: 'Status', category: 'System' },
    { key: 'notes', label: 'Notes', category: 'System' },

    // Custom
    { key: 'custom1', label: 'Custom 1', category: 'Custom' },
    { key: 'custom2', label: 'Custom 2', category: 'Custom' },
    { key: 'custom3', label: 'Custom 3', category: 'Custom' },
    { key: 'custom4', label: 'Custom 4', category: 'Custom' }
  ];
}
