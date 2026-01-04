import { ipcMain, dialog } from 'electron';
import { writeFileSync, readFileSync } from 'fs';
import {
  getAllInfrastructure,
  createInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
  deleteMultipleInfrastructure,
  getPortLinkages,
  getFixtureConnections,
  getEquipmentConnections,
  validatePortAssignment,
  getPortUsageStats,
  getAllPortUsageStats,
  exportInfrastructureToCSV,
  importInfrastructureFromCSV,
  InfrastructureEquipment,
  PortAssignment,
  CSVFieldMapping
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

  // Get port linkages for equipment
  ipcMain.handle('infrastructure:getPortLinkages', async (_event, equipmentId: string, projectId: string) => {
    try {
      return getPortLinkages(equipmentId, projectId);
    } catch (error) {
      console.error('Error getting port linkages:', error);
      throw error;
    }
  });

  // Get fixture connections
  ipcMain.handle('infrastructure:getFixtureConnections', async (_event, fixtureId: string, projectId: string) => {
    try {
      return getFixtureConnections(fixtureId, projectId);
    } catch (error) {
      console.error('Error getting fixture connections:', error);
      throw error;
    }
  });

  // Get equipment connections
  ipcMain.handle('infrastructure:getEquipmentConnections', async (_event, equipmentId: string, projectId: string) => {
    try {
      return getEquipmentConnections(equipmentId, projectId);
    } catch (error) {
      console.error('Error getting equipment connections:', error);
      throw error;
    }
  });

  // Validate port assignment
  ipcMain.handle('infrastructure:validatePortAssignment', async (_event, equipmentId: string, portAssignment: PortAssignment, projectId: string) => {
    try {
      return validatePortAssignment(equipmentId, portAssignment, projectId);
    } catch (error) {
      console.error('Error validating port assignment:', error);
      throw error;
    }
  });

  // Get port usage stats for specific equipment
  ipcMain.handle('infrastructure:getPortUsageStats', async (_event, equipmentId: string) => {
    try {
      return getPortUsageStats(equipmentId);
    } catch (error) {
      console.error('Error getting port usage stats:', error);
      throw error;
    }
  });

  // Get port usage stats for all equipment in project
  ipcMain.handle('infrastructure:getAllPortUsageStats', async (_event, projectId: string) => {
    try {
      return getAllPortUsageStats(projectId);
    } catch (error) {
      console.error('Error getting all port usage stats:', error);
      throw error;
    }
  });

  // Export infrastructure to CSV
  ipcMain.handle('infrastructure:exportCSV', async (_event, projectId: string) => {
    try {
      const csvContent = exportInfrastructureToCSV(projectId);

      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export Infrastructure to CSV',
        defaultPath: `infrastructure-${projectId}.csv`,
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      // Write CSV file
      writeFileSync(result.filePath, csvContent, 'utf-8');

      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Error exporting infrastructure CSV:', error);
      throw error;
    }
  });

  // Import infrastructure from CSV
  ipcMain.handle('infrastructure:importCSV', async (_event, projectId: string, csvFilePath: string, fieldMapping: CSVFieldMapping[]) => {
    try {
      const csvContent = readFileSync(csvFilePath, 'utf-8');
      const result = importInfrastructureFromCSV(projectId, csvContent, fieldMapping);

      return result;
    } catch (error) {
      console.error('Error importing infrastructure CSV:', error);
      throw error;
    }
  });

  // Read CSV file headers (for mapping UI)
  ipcMain.handle('infrastructure:readCSVHeaders', async (_event, filePath: string) => {
    try {
      const csvContent = readFileSync(filePath, 'utf-8');
      const firstLine = csvContent.split('\n')[0];

      // Parse CSV header line
      const headers: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];

        if (char === '"') {
          if (inQuotes && firstLine[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          headers.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      headers.push(current.trim());

      return { success: true, headers };
    } catch (error) {
      console.error('Error reading CSV headers:', error);
      throw error;
    }
  });

  // Show open file dialog for CSV import
  ipcMain.handle('infrastructure:showImportDialog', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Infrastructure from CSV',
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      return { success: true, filePath: result.filePaths[0] };
    } catch (error) {
      console.error('Error showing import dialog:', error);
      throw error;
    }
  });

  console.log('✅ Infrastructure IPC handlers registered');
}
