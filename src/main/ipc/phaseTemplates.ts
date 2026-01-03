import { ipcMain } from 'electron';
import {
  getAllPhaseTemplates,
  getPhaseTemplateById,
  createPhaseTemplate,
  updatePhaseTemplate,
  deletePhaseTemplate,
  seedSystemPhaseTemplates
} from '../database/queries/phaseTemplates';

export function registerPhaseTemplateHandlers() {
  // Get all phase templates for a project
  ipcMain.handle('phaseTemplates:getAll', async (event, projectId: string) => {
    try {
      return getAllPhaseTemplates(projectId);
    } catch (error) {
      console.error('Error getting phase templates:', error);
      throw error;
    }
  });

  // Get phase template by ID
  ipcMain.handle('phaseTemplates:getById', async (event, id: string) => {
    try {
      return getPhaseTemplateById(id);
    } catch (error) {
      console.error('Error getting phase template:', error);
      throw error;
    }
  });

  // Create phase template
  ipcMain.handle('phaseTemplates:create', async (event, template: any, projectId: string) => {
    try {
      return createPhaseTemplate(template, projectId);
    } catch (error) {
      console.error('Error creating phase template:', error);
      throw error;
    }
  });

  // Update phase template
  ipcMain.handle('phaseTemplates:update', async (event, id: string, updates: any) => {
    try {
      return updatePhaseTemplate(id, updates);
    } catch (error) {
      console.error('Error updating phase template:', error);
      throw error;
    }
  });

  // Delete phase template
  ipcMain.handle('phaseTemplates:delete', async (event, id: string) => {
    try {
      deletePhaseTemplate(id);
    } catch (error) {
      console.error('Error deleting phase template:', error);
      throw error;
    }
  });

  // Seed system templates
  ipcMain.handle('phaseTemplates:seed', async (event, projectId: string) => {
    try {
      seedSystemPhaseTemplates(projectId);
    } catch (error) {
      console.error('Error seeding system phase templates:', error);
      throw error;
    }
  });

  console.log('✅ Phase Template IPC handlers registered');
}
