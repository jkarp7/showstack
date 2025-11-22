import { dialog, app } from 'electron';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import initSqlJs, { Database } from 'sql.js';
import { getDatabase, saveDatabase, reloadDatabase } from '../database';

export interface ProjectImportResult {
  success: boolean;
  projectId?: string;
  projectName?: string;
  error?: string;
  warnings?: string[];
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
  PRODUCTION: 'ssp',    // ShowStack:Production (legacy)
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
   * Export current database to ShowStack file (.ss)
   * @param filePath Destination file path
   */
  async exportProject(filePath: string): Promise<void> {
    try {
      const db = getDatabase();

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

      // Export database as binary
      const data = db.export();

      // Write to file
      writeFileSync(filePath, data);

      // Save to current working database as well
      saveDatabase();
    } catch (error) {
      console.error('Error exporting project:', error);
      throw new Error(`Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import ShowStack file (.ss or legacy formats) and replace current database
   * @param filePath Source file path
   * @returns Import result
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

      try {
        // First try prep_projects table (for Prep module files)
        const prepResult = importedDb.exec('SELECT id, production_name FROM prep_projects LIMIT 1');
        if (prepResult[0]?.values[0]?.[0]) {
          projectId = prepResult[0].values[0][0] as string;
          projectName = prepResult[0].values[0][1] as string || 'Untitled Project';
        } else {
          // Fall back to projects table (for Production/Manager files)
          const projectResult = importedDb.exec('SELECT id, name FROM projects LIMIT 1');
          projectId = projectResult[0]?.values[0]?.[0] as string || 'default-project';
          projectName = projectResult[0]?.values[0]?.[1] as string || 'Untitled Project';
        }
      } catch (error) {
        // Use defaults if we can't get project info
      }

      // Close the temporary database
      importedDb.close();

      // Write the imported data to the main database file
      const dbPath = join(app.getPath('userData'), 'showstack.db');
      writeFileSync(dbPath, buffer);

      // Reload the in-memory database to reflect the imported data
      await reloadDatabase();

      // Always update project name to match the filename (filename is source of truth)
      const filename = this.getFileName(filePath);
      if (projectName !== filename) {
        projectName = filename;

        // Update the project name in the database
        const db = getDatabase();

        // Determine if this is a prep project or regular project
        try {
          const isPrepProject = db.exec('SELECT id FROM prep_projects LIMIT 1')[0]?.values[0]?.[0];

          if (isPrepProject) {
            // Update prep_projects table
            db.run('UPDATE prep_projects SET production_name = ?, updated_at = ? WHERE id = ?', [
              projectName,
              Date.now(),
              projectId
            ]);
          } else {
            // Update projects table
            db.run('UPDATE projects SET name = ?, updated_at = ? WHERE id = ?', [
              projectName,
              Date.now(),
              projectId
            ]);
          }
          saveDatabase();
        } catch (error) {
          // Ignore update errors
        }
      }

      return {
        success: true,
        projectId,
        projectName
      };
    } catch (error) {
      console.error('❌ Error importing project:', error);
      return {
        success: false,
        error: `Failed to import project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a new empty project (reset database)
   * @returns New project ID
   */
  async createNewProject(): Promise<string> {
    try {
      const db = getDatabase();

      // Clear all data
      db.run('DELETE FROM fixtures');
      db.run('DELETE FROM user_preferences');
      db.run('DELETE FROM projects');

      // Create new default project
      const projectId = 'default-project';
      db.run(
        'INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [projectId, 'Untitled Project', Date.now(), Date.now()]
      );

      // Save to disk
      saveDatabase();

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
