import { create } from 'zustand';
import { logger } from '../utils/logger';

interface ShopOrderFileStore {
  // State
  currentFilePath: string | null;
  currentFileName: string;
  isDirty: boolean;
  isSaving: boolean;
  isOpening: boolean;
  lastSavedAt: number | null;
  errorMessage: string | null;

  // Actions
  setFilePath: (path: string | null) => void;
  setFileName: (name: string) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setOpening: (opening: boolean) => void;
  clearError: () => void;
  newFile: (projectName: string) => void;
  openFile: (
    onSuccess?: (projectId: string, projectName: string) => Promise<void>,
  ) => Promise<boolean>;
  saveFile: (projectId: string, projectName: string) => Promise<boolean>;
  saveFileAs: (projectId: string, projectName: string) => Promise<boolean>;
  getCurrentFileName: () => string;
}

export const useShopOrderFileStore = create<ShopOrderFileStore>((set, get) => ({
  // Initial state
  currentFilePath: null,
  currentFileName: 'Untitled Shop Order',
  isDirty: false,
  isSaving: false,
  isOpening: false,
  lastSavedAt: null,
  errorMessage: null,

  // Set file path
  setFilePath: (path) => set({ currentFilePath: path }),

  // Set file name
  setFileName: (name) => set({ currentFileName: name }),

  // Set dirty state
  setDirty: (dirty) => set({ isDirty: dirty }),

  // Set saving state
  setSaving: (saving) => set({ isSaving: saving }),

  // Set opening state
  setOpening: (opening) => set({ isOpening: opening }),

  // Clear error message
  clearError: () => set({ errorMessage: null }),

  // Get current filename
  getCurrentFileName: () => {
    const { currentFilePath, currentFileName } = get();
    if (currentFilePath) {
      // Extract filename from path
      const parts = currentFilePath.replace(/\\/g, '/').split('/');
      const filename = parts[parts.length - 1];
      return filename.replace(/\.(ss|ssd)$/, '');
    }
    return currentFileName;
  },

  // New file (doesn't clear anything, just resets file state)
  newFile: (projectName) => {
    set({
      currentFilePath: null,
      currentFileName: projectName,
      isDirty: true, // Mark as dirty since it's a new unsaved project
      lastSavedAt: null,
    });
  },

  // Open file
  openFile: async (onSuccess) => {
    const state = get();

    // Check for unsaved changes
    if (state.isDirty) {
      if (
        !confirm(
          'Opening a file will load a new project. Any unsaved changes will be lost. Continue?',
        )
      ) {
        return false;
      }
    }

    try {
      set({ isOpening: true });

      const filePath = await window.api.prep.file.showOpenDialog();
      if (!filePath) {
        set({ isOpening: false });
        return false; // User canceled
      }

      const result = await window.api.prep.file.import(filePath);
      if (!result.success) {
        set({ isOpening: false, errorMessage: result.error || 'Failed to open file' });
        return false;
      }

      // Update state
      set({
        currentFilePath: filePath,
        currentFileName: result.projectName || 'Untitled Shop Order',
        isDirty: false,
        isOpening: false,
        lastSavedAt: Date.now(),
      });

      // Reload data
      if (onSuccess && result.projectId) {
        await onSuccess(result.projectId, result.projectName);
      }

      return true;
    } catch (error) {
      logger.error('Error opening file:', error);
      set({ isOpening: false, errorMessage: 'Failed to open shop order' });
      return false;
    }
  },

  // Save file (save to current path or prompt for new path)
  saveFile: async (projectId, projectName) => {
    const state = get();
    const filePath = state.currentFilePath;

    // If no current file path, prompt for one
    if (!filePath) {
      return get().saveFileAs(projectId, projectName);
    }

    try {
      set({ isSaving: true });

      await window.api.prep.file.export(projectId, filePath);

      set({
        isDirty: false,
        isSaving: false,
        lastSavedAt: Date.now(),
      });

      return true;
    } catch (error) {
      logger.error('Error saving file:', error);
      set({ isSaving: false, errorMessage: 'Failed to save shop order' });
      return false;
    }
  },

  // Save file as (prompt for new path)
  saveFileAs: async (projectId, projectName) => {
    try {
      set({ isSaving: true });

      const filePath = await window.api.prep.file.showSaveDialog(projectName);
      if (!filePath) {
        set({ isSaving: false });
        return false; // User canceled
      }

      await window.api.prep.file.export(projectId, filePath);

      set({
        currentFilePath: filePath,
        currentFileName: projectName,
        isDirty: false,
        isSaving: false,
        lastSavedAt: Date.now(),
      });

      return true;
    } catch (error) {
      logger.error('Error saving file:', error);
      set({ isSaving: false, errorMessage: 'Failed to save shop order' });
      return false;
    }
  },
}));
