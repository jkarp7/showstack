import { create } from 'zustand';
import { Fixture, FixtureStore } from '../types';

// Type guard for window.api
const hasAPI = (): boolean => {
  return typeof window !== 'undefined' && 'api' in window && window.api !== undefined;
};

export const useFixtureStore = create<FixtureStore>((set, get) => ({
  fixtures: [],

  // Load fixtures from database (call this on app init)
  loadFixtures: async () => {
    if (!hasAPI()) {
      console.warn('API not available, using empty fixtures');
      return;
    }

    try {
      const fixtures = await window.api.fixtures.getAll();
      set({ fixtures });
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
      const newFixture = await window.api.fixtures.create(fixture);
      set((state) => ({
        fixtures: [...state.fixtures, newFixture],
      }));
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
      const newFixtures = [];
      for (const fixture of fixtures) {
        const newFixture = await window.api.fixtures.create(fixture);
        newFixtures.push(newFixture);
      }
      set((state) => ({
        fixtures: [...state.fixtures, ...newFixtures],
      }));
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
    } catch (error) {
      console.error('Failed to delete multiple fixtures:', error);
    }
  },
}));
