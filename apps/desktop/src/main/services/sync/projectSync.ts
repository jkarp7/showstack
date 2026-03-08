/**
 * PowerSync write-path helpers for projects and shop orders.
 *
 * Writes local rows into the PowerSync SQLite database so the PowerSync SDK can
 * upload them to Supabase via the CRUD queue. This fixes the TOCTOU ownership race
 * (issue #86): the full row is established in Supabase before any invite RPC runs,
 * so the invite RPC cannot claim ownership of a project/shop-order the user already owns.
 *
 * All functions are safe to call when PowerSync is not initialised — they silently
 * return. Callers are expected to handle errors with `.catch()` and log a warning.
 */

import { getPowerSyncService } from './PowerSyncService';
import { projects, shop_order_projects } from './powerSyncSchema';
import type { ProjectRow } from '../../database/queries/projects';
import type { ShopOrderProject } from '../../database/queries/shop-order';
import { logger } from '../../utils/logger';

/**
 * Coerce a value that may be a parsed JSON array/object or a raw JSON string
 * back to a JSON string suitable for PowerSync TEXT columns. Returns null for
 * absent values.
 */
function toJsonStr(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/** Build an INSERT … ON CONFLICT(id) DO UPDATE SET … SQL string from a column list.
 *  Columns in `immutableCols` (id, user_id, created_at) are never overwritten. */
function buildUpsertSql(table: string, columns: string[], immutableCols: string[]): string {
  const placeholders = columns.map(() => '?').join(', ');
  const quotedColumns = columns.map((c) => `"${c}"`);
  const updateClauses = columns
    .filter((c) => !immutableCols.includes(c))
    .map((c) => `"${c}" = excluded."${c}"`);
  const onConflict =
    updateClauses.length > 0
      ? `DO UPDATE SET\n      ${updateClauses.join(',\n      ')}`
      : 'DO NOTHING';
  return `INSERT INTO ${table} (${quotedColumns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT(id) ${onConflict}`;
}

// ============================================
// PROJECTS
// ============================================

// Derived from the schema so adding a column to powerSyncSchema.ts automatically
// includes it here. PowerSync adds 'id' implicitly; we prepend it manually.
const PROJECT_COLUMNS = ['id', ...Object.keys(projects.columns)];

const PROJECT_UPSERT_SQL = buildUpsertSql(
  'projects',
  [...PROJECT_COLUMNS],
  ['id', 'user_id', 'created_at'],
);

/** Columns in the projects table whose values are stored as JSON strings. */
const PROJECT_JSON_COLS = new Set<string>([
  'lighting_associates',
  'audio_associates',
  'video_associates',
  'show_dates',
  'enabled_modules',
]);

/**
 * Upsert a project row into the PowerSync local database.
 * PowerSync will queue this as a CRUD PUT operation and upload it to Supabase.
 * The INSERT … ON CONFLICT DO UPDATE never changes the `user_id` (ownership).
 */
export async function syncProjectToPowerSync(project: ProjectRow, userId: string): Promise<void> {
  const ps = getPowerSyncService();
  if (!ps.isReady()) return;

  const values = PROJECT_COLUMNS.map((col) => {
    if (col === 'user_id') return userId;
    const value = project[col as keyof ProjectRow];
    return PROJECT_JSON_COLS.has(col) ? toJsonStr(value) : (value ?? null);
  });

  await ps.execute(PROJECT_UPSERT_SQL, values);

  logger.debug(`[projectSync] synced project ${project.id} to PowerSync`);
}

/**
 * Delete a project row from the PowerSync local database.
 * PowerSync will queue this as a CRUD DELETE and remove it from Supabase.
 */
export async function deleteProjectFromPowerSync(id: string): Promise<void> {
  const ps = getPowerSyncService();
  if (!ps.isReady()) return;
  await ps.execute('DELETE FROM projects WHERE id = ?', [id]);
}

// ============================================
// SHOP ORDER PROJECTS
// ============================================

// Derived from the schema — same rationale as PROJECT_COLUMNS above.
const SHOP_ORDER_COLUMNS = ['id', ...Object.keys(shop_order_projects.columns)];

const SHOP_ORDER_UPSERT_SQL = buildUpsertSql(
  'shop_order_projects',
  [...SHOP_ORDER_COLUMNS],
  ['id', 'user_id', 'created_at'],
);

/** Columns in the shop_order_projects table whose values are stored as JSON strings. */
const SHOP_ORDER_JSON_COLS = new Set<string>(['additional_contacts', 'disciplines']);

/**
 * Upsert a shop order row into the PowerSync local database.
 * The INSERT … ON CONFLICT DO UPDATE never changes the `user_id` (ownership).
 *
 * Note: `logo_path` is a local-only field on ShopOrderProject; the PowerSync
 * schema stores `logo_url` and `logo_storage_path` only.
 */
export async function syncShopOrderToPowerSync(
  shopOrder: ShopOrderProject,
  userId: string,
): Promise<void> {
  const ps = getPowerSyncService();
  if (!ps.isReady()) return;

  const values = SHOP_ORDER_COLUMNS.map((col) => {
    if (col === 'user_id') return userId;
    const value = shopOrder[col as keyof ShopOrderProject];
    return SHOP_ORDER_JSON_COLS.has(col) ? toJsonStr(value) : (value ?? null);
  });

  await ps.execute(SHOP_ORDER_UPSERT_SQL, values);

  logger.debug(`[projectSync] synced shop order ${shopOrder.id} to PowerSync`);
}

/**
 * Delete a shop order row from the PowerSync local database.
 * PowerSync will queue this as a CRUD DELETE and remove it from Supabase.
 */
export async function deleteShopOrderFromPowerSync(id: string): Promise<void> {
  const ps = getPowerSyncService();
  if (!ps.isReady()) return;
  await ps.execute('DELETE FROM shop_order_projects WHERE id = ?', [id]);
}
