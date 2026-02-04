import { ipcMain } from 'electron';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getCurrentProject,
  Project
} from '../database/queries/projects';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:getAll', async () => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getAllProjects(),
        'projects:getAll'
      );
    } catch (error) {
      console.error('Failed to get projects:', {
        operation: 'projects:getAll',
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load projects: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle('projects:getCurrent', async () => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getCurrentProject(),
        'projects:getCurrent'
      );
    } catch (error) {
      console.error('Failed to get current project:', {
        operation: 'projects:getCurrent',
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load current project: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle('projects:getById', async (_event, id: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getProjectById(id),
        'projects:getById'
      );
    } catch (error) {
      console.error('Failed to get project by id:', {
        operation: 'projects:getById',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load project: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle('projects:create', async (_event, name: string, description?: string, logoPath?: string, enabledModules?: string[]) => {
    try {
      // Basic validation
      if (!name || name.trim().length === 0) {
        throw new ValidationError(
          'Project name is required',
          'name',
          name
        );
      }

      return await errorHandler.executeWithRetry(
        async () => createProject(name, description, logoPath, enabledModules),
        'projects:create'
      );
    } catch (error) {
      console.error('Failed to create project:', {
        operation: 'projects:create',
        name,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to create project: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle('projects:update', async (_event, id: string, updates: Partial<Project>) => {
    try {
      // Validate project name if being updated
      if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
        throw new ValidationError(
          'Project name cannot be empty',
          'name',
          updates.name
        );
      }

      return await errorHandler.executeWithRetry(
        async () => updateProject(id, updates),
        'projects:update'
      );
    } catch (error) {
      console.error('Failed to update project:', {
        operation: 'projects:update',
        id,
        updates,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to update project: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle('projects:delete', async (_event, id: string) => {
    try {
      await errorHandler.executeWithRetry(
        async () => deleteProject(id),
        'projects:delete'
      );
    } catch (error) {
      console.error('Failed to delete project:', {
        operation: 'projects:delete',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete project: ${error.message}`);
      }
      throw error;
    }
  });

  console.log('✅ Project IPC handlers registered');
}
