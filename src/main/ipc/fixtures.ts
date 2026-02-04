import { ipcMain } from 'electron';
import {
  getAllFixtures,
  createFixture,
  updateFixture,
  deleteFixture,
  deleteMultipleFixtures,
  Fixture
} from '../database/queries/fixtures';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

export function registerFixtureHandlers(): void {
  // Get all fixtures for a project
  ipcMain.handle('fixtures:getAll', async (_event, projectId?: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getAllFixtures(projectId),
        'fixtures:getAll'
      );
    } catch (error) {
      console.error('Failed to get fixtures:', {
        operation: 'fixtures:getAll',
        projectId,
        error: error instanceof Error ? error.message : error
      });

      // Return user-friendly error
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load fixtures: ${error.message}`);
      }
      throw error;
    }
  });

  // Create fixture
  ipcMain.handle('fixtures:create', async (_event, fixture: Partial<Fixture>, projectId?: string) => {
    try {
      // Basic validation
      if (!fixture.type) {
        throw new ValidationError(
          'Fixture type is required',
          'type',
          fixture.type
        );
      }

      return await errorHandler.executeWithRetry(
        async () => createFixture(fixture, projectId),
        'fixtures:create'
      );
    } catch (error) {
      console.error('Failed to create fixture:', {
        operation: 'fixtures:create',
        fixture,
        error: error instanceof Error ? error.message : error
      });

      // Return user-friendly error
      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to create fixture: ${error.message}`);
      }
      throw error;
    }
  });

  // Update fixture
  ipcMain.handle('fixtures:update', async (_event, id: string, updates: Partial<Fixture>) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => updateFixture(id, updates),
        'fixtures:update'
      );
    } catch (error) {
      console.error('Failed to update fixture:', {
        operation: 'fixtures:update',
        id,
        updates,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to update fixture: ${error.message}`);
      }
      throw error;
    }
  });

  // Delete fixture
  ipcMain.handle('fixtures:delete', async (_event, id: string) => {
    try {
      await errorHandler.executeWithRetry(
        async () => deleteFixture(id),
        'fixtures:delete'
      );
    } catch (error) {
      console.error('Failed to delete fixture:', {
        operation: 'fixtures:delete',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete fixture: ${error.message}`);
      }
      throw error;
    }
  });

  // Delete multiple fixtures
  ipcMain.handle('fixtures:deleteMultiple', async (_event, ids: string[]) => {
    try {
      await errorHandler.executeWithRetry(
        async () => deleteMultipleFixtures(ids),
        'fixtures:deleteMultiple'
      );
    } catch (error) {
      console.error('Failed to delete multiple fixtures:', {
        operation: 'fixtures:deleteMultiple',
        count: ids.length,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete fixtures: ${error.message}`);
      }
      throw error;
    }
  });

  console.log('✅ Fixture IPC handlers registered');
}
