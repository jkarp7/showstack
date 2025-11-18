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

class FileService {
  private readonly SHOWSTACK_VERSION = '1.0.0';
  private readonly APP_VERSION = '0.1.0-alpha';

  /**
   * Show open file dialog
   * @returns File path or null if canceled
   */
  async showOpenDialog(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Open ShowStack Project',
      filters: [
        { name: 'ShowStack Projects', extensions: ['showstack'] },
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
   * @returns File path or null if canceled
   */
  async showSaveDialog(defaultName?: string): Promise<string | null> {
    const result = await dialog.showSaveDialog({
      title: 'Save ShowStack Project',
      defaultPath: defaultName || 'Untitled Project',
      filters: [
        { name: 'ShowStack Projects', extensions: ['showstack'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    // Ensure .showstack extension
    let filePath = result.filePath;
    if (!filePath.endsWith('.showstack')) {
      filePath += '.showstack';
    }

    return filePath;
  }

  /**
   * Export current database to .showstack file
   * @param filePath Destination file path
   */
  async exportProject(filePath: string): Promise<void> {
    try {
      const db = getDatabase();

      // Update project's updated_at timestamp
      db.run('UPDATE projects SET updated_at = ? WHERE id = ?', [
        Date.now(),
        'default-project'
      ]);

      // Export database as binary
      const data = db.export();

      // Write to file
      writeFileSync(filePath, data);

      // Save to current working database as well
      saveDatabase();

      console.log('✅ Project exported to:', filePath);
    } catch (error) {
      console.error('❌ Error exporting project:', error);
      throw new Error(`Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import .showstack file and replace current database
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

      // Query project info
      const projectResult = importedDb.exec('SELECT id, name FROM projects LIMIT 1');
      const projectId = projectResult[0]?.values[0]?.[0] as string || 'default-project';
      const projectName = projectResult[0]?.values[0]?.[1] as string || 'Untitled Project';

      // Close the temporary database
      importedDb.close();

      // Write the imported data to the main database file
      const dbPath = join(app.getPath('userData'), 'showstack.db');
      writeFileSync(dbPath, buffer);

      // Reload the in-memory database to reflect the imported data
      await reloadDatabase();

      console.log('✅ Project imported from:', filePath);

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
      db.run('DELETE FROM preferences');
      db.run('DELETE FROM projects');

      // Create new default project
      const projectId = 'default-project';
      db.run(
        'INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [projectId, 'Untitled Project', Date.now(), Date.now()]
      );

      // Save to disk
      saveDatabase();

      console.log('✅ Created new project:', projectId);

      return projectId;
    } catch (error) {
      console.error('❌ Error creating new project:', error);
      throw new Error(`Failed to create new project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate .showstack file format
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
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('projects', 'fixtures', 'preferences')"
      );

      if (!tables[0] || tables[0].values.length < 3) {
        db.close();
        return {
          valid: false,
          error: 'Invalid ShowStack file. Required tables are missing.'
        };
      }

      // Get project info
      let projectName = 'Unknown Project';
      try {
        const projectResult = db.exec('SELECT name FROM projects LIMIT 1');
        projectName = projectResult[0]?.values[0]?.[0] as string || 'Unknown Project';
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
   * Get the filename from a file path
   * @param filePath Full file path
   * @returns Just the filename
   */
  getFileName(filePath: string): string {
    return basename(filePath, '.showstack');
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
