// @ts-nocheck
/**
 * Seed function for default paperwork header layout template
 */

import { getAppDatabase, saveAppDatabase } from './index';
import { getDefaultPaperworkHeader } from './defaultPaperworkHeader';

export function seedPaperworkHeaderTemplate(): void {
  console.log('🌱 Checking paperwork header template seeding...');

  const db = getAppDatabase();

  try {
    // Check if default header already exists with elements
    const checkTemplateQuery = `SELECT id FROM page_layout_templates WHERE id = 'default-paperwork-header'`;
    const templateResult = db.exec(checkTemplateQuery);

    const templateExists = templateResult[0] && templateResult[0].values.length > 0;

    // Check if elements exist for the template
    let elementsExist = false;
    if (templateExists) {
      const checkElementsQuery = `SELECT COUNT(*) as count FROM page_layout_elements WHERE template_id = 'default-paperwork-header'`;
      const elementsResult = db.exec(checkElementsQuery);
      const elementCount = (elementsResult[0]?.values[0]?.[0] as number) || 0;
      elementsExist = elementCount > 0;
    }

    if (templateExists && elementsExist) {
      console.log('✅ Default paperwork header already seeded');
      return;
    }

    if (templateExists && !elementsExist) {
      console.log(
        '🌱 Re-seeding paperwork header elements (template exists but elements missing)...',
      );
    } else {
      console.log('🌱 Seeding default paperwork header template...');
    }

    const headerLayout = getDefaultPaperworkHeader();

    // Insert template only if it doesn't exist
    if (!templateExists) {
      db.prepare(
        `INSERT INTO page_layout_templates (
          id, user_id, name, description, page_type,
          grid_columns, grid_rows, grid_gap,
          page_width, page_height, is_default,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        headerLayout.template.id,
        headerLayout.template.user_id || null,
        headerLayout.template.name,
        headerLayout.template.description,
        headerLayout.template.page_type,
        headerLayout.template.grid_columns,
        headerLayout.template.grid_rows,
        headerLayout.template.grid_gap,
        headerLayout.template.page_width,
        headerLayout.template.page_height,
        headerLayout.template.is_default,
        headerLayout.template.created_at,
        headerLayout.template.updated_at,
      );
    }

    // Insert elements
    const insertElement = db.prepare(
      `INSERT INTO page_layout_elements (
        id, template_id, element_type, config,
        grid_column, grid_row, column_span, row_span,
        layer, style, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const element of headerLayout.elements) {
      insertElement.run(
        element.id,
        element.template_id,
        element.element_type,
        element.config,
        element.grid_column,
        element.grid_row,
        element.column_span,
        element.row_span,
        element.layer,
        element.style,
        element.created_at,
        element.updated_at,
      );
    }

    saveAppDatabase(db);
    console.log(
      `✅ Successfully seeded default paperwork header with ${headerLayout.elements.length} elements`,
    );
  } catch (error) {
    console.error('❌ Error seeding paperwork header template:', error);
    throw error;
  }
}
