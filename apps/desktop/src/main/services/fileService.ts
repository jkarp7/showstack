// @ts-nocheck
// TODO: Remove @ts-nocheck — this file predates strict typing and has widespread `any` usage.
// Tracked for cleanup in a dedicated refactor pass; removing it now would require typing
// all sql.js result shapes, better-sqlite3 pragma returns, and dynamic import helpers.
import { dialog, app } from 'electron';
import { readFileSync, writeFileSync, existsSync, unlinkSync, copyFileSync, renameSync } from 'fs';
import BetterSQLite from 'better-sqlite3';
import { join, basename } from 'path';
import initSqlJs, { Database } from 'sql.js';
import { getDatabase, saveDatabase, replaceProjectDatabase, databaseManager } from '../database';
import { formatCopyTimestamp } from '../database/queries/projects';
import { logger } from '../utils/logger';

export interface ProjectImportResult {
  success: boolean;
  projectId?: string;
  projectName?: string;
  error?: string;
  warnings?: string[];
  autoStacked?: boolean; // true when a same-ID import was automatically added to the family stack
  conflict?: {
    exists: boolean;
    existingProject?: {
      id: string;
      name: string;
      updated_at: number;
    };
    importedProject?: {
      id: string;
      name: string;
      updated_at: number;
    };
  };
}

export interface ProjectConflictResolution {
  action: 'replace' | 'keep-both' | 'cancel';
  projectId: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  version?: string;
  projectName?: string;
}

// Unified file extension for all ShowStack projects
export const FILE_EXTENSION = 'ss';

// Well-known project ID used for single-file (legacy) project databases.
// Kept as a named constant so it can be grepped and updated consistently.
const DEFAULT_PROJECT_ID = 'default-project';

// Legacy file extensions (for backward compatibility)
export const LEGACY_EXTENSIONS = {
  PRODUCTION: 'ssp', // ShowStack:Lighting (legacy)
  MANAGER: 'ssm', // ShowStack:Manager (legacy)
  DESIGN: 'ssd', // ShowStack:Design (legacy)
} as const;

export type ModuleType = keyof typeof LEGACY_EXTENSIONS;

class FileService {
  private readonly SHOWSTACK_VERSION = '1.0.0';
  private readonly APP_VERSION = '0.1.0-alpha';

  /**
   * Get all ShowStack file extensions (current + legacy for backward compatibility)
   */
  private getAllExtensions(): string[] {
    return [FILE_EXTENSION, ...Object.values(LEGACY_EXTENSIONS)];
  }

  /**
   * Get extension for a specific module (always returns unified .ss extension)
   */
  getExtensionForModule(module: ModuleType): string {
    return FILE_EXTENSION;
  }

