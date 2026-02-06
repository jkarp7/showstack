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
  created_at: number;
  updated_at: number;
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

export function getProjectById(id: string): Project | null {
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

  return project as Project;
}

export function createProject(
  name: string,
  description?: string,
  logoPath?: string,
  enabledModules?: string[],
): Project {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    'INSERT INTO projects (id, name, description, logo_path, enabled_modules, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    name,
    description || null,
    logoPath || null,
    enabledModules ? JSON.stringify(enabledModules) : null,
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
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
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
