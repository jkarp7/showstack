import { create } from 'zustand';
import { logger } from '../utils/logger';
import { addRecentFile, getModuleTypeFromPath } from '../utils/recentFiles';

export interface ConflictInfo {
  existingProject: {
    id: string;
    name: string;
    updated_at: number;
  };
  importedProject: {
    id: string;
    name: string;
    updated_at: number;
  };
}

interface FileStore {
  // State
  currentFilePath: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isOpening: boolean;
  lastSavedAt: number | null;
  error: string | null;
  conflictInfo: ConflictInfo | null;
  conflictFilePath: string | null;
  importMessage: string | null; // set when a file is auto-stacked into a family

  // Actions
  setFilePath: (path: string | null) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setOpening: (opening: boolean) => void;
  setError: (error: string | null) => void;
  setConflict: (conflict: ConflictInfo | null, filePath: string | null) => void;
  clearImportMessage: () => void;
  openFile: (onSuccess?: () => Promise<void>) => Promise<boolean>;
  openFileByPath: (filePath: string, onSuccess?: () => Promise<void>) => Promise<boolean>;
  resolveConflict: (
    action: 'replace' | 'keep-both' | 'cancel',
    onSuccess?: () => Promise<void>,
  ) => Promise<boolean>;
  saveFile: () => Promise<boolean>;
  saveFileAs: (projectName?: string, onSuccess?: () => Promise<void>) => Promise<boolean>;
  newFile: (onSuccess?: () => Promise<void>) => Promise<boolean>;
  getCurrentFileName: () => string;
}

