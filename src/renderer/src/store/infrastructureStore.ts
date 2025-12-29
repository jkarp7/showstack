import { create } from 'zustand';
import { InfrastructureEquipment, InfrastructureStore } from '../types/infrastructure';
import { useFileStore } from './fileStore';
import { useUndoRedoStore } from './undoRedoStore';
import {
  AddInfrastructureCommand,
  UpdateInfrastructureCommand,
  DeleteInfrastructureCommand,
  BulkDeleteInfrastructureCommand,
} from '../commands/infrastructureCommands';

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
      const equipmentData = { ...equipment, project_id: currentProjectId };
      const command = new AddInfrastructureCommand(equipmentData);
      await useUndoRedoStore.getState().executeCommand(command);
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
      const oldEquipment = get().equipment.find((e) => e.id === id);
      if (!oldEquipment) {
        console.error('Equipment not found:', id);
        return;
      }

      const command = new UpdateInfrastructureCommand(id, oldEquipment, updates);
      await useUndoRedoStore.getState().executeCommand(command);
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
      const equipment = get().equipment.find((e) => e.id === id);
      if (!equipment) {
        console.error('Equipment not found:', id);
        return;
      }

      const command = new DeleteInfrastructureCommand(equipment);
      await useUndoRedoStore.getState().executeCommand(command);
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
      const equipment = get().equipment.filter((e) => ids.includes(e.id));
      if (equipment.length === 0) {
        console.error('No equipment found to delete');
        return;
      }

      const command = new BulkDeleteInfrastructureCommand(equipment);
      await useUndoRedoStore.getState().executeCommand(command);
    } catch (error) {
      console.error('Failed to delete multiple infrastructure equipment:', error);
      throw error;
    }
  },
}));
