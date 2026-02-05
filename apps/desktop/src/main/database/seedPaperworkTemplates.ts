import { DEFAULT_PAPERWORK_TEMPLATES } from './defaultPaperworkTemplates';
import {
  getSystemPaperworkTemplates,
  createPaperworkTemplate,
  updatePaperworkTemplate
} from './queries/paperworkTemplates';

/**
 * Seed Paperwork Templates
 *
 * Seeds the database with default system templates if they don't exist.
 * Called during app initialization.
 */

/**
 * Seed system templates into the database
 * Idempotent - safe to call multiple times
 */
export async function seedPaperworkTemplates(): Promise<void> {
  try {
    console.log('🌱 Checking paperwork template seeding...');

    // Check if system templates already exist
    const existingSystemTemplates = getSystemPaperworkTemplates();

    if (existingSystemTemplates.length > 0) {
      console.log(`✅ System templates already seeded (${existingSystemTemplates.length} templates)`);
      return;
    }

    console.log('📝 Seeding system templates...');

    // Create all default templates
    let successCount = 0;
    let errorCount = 0;

    for (const templateData of DEFAULT_PAPERWORK_TEMPLATES) {
      try {
        createPaperworkTemplate(templateData);
        successCount++;
      } catch (error) {
        console.error(`Failed to seed template: ${templateData.name}`, error);
        errorCount++;
      }
    }

    if (errorCount > 0) {
      console.warn(`⚠️ Seeded ${successCount} templates with ${errorCount} errors`);
    } else {
      console.log(`✅ Successfully seeded ${successCount} system templates`);
    }
  } catch (error) {
    console.error('❌ Error seeding paperwork templates:', error);
    // Don't throw - seeding failure shouldn't prevent app from starting
  }
}

/**
 * Check if seeding is needed
 * Returns true if no system templates exist
 */
export function needsSeeding(): boolean {
  try {
    const systemTemplates = getSystemPaperworkTemplates();
    return systemTemplates.length === 0;
  } catch (error) {
    console.error('Error checking template seeding status:', error);
    return false;
  }
}

/**
 * Re-seed templates (use with caution - for development/testing only)
 * This will NOT delete existing templates, only add missing system templates
 */
export async function reseedMissingTemplates(): Promise<void> {
  try {
    console.log('🔄 Re-seeding missing system templates...');

    const existingSystemTemplates = getSystemPaperworkTemplates();
    const existingReportTypes = new Set(existingSystemTemplates.map(t => t.reportType));

    let addedCount = 0;

    for (const templateData of DEFAULT_PAPERWORK_TEMPLATES) {
      if (!existingReportTypes.has(templateData.reportType)) {
        try {
          createPaperworkTemplate(templateData);
          addedCount++;
          console.log(`  ✅ Added: ${templateData.name}`);
        } catch (error) {
          console.error(`  ❌ Failed to add: ${templateData.name}`, error);
        }
      }
    }

    if (addedCount > 0) {
      console.log(`✅ Added ${addedCount} missing system templates`);
    } else {
      console.log('✅ All system templates already exist');
    }
  } catch (error) {
    console.error('❌ Error re-seeding templates:', error);
  }
}

/**
 * Update system templates with latest column configurations
 * Useful for applying updates to column formats or defaults
 */
export async function updateSystemTemplates(): Promise<void> {
  try {
    console.log('🔄 Updating system templates with latest configurations...');

    const existingSystemTemplates = getSystemPaperworkTemplates();
    let updatedCount = 0;

    for (const existingTemplate of existingSystemTemplates) {
      // Find matching default template
      const defaultTemplate = DEFAULT_PAPERWORK_TEMPLATES.find(
        t => t.reportType === existingTemplate.reportType
      );

      if (defaultTemplate) {
        try {
          // Update with latest columns from defaults
          // Pass true to allow updating system templates during migration
          updatePaperworkTemplate(
            existingTemplate.id,
            { columns: defaultTemplate.columns },
            true // allowSystemUpdate
          );
          updatedCount++;
        } catch (error) {
          console.error(`  ❌ Failed to update: ${existingTemplate.name}`, error);
        }
      }
    }

    console.log(`✅ Updated ${updatedCount} system templates`);
  } catch (error) {
    console.error('❌ Error updating system templates:', error);
  }
}
