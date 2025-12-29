import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

export interface UserPreference {
  id: string;
  project_id: string;
  preference_key: string;
  preference_value: string; // JSON string
  created_at: number;
  updated_at: number;
}

export function getPreference(
  projectId: string,
  key: string
): any | null {
  const db = getDatabase();

  const result = db.exec(`
    SELECT preference_value FROM user_preferences
    WHERE project_id = ? AND preference_key = ?
  `, [projectId, key]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const value = result[0].values[0][0] as string;
  return JSON.parse(value);
}

export function setPreference(
  projectId: string,
  key: string,
  value: any
): void {
  const db = getDatabase();
  const now = Date.now();
  const valueStr = JSON.stringify(value);

  // Try to update first
  const existing = db.exec(`
    SELECT id FROM user_preferences
    WHERE project_id = ? AND preference_key = ?
  `, [projectId, key]);

  if (existing[0] && existing[0].values.length > 0) {
    // Update existing
    const id = existing[0].values[0][0];
    db.run(`
      UPDATE user_preferences
      SET preference_value = ?, updated_at = ?
      WHERE id = ?
    `, [valueStr, now, id]);
  } else {
    // Insert new
    const id = uuidv4();
    db.run(`
      INSERT INTO user_preferences (id, project_id, preference_key, preference_value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, projectId, key, valueStr, now, now]);
  }

  saveDatabase();
}

export function getAllPreferences(projectId: string): Record<string, any> {
  const db = getDatabase();

  const result = db.exec(`
    SELECT preference_key, preference_value FROM user_preferences
    WHERE project_id = ?
  `, [projectId]);

  if (!result[0]) {
    return {};
  }

  const preferences: Record<string, any> = {};
  result[0].values.forEach(row => {
    const key = row[0] as string;
    const value = row[1] as string;
    preferences[key] = JSON.parse(value);
  });

  return preferences;
}
