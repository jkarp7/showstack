import { ipcMain } from 'electron';
import {
  getModulesByRackId,
  createModule,
  updateModule,
  deleteModule,
  getModuleTypeForCircuit,
  DimmerRackModule
} from '../database/queries/dimmerRackModules';

export function registerDimmerRackModuleHandlers(): void {
  // Get all modules for a rack
  ipcMain.handle('dimmerRackModules:getByRackId', async (_event, rackId: string) => {
    try {
      return getModulesByRackId(rackId);
    } catch (error) {
      console.error('Error getting dimmer rack modules:', error);
      throw error;
    }
  });

  // Create module
  ipcMain.handle('dimmerRackModules:create', async (_event, module: Omit<DimmerRackModule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      return createModule(module);
    } catch (error) {
      console.error('Error creating dimmer rack module:', error);
      throw error;
    }
  });

  // Update module
  ipcMain.handle('dimmerRackModules:update', async (_event, id: string, updates: Partial<DimmerRackModule>) => {
    try {
      return updateModule(id, updates);
    } catch (error) {
      console.error('Error updating dimmer rack module:', error);
      throw error;
    }
  });

  // Delete module
  ipcMain.handle('dimmerRackModules:delete', async (_event, id: string) => {
    try {
      deleteModule(id);
    } catch (error) {
      console.error('Error deleting dimmer rack module:', error);
      throw error;
    }
  });

  // Get module type for a specific circuit
  ipcMain.handle('dimmerRackModules:getTypeForCircuit', async (_event, rackId: string, circuit: number) => {
    try {
      return getModuleTypeForCircuit(rackId, circuit);
    } catch (error) {
      console.error('Error getting module type for circuit:', error);
      throw error;
    }
  });

  console.log('✅ Dimmer Rack Module IPC handlers registered');
}
