/**
 * Migration Script: Table-Based Shop Order Format
 *
 * Migrates prep equipment items from the old revision tracking system
 * (added_in_revision, removed_in_revision, modified_in_revision)
 * to the new table-based system (revision_quantities, deleted_in_revision).
 *
 * This migration:
 * 1. Converts active_qty to revision_quantities JSON for each item
 * 2. Converts removed_in_revision to deleted_in_revision
 * 3. Keeps old columns for rollback safety
 *
 * Usage: Call this migration when updating to table-based shop order format
 */

import type { Database } from 'better-sqlite3';

export interface MigrationResult {
  success: boolean;
  itemsMigrated: number;
  errors: string[];
}

/**
 * Check if migration has already been run for a project
 */
export function hasMigrated(db: Database, projectId: string): boolean {
  const result = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM prep_equipment_items
       WHERE section_id IN (
         SELECT id FROM prep_sections WHERE prep_project_id = ?
       )
       AND revision_quantities IS NOT NULL`,
    )
    .get(projectId) as { count: number };

  return result.count > 0;
}

/**
 * Main migration function for a single project
 */
export function migrateProjectToTableFormat(db: Database, projectId: string): MigrationResult {
  const errors: string[] = [];
  let itemsMigrated = 0;

  // First, check if columns exist
  const tableInfo = db.prepare(`PRAGMA table_info(prep_equipment_items)`).all() as Array<{
    name: string;
  }>;
  const columnNames = tableInfo.map((col) => col.name);

  if (!columnNames.includes('revision_quantities')) {
    errors.push('revision_quantities column does not exist. Please update schema first.');
    return { success: false, itemsMigrated: 0, errors };
  }

  if (!columnNames.includes('deleted_in_revision')) {
    errors.push('deleted_in_revision column does not exist. Please update schema first.');
    return { success: false, itemsMigrated: 0, errors };
  }

  try {
    // Get project info
    const project = db
      .prepare('SELECT current_revision FROM prep_projects WHERE id = ?')
      .get(projectId) as { current_revision: number } | undefined;

    if (!project) {
      errors.push(`Project ${projectId} not found`);
      return { success: false, itemsMigrated: 0, errors };
    }

    const currentRevision = project.current_revision;

    // Get all items for this project
    const items = db
      .prepare(
        `SELECT ei.*
         FROM prep_equipment_items ei
         INNER JOIN prep_sections ps ON ei.section_id = ps.id
         WHERE ps.prep_project_id = ?`,
      )
      .all(projectId) as Array<{
      id: string;
      active_qty: number;
      added_in_revision: number | null;
      removed_in_revision: number | null;
      modified_in_revision: number | null;
    }>;

    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();

    try {
      for (const item of items) {
        const revisionQuantities: Record<number, number> = {};

        // Determine which revisions this item appears in
        if (item.added_in_revision !== null) {
          // Item was added in a specific revision
          const startRev = item.added_in_revision;
          const endRev = item.removed_in_revision ? item.removed_in_revision - 1 : currentRevision;

          // Populate quantities for all revisions the item exists in
          for (let rev = startRev; rev <= endRev; rev++) {
            revisionQuantities[rev] = item.active_qty;
          }
        } else {
          // Item exists from beginning (revision 0)
          const endRev = item.removed_in_revision ? item.removed_in_revision - 1 : currentRevision;

          for (let rev = 0; rev <= endRev; rev++) {
            revisionQuantities[rev] = item.active_qty;
          }
        }

        // Update item with new format
        db.prepare(
          `UPDATE prep_equipment_items
           SET revision_quantities = ?,
               deleted_in_revision = ?
           WHERE id = ?`,
        ).run(JSON.stringify(revisionQuantities), item.removed_in_revision, item.id);

        itemsMigrated++;
      }

      // Commit transaction
      db.prepare('COMMIT').run();

      return {
        success: true,
        itemsMigrated,
        errors: [],
      };
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      itemsMigrated: 0,
      errors,
    };
  }
}

/**
 * Migrate all projects in the database
 */
export function migrateAllProjectsToTableFormat(db: Database): {
  projectsMigrated: number;
  totalItems: number;
  failures: Array<{ projectId: string; error: string }>;
} {
  const projects = db.prepare('SELECT id FROM prep_projects').all() as Array<{ id: string }>;

  let projectsMigrated = 0;
  let totalItems = 0;
  const failures: Array<{ projectId: string; error: string }> = [];

  for (const project of projects) {
    // Skip if already migrated
    if (hasMigrated(db, project.id)) {
      console.log(`Project ${project.id} already migrated, skipping...`);
      continue;
    }

    const result = migrateProjectToTableFormat(db, project.id);
    if (result.success) {
      projectsMigrated++;
      totalItems += result.itemsMigrated;
      console.log(`✓ Migrated project ${project.id}: ${result.itemsMigrated} items`);
    } else {
      failures.push({
        projectId: project.id,
        error: result.errors.join(', '),
      });
      console.error(`✗ Failed to migrate project ${project.id}:`, result.errors);
    }
  }

  return {
    projectsMigrated,
    totalItems,
    failures,
  };
}

/**
 * Rollback migration for a project (restore old format)
 */
export function rollbackMigration(db: Database, projectId: string): MigrationResult {
  const errors: string[] = [];
  let itemsMigrated = 0;

  try {
    // Get all items for this project
    const items = db
      .prepare(
        `SELECT ei.*
         FROM prep_equipment_items ei
         INNER JOIN prep_sections ps ON ei.section_id = ps.id
         WHERE ps.prep_project_id = ?`,
      )
      .all(projectId) as Array<{
      id: string;
    }>;

    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // Clear new columns
      for (const item of items) {
        db.prepare(
          `UPDATE prep_equipment_items
           SET revision_quantities = NULL,
               deleted_in_revision = NULL
           WHERE id = ?`,
        ).run(item.id);

        itemsMigrated++;
      }

      // Commit transaction
      db.prepare('COMMIT').run();

      return {
        success: true,
        itemsMigrated,
        errors: [],
      };
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    errors.push(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      itemsMigrated: 0,
      errors,
    };
  }
}
