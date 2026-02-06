import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Dimmer Rack Module interface
 */
export interface DimmerRackModule {
  id: string;
  rack_id: string;
  start_circuit: number;
  end_circuit: number;
  module_type: 'dimmer' | 'relay' | 'constant_current' | 'thrupower';
  watts_per_circuit?: number;
  notes?: string;
  created_at: number;
  updated_at: number;
}

/**
 * Get all modules for a dimmer rack
 */
export function getModulesByRackId(rackId: string): DimmerRackModule[] {
  const db = getDatabase();

  const modules = db
    .prepare(
      `
    SELECT * FROM dimmer_rack_modules
    WHERE rack_id = ?
    ORDER BY start_circuit
  `,
    )
    .all(rackId);

  return modules as DimmerRackModule[];
}

/**
 * Create a new dimmer rack module
 */
export function createModule(
  module: Omit<DimmerRackModule, 'id' | 'created_at' | 'updated_at'>,
): DimmerRackModule {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    `
    INSERT INTO dimmer_rack_modules (
      id, rack_id, start_circuit, end_circuit, module_type,
      watts_per_circuit, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    module.rack_id,
    module.start_circuit,
    module.end_circuit,
    module.module_type,
    module.watts_per_circuit || 2400,
    module.notes || null,
    now,
    now,
  );

  saveDatabase();
  return getModuleById(id);
}

/**
 * Get a specific module by ID
 */
export function getModuleById(id: string): DimmerRackModule {
  const db = getDatabase();

  const module = db
    .prepare(
      `
    SELECT * FROM dimmer_rack_modules
    WHERE id = ?
  `,
    )
    .get(id);

  if (!module) {
    throw new Error(`Dimmer rack module not found: ${id}`);
  }

  return module as DimmerRackModule;
}

/**
 * Update an existing module
 */
export function updateModule(id: string, updates: Partial<DimmerRackModule>): DimmerRackModule {
  const db = getDatabase();
  const now = Date.now();

  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.start_circuit !== undefined) {
    setClauses.push('start_circuit = ?');
    values.push(updates.start_circuit);
  }
  if (updates.end_circuit !== undefined) {
    setClauses.push('end_circuit = ?');
    values.push(updates.end_circuit);
  }
  if (updates.module_type !== undefined) {
    setClauses.push('module_type = ?');
    values.push(updates.module_type);
  }
  if (updates.watts_per_circuit !== undefined) {
    setClauses.push('watts_per_circuit = ?');
    values.push(updates.watts_per_circuit);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    values.push(updates.notes);
  }

  if (setClauses.length === 0) {
    return getModuleById(id);
  }

  setClauses.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(
    `
    UPDATE dimmer_rack_modules
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `,
  ).run(...values);

  saveDatabase();
  return getModuleById(id);
}

/**
 * Delete a module
 */
export function deleteModule(id: string): void {
  const db = getDatabase();

  db.prepare('DELETE FROM dimmer_rack_modules WHERE id = ?').run(id);

  saveDatabase();
}

/**
 * Delete all modules for a rack
 */
export function deleteModulesByRackId(rackId: string): void {
  const db = getDatabase();

  db.prepare('DELETE FROM dimmer_rack_modules WHERE rack_id = ?').run(rackId);

  saveDatabase();
}

/**
 * Get module type for a specific circuit in a rack
 */
export function getModuleTypeForCircuit(rackId: string, circuit: number): DimmerRackModule | null {
  const db = getDatabase();

  const module = db
    .prepare(
      `
    SELECT * FROM dimmer_rack_modules
    WHERE rack_id = ?
      AND start_circuit <= ?
      AND end_circuit >= ?
    LIMIT 1
  `,
    )
    .get(rackId, circuit, circuit);

  if (!module) {
    return null;
  }

  return module as DimmerRackModule;
}
