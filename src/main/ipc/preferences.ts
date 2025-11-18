import { ipcMain } from 'electron';
import { getPreference, setPreference, getAllPreferences } from '../database/queries/preferences';

export function registerPreferencesHandlers() {
  ipcMain.handle('preferences:get', async (_event, projectId: string, key: string) => {
    return getPreference(projectId, key);
  });

  ipcMain.handle('preferences:set', async (_event, projectId: string, key: string, value: any) => {
    setPreference(projectId, key, value);
  });

  ipcMain.handle('preferences:getAll', async (_event, projectId: string) => {
    return getAllPreferences(projectId);
  });
}
