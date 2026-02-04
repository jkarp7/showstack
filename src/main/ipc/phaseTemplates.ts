import { ipcMain } from 'electron';
import {
  getAllPhaseTemplates,
  getPhaseTemplateById,
  createPhaseTemplate,
  updatePhaseTemplate,
  deletePhaseTemplate,
  seedSystemPhaseTemplates
} from '../database/queries/phaseTemplates';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

export function registerPhaseTemplateHandlers() {
  // Get all phase templates for a project
  ipcMain.handle('phaseTemplates:getAll', async (event, projectId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getAllPhaseTemplates(projectId),
        'phaseTemplates:getAll'
      );
    } catch (error) {
      console.error('Failed to get phase templates:', {
        operation: 'phaseTemplates:getAll',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load phase templates: ${error.message}`);
      }
      throw error;
    }
  });

  // Get phase template by ID
  ipcMain.handle('phaseTemplates:getById', async (event, id: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getPhaseTemplateById(id),
        'phaseTemplates:getById'
      );
    } catch (error) {
      console.error('Failed to get phase template:', {
        operation: 'phaseTemplates:getById',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load phase template: ${error.message}`);
      }
      throw error;
    }
  });

  // Create phase template
  ipcMain.handle('phaseTemplates:create', async (event, template: any, projectId: string) => {
    try {
      // Basic validation
      if (!template.name || template.name.trim().length === 0) {
        throw new ValidationError(
          'Phase template name is required',
          'name',
          template.name
        );
      }

      return await errorHandler.executeWithRetry(
        async () => createPhaseTemplate(template, projectId),
        'phaseTemplates:create'
      );
    } catch (error) {
      console.error('Failed to create phase template:', {
        operation: 'phaseTemplates:create',
        template,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to create phase template: ${error.message}`);
      }
      throw error;
    }
  });

  // Update phase template
  ipcMain.handle('phaseTemplates:update', async (event, id: string, updates: any) => {
    try {
      // Validate name if being updated
      if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
        throw new ValidationError(
          'Phase template name cannot be empty',
          'name',
          updates.name
        );
      }

      return await errorHandler.executeWithRetry(
        async () => updatePhaseTemplate(id, updates),
        'phaseTemplates:update'
      );
    } catch (error) {
      console.error('Failed to update phase template:', {
        operation: 'phaseTemplates:update',
        id,
        updates,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to update phase template: ${error.message}`);
      }
      throw error;
    }
  });

  // Delete phase template
  ipcMain.handle('phaseTemplates:delete', async (event, id: string) => {
    try {
      await errorHandler.executeWithRetry(
        async () => deletePhaseTemplate(id),
        'phaseTemplates:delete'
      );
    } catch (error) {
      console.error('Failed to delete phase template:', {
        operation: 'phaseTemplates:delete',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete phase template: ${error.message}`);
      }
      throw error;
    }
  });

  // Seed system templates
  ipcMain.handle('phaseTemplates:seed', async (event, projectId: string) => {
    try {
      await errorHandler.executeWithRetry(
        async () => seedSystemPhaseTemplates(projectId),
        'phaseTemplates:seed'
      );
    } catch (error) {
      console.error('Failed to seed system phase templates:', {
        operation: 'phaseTemplates:seed',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to seed phase templates: ${error.message}`);
      }
      throw error;
    }
  });

  console.log('✅ Phase Template IPC handlers registered');
}
