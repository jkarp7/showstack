import { ipcMain } from 'electron';
import {
  getAllFixtures,
  createFixture,
  updateFixture,
  deleteFixture,
  deleteMultipleFixtures,
  Fixture
} from '../database/queries/fixtures';

export function registerFixtureHandlers(): void {
  // Get all fixtures
  ipcMain.handle('fixtures:getAll', async () => {
    try {
      return getAllFixtures();
    } catch (error) {
      console.error('Error getting fixtures:', error);
      throw error;
    }
  });

  // Create fixture
  ipcMain.handle('fixtures:create', async (_event, fixture: Partial<Fixture>) => {
    try {
      return createFixture(fixture);
    } catch (error) {
      console.error('Error creating fixture:', error);
      throw error;
    }
  });

  // Update fixture
  ipcMain.handle('fixtures:update', async (_event, id: string, updates: Partial<Fixture>) => {
    try {
      return updateFixture(id, updates);
    } catch (error) {
      console.error('Error updating fixture:', error);
      throw error;
    }
  });

  // Delete fixture
  ipcMain.handle('fixtures:delete', async (_event, id: string) => {
    try {
      deleteFixture(id);
    } catch (error) {
      console.error('Error deleting fixture:', error);
      throw error;
    }
  });

  // Delete multiple fixtures
  ipcMain.handle('fixtures:deleteMultiple', async (_event, ids: string[]) => {
    try {
      deleteMultipleFixtures(ids);
    } catch (error) {
      console.error('Error deleting multiple fixtures:', error);
      throw error;
    }
  });

  console.log('✅ Fixture IPC handlers registered');
}
