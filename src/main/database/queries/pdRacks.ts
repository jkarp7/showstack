import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * PD (Power Distribution) Rack interface - represents a power distribution rack for direct power
 */
export interface PDRack {
  id: string;
  project_id: string;
  name: string;
  rack_identifier?: string; // Identifier for circuit naming (e.g., "Z", "FOH", "DECK")
  voltage: number; // 120, 208, 230, or 240
  is_dual_voltage?: boolean; // Rack has both 120V and 208V outputs (separate circuits)
  secondary_voltage?: number; // Secondary voltage if dual voltage
  circuit_count: number; // 12, 24, 48, or 96
  phase_config?: 'single' | 'split' | 'three';
  amps_per_breaker?: number;
  location?: string;
  notes?: string;
  building_service?: string; // Building electrical service (Service A, B, C, etc.)
  created_at: number;
  updated_at: number;
}

/**
 * Get all PD racks for a project
 */
export function getAllPDRacks(projectId: string = 'default-project'): PDRack[] {
  const db = getDatabase();

  const result = db.exec(`
    SELECT * FROM pd_racks
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
    return rack as PDRack;
  });
}

/**
 * Get a specific PD rack by ID
 */
export function getPDRackById(id: string): PDRack {
  const db = getDatabase();

  const result = db.exec(`
    SELECT * FROM pd_racks
    WHERE id = ?
  `, [id]);

  if (!result[0] || result[0].values.length === 0) {
    throw new Error(`PD rack not found: ${id}`);
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const rack: any = {};
  columns.forEach((col, idx) => {
    rack[col] = values[idx];
  });

  return rack as PDRack;
}

/**
 * Create a new PD rack
 */
export function createPDRack(
  rack: Omit<PDRack, 'id' | 'created_at' | 'updated_at'>,
  projectId: string = 'default-project'
): PDRack {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.run(`
    INSERT INTO pd_racks (
      id, project_id, name, rack_identifier, voltage, is_dual_voltage, secondary_voltage,
      circuit_count, phase_config, amps_per_breaker, location, notes,
      building_service, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    projectId,
    rack.name,
    (rack as any).rack_identifier || null,
    rack.voltage,
    (rack as any).is_dual_voltage ? 1 : 0,
    (rack as any).secondary_voltage || null,
    rack.circuit_count,
    rack.phase_config || null,
    rack.amps_per_breaker || 20,
    rack.location || null,
    rack.notes || null,
    (rack as any).building_service || null,
    now,
    now
  ]);

  saveDatabase();
  return getPDRackById(id);
}

/**
 * Update an existing PD rack
 */
export function updatePDRack(id: string, updates: Partial<PDRack>): PDRack {
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
  if (updates.voltage !== undefined) {
    setClauses.push('voltage = ?');
    values.push(updates.voltage);
  }
  if ((updates as any).is_dual_voltage !== undefined) {
    setClauses.push('is_dual_voltage = ?');
    values.push((updates as any).is_dual_voltage ? 1 : 0);
  }
  if ((updates as any).secondary_voltage !== undefined) {
    setClauses.push('secondary_voltage = ?');
    values.push((updates as any).secondary_voltage);
  }
  if (updates.circuit_count !== undefined) {
    setClauses.push('circuit_count = ?');
    values.push(updates.circuit_count);
  }
  if (updates.phase_config !== undefined) {
    setClauses.push('phase_config = ?');
    values.push(updates.phase_config);
  }
  if (updates.amps_per_breaker !== undefined) {
    setClauses.push('amps_per_breaker = ?');
    values.push(updates.amps_per_breaker);
  }
  if (updates.location !== undefined) {
    setClauses.push('location = ?');
    values.push(updates.location);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    values.push(updates.notes);
  }
  if ((updates as any).building_service !== undefined) {
    setClauses.push('building_service = ?');
    values.push((updates as any).building_service);
  }

  if (setClauses.length === 0) {
    return getPDRackById(id);
  }

  setClauses.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.run(`
    UPDATE pd_racks
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `, values);

  saveDatabase();
  return getPDRackById(id);
}

/**
 * Delete a PD rack
 */
export function deletePDRack(id: string): void {
  const db = getDatabase();

  db.run('DELETE FROM pd_racks WHERE id = ?', [id]);

  saveDatabase();
}

/**
 * Get PD racks by project with usage statistics
 */
export function getPDRacksWithUsage(projectId: string = 'default-project'): (PDRack & { circuits_used: number })[] {
  const db = getDatabase();

  const result = db.exec(`
    SELECT
      pr.*,
      COUNT(DISTINCT f.pd_circuit_number) as circuits_used
    FROM pd_racks pr
    LEFT JOIN fixtures f ON f.pd_rack_id = pr.id
    WHERE pr.project_id = ?
    GROUP BY pr.id
    ORDER BY pr.name
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
    return rack as PDRack & { circuits_used: number };
  });
}
