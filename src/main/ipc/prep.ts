import { ipcMain } from 'electron';
import {
  // Projects
  getAllPrepProjects,
  getPrepProjectById,
  createPrepProject,
  updatePrepProject,
  deletePrepProject,
  PrepProject,
  // Sections
  getSectionsByProjectId,
  createPrepSection,
  updatePrepSection,
  deletePrepSection,
  PrepSection,
  // Equipment Items
  getItemsBySectionId,
  getItemsByProjectId,
  createPrepEquipmentItem,
  updatePrepEquipmentItem,
  deletePrepEquipmentItem,
  PrepEquipmentItem,
  // Revisions
  getRevisionsByProjectId,
  createPrepRevision,
  deletePrepRevision,
  PrepRevision,
  // Notes
  getNotesByProjectId,
  createPrepNote,
  updatePrepNote,
  deletePrepNote,
  PrepNote,
  // Note Templates
  getAllNoteTemplates,
  getNoteTemplateById,
  getDefaultNoteTemplate,
  createNoteTemplate,
  updateNoteTemplate,
  deleteNoteTemplate,
  PrepNoteTemplate,
} from '../database/queries/prep';
import { prepFileService } from '../services/prepFileService';

export function registerPrepHandlers(): void {
  // ============================================
  // PREP PROJECTS
  // ============================================

  ipcMain.handle('prep:projects:getAll', async () => {
    try {
      return getAllPrepProjects();
    } catch (error) {
      console.error('Error getting prep projects:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:projects:getById', async (_event, id: string) => {
    try {
      return getPrepProjectById(id);
    } catch (error) {
      console.error('Error getting prep project:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:projects:create', async (_event, data: Partial<PrepProject>) => {
    try {
      return createPrepProject(data);
    } catch (error) {
      console.error('Error creating prep project:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'prep:projects:update',
    async (_event, id: string, updates: Partial<PrepProject>) => {
      try {
        return updatePrepProject(id, updates);
      } catch (error) {
        console.error('Error updating prep project:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:projects:delete', async (_event, id: string) => {
    try {
      deletePrepProject(id);
    } catch (error) {
      console.error('Error deleting prep project:', error);
      throw error;
    }
  });

  // ============================================
  // PREP SECTIONS
  // ============================================

  ipcMain.handle('prep:sections:getByProjectId', async (_event, projectId: string) => {
    try {
      return getSectionsByProjectId(projectId);
    } catch (error) {
      console.error('Error getting prep sections:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:sections:create', async (_event, data: Partial<PrepSection>) => {
    try {
      return createPrepSection(data);
    } catch (error) {
      console.error('Error creating prep section:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'prep:sections:update',
    async (_event, id: string, updates: Partial<PrepSection>) => {
      try {
        return updatePrepSection(id, updates);
      } catch (error) {
        console.error('Error updating prep section:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:sections:delete', async (_event, id: string) => {
    try {
      deletePrepSection(id);
    } catch (error) {
      console.error('Error deleting prep section:', error);
      throw error;
    }
  });

  // ============================================
  // PREP EQUIPMENT ITEMS
  // ============================================

  ipcMain.handle('prep:items:getBySectionId', async (_event, sectionId: string) => {
    try {
      return getItemsBySectionId(sectionId);
    } catch (error) {
      console.error('Error getting prep items by section:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:items:getByProjectId', async (_event, projectId: string) => {
    try {
      return getItemsByProjectId(projectId);
    } catch (error) {
      console.error('Error getting prep items by project:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:items:create', async (_event, data: Partial<PrepEquipmentItem>) => {
    try {
      return createPrepEquipmentItem(data);
    } catch (error) {
      console.error('Error creating prep item:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'prep:items:update',
    async (_event, id: string, updates: Partial<PrepEquipmentItem>) => {
      try {
        return updatePrepEquipmentItem(id, updates);
      } catch (error) {
        console.error('Error updating prep item:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:items:delete', async (_event, id: string) => {
    try {
      deletePrepEquipmentItem(id);
    } catch (error) {
      console.error('Error deleting prep item:', error);
      throw error;
    }
  });

  // ============================================
  // PREP REVISIONS
  // ============================================

  ipcMain.handle('prep:revisions:getByProjectId', async (_event, projectId: string) => {
    try {
      return getRevisionsByProjectId(projectId);
    } catch (error) {
      console.error('Error getting prep revisions:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:revisions:create', async (_event, data: Partial<PrepRevision>) => {
    try {
      return createPrepRevision(data);
    } catch (error) {
      console.error('Error creating prep revision:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:revisions:delete', async (_event, id: string) => {
    try {
      deletePrepRevision(id);
    } catch (error) {
      console.error('Error deleting prep revision:', error);
      throw error;
    }
  });

  // ============================================
  // PREP NOTES
  // ============================================

  ipcMain.handle(
    'prep:notes:getByProjectId',
    async (_event, projectId: string, type?: string) => {
      try {
        return getNotesByProjectId(projectId, type);
      } catch (error) {
        console.error('Error getting prep notes:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:notes:create', async (_event, data: Partial<PrepNote>) => {
    try {
      return createPrepNote(data);
    } catch (error) {
      console.error('Error creating prep note:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:notes:update', async (_event, id: string, content: string) => {
    try {
      return updatePrepNote(id, content);
    } catch (error) {
      console.error('Error updating prep note:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:notes:delete', async (_event, id: string) => {
    try {
      deletePrepNote(id);
    } catch (error) {
      console.error('Error deleting prep note:', error);
      throw error;
    }
  });

  // ============================================
  // PREP NOTE TEMPLATES
  // ============================================

  ipcMain.handle('prep:noteTemplates:getAll', async (_event, type?: string) => {
    try {
      return getAllNoteTemplates(type);
    } catch (error) {
      console.error('Error getting note templates:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:getById', async (_event, id: string) => {
    try {
      return getNoteTemplateById(id);
    } catch (error) {
      console.error('Error getting note template:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:getDefault', async (_event, type: string) => {
    try {
      return getDefaultNoteTemplate(type);
    } catch (error) {
      console.error('Error getting default note template:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:create', async (_event, data: Partial<PrepNoteTemplate>) => {
    try {
      return createNoteTemplate(data);
    } catch (error) {
      console.error('Error creating note template:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:update', async (_event, id: string, updates: Partial<PrepNoteTemplate>) => {
    try {
      return updateNoteTemplate(id, updates);
    } catch (error) {
      console.error('Error updating note template:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:delete', async (_event, id: string) => {
    try {
      deleteNoteTemplate(id);
    } catch (error) {
      console.error('Error deleting note template:', error);
      throw error;
    }
  });

  // ============================================
  // PREP FILE OPERATIONS
  // ============================================

  ipcMain.handle('prep:file:showOpenDialog', async () => {
    try {
      return await prepFileService.showOpenDialog();
    } catch (error) {
      console.error('Error showing open dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:file:showSaveDialog', async (_event, defaultName?: string) => {
    try {
      return await prepFileService.showSaveDialog(defaultName);
    } catch (error) {
      console.error('Error showing save dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:file:export', async (_event, projectId: string, filePath: string) => {
    try {
      await prepFileService.exportProject(projectId, filePath);
      return { success: true };
    } catch (error) {
      console.error('Error exporting prep project:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:file:import', async (_event, filePath: string) => {
    try {
      return await prepFileService.importProject(filePath);
    } catch (error) {
      console.error('Error importing prep project:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:file:getFileName', (_event, filePath: string) => {
    return prepFileService.getFileName(filePath);
  });

  console.log('✅ Prep IPC handlers registered');
}
