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

export function registerPDRackHandlers(): void {
  // Get all PD racks for a project
  ipcMain.handle('pdRacks:getAll', async (_event, projectId?: string) => {
    try {
      return getAllPDRacks(projectId);
    } catch (error) {
      console.error('Error getting PD racks:', error);
      throw error;
    }
  });

  // Get PD rack by ID
  ipcMain.handle('pdRacks:getById', async (_event, id: string) => {
    try {
      return getPDRackById(id);
    } catch (error) {
      console.error('Error getting PD rack:', error);
      throw error;
    }
  });

  // Create PD rack
  ipcMain.handle('pdRacks:create', async (_event, rack: Omit<PDRack, 'id' | 'created_at' | 'updated_at'>, projectId?: string) => {
    try {
      return createPDRack(rack, projectId);
    } catch (error) {
      console.error('Error creating PD rack:', error);
      throw error;
    }
  });

  // Update PD rack
  ipcMain.handle('pdRacks:update', async (_event, id: string, updates: Partial<PDRack>) => {
    try {
      return updatePDRack(id, updates);
    } catch (error) {
      console.error('Error updating PD rack:', error);
      throw error;
    }
  });

  // Delete PD rack
  ipcMain.handle('pdRacks:delete', async (_event, id: string) => {
    try {
      deletePDRack(id);
    } catch (error) {
      console.error('Error deleting PD rack:', error);
      throw error;
    }
  });

  // Get PD racks with usage statistics
  ipcMain.handle('pdRacks:getWithUsage', async (_event, projectId?: string) => {
    try {
      return getPDRacksWithUsage(projectId);
    } catch (error) {
      console.error('Error getting PD racks with usage:', error);
      throw error;
    }
  });

  console.log('✅ PD Rack IPC handlers registered');
}
