import { getAppDatabase, saveAppDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';
import type {
  UserLicense,
  ModuleAccess,
  // ShowStackModule,
  LicenseTier,
} from '../../../shared/types/license.types';

/**
 * Get the current active license
 */
export function getCurrentLicense(): UserLicense | null {
  const db = getAppDatabase();

  const row = db
    .prepare(
      `
    SELECT * FROM licenses
    WHERE status != 'deleted'
    ORDER BY created_at DESC
    LIMIT 1
  `,
    )
    .get() as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return rowObjectToLicense(row);
}

/**
 * Get license by ID
 */
export function getLicenseById(id: string): UserLicense | null {
  const db = getAppDatabase();

  const row = db
    .prepare(
      `
    SELECT * FROM licenses
    WHERE id = ? AND status != 'deleted'
  `,
    )
    .get(id) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return rowObjectToLicense(row);
}

/**
 * Get license by license key
 */
export function getLicenseByKey(licenseKey: string): UserLicense | null {
  const db = getAppDatabase();

  const row = db
    .prepare(
      `
    SELECT * FROM licenses
    WHERE license_key = ? AND status != 'deleted'
  `,
    )
    .get(licenseKey) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return rowObjectToLicense(row);
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
  maintenanceEndDate?: number;
  userId?: string;
  cloudSync?: boolean;
}): UserLicense {
  const db = getAppDatabase();
  const now = Date.now();
  const id = uuidv4();
  const maintenanceEndDate = data.maintenanceEndDate ?? data.expirationDate;

  db.prepare(
    `
    INSERT INTO licenses (
      id, email, name, license_key, tier, status, modules,
      expiration_date, maintenance_end_date, user_id, cloud_sync, last_verified, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    data.email,
    data.name || '',
    data.licenseKey,
    data.tier,
    'active',
    JSON.stringify(data.modules),
    data.expirationDate,
    maintenanceEndDate,
    data.userId || null,
    data.cloudSync === false ? 0 : 1,
    now,
    now,
    now,
  );

  saveAppDatabase();

  return getLicenseById(id)!;
}

/** Allowed column mappings for license updates — prevents SQL injection */
const LICENSE_UPDATE_COLUMNS: Record<string, string> = {
  email: 'email',
  name: 'name',
  tier: 'tier',
  status: 'status',
  modules: 'modules',
  expirationDate: 'expiration_date',
  maintenanceEndDate: 'maintenance_end_date',
  userId: 'user_id',
  cloudSync: 'cloud_sync',
  lastVerified: 'last_verified',
};

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
    maintenanceEndDate: number;
    userId: string;
    cloudSync: boolean;
    lastVerified: number;
  }>,
): UserLicense {
  const db = getAppDatabase();
  const now = Date.now();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    const column = LICENSE_UPDATE_COLUMNS[key];
    if (!column) continue; // Skip unknown keys — whitelist only
    fields.push(`${column} = ?`);
    if (key === 'modules') {
      values.push(JSON.stringify(value));
    } else if (key === 'cloudSync') {
      values.push(value ? 1 : 0);
    } else {
      values.push(value as string | number | null);
    }
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(
    `
    UPDATE licenses
    SET ${fields.join(', ')}
    WHERE id = ?
  `,
  ).run(...values);

  saveAppDatabase();

  return getLicenseById(id)!;
}

/**
 * Delete license (soft delete by setting status to 'deleted')
 */
export function deleteLicense(id: string): void {
  const db = getAppDatabase();

  db.prepare(
    `
    UPDATE licenses
    SET status = 'deleted', updated_at = ?
    WHERE id = ?
  `,
  ).run(Date.now(), id);

  saveAppDatabase();
}

/**
 * Helper function to convert database row object to UserLicense
 */
function parseModules(raw: unknown): ModuleAccess[] {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowObjectToLicense(obj: Record<string, unknown>): UserLicense {
  const expirationDate = obj.expiration_date as number;
  const maintenanceEndDate = (obj.maintenance_end_date as number) ?? expirationDate;
  return {
    id: obj.id as string,
    email: obj.email as string,
    name: (obj.name as string) || '',
    licenseKey: obj.license_key as string,
    tier: obj.tier as LicenseTier,
    status: obj.status as 'active' | 'expired' | 'suspended',
    userId: (obj.user_id as string) || undefined,
    cloudSync: obj.cloud_sync !== 0, // Default true for backwards compat (column DEFAULT 1)
    modules: parseModules(obj.modules),
    expirationDate,
    maintenanceEndDate,
    lastVerified: obj.last_verified as number,
    createdAt: obj.created_at as number,
    updatedAt: obj.updated_at as number,
  };
}
