import { ipcMain, BrowserWindow } from 'electron';
import { fileService, ProjectImportResult } from '../services/fileService';

/**
 * Register file operation IPC handlers
 */
export function registerFileHandlers(): void {
  /**
   * Show open file dialog and import project
   */
  ipcMain.handle('file:open', async (): Promise<ProjectImportResult | null> => {
    try {
      const filePath = await fileService.showOpenDialog();
      if (!filePath) {
        return null;
      }

      const result = await fileService.importProject(filePath);

      // Include the file path in the result
      return {
        ...result,
        filePath: result.success ? filePath : undefined
      } as ProjectImportResult & { filePath?: string };
    } catch (error) {
      console.error('Error in file:open handler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open file'
      };
    }
  });

  /**
   * Open a specific file by path (without showing dialog)
   */
  ipcMain.handle('file:openByPath', async (_, filePath: string): Promise<ProjectImportResult> => {
    try {
      const result = await fileService.importProject(filePath);

      // Include the file path in the result
      return {
        ...result,
        filePath: result.success ? filePath : undefined
      } as ProjectImportResult & { filePath?: string };
    } catch (error) {
      console.error('Error in file:openByPath handler:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open file'
      };
    }
  });

  /**
   * Save project to file
   * If filePath is provided, save to that path
   * Otherwise, show save dialog
   */
  ipcMain.handle('file:save', async (_, filePath?: string): Promise<string | null> => {
    try {
      let targetPath = filePath;

      // If no path provided, show save dialog
      if (!targetPath) {
        targetPath = await fileService.showSaveDialog();
        if (!targetPath) {
          return null; // User canceled
        }
      }

      await fileService.exportProject(targetPath);
      return targetPath;
    } catch (error) {
      console.error('Error in file:save handler:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to save file');
    }
  });

  /**
   * Show save as dialog and save project
   */
  ipcMain.handle('file:saveAs', async (_, defaultName?: string, module: string = 'PRODUCTION'): Promise<string | null> => {
    try {
      const filePath = await fileService.showSaveDialog(defaultName, module as any);
      if (!filePath) {
        return null; // User canceled
      }

      await fileService.exportProject(filePath);
      return filePath;
    } catch (error) {
      console.error('Error in file:saveAs handler:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to save file');
    }
  });

  /**
   * Create new project (clears current data)
   */
  ipcMain.handle('file:new', async (): Promise<string> => {
    try {
      const projectId = await fileService.createNewProject();
      return projectId;
    } catch (error) {
      console.error('Error in file:new handler:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create new project');
    }
  });

  /**
   * Validate a .showstack file
   */
  ipcMain.handle('file:validate', async (_, filePath: string) => {
    try {
      return await fileService.validateFile(filePath);
    } catch (error) {
      console.error('Error in file:validate handler:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to validate file'
      };
    }
  });

  /**
   * Get filename from path
   */
  ipcMain.handle('file:getFileName', (_, filePath: string): string => {
    return fileService.getFileName(filePath);
  });

  /**
   * Check if renderer has unsaved changes before closing window
   */
  ipcMain.handle('file:checkUnsavedChanges', async (event): Promise<boolean> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return false;

    // This will be implemented when we add the window close handler
    // For now, just return false (no unsaved changes)
    return false;
  });

  console.log('✅ File IPC handlers registered');
}
