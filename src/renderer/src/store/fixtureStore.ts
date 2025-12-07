import { create } from 'zustand';
import { Fixture, FixtureStore } from '../types';
import { useFileStore } from './fileStore';

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
      console.warn('API not available, using empty fixtures');
      return;
    }

    try {
      const fixtures = await window.api.fixtures.getAll(projectId);
      set({ fixtures, currentProjectId: projectId || null });
    } catch (error) {
      console.error('Failed to load fixtures:', error);
    }
  },

  addFixture: async (fixture) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const { currentProjectId } = get();
      const newFixture = await window.api.fixtures.create(fixture, currentProjectId || undefined);
      set((state) => ({
        fixtures: [...state.fixtures, newFixture],
      }));

      // Mark file as dirty
      useFileStore.getState().setDirty(true);
    } catch (error) {
      console.error('Failed to add fixture:', error);
    }
  },

  addMultipleFixtures: async (fixtures) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const { currentProjectId } = get();
      const newFixtures = [];
      for (const fixture of fixtures) {
        const newFixture = await window.api.fixtures.create(fixture, currentProjectId || undefined);
        newFixtures.push(newFixture);
      }
      set((state) => ({
        fixtures: [...state.fixtures, ...newFixtures],
      }));

      // Mark file as dirty
      useFileStore.getState().setDirty(true);
    } catch (error) {
      console.error('Failed to add fixtures:', error);
    }
  },

  updateFixture: async (id, updates) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const updatedFixture = await window.api.fixtures.update(id, updates);
      set((state) => ({
        fixtures: state.fixtures.map((f) =>
          f.id === id ? updatedFixture : f
        ),
      }));

      // Mark file as dirty
      useFileStore.getState().setDirty(true);
    } catch (error) {
      console.error('Failed to update fixture:', error);
    }
  },

  deleteFixture: async (id) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      await window.api.fixtures.delete(id);
      set((state) => ({
        fixtures: state.fixtures.filter((f) => f.id !== id),
      }));

      // Mark file as dirty
      useFileStore.getState().setDirty(true);
    } catch (error) {
      console.error('Failed to delete fixture:', error);
    }
  },

  deleteMultiple: async (ids) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      await window.api.fixtures.deleteMultiple(ids);
      set((state) => ({
        fixtures: state.fixtures.filter((f) => !ids.includes(f.id)),
      }));

      // Mark file as dirty
      useFileStore.getState().setDirty(true);
    } catch (error) {
      console.error('Failed to delete multiple fixtures:', error);
    }
  },
}));