  /**
   * Show open file dialog
   * @returns File path or null if canceled
   */
  async showOpenDialog(): Promise<string | null> {
    const extensions = this.getAllExtensions();

    const result = await dialog.showOpenDialog({
      title: 'Open ShowStack Project',
      filters: [
        { name: 'ShowStack Projects', extensions },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  }

  /**
   * Show save file dialog
   * @param defaultName Default filename
   * @param module Module type (for legacy compatibility, no longer used)
   * @returns File path or null if canceled
   */
  async showSaveDialog(
    defaultName?: string,
    module: ModuleType = 'PRODUCTION',
  ): Promise<string | null> {
    const extensions = this.getAllExtensions();

    const result = await dialog.showSaveDialog({
      title: 'Save ShowStack Project',
      defaultPath: defaultName || 'Untitled Project',
      filters: [
        { name: 'ShowStack Project', extensions: [FILE_EXTENSION] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    // Ensure correct extension
    let filePath = result.filePath;
    const hasValidExtension = extensions.some((ext) => filePath.endsWith(`.${ext}`));

    if (!hasValidExtension) {
      filePath += `.${FILE_EXTENSION}`;
    }

    return filePath;
  }

  /**
   * Export current PROJECT database to ShowStack file (.ss)
   * IMPORTANT: Only exports project data, never exports app data (licenses, settings)
   * @param filePath Destination file path
   */
  async exportProject(filePath: string): Promise<void> {
    try {
      const db = getDatabase(); // Gets project database only

      // Update project's updated_at timestamp - try both table types
      // Uses better-sqlite3 API: prepare().get() / prepare().run()
      try {
        // Each project DB contains exactly one project, so LIMIT 1 without WHERE
        // is intentional here — we're detecting whether the file is a prep-project
        // or a regular project, not selecting a specific row by ID.
        // ORDER BY updated_at DESC is defensive: ensures deterministic results if
        // a file ever contains more than one prep row (e.g. from a bad migration).
        const prepRow = db
          .prepare('SELECT id FROM prep_projects ORDER BY updated_at DESC LIMIT 1')
          .get() as { id: string } | undefined;

        if (prepRow?.id) {
          db.prepare('UPDATE prep_projects SET updated_at = ? WHERE id = ?').run(
            Date.now(),
            prepRow.id,
          );
        } else {
          db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(
            Date.now(),
            DEFAULT_PROJECT_ID,
          );
        }
      } catch (error) {
        // Ignore update errors, continue with export
      }

      // Export ONLY project database as binary
      const data = db.export();

      // Write to file
      writeFileSync(filePath, data);

      // Save to current working project database as well
      saveDatabase();

      logger.info('Project exported successfully (app data preserved separately)');
    } catch (error) {
      logger.error('Error exporting project:', error);
      throw new Error(
        `Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Export a single project by ID as a .ss file.
   * Shows a save dialog, then creates a copy of the project database containing
   * only the rows for the specified project (all other projects are deleted from
   * the copy — the live database is never modified).
   *
   * Checkpoints the WAL, copies the physical database file to a temp path,
   * strips all other projects' rows from the copy, then atomically renames it
   * to the final destination. The live database is never modified.
   *
   * @param projectId  The UUID of the project to export
   * @param projectName  Used as the default filename suggestion
   * @returns The path written to, or null if the user cancelled
   */
  async exportProjectById(projectId: string, projectName: string): Promise<string | null> {
    // Show save dialog first so user can cancel before we do any work
    const filePath = await this.showSaveDialog(projectName);
    if (!filePath) return null;

    const tmpPath = `${filePath}.tmp`;
    // Declared outside the try block so the catch block can close it before
    // unlinking — on Windows, deleting an open file handle throws EBUSY.
    let backupDb: BetterSQLite.Database | null = null;

    try {
      const db = getDatabase();

      // Paranoid check: verify the project still exists after the dialog returned.
      // The user may have deleted it in another window while the save dialog was open.
      const projectExists = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
      if (!projectExists) {
        throw new Error(`Project ${projectId} not found in database`);
      }

      // Checkpoint WAL so the physical .db file is fully up to date before we copy it.
      // wal_checkpoint(FULL) returns [{busy, log, checkpointed}] in WAL mode, or an
      // empty array in journal mode (safe to skip). When busy > 0 the checkpoint is
      // incomplete, but SQLite still guarantees a consistent copy because the WAL file
      // is included alongside the .db — so we warn and proceed rather than hard-failing.
      // A busy checkpoint is common on a loaded system (concurrent IPC calls, renderer
      // query loop) and should not prevent the user from exporting their project.
      const ckptResult = db.pragma('wal_checkpoint(FULL)') as Array<{
        busy: number;
        log: number;
        checkpointed: number;
      }>;
      if (ckptResult.length > 0) {
        const ckpt = ckptResult[0];
        if (ckpt.busy > 0 || ckpt.checkpointed < ckpt.log) {
          logger.warn(
            `WAL checkpoint incomplete (busy=${ckpt.busy}, log=${ckpt.log}, checkpointed=${ckpt.checkpointed}) — export will proceed but WAL frames may not be flushed`,
          );
        }
      }

      // Get the path to the physical project database file
      const { projectDbPath } = databaseManager.getPaths();

      // Copy the physical file to a temp path (never touching the live DB)
      copyFileSync(projectDbPath, tmpPath);

      // Open the copy with better-sqlite3 and strip all other projects' data
      backupDb = new BetterSQLite(tmpPath);

      // Disable FK enforcement so we can delete in any order
      backupDb.pragma('foreign_keys = OFF');

      // Remove all projects except the one being exported
      backupDb.prepare('DELETE FROM projects WHERE id != ?').run(projectId);

      // Remove orphaned rows from any table with a project_id FK column
      const tables: string[] = backupDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all()
        .map((r: any) => r.name);

      for (const table of tables) {
        if (table === 'projects') continue;
        const cols: string[] = backupDb.pragma(`table_info(${table})`).map((c: any) => c.name);
        if (cols.includes('project_id')) {
          backupDb.prepare(`DELETE FROM "${table}" WHERE project_id != ?`).run(projectId);
        }
      }

      // Also purge all prep/shop-order module data — these tables use their own
      // id/prep_project_id FKs (not project_id), so they aren't caught by the loop above.
      // Discovered dynamically so new migrations don't require updating this list.
      const prepAndShopTables: string[] = backupDb
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'prep_%' OR name LIKE 'shop_order_%')",
        )
        .all()
        .map((r: any) => r.name);
      for (const table of prepAndShopTables) {
        backupDb.prepare(`DELETE FROM "${table}"`).run();
      }

      // VACUUM to compact the file (removes deleted rows from disk)
      backupDb.exec('VACUUM');
      backupDb.close();
      backupDb = null;

      // Atomically rename tmp → final destination (same filesystem, no double-copy)
      renameSync(tmpPath, filePath);

      logger.info(`Project ${projectId} exported to ${filePath}`);
      return filePath;
    } catch (error) {
      try {
        // Close backupDb before unlinking — on Windows an open handle causes EBUSY
        backupDb?.close();
        if (existsSync(tmpPath)) unlinkSync(tmpPath);
      } catch (_) {
        /* ignore cleanup error */
      }
      logger.error('Error exporting project by ID:', error);
      throw new Error(
        `Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Import ShowStack file (.ss or legacy formats) - MERGE into existing database
   * IMPORTANT: Only imports project data, NEVER touches app data (licenses, settings)
   * @param filePath Source file path
   * @returns Import result (may include conflict information)
   */
  async importProject(filePath: string): Promise<ProjectImportResult> {
    try {
      // Check if file exists
      if (!existsSync(filePath)) {
        return {
          success: false,
          error: `File not found: ${filePath}`,
        };
      }

      // Validate file first
      const validation = await this.validateFile(filePath);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Read the file
      const buffer = readFileSync(filePath);

      // Initialize sql.js and load the database
      const SQL = await initSqlJs();
      const importedDb = new SQL.Database(buffer);

      // Query project info - try both prep_projects and projects tables
      let projectId = DEFAULT_PROJECT_ID;
      let projectName = 'Untitled Project';
      let importedUpdatedAt = Date.now();

      try {
        // First try prep_projects table (for Prep module files)
        const prepResult = importedDb.exec(
          'SELECT id, production_name, updated_at FROM prep_projects LIMIT 1',
        );
        if (prepResult[0]?.values[0]?.[0]) {
          projectId = prepResult[0].values[0][0] as string;
          projectName = (prepResult[0].values[0][1] as string) || 'Untitled Project';
          importedUpdatedAt = (prepResult[0].values[0][2] as number) || Date.now();
        } else {
          // Fall back to projects table (for Production/Manager files)
          const projectResult = importedDb.exec(
            'SELECT id, name, updated_at FROM projects LIMIT 1',
          );
          projectId = (projectResult[0]?.values[0]?.[0] as string) || DEFAULT_PROJECT_ID;
          projectName = (projectResult[0]?.values[0]?.[1] as string) || 'Untitled Project';
          importedUpdatedAt = (projectResult[0]?.values[0]?.[2] as number) || Date.now();
        }
      } catch (error) {
        // Use defaults if we can't get project info
      }

      // Close the temporary database (we'll reopen it if needed)
      importedDb.close();

      // Check if project already exists in current database
      const currentDb = getDatabase();
      let existingProject = null;

      try {
        // Use better-sqlite3 API: prepare().get() returns a plain object or undefined
        const existingRow = currentDb
          .prepare('SELECT id, name, updated_at FROM projects WHERE id = ?')
          .get(projectId) as { id: string; name: string; updated_at: number } | undefined;

        if (existingRow) {
          existingProject = existingRow;
        } else {
          // Check prep_projects table
          const existingPrepRow = currentDb
            .prepare(
              'SELECT id, production_name AS name, updated_at FROM prep_projects WHERE id = ?',
            )
            .get(projectId) as { id: string; name: string; updated_at: number } | undefined;

          if (existingPrepRow) {
            existingProject = existingPrepRow;
          }
        }
      } catch (error) {
        // Ignore errors checking for existing project
      }

      // If project exists, auto-stack the import into the same family (no conflict dialog)
      if (existingProject) {
        logger.info('📚 Same-ID import detected — auto-stacking into family:', projectId);
        const { v4: uuidv4 } = await import('uuid');
        const newProjectId = uuidv4();

        // Enforce flat-tree invariant: root_project_id must always point to a root
        // (a project with root_project_id = NULL). If the existing project is itself
        // a copy, walk up to find its root.
        const existingFull = currentDb
          .prepare('SELECT root_project_id FROM projects WHERE id = ?')
          .get(existingProject.id) as { root_project_id: string | null } | undefined;
        const rootId = existingFull?.root_project_id ?? existingProject.id;

        logger.info(
          `📚 Stacking under root: ${rootId} (existing.root_project_id: ${existingFull?.root_project_id ?? 'null'})`,
        );

        const timestampedName = `${projectName} \u2014 ${formatCopyTimestamp(Date.now())}`;

        const importResult = await this.mergeImportedProject(
          buffer,
          newProjectId,
          timestampedName,
          projectId, // originalProjectId for column remapping
          rootId, // rootProjectId to inject
        );

        logger.info('📚 Auto-stack result:', JSON.stringify(importResult));

        return {
          ...importResult,
          autoStacked: true,
        };
      }

      // No conflict - import the project by merging
      const importResult = await this.mergeImportedProject(buffer, projectId, projectName);

      return importResult;
    } catch (error) {
      logger.error('Error importing project:', error);
      return {
        success: false,
        error: `Failed to import project: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Resolve an import conflict
   * @param filePath Source file path
   * @param resolution How to resolve (replace, keep-both, cancel)
   * @returns Import result
   */
  async resolveImportConflict(
    filePath: string,
    resolution: ProjectConflictResolution,
  ): Promise<ProjectImportResult> {
    if (resolution.action === 'cancel') {
      return {
        success: false,
        error: 'Import cancelled by user',
      };
    }

    try {
      // Read the file
      const buffer = readFileSync(filePath);
      const SQL = await initSqlJs();
      const importedDb = new SQL.Database(buffer);

      // Get project info
      const projectId = resolution.projectId;
      let projectName = 'Untitled Project';

      try {
        const prepResult = importedDb.exec(
          'SELECT production_name FROM prep_projects WHERE id = ?',
          [projectId],
        );
        if (prepResult[0]?.values[0]?.[0]) {
          projectName = prepResult[0].values[0][0] as string;
        } else {
          const projectResult = importedDb.exec('SELECT name FROM projects WHERE id = ?', [
            projectId,
          ]);
          projectName = (projectResult[0]?.values[0]?.[0] as string) || 'Untitled Project';
        }
      } catch (error) {
        // Use default
      }

      importedDb.close();

      if (resolution.action === 'replace') {
        // Delete existing project and import with same ID
        logger.info('🔄 Replacing existing project:', projectId);
        await this.deleteExistingProject(projectId);
        return await this.mergeImportedProject(buffer, projectId, projectName);
      } else if (resolution.action === 'keep-both') {
        // Import with new ID
        logger.info('➕ Importing as new project (keep both)');
        const { v4: uuidv4 } = await import('uuid');
        const newProjectId = uuidv4();
        const newProjectName = `${projectName} (2)`;
        return await this.mergeImportedProject(buffer, newProjectId, newProjectName, projectId);
      }

      return {
        success: false,
        error: 'Invalid resolution action',
      };
    } catch (error) {
      logger.error('Error resolving import conflict:', error);
      return {
        success: false,
        error: `Failed to resolve conflict: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Delete existing project and all related data
   * @param projectId Project ID to delete
   */
  private async deleteExistingProject(projectId: string): Promise<void> {
    const db = getDatabase();

    // Check if it's a prep project or regular project (better-sqlite3 API)
    const isPrepProject =
      db.prepare('SELECT id FROM prep_projects WHERE id = ?').get(projectId) != null;

    if (isPrepProject) {
      // Delete prep project (foreign keys will cascade)
      db.prepare('DELETE FROM prep_projects WHERE id = ?').run(projectId);
    } else {
      // Delete regular project (foreign keys will cascade)
      db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
    }

    saveDatabase();
  }

  /**
   * Merge imported project into current database
   * @param buffer Imported database file buffer
   * @param targetProjectId ID to use for the imported project
   * @param targetProjectName Name to use for the imported project
   * @param originalProjectId Original project ID (if different from target, for ID remapping)
   * @param rootProjectId root_project_id to assign (for auto-stacking into a family)
   * @returns Import result
   */
  private async mergeImportedProject(
    buffer: Uint8Array,
    targetProjectId: string,
    targetProjectName: string,
    originalProjectId?: string,
    rootProjectId?: string,
  ): Promise<ProjectImportResult> {
    try {
      const SQL = await initSqlJs();
      const importedDb = new SQL.Database(buffer);
      const currentDb = getDatabase();

      // Determine whether this is a prep project or a regular production project.
      // We must check using the specific sourceProjectId — NOT just "any prep row exists" —
      // because exported .ss files may contain stale prep_projects rows from other projects
      // that weren't cleaned up during export (they don't have a project_id FK column).
      const sourceProjectId = originalProjectId || targetProjectId;
      const needsIdRemapping = sourceProjectId !== targetProjectId;
      let isPrepProject = false;
      try {
        const prepCheck = importedDb.exec('SELECT id FROM prep_projects WHERE id = ?', [
          sourceProjectId,
        ]);
        isPrepProject = (prepCheck[0]?.values.length ?? 0) > 0;
      } catch (_) {
        // prep_projects table doesn't exist in this file — definitely not a prep project
        isPrepProject = false;
      }

      // Pre-compute the live schema OUTSIDE of the transaction.
      // Calling db.pragma() inside a transaction callback is unreliable in better-sqlite3
      // (pragmas are not transactional in SQLite) and can return an empty result set,
      // which would cause all columns to be filtered out and the INSERT to silently fail.
      const liveProjectCols = new Set<string>(
        (currentDb.pragma('table_info(projects)') as Array<{ name: string }>).map((c) => c.name),
      );

      // Wrap the entire import in a transaction so it's atomic
      const doImport = currentDb.transaction((): string[] => {
        if (isPrepProject) {
          // Import prep project (sync — transaction callback must be sync)
          this.importPrepProjectSync(
            importedDb,
            currentDb,
            sourceProjectId,
            targetProjectId,
            targetProjectName,
            needsIdRemapping,
          );
          return [];
        } else {
          // Import regular project; collect and return any row-skip warnings
          return this.importRegularProjectSync(
            importedDb,
            currentDb,
            sourceProjectId,
            targetProjectId,
            targetProjectName,
            needsIdRemapping,
            rootProjectId,
            liveProjectCols,
          );
        }
      });

      const importWarnings = doImport();

      importedDb.close();
      saveDatabase();

      logger.info('Project merged successfully:', targetProjectId);
      return {
        success: true,
        projectId: targetProjectId,
        projectName: targetProjectName,
        ...(importWarnings.length > 0 && { warnings: importWarnings }),
      };
    } catch (error) {
      logger.error('Error merging project:', error);
      throw error;
    }
  }

  /**
   * Import a prep project from imported database (sync, for use inside a transaction)
   */
  private importPrepProjectSync(
    importedDb: Database,
    currentDb: Database,
    sourceProjectId: string,
    targetProjectId: string,
    targetProjectName: string,
    needsIdRemapping: boolean,
  ): void {
    // Get prep project data
    const projectResult = importedDb.exec('SELECT * FROM prep_projects WHERE id = ?', [
      sourceProjectId,
    ]);
    if (!projectResult[0] || projectResult[0].values.length === 0) {
      throw new Error('Prep project not found in imported file');
    }

    const columns = projectResult[0].columns;
    const values = projectResult[0].values[0];
    const projectData: any = {};
    columns.forEach((col, idx) => {
      projectData[col] = values[idx];
    });

    // Update ID and name
    projectData.id = targetProjectId;
    projectData.production_name = targetProjectName;
    projectData.updated_at = Date.now();

    // Insert prep project (better-sqlite3 API: prepare().run())
    const cols = Object.keys(projectData)
      .map((c) => `"${c}"`)
      .join(', ');
    const placeholders = Object.keys(projectData)
      .map(() => '?')
      .join(', ');
    const vals = Object.values(projectData);
    currentDb.prepare(`INSERT INTO prep_projects (${cols}) VALUES (${placeholders})`).run(...vals);

    // TODO: Implement full prep-project child-table import with ID remapping.
    // Currently only the prep_projects row itself is imported; the following
    // related tables are intentionally skipped until this is implemented:
    //   • prep_sections    (section definitions)
    //   • prep_equipment_items  (line items per section)
    //   • prep_revisions   (revision snapshots)
    //   • prep_notes       (freeform notes)
    // Callers importing a prep project will receive the project shell but
    // none of its child data. Tracked for a dedicated prep-import pass.
  }

  /**
   * Import a regular project from imported database (sync, for use inside a transaction)
   */
  private importRegularProjectSync(
    importedDb: Database,
    currentDb: Database,
    sourceProjectId: string,
    targetProjectId: string,
    targetProjectName: string,
    needsIdRemapping: boolean,
    rootProjectId?: string,
    liveProjectCols?: Set<string>,
  ): string[] {
    const warnings: string[] = [];
    // Get project data
    const projectResult = importedDb.exec('SELECT * FROM projects WHERE id = ?', [sourceProjectId]);
    if (!projectResult[0] || projectResult[0].values.length === 0) {
      throw new Error('Project not found in imported file');
    }

    const columns = projectResult[0].columns;
    const values = projectResult[0].values[0];
    const projectData: any = {};
    columns.forEach((col, idx) => {
      projectData[col] = values[idx];
    });

    // Update ID and name
    projectData.id = targetProjectId;
    projectData.name = targetProjectName;
    projectData.updated_at = Date.now();

    // Inject root_project_id for family stacking (overrides whatever was in the imported file)
    projectData.root_project_id = rootProjectId ?? projectData.root_project_id ?? null;

    // Filter projectData to only columns that exist in the live DB's projects table.
    // liveProjectCols is pre-computed OUTSIDE the transaction in mergeImportedProject.
    // If not provided (shouldn't happen), skip filtering rather than calling pragma here.
    if (liveProjectCols && liveProjectCols.size > 0) {
      for (const key of Object.keys(projectData)) {
        if (!liveProjectCols.has(key)) {
          logger.warn(`Skipping unknown projects column during import: ${key}`);
          delete projectData[key];
        }
      }
    }

    // Insert project row (better-sqlite3 API: prepare().run(...spreadArray))
    const cols = Object.keys(projectData)
      .map((c) => `"${c}"`)
      .join(', ');
    const placeholders = Object.keys(projectData)
      .map(() => '?')
      .join(', ');
    const vals = Object.values(projectData);
    currentDb.prepare(`INSERT INTO projects (${cols}) VALUES (${placeholders})`).run(...vals);

    // Dynamically import all tables that have a project_id column.
    // This covers fixtures, user_preferences, dimmer_racks, pd_racks,
    // infrastructure_equipment, shop_order_*, etc. without hard-coding each one.
    const importedTables: Array<{ name: string }> = importedDb
      .exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .flatMap((res) => res.values.map((v) => ({ name: v[0] as string })));

    for (const { name: table } of importedTables) {
      if (table === 'projects') continue; // already inserted

      // Skip tables that don't exist in the live DB (schema version skew or future tables)
      const liveTableExists = currentDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(table);
      if (!liveTableExists) {
        const msg = `Skipped unknown table during import: "${table}"`;
        logger.warn(msg);
        warnings.push(msg);
        continue;
      }

      // Check if the table has a project_id column in the imported DB
      const colInfo = importedDb.exec(`PRAGMA table_info("${table}")`);
      if (!colInfo[0]) continue;
      const colNames = colInfo[0].values.map((v) => v[1] as string);
      if (!colNames.includes('project_id')) continue;

      // Fetch all rows belonging to this project from the imported DB
      const rowsResult = importedDb.exec(`SELECT * FROM "${table}" WHERE project_id = ?`, [
        sourceProjectId,
      ]);
      if (!rowsResult[0] || rowsResult[0].values.length === 0) continue;

      const rowCols = rowsResult[0].columns;
      for (const rowValues of rowsResult[0].values) {
        const rowData: any = {};
        rowCols.forEach((col, idx) => {
          rowData[col] = rowValues[idx];
        });

        // Remap project_id to the target
        rowData.project_id = targetProjectId;

        const rCols = Object.keys(rowData)
          .map((c) => `"${c}"`)
          .join(', ');
        const rPlaceholders = Object.keys(rowData)
          .map(() => '?')
          .join(', ');
        const rVals = Object.values(rowData);

        try {
          const result = currentDb
            .prepare(`INSERT OR IGNORE INTO "${table}" (${rCols}) VALUES (${rPlaceholders})`)
            .run(...rVals);
          // INSERT OR IGNORE silently drops the row on any constraint violation.
          // Since we just generated a fresh project UUID, a PK conflict on a child
          // row indicates a real problem (duplicate IDs) and should not go unnoticed.
          if (result.changes === 0) {
            const msg = `Row silently ignored during import into "${table}" — possible duplicate ID`;
            logger.warn(msg);
            warnings.push(msg);
          }
        } catch (err) {
          // Catch both .prepare() errors (table doesn't exist in live DB) and
          // .run() errors (constraint violations, type mismatches, etc.)
          // These must NOT propagate — a child-table failure should never roll back
          // the parent project row that was already successfully inserted.
          const msg = `Could not import row into "${table}" (skipping): ${(err as Error)?.message}`;
          logger.warn(msg);
          warnings.push(msg);
        }
      }
    }

    return warnings;
  }

  /**
   * Create a new empty project (clear all project data)
   * IMPORTANT: Only clears project data, NEVER touches app data (licenses, settings)
   * @returns New project ID
   */
  async createNewProject(): Promise<string> {
    try {
      const db = getDatabase(); // Gets project database only

      // Clear all PROJECT data (app data is in separate database)
      // Use better-sqlite3 API: prepare().run()
      db.prepare('DELETE FROM fixtures').run();
      db.prepare('DELETE FROM user_preferences').run();
      db.prepare('DELETE FROM projects').run();

      // Also clear prep module data if it exists
      const prepTables = [
        'prep_equipment_items',
        'prep_revisions',
        'prep_notes',
        'prep_sections',
        'prep_projects',
        'prep_note_templates',
      ];
      for (const table of prepTables) {
        try {
          db.prepare(`DELETE FROM "${table}"`).run();
        } catch (_) {
          // Ignore errors if prep tables don't exist
        }
      }

      // Create new default project
      const projectId = DEFAULT_PROJECT_ID;
      db.prepare('INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
        projectId,
        'Untitled Project',
        Date.now(),
        Date.now(),
      );

      // Save to disk
      saveDatabase();

      logger.info('New project created (app data preserved)');

      return projectId;
    } catch (error) {
      logger.error('Error creating new project:', error);
      throw new Error(
        `Failed to create new project: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Validate ShowStack file format (.ss or legacy formats)
   * @param filePath File to validate
   * @returns Validation result
   */
  async validateFile(filePath: string): Promise<FileValidationResult> {
    try {
      // Check if file exists
      if (!existsSync(filePath)) {
        return {
          valid: false,
          error: 'File not found',
        };
      }

      // Read file
      const buffer = readFileSync(filePath);

      // Try to open as SQLite database
      const SQL = await initSqlJs();
      let db: Database;

      try {
        db = new SQL.Database(buffer);
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid file format. This does not appear to be a ShowStack project file.',
        };
      }

      // Check if it has the required tables
      const tables = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('projects', 'fixtures', 'user_preferences')",
      );

      if (!tables[0] || tables[0].values.length < 3) {
        db.close();
        return {
          valid: false,
          error: 'Invalid ShowStack file. Required tables are missing.',
        };
      }

      // Get project info - try both prep_projects and projects tables
      let projectName = 'Unknown Project';
      try {
        // First try prep_projects table (for Prep module files)
        const prepResult = db.exec('SELECT production_name FROM prep_projects LIMIT 1');
        if (prepResult[0]?.values[0]?.[0]) {
          projectName = prepResult[0].values[0][0] as string;
        } else {
          // Fall back to projects table (for Production/Manager files)
          const projectResult = db.exec('SELECT name FROM projects LIMIT 1');
          projectName = (projectResult[0]?.values[0]?.[0] as string) || 'Unknown Project';
        }
      } catch (error) {
        // Ignore if we can't get project name
      }

      db.close();

      return {
        valid: true,
        version: this.SHOWSTACK_VERSION,
        projectName,
      };
    } catch (error) {
      return {
        valid: false,
        error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get the filename from a file path (without extension)
   * @param filePath Full file path
   * @returns Just the filename without extension
   */
  getFileName(filePath: string): string {
    const filename = basename(filePath);
    const extensions = this.getAllExtensions();

    // Remove any ShowStack extension
    for (const ext of extensions) {
      if (filename.endsWith(`.${ext}`)) {
        return filename.slice(0, -(ext.length + 1));
      }
    }

    // If no ShowStack extension found, just return the basename
    return filename;
  }

  /**
   * Check if a file exists
   * @param filePath File path to check
   * @returns True if file exists
   */
  fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }
}

export const fileService = new FileService();
