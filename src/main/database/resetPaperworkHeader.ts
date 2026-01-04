/**
 * Reset Paperwork Header Template
 * Deletes the existing default-paperwork-header template if it has the old layout (with page numbers)
 * so it can re-seed with updated layout
 */

import { deleteLayoutTemplate, getLayoutTemplateById, getLayoutElementsByTemplateId } from './queries/layoutTemplates';
import { getAppDatabase, saveAppDatabase } from './index';

export function resetPaperworkHeaderTemplate(): void {
  console.log('🔄 Checking if paperwork header template needs reset...');

  try {
    // Check if the template exists
    const template = getLayoutTemplateById('default-paperwork-header');

    if (!template) {
      console.log('✅ Default paperwork header template not found (will be seeded)');
      return;
    }

    // Get elements to check if it has the old layout
    const elements = getLayoutElementsByTemplateId('default-paperwork-header');

    // Check if template has old layout characteristics
    let needsReset = false;
    let resetReason = '';

    // Check 0: Too many elements (should only have 5: report title, show name, date, LD, venue)
    if (elements.length > 5) {
      needsReset = true;
      resetReason = `has ${elements.length} elements (expected 5, possible duplicates)`;
    }

    // Check 1: Has page number/total pages elements (old layout)
    const hasOldPageNumberElements = elements.some(element => {
      try {
        const config = JSON.parse(element.config);
        return config.fieldType === 'page_number' || config.fieldType === 'total_pages';
      } catch {
        return false;
      }
    });

    if (hasOldPageNumberElements) {
      needsReset = true;
      resetReason = 'has page number elements';
    }

    // Check 2: Template has wrong grid configuration (should be 3 rows, 120px height)
    if (template.grid_rows !== 3 || template.page_height !== 120) {
      needsReset = true;
      resetReason = resetReason
        ? `${resetReason}, has old grid configuration`
        : 'has old grid configuration';
    }

    // Check 3: LD or Venue elements are not on row 2 (old positioning)
    const ldElement = elements.find(element => {
      try {
        const config = JSON.parse(element.config);
        return config.fieldType === 'ld_name';
      } catch {
        return false;
      }
    });

    const venueElement = elements.find(element => {
      try {
        const config = JSON.parse(element.config);
        return config.fieldType === 'venue';
      } catch {
        return false;
      }
    });

    // New compact layout has LD and Venue on row 2
    if ((ldElement && ldElement.grid_row !== 2) || (venueElement && venueElement.grid_row !== 2)) {
      needsReset = true;
      resetReason = resetReason
        ? `${resetReason}, has old LD/Venue positioning`
        : 'has old LD/Venue positioning';
    }

    // Check 4: Has Associate LD element (removed in new layout)
    const hasAssociateLdElement = elements.some(element => {
      try {
        const config = JSON.parse(element.config);
        return config.fieldType === 'ald_name';
      } catch {
        return false;
      }
    });

    if (hasAssociateLdElement) {
      needsReset = true;
      resetReason = resetReason
        ? `${resetReason}, has Associate LD element`
        : 'has Associate LD element';
    }

    if (needsReset) {
      console.log(`🔄 Old layout detected (${resetReason}) - deleting to trigger re-seed...`);

      // First, clear foreign key references from paperwork_templates
      const db = getAppDatabase();
      db.run(
        `UPDATE paperwork_templates SET header_template_id = NULL WHERE header_template_id = ?`,
        ['default-paperwork-header']
      );
      saveAppDatabase();

      // Explicitly delete all elements first (should CASCADE but being extra thorough)
      db.run(
        `DELETE FROM page_layout_elements WHERE template_id = ?`,
        ['default-paperwork-header']
      );
      saveAppDatabase();

      // Now delete the template
      deleteLayoutTemplate('default-paperwork-header');
      console.log('✅ Successfully deleted old paperwork header template and all elements');
      console.log('   Template will be re-seeded with updated layout');
    } else {
      console.log('✅ Paperwork header template already has new layout - no reset needed');
    }
  } catch (error) {
    console.error('❌ Error checking/resetting paperwork header template:', error);
    // Don't throw - continue with app startup
  }
}
