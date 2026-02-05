// @ts-nocheck
import { ipcMain, dialog } from 'electron';
import { writeFileSync, readFileSync } from 'fs';
import {
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
import { infrastructureService } from '../services/InfrastructureService';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';
import {
  CreateInfrastructureEquipmentSchema,
  UpdateInfrastructureEquipmentSchema,
  parseWithZod,
  formatValidationErrors
} from '@showstack/shared';

export function registerInfrastructureHandlers(): void {
  // Get all infrastructure equipment for a project
  ipcMain.handle('infrastructure:getAll', async (_event, projectId: string) => {
    try {
      return await infrastructureService.getAll(projectId);
    } catch (error) {
      console.error('Failed to get infrastructure:', {
        operation: 'infrastructure:getAll',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load infrastructure: ${error.message}`);
      }
      throw error;
    }
  });

  // Create infrastructure equipment
  ipcMain.handle('infrastructure:create', async (_event, equipment: Partial<InfrastructureEquipment>, projectId: string) => {
    try {
      // Add project_id for validation
      const equipmentWithProject = { ...equipment, project_id: projectId };

      // Validate with Zod schema
      const validation = parseWithZod(CreateInfrastructureEquipmentSchema, equipmentWithProject);

      if (!validation.success) {
        const errorMessage = formatValidationErrors(validation.errors);
        throw new ValidationError(
          `Invalid infrastructure equipment data:\n${errorMessage}`,
          validation.errors[0]?.field || 'unknown',
          equipment
        );
      }

      return await infrastructureService.create(equipment, projectId);
    } catch (error) {
      console.error('Failed to create infrastructure:', {
        operation: 'infrastructure:create',
        equipment,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to create infrastructure: ${error.message}`);
      }
      throw error;
    }
  });

  // Update infrastructure equipment
  ipcMain.handle('infrastructure:update', async (_event, id: string, updates: Partial<InfrastructureEquipment>) => {
    try {
      // Validate with Zod schema
      const validation = parseWithZod(UpdateInfrastructureEquipmentSchema, { id, ...updates });

      if (!validation.success) {
        const errorMessage = formatValidationErrors(validation.errors);
        throw new ValidationError(
          `Invalid infrastructure equipment update data:\n${errorMessage}`,
          validation.errors[0]?.field || 'unknown',
          updates
        );
      }

      return await infrastructureService.update(id, updates);
    } catch (error) {
      console.error('Failed to update infrastructure:', {
        operation: 'infrastructure:update',
        id,
        updates,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to update infrastructure: ${error.message}`);
      }
      throw error;
    }
  });

  // Delete infrastructure equipment
  ipcMain.handle('infrastructure:delete', async (_event, id: string) => {
    try {
      await infrastructureService.delete(id);
    } catch (error) {
      console.error('Failed to delete infrastructure:', {
        operation: 'infrastructure:delete',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete infrastructure: ${error.message}`);
      }
      throw error;
    }
  });

  // Delete multiple infrastructure equipment
  ipcMain.handle('infrastructure:deleteMultiple', async (_event, ids: string[]) => {
    try {
      await errorHandler.executeWithRetry(
        async () => // deleteMultipleInfrastructure(ids),
        'infrastructure:deleteMultiple'
      );
    } catch (error) {
      console.error('Failed to delete multiple infrastructure:', {
        operation: 'infrastructure:deleteMultiple',
        count: ids.length,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete infrastructure: ${error.message}`);
      }
      throw error;
    }
  });

  // Get port linkages for equipment
  ipcMain.handle('infrastructure:getPortLinkages', async (_event, equipmentId: string, projectId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getPortLinkages(equipmentId, projectId),
        'infrastructure:getPortLinkages'
      );
    } catch (error) {
      console.error('Failed to get port linkages:', {
        operation: 'infrastructure:getPortLinkages',
        equipmentId,
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load port linkages: ${error.message}`);
      }
      throw error;
    }
  });

  // Get fixture connections
  ipcMain.handle('infrastructure:getFixtureConnections', async (_event, fixtureId: string, projectId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getFixtureConnections(fixtureId, projectId),
        'infrastructure:getFixtureConnections'
      );
    } catch (error) {
      console.error('Failed to get fixture connections:', {
        operation: 'infrastructure:getFixtureConnections',
        fixtureId,
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load fixture connections: ${error.message}`);
      }
      throw error;
    }
  });

  // Get equipment connections
  ipcMain.handle('infrastructure:getEquipmentConnections', async (_event, equipmentId: string, projectId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getEquipmentConnections(equipmentId, projectId),
        'infrastructure:getEquipmentConnections'
      );
    } catch (error) {
      console.error('Failed to get equipment connections:', {
        operation: 'infrastructure:getEquipmentConnections',
        equipmentId,
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load equipment connections: ${error.message}`);
      }
      throw error;
    }
  });

  // Validate port assignment
  ipcMain.handle('infrastructure:validatePortAssignment', async (_event, equipmentId: string, portAssignment: PortAssignment, projectId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => validatePortAssignment(equipmentId, portAssignment, projectId),
        'infrastructure:validatePortAssignment'
      );
    } catch (error) {
      console.error('Failed to validate port assignment:', {
        operation: 'infrastructure:validatePortAssignment',
        equipmentId,
        portAssignment,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to validate port assignment: ${error.message}`);
      }
      throw error;
    }
  });

  // Get port usage stats for specific equipment
  ipcMain.handle('infrastructure:getPortUsageStats', async (_event, equipmentId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getPortUsageStats(equipmentId),
        'infrastructure:getPortUsageStats'
      );
    } catch (error) {
      console.error('Failed to get port usage stats:', {
        operation: 'infrastructure:getPortUsageStats',
        equipmentId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load port usage stats: ${error.message}`);
      }
      throw error;
    }
  });

  // Get port usage stats for all equipment in project
  ipcMain.handle('infrastructure:getAllPortUsageStats', async (_event, projectId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getAllPortUsageStats(projectId),
        'infrastructure:getAllPortUsageStats'
      );
    } catch (error) {
      console.error('Failed to get all port usage stats:', {
        operation: 'infrastructure:getAllPortUsageStats',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load port usage stats: ${error.message}`);
      }
      throw error;
    }
  });

  // Export infrastructure to CSV
  ipcMain.handle('infrastructure:exportCSV', async (_event, projectId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => {
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
        },
        'infrastructure:exportCSV'
      );
    } catch (error) {
      console.error('Failed to export infrastructure CSV:', {
        operation: 'infrastructure:exportCSV',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to export infrastructure: ${error.message}`);
      }
      throw error;
    }
  });

  // Import infrastructure from CSV
  ipcMain.handle('infrastructure:importCSV', async (_event, projectId: string, csvFilePath: string, fieldMapping: CSVFieldMapping[]) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => {
          const csvContent = readFileSync(csvFilePath, 'utf-8');
          const result = importInfrastructureFromCSV(projectId, csvContent, fieldMapping);

          return result;
        },
        'infrastructure:importCSV'
      );
    } catch (error) {
      console.error('Failed to import infrastructure CSV:', {
        operation: 'infrastructure:importCSV',
        projectId,
        csvFilePath,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to import infrastructure: ${error.message}`);
      }
      throw error;
    }
  });

  // Read CSV file headers (for mapping UI)
  ipcMain.handle('infrastructure:readCSVHeaders', async (_event, filePath: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => {
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
        },
        'infrastructure:readCSVHeaders'
      );
    } catch (error) {
      console.error('Failed to read CSV headers:', {
        operation: 'infrastructure:readCSVHeaders',
        filePath,
        error: error instanceof Error ? error.message : error
      });

      throw new Error(`Unable to read CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.error('Failed to show import dialog:', {
        operation: 'infrastructure:showImportDialog',
        error: error instanceof Error ? error.message : error
      });

      throw new Error(`Unable to show import dialog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  console.log('✅ Infrastructure IPC handlers registered');
}
