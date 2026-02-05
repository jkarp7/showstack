// @ts-nocheck
import { ipcMain } from 'electron';
import { getCurrentProject, Project } from '../database/queries/projects';
import { projectService } from '../services/ProjectService';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  parseWithZod,
  formatValidationErrors
} from '@showstack/shared';

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:getAll', async () => {
    try {
      return await projectService.getAll();
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
      return await projectService.getById(id);
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
      // Construct project data for validation
      const projectData = {
        name,
        description,
        logo_path: logoPath,
        enabled_modules: enabledModules ? JSON.stringify(enabledModules) : undefined
      };

      // Validate with Zod schema
      const validation = parseWithZod(CreateProjectSchema, projectData);

      if (!validation.success) {
        const errorMessage = formatValidationErrors(validation.errors);
        throw new ValidationError(
          `Invalid project data:\n${errorMessage}`,
          validation.errors[0]?.field || 'unknown',
          projectData
        );
      }

      return await projectService.create(name, description, logoPath, enabledModules);
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
      // Validate with Zod schema
      const validation = parseWithZod(UpdateProjectSchema, { id, ...updates });

      if (!validation.success) {
        const errorMessage = formatValidationErrors(validation.errors);
        throw new ValidationError(
          `Invalid project update data:\n${errorMessage}`,
          validation.errors[0]?.field || 'unknown',
          updates
        );
      }

      return await projectService.update(id, updates);
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
      await projectService.delete(id);
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
