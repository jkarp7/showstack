// @ts-nocheck
import { getAppDatabase, saveAppDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Database query functions for Page Layout Templates
 * Stored in app database as user preferences (not project-specific)
 */

export interface PageLayoutTemplate {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  page_type: string;
  grid_columns: number;
  grid_rows: number;
  grid_gap: number;
  page_width: number;
  page_height: number;
  is_default: number;
  created_at: number;
  updated_at: number;
}

export interface LayoutElement {
  id: string;
  template_id: string;
  element_type: string;
  config: string; // JSON
  grid_column: number;
  grid_row: number;
  column_span: number;
  row_span: number;
  layer: number;
  style: string; // JSON
  created_at: number;
  updated_at: number;
}

/**
 * Get all layout templates (optionally filtered by page type)
 */
export function getAllLayoutTemplates(pageType?: string): PageLayoutTemplate[] {
  const db = getAppDatabase();

  let query = `SELECT * FROM page_layout_templates`;
  const params: any[] = [];

  if (pageType) {
    query += ` WHERE page_type = ?`;
    params.push(pageType);
  }

  query += ` ORDER BY is_default DESC, updated_at DESC`;

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
    return template as PageLayoutTemplate;
  });
}

/**
 * Get a single layout template by ID
 */
export function getLayoutTemplateById(id: string): PageLayoutTemplate | null {
  const db = getAppDatabase();
  const result = db.exec(`SELECT * FROM page_layout_templates WHERE id = ?`, [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const values = result[0].values[0];

  const template: any = {};
  columns.forEach((col, idx) => {
    template[col] = values[idx];
  });

  return template as PageLayoutTemplate;
}

/**
 * Get all elements for a template
 */
export function getLayoutElementsByTemplateId(templateId: string): LayoutElement[] {
  const db = getAppDatabase();
  const result = db.exec(
    `SELECT * FROM page_layout_elements WHERE template_id = ? ORDER BY layer`,
    [templateId]
  );

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map((row) => {
    const element: any = {};
    columns.forEach((col, idx) => {
      element[col] = row[idx];
    });
    return element as LayoutElement;
  });
}

/**
 * Create a new layout template with its elements
 */
export function createLayoutTemplate(
  data: Partial<PageLayoutTemplate>,
  elements: Partial<LayoutElement>[]
): PageLayoutTemplate {
  const db = getAppDatabase();
  const id = uuidv4();
  const now = Date.now();

  // If setting as default, unset any existing defaults for this page type
  if (data.is_default) {
    db.prepare(
      `UPDATE page_layout_templates SET is_default = 0 WHERE page_type = ?`
    ).run(data.page_type!);
  }

  // Insert template
  db.prepare(
    `
    INSERT INTO page_layout_templates (
      id, user_id, name, description, page_type,
      grid_columns, grid_rows, grid_gap, page_width, page_height,
      is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    data.user_id || null,
    data.name || 'Untitled Layout',
    data.description || null,
    data.page_type!,
    data.grid_columns || 12,
    data.grid_rows || 20,
    data.grid_gap || 8,
    data.page_width || 816,
    data.page_height || 1056,
    data.is_default ? 1 : 0,
    now,
    now
  );

  // Insert elements
  const insertElementStmt = db.prepare(
    `
    INSERT INTO page_layout_elements (
      id, template_id, element_type, config,
      grid_column, grid_row, column_span, row_span,
      layer, style, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  );

  for (const element of elements) {
    const elementId = uuidv4();
    insertElementStmt.run(
      elementId,
      id,
      element.element_type!,
      element.config || '{}',
      element.grid_column!,
      element.grid_row!,
      element.column_span || 1,
      element.row_span || 1,
      element.layer || 0,
      element.style || '{}',
      now,
      now
    );
  }

  saveAppDatabase();
  return getLayoutTemplateById(id)!;
}

/**
 * Update a layout template and its elements
 */
export function updateLayoutTemplate(
  id: string,
  updates: Partial<PageLayoutTemplate>,
  elements?: Partial<LayoutElement>[]
): PageLayoutTemplate {
  const db = getAppDatabase();
  const now = Date.now();

  const template = getLayoutTemplateById(id);
  if (!template) {
    throw new Error('Layout template not found');
  }

  // If setting as default, unset any existing defaults for this page type
  if (updates.is_default) {
    db.prepare(
      `UPDATE page_layout_templates SET is_default = 0 WHERE page_type = ?`
    ).run(template.page_type);
  }

  // Update template metadata
  const allowedFields = [
    'name',
    'description',
    'grid_columns',
    'grid_rows',
    'grid_gap',
    'page_width',
    'page_height',
    'is_default',
  ];

  const fields = Object.keys(updates).filter((k) => allowedFields.includes(k));

  if (fields.length > 0) {
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      if (f === 'is_default') {
        return updates[f] ? 1 : 0;
      }
      return updates[f];
    });

    db.prepare(
      `UPDATE page_layout_templates SET ${setClause}, updated_at = ? WHERE id = ?`
    ).run(...values, now, id);
  }

  // If elements are provided, replace all elements
  if (elements !== undefined) {
    // Delete existing elements
    db.prepare('DELETE FROM page_layout_elements WHERE template_id = ?').run(id);

    // Insert new elements
    const insertElementStmt = db.prepare(
      `
      INSERT INTO page_layout_elements (
        id, template_id, element_type, config,
        grid_column, grid_row, column_span, row_span,
        layer, style, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    );

    for (const element of elements) {
      const elementId = element.id || uuidv4();
      insertElementStmt.run(
        elementId,
        id,
        element.element_type!,
        element.config || '{}',
        element.grid_column!,
        element.grid_row!,
        element.column_span || 1,
        element.row_span || 1,
        element.layer || 0,
        element.style || '{}',
        element.created_at || now,
        now
      );
    }
  }

  saveAppDatabase();
  return getLayoutTemplateById(id)!;
}

/**
 * Delete a layout template (elements deleted by CASCADE)
 */
export function deleteLayoutTemplate(id: string): void {
  const db = getAppDatabase();
  db.prepare('DELETE FROM page_layout_templates WHERE id = ?').run(id);
  saveAppDatabase();
}

/**
 * Get default template for a page type
 */
export function getDefaultLayoutTemplate(pageType: string): PageLayoutTemplate | null {
  const db = getAppDatabase();
  const result = db.exec(
    `SELECT * FROM page_layout_templates WHERE page_type = ? AND is_default = 1 LIMIT 1`,
    [pageType]
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

  return template as PageLayoutTemplate;
}
