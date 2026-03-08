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
import type { Project } from '../../database/queries/projects';
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
export async function syncProjectToPowerSync(project: Project, userId: string): Promise<void> {
  const ps = getPowerSyncService();
  if (!ps.isReady()) return;

  // Cast to Record<string, unknown> to access columns that exist in the local
  // SQLite schema but are not present in the minimal typed Project interface
  // (e.g. lighting_designer, venue_city, phase_label_a, …).
  const p = project as unknown as Record<string, unknown>;

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
      p.lighting_designer ?? null,
      p.lighting_designer_email ?? null,
      p.lighting_designer_phone ?? null,
      toJsonStr(p.lighting_associates),
      p.audio_designer ?? null,
      p.audio_designer_email ?? null,
      p.audio_designer_phone ?? null,
      toJsonStr(p.audio_associates),
      p.video_designer ?? null,
      p.video_designer_email ?? null,
      p.video_designer_phone ?? null,
      toJsonStr(p.video_associates),
      p.electrician ?? null,
      p.electrician_email ?? null,
      p.electrician_phone ?? null,
      p.audio_tech ?? null,
      p.audio_tech_email ?? null,
      p.audio_tech_phone ?? null,
      p.video_tech ?? null,
      p.video_tech_email ?? null,
      p.video_tech_phone ?? null,
      p.production_manager ?? null,
      p.production_manager_email ?? null,
      p.production_manager_phone ?? null,
      p.production_manager_company ?? null,
      p.general_manager ?? null,
      p.general_manager_email ?? null,
      p.general_manager_phone ?? null,
      p.general_manager_company ?? null,
      p.venue ?? null,
      p.venue_city ?? null,
      p.venue_state ?? null,
      toJsonStr(p.show_dates),
      p.phase_label_a ?? null,
      p.phase_label_b ?? null,
      p.phase_label_c ?? null,
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
