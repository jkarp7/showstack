import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Database query functions for ShowStack:Prep module
 * Handles shop orders, equipment items, sections, revisions, and notes
 */

// ============================================
// PREP PROJECTS
// ============================================

export interface PrepProject {
  id: string;
  user_id?: string;
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
  logo_url?: string;
  logo_storage_path?: string;
  disciplines: string; // JSON array
  current_revision: number;
  created_at: number;
  updated_at: number;
}

export function getAllPrepProjects(): PrepProject[] {
  const db = getDatabase();
  const result = db.exec(`SELECT * FROM prep_projects ORDER BY updated_at DESC`);

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map((row) => {
    const project: any = {};
    columns.forEach((col, idx) => {
      project[col] = row[idx];
    });
    return project as PrepProject;
  });
}

export function getPrepProjectById(id: string): PrepProject | null {
  const db = getDatabase();
  const result = db.exec(`SELECT * FROM prep_projects WHERE id = ?`, [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const project: any = {};
  columns.forEach((col, idx) => {
    project[col] = values[idx];
  });

  return project as PrepProject;
}

export function createPrepProject(data: Partial<PrepProject>): PrepProject {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  const disciplines = data.disciplines || JSON.stringify(['lighting']);
  const additionalContacts = data.additional_contacts || null;

  db.run(
    `
    INSERT INTO prep_projects (
      id, user_id, parent_project_id, production_name, venue, venue_city, venue_state,
      order_date, original_order_date,
      prep_start_date, prep_end_date, load_in_date, first_preview_date, opening_night_date, closing_date, load_out_date,
      gm_name, gm_company, gm_email, gm_phone,
      pm_name, pm_company, pm_email, pm_phone,
      ld_name, ld_email, ld_phone,
      ald_name, ald_email, ald_phone,
      pe_name, pe_email, pe_phone,
      additional_contacts, logo_url, logo_storage_path,
      disciplines, current_revision, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
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
      data.logo_url || null,
      data.logo_storage_path || null,
      disciplines,
      data.current_revision || 0,
      now,
      now,
    ]
  );

  saveDatabase();
  return getPrepProjectById(id)!;
}

export function updatePrepProject(id: string, updates: Partial<PrepProject>): PrepProject {
  const db = getDatabase();
  const now = Date.now();

  const allowedFields = [
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
  ];

  const fields = Object.keys(updates).filter((k) => allowedFields.includes(k));

  if (fields.length === 0) {
    return getPrepProjectById(id)!;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f]);

  db.run(
    `
    UPDATE prep_projects
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `,
    [...values, now, id]
  );

  saveDatabase();
  return getPrepProjectById(id)!;
}

export function deletePrepProject(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM prep_projects WHERE id = ?', [id]);
  saveDatabase();
}

// ============================================
// PREP SECTIONS
// ============================================

export interface PrepSection {
  id: string;
  prep_project_id: string;
  name: string;
  discipline: string;
  sort_order: number;
  page_break: number;
  created_at: number;
  updated_at: number;
}

export function getSectionsByProjectId(projectId: string): PrepSection[] {
  const db = getDatabase();
  const result = db.exec(
    `SELECT * FROM prep_sections WHERE prep_project_id = ? ORDER BY sort_order`,
    [projectId]
  );

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map((row) => {
    const section: any = {};
    columns.forEach((col, idx) => {
      section[col] = row[idx];
    });
    return section as PrepSection;
  });
}

export function createPrepSection(data: Partial<PrepSection>): PrepSection {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.run(
    `
    INSERT INTO prep_sections (
      id, prep_project_id, name, discipline, sort_order, page_break, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      data.prep_project_id!,
      data.name || 'Untitled Section',
      data.discipline || 'lighting',
      data.sort_order || 0,
      data.page_break ? 1 : 0,
      data.notes || null,
      now,
      now,
    ]
  );

  saveDatabase();
  return getPrepSectionById(id)!;
}

export function updatePrepSection(id: string, updates: Partial<PrepSection>): PrepSection {
  const db = getDatabase();
  const now = Date.now();

  const allowedFields = ['name', 'discipline', 'sort_order', 'page_break', 'notes'];
  const fields = Object.keys(updates).filter((k) => allowedFields.includes(k));

  if (fields.length === 0) {
    return getPrepSectionById(id)!;
  }

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => {
    if (f === 'page_break') {
      return updates[f] ? 1 : 0;
    }
    const value = updates[f];
    return value === undefined ? null : value;
  });

  db.run(
    `
    UPDATE prep_sections
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `,
    [...values, now, id]
  );

  saveDatabase();
  return getPrepSectionById(id)!;
}

export function deletePrepSection(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM prep_sections WHERE id = ?', [id]);
  saveDatabase();
}

function getPrepSectionById(id: string): PrepSection | null {
  const db = getDatabase();
  const result = db.exec(`SELECT * FROM prep_sections WHERE id = ?`, [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const section: any = {};
  columns.forEach((col, idx) => {
    section[col] = values[idx];
  });

  return section as PrepSection;
}

// ============================================
// PREP EQUIPMENT ITEMS
// ============================================

export interface PrepEquipmentItem {
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

export function getItemsBySectionId(sectionId: string): PrepEquipmentItem[] {
  const db = getDatabase();
  const result = db.exec(
    `SELECT * FROM prep_equipment_items WHERE section_id = ? ORDER BY sort_order`,
    [sectionId]
  );

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map((row) => {
    const item: any = {};
    columns.forEach((col, idx) => {
      item[col] = row[idx];
    });
    return item as PrepEquipmentItem;
  });
}

export function getItemsByProjectId(projectId: string): PrepEquipmentItem[] {
  const db = getDatabase();
  const result = db.exec(
    `
    SELECT i.* FROM prep_equipment_items i
    JOIN prep_sections s ON i.section_id = s.id
    WHERE s.prep_project_id = ?
    ORDER BY s.sort_order, i.sort_order
  `,
    [projectId]
  );

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map((row) => {
    const item: any = {};
    columns.forEach((col, idx) => {
      item[col] = row[idx];
    });
    return item as PrepEquipmentItem;
  });
}

export function createPrepEquipmentItem(data: Partial<PrepEquipmentItem>): PrepEquipmentItem {
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

  db.run(
    `
    INSERT INTO prep_equipment_items (
      id, section_id, description, active_qty, spare_qty, venue_qty,
      total_qty, venue_active, venue_spare, weight, power, notes,
      sort_order, added_in_revision, removed_in_revision, modified_in_revision,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
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
    ]
  );

  saveDatabase();
  return getPrepEquipmentItemById(id)!;
}

export function updatePrepEquipmentItem(
  id: string,
  updates: Partial<PrepEquipmentItem>
): PrepEquipmentItem {
  const db = getDatabase();
  const now = Date.now();

  // Get current item for recalculation
  const current = getPrepEquipmentItemById(id);
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

  const allowedFields = [
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
  ];

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

  db.run(
    `
    UPDATE prep_equipment_items
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `,
    [...values, now, id]
  );

  saveDatabase();
  return getPrepEquipmentItemById(id)!;
}

export function deletePrepEquipmentItem(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM prep_equipment_items WHERE id = ?', [id]);
  saveDatabase();
}

function getPrepEquipmentItemById(id: string): PrepEquipmentItem | null {
  const db = getDatabase();
  const result = db.exec(`SELECT * FROM prep_equipment_items WHERE id = ?`, [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const item: any = {};
  columns.forEach((col, idx) => {
    item[col] = values[idx];
  });

  return item as PrepEquipmentItem;
}

// ============================================
// PREP REVISIONS
// ============================================

export interface PrepRevision {
  id: string;
  prep_project_id: string;
  revision_number: number;
  revision_date: number;
  notes?: string;
  change_log: string; // JSON
  created_at: number;
  updated_at: number;
}

export function getRevisionsByProjectId(projectId: string): PrepRevision[] {
  const db = getDatabase();
  const result = db.exec(
    `SELECT * FROM prep_revisions WHERE prep_project_id = ? ORDER BY revision_number`,
    [projectId]
  );

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map((row) => {
    const revision: any = {};
    columns.forEach((col, idx) => {
      revision[col] = row[idx];
    });
    return revision as PrepRevision;
  });
}

export function createPrepRevision(data: Partial<PrepRevision>): PrepRevision {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  const changeLog = data.change_log || JSON.stringify([]);

  db.run(
    `
    INSERT INTO prep_revisions (
      id, prep_project_id, revision_number, revision_date, notes, change_log, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      data.prep_project_id!,
      data.revision_number!,
      data.revision_date || now,
      data.notes || null,
      changeLog,
      now,
      now,
    ]
  );

  saveDatabase();
  return getPrepRevisionById(id)!;
}

export function deletePrepRevision(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM prep_revisions WHERE id = ?', [id]);
  saveDatabase();
}

function getPrepRevisionById(id: string): PrepRevision | null {
  const db = getDatabase();
  const result = db.exec(`SELECT * FROM prep_revisions WHERE id = ?`, [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const revision: any = {};
  columns.forEach((col, idx) => {
    revision[col] = values[idx];
  });

  return revision as PrepRevision;
}

// ============================================
// PREP NOTES
// ============================================

export interface PrepNote {
  id: string;
  prep_project_id: string;
  type: string;
  section_id?: string;
  revision_num?: number;
  content: string;
  created_at: number;
  updated_at: number;
}

export function getNotesByProjectId(projectId: string, type?: string): PrepNote[] {
  const db = getDatabase();

  let query = `SELECT * FROM prep_notes WHERE prep_project_id = ?`;
  const params: any[] = [projectId];

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  query += ` ORDER BY created_at DESC`;

  const result = db.exec(query, params);

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map((row) => {
    const note: any = {};
    columns.forEach((col, idx) => {
      note[col] = row[idx];
    });
    return note as PrepNote;
  });
}

export function createPrepNote(data: Partial<PrepNote>): PrepNote {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.run(
    `
    INSERT INTO prep_notes (
      id, prep_project_id, type, section_id, revision_num, content, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      data.prep_project_id!,
      data.type!,
      data.section_id || null,
      data.revision_num || null,
      data.content || '',
      now,
      now,
    ]
  );

  saveDatabase();
  return getPrepNoteById(id)!;
}

export function updatePrepNote(id: string, content: string): PrepNote {
  const db = getDatabase();
  const now = Date.now();

  db.run(
    `
    UPDATE prep_notes
    SET content = ?, updated_at = ?
    WHERE id = ?
  `,
    [content, now, id]
  );

  saveDatabase();
  return getPrepNoteById(id)!;
}

export function deletePrepNote(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM prep_notes WHERE id = ?', [id]);
  saveDatabase();
}

function getPrepNoteById(id: string): PrepNote | null {
  const db = getDatabase();
  const result = db.exec(`SELECT * FROM prep_notes WHERE id = ?`, [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const note: any = {};
  columns.forEach((col, idx) => {
    note[col] = values[idx];
  });

  return note as PrepNote;
}

// ============================================
// PREP NOTE TEMPLATES
// ============================================

export interface PrepNoteTemplate {
  id: string;
  user_id?: string;
  type: 'general_conditions' | 'general_notes' | 'fixture_notes';
  name: string;
  content: string;
  is_default: number;
  created_at: number;
  updated_at: number;
}

export function getAllNoteTemplates(type?: string): PrepNoteTemplate[] {
  const db = getDatabase();

  let query = `SELECT * FROM prep_note_templates`;
  const params: any[] = [];

  if (type) {
    query += ` WHERE type = ?`;
    params.push(type);
  }

  query += ` ORDER BY is_default DESC, name ASC`;

  const result = db.exec(query, params);

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map((row) => {
    const template: any = {};
    columns.forEach((col, idx) => {
      template[col] = row[idx];
    });
    return template as PrepNoteTemplate;
  });
}

export function getNoteTemplateById(id: string): PrepNoteTemplate | null {
  const db = getDatabase();
  const result = db.exec(`SELECT * FROM prep_note_templates WHERE id = ?`, [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const template: any = {};
  columns.forEach((col, idx) => {
    template[col] = values[idx];
  });

  return template as PrepNoteTemplate;
}

export function getDefaultNoteTemplate(type: string): PrepNoteTemplate | null {
  const db = getDatabase();
  const result = db.exec(
    `SELECT * FROM prep_note_templates WHERE type = ? AND is_default = 1 LIMIT 1`,
    [type]
  );

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const template: any = {};
  columns.forEach((col, idx) => {
    template[col] = values[idx];
  });

  return template as PrepNoteTemplate;
}

export function createNoteTemplate(data: Partial<PrepNoteTemplate>): PrepNoteTemplate {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  // If setting as default, unset any existing defaults for this type
  if (data.is_default) {
    db.run(
      `UPDATE prep_note_templates SET is_default = 0 WHERE type = ?`,
      [data.type!]
    );
  }

  db.run(
    `
    INSERT INTO prep_note_templates (
      id, user_id, type, name, content, is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      data.user_id || null,
      data.type!,
      data.name!,
      data.content || '',
      data.is_default || 0,
      now,
      now,
    ]
  );

  saveDatabase();
  return getNoteTemplateById(id)!;
}

export function updateNoteTemplate(id: string, updates: Partial<PrepNoteTemplate>): PrepNoteTemplate {
  const db = getDatabase();
  const now = Date.now();

  const template = getNoteTemplateById(id);
  if (!template) {
    throw new Error('Note template not found');
  }

  // If setting as default, unset any existing defaults for this type
  if (updates.is_default) {
    db.run(
      `UPDATE prep_note_templates SET is_default = 0 WHERE type = ?`,
      [template.type]
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

  db.run(
    `UPDATE prep_note_templates SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  saveDatabase();
  return getNoteTemplateById(id)!;
}

export function deleteNoteTemplate(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM prep_note_templates WHERE id = ?', [id]);
  saveDatabase();
}
