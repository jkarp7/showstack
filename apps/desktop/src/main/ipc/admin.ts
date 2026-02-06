import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  getAllLayoutTemplates,
  getLayoutElementsByTemplateId,
  createLayoutTemplate,
  deleteLayoutTemplate,
  PageLayoutTemplate,
  LayoutElement,
} from '../database/queries/layoutTemplates';
import { seedDefaultPageLayouts } from '../database/seedDefaultLayouts';
import { getSetting, setSetting } from '../database/queries/settings';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

const SALT_ROUNDS = 10;
const DEFAULT_LAYOUTS_DIR = path.join(__dirname, '..', 'database', 'defaultLayouts');

/**
 * Admin Panel IPC Handlers
 * Provides secure access to admin-only operations like layout template management
 */
export function registerAdminHandlers(): void {
  // ============================================
  // PASSWORD & ACCESS CONTROL
  // ============================================

  /**
   * Verify admin password
   */
  ipcMain.handle('admin:verifyPassword', async (_event, password: string) => {
    try {
      // Validation
      if (!password || password.length === 0) {
        throw new ValidationError('Password is required', 'password', password);
      }

      return await errorHandler.executeWithRetry(async () => {
        const storedHash = await getSetting('admin_password_hash');

        // If no password is set, allow access (first time setup)
        if (!storedHash) {
          return { success: true, firstTime: true };
        }

        // Verify password
        const isValid = await bcrypt.compare(password, storedHash);
        return { success: isValid, firstTime: false };
      }, 'admin:verifyPassword');
    } catch (error) {
      console.error('Failed to verify admin password:', {
        operation: 'admin:verifyPassword',
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to verify password: ${error.message}`);
      }
      throw error;
    }
  });

  /**
   * Set admin password
   */
  ipcMain.handle('admin:setPassword', async (_event, password: string) => {
    try {
      // Validation
      if (!password || password.length < 4) {
        throw new ValidationError('Password must be at least 4 characters', 'password', password);
      }

      return await errorHandler.executeWithRetry(async () => {
        // Hash the password
        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        // Store the hash
        await setSetting('admin_password_hash', hash);

        return { success: true };
      }, 'admin:setPassword');
    } catch (error) {
      console.error('Failed to set admin password:', {
        operation: 'admin:setPassword',
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to save password: ${error.message}`);
      }
      throw error;
    }
  });

  /**
   * Check if admin password is set
   */
  ipcMain.handle('admin:hasPassword', async () => {
    try {
      return await errorHandler.executeWithRetry(async () => {
        const storedHash = await getSetting('admin_password_hash');
        return { hasPassword: !!storedHash };
      }, 'admin:hasPassword');
    } catch (error) {
      console.error('Failed to check admin password:', {
        operation: 'admin:hasPassword',
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to check password: ${error.message}`);
      }
      throw error;
    }
  });

  // ============================================
  // LAYOUT TEMPLATE EXPORT
  // ============================================

  /**
   * Export a single layout template to JSON
   */
  ipcMain.handle('admin:exportLayout', async (_event, templateId: string) => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (!mainWindow) {
        throw new Error('No active window');
      }

      // Get template and elements
      const templates = getAllLayoutTemplates();
      const template = templates.find((t) => t.id === templateId);

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const elements = getLayoutElementsByTemplateId(templateId);

      // Parse JSON strings in elements
      const parsedElements = elements.map((el) => ({
        ...el,
        config: typeof el.config === 'string' ? JSON.parse(el.config) : el.config,
        style: typeof el.style === 'string' ? JSON.parse(el.style) : el.style,
      }));

      // Create JSON structure
      const exportData = {
        template: {
          name: template.name,
          description: template.description,
          page_type: template.page_type,
          grid_columns: template.grid_columns,
          grid_rows: template.grid_rows,
          grid_gap: template.grid_gap,
          page_width: template.page_width,
          page_height: template.page_height,
          is_default: template.is_default,
        },
        elements: parsedElements.map((el) => ({
          element_type: el.element_type,
          config: el.config,
          grid_column: el.grid_column,
          grid_row: el.grid_row,
          column_span: el.column_span,
          row_span: el.row_span,
          layer: el.layer,
          style: el.style,
        })),
      };

      // Show save dialog
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Layout Template',
        defaultPath: `${template.page_type}_layout.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      // Write JSON file
      await fs.writeFile(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');

      return {
        success: true,
        filePath: result.filePath,
      };
    } catch (error) {
      console.error('Error exporting layout:', error);
      throw error;
    }
  });

  /**
   * Export all default layout templates to a directory
   */
  ipcMain.handle('admin:exportAllDefaultLayouts', async () => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (!mainWindow) {
        throw new Error('No active window');
      }

      // Show directory selection dialog
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Export Directory',
        properties: ['openDirectory', 'createDirectory'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const exportDir = result.filePaths[0];

      // Get all default templates
      const templates = getAllLayoutTemplates();
      const defaultTemplates = templates.filter((t) => t.is_default);

      let exportedCount = 0;

      for (const template of defaultTemplates) {
        const elements = getLayoutElementsByTemplateId(template.id);

        // Parse JSON strings in elements
        const parsedElements = elements.map((el) => ({
          ...el,
          config: typeof el.config === 'string' ? JSON.parse(el.config) : el.config,
          style: typeof el.style === 'string' ? JSON.parse(el.style) : el.style,
        }));

        // Create JSON structure
        const exportData = {
          template: {
            name: template.name,
            description: template.description,
            page_type: template.page_type,
            grid_columns: template.grid_columns,
            grid_rows: template.grid_rows,
            grid_gap: template.grid_gap,
            page_width: template.page_width,
            page_height: template.page_height,
            is_default: template.is_default,
          },
          elements: parsedElements.map((el) => ({
            element_type: el.element_type,
            config: el.config,
            grid_column: el.grid_column,
            grid_row: el.grid_row,
            column_span: el.column_span,
            row_span: el.row_span,
            layer: el.layer,
            style: el.style,
          })),
        };

        // Write to file
        const filePath = path.join(exportDir, `${template.page_type}_default_layout.json`);
        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
        exportedCount++;
      }

      return {
        success: true,
        count: exportedCount,
        directory: exportDir,
      };
    } catch (error) {
      console.error('Error exporting all default layouts:', error);
      throw error;
    }
  });

  // ============================================
  // LAYOUT TEMPLATE IMPORT
  // ============================================

  /**
   * Import layout templates from JSON files
   */
  ipcMain.handle('admin:importLayouts', async (_event, filePaths?: string[]) => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (!mainWindow) {
        throw new Error('No active window');
      }

      let selectedFiles = filePaths;

      // Show file selection dialog if no files provided
      if (!selectedFiles || selectedFiles.length === 0) {
        const result = await dialog.showOpenDialog(mainWindow, {
          title: 'Select Layout JSON Files',
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
          properties: ['openFile', 'multiSelections'],
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, canceled: true };
        }

        selectedFiles = result.filePaths;
      }

      let importedCount = 0;
      const errors: string[] = [];

      for (const filePath of selectedFiles) {
        try {
          // Read and parse JSON file
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(fileContent);

          // Validate structure
          if (!data.template || !data.elements) {
            errors.push(
              `${path.basename(filePath)}: Invalid structure (missing template or elements)`,
            );
            continue;
          }

          // Create template and elements
          const templateData: Partial<PageLayoutTemplate> = {
            name: data.template.name,
            description: data.template.description,
            page_type: data.template.page_type,
            grid_columns: data.template.grid_columns,
            grid_rows: data.template.grid_rows,
            grid_gap: data.template.grid_gap,
            page_width: data.template.page_width,
            page_height: data.template.page_height,
            is_default: data.template.is_default,
          };

          const elementsData: Partial<LayoutElement>[] = data.elements.map((el: any) => ({
            element_type: el.element_type,
            config: JSON.stringify(el.config),
            grid_column: el.grid_column,
            grid_row: el.grid_row,
            column_span: el.column_span,
            row_span: el.row_span,
            layer: el.layer || 0,
            style: JSON.stringify(el.style),
          }));

          createLayoutTemplate(templateData, elementsData);
          importedCount++;
        } catch (err) {
          errors.push(
            `${path.basename(filePath)}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          );
        }
      }

      return {
        success: importedCount > 0,
        count: importedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error importing layouts:', error);
      throw error;
    }
  });

  /**
   * Reset layouts to factory defaults
   */
  ipcMain.handle('admin:resetLayoutsToFactory', async () => {
    try {
      return await errorHandler.executeWithRetry(async () => {
        // Delete all existing default layouts
        const templates = getAllLayoutTemplates();
        const defaultTemplates = templates.filter((t) => t.is_default);

        for (const template of defaultTemplates) {
          deleteLayoutTemplate(template.id);
        }

        // Re-seed default layouts
        seedDefaultPageLayouts();

        return { success: true };
      }, 'admin:resetLayoutsToFactory');
    } catch (error) {
      console.error('Failed to reset layouts to factory:', {
        operation: 'admin:resetLayoutsToFactory',
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to reset layouts: ${error.message}`);
      }
      throw new Error(
        `Unable to reset layouts: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  });

  /**
   * Get list of JSON files in default layouts directory
   */
  ipcMain.handle('admin:getDefaultLayoutFiles', async () => {
    try {
      // Check if directory exists
      try {
        await fs.access(DEFAULT_LAYOUTS_DIR);
      } catch {
        // Directory doesn't exist yet
        return { success: true, files: [] };
      }

      const files = await fs.readdir(DEFAULT_LAYOUTS_DIR);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      return {
        success: true,
        files: jsonFiles,
        directory: DEFAULT_LAYOUTS_DIR,
      };
    } catch (error) {
      console.error('Error getting default layout files:', error);
      throw error;
    }
  });

  console.log('✅ Admin IPC handlers registered');
}
