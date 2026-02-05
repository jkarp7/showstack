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

  const result = db.prepare(`
    SELECT preference_value FROM user_preferences
    WHERE project_id = ? AND preference_key = ?
  `).get(projectId, key);

  if (!result) {
    return null;
  }

  const value = (result as any).preference_value as string;
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
  const existing = db.prepare(`
    SELECT id FROM user_preferences
    WHERE project_id = ? AND preference_key = ?
  `).get(projectId, key);

  if (existing) {
    // Update existing
    const id = (existing as any).id;
    db.prepare(`
      UPDATE user_preferences
      SET preference_value = ?, updated_at = ?
      WHERE id = ?
    `).run(valueStr, now, id);
  } else {
    // Insert new
    const id = uuidv4();
    db.prepare(`
      INSERT INTO user_preferences (id, project_id, preference_key, preference_value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, projectId, key, valueStr, now, now);
  }

  saveDatabase();
}

export function getAllPreferences(projectId: string): Record<string, any> {
  const db = getDatabase();

  const rows = db.prepare(`
    SELECT preference_key, preference_value FROM user_preferences
    WHERE project_id = ?
  `).all(projectId);

  const preferences: Record<string, any> = {};
  rows.forEach((row: any) => {
    preferences[row.preference_key] = JSON.parse(row.preference_value);
  });

  return preferences;
}
