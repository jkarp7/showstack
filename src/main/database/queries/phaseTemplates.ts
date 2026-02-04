import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Phase Distribution Template interface
 */
export interface PhaseDistributionTemplate {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  phase_config: 'single' | 'split' | 'three';
  circuit_count: number; // 12, 24, 48, or 96
  phase_distribution: string; // JSON string
  is_system: number; // SQLite boolean (0 or 1)
  created_at: number;
  updated_at: number;
}

/**
 * Get all phase templates for a project (including system templates)
 */
export function getAllPhaseTemplates(projectId: string = 'default-project'): PhaseDistributionTemplate[] {
  const db = getDatabase();

  const templates = db.prepare(`
    SELECT * FROM phase_distribution_templates
    WHERE project_id = ? OR is_system = 1
    ORDER BY is_system DESC, name ASC
  `).all(projectId);

  return templates as PhaseDistributionTemplate[];
}

/**
 * Get a specific phase template by ID
 */
export function getPhaseTemplateById(id: string): PhaseDistributionTemplate {
  const db = getDatabase();

  const template = db.prepare(`
    SELECT * FROM phase_distribution_templates
    WHERE id = ?
  `).get(id);

  if (!template) {
    throw new Error(`Phase template not found: ${id}`);
  }

  return template as PhaseDistributionTemplate;
}

/**
 * Create a new phase template
 */
export function createPhaseTemplate(
  template: Omit<PhaseDistributionTemplate, 'id' | 'created_at' | 'updated_at' | 'is_system'>,
  projectId: string = 'default-project'
): PhaseDistributionTemplate {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.prepare(`
    INSERT INTO phase_distribution_templates (
      id, project_id, name, description, phase_config, circuit_count,
      phase_distribution, is_system, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    id,
    projectId,
    template.name,
    template.description || null,
    template.phase_config,
    template.circuit_count,
    template.phase_distribution,
    now,
    now
  );

  saveDatabase();
  return getPhaseTemplateById(id);
}

/**
 * Update an existing phase template
 */
export function updatePhaseTemplate(id: string, updates: Partial<PhaseDistributionTemplate>): PhaseDistributionTemplate {
  const db = getDatabase();
  const now = Date.now();

  // Build dynamic UPDATE query
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    values.push(updates.description);
  }
  if (updates.phase_config !== undefined) {
    setClauses.push('phase_config = ?');
    values.push(updates.phase_config);
  }
  if (updates.circuit_count !== undefined) {
    setClauses.push('circuit_count = ?');
    values.push(updates.circuit_count);
  }
  if (updates.phase_distribution !== undefined) {
    setClauses.push('phase_distribution = ?');
    values.push(updates.phase_distribution);
  }

  if (setClauses.length === 0) {
    return getPhaseTemplateById(id);
  }

  setClauses.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(`
    UPDATE phase_distribution_templates
    SET ${setClauses.join(', ')}
    WHERE id = ? AND is_system = 0
  `).run(...values);

  saveDatabase();
  return getPhaseTemplateById(id);
}

/**
 * Delete a phase template (only user templates, not system templates)
 */
export function deletePhaseTemplate(id: string): void {
  const db = getDatabase();

  db.prepare('DELETE FROM phase_distribution_templates WHERE id = ? AND is_system = 0').run(id);

  saveDatabase();
}

/**
 * Seed system templates for a project
 */
export function seedSystemPhaseTemplates(projectId: string = 'default-project'): void {
  const db = getDatabase();

  // Check if system templates already exist for this project
  const existing = db.prepare(`
    SELECT COUNT(*) as count FROM phase_distribution_templates
    WHERE project_id = ? AND is_system = 1
  `).get(projectId);

  if (existing && (existing as any).count > 0) {
    console.log(`System phase templates already exist for project ${projectId}`);
    return;
  }

  console.log(`Seeding system phase templates for project ${projectId}`);
  const now = Date.now();

  // System templates (24 circuits by default, will be scaled when applied)
  const systemTemplates = [
    {
      name: 'AB Phasing (Alternating)',
      description: 'Alternates between Phase A and Phase B',
      phase_config: 'split',
      circuit_count: 24,
      phase_distribution: JSON.stringify({
        '1': 'A', '2': 'B', '3': 'A', '4': 'B',
        '5': 'A', '6': 'B', '7': 'A', '8': 'B',
        '9': 'A', '10': 'B', '11': 'A', '12': 'B',
        '13': 'A', '14': 'B', '15': 'A', '16': 'B',
        '17': 'A', '18': 'B', '19': 'A', '20': 'B',
        '21': 'A', '22': 'B', '23': 'A', '24': 'B'
      })
    },
    {
      name: 'AC Phasing (Alternating)',
      description: 'Alternates between Phase A and Phase C',
      phase_config: 'split',
      circuit_count: 24,
      phase_distribution: JSON.stringify({
        '1': 'A', '2': 'C', '3': 'A', '4': 'C',
        '5': 'A', '6': 'C', '7': 'A', '8': 'C',
        '9': 'A', '10': 'C', '11': 'A', '12': 'C',
        '13': 'A', '14': 'C', '15': 'A', '16': 'C',
        '17': 'A', '18': 'C', '19': 'A', '20': 'C',
        '21': 'A', '22': 'C', '23': 'A', '24': 'C'
      })
    },
    {
      name: 'BC Phasing (Alternating)',
      description: 'Alternates between Phase B and Phase C',
      phase_config: 'split',
      circuit_count: 24,
      phase_distribution: JSON.stringify({
        '1': 'B', '2': 'C', '3': 'B', '4': 'C',
        '5': 'B', '6': 'C', '7': 'B', '8': 'C',
        '9': 'B', '10': 'C', '11': 'B', '12': 'C',
        '13': 'B', '14': 'C', '15': 'B', '16': 'C',
        '17': 'B', '18': 'C', '19': 'B', '20': 'C',
        '21': 'B', '22': 'C', '23': 'B', '24': 'C'
      })
    },
    {
      name: 'Three Phase ABC (Sequential)',
      description: 'Rotates through Phase A, B, C in sequence',
      phase_config: 'three',
      circuit_count: 24,
      phase_distribution: JSON.stringify({
        '1': 'A', '2': 'B', '3': 'C', '4': 'A',
        '5': 'B', '6': 'C', '7': 'A', '8': 'B',
        '9': 'C', '10': 'A', '11': 'B', '12': 'C',
        '13': 'A', '14': 'B', '15': 'C', '16': 'A',
        '17': 'B', '18': 'C', '19': 'A', '20': 'B',
        '21': 'C', '22': 'A', '23': 'B', '24': 'C'
      })
    }
  ];

  systemTemplates.forEach(template => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO phase_distribution_templates (
        id, project_id, name, description, phase_config, circuit_count,
        phase_distribution, is_system, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      projectId,
      template.name,
      template.description,
      template.phase_config,
      template.circuit_count,
      template.phase_distribution,
      now,
      now
    );
  });

  saveDatabase();
  console.log(`Seeded ${systemTemplates.length} system phase templates for project ${projectId}`);
}
