import { create } from 'zustand';
import { InfrastructureEquipment, InfrastructureStore } from '../types/infrastructure';
import { useFileStore } from './fileStore';

// Type guard for window.api
const hasAPI = (): boolean => {
  return typeof window !== 'undefined' && 'api' in window && window.api !== undefined;
};

export const useInfrastructureStore = create<InfrastructureStore>((set, get) => ({
  equipment: [],
  loading: false,
  currentProjectId: null,

  // Load infrastructure equipment from database for a specific project
  loadEquipment: async (projectId: string) => {
    if (!hasAPI()) {
      console.warn('API not available, using empty equipment');
      return;
    }

    set({ loading: true });
    try {
      const equipment = await window.api.infrastructure.getAll(projectId);
      set({ equipment, currentProjectId: projectId, loading: false });
    } catch (error) {
      console.error('Failed to load infrastructure equipment:', error);
      set({ loading: false });
    }
  },

  addEquipment: async (equipment) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    const { currentProjectId } = get();
    if (!currentProjectId) {
      console.error('No project selected');
      return;
    }

    try {
      const newEquipment = await window.api.infrastructure.create(equipment, currentProjectId);
      set((state) => ({
        equipment: [...state.equipment, newEquipment],
      }));

      // Mark file as dirty
      useFileStore.getState().setDirty(true);
    } catch (error) {
      console.error('Failed to add infrastructure equipment:', error);
      throw error;
    }
  },

  updateEquipment: async (id, updates) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const updatedEquipment = await window.api.infrastructure.update(id, updates);
      set((state) => ({
        equipment: state.equipment.map((e) =>
          e.id === id ? updatedEquipment : e
        ),
      }));

      // Mark file as dirty
      useFileStore.getState().setDirty(true);
    } catch (error) {
      console.error('Failed to update infrastructure equipment:', error);
      throw error;
    }
  },

  deleteEquipment: async (id) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      await window.api.infrastructure.delete(id);
      set((state) => ({
        equipment: state.equipment.filter((e) => e.id !== id),
      }));

      // Mark file as dirty
      useFileStore.getState().setDirty(true);
    } catch (error) {
      console.error('Failed to delete infrastructure equipment:', error);
      throw error;
    }
  },

  deleteMultiple: async (ids) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      await window.api.infrastructure.deleteMultiple(ids);
      set((state) => ({
        equipment: state.equipment.filter((e) => !ids.includes(e.id)),
      }));

      // Mark file as dirty
      useFileStore.getState().setDirty(true);
    } catch (error) {
      console.error('Failed to delete multiple infrastructure equipment:', error);
      throw error;
    }
  },
}));
