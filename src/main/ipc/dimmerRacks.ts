import { ipcMain } from 'electron';
import {
  getAllDimmerRacks,
  getDimmerRackById,
  createDimmerRack,
  updateDimmerRack,
  deleteDimmerRack,
  getDimmerRacksWithUsage,
  DimmerRack
} from '../database/queries/dimmerRacks';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

export function registerDimmerRackHandlers(): void {
  // Get all dimmer racks for a project
  ipcMain.handle('dimmerRacks:getAll', async (_event, projectId?: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getAllDimmerRacks(projectId),
        'dimmerRacks:getAll'
      );
    } catch (error) {
      console.error('Failed to get dimmer racks:', {
        operation: 'dimmerRacks:getAll',
        projectId,
        error: error instanceof Error ? error.message : error
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
      return await errorHandler.executeWithRetry(
        async () => getDimmerRackById(id),
        'dimmerRacks:getById'
      );
    } catch (error) {
      console.error('Failed to get dimmer rack:', {
        operation: 'dimmerRacks:getById',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load dimmer rack: ${error.message}`);
      }
      throw error;
    }
  });

  // Create dimmer rack
  ipcMain.handle('dimmerRacks:create', async (_event, rack: Omit<DimmerRack, 'id' | 'created_at' | 'updated_at'>, projectId?: string) => {
    try {
      // Basic validation
      if (!rack.name || rack.name.trim().length === 0) {
        throw new ValidationError(
          'Dimmer rack name is required',
          'name',
          rack.name
        );
      }

      return await errorHandler.executeWithRetry(
        async () => createDimmerRack(rack, projectId),
        'dimmerRacks:create'
      );
    } catch (error) {
      console.error('Failed to create dimmer rack:', {
        operation: 'dimmerRacks:create',
        rack,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to create dimmer rack: ${error.message}`);
      }
      throw error;
    }
  });

  // Update dimmer rack
  ipcMain.handle('dimmerRacks:update', async (_event, id: string, updates: Partial<DimmerRack>) => {
    try {
      // Validate name if being updated
      if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
        throw new ValidationError(
          'Dimmer rack name cannot be empty',
          'name',
          updates.name
        );
      }

      return await errorHandler.executeWithRetry(
        async () => updateDimmerRack(id, updates),
        'dimmerRacks:update'
      );
    } catch (error) {
      console.error('Failed to update dimmer rack:', {
        operation: 'dimmerRacks:update',
        id,
        updates,
        error: error instanceof Error ? error.message : error
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
      await errorHandler.executeWithRetry(
        async () => deleteDimmerRack(id),
        'dimmerRacks:delete'
      );
    } catch (error) {
      console.error('Failed to delete dimmer rack:', {
        operation: 'dimmerRacks:delete',
        id,
        error: error instanceof Error ? error.message : error
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
      return await errorHandler.executeWithRetry(
        async () => getDimmerRacksWithUsage(projectId),
        'dimmerRacks:getWithUsage'
      );
    } catch (error) {
      console.error('Failed to get dimmer racks with usage:', {
        operation: 'dimmerRacks:getWithUsage',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load dimmer rack usage: ${error.message}`);
      }
      throw error;
    }
  });

  console.log('✅ Dimmer Rack IPC handlers registered');
}
