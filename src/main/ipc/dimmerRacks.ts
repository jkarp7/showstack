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

export function registerDimmerRackHandlers(): void {
  // Get all dimmer racks for a project
  ipcMain.handle('dimmerRacks:getAll', async (_event, projectId?: string) => {
    try {
      return getAllDimmerRacks(projectId);
    } catch (error) {
      console.error('Error getting dimmer racks:', error);
      throw error;
    }
  });

  // Get dimmer rack by ID
  ipcMain.handle('dimmerRacks:getById', async (_event, id: string) => {
    try {
      return getDimmerRackById(id);
    } catch (error) {
      console.error('Error getting dimmer rack:', error);
      throw error;
    }
  });

  // Create dimmer rack
  ipcMain.handle('dimmerRacks:create', async (_event, rack: Omit<DimmerRack, 'id' | 'created_at' | 'updated_at'>, projectId?: string) => {
    try {
      return createDimmerRack(rack, projectId);
    } catch (error) {
      console.error('Error creating dimmer rack:', error);
      throw error;
    }
  });

  // Update dimmer rack
  ipcMain.handle('dimmerRacks:update', async (_event, id: string, updates: Partial<DimmerRack>) => {
    try {
      return updateDimmerRack(id, updates);
    } catch (error) {
      console.error('Error updating dimmer rack:', error);
      throw error;
    }
  });

  // Delete dimmer rack
  ipcMain.handle('dimmerRacks:delete', async (_event, id: string) => {
    try {
      deleteDimmerRack(id);
    } catch (error) {
      console.error('Error deleting dimmer rack:', error);
      throw error;
    }
  });

  // Get dimmer racks with usage statistics
  ipcMain.handle('dimmerRacks:getWithUsage', async (_event, projectId?: string) => {
    try {
      return getDimmerRacksWithUsage(projectId);
    } catch (error) {
      console.error('Error getting dimmer racks with usage:', error);
      throw error;
    }
  });

  console.log('✅ Dimmer Rack IPC handlers registered');
}
