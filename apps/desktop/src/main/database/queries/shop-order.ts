import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';
import {
  PaginationOptions,
  PaginatedResult,
  normalizePaginationOptions,
  buildOrderByClause,
  buildPaginatedResult,
} from '../utils/pagination';

/**
 * Database query functions for ShowStack:Prep module
 * Handles shop orders, equipment items, sections, revisions, and notes
 */

// ============================================
// PREP PROJECTS
// ============================================

/**
 * Shop Order Project - represents a prep/rental order for a production.
 * Can optionally be linked to a parent Project entity for cross-referencing.
 */
export interface ShopOrderProject {
  /** Unique identifier for the shop order project */
  id: string;
  /** User who owns this shop order (for multi-tenant support) */
  user_id?: string;
  /**
   * Reference to the main Project entity (from projects table).
   * Links this shop order to a lighting plot project for cross-referencing
   * fixtures, infrastructure, and other production data.
   */
  parent_project_id?: string;
  /** Name of the production/show */
  production_name: string;
  venue?: string;
  venue_city?: string;
  venue_state?: string;
  order_date: number;
  original_order_date?: number;
  prep_start_date?: string;
  prep_end_date?: string;
  load_in_date?: string;
  first_preview_date?: string;
  opening_night_date?: string;
  closing_date?: string;
  load_out_date?: string;
  gm_name?: string;
  gm_company?: string;
  gm_email?: string;
  gm_phone?: string;
  pm_name?: string;
  pm_company?: string;
  pm_email?: string;
  pm_phone?: string;
  ld_name?: string;
  ld_email?: string;
  ld_phone?: string;
  ald_name?: string;
  ald_email?: string;
  ald_phone?: string;
  pe_name?: string;
  pe_email?: string;
  pe_phone?: string;
  additional_contacts?: string; // JSON
  logo_path?: string; // Unified logo field (same as Project type)
  logo_url?: string;
  logo_storage_path?: string; // Legacy field, kept for backwards compatibility
  disciplines: string; // JSON array
  current_revision: number;
  created_at: number;
  updated_at: number;
}

export function getAllShopOrderProjects(): ShopOrderProject[] {
  const db = getDatabase();
  const projects = db.prepare(`SELECT * FROM shop_order_projects ORDER BY updated_at DESC`).all();

  return projects as ShopOrderProject[];
}

export function getShopOrderProjectById(id: string): ShopOrderProject | null {
  const db = getDatabase();
  const project = db.prepare(`SELECT * FROM shop_order_projects WHERE id = ?`).get(id);

  if (!project) {
    return null;
  }

  return project as ShopOrderProject;
}

