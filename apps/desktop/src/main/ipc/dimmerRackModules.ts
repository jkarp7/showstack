import { ipcMain } from 'electron';
import {
  getModulesByRackId,
  createModule,
  updateModule,
  deleteModule,
  getModuleTypeForCircuit,
  DimmerRackModule,
} from '../database/queries/dimmerRackModules';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';
import { logger } from '../utils/logger';

export function registerDimmerRackModuleHandlers(): void {
  // Get all modules for a rack
  ipcMain.handle('dimmerRackModules:getByRackId', async (_event, rackId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getModulesByRackId(rackId),
        'dimmerRackModules:getByRackId',
      );
    } catch (error) {
      logger.error('Failed to get dimmer rack modules:', {
        operation: 'dimmerRackModules:getByRackId',
        rackId,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load dimmer rack modules: ${error.message}`);
      }
      throw error;
    }
  });

  // Create module
  ipcMain.handle(
    'dimmerRackModules:create',
    async (_event, module: Omit<DimmerRackModule, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        // Basic validation
        if (!module.module_type) {
          throw new ValidationError('Module type is required', 'module_type', module.module_type);
        }

        return await errorHandler.executeWithRetry(
          async () => createModule(module),
          'dimmerRackModules:create',
        );
      } catch (error) {
        logger.error('Failed to create dimmer rack module:', {
          operation: 'dimmerRackModules:create',
          module,
          error: error instanceof Error ? error.message : error,
        });

        if (error instanceof ValidationError) {
          throw new Error(error.toUserMessage());
        }
        if (error instanceof DatabaseError) {
          throw new Error(`Unable to create dimmer rack module: ${error.message}`);
        }
        throw error;
      }
    },
  );

  // Update module
  ipcMain.handle(
    'dimmerRackModules:update',
    async (_event, id: string, updates: Partial<DimmerRackModule>) => {
      try {
        return await errorHandler.executeWithRetry(
          async () => updateModule(id, updates),
          'dimmerRackModules:update',
        );
      } catch (error) {
        logger.error('Failed to update dimmer rack module:', {
          operation: 'dimmerRackModules:update',
          id,
          updates,
          error: error instanceof Error ? error.message : error,
        });

        if (error instanceof DatabaseError) {
          throw new Error(`Unable to update dimmer rack module: ${error.message}`);
        }
        throw error;
      }
    },
  );

  // Delete module
  ipcMain.handle('dimmerRackModules:delete', async (_event, id: string) => {
    try {
      await errorHandler.executeWithRetry(async () => deleteModule(id), 'dimmerRackModules:delete');
    } catch (error) {
      logger.error('Failed to delete dimmer rack module:', {
        operation: 'dimmerRackModules:delete',
        id,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete dimmer rack module: ${error.message}`);
      }
      throw error;
    }
  });

  // Get module type for a specific circuit
  ipcMain.handle(
    'dimmerRackModules:getTypeForCircuit',
    async (_event, rackId: string, circuit: number) => {
      try {
        return await errorHandler.executeWithRetry(
          async () => getModuleTypeForCircuit(rackId, circuit),
          'dimmerRackModules:getTypeForCircuit',
        );
      } catch (error) {
        logger.error('Failed to get module type for circuit:', {
          operation: 'dimmerRackModules:getTypeForCircuit',
          rackId,
          circuit,
          error: error instanceof Error ? error.message : error,
        });

        if (error instanceof DatabaseError) {
          throw new Error(`Unable to load module type: ${error.message}`);
        }
        throw error;
      }
    },
  );

  logger.info('✅ Dimmer Rack Module IPC handlers registered');
}
