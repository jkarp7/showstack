import { create } from 'zustand';
import { logger } from '../utils/logger';
import { FixtureGroup, GroupStore } from '../types/group';

const hasAPI = (): boolean =>
  typeof window !== 'undefined' && 'api' in window && window.api !== undefined;

function buildPinsByGroup(
  allPins: { fixture_id: string; group_id: string }[],
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const pin of allPins) {
    if (!map[pin.group_id]) map[pin.group_id] = [];
    map[pin.group_id].push(pin.fixture_id);
  }
  return map;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  allPins: [],
  pinsByGroup: {},
  loading: false,
  currentProjectId: null,

  loadGroups: async (projectId: string) => {
    if (!hasAPI()) {
      logger.warn('API not available, using empty groups');
      return;
    }
    set({ loading: true });
    try {
      const [groups, allPins] = await Promise.all([
        window.api.groups.getAll(projectId),
        window.api.groups.getAllPins(projectId),
      ]);
      set({
        groups,
        allPins,
        pinsByGroup: buildPinsByGroup(allPins),
        currentProjectId: projectId,
        loading: false,
      });
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
    set((state) => {
      const allPins = state.allPins.filter((p) => p.group_id !== id);
      const pinsByGroup = { ...state.pinsByGroup };
      delete pinsByGroup[id];
      return { groups: state.groups.filter((g) => g.id !== id), allPins, pinsByGroup };
    });
  },

  addPin: async (groupId: string, fixtureId: string): Promise<void> => {
    if (!hasAPI()) throw new Error('API not available');
    await window.api.groups.addPin(groupId, fixtureId);
    set((state) => {
      const already = state.allPins.some(
        (p) => p.fixture_id === fixtureId && p.group_id === groupId,
      );
      if (already) return {};
      const allPins = [...state.allPins, { fixture_id: fixtureId, group_id: groupId }];
      const pinsByGroup = {
        ...state.pinsByGroup,
        [groupId]: [...(state.pinsByGroup[groupId] ?? []), fixtureId],
      };
      return { allPins, pinsByGroup };
    });
  },

  removePin: async (groupId: string, fixtureId: string): Promise<void> => {
    if (!hasAPI()) throw new Error('API not available');
    await window.api.groups.removePin(groupId, fixtureId);
    set((state) => {
      const allPins = state.allPins.filter(
        (p) => !(p.fixture_id === fixtureId && p.group_id === groupId),
      );
      const pinsByGroup = {
        ...state.pinsByGroup,
        [groupId]: (state.pinsByGroup[groupId] ?? []).filter((id) => id !== fixtureId),
      };
      return { allPins, pinsByGroup };
    });
  },
}));