export function createShopOrderProject(data: Partial<ShopOrderProject>): ShopOrderProject {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  const disciplinesRaw = data.disciplines || ['lighting'];
  const disciplines = Array.isArray(disciplinesRaw)
    ? JSON.stringify(disciplinesRaw)
    : disciplinesRaw;
  const additionalContactsRaw = data.additional_contacts || null;
  const additionalContacts = Array.isArray(additionalContactsRaw)
    ? JSON.stringify(additionalContactsRaw)
    : additionalContactsRaw;

  db.prepare(
    `
    INSERT INTO shop_order_projects (
      id, user_id, parent_project_id, production_name, venue, venue_city, venue_state,
      order_date, original_order_date,
      prep_start_date, prep_end_date, load_in_date, first_preview_date, opening_night_date, closing_date, load_out_date,
      gm_name, gm_company, gm_email, gm_phone,
      pm_name, pm_company, pm_email, pm_phone,
      ld_name, ld_email, ld_phone,
      ald_name, ald_email, ald_phone,
      pe_name, pe_email, pe_phone,
      additional_contacts, logo_path, logo_url, logo_storage_path,
      disciplines, current_revision, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    data.user_id || null,
    data.parent_project_id || null,
    data.production_name || 'Untitled Shop Order',
    data.venue || null,
    data.venue_city || null,
    data.venue_state || null,
    data.order_date || now,
    data.original_order_date || null,
    data.prep_start_date || null,
    data.prep_end_date || null,
    data.load_in_date || null,
    data.first_preview_date || null,
    data.opening_night_date || null,
    data.closing_date || null,
    data.load_out_date || null,
    data.gm_name || null,
    data.gm_company || null,
    data.gm_email || null,
    data.gm_phone || null,
    data.pm_name || null,
    data.pm_company || null,
    data.pm_email || null,
    data.pm_phone || null,
    data.ld_name || null,
    data.ld_email || null,
    data.ld_phone || null,
    data.ald_name || null,
    data.ald_email || null,
    data.ald_phone || null,
    data.pe_name || null,
    data.pe_email || null,
    data.pe_phone || null,
    additionalContacts,
    data.logo_path || null,
    data.logo_url || null,
    data.logo_storage_path || null,
    disciplines,
    data.current_revision || 0,
    now,
    now,
  );

  saveDatabase();
  return getShopOrderProjectById(id)!;
}

export function updateShopOrderProject(
  id: string,
  updates: Partial<ShopOrderProject>,
): ShopOrderProject {
  const db = getDatabase();
  const now = Date.now();

  // Frozen to prevent runtime modification (security hardening)
  const allowedFields = Object.freeze([
    'parent_project_id',
    'production_name',
    'venue',
    'venue_city',
    'venue_state',
    'order_date',
    'original_order_date',
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
    'logo_path',
    'logo_url',
    'logo_storage_path',
    'disciplines',
    'current_revision',
    'prep_start_date',
    'prep_end_date',
    'load_in_date',
    'first_preview_date',
    'opening_night_date',
    'closing_date',
    'load_out_date',
  ]);

  const fields = Object.keys(updates).filter((k) => allowedFields.includes(k));

  if (fields.length === 0) {
    return getShopOrderProjectById(id)!;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => {
    const v = updates[f];
    if ((f === 'disciplines' || f === 'additional_contacts') && Array.isArray(v))
      return JSON.stringify(v);
    return v;
  });

  db.prepare(
    `
    UPDATE shop_order_projects
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `,
  ).run(...values, now, id);

  saveDatabase();
  return getShopOrderProjectById(id)!;
}

export function deleteShopOrderProject(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM shop_order_projects WHERE id = ?').run(id);
  saveDatabase();
}

// ============================================
// PREP SECTIONS
// ============================================

export interface ShopOrderSection {
  id: string;
  prep_project_id: string;
  name: string;
  discipline: string;
  sort_order: number;
  page_break: number;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export function getSectionsByProjectId(projectId: string): ShopOrderSection[] {
  const db = getDatabase();
  const sections = db
    .prepare(`SELECT * FROM shop_order_sections WHERE prep_project_id = ? ORDER BY sort_order`)
    .all(projectId);

  return sections as ShopOrderSection[];
}

export function createShopOrderSection(data: Partial<ShopOrderSection>): ShopOrderSection {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    `
    INSERT INTO shop_order_sections (
      id, prep_project_id, name, discipline, sort_order, page_break, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    data.prep_project_id!,
    data.name || 'Untitled Section',
    data.discipline || 'lighting',
    data.sort_order || 0,
    data.page_break ? 1 : 0,
    data.notes || null,
    now,
    now,
  );

  saveDatabase();
  return getShopOrderSectionById(id)!;
}

export function updateShopOrderSection(
  id: string,
  updates: Partial<ShopOrderSection>,
): ShopOrderSection {
  const db = getDatabase();
  const now = Date.now();

  // Frozen to prevent runtime modification (security hardening)
  const allowedFields = Object.freeze(['name', 'discipline', 'sort_order', 'page_break', 'notes']);
  const fields = Object.keys(updates).filter((k) => allowedFields.includes(k));

  if (fields.length === 0) {
    return getShopOrderSectionById(id)!;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => {
    if (f === 'page_break') {
      return updates[f] ? 1 : 0;
    }
    const value = updates[f];
    return value === undefined ? null : value;
  });

  db.prepare(
    `
    UPDATE shop_order_sections
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `,
  ).run(...values, now, id);

  saveDatabase();
  return getShopOrderSectionById(id)!;
}

export function deleteShopOrderSection(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM shop_order_sections WHERE id = ?').run(id);
  saveDatabase();
}

function getShopOrderSectionById(id: string): ShopOrderSection | null {
  const db = getDatabase();
  const section = db.prepare(`SELECT * FROM shop_order_sections WHERE id = ?`).get(id);

  if (!section) {
    return null;
  }

  return section as ShopOrderSection;
}

// ============================================
// PREP EQUIPMENT ITEMS
// ============================================

export interface ShopOrderItem {
  id: string;
  section_id: string;
  description: string;
  active_qty: number;
  spare_qty: number;
  venue_qty: number;
  total_qty: number;
  venue_active: number;
  venue_spare: number;
  weight?: number;
  power?: number;
  notes?: string;
  sort_order: number;
  added_in_revision?: number;
  removed_in_revision?: number;
  modified_in_revision?: number;
  created_at: number;
  updated_at: number;
}

export function getItemsBySectionId(sectionId: string): ShopOrderItem[] {
  const db = getDatabase();
  const items = db
    .prepare(`SELECT * FROM shop_order_items WHERE section_id = ? ORDER BY sort_order`)
    .all(sectionId);

  return items as ShopOrderItem[];
}

export function getItemsByProjectId(projectId: string): ShopOrderItem[] {
  const db = getDatabase();
  const items = db
    .prepare(
      `
    SELECT i.* FROM shop_order_items i
    JOIN shop_order_sections s ON i.section_id = s.id
    WHERE s.prep_project_id = ?
    ORDER BY s.sort_order, i.sort_order
  `,
    )
    .all(projectId);

  return items as ShopOrderItem[];
}

/**
 * Allowed sort fields for shop order items pagination.
 * These are validated against to prevent SQL injection.
 */
const SHOP_ORDER_ITEM_SORT_FIELDS = Object.freeze([
  'description',
  'active_qty',
  'spare_qty',
  'venue_qty',
  'total_qty',
  'weight',
  'power',
  'sort_order',
  'created_at',
  'updated_at',
] as const);

/**
 * Get shop order items with pagination support.
 * Use this for large shop orders with many items.
 *
 * @param projectId - Project ID to filter by
 * @param options - Pagination options (offset, limit, sortBy, sortOrder)
 * @returns Paginated result with items and metadata
 */
export function getItemsByProjectIdPaginated(
  projectId: string,
  options: Partial<PaginationOptions> = {},
): PaginatedResult<ShopOrderItem> {
  const db = getDatabase();
  const normalized = normalizePaginationOptions(options, SHOP_ORDER_ITEM_SORT_FIELDS);
  const orderBy = buildOrderByClause(
    normalized.sortBy,
    normalized.sortOrder,
    SHOP_ORDER_ITEM_SORT_FIELDS,
  );

  // Get total count
  const countResult = db
    .prepare(
      `
    SELECT COUNT(*) as count FROM shop_order_items i
    JOIN shop_order_sections s ON i.section_id = s.id
    WHERE s.prep_project_id = ?
  `,
    )
    .get(projectId) as { count: number };

  // Get paginated data
  const items = db
    .prepare(
      `
    SELECT i.* FROM shop_order_items i
    JOIN shop_order_sections s ON i.section_id = s.id
    WHERE s.prep_project_id = ?
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `,
    )
    .all(projectId, normalized.limit, normalized.offset);

  return buildPaginatedResult(items as ShopOrderItem[], countResult.count, normalized);
}

/**
 * Get shop order items by section with pagination support.
 *
 * @param sectionId - Section ID to filter by
 * @param options - Pagination options
 * @returns Paginated result with items and metadata
 */
export function getItemsBySectionIdPaginated(
  sectionId: string,
  options: Partial<PaginationOptions> = {},
): PaginatedResult<ShopOrderItem> {
  const db = getDatabase();
  const normalized = normalizePaginationOptions(options, SHOP_ORDER_ITEM_SORT_FIELDS);
  const orderBy = buildOrderByClause(
    normalized.sortBy,
    normalized.sortOrder,
    SHOP_ORDER_ITEM_SORT_FIELDS,
  );

  // Get total count
  const countResult = db
    .prepare('SELECT COUNT(*) as count FROM shop_order_items WHERE section_id = ?')
    .get(sectionId) as { count: number };

  // Get paginated data
  const items = db
    .prepare(
      `
    SELECT * FROM shop_order_items
    WHERE section_id = ?
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `,
    )
    .all(sectionId, normalized.limit, normalized.offset);

  return buildPaginatedResult(items as ShopOrderItem[], countResult.count, normalized);
}

export function createShopOrderItem(data: Partial<ShopOrderItem>): ShopOrderItem {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  const activeQty = data.active_qty || 0;
  const spareQty = data.spare_qty || 0;
  const venueQty = data.venue_qty || 0;

  // Calculate venue allocation
  const totalNeeded = activeQty + spareQty;
  let venueActive = 0;
  let venueSpare = 0;

  if (venueQty > 0) {
    if (venueQty >= totalNeeded) {
      venueActive = activeQty;
      venueSpare = spareQty;
    } else {
      venueActive = Math.min(venueQty, activeQty);
      venueSpare = venueQty - venueActive;
    }
  }

  db.prepare(
    `
    INSERT INTO shop_order_items (
      id, section_id, description, active_qty, spare_qty, venue_qty,
      total_qty, venue_active, venue_spare, weight, power, notes,
      sort_order, added_in_revision, removed_in_revision, modified_in_revision,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    data.section_id!,
    data.description || 'Untitled Item',
    activeQty,
    spareQty,
    venueQty,
    activeQty + spareQty,
    venueActive,
    venueSpare,
    data.weight || null,
    data.power || null,
    data.notes || null,
    data.sort_order || 0,
    data.added_in_revision || null,
    data.removed_in_revision || null,
    data.modified_in_revision || null,
    now,
    now,
  );

  saveDatabase();
  return getShopOrderItemById(id)!;
}

export function updateShopOrderItem(id: string, updates: Partial<ShopOrderItem>): ShopOrderItem {
  const db = getDatabase();
  const now = Date.now();

  // Get current item for recalculation
  const current = getShopOrderItemById(id);
  if (!current) {
    throw new Error(`Equipment item ${id} not found`);
  }

  const activeQty = updates.active_qty !== undefined ? updates.active_qty : current.active_qty;
  const spareQty = updates.spare_qty !== undefined ? updates.spare_qty : current.spare_qty;
  const venueQty = updates.venue_qty !== undefined ? updates.venue_qty : current.venue_qty;

  // Recalculate venue allocation
  const totalNeeded = activeQty + spareQty;
  let venueActive = 0;
  let venueSpare = 0;

  if (venueQty > 0) {
    if (venueQty >= totalNeeded) {
      venueActive = activeQty;
      venueSpare = spareQty;
    } else {
      venueActive = Math.min(venueQty, activeQty);
      venueSpare = venueQty - venueActive;
    }
  }

  // Frozen to prevent runtime modification (security hardening)
  const allowedFields = Object.freeze([
    'description',
    'active_qty',
    'spare_qty',
    'venue_qty',
    'weight',
    'power',
    'notes',
    'sort_order',
    'added_in_revision',
    'removed_in_revision',
    'modified_in_revision',
  ]);

  const fields = Object.keys(updates).filter((k) => allowedFields.includes(k));

  // Always update calculated fields
  const finalUpdates = {
    ...updates,
    total_qty: activeQty + spareQty,
    venue_active: venueActive,
    venue_spare: venueSpare,
  };

  const allFields = [...fields, 'total_qty', 'venue_active', 'venue_spare'];
  const setClause = allFields.map((f) => `${f} = ?`).join(', ');
  const values = allFields.map((f) => {
    const value = finalUpdates[f];
    return value === undefined ? null : value;
  });

  db.prepare(
    `
    UPDATE shop_order_items
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `,
  ).run(...values, now, id);

  saveDatabase();
  return getShopOrderItemById(id)!;
}

export function deleteShopOrderItem(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM shop_order_items WHERE id = ?').run(id);
  saveDatabase();
}

function getShopOrderItemById(id: string): ShopOrderItem | null {
  const db = getDatabase();
  const item = db.prepare(`SELECT * FROM shop_order_items WHERE id = ?`).get(id);

  if (!item) {
    return null;
  }

  return item as ShopOrderItem;
}

// ============================================
// PREP REVISIONS
// ============================================

export interface ShopOrderRevision {
  id: string;
  prep_project_id: string;
  revision_number: number;
  revision_date: number;
  notes?: string;
  change_log: string; // JSON
  created_at: number;
  updated_at: number;
}

export function getRevisionsByProjectId(projectId: string): ShopOrderRevision[] {
  const db = getDatabase();
  const revisions = db
    .prepare(
      `SELECT * FROM shop_order_revisions WHERE prep_project_id = ? ORDER BY revision_number`,
    )
    .all(projectId);

  return revisions as ShopOrderRevision[];
}

export function createShopOrderRevision(data: Partial<ShopOrderRevision>): ShopOrderRevision {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  const changeLog = data.change_log || JSON.stringify([]);

  db.prepare(
    `
    INSERT INTO shop_order_revisions (
      id, prep_project_id, revision_number, revision_date, notes, change_log, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    data.prep_project_id!,
    data.revision_number!,
    data.revision_date || now,
    data.notes || null,
    changeLog,
    now,
    now,
  );

  saveDatabase();
  return getShopOrderRevisionById(id)!;
}

export function deleteShopOrderRevision(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM shop_order_revisions WHERE id = ?').run(id);
  saveDatabase();
}

function getShopOrderRevisionById(id: string): ShopOrderRevision | null {
  const db = getDatabase();
  const revision = db.prepare(`SELECT * FROM shop_order_revisions WHERE id = ?`).get(id);

  if (!revision) {
    return null;
  }

  return revision as ShopOrderRevision;
}

// ============================================
// PREP NOTES
// ============================================

export interface ShopOrderNote {
  id: string;
  prep_project_id: string;
  type: string;
  content: string;
  format: string;
  created_at: number;
  updated_at: number;
}

export function getNotesByProjectId(projectId: string, type?: string): ShopOrderNote[] {
  const db = getDatabase();

  let query = `SELECT * FROM shop_order_notes WHERE prep_project_id = ?`;
  const params: any[] = [projectId];

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  query += ` ORDER BY created_at DESC`;

  const notes = db.prepare(query).all(...params);

  return notes as ShopOrderNote[];
}

export function createShopOrderNote(data: Partial<ShopOrderNote>): ShopOrderNote {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    `
    INSERT INTO shop_order_notes (
      id, prep_project_id, type, content, format, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    data.prep_project_id!,
    data.type!,
    data.content || '',
    data.format || 'plain',
    now,
    now,
  );

  saveDatabase();
  return getShopOrderNoteById(id)!;
}

export function updateShopOrderNote(
  id: string,
  updates: Partial<Pick<ShopOrderNote, 'content' | 'format'>>,
): ShopOrderNote {
  const db = getDatabase();
  const now = Date.now();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }

  if (updates.format !== undefined) {
    fields.push('format = ?');
    values.push(updates.format);
  }

  if (fields.length === 0) {
    return getShopOrderNoteById(id)!;
  }

  fields.push('updated_at = ?');
  values.push(now, id);

  db.prepare(
    `
    UPDATE shop_order_notes
    SET ${fields.join(', ')}
    WHERE id = ?
  `,
  ).run(...values);

  saveDatabase();
  return getShopOrderNoteById(id)!;
}

export function deleteShopOrderNote(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM shop_order_notes WHERE id = ?').run(id);
  saveDatabase();
}

function getShopOrderNoteById(id: string): ShopOrderNote | null {
  const db = getDatabase();
  const note = db.prepare(`SELECT * FROM shop_order_notes WHERE id = ?`).get(id);

  if (!note) {
    return null;
  }

  return note as ShopOrderNote;
}

// ============================================
// PREP NOTE TEMPLATES
// ============================================

export interface ShopOrderNoteTemplate {
  id: string;
  user_id?: string;
  type: 'general_conditions' | 'general_notes' | 'fixture_notes';
  name: string;
  content: string;
  is_default: number;
  created_at: number;
  updated_at: number;
}

export function getAllNoteTemplates(type?: string): ShopOrderNoteTemplate[] {
  const db = getDatabase();

  let query = `SELECT * FROM shop_order_note_templates`;
  const params: any[] = [];

  if (type) {
    query += ` WHERE type = ?`;
    params.push(type);
  }

  query += ` ORDER BY is_default DESC, name ASC`;

  const templates = params.length > 0 ? db.prepare(query).all(...params) : db.prepare(query).all();

  return templates as ShopOrderNoteTemplate[];
}

export function getNoteTemplateById(id: string): ShopOrderNoteTemplate | null {
  const db = getDatabase();
  const template = db.prepare(`SELECT * FROM shop_order_note_templates WHERE id = ?`).get(id);

  if (!template) {
    return null;
  }

  return template as ShopOrderNoteTemplate;
}

export function getDefaultNoteTemplate(type: string): ShopOrderNoteTemplate | null {
  const db = getDatabase();
  const template = db
    .prepare(`SELECT * FROM shop_order_note_templates WHERE type = ? AND is_default = 1 LIMIT 1`)
    .get(type);

  if (!template) {
    return null;
  }

  return template as ShopOrderNoteTemplate;
}

export function createNoteTemplate(data: Partial<ShopOrderNoteTemplate>): ShopOrderNoteTemplate {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  // If setting as default, unset any existing defaults for this type
  if (data.is_default) {
    db.prepare(`UPDATE shop_order_note_templates SET is_default = 0 WHERE type = ?`).run(
      data.type!,
    );
  }

  db.prepare(
    `
    INSERT INTO shop_order_note_templates (
      id, user_id, type, name, content, is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    data.user_id || null,
    data.type!,
    data.name!,
    data.content || '',
    data.is_default || 0,
    now,
    now,
  );

  saveDatabase();
  return getNoteTemplateById(id)!;
}

export function updateNoteTemplate(
  id: string,
  updates: Partial<ShopOrderNoteTemplate>,
): ShopOrderNoteTemplate {
  const db = getDatabase();
  const now = Date.now();

  const template = getNoteTemplateById(id);
  if (!template) {
    throw new Error('Note template not found');
  }

  // If setting as default, unset any existing defaults for this type
  if (updates.is_default) {
    db.prepare(`UPDATE shop_order_note_templates SET is_default = 0 WHERE type = ?`).run(
      template.type,
    );
  }

  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.is_default !== undefined) {
    fields.push('is_default = ?');
    values.push(updates.is_default);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE shop_order_note_templates SET ${fields.join(', ')} WHERE id = ?`).run(
    ...values,
  );

  saveDatabase();
  return getNoteTemplateById(id)!;
}

export function deleteNoteTemplate(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM shop_order_note_templates WHERE id = ?').run(id);
  saveDatabase();
}