export const useFileStore = create<FileStore>((set, get) => ({
  // Initial state
  currentFilePath: null,
  isDirty: false,
  isSaving: false,
  isOpening: false,
  lastSavedAt: null,
  error: null,
  conflictInfo: null,
  conflictFilePath: null,
  importMessage: null,

  // Set file path
  setFilePath: (path) => set({ currentFilePath: path }),

  // Set dirty state
  setDirty: (dirty) => set({ isDirty: dirty }),

  // Set saving state
  setSaving: (saving) => set({ isSaving: saving }),

  // Set opening state
  setOpening: (opening) => set({ isOpening: opening }),

  // Set error
  setError: (error) => set({ error }),

  // Set conflict
  setConflict: (conflict, filePath) => set({ conflictInfo: conflict, conflictFilePath: filePath }),

  // Clear import message
  clearImportMessage: () => set({ importMessage: null }),

  // Get current filename (without path and extension)
  getCurrentFileName: () => {
    const { currentFilePath } = get();
    if (!currentFilePath) {
      return 'Untitled Project';
    }
    // Extract filename from path locally (works cross-platform)
    const parts = currentFilePath.replace(/\\/g, '/').split('/');
    const filename = parts[parts.length - 1];
    // Remove any ShowStack extension (.ss, or legacy .ssp, .ssm, .ssd, .showstack)
    return filename.replace(/\.(ss|ssp|ssm|ssd|showstack)$/, '');
  },

  // Open file
  openFile: async (onSuccess) => {
    const state = get();

    // Check for unsaved changes
    if (state.isDirty) {
      const shouldContinue = await new Promise<boolean>((resolve) => {
        // This will be handled by the UnsavedChangesDialog component
        const event = new CustomEvent('showUnsavedChangesDialog', {
          detail: {
            action: 'open',
            onSave: async () => {
              await state.saveFile();
              resolve(true);
            },
            onDiscard: () => {
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
            },
          },
        });
        window.dispatchEvent(event);
      });

      if (!shouldContinue) {
        return false;
      }
    }

    try {
      set({ isOpening: true, error: null, conflictInfo: null, conflictFilePath: null });

      const result = await window.api.files.open();

      if (!result) {
        // User canceled
        set({ isOpening: false });
        return false;
      }

      // Check for conflict
      if (!result.success && result.conflict?.exists) {
        logger.info('Import conflict detected:', result.conflict);
        set({
          conflictInfo: {
            existingProject: result.conflict.existingProject,
            importedProject: result.conflict.importedProject,
          },
          conflictFilePath: result.filePath,
          isOpening: false,
        });
        return false; // Conflict needs resolution
      }

      if (!result.success) {
        logger.error('Open failed:', result.error);
        set({ error: result.error || 'Failed to open file', isOpening: false });
        return false;
      }

      // Update file state
      set({
        currentFilePath: result.filePath || null,
        isDirty: false,
        isOpening: false,
        lastSavedAt: Date.now(),
        importMessage: result.autoStacked
          ? `"${result.projectName}" was imported and added to its version stack.`
          : null,
      });

      // Add to recent files
      if (result.filePath && result.projectName) {
        const moduleType = getModuleTypeFromPath(result.filePath);
        await addRecentFile(result.filePath, result.projectName, moduleType);
      }

      // Call success callback to reload data
      if (onSuccess) {
        await onSuccess();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open file';
      logger.error('Error in openFile:', error);
      set({ error: errorMessage, isOpening: false });
      return false;
    }
  },

  // Open file by path (without showing dialog)
  openFileByPath: async (filePath, onSuccess) => {
    const state = get();

    // Check for unsaved changes
    if (state.isDirty) {
      const shouldContinue = await new Promise<boolean>((resolve) => {
        const event = new CustomEvent('showUnsavedChangesDialog', {
          detail: {
            action: 'open',
            onSave: async () => {
              await state.saveFile();
              resolve(true);
            },
            onDiscard: () => {
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
            },
          },
        });
        window.dispatchEvent(event);
      });

      if (!shouldContinue) {
        return false;
      }
    }

    try {
      set({ isOpening: true, error: null, conflictInfo: null, conflictFilePath: null });

      const result = await window.api.files.openByPath(filePath);

      // Check for conflict
      if (!result.success && result.conflict?.exists) {
        logger.info('Import conflict detected:', result.conflict);
        set({
          conflictInfo: {
            existingProject: result.conflict.existingProject,
            importedProject: result.conflict.importedProject,
          },
          conflictFilePath: filePath,
          isOpening: false,
        });
        return false; // Conflict needs resolution
      }

      if (!result.success) {
        logger.error('Open failed:', result.error);
        set({ error: result.error || 'Failed to open file', isOpening: false });
        return false;
      }

      // Update file state
      set({
        currentFilePath: filePath,
        isDirty: false,
        isOpening: false,
        lastSavedAt: Date.now(),
        importMessage: result.autoStacked
          ? `"${result.projectName}" was imported and added to its version stack.`
          : null,
      });

      // Add to recent files
      if (result.projectName) {
        const moduleType = getModuleTypeFromPath(filePath);
        await addRecentFile(filePath, result.projectName, moduleType);
      }

      // Call success callback to reload data
      if (onSuccess) {
        await onSuccess();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open file';
      logger.error('Error in openFileByPath:', error);
      set({ error: errorMessage, isOpening: false });
      return false;
    }
  },

  // Resolve import conflict
  resolveConflict: async (action, onSuccess) => {
    const state = get();

    if (!state.conflictFilePath || !state.conflictInfo) {
      logger.error('No conflict to resolve');
      return false;
    }

    if (action === 'cancel') {
      set({ conflictInfo: null, conflictFilePath: null });
      return false;
    }

    try {
      set({ isOpening: true, error: null });

      const result = await window.api.files.resolveConflict(state.conflictFilePath, {
        action,
        projectId: state.conflictInfo.importedProject.id,
      });

      if (!result.success) {
        logger.error('Conflict resolution failed:', result.error);
        set({ error: result.error || 'Failed to resolve conflict', isOpening: false });
        return false;
      }

      // Clear conflict state
      set({
        conflictInfo: null,
        conflictFilePath: null,
        currentFilePath: result.filePath || null,
        isDirty: false,
        isOpening: false,
        lastSavedAt: Date.now(),
      });

      // Add to recent files
      if (result.filePath && result.projectName) {
        const moduleType = getModuleTypeFromPath(result.filePath);
        await addRecentFile(result.filePath, result.projectName, moduleType);
      }

      // Call success callback to reload data
      if (onSuccess) {
        await onSuccess();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve conflict';
      logger.error('Error in resolveConflict:', error);
      set({ error: errorMessage, isOpening: false });
      return false;
    }
  },

  // Save file
  saveFile: async () => {
    const state = get();

    try {
      set({ isSaving: true, error: null });

      // If no file path, show save as dialog
      if (!state.currentFilePath) {
        return await state.saveFileAs();
      }

      // Save to existing path
      const filePath = await window.api.files.save(state.currentFilePath);

      if (!filePath) {
        // Save failed or was canceled
        set({ isSaving: false });
        return false;
      }

      // Update state
      set({
        currentFilePath: filePath,
        isDirty: false,
        isSaving: false,
        lastSavedAt: Date.now(),
      });

      // Update recent files timestamp
      const filename =
        filePath
          .replace(/\\/g, '/')
          .split('/')
          .pop()
          ?.replace(/\.(ssp|ssm|ssd|showstack)$/, '') || 'Untitled Project';
      const moduleType = getModuleTypeFromPath(filePath);
      await addRecentFile(filePath, filename, moduleType);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save file';
      set({ error: errorMessage, isSaving: false });
      return false;
    }
  },

  // Save file as (always show dialog)
  saveFileAs: async (projectName, onSuccess) => {
    const defaultName = projectName || 'Untitled Project';

    try {
      set({ isSaving: true, error: null });

      // Default to PRODUCTION module (can be made dynamic in the future)
      const filePath = await window.api.files.saveAs(defaultName, 'PRODUCTION');

      if (!filePath) {
        // User canceled
        set({ isSaving: false });
        return false;
      }

      // Extract new filename and update project name in database
      const parts = filePath.replace(/\\/g, '/').split('/');
      const filename = parts[parts.length - 1];
      // Remove any ShowStack extension (.ss, or legacy .ssp, .ssm, .ssd, .showstack)
      const newProjectName = filename.replace(/\.(ss|ssp|ssm|ssd|showstack)$/, '');

      // Update project name in database
      if (window.api?.projects) {
        try {
          await window.api.projects.update('default-project', { name: newProjectName });
        } catch (error) {
          logger.error('Failed to update project name:', error);
        }
      }

      // Update state
      set({
        currentFilePath: filePath,
        isDirty: false,
        isSaving: false,
        lastSavedAt: Date.now(),
      });

      // Add to recent files
      const moduleType = getModuleTypeFromPath(filePath);
      await addRecentFile(filePath, newProjectName, moduleType);

      // Call success callback to reload project name
      if (onSuccess) {
        await onSuccess();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save file';
      set({ error: errorMessage, isSaving: false });
      return false;
    }
  },

  // Create new file
  newFile: async (onSuccess) => {
    const state = get();

    // Check for unsaved changes
    if (state.isDirty) {
      const shouldContinue = await new Promise<boolean>((resolve) => {
        const event = new CustomEvent('showUnsavedChangesDialog', {
          detail: {
            action: 'new',
            onSave: async () => {
              await state.saveFile();
              resolve(true);
            },
            onDiscard: () => {
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
            },
          },
        });
        window.dispatchEvent(event);
      });

      if (!shouldContinue) {
        return false;
      }
    }

    try {
      set({ error: null });

      // Create new project in database
      await window.api.files.new();

      // Reset file state
      set({
        currentFilePath: null,
        isDirty: false,
        lastSavedAt: null,
      });

      // Call success callback to reload data
      if (onSuccess) {
        await onSuccess();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create new file';
      logger.error('Error in newFile:', error);
      set({ error: errorMessage });
      return false;
    }
  },
}));

// Expose store to window for close handler in main process
if (typeof window !== 'undefined') {
  (window as any).__fileStore = {
    get isDirty() {
      return useFileStore.getState().isDirty;
    },
    async saveFile() {
      return await useFileStore.getState().saveFile();
    },
  };
}
