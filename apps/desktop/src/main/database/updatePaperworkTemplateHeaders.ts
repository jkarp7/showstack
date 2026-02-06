// @ts-nocheck
/**
 * Update existing paperwork templates to reference the default header template
 */

import { getAppDatabase, saveAppDatabase } from './index';

export function updatePaperworkTemplateHeaders(): void {
  console.log('🔄 Updating paperwork templates with default header reference...');

  const db = getAppDatabase();

  try {
    // Update all system paperwork templates to use the default header
    db.prepare(
      `UPDATE paperwork_templates
       SET header_template_id = 'default-paperwork-header'
       WHERE is_system = 1 AND (header_template_id IS NULL OR header_template_id = '')`,
    ).run();

    saveAppDatabase(db);
    console.log('✅ Updated paperwork templates with default header');
  } catch (error) {
    console.error('❌ Error updating paperwork templates:', error);
    // Don't throw - this is a non-critical update
  }
}
