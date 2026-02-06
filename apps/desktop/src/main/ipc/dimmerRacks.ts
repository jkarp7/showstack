// @ts-nocheck
import { ipcMain } from 'electron';
import { DimmerRack } from '../database/queries/dimmerRacks';
import { dimmerService } from '../services/DimmerService';
import { DatabaseError, ValidationError } from '../errors';
import {
  CreateDimmerRackSchema,
  UpdateDimmerRackSchema,
  parseWithZod,
  formatValidationErrors,
} from '@showstack/shared';

export function registerDimmerRackHandlers(): void {
  // Get all dimmer racks for a project
  ipcMain.handle('dimmerRacks:getAll', async (_event, projectId?: string) => {
    try {
      return await dimmerService.getAll(projectId);
    } catch (error) {
      console.error('Failed to get dimmer racks:', {
        operation: 'dimmerRacks:getAll',
        projectId,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load dimmer racks: ${error.message}`);
      }
      throw error;
    }
  });

  // Get dimmer rack by ID
  ipcMain.handle('dimmerRacks:getById', async (_event, id: string) => {
    try {
      return await dimmerService.getById(id);
    } catch (error) {
      console.error('Failed to get dimmer rack:', {
        operation: 'dimmerRacks:getById',
        id,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load dimmer rack: ${error.message}`);
      }
      throw error;
    }
  });

  // Create dimmer rack
  ipcMain.handle(
    'dimmerRacks:create',
    async (
      _event,
      rack: Omit<DimmerRack, 'id' | 'created_at' | 'updated_at'>,
      projectId?: string,
    ) => {
      try {
        // Add project_id for validation
        const rackWithProject = { ...rack, project_id: projectId || rack.project_id };

        // Validate with Zod schema
        const validation = parseWithZod(CreateDimmerRackSchema, rackWithProject);

        if (!validation.success) {
          const errorMessage = formatValidationErrors(validation.errors);
          throw new ValidationError(
            `Invalid dimmer rack data:\n${errorMessage}`,
            validation.errors[0]?.field || 'unknown',
            rack,
          );
        }

        return await dimmerService.create(rack, projectId);
      } catch (error) {
        console.error('Failed to create dimmer rack:', {
          operation: 'dimmerRacks:create',
          rack,
          error: error instanceof Error ? error.message : error,
        });

        if (error instanceof ValidationError) {
          throw new Error(error.toUserMessage());
        }
        if (error instanceof DatabaseError) {
          throw new Error(`Unable to create dimmer rack: ${error.message}`);
        }
        throw error;
      }
    },
  );

  // Update dimmer rack
  ipcMain.handle('dimmerRacks:update', async (_event, id: string, updates: Partial<DimmerRack>) => {
    try {
      // Validate with Zod schema
      const validation = parseWithZod(UpdateDimmerRackSchema, { id, ...updates });

      if (!validation.success) {
        const errorMessage = formatValidationErrors(validation.errors);
        throw new ValidationError(
          `Invalid dimmer rack update data:\n${errorMessage}`,
          validation.errors[0]?.field || 'unknown',
          updates,
        );
      }

      return await dimmerService.update(id, updates);
    } catch (error) {
      console.error('Failed to update dimmer rack:', {
        operation: 'dimmerRacks:update',
        id,
        updates,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to update dimmer rack: ${error.message}`);
      }
      throw error;
    }
  });

  // Delete dimmer rack
  ipcMain.handle('dimmerRacks:delete', async (_event, id: string) => {
    try {
      await dimmerService.delete(id);
    } catch (error) {
      console.error('Failed to delete dimmer rack:', {
        operation: 'dimmerRacks:delete',
        id,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete dimmer rack: ${error.message}`);
      }
      throw error;
    }
  });

  // Get dimmer racks with usage statistics
  ipcMain.handle('dimmerRacks:getWithUsage', async (_event, projectId?: string) => {
    try {
      return await dimmerService.getWithUsage(projectId);
    } catch (error) {
      console.error('Failed to get dimmer racks with usage:', {
        operation: 'dimmerRacks:getWithUsage',
        projectId,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load dimmer rack usage: ${error.message}`);
      }
      throw error;
    }
  });

  console.log('✅ Dimmer Rack IPC handlers registered');
}
