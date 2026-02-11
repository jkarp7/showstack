// @ts-nocheck
/**
 * Update existing paperwork templates to reference the default header template
 */

import { getAppDatabase, saveAppDatabase } from './index';
import { logger } from '../utils/logger';

export function updatePaperworkTemplateHeaders(): void {
  logger.info('🔄 Updating paperwork templates with default header reference...');

  const db = getAppDatabase();

  try {
    // Update all system paperwork templates to use the default header
    db.prepare(
      `UPDATE paperwork_templates
       SET header_template_id = 'default-paperwork-header'
       WHERE is_system = 1 AND (header_template_id IS NULL OR header_template_id = '')`,
    ).run();

    saveAppDatabase(db);
    logger.info('✅ Updated paperwork templates with default header');
  } catch (error) {
    logger.error('❌ Error updating paperwork templates:', error);
    // Don't throw - this is a non-critical update
  }
}
