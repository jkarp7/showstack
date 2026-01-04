import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

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

/**
 * Port Linkage Helper Functions
 */

export interface PortLinkage {
  equipment_id: string;
  equipment_name: string;
  port: number;
  linked_to_type: 'fixture' | 'equipment' | 'text';
  linked_to_id?: string;
  linked_to_name?: string;
  linked_port?: number;
  connection_type?: string;
  status?: string;
}

/**
 * Get all port linkages for a specific equipment
 */
export function getPortLinkages(equipmentId: string, projectId: string): PortLinkage[] {
  const equipment = getInfrastructureById(equipmentId);
  const allEquipment = getAllInfrastructure(projectId);
  const db = getDatabase();

  if (!equipment.port_assignments || equipment.port_assignments.length === 0) {
    return [];
  }

  return equipment.port_assignments
    .filter(pa => pa.linked_fixture_id || pa.linked_equipment_id || pa.connected_to)
    .map(pa => {
      const linkage: PortLinkage = {
        equipment_id: equipment.id,
        equipment_name: equipment.name,
        port: pa.port,
        linked_to_type: pa.linked_fixture_id ? 'fixture' : pa.linked_equipment_id ? 'equipment' : 'text',
        linked_to_id: pa.linked_fixture_id || pa.linked_equipment_id,
        linked_port: pa.linked_port,
        connection_type: pa.type,
        status: pa.status
      };

      // Get linked equipment name if applicable
      if (pa.linked_equipment_id) {
        const linkedEquipment = allEquipment.find(e => e.id === pa.linked_equipment_id);
        linkage.linked_to_name = linkedEquipment?.name;
      }

      // Get linked fixture name if applicable
      if (pa.linked_fixture_id) {
        try {
          const result = db.exec('SELECT position FROM fixtures WHERE id = ?', [pa.linked_fixture_id]);
          if (result[0] && result[0].values.length > 0) {
            linkage.linked_to_name = result[0].values[0][0] as string;
          }
        } catch (error) {
          console.error('Error fetching fixture name:', error);
        }
      }

      // Use legacy text if no structured link
      if (!pa.linked_fixture_id && !pa.linked_equipment_id && pa.connected_to) {
        linkage.linked_to_name = pa.connected_to;
      }

      return linkage;
    });
}

/**
 * Find all infrastructure equipment connected to a specific fixture
 */
export function getFixtureConnections(fixtureId: string, projectId: string): InfrastructureEquipment[] {
  const allEquipment = getAllInfrastructure(projectId);

  return allEquipment.filter(equipment => {
    if (!equipment.port_assignments) return false;

    return equipment.port_assignments.some(pa => pa.linked_fixture_id === fixtureId);
  });
}

/**
 * Find all equipment connected to a specific equipment
 */
export function getEquipmentConnections(equipmentId: string, projectId: string): InfrastructureEquipment[] {
  const allEquipment = getAllInfrastructure(projectId);

  return allEquipment.filter(equipment => {
    if (!equipment.port_assignments) return false;

    return equipment.port_assignments.some(pa => pa.linked_equipment_id === equipmentId);
  });
}

/**
 * Validate port assignment to prevent circular links
 */
export function validatePortAssignment(
  equipmentId: string,
  portAssignment: PortAssignment,
  projectId: string
): { valid: boolean; error?: string } {
  // Can't link to itself
  if (portAssignment.linked_equipment_id === equipmentId) {
    return { valid: false, error: 'Cannot link equipment to itself' };
  }

  // Can't have both fixture and equipment link
  if (portAssignment.linked_fixture_id && portAssignment.linked_equipment_id) {
    return { valid: false, error: 'Port can only link to fixture OR equipment, not both' };
  }

  // Check for circular equipment links
  if (portAssignment.linked_equipment_id) {
    const visited = new Set<string>([equipmentId]);
    let currentId = portAssignment.linked_equipment_id;

    while (currentId) {
      if (visited.has(currentId)) {
        return { valid: false, error: 'Circular equipment link detected' };
      }

      visited.add(currentId);

      try {
        const equipment = getInfrastructureById(currentId);
        const nextLink = equipment.port_assignments?.find(pa => pa.linked_equipment_id);
        currentId = nextLink?.linked_equipment_id || '';
      } catch {
        break;
      }
    }
  }

  return { valid: true };
}

/**
 * Port Usage Statistics
 */

export interface PortUsageStats {
  total_ports: number;
  used_ports: number;
  available_ports: number;
  usage_percentage: number;
  by_status: {
    active: number;
    inactive: number;
    error: number;
    unassigned: number;
  };
}

/**
 * Calculate port usage statistics for a specific equipment
 */
