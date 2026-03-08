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

const PROJECT_COLUMNS = [
  'id',
  'user_id',
  'name',
  'description',
  'logo_path',
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
  'venue',
  'venue_city',
  'venue_state',
  'show_dates',
  'phase_label_a',
  'phase_label_b',
  'phase_label_c',
  'enabled_modules',
  'created_at',
  'updated_at',
  'root_project_id',
] as const;

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

const SHOP_ORDER_COLUMNS = [
  'id',
  'user_id',
  'parent_project_id',
  'production_name',
  'venue',
  'venue_city',
  'venue_state',
  'order_date',
  'original_order_date',
  'prep_start_date',
  'prep_end_date',
  'load_in_date',
  'first_preview_date',
  'opening_night_date',
  'closing_date',
  'load_out_date',
  'gm_name',
  'gm_company',
  'gm_email',
  'gm_phone',
  'pm_name',
  'pm_company',
  'pm_email',
  'pm_phone',
  'ld_name',
  'ld_email',
  'ld_phone',
  'ald_name',
  'ald_email',
  'ald_phone',
  'pe_name',
  'pe_email',
  'pe_phone',
  'additional_contacts',
  'logo_url',
  'logo_storage_path',
  'disciplines',
  'current_revision',
  'created_at',
  'updated_at',
] as const;

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
