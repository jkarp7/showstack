import { ipcMain } from 'electron';
import {
  getAllInfrastructure,
  createInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
  deleteMultipleInfrastructure,
  InfrastructureEquipment
} from '../database/queries/infrastructure';

export function registerInfrastructureHandlers(): void {
  // Get all infrastructure equipment for a project
  ipcMain.handle('infrastructure:getAll', async (_event, projectId: string) => {
    try {
      return getAllInfrastructure(projectId);
    } catch (error) {
      console.error('Error getting infrastructure:', error);
      throw error;
    }
  });

  // Create infrastructure equipment
  ipcMain.handle('infrastructure:create', async (_event, equipment: Partial<InfrastructureEquipment>, projectId: string) => {
    try {
      return createInfrastructure(equipment, projectId);
    } catch (error) {
      console.error('Error creating infrastructure:', error);
      throw error;
    }
  });

  // Update infrastructure equipment
  ipcMain.handle('infrastructure:update', async (_event, id: string, updates: Partial<InfrastructureEquipment>) => {
    try {
      return updateInfrastructure(id, updates);
    } catch (error) {
      console.error('Error updating infrastructure:', error);
      throw error;
    }
  });

  // Delete infrastructure equipment
  ipcMain.handle('infrastructure:delete', async (_event, id: string) => {
    try {
      deleteInfrastructure(id);
    } catch (error) {
      console.error('Error deleting infrastructure:', error);
      throw error;
    }
  });

  // Delete multiple infrastructure equipment
  ipcMain.handle('infrastructure:deleteMultiple', async (_event, ids: string[]) => {
    try {
      deleteMultipleInfrastructure(ids);
    } catch (error) {
      console.error('Error deleting multiple infrastructure:', error);
      throw error;
    }
  });

  console.log('✅ Infrastructure IPC handlers registered');
}
