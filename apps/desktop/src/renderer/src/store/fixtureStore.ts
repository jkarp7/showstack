import { create } from 'zustand';
import { logger } from '../utils/logger';
import { Fixture, FixtureStore } from '../types';
import { useFileStore } from './fileStore';
import { useUndoRedoStore } from './undoRedoStore';
import {
  AddFixtureCommand,
  UpdateFixtureCommand,
  DeleteFixtureCommand,
  BulkUpdateFixturesCommand,
  BulkDeleteFixturesCommand,
} from '../commands/fixtureCommands';

// Type guard for window.api
const hasAPI = (): boolean => {
  return typeof window !== 'undefined' && 'api' in window && window.api !== undefined;
};

export const useFixtureStore = create<FixtureStore>((set, get) => ({
  fixtures: [],
  currentProjectId: null,

  // Set current project ID
  setCurrentProjectId: (projectId: string | null) => {
    set({ currentProjectId: projectId });
  },

  // Load fixtures from database for a specific project
  loadFixtures: async (projectId?: string) => {
    if (!hasAPI()) {
      logger.warn('API not available, using empty fixtures');
      return;
    }

    try {
      const fixtures = await window.api.fixtures.getAll(projectId);
      set({ fixtures, currentProjectId: projectId || null });
    } catch (error) {
      logger.error('Failed to load fixtures:', error);
    }
  },

  addFixture: async (fixture) => {
    if (!hasAPI()) {
      logger.warn('API not available');
      return;
    }

    try {
      const { currentProjectId } = get();
      const fixtureData = { ...fixture, project_id: currentProjectId || undefined };
      const command = new AddFixtureCommand(fixtureData);
      await useUndoRedoStore.getState().executeCommand(command);
    } catch (error) {
      logger.error('Failed to add fixture:', error);
    }
  },

  addMultipleFixtures: async (fixtures) => {
    if (!hasAPI()) {
      logger.warn('API not available');
      return;
    }

    try {
      const { currentProjectId } = get();
      // Add each fixture as a separate command
      // This allows individual undo operations
      for (const fixture of fixtures) {
        const fixtureData = { ...fixture, project_id: currentProjectId || undefined };
        const command = new AddFixtureCommand(fixtureData);
        await useUndoRedoStore.getState().executeCommand(command);
      }
    } catch (error) {
      logger.error('Failed to add fixtures:', error);
    }
  },

  updateFixture: async (id, updates) => {
    if (!hasAPI()) {
      logger.warn('API not available');
      return;
    }

    try {
      const oldFixture = get().fixtures.find((f) => f.id === id);
      if (!oldFixture) {
        logger.error('Fixture not found:', id);
        return;
      }

      const command = new UpdateFixtureCommand(id, oldFixture, updates);
      await useUndoRedoStore.getState().executeCommand(command);
    } catch (error) {
      logger.error('Failed to update fixture:', error);
    }
  },

  bulkUpdate: async (fixtureIds, updates) => {
    if (!hasAPI()) {
      logger.warn('API not available');
      return;
    }

    try {
      const fixtureUpdates = fixtureIds
        .map((id) => {
          const oldFixture = get().fixtures.find((f) => f.id === id);
          if (!oldFixture) return null;
          return { id, oldData: oldFixture, newData: updates };
        })
        .filter(
          (update): update is { id: string; oldData: Fixture; newData: Partial<Fixture> } =>
            update !== null,
        );

      if (fixtureUpdates.length === 0) {
        logger.error('No fixtures found to update');
        return;
      }

      const command = new BulkUpdateFixturesCommand(fixtureUpdates);
      await useUndoRedoStore.getState().executeCommand(command);
    } catch (error) {
      logger.error('Failed to bulk update fixtures:', error);
    }
  },

  deleteFixture: async (id) => {
    if (!hasAPI()) {
      logger.warn('API not available');
      return;
    }

    try {
      const fixture = get().fixtures.find((f) => f.id === id);
      if (!fixture) {
        logger.error('Fixture not found:', id);
        return;
      }

      const command = new DeleteFixtureCommand(fixture);
      await useUndoRedoStore.getState().executeCommand(command);
    } catch (error) {
      logger.error('Failed to delete fixture:', error);
    }
  },

  deleteMultiple: async (ids) => {
    if (!hasAPI()) {
      logger.warn('API not available');
      return;
    }

    try {
      const fixtures = get().fixtures.filter((f) => ids.includes(f.id));
      if (fixtures.length === 0) {
        logger.error('No fixtures found to delete');
        return;
      }

      const command = new BulkDeleteFixturesCommand(fixtures);
      await useUndoRedoStore.getState().executeCommand(command);
    } catch (error) {
      logger.error('Failed to delete multiple fixtures:', error);
    }
  },
}));
