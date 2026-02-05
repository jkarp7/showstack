// @ts-nocheck
import { getAppDatabase, saveAppDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';
import type {
  UserLicense,
  ModuleAccess,
  // ShowStackModule,
  LicenseTier
} from '../../../shared/types/license.types';

/**
 * Get the current active license
 */
export function getCurrentLicense(): UserLicense | null {
  const db = getAppDatabase();

  const result = db.exec(`
    SELECT * FROM licenses
    WHERE status != 'deleted'
    ORDER BY created_at DESC
    LIMIT 1
  `);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  return rowToLicense(result[0].columns, result[0].values[0]);
}

/**
 * Get license by ID
 */
export function getLicenseById(id: string): UserLicense | null {
  const db = getAppDatabase();

  const result = db.exec(`
    SELECT * FROM licenses
    WHERE id = ? AND status != 'deleted'
  `, [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  return rowToLicense(result[0].columns, result[0].values[0]);
}

/**
 * Get license by license key
 */
export function getLicenseByKey(licenseKey: string): UserLicense | null {
  const db = getAppDatabase();

  const result = db.exec(`
    SELECT * FROM licenses
    WHERE license_key = ? AND status != 'deleted'
  `, [licenseKey]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  return rowToLicense(result[0].columns, result[0].values[0]);
}

/**
 * Create a new license
 */
export function createLicense(data: {
  email: string;
  name?: string;
  licenseKey: string;
  tier: LicenseTier;
  modules: ModuleAccess[];
  expirationDate: number;
}): UserLicense {
  const db = getAppDatabase();
  const now = Date.now();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO licenses (
      id, email, name, license_key, tier, status, modules,
      expiration_date, last_verified, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.email,
    data.name || '',
    data.licenseKey,
    data.tier,
    'active',
    JSON.stringify(data.modules),
    data.expirationDate,
    now,
    now,
    now
  );

  saveAppDatabase();

  return getLicenseById(id)!;
}

/**
 * Update license
 */
export function updateLicense(
  id: string,
  updates: Partial<{
    email: string;
    name: string;
    tier: LicenseTier;
    status: 'active' | 'expired' | 'suspended';
    modules: ModuleAccess[];
    expirationDate: number;
    lastVerified: number;
  }>
): UserLicense {
  const db = getAppDatabase();
  const now = Date.now();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.tier !== undefined) {
    fields.push('tier = ?');
    values.push(updates.tier);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.modules !== undefined) {
    fields.push('modules = ?');
    values.push(JSON.stringify(updates.modules));
  }
  if (updates.expirationDate !== undefined) {
    fields.push('expiration_date = ?');
    values.push(updates.expirationDate);
  }
  if (updates.lastVerified !== undefined) {
    fields.push('last_verified = ?');
    values.push(updates.lastVerified);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(`
    UPDATE licenses
    SET ${fields.join(', ')}
    WHERE id = ?
  `).run(...values);

  saveAppDatabase();

  return getLicenseById(id)!;
}

/**
 * Delete license (soft delete by setting status to 'deleted')
 */
export function deleteLicense(id: string): void {
  const db = getAppDatabase();

  db.prepare(`
    UPDATE licenses
    SET status = 'deleted', updated_at = ?
    WHERE id = ?
  `).run(Date.now(), id);

  saveAppDatabase();
}

/**
 * Helper function to convert database row to UserLicense
 */
function rowToLicense(columns: string[], row: any[]): UserLicense {
  const obj: any = {};
  columns.forEach((col, index) => {
    obj[col] = row[index];
  });

  return {
    id: obj.id,
    email: obj.email,
    name: obj.name || '',
    licenseKey: obj.license_key,
    tier: obj.tier as LicenseTier,
    status: obj.status,
    modules: JSON.parse(obj.modules),
    expirationDate: obj.expiration_date,
    lastVerified: obj.last_verified,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at
  };
}
