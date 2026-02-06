import { ipcMain } from 'electron';
import { getPreference, setPreference, getAllPreferences } from '../database/queries/preferences';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

export function registerPreferencesHandlers() {
  ipcMain.handle('preferences:get', async (_event, projectId: string, key: string) => {
    try {
      // Basic validation
      if (!key || key.trim().length === 0) {
        throw new ValidationError('Preference key is required', 'key', key);
      }

      return await errorHandler.executeWithRetry(
        async () => getPreference(projectId, key),
        'preferences:get',
      );
    } catch (error) {
      console.error('Failed to get preference:', {
        operation: 'preferences:get',
        projectId,
        key,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load preference: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle('preferences:set', async (_event, projectId: string, key: string, value: any) => {
    try {
      // Basic validation
      if (!key || key.trim().length === 0) {
        throw new ValidationError('Preference key is required', 'key', key);
      }

      await errorHandler.executeWithRetry(
        async () => setPreference(projectId, key, value),
        'preferences:set',
      );
    } catch (error) {
      console.error('Failed to set preference:', {
        operation: 'preferences:set',
        projectId,
        key,
        value,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to save preference: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle('preferences:getAll', async (_event, projectId: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getAllPreferences(projectId),
        'preferences:getAll',
      );
    } catch (error) {
      console.error('Failed to get all preferences:', {
        operation: 'preferences:getAll',
        projectId,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load preferences: ${error.message}`);
      }
      throw error;
    }
  });
}