export function getPortUsageStats(equipmentId: string): PortUsageStats {
  const equipment = getInfrastructureById(equipmentId);

  const stats: PortUsageStats = {
    total_ports: equipment.port_count || 0,
    used_ports: 0,
    available_ports: 0,
    usage_percentage: 0,
    by_status: {
      active: 0,
      inactive: 0,
      error: 0,
      unassigned: 0
    }
  };

  if (!equipment.port_assignments || equipment.port_assignments.length === 0) {
    stats.available_ports = stats.total_ports;
    stats.by_status.unassigned = stats.total_ports;
    return stats;
  }

  equipment.port_assignments.forEach(pa => {
    // Count as "used" if it has any link or connection
    const isUsed = pa.linked_fixture_id || pa.linked_equipment_id || (pa.connected_to && pa.connected_to.trim() !== '');

    if (isUsed) {
      stats.used_ports++;

      // Count by status
      if (pa.status === 'active') {
        stats.by_status.active++;
      } else if (pa.status === 'inactive') {
        stats.by_status.inactive++;
      } else if (pa.status === 'error') {
        stats.by_status.error++;
      }
    } else {
      stats.by_status.unassigned++;
    }
  });

  stats.available_ports = stats.total_ports - stats.used_ports;
  stats.usage_percentage = stats.total_ports > 0
    ? Math.round((stats.used_ports / stats.total_ports) * 100)
    : 0;

  return stats;
}

/**
 * Get port usage statistics for all equipment in a project
 */
export function getAllPortUsageStats(projectId: string): Record<string, PortUsageStats> {
  const allEquipment = getAllInfrastructure(projectId);
  const stats: Record<string, PortUsageStats> = {};

  allEquipment.forEach(equipment => {
    if (equipment.port_count && equipment.port_count > 0) {
      stats[equipment.id] = getPortUsageStats(equipment.id);
    }
  });

  return stats;
}

/**
 * CSV Import/Export Functions
 */

export interface CSVFieldMapping {
  csv_column: string;
  infrastructure_field: keyof InfrastructureEquipment | null;
}

/**
 * Convert infrastructure equipment to CSV format
 */
export function exportInfrastructureToCSV(
  projectId: string,
  includePortAssignments: boolean = false
): string {
  const equipment = getAllInfrastructure(projectId);

  // CSV Headers
  const headers = [
    'Name', 'Manufacturer', 'Model', 'Category', 'Quantity',
    'IP Address', 'MAC Address', 'Hostname', 'VLAN',
    'Port Count', 'Location', 'Voltage', 'Amperage', 'Wattage',
    'Dimmer Rack', 'Dimmer Channel', 'PD Rack', 'PD Circuit',
    'Status', 'Notes'
  ];

  const rows: string[][] = [headers];

  equipment.forEach(eq => {
    const row = [
      escapeCsvValue(eq.name),
      escapeCsvValue(eq.manufacturer || ''),
      escapeCsvValue(eq.model || ''),
      escapeCsvValue(eq.category || ''),
      eq.quantity.toString(),
      escapeCsvValue(eq.ip_address || ''),
      escapeCsvValue(eq.mac_address || ''),
      escapeCsvValue(eq.hostname || ''),
      eq.vlan_id ? eq.vlan_id.toString() : '',
      eq.port_count ? eq.port_count.toString() : '',
      escapeCsvValue(eq.location || ''),
      eq.voltage ? eq.voltage.toString() : '',
      eq.amperage ? eq.amperage.toString() : '',
      eq.wattage ? eq.wattage.toString() : '',
      escapeCsvValue(eq.dimmer_rack_id || ''),
      eq.dimmer_channel_number ? eq.dimmer_channel_number.toString() : '',
      escapeCsvValue(eq.pd_rack_id || ''),
      eq.pd_circuit_number ? eq.pd_circuit_number.toString() : '',
      escapeCsvValue(eq.status),
      escapeCsvValue(eq.notes || '')
    ];

    rows.push(row);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Import infrastructure from CSV with field mapping
 */
export function importInfrastructureFromCSV(
  projectId: string,
  csvContent: string,
  fieldMapping: CSVFieldMapping[]
): { success: boolean; imported: number; errors: string[] } {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');

  if (lines.length < 2) {
    return { success: false, imported: 0, errors: ['CSV file is empty or has no data rows'] };
  }

  const headers = parseCsvLine(lines[0]);
  const errors: string[] = [];
  let imported = 0;

  // Create mapping index for quick lookup
  const mappingIndex = new Map<string, keyof InfrastructureEquipment>();
  fieldMapping.forEach(mapping => {
    if (mapping.infrastructure_field) {
      mappingIndex.set(mapping.csv_column, mapping.infrastructure_field);
    }
  });

  // Process data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCsvLine(lines[i]);
      const equipmentData: Partial<InfrastructureEquipment> = {
        status: 'Active'
      };

      // Map CSV columns to infrastructure fields
      headers.forEach((header, idx) => {
        const field = mappingIndex.get(header);
        if (field && values[idx] !== undefined && values[idx] !== '') {
          const value = values[idx];

          // Type conversion based on field
          if (field === 'quantity' || field === 'vlan_id' || field === 'port_count' ||
              field === 'voltage' || field === 'amperage' || field === 'wattage' ||
              field === 'dimmer_channel_number' || field === 'pd_circuit_number') {
            (equipmentData as any)[field] = parseFloat(value);
          } else {
            (equipmentData as any)[field] = value;
          }
        }
      });

      // Validate required fields
      if (!equipmentData.name) {
        errors.push(`Row ${i + 1}: Missing required field "name"`);
        continue;
      }

      // Create equipment
      createInfrastructure(equipmentData, projectId);
      imported++;
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    imported,
    errors
  };
}

/**
 * Helper: Escape CSV value
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Helper: Parse CSV line (handles quoted values)
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
