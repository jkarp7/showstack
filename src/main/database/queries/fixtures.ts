import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

// Extended Fixture interface matching database schema with LightWright parity
export interface Fixture {
  id: string;
  project_id?: string;

  // Position & Identification (LightWright: Position, Unit #, Instrument Type, Mark)
  position?: string;
  unit_number?: number;
  type?: string;
  manufacturer?: string;
  model?: string;
  purpose?: string;
  mark?: string;

  // Control (LightWright: Address, Channel, Universe, DMX #, Console Level)
  channel?: string;
  universe?: number;
  dmx_address?: number;
  mode?: string;
  console_level?: string;

  // Power (LightWright: Dimmer, Circuit Name, Circuit #, Load, Dimmer Phase)
  dimmer?: string;
  circuit?: string;        // Circuit name
  circuit_number?: string; // Circuit #
  phase?: string;
  wattage?: number;        // Load
  amperage?: number;

  // Color & Accessories (LightWright: Color, Gobo, Gobo Size, Accessory, Color Frame)
  color?: string;
  color_frame?: string;
  gobo?: string;
  gobo_size?: string;
  template_size?: string;
  accessories?: string[];

  // Cables (LightWright: Cable, Data Cable)
  cable?: string;
  data_cable?: string;

  // Location (LightWright: Position, Location)
  location?: string;
  position_x?: number;
  position_y?: number;
  position_z?: number;

  // Focus (LightWright: Focus L/R, U/D, Note, Cut submenu, Status)
  focus_lr?: string;
  focus_ud?: string;
  focus_note?: string;
  focus_cut_us?: string;
  focus_cut_ds?: string;
  focus_cut_sr?: string;
  focus_cut_sl?: string;
  focus_cut_top?: string;
  focus_cut_bottom?: string;
  focus_status?: string;

  // System & Scenery (LightWright: System, Scenery)
  system?: string;
  scenery?: string;

  // Vectorworks Integration (LightWright: Vectorworks submenu)
  vw_layer?: string;
  vw_label_legend?: string;
  vw_class?: string;
  vw_x_coordinate?: number;
  vw_y_coordinate?: number;
  vw_z_coordinate?: number;
  vw_symbol_rotation?: number;
  vw_focus_point?: string;
  on_light_plot?: boolean;
  vw_uid?: string;
  vw_symbol?: string;

  // ShowStack ID (LightWright: Lightwright ID)
  showstack_id?: string;

  // Status & Notes
  status?: string;
  notes?: string;
  work_note_status?: string;

  // Custom fields (JSON) - LightWright: User Columns (24)
  custom_fields?: Record<string, any>;

  // Audit Trail (LightWright: When, What, and Who Changed)
  changed_at?: number;
  changed_what?: string;
  changed_who?: string;

  // Metadata
  created_at?: number;
  updated_at?: number;

  // Computed/Virtual fields (not in database)
  address?: string; // Computed from universe/dmx_address as "universe/dmx_address"

  // Legacy POC compatibility
  unit?: number; // alias for unit_number
}

export function getAllFixtures(projectId: string = 'default-project'): Fixture[] {
  const db = getDatabase();

  const result = db.exec(`
    SELECT * FROM fixtures
    WHERE project_id = ?
    ORDER BY CAST(position AS INTEGER), position
  `, [projectId]);

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map(row => {
    const fixture: any = {};
    columns.forEach((col, idx) => {
      fixture[col] = row[idx];
    });

    // Compute address from universe and dmx_address
    let address: string | undefined;
    if (fixture.universe && fixture.dmx_address) {
      address = `${fixture.universe}/${fixture.dmx_address}`;
    }

    return {
      ...fixture,
      unit: fixture.unit_number, // Compatibility alias
      address, // Computed field
      accessories: fixture.accessories ? JSON.parse(fixture.accessories) : [],
      custom_fields: fixture.custom_fields ? JSON.parse(fixture.custom_fields) : {},
      on_light_plot: Boolean(fixture.on_light_plot) // Convert to boolean
    } as Fixture;
  });
}

