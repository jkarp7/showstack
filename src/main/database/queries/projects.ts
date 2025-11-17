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
      project[col] = row[idx];
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
    project[col] = values[idx];
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

  const allowedFields = ['name', 'description', 'venue', 'designer', 'logo_path', 'enabled_modules'];
  const fields = Object.keys(updates).filter(k => allowedFields.includes(k));

  if (fields.length === 0) {
    const project = getProjectById(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    return project;
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f as keyof Project]);

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
    project[col] = values[idx];
  });

  return project as Project;
}
