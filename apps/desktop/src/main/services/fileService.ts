import { dialog, app } from 'electron';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import initSqlJs, { Database } from 'sql.js';
import { getDatabase, saveDatabase, replaceProjectDatabase } from '../database';

export interface ProjectImportResult {
  success: boolean;
  projectId?: string;
  projectName?: string;
  error?: string;
  warnings?: string[];
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

// Legacy file extensions (for backward compatibility)
export const LEGACY_EXTENSIONS = {
  PRODUCTION: 'ssp',    // ShowStack:Lighting (legacy)
  MANAGER: 'ssm',       // ShowStack:Manager (legacy)
  DESIGN: 'ssd'         // ShowStack:Design (legacy)
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
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
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
  async showSaveDialog(defaultName?: string, module: ModuleType = 'PRODUCTION'): Promise<string | null> {
    const extensions = this.getAllExtensions();

    const result = await dialog.showSaveDialog({
      title: 'Save ShowStack Project',
      defaultPath: defaultName || 'Untitled Project',
      filters: [
        { name: 'ShowStack Project', extensions: [FILE_EXTENSION] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    // Ensure correct extension
    let filePath = result.filePath;
    const hasValidExtension = extensions.some(ext => filePath.endsWith(`.${ext}`));

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
      try {
        // Check if there's a prep project
        const isPrepProject = db.exec('SELECT id FROM prep_projects LIMIT 1')[0]?.values[0]?.[0];

        if (isPrepProject) {
          // Update prep_projects table
          db.run('UPDATE prep_projects SET updated_at = ? WHERE id = ?', [
            Date.now(),
            isPrepProject
          ]);
        } else {
          // Update projects table
          db.run('UPDATE projects SET updated_at = ? WHERE id = ?', [
            Date.now(),
            'default-project'
          ]);
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

      console.log('✅ Project exported successfully (app data preserved separately)');
    } catch (error) {
      console.error('Error exporting project:', error);
      throw new Error(`Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          error: `File not found: ${filePath}`
        };
      }

      // Validate file first
      const validation = await this.validateFile(filePath);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Read the file
      const buffer = readFileSync(filePath);

      // Initialize sql.js and load the database
      const SQL = await initSqlJs();
      const importedDb = new SQL.Database(buffer);

      // Query project info - try both prep_projects and projects tables
      let projectId = 'default-project';
      let projectName = 'Untitled Project';
      let importedUpdatedAt = Date.now();

      try {
        // First try prep_projects table (for Prep module files)
        const prepResult = importedDb.exec('SELECT id, production_name, updated_at FROM prep_projects LIMIT 1');
        if (prepResult[0]?.values[0]?.[0]) {
          projectId = prepResult[0].values[0][0] as string;
          projectName = prepResult[0].values[0][1] as string || 'Untitled Project';
          importedUpdatedAt = prepResult[0].values[0][2] as number || Date.now();
        } else {
          // Fall back to projects table (for Production/Manager files)
          const projectResult = importedDb.exec('SELECT id, name, updated_at FROM projects LIMIT 1');
          projectId = projectResult[0]?.values[0]?.[0] as string || 'default-project';
          projectName = projectResult[0]?.values[0]?.[1] as string || 'Untitled Project';
          importedUpdatedAt = projectResult[0]?.values[0]?.[2] as number || Date.now();
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
        // Check projects table first
        const existingResult = currentDb.exec('SELECT id, name, updated_at FROM projects WHERE id = ?', [projectId]);
        if (existingResult[0]?.values[0]) {
          existingProject = {
            id: existingResult[0].values[0][0] as string,
            name: existingResult[0].values[0][1] as string,
            updated_at: existingResult[0].values[0][2] as number
          };
        } else {
          // Check prep_projects table
          const existingPrepResult = currentDb.exec('SELECT id, production_name, updated_at FROM prep_projects WHERE id = ?', [projectId]);
          if (existingPrepResult[0]?.values[0]) {
            existingProject = {
              id: existingPrepResult[0].values[0][0] as string,
              name: existingPrepResult[0].values[0][1] as string,
              updated_at: existingPrepResult[0].values[0][2] as number
            };
          }
        }
      } catch (error) {
        // Ignore errors checking for existing project
      }

      // If project exists, return conflict info instead of importing
      if (existingProject) {
        console.log('⚠️ Project conflict detected:', projectId);
        return {
          success: false,
          conflict: {
            exists: true,
            existingProject,
            importedProject: {
              id: projectId,
              name: projectName,
              updated_at: importedUpdatedAt
            }
          }
        };
      }

      // No conflict - import the project by merging
      const importResult = await this.mergeImportedProject(buffer, projectId, projectName);

      return importResult;
    } catch (error) {
      console.error('❌ Error importing project:', error);
      return {
        success: false,
        error: `Failed to import project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Resolve an import conflict
   * @param filePath Source file path
   * @param resolution How to resolve (replace, keep-both, cancel)
   * @returns Import result
   */
  async resolveImportConflict(filePath: string, resolution: ProjectConflictResolution): Promise<ProjectImportResult> {
    if (resolution.action === 'cancel') {
      return {
        success: false,
        error: 'Import cancelled by user'
      };
    }

    try {
      // Read the file
      const buffer = readFileSync(filePath);
      const SQL = await initSqlJs();
      const importedDb = new SQL.Database(buffer);

      // Get project info
      let projectId = resolution.projectId;
      let projectName = 'Untitled Project';

      try {
        const prepResult = importedDb.exec('SELECT production_name FROM prep_projects WHERE id = ?', [projectId]);
        if (prepResult[0]?.values[0]?.[0]) {
          projectName = prepResult[0].values[0][0] as string;
        } else {
          const projectResult = importedDb.exec('SELECT name FROM projects WHERE id = ?', [projectId]);
          projectName = projectResult[0]?.values[0]?.[0] as string || 'Untitled Project';
        }
      } catch (error) {
        // Use default
      }

      importedDb.close();

      if (resolution.action === 'replace') {
        // Delete existing project and import with same ID
        console.log('🔄 Replacing existing project:', projectId);
        await this.deleteExistingProject(projectId);
        return await this.mergeImportedProject(buffer, projectId, projectName);
      } else if (resolution.action === 'keep-both') {
        // Import with new ID
        console.log('➕ Importing as new project (keep both)');
        const { v4: uuidv4 } = await import('uuid');
        const newProjectId = uuidv4();
        const newProjectName = `${projectName} (2)`;
        return await this.mergeImportedProject(buffer, newProjectId, newProjectName, projectId);
      }

      return {
        success: false,
        error: 'Invalid resolution action'
      };
    } catch (error) {
      console.error('❌ Error resolving import conflict:', error);
      return {
        success: false,
        error: `Failed to resolve conflict: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete existing project and all related data
   * @param projectId Project ID to delete
   */
  private async deleteExistingProject(projectId: string): Promise<void> {
    const db = getDatabase();

    // Check if it's a prep project or regular project
    const isPrepProject = db.exec('SELECT id FROM prep_projects WHERE id = ?', [projectId])[0]?.values.length > 0;

    if (isPrepProject) {
      // Delete prep project (foreign keys will cascade)
      db.run('DELETE FROM prep_projects WHERE id = ?', [projectId]);
    } else {
      // Delete regular project (foreign keys will cascade)
      db.run('DELETE FROM projects WHERE id = ?', [projectId]);
    }

    saveDatabase();
  }

  /**
   * Merge imported project into current database
   * @param buffer Imported database file buffer
   * @param targetProjectId ID to use for the imported project
   * @param targetProjectName Name to use for the imported project
   * @param originalProjectId Original project ID (if different from target, for ID remapping)
   * @returns Import result
   */
  private async mergeImportedProject(
    buffer: Uint8Array,
    targetProjectId: string,
    targetProjectName: string,
    originalProjectId?: string
  ): Promise<ProjectImportResult> {
    try {
      const SQL = await initSqlJs();
      const importedDb = new SQL.Database(buffer);
      const currentDb = getDatabase();

      const sourceProjectId = originalProjectId || targetProjectId;
      const needsIdRemapping = sourceProjectId !== targetProjectId;

      // Check if this is a prep project or regular project
      const isPrepProject = importedDb.exec('SELECT id FROM prep_projects LIMIT 1')[0]?.values.length > 0;

      if (isPrepProject) {
        // Import prep project
        await this.importPrepProject(importedDb, currentDb, sourceProjectId, targetProjectId, targetProjectName, needsIdRemapping);
      } else {
        // Import regular project
        await this.importRegularProject(importedDb, currentDb, sourceProjectId, targetProjectId, targetProjectName, needsIdRemapping);
      }

      importedDb.close();
      saveDatabase();

      console.log('✅ Project merged successfully:', targetProjectId);
      return {
        success: true,
        projectId: targetProjectId,
        projectName: targetProjectName
      };
    } catch (error) {
      console.error('❌ Error merging project:', error);
      throw error;
    }
  }

  /**
   * Import a prep project from imported database
   */
  private async importPrepProject(
    importedDb: Database,
    currentDb: Database,
    sourceProjectId: string,
    targetProjectId: string,
    targetProjectName: string,
    needsIdRemapping: boolean
  ): Promise<void> {
    // Get prep project data
    const projectResult = importedDb.exec('SELECT * FROM prep_projects WHERE id = ?', [sourceProjectId]);
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

    // Insert prep project
    const cols = Object.keys(projectData).join(', ');
    const placeholders = Object.keys(projectData).map(() => '?').join(', ');
    const vals = Object.values(projectData);
    currentDb.run(`INSERT INTO prep_projects (${cols}) VALUES (${placeholders})`, vals);

    // Import related data (sections, items, revisions, notes)
    // TODO: Implement full data import with ID remapping
    // For now, this is a basic implementation
  }

  /**
   * Import a regular project from imported database
   */
  private async importRegularProject(
    importedDb: Database,
    currentDb: Database,
    sourceProjectId: string,
    targetProjectId: string,
    targetProjectName: string,
    needsIdRemapping: boolean
  ): Promise<void> {
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

    // Insert project
    const cols = Object.keys(projectData).join(', ');
    const placeholders = Object.keys(projectData).map(() => '?').join(', ');
    const vals = Object.values(projectData);
    currentDb.run(`INSERT INTO projects (${cols}) VALUES (${placeholders})`, vals);

    // Import fixtures
    const fixturesResult = importedDb.exec('SELECT * FROM fixtures WHERE project_id = ?', [sourceProjectId]);
    if (fixturesResult[0] && fixturesResult[0].values.length > 0) {
      const fixtureCols = fixturesResult[0].columns;
      for (const fixtureValues of fixturesResult[0].values) {
        const fixtureData: any = {};
        fixtureCols.forEach((col, idx) => {
          fixtureData[col] = fixtureValues[idx];
        });

        // Remap project_id if needed
        fixtureData.project_id = targetProjectId;

        const cols = Object.keys(fixtureData).join(', ');
        const placeholders = Object.keys(fixtureData).map(() => '?').join(', ');
        const vals = Object.values(fixtureData);
        currentDb.run(`INSERT INTO fixtures (${cols}) VALUES (${placeholders})`, vals);
      }
    }

    // Import user preferences
    const prefsResult = importedDb.exec('SELECT * FROM user_preferences WHERE project_id = ?', [sourceProjectId]);
    if (prefsResult[0] && prefsResult[0].values.length > 0) {
      const prefCols = prefsResult[0].columns;
      for (const prefValues of prefsResult[0].values) {
        const prefData: any = {};
        prefCols.forEach((col, idx) => {
          prefData[col] = prefValues[idx];
        });

        // Remap project_id if needed
        prefData.project_id = targetProjectId;

        const cols = Object.keys(prefData).join(', ');
        const placeholders = Object.keys(prefData).map(() => '?').join(', ');
        const vals = Object.values(prefData);
        currentDb.run(`INSERT INTO user_preferences (${cols}) VALUES (${placeholders})`, vals);
      }
    }
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
      db.run('DELETE FROM fixtures');
      db.run('DELETE FROM user_preferences');
      db.run('DELETE FROM projects');

      // Also clear prep module data if it exists
      try {
        db.run('DELETE FROM prep_equipment_items');
        db.run('DELETE FROM prep_revisions');
        db.run('DELETE FROM prep_notes');
        db.run('DELETE FROM prep_sections');
        db.run('DELETE FROM prep_projects');
        db.run('DELETE FROM prep_note_templates');
      } catch (error) {
        // Ignore errors if prep tables don't exist
      }

      // Create new default project
      const projectId = 'default-project';
      db.run(
        'INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [projectId, 'Untitled Project', Date.now(), Date.now()]
      );

      // Save to disk
      saveDatabase();

      console.log('✅ New project created (app data preserved)');

      return projectId;
    } catch (error) {
      console.error('Error creating new project:', error);
      throw new Error(`Failed to create new project: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          error: 'File not found'
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
          error: 'Invalid file format. This does not appear to be a ShowStack project file.'
        };
      }

      // Check if it has the required tables
      const tables = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('projects', 'fixtures', 'user_preferences')"
      );

      if (!tables[0] || tables[0].values.length < 3) {
        db.close();
        return {
          valid: false,
          error: 'Invalid ShowStack file. Required tables are missing.'
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
          projectName = projectResult[0]?.values[0]?.[0] as string || 'Unknown Project';
        }
      } catch (error) {
        // Ignore if we can't get project name
      }

      db.close();

      return {
        valid: true,
        version: this.SHOWSTACK_VERSION,
        projectName
      };
    } catch (error) {
      return {
        valid: false,
        error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
