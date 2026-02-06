import { getAppDatabase, saveAppDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

/**
 * Database query functions for Page Layout Templates
 * Stored in app database as user preferences (not project-specific)
 */

/**
 * Allowed fields for layout template updates.
 * Frozen to prevent runtime modification (security hardening).
 */
const LAYOUT_TEMPLATE_ALLOWED_FIELDS = Object.freeze([
  'name',
  'description',
  'grid_columns',
  'grid_rows',
  'grid_gap',
  'page_width',
  'page_height',
  'is_default',
] as const);

type LayoutTemplateAllowedField = (typeof LAYOUT_TEMPLATE_ALLOWED_FIELDS)[number];

function isLayoutTemplateAllowedField(field: string): field is LayoutTemplateAllowedField {
  return LAYOUT_TEMPLATE_ALLOWED_FIELDS.includes(field as LayoutTemplateAllowedField);
}

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

  if (pageType) {
    query += ` WHERE page_type = ?`;
  }

  query += ` ORDER BY is_default DESC, updated_at DESC`;

  const stmt = db.prepare(query);
  const rows = (pageType ? stmt.all(pageType) : stmt.all()) as PageLayoutTemplate[];

  return rows;
}

/**
 * Get a single layout template by ID
 */
export function getLayoutTemplateById(id: string): PageLayoutTemplate | null {
  const db = getAppDatabase();
  const template = db.prepare(`SELECT * FROM page_layout_templates WHERE id = ?`).get(id) as
    | PageLayoutTemplate
    | undefined;

  return template || null;
}

/**
 * Get all elements for a template
 */
export function getLayoutElementsByTemplateId(templateId: string): LayoutElement[] {
  const db = getAppDatabase();
  const rows = db
    .prepare(`SELECT * FROM page_layout_elements WHERE template_id = ? ORDER BY layer`)
    .all(templateId) as LayoutElement[];

  return rows;
}

/**
 * Create a new layout template with its elements
 */
export function createLayoutTemplate(
  data: Partial<PageLayoutTemplate>,
  elements: Partial<LayoutElement>[],
): PageLayoutTemplate {
  const db = getAppDatabase();
  const id = uuidv4();
  const now = Date.now();

  // If setting as default, unset any existing defaults for this page type
  if (data.is_default) {
    db.prepare(`UPDATE page_layout_templates SET is_default = 0 WHERE page_type = ?`).run(
      data.page_type!,
    );
  }

  // Use transaction to ensure template and elements are created atomically
  const createTemplateWithElements = db.transaction(() => {
    // Insert template
    db.prepare(
      `
      INSERT INTO page_layout_templates (
        id, user_id, name, description, page_type,
        grid_columns, grid_rows, grid_gap, page_width, page_height,
        is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
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
      now,
    );

    // Insert elements
    const insertElementStmt = db.prepare(
      `
      INSERT INTO page_layout_elements (
        id, template_id, element_type, config,
        grid_column, grid_row, column_span, row_span,
        layer, style, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
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
        now,
      );
    }
  });

  createTemplateWithElements();
  saveAppDatabase();
  return getLayoutTemplateById(id)!;
}

/**
 * Update a layout template and its elements
 */
export function updateLayoutTemplate(
  id: string,
  updates: Partial<PageLayoutTemplate>,
  elements?: Partial<LayoutElement>[],
): PageLayoutTemplate {
  const db = getAppDatabase();
  const now = Date.now();

  const template = getLayoutTemplateById(id);
  if (!template) {
    throw new Error('Layout template not found');
  }

  // If setting as default, unset any existing defaults for this page type
  if (updates.is_default) {
    db.prepare(`UPDATE page_layout_templates SET is_default = 0 WHERE page_type = ?`).run(
      template.page_type,
    );
  }

  // Update template metadata
  const fields = Object.keys(updates).filter(isLayoutTemplateAllowedField);

  if (fields.length > 0) {
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      if (f === 'is_default') {
        return updates[f] ? 1 : 0;
      }
      return updates[f];
    });

    db.prepare(`UPDATE page_layout_templates SET ${setClause}, updated_at = ? WHERE id = ?`).run(
      ...values,
      now,
      id,
    );
  }

  // If elements are provided, replace all elements using a transaction for atomicity
  if (elements !== undefined) {
    const replaceElements = db.transaction(() => {
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
      `,
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
          now,
        );
      }
    });

    replaceElements();
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
  const template = db
    .prepare(`SELECT * FROM page_layout_templates WHERE page_type = ? AND is_default = 1 LIMIT 1`)
    .get(pageType) as PageLayoutTemplate | undefined;

  return template || null;
}
