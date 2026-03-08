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

// ============================================
// PROJECTS
// ============================================

/**
 * Upsert a project row into the PowerSync local database.
 * PowerSync will queue this as a CRUD PUT operation and upload it to Supabase.
 * The INSERT … ON CONFLICT DO UPDATE never changes the `user_id` (ownership).
 */
export async function syncProjectToPowerSync(project: ProjectRow, userId: string): Promise<void> {
  const ps = getPowerSyncService();
  if (!ps.isReady()) return;

  await ps.execute(
    `INSERT INTO projects (
      id, user_id, name, description, logo_path,
      lighting_designer, lighting_designer_email, lighting_designer_phone, lighting_associates,
      audio_designer, audio_designer_email, audio_designer_phone, audio_associates,
      video_designer, video_designer_email, video_designer_phone, video_associates,
      electrician, electrician_email, electrician_phone,
      audio_tech, audio_tech_email, audio_tech_phone,
      video_tech, video_tech_email, video_tech_phone,
      production_manager, production_manager_email, production_manager_phone, production_manager_company,
      general_manager, general_manager_email, general_manager_phone, general_manager_company,
      venue, venue_city, venue_state, show_dates,
      phase_label_a, phase_label_b, phase_label_c,
      enabled_modules, created_at, updated_at, root_project_id
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      logo_path = excluded.logo_path,
      lighting_designer = excluded.lighting_designer,
      lighting_designer_email = excluded.lighting_designer_email,
      lighting_designer_phone = excluded.lighting_designer_phone,
      lighting_associates = excluded.lighting_associates,
      audio_designer = excluded.audio_designer,
      audio_designer_email = excluded.audio_designer_email,
      audio_designer_phone = excluded.audio_designer_phone,
      audio_associates = excluded.audio_associates,
      video_designer = excluded.video_designer,
      video_designer_email = excluded.video_designer_email,
      video_designer_phone = excluded.video_designer_phone,
      video_associates = excluded.video_associates,
      electrician = excluded.electrician,
      electrician_email = excluded.electrician_email,
      electrician_phone = excluded.electrician_phone,
      audio_tech = excluded.audio_tech,
      audio_tech_email = excluded.audio_tech_email,
      audio_tech_phone = excluded.audio_tech_phone,
      video_tech = excluded.video_tech,
      video_tech_email = excluded.video_tech_email,
      video_tech_phone = excluded.video_tech_phone,
      production_manager = excluded.production_manager,
      production_manager_email = excluded.production_manager_email,
      production_manager_phone = excluded.production_manager_phone,
      production_manager_company = excluded.production_manager_company,
      general_manager = excluded.general_manager,
      general_manager_email = excluded.general_manager_email,
      general_manager_phone = excluded.general_manager_phone,
      general_manager_company = excluded.general_manager_company,
      venue = excluded.venue,
      venue_city = excluded.venue_city,
      venue_state = excluded.venue_state,
      show_dates = excluded.show_dates,
      phase_label_a = excluded.phase_label_a,
      phase_label_b = excluded.phase_label_b,
      phase_label_c = excluded.phase_label_c,
      enabled_modules = excluded.enabled_modules,
      updated_at = excluded.updated_at,
      root_project_id = excluded.root_project_id`,
    [
      project.id,
      userId,
      project.name,
      project.description ?? null,
      project.logo_path ?? null,
      project.lighting_designer ?? null,
      project.lighting_designer_email ?? null,
      project.lighting_designer_phone ?? null,
      toJsonStr(project.lighting_associates),
      project.audio_designer ?? null,
      project.audio_designer_email ?? null,
      project.audio_designer_phone ?? null,
      toJsonStr(project.audio_associates),
      project.video_designer ?? null,
      project.video_designer_email ?? null,
      project.video_designer_phone ?? null,
      toJsonStr(project.video_associates),
      project.electrician ?? null,
      project.electrician_email ?? null,
      project.electrician_phone ?? null,
      project.audio_tech ?? null,
      project.audio_tech_email ?? null,
      project.audio_tech_phone ?? null,
      project.video_tech ?? null,
      project.video_tech_email ?? null,
      project.video_tech_phone ?? null,
      project.production_manager ?? null,
      project.production_manager_email ?? null,
      project.production_manager_phone ?? null,
      project.production_manager_company ?? null,
      project.general_manager ?? null,
      project.general_manager_email ?? null,
      project.general_manager_phone ?? null,
      project.general_manager_company ?? null,
      project.venue ?? null,
      project.venue_city ?? null,
      project.venue_state ?? null,
      toJsonStr(project.show_dates),
      project.phase_label_a ?? null,
      project.phase_label_b ?? null,
      project.phase_label_c ?? null,
      toJsonStr(project.enabled_modules),
      project.created_at,
      project.updated_at,
      project.root_project_id ?? null,
    ],
  );

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

  await ps.execute(
    `INSERT INTO shop_order_projects (
      id, user_id, parent_project_id,
      production_name, venue, venue_city, venue_state, order_date, original_order_date,
      prep_start_date, prep_end_date, load_in_date, first_preview_date,
      opening_night_date, closing_date, load_out_date,
      gm_name, gm_company, gm_email, gm_phone,
      pm_name, pm_company, pm_email, pm_phone,
      ld_name, ld_email, ld_phone,
      ald_name, ald_email, ald_phone,
      pe_name, pe_email, pe_phone,
      additional_contacts, logo_url, logo_storage_path,
      disciplines, current_revision,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      parent_project_id = excluded.parent_project_id,
      production_name = excluded.production_name,
      venue = excluded.venue,
      venue_city = excluded.venue_city,
      venue_state = excluded.venue_state,
      order_date = excluded.order_date,
      original_order_date = excluded.original_order_date,
      prep_start_date = excluded.prep_start_date,
      prep_end_date = excluded.prep_end_date,
      load_in_date = excluded.load_in_date,
      first_preview_date = excluded.first_preview_date,
      opening_night_date = excluded.opening_night_date,
      closing_date = excluded.closing_date,
      load_out_date = excluded.load_out_date,
      gm_name = excluded.gm_name,
      gm_company = excluded.gm_company,
      gm_email = excluded.gm_email,
      gm_phone = excluded.gm_phone,
      pm_name = excluded.pm_name,
      pm_company = excluded.pm_company,
      pm_email = excluded.pm_email,
      pm_phone = excluded.pm_phone,
      ld_name = excluded.ld_name,
      ld_email = excluded.ld_email,
      ld_phone = excluded.ld_phone,
      ald_name = excluded.ald_name,
      ald_email = excluded.ald_email,
      ald_phone = excluded.ald_phone,
      pe_name = excluded.pe_name,
      pe_email = excluded.pe_email,
      pe_phone = excluded.pe_phone,
      additional_contacts = excluded.additional_contacts,
      logo_url = excluded.logo_url,
      logo_storage_path = excluded.logo_storage_path,
      disciplines = excluded.disciplines,
      current_revision = excluded.current_revision,
      updated_at = excluded.updated_at`,
    [
      shopOrder.id,
      userId,
      shopOrder.parent_project_id ?? null,
      shopOrder.production_name,
      shopOrder.venue ?? null,
      shopOrder.venue_city ?? null,
      shopOrder.venue_state ?? null,
      shopOrder.order_date,
      shopOrder.original_order_date ?? null,
      shopOrder.prep_start_date ?? null,
      shopOrder.prep_end_date ?? null,
      shopOrder.load_in_date ?? null,
      shopOrder.first_preview_date ?? null,
      shopOrder.opening_night_date ?? null,
      shopOrder.closing_date ?? null,
      shopOrder.load_out_date ?? null,
      shopOrder.gm_name ?? null,
      shopOrder.gm_company ?? null,
      shopOrder.gm_email ?? null,
      shopOrder.gm_phone ?? null,
      shopOrder.pm_name ?? null,
      shopOrder.pm_company ?? null,
      shopOrder.pm_email ?? null,
      shopOrder.pm_phone ?? null,
      shopOrder.ld_name ?? null,
      shopOrder.ld_email ?? null,
      shopOrder.ld_phone ?? null,
      shopOrder.ald_name ?? null,
      shopOrder.ald_email ?? null,
      shopOrder.ald_phone ?? null,
      shopOrder.pe_name ?? null,
      shopOrder.pe_email ?? null,
      shopOrder.pe_phone ?? null,
      toJsonStr(shopOrder.additional_contacts),
      shopOrder.logo_url ?? null,
      shopOrder.logo_storage_path ?? null,
      toJsonStr(shopOrder.disciplines),
      shopOrder.current_revision,
      shopOrder.created_at,
      shopOrder.updated_at,
    ],
  );

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
