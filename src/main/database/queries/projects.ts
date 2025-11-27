import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

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

  const result = db.exec('SELECT * FROM projects ORDER BY updated_at DESC');

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map(row => {
    const project: any = {};
    columns.forEach((col, idx) => {
      const value = row[idx];
      // Parse JSON fields
      if ((col === 'enabled_modules' || col === 'show_dates' ||
           col === 'lighting_associates' || col === 'audio_associates' ||
           col === 'video_associates') && value && typeof value === 'string') {
        try {
          project[col] = JSON.parse(value);
        } catch {
          project[col] = value;
        }
      } else {
        project[col] = value;
      }
    });
    return project as Project;
  });
}

export function getProjectById(id: string): Project | null {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM projects WHERE id = ?', [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const project: any = {};
  columns.forEach((col, idx) => {
    const value = values[idx];
    // Parse JSON fields
    if ((col === 'enabled_modules' || col === 'show_dates' ||
         col === 'lighting_associates' || col === 'audio_associates' ||
         col === 'video_associates') && value && typeof value === 'string') {
      try {
        project[col] = JSON.parse(value);
      } catch {
        project[col] = value;
      }
    } else {
      project[col] = value;
    }
  });

  return project as Project;
}

export function createProject(
  name: string,
  description?: string,
  logoPath?: string,
  enabledModules?: string[]
): Project {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.run(
    'INSERT INTO projects (id, name, description, logo_path, enabled_modules, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      name,
      description || null,
      logoPath || null,
      enabledModules ? JSON.stringify(enabledModules) : null,
      now,
      now
    ]
  );

  saveDatabase();

  const project = getProjectById(id);
  if (!project) {
    throw new Error('Failed to create project');
  }

  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project {
  const db = getDatabase();
  const now = Date.now();

  const allowedFields = [
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
    'show_dates'
  ];

  const fields = Object.keys(updates).filter(k => allowedFields.includes(k));

  if (fields.length === 0) {
    const project = getProjectById(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    return project;
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => {
    const value = updates[f as keyof Project];
    // Convert show_dates object to JSON string
    if (f === 'show_dates' && value && typeof value === 'object') {
      return JSON.stringify(value);
    }
    // Convert arrays to JSON string (enabled_modules and all associates arrays)
    if ((f === 'enabled_modules' || f === 'lighting_associates' ||
         f === 'audio_associates' || f === 'video_associates') &&
        Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return value;
  });

  db.run(
    `UPDATE projects SET ${setClause}, updated_at = ? WHERE id = ?`,
    [...values, now, id]
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
  db.run('DELETE FROM projects WHERE id = ?', [id]);
  saveDatabase();
}

export function getCurrentProject(): Project {
  const db = getDatabase();

  // Get the most recently updated project
  const result = db.exec('SELECT * FROM projects ORDER BY updated_at DESC LIMIT 1');

  if (!result[0] || result[0].values.length === 0) {
    // If no projects exist, create a default one
    return createProject('Untitled Project');
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const project: any = {};
  columns.forEach((col, idx) => {
    const value = values[idx];
    // Parse JSON fields
    if ((col === 'enabled_modules' || col === 'show_dates' ||
         col === 'lighting_associates' || col === 'audio_associates' ||
         col === 'video_associates') && value && typeof value === 'string') {
      try {
        project[col] = JSON.parse(value);
      } catch {
        project[col] = value;
      }
    } else {
      project[col] = value;
    }
  });

  return project as Project;
}
