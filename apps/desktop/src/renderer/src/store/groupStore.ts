import { create } from 'zustand';
import { logger } from '../utils/logger';
import { FixtureGroup, GroupStore } from '../types/group';

const hasAPI = (): boolean =>
  typeof window !== 'undefined' && 'api' in window && window.api !== undefined;

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  loading: false,
  currentProjectId: null,

  loadGroups: async (projectId: string) => {
    if (!hasAPI()) {
      logger.warn('API not available, using empty groups');
      return;
    }
    set({ loading: true });
    try {
      const groups = await window.api.groups.getAll(projectId);
      set({ groups, currentProjectId: projectId, loading: false });
    } catch (error) {
      logger.error('Failed to load groups', {
        error: error instanceof Error ? error.message : String(error),
      });
      set({ loading: false });
    }
  },

  createGroup: async (data: Partial<FixtureGroup>, projectId: string): Promise<FixtureGroup> => {
    if (!hasAPI()) throw new Error('API not available');
    const created = await window.api.groups.create(data, projectId);
    set((state) => ({ groups: [...state.groups, created] }));
    return created;
  },

  updateGroup: async (id: string, updates: Partial<FixtureGroup>): Promise<void> => {
    if (!hasAPI()) throw new Error('API not available');
    const updated = await window.api.groups.update(id, updates);
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? updated : g)),
    }));
  },

  deleteGroup: async (id: string): Promise<void> => {
    if (!hasAPI()) throw new Error('API not available');
    await window.api.groups.delete(id);
    set((state) => ({ groups: state.groups.filter((g) => g.id !== id) }));
  },

  addPin: async (groupId: string, fixtureId: string): Promise<void> => {
    if (!hasAPI()) throw new Error('API not available');
    await window.api.groups.addPin(groupId, fixtureId);
  },

  removePin: async (groupId: string, fixtureId: string): Promise<void> => {
    if (!hasAPI()) throw new Error('API not available');
    await window.api.groups.removePin(groupId, fixtureId);
  },
}));