export function createFixture(
  fixture: Partial<Fixture>,
  projectId: string = 'default-project'
): Fixture {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  // Serialize arrays and objects
  const accessories = fixture.accessories ? JSON.stringify(fixture.accessories) : null;
  const customFields = fixture.custom_fields ? JSON.stringify(fixture.custom_fields) : null;

  db.run(`
    INSERT INTO fixtures (
      id, project_id, position, unit_number, type, manufacturer, model, purpose,
      channel, universe, dmx_address, dimmer, circuit, circuit_number,
      color, gobo, accessories, location, system, wattage,
      status, notes, custom_fields, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    projectId,
    fixture.position || '',
    fixture.unit_number || fixture.unit || null,
    fixture.type || '',
    fixture.manufacturer || null,
    fixture.model || null,
    fixture.purpose || '',
    fixture.channel || '',
    fixture.universe || null,
    fixture.dmx_address || null,
    fixture.dimmer || '',
    fixture.circuit || '',
    fixture.circuit_number || null,
    fixture.color || '',
    fixture.gobo || '',
    accessories,
    fixture.location || '',
    fixture.system || null,
    fixture.wattage || null,
    fixture.status || 'active',
    fixture.notes || '',
    customFields,
    now,
    now
  ]);

  saveDatabase();
  return getFixtureById(id);
}

export function updateFixture(id: string, updates: Partial<Fixture>): Fixture {
  const db = getDatabase();
  const now = Date.now();

  // Filter out fields that shouldn't be updated
  const allowedFields = [
    'position', 'unit_number', 'type', 'manufacturer', 'model', 'purpose',
    'channel', 'universe', 'dmx_address', 'dimmer', 'circuit', 'circuit_number',
    'color', 'gobo', 'accessories', 'location', 'system', 'wattage',
    'status', 'notes', 'custom_fields',
    'dimmer_rack_id', 'dimmer_channel_number', 'pd_rack_id', 'pd_circuit_number'
  ];

  const fields = Object.keys(updates).filter(k =>
    allowedFields.includes(k) || k === 'unit'
  );

  if (fields.length === 0) {
    return getFixtureById(id);
  }

  // Map 'unit' to 'unit_number' for compatibility
  const mappedUpdates = { ...updates };
  if ('unit' in mappedUpdates) {
    mappedUpdates.unit_number = mappedUpdates.unit;
    delete mappedUpdates.unit;
  }

  // Serialize arrays and objects for database storage
  if ('accessories' in mappedUpdates && Array.isArray(mappedUpdates.accessories)) {
    mappedUpdates.accessories = JSON.stringify(mappedUpdates.accessories) as any;
  }
  if ('custom_fields' in mappedUpdates && typeof mappedUpdates.custom_fields === 'object') {
    mappedUpdates.custom_fields = JSON.stringify(mappedUpdates.custom_fields) as any;
  }

  const setClause = fields
    .filter(f => f !== 'unit')
    .map(f => f === 'unit_number' ? 'unit_number = ?' : `${f} = ?`)
    .join(', ');

  const values = fields
    .filter(f => f !== 'unit')
    .map(f => f === 'unit_number' ? mappedUpdates.unit_number : mappedUpdates[f]);

  db.run(`
    UPDATE fixtures
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `, [...values, now, id]);

  saveDatabase();
  return getFixtureById(id);
}

export function deleteFixture(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM fixtures WHERE id = ?', [id]);
  saveDatabase();
}

export function deleteMultipleFixtures(ids: string[]): void {
  const db = getDatabase();
  if (ids.length === 0) return;

  const placeholders = ids.map(() => '?').join(',');
  db.run(`DELETE FROM fixtures WHERE id IN (${placeholders})`, ids);
  saveDatabase();
}

function getFixtureById(id: string): Fixture {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM fixtures WHERE id = ?', [id]);

  if (!result[0] || result[0].values.length === 0) {
    throw new Error(`Fixture with id ${id} not found`);
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const fixture: any = {};
  columns.forEach((col, idx) => {
    fixture[col] = values[idx];
  });

  // Compute address from universe and dmx_address
  let address: string | undefined;
  if (fixture.universe && fixture.dmx_address) {
    address = `${fixture.universe}/${fixture.dmx_address}`;
  }

  return {
    ...fixture,
    unit: fixture.unit_number,
    address, // Computed field
    accessories: fixture.accessories ? JSON.parse(fixture.accessories) : [],
    custom_fields: fixture.custom_fields ? JSON.parse(fixture.custom_fields) : {},
    on_light_plot: Boolean(fixture.on_light_plot) // Convert to boolean
  };
}
