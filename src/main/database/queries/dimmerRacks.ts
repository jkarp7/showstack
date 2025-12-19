import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Dimmer Rack interface - represents a power distribution rack for dimmed loads
 */
export interface DimmerRack {
  id: string;
  project_id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  circuit_count: number; // 12, 24, 48, or 96
  module_type?: 'dimmer' | 'relay' | 'constant_current';
  channels_per_module?: number;
  watts_per_module?: number;
  location?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
}

/**
 * Get all dimmer racks for a project
 */
export function getAllDimmerRacks(projectId: string = 'default-project'): DimmerRack[] {
  const db = getDatabase();

  const result = db.exec(`
    SELECT * FROM dimmer_racks
    WHERE project_id = ?
    ORDER BY name
  `, [projectId]);

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map(row => {
    const rack: any = {};
    columns.forEach((col, idx) => {
      rack[col] = row[idx];
    });
    return rack as DimmerRack;
  });
}

/**
 * Get a specific dimmer rack by ID
 */
export function getDimmerRackById(id: string): DimmerRack {
  const db = getDatabase();

  const result = db.exec(`
    SELECT * FROM dimmer_racks
    WHERE id = ?
  `, [id]);

  if (!result[0] || result[0].values.length === 0) {
    throw new Error(`Dimmer rack not found: ${id}`);
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const rack: any = {};
  columns.forEach((col, idx) => {
    rack[col] = values[idx];
  });

  return rack as DimmerRack;
}

/**
 * Create a new dimmer rack
 */
export function createDimmerRack(
  rack: Omit<DimmerRack, 'id' | 'created_at' | 'updated_at'>,
  projectId: string = 'default-project'
): DimmerRack {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.run(`
    INSERT INTO dimmer_racks (
      id, project_id, name, rack_identifier, manufacturer, model, circuit_count,
      module_type, channels_per_module, watts_per_module, location, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    projectId,
    rack.name,
    (rack as any).rack_identifier || null,
    rack.manufacturer || null,
    rack.model || null,
    rack.circuit_count,
    rack.module_type || 'dimmer',
    rack.channels_per_module || 12,
    rack.watts_per_module || 2400,
    rack.location || null,
    rack.notes || null,
    now,
    now
  ]);

  saveDatabase();
  return getDimmerRackById(id);
}

/**
 * Update an existing dimmer rack
 */
export function updateDimmerRack(id: string, updates: Partial<DimmerRack>): DimmerRack {
  const db = getDatabase();
  const now = Date.now();

  // Build dynamic UPDATE query
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if ((updates as any).rack_identifier !== undefined) {
    setClauses.push('rack_identifier = ?');
    values.push((updates as any).rack_identifier);
  }
  if (updates.manufacturer !== undefined) {
    setClauses.push('manufacturer = ?');
    values.push(updates.manufacturer);
  }
  if (updates.model !== undefined) {
    setClauses.push('model = ?');
    values.push(updates.model);
  }
  if (updates.circuit_count !== undefined) {
    setClauses.push('circuit_count = ?');
    values.push(updates.circuit_count);
  }
  if (updates.module_type !== undefined) {
    setClauses.push('module_type = ?');
    values.push(updates.module_type);
  }
  if (updates.channels_per_module !== undefined) {
    setClauses.push('channels_per_module = ?');
    values.push(updates.channels_per_module);
  }
  if (updates.watts_per_module !== undefined) {
    setClauses.push('watts_per_module = ?');
    values.push(updates.watts_per_module);
  }
  if (updates.location !== undefined) {
    setClauses.push('location = ?');
    values.push(updates.location);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    values.push(updates.notes);
  }

  if (setClauses.length === 0) {
    return getDimmerRackById(id);
  }

  setClauses.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.run(`
    UPDATE dimmer_racks
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `, values);

  saveDatabase();
  return getDimmerRackById(id);
}

/**
 * Delete a dimmer rack
 */
export function deleteDimmerRack(id: string): void {
  const db = getDatabase();

  db.run('DELETE FROM dimmer_racks WHERE id = ?', [id]);

  saveDatabase();
}

/**
 * Get dimmer racks by project with usage statistics
 */
export function getDimmerRacksWithUsage(projectId: string = 'default-project'): (DimmerRack & { circuits_used: number })[] {
  const db = getDatabase();

  const result = db.exec(`
    SELECT
      dr.*,
      COUNT(DISTINCT f.dimmer_channel_number) as circuits_used
    FROM dimmer_racks dr
    LEFT JOIN fixtures f ON f.dimmer_rack_id = dr.id
    WHERE dr.project_id = ?
    GROUP BY dr.id
    ORDER BY dr.name
  `, [projectId]);

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map(row => {
    const rack: any = {};
    columns.forEach((col, idx) => {
      rack[col] = row[idx];
    });
    return rack as DimmerRack & { circuits_used: number };
  });
}
