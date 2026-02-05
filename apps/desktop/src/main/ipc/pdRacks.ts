import { ipcMain } from 'electron';
import {
  getAllPDRacks,
  getPDRackById,
  createPDRack,
  updatePDRack,
  deletePDRack,
  getPDRacksWithUsage,
  PDRack
} from '../database/queries/pdRacks';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

export function registerPDRackHandlers(): void {
  // Get all PD racks for a project
  ipcMain.handle('pdRacks:getAll', async (_event, projectId?: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getAllPDRacks(projectId),
        'pdRacks:getAll'
      );
    } catch (error) {
      console.error('Failed to get PD racks:', {
        operation: 'pdRacks:getAll',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load PD racks: ${error.message}`);
      }
      throw error;
    }
  });

  // Get PD rack by ID
  ipcMain.handle('pdRacks:getById', async (_event, id: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getPDRackById(id),
        'pdRacks:getById'
      );
    } catch (error) {
      console.error('Failed to get PD rack:', {
        operation: 'pdRacks:getById',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load PD rack: ${error.message}`);
      }
      throw error;
    }
  });

  // Create PD rack
  ipcMain.handle('pdRacks:create', async (_event, rack: Omit<PDRack, 'id' | 'created_at' | 'updated_at'>, projectId?: string) => {
    try {
      // Basic validation
      if (!rack.name || rack.name.trim().length === 0) {
        throw new ValidationError(
          'PD rack name is required',
          'name',
          rack.name
        );
      }

      return await errorHandler.executeWithRetry(
        async () => createPDRack(rack, projectId),
        'pdRacks:create'
      );
    } catch (error) {
      console.error('Failed to create PD rack:', {
        operation: 'pdRacks:create',
        rack,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to create PD rack: ${error.message}`);
      }
      throw error;
    }
  });

  // Update PD rack
  ipcMain.handle('pdRacks:update', async (_event, id: string, updates: Partial<PDRack>) => {
    try {
      // Validate name if being updated
      if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
        throw new ValidationError(
          'PD rack name cannot be empty',
          'name',
          updates.name
        );
      }

      return await errorHandler.executeWithRetry(
        async () => updatePDRack(id, updates),
        'pdRacks:update'
      );
    } catch (error) {
      console.error('Failed to update PD rack:', {
        operation: 'pdRacks:update',
        id,
        updates,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to update PD rack: ${error.message}`);
      }
      throw error;
    }
  });

  // Delete PD rack
  ipcMain.handle('pdRacks:delete', async (_event, id: string) => {
    try {
      await errorHandler.executeWithRetry(
        async () => deletePDRack(id),
        'pdRacks:delete'
      );
    } catch (error) {
      console.error('Failed to delete PD rack:', {
        operation: 'pdRacks:delete',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete PD rack: ${error.message}`);
      }
      throw error;
    }
  });

  // Get PD racks with usage statistics
  ipcMain.handle('pdRacks:getWithUsage', async (_event, projectId?: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getPDRacksWithUsage(projectId),
        'pdRacks:getWithUsage'
      );
    } catch (error) {
      console.error('Failed to get PD racks with usage:', {
        operation: 'pdRacks:getWithUsage',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load PD rack usage: ${error.message}`);
      }
      throw error;
    }
  });

  console.log('✅ PD Rack IPC handlers registered');
}
