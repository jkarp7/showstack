import { getAppDatabase, saveAppDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Database query functions for Paperwork Templates
 * Stored in app database as user preferences (not project-specific)
 */

export interface PaperworkTemplateRow {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  report_type: string;
  header_template_id?: string;
  footer_template_id?: string;
  column_config: string; // JSON
  organization_config: string; // JSON
  page_setup: string; // JSON
  is_system: number;
  created_at: number;
  updated_at: number;
}

export interface PaperworkTemplateInput {
  name: string;
  description?: string;
  reportType: string;
  headerTemplateId?: string;
  footerTemplateId?: string;
  columns: any[];
  organization: any;
  pageSetup: any;
  isSystem?: boolean;
}

/**
 * Get all paperwork templates (optionally filtered by report type)
 */
export function getAllPaperworkTemplates(reportType?: string): any[] {
  const db = getAppDatabase();

  let query = `SELECT * FROM paperwork_templates`;

  if (reportType) {
    query += ` WHERE report_type = ?`;
  }

  query += ` ORDER BY is_system DESC, updated_at DESC`;

  const stmt = db.prepare(query);
  const rows = (reportType ? stmt.all(reportType) : stmt.all()) as Record<string, unknown>[];

  return rows.map((template) => {
    // Parse JSON fields and convert to camelCase for frontend
    return {
      id: template.id,
      userId: template.user_id,
      name: template.name,
      description: template.description,
      reportType: template.report_type,
      headerTemplateId: template.header_template_id,
      footerTemplateId: template.footer_template_id,
      columns: JSON.parse(template.column_config as string),
      organization: JSON.parse(template.organization_config as string),
      pageSetup: JSON.parse(template.page_setup as string),
      isSystem: Boolean(template.is_system),
      created_at: template.created_at,
      updated_at: template.updated_at,
    };
  });
}

/**
 * Get system templates only
 */
export function getSystemPaperworkTemplates(): any[] {
  const db = getAppDatabase();

  const rows = db
    .prepare(`SELECT * FROM paperwork_templates WHERE is_system = 1 ORDER BY report_type, name`)
    .all() as Record<string, unknown>[];

  return rows.map((template) => {
    return {
      id: template.id,
      userId: template.user_id,
      name: template.name,
      description: template.description,
      reportType: template.report_type,
      headerTemplateId: template.header_template_id,
      footerTemplateId: template.footer_template_id,
      columns: JSON.parse(template.column_config as string),
      organization: JSON.parse(template.organization_config as string),
      pageSetup: JSON.parse(template.page_setup as string),
      isSystem: Boolean(template.is_system),
      created_at: template.created_at,
      updated_at: template.updated_at,
    };
  });
}

/**
 * Get a single paperwork template by ID
 */
export function getPaperworkTemplateById(id: string): any | null {
  const db = getAppDatabase();
  const template = db.prepare(`SELECT * FROM paperwork_templates WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;

  if (!template) {
    return null;
  }

  return {
    id: template.id,
    userId: template.user_id,
    name: template.name,
    description: template.description,
    reportType: template.report_type,
    headerTemplateId: template.header_template_id,
    footerTemplateId: template.footer_template_id,
    columns: JSON.parse(template.column_config as string),
    organization: JSON.parse(template.organization_config as string),
    pageSetup: JSON.parse(template.page_setup as string),
    isSystem: Boolean(template.is_system),
    created_at: template.created_at,
    updated_at: template.updated_at,
  };
}

/**
 * Create a new paperwork template
 */
export function createPaperworkTemplate(data: PaperworkTemplateInput): any {
  const db = getAppDatabase();
  const id = uuidv4();
  const now = Date.now();

  db.prepare(
    `
    INSERT INTO paperwork_templates (
      id, user_id, name, description, report_type,
      header_template_id, footer_template_id,
      column_config, organization_config, page_setup,
      is_system, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    null, // user_id
    data.name,
    data.description || null,
    data.reportType,
    data.headerTemplateId || null,
    data.footerTemplateId || null,
    JSON.stringify(data.columns),
    JSON.stringify(data.organization),
    JSON.stringify(data.pageSetup),
    data.isSystem ? 1 : 0,
    now,
    now,
  );

  saveAppDatabase();
  return getPaperworkTemplateById(id)!;
}

/**
 * Update a paperwork template
 */
export function updatePaperworkTemplate(
  id: string,
  updates: Partial<PaperworkTemplateInput>,
  allowSystemUpdate: boolean = false,
): any {
  const db = getAppDatabase();
  const now = Date.now();

  const template = getPaperworkTemplateById(id);
  if (!template) {
    throw new Error('Paperwork template not found');
  }

  // System templates cannot be modified (but we can duplicate them)
  // Exception: During migrations, we allow system updates
  if (template.isSystem && !allowSystemUpdate) {
    throw new Error('Cannot modify system templates. Please duplicate first.');
  }

  // Build dynamic update query
  const updateFields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    updateFields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.description !== undefined) {
    updateFields.push('description = ?');
    values.push(updates.description);
  }

  if (updates.headerTemplateId !== undefined) {
    updateFields.push('header_template_id = ?');
    values.push(updates.headerTemplateId);
  }

  if (updates.footerTemplateId !== undefined) {
    updateFields.push('footer_template_id = ?');
    values.push(updates.footerTemplateId);
  }

  if (updates.columns !== undefined) {
    updateFields.push('column_config = ?');
    values.push(JSON.stringify(updates.columns));
  }

  if (updates.organization !== undefined) {
    updateFields.push('organization_config = ?');
    values.push(JSON.stringify(updates.organization));
  }

  if (updates.pageSetup !== undefined) {
    updateFields.push('page_setup = ?');
    values.push(JSON.stringify(updates.pageSetup));
  }

  if (updateFields.length > 0) {
    updateFields.push('updated_at = ?');
    values.push(now);

    const query = `UPDATE paperwork_templates SET ${updateFields.join(', ')} WHERE id = ?`;
    values.push(id);

    db.prepare(query).run(...values);
    saveAppDatabase();
  }

  return getPaperworkTemplateById(id)!;
}

/**
 * Delete a paperwork template
 */
export function deletePaperworkTemplate(id: string): void {
  const db = getAppDatabase();

  // Check if system template
  const template = getPaperworkTemplateById(id);
  if (template && template.isSystem) {
    throw new Error('Cannot delete system templates');
  }

  db.prepare('DELETE FROM paperwork_templates WHERE id = ?').run(id);
  saveAppDatabase();
}

/**
 * Duplicate a paperwork template
 */
export function duplicatePaperworkTemplate(id: string, newName?: string): any {
  const original = getPaperworkTemplateById(id);
  if (!original) {
    throw new Error('Template not found');
  }

  const duplicateName = newName || `${original.name} (Copy)`;

  return createPaperworkTemplate({
    name: duplicateName,
    description: original.description,
    reportType: original.reportType,
    headerTemplateId: original.headerTemplateId,
    footerTemplateId: original.footerTemplateId,
    columns: original.columns,
    organization: original.organization,
    pageSetup: original.pageSetup,
    isSystem: false, // Duplicates are never system templates
  });
}
