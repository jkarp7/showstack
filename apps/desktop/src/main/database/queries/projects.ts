import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface Project {
  id: string;
  name: string;
  description?: string;
  venue?: string;
  designer?: string;
  logo_path?: string;
  enabled_modules?: string; // JSON string of array
  root_project_id?: string | null; // NULL = root; non-NULL = member of a family stack
  created_at: number;
  updated_at: number;
}

/**
 * Full database row shape for a project, including all columns in the SQLite
 * schema. The minimal `Project` interface above only carries the fields needed
 * by the UI; this type is used wherever the complete row must be written (e.g.
 * the PowerSync write-path in projectSync.ts).
 */
export interface ProjectRow extends Project {
  lighting_designer?: string | null;
  lighting_designer_email?: string | null;
  lighting_designer_phone?: string | null;
  lighting_associates?: unknown;
  audio_designer?: string | null;
  audio_designer_email?: string | null;
  audio_designer_phone?: string | null;
  audio_associates?: unknown;
  video_designer?: string | null;
  video_designer_email?: string | null;
  video_designer_phone?: string | null;
  video_associates?: unknown;
  electrician?: string | null;
  electrician_email?: string | null;
  electrician_phone?: string | null;
  audio_tech?: string | null;
  audio_tech_email?: string | null;
  audio_tech_phone?: string | null;
  video_tech?: string | null;
  video_tech_email?: string | null;
  video_tech_phone?: string | null;
  production_manager?: string | null;
  production_manager_email?: string | null;
  production_manager_phone?: string | null;
  production_manager_company?: string | null;
  general_manager?: string | null;
  general_manager_email?: string | null;
  general_manager_phone?: string | null;
  general_manager_company?: string | null;
  venue_city?: string | null;
  venue_state?: string | null;
  show_dates?: unknown;
  phase_label_a?: string | null;
  phase_label_b?: string | null;
  phase_label_c?: string | null;
}

export function getAllProjects(): Project[] {
  const db = getDatabase();

  const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();

  return projects.map((project: any) => {
    // Parse JSON fields
    const jsonFields = [
      'enabled_modules',
      'show_dates',
      'lighting_associates',
      'audio_associates',
      'video_associates',
    ];
    jsonFields.forEach((field) => {
      if (project[field] && typeof project[field] === 'string') {
        try {
          project[field] = JSON.parse(project[field]);
        } catch (error) {
          logger.warn(`Failed to parse JSON field '${field}' for project ${project.id}`, {
            error: error instanceof Error ? error.message : String(error),
            rawValue: String(project[field]).substring(0, 100),
          });
          // Keep original value
        }
      }
    });
    return project as Project;
  });
}

export function getProjectById(id: string): ProjectRow | null {
  const db = getDatabase();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

  if (!project) {
    return null;
  }

  // Parse JSON fields
  const jsonFields = [
    'enabled_modules',
    'show_dates',
    'lighting_associates',
    'audio_associates',
    'video_associates',
  ];
  jsonFields.forEach((field) => {
    if ((project as any)[field] && typeof (project as any)[field] === 'string') {
      try {
        (project as any)[field] = JSON.parse((project as any)[field]);
      } catch (error) {
        logger.warn(`Failed to parse JSON field '${field}' for project ${(project as any).id}`, {
          error: error instanceof Error ? error.message : String(error),
          rawValue: String((project as any)[field]).substring(0, 100),
        });
        // Keep original value
      }
    }
  });

  return project as unknown as ProjectRow;
}

/**
 * Format a Unix ms timestamp as "YYYY-MM-DD HH:mm" for copy naming.
 *
 * NOTE: Uses the local system time (via `new Date()`), NOT UTC.
 * The resulting string is locale-sensitive — the same timestamp will produce
 * different values on machines in different time zones. This is intentional:
 * copy names are user-facing labels, not sortable identifiers.
 */
export function formatCopyTimestamp(ms: number): string {
  const d = new Date(ms);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Create a copy of an existing project, linked to the same family stack.
 *
 * The copy gets a new UUID. root_project_id is set to:
 *   - the original's root_project_id (if it is already a child), OR
 *   - the original's own id (if it is a root)
 * This ensures all family members always point to the true root (flat tree).
 *
 * @param originalProjectId  ID of the project to copy
 * @param copyName           Optional name override; defaults to "Original Name — YYYY-MM-DD HH:mm"
 */
export function createProjectCopy(originalProjectId: string, copyName?: string): Project {
  const db = getDatabase();

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(originalProjectId) as any;
  if (!row) {
    throw new Error(`Project with id ${originalProjectId} not found`);
  }

  const now = Date.now();
  const newId = uuidv4();

  // Flat tree invariant: always point to the true root, never chain child->child
  const rootId = row.root_project_id || row.id;
  const newName = copyName || `${row.name} \u2014 ${formatCopyTimestamp(now)}`;

  // Build the new row from the original, overriding key fields
  const {
    id: _id,
    name: _name,
    root_project_id: _rpi,
    created_at: _ca,
    updated_at: _ua,
    ...rest
  } = row;

  const extraColumns = Object.keys(rest);
  const allColumns = ['id', 'name', 'root_project_id', 'created_at', 'updated_at', ...extraColumns];
  const colList = allColumns.map((c) => `"${c}"`).join(', ');
  const placeholders = allColumns.map(() => '?').join(', ');
  const values = [newId, newName, rootId, now, now, ...extraColumns.map((c) => rest[c])];

  db.prepare(`INSERT INTO projects (${colList}) VALUES (${placeholders})`).run(...values);

  saveDatabase();

  const created = getProjectById(newId);
  if (!created) {
    throw new Error('Failed to create project copy');
  }
  return created;
}
export function createProject(
  name: string,
  description?: string,
  logoPath?: string,
  enabledModules?: string[],
  rootProjectId?: string | null,
): Project {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    'INSERT INTO projects (id, name, description, logo_path, enabled_modules, root_project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    name,
    description || null,
    logoPath || null,
    enabledModules ? JSON.stringify(enabledModules) : null,
    rootProjectId || null,
    now,
    now,
  );

  saveDatabase();

  const project = getProjectById(id);
  if (!project) {
    throw new Error('Failed to create project');
  }

  return project;
}

