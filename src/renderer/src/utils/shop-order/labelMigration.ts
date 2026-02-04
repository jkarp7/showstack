/**
 * Label Migration Utility
 *
 * Migrates canvas-based label designs from localStorage to grid-based
 * layout templates in the database.
 */

import {
  loadLabelDesignsFromLocalStorage,
  convertLabelDesignToTemplate,
  clearLabelDesignsFromLocalStorage,
  getMigrationSummary,
  type CustomLabelDesign
} from './templateConverter';
import type { PageLayoutTemplate, PrintSectionType } from '../../types/shopOrder';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
  templateIds: string[];
}

/**
 * Migrate all label designs for a project from localStorage to database
 */
export async function migrateLabelDesigns(projectId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
    templateIds: []
  };

  try {
    // Load designs from localStorage
    const designs = loadLabelDesignsFromLocalStorage(projectId);

    if (designs.length === 0) {
      console.log('No label designs to migrate');
      return result;
    }

    console.log(`Migrating ${designs.length} label designs...`);

    // Convert and save each design
    for (const design of designs) {
      try {
        const converted = convertLabelDesignToTemplate(design);

        // Create template in database
        const templateId = await window.api.prep.layoutTemplates.create({
          user_id: undefined, // Project-specific
          name: converted.name,
          description: converted.description || `Migrated from ${design.labelType} label`,
          page_type: converted.pageType as PrintSectionType,
          grid_columns: converted.gridConfig.columns,
          grid_rows: converted.gridConfig.rows,
          grid_gap: converted.gridConfig.gridGap,
          page_width: converted.gridConfig.pageWidth,
          page_height: converted.gridConfig.pageHeight,
          is_default: false
        });

        // Save elements
        await window.api.prep.layoutTemplates.saveElements(templateId, converted.elements);

        result.migratedCount++;
        result.templateIds.push(templateId);

        console.log(`✓ Migrated: ${design.name} (${templateId})`);
      } catch (error) {
        result.failedCount++;
        result.errors.push(`Failed to migrate "${design.name}": ${error}`);
        result.success = false;
        console.error(`✗ Failed to migrate "${design.name}":`, error);
      }
    }

    // Clear localStorage after successful migration
    if (result.migratedCount > 0 && result.failedCount === 0) {
      clearLabelDesignsFromLocalStorage(projectId);
      console.log(`✅ Migration complete. Migrated ${result.migratedCount} designs.`);
    } else if (result.failedCount > 0) {
      console.warn(`⚠️ Migration completed with errors: ${result.migratedCount} succeeded, ${result.failedCount} failed.`);
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error('Migration failed:', error);
  }

  return result;
}

/**
 * Check if migration is needed for a project
 */
export function needsMigration(projectId: string): boolean {
  try {
    const designs = loadLabelDesignsFromLocalStorage(projectId);
    return designs.length > 0;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Get migration preview information
 */
export function getMigrationPreview(projectId: string): {
  needsMigration: boolean;
  designCount: number;
  summary: string;
} {
  const summary = getMigrationSummary(projectId);

  let summaryText = '';
  if (summary.totalDesigns === 0) {
    summaryText = 'No label designs to migrate.';
  } else {
    const parts: string[] = [];

    if (Object.keys(summary.byTemplate).length > 0) {
      Object.entries(summary.byTemplate).forEach(([template, count]) => {
        parts.push(`${count} ${template} design${count > 1 ? 's' : ''}`);
      });
    }

    if (summary.customDesigns > 0) {
      parts.push(`${summary.customDesigns} custom design${summary.customDesigns > 1 ? 's' : ''}`);
    }

    summaryText = `Found ${summary.totalDesigns} label design${summary.totalDesigns > 1 ? 's' : ''}: ${parts.join(', ')}`;
  }

  return {
    needsMigration: summary.totalDesigns > 0,
    designCount: summary.totalDesigns,
    summary: summaryText
  };
}

/**
 * Prompt user and perform migration if needed
 */
export async function promptAndMigrate(projectId: string): Promise<MigrationResult | null> {
  const preview = getMigrationPreview(projectId);

  if (!preview.needsMigration) {
    return null;
  }

  // Show confirmation dialog
  const confirmed = confirm(
    `Label Migration\n\n` +
    `${preview.summary}\n\n` +
    `These will be converted to the new grid-based label designer.\n\n` +
    `Original designs will be backed up in localStorage.\n\n` +
    `Proceed with migration?`
  );

  if (!confirmed) {
    console.log('Migration cancelled by user');
    return null;
  }

  // Perform migration
  const result = await migrateLabelDesigns(projectId);

  // Show result dialog
  if (result.success && result.failedCount === 0) {
    alert(
      `Migration Successful!\n\n` +
      `Migrated ${result.migratedCount} label design${result.migratedCount > 1 ? 's' : ''}.\n\n` +
      `Your labels are now available in the new grid-based designer.`
    );
  } else if (result.migratedCount > 0) {
    alert(
      `Migration Completed with Errors\n\n` +
      `Successfully migrated: ${result.migratedCount}\n` +
      `Failed: ${result.failedCount}\n\n` +
      `Errors:\n${result.errors.join('\n')}`
    );
  } else {
    alert(
      `Migration Failed\n\n` +
      `No designs were migrated.\n\n` +
      `Errors:\n${result.errors.join('\n')}`
    );
  }

  return result;
}
