import { ipcMain } from 'electron';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getCurrentProject,
  Project
} from '../database/queries/projects';

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:getAll', async () => {
    try {
      return getAllProjects();
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  });

  ipcMain.handle('projects:getCurrent', async () => {
    try {
      return getCurrentProject();
    } catch (error) {
      console.error('Error getting current project:', error);
      throw error;
    }
  });

  ipcMain.handle('projects:getById', async (_event, id: string) => {
    try {
      return getProjectById(id);
    } catch (error) {
      console.error('Error getting project by id:', error);
      throw error;
    }
  });

  ipcMain.handle('projects:create', async (_event, name: string, description?: string, logoPath?: string, enabledModules?: string[]) => {
    try {
      return createProject(name, description, logoPath, enabledModules);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  });

  ipcMain.handle('projects:update', async (_event, id: string, updates: Partial<Project>) => {
    try {
      return updateProject(id, updates);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  });

  ipcMain.handle('projects:delete', async (_event, id: string) => {
    try {
      deleteProject(id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  });

  console.log('✅ Project IPC handlers registered');
}
