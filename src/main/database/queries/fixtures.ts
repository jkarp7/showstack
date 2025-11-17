import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

// Extended Fixture interface matching database schema
export interface Fixture {
  id: string;
  project_id?: string;

  // Position & Identification
  position?: string;
  unit_number?: number;
  type?: string;
  manufacturer?: string;
  model?: string;
  purpose?: string;

  // Control
  channel?: string;
  universe?: number;
  dmx_address?: number;
  mode?: string;

  // Power
  dimmer?: string;
  circuit?: string;
  phase?: string;
  wattage?: number;
  amperage?: number;

  // Color & Accessories
  color?: string;
  gobo?: string;
  template_size?: string;
  accessories?: string[];

  // Location
  location?: string;
  position_x?: number;
  position_y?: number;
  position_z?: number;

  // Status
  status?: string;
  notes?: string;

  // Custom fields
  custom_fields?: Record<string, any>;

  // Metadata
  created_at?: number;
  updated_at?: number;

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

    return {
      ...fixture,
      unit: fixture.unit_number, // Compatibility alias
      accessories: fixture.accessories ? JSON.parse(fixture.accessories) : [],
      custom_fields: fixture.custom_fields ? JSON.parse(fixture.custom_fields) : {}
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

  db.run(`
    INSERT INTO fixtures (
      id, project_id, position, unit_number, type, purpose,
      channel, dimmer, circuit, color, location, wattage,
      status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    projectId,
    fixture.position || '',
    fixture.unit_number || fixture.unit || null,
    fixture.type || '',
    fixture.purpose || '',
    fixture.channel || '',
    fixture.dimmer || '',
    fixture.circuit || '',
    fixture.color || '',
    fixture.location || '',
    fixture.wattage || null,
    fixture.status || 'active',
    fixture.notes || '',
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
    'position', 'unit_number', 'type', 'purpose', 'channel', 'dimmer',
    'circuit', 'color', 'location', 'wattage', 'status', 'notes',
    'gobo', 'manufacturer', 'model', 'universe', 'dmx_address'
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

  return {
    ...fixture,
    unit: fixture.unit_number,
    accessories: fixture.accessories ? JSON.parse(fixture.accessories) : [],
    custom_fields: fixture.custom_fields ? JSON.parse(fixture.custom_fields) : {}
  };
}
