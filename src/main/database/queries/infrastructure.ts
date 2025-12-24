import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

export interface PortAssignment {
  port: number;
  connected_to?: string;
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
  category?: string; // 'network', 'data_distribution', 'audio', 'video'

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

export function getAllInfrastructure(projectId: string): InfrastructureEquipment[] {
  const db = getDatabase();

  const result = db.exec(`
    SELECT * FROM infrastructure_equipment
    WHERE project_id = ?
    ORDER BY category, name
  `, [projectId]);

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map(row => {
    const equipment: any = {};
    columns.forEach((col, idx) => {
      equipment[col] = row[idx];
    });

    // Parse JSON fields
    if (equipment.port_assignments) {
      try {
        equipment.port_assignments = JSON.parse(equipment.port_assignments);
      } catch {
        equipment.port_assignments = [];
      }
    } else {
      equipment.port_assignments = [];
    }

    return equipment as InfrastructureEquipment;
  });
}

export function createInfrastructure(
  equipment: Partial<InfrastructureEquipment>,
  projectId: string
): InfrastructureEquipment {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  // Serialize JSON fields
  const portAssignments = equipment.port_assignments
    ? JSON.stringify(equipment.port_assignments)
    : null;

  db.run(`
    INSERT INTO infrastructure_equipment (
      id, project_id, name, manufacturer, model, quantity, category,
      ip_address, mac_address, subnet_mask, gateway, vlan_id, hostname,
      port_assignments, port_count, voltage, amperage, wattage, phase,
      dimmer_rack_id, dimmer_channel_number, pd_rack_id, pd_circuit_number, pd_breaker_number,
      circuit, circuit_number, location, position_x, position_y, position_z,
      notes, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    projectId,
    equipment.name || '',
    equipment.manufacturer || null,
    equipment.model || null,
    equipment.quantity || 1,
    equipment.category || null,
    equipment.ip_address || null,
    equipment.mac_address || null,
    equipment.subnet_mask || null,
    equipment.gateway || null,
    equipment.vlan_id || null,
    equipment.hostname || null,
    portAssignments,
    equipment.port_count || null,
    equipment.voltage || null,
    equipment.amperage || null,
    equipment.wattage || null,
    equipment.phase || null,
    equipment.dimmer_rack_id || null,
    equipment.dimmer_channel_number || null,
    equipment.pd_rack_id || null,
    equipment.pd_circuit_number || null,
    equipment.pd_breaker_number || null,
    equipment.circuit || null,
    equipment.circuit_number || null,
    equipment.location || null,
    equipment.position_x || null,
    equipment.position_y || null,
    equipment.position_z || null,
    equipment.notes || null,
    equipment.status || 'Active',
    now,
    now
  ]);

  saveDatabase();
  return getInfrastructureById(id);
}

export function updateInfrastructure(
  id: string,
  updates: Partial<InfrastructureEquipment>
): InfrastructureEquipment {
  const db = getDatabase();
  const now = Date.now();

  // Filter out fields that shouldn't be updated
  const allowedFields = [
    'name', 'manufacturer', 'model', 'quantity', 'category',
    'ip_address', 'mac_address', 'subnet_mask', 'gateway', 'vlan_id', 'hostname',
    'port_assignments', 'port_count', 'voltage', 'amperage', 'wattage', 'phase',
    'dimmer_rack_id', 'dimmer_channel_number', 'pd_rack_id', 'pd_circuit_number', 'pd_breaker_number',
    'circuit', 'circuit_number', 'location', 'position_x', 'position_y', 'position_z',
    'notes', 'status'
  ];

  const fields = Object.keys(updates).filter(k => allowedFields.includes(k));

  if (fields.length === 0) {
    return getInfrastructureById(id);
  }

  // Serialize arrays and objects for database storage
  const mappedUpdates = { ...updates };
  if ('port_assignments' in mappedUpdates && Array.isArray(mappedUpdates.port_assignments)) {
    mappedUpdates.port_assignments = JSON.stringify(mappedUpdates.port_assignments) as any;
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  // Convert undefined to null for SQL.js compatibility
  const values = fields.map(f => mappedUpdates[f] === undefined ? null : mappedUpdates[f]);

  db.run(`
    UPDATE infrastructure_equipment
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `, [...values, now, id]);

  saveDatabase();
  return getInfrastructureById(id);
}

export function deleteInfrastructure(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM infrastructure_equipment WHERE id = ?', [id]);
  saveDatabase();
}

export function deleteMultipleInfrastructure(ids: string[]): void {
  const db = getDatabase();
  if (ids.length === 0) return;

  const placeholders = ids.map(() => '?').join(',');
  db.run(`DELETE FROM infrastructure_equipment WHERE id IN (${placeholders})`, ids);
  saveDatabase();
}

function getInfrastructureById(id: string): InfrastructureEquipment {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM infrastructure_equipment WHERE id = ?', [id]);

  if (!result[0] || result[0].values.length === 0) {
    throw new Error(`Infrastructure equipment with id ${id} not found`);
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const equipment: any = {};
  columns.forEach((col, idx) => {
    equipment[col] = values[idx];
  });

  // Parse JSON fields
  if (equipment.port_assignments) {
    try {
      equipment.port_assignments = JSON.parse(equipment.port_assignments);
    } catch {
      equipment.port_assignments = [];
    }
  } else {
    equipment.port_assignments = [];
  }

  return equipment as InfrastructureEquipment;
}