/**
 * Allowed fields for project updates.
 * Frozen to prevent runtime modification (security hardening).
 */
const PROJECT_ALLOWED_FIELDS = Object.freeze([
  'name',
  'description',
  'venue',
  'venue_city',
  'venue_state',
  'designer',
  'logo_path',
  'enabled_modules',
  // Design team
  'lighting_designer',
  'lighting_designer_email',
  'lighting_designer_phone',
  'lighting_associates',
  'audio_designer',
  'audio_designer_email',
  'audio_designer_phone',
  'audio_associates',
  'video_designer',
  'video_designer_email',
  'video_designer_phone',
  'video_associates',
  // Production staff
  'electrician',
  'electrician_email',
  'electrician_phone',
  'audio_tech',
  'audio_tech_email',
  'audio_tech_phone',
  'video_tech',
  'video_tech_email',
  'video_tech_phone',
  'production_manager',
  'production_manager_email',
  'production_manager_phone',
  'production_manager_company',
  'general_manager',
  'general_manager_email',
  'general_manager_phone',
  'general_manager_company',
  // Show dates
  'show_dates',
  // Family / version stacking
  'root_project_id',
] as const);

type ProjectAllowedField = (typeof PROJECT_ALLOWED_FIELDS)[number];

function isProjectAllowedField(field: string): field is ProjectAllowedField {
  return PROJECT_ALLOWED_FIELDS.includes(field as ProjectAllowedField);
}

export function updateProject(id: string, updates: Partial<Project>): Project {
  const db = getDatabase();
  const now = Date.now();

  const fields = Object.keys(updates).filter(isProjectAllowedField);

  if (fields.length === 0) {
    const project = getProjectById(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    return project;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => {
    const value = updates[f as keyof Project];
    // Convert show_dates object to JSON string
    if (f === 'show_dates' && value && typeof value === 'object') {
      return JSON.stringify(value);
    }
    // Convert arrays to JSON string (enabled_modules and all associates arrays)
    if (
      (f === 'enabled_modules' ||
        f === 'lighting_associates' ||
        f === 'audio_associates' ||
        f === 'video_associates') &&
      Array.isArray(value)
    ) {
      return JSON.stringify(value);
    }
    return value;
  });

  db.prepare(`UPDATE projects SET ${setClause}, updated_at = ? WHERE id = ?`).run(
    ...values,
    now,
    id,
  );

  saveDatabase();

  const project = getProjectById(id);
  if (!project) {
    throw new Error(`Project with id ${id} not found`);
  }

  return project;
}

export function deleteProject(id: string): void {
  const db = getDatabase();
  // Wrap in a transaction so the child-nulling and the DELETE are atomic.
  // Without this, a crash between the two statements would leave children
  // with a dangling root_project_id pointing at a deleted project.
  const doDelete = db.transaction(() => {
    db.prepare('UPDATE projects SET root_project_id = NULL WHERE root_project_id = ?').run(id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  });
  doDelete();
  saveDatabase();
}

export function getCurrentProject(): Project {
  const db = getDatabase();

  // Get the most recently updated project
  const project = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC LIMIT 1').get();

  if (!project) {
    // If no projects exist, create a default one
    return createProject('Untitled Project');
  }

  // Parse JSON fields
  const jsonFields = [
    'enabled_modules',
    'show_dates',
    'lighting_associates',
    'audio_associates',
    'video_associates',
  ];
  jsonFields.forEach((field) => {
    if ((project as any)[field] && typeof (project as any)[field] === 'string') {
      try {
        (project as any)[field] = JSON.parse((project as any)[field]);
      } catch (error) {
        logger.warn(`Failed to parse JSON field '${field}' for project ${(project as any).id}`, {
          error: error instanceof Error ? error.message : String(error),
          rawValue: String((project as any)[field]).substring(0, 100),
        });
        // Keep original value
      }
    }
  });

  return project as Project;
}
