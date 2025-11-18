import { create } from 'zustand';

interface FileStore {
  // State
  currentFilePath: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isOpening: boolean;
  lastSavedAt: number | null;
  error: string | null;

  // Actions
  setFilePath: (path: string | null) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setOpening: (opening: boolean) => void;
  setError: (error: string | null) => void;
  openFile: (onSuccess?: () => Promise<void>) => Promise<boolean>;
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

  // Get current filename (without path and extension)
  getCurrentFileName: () => {
    const { currentFilePath } = get();
    if (!currentFilePath) {
      return 'Untitled Project';
    }
    // Extract filename from path locally (works cross-platform)
    const parts = currentFilePath.replace(/\\/g, '/').split('/');
    const filename = parts[parts.length - 1];
    // Remove .showstack extension
    return filename.replace(/\.showstack$/, '');
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
            onDiscard: () => resolve(true),
            onCancel: () => resolve(false)
          }
        });
        window.dispatchEvent(event);
      });

      if (!shouldContinue) {
        return false;
      }
    }

    try {
      set({ isOpening: true, error: null });

      const result = await window.api.files.open();

      if (!result) {
        // User canceled
        set({ isOpening: false });
        return false;
      }

      if (!result.success) {
        set({ error: result.error || 'Failed to open file', isOpening: false });
        return false;
      }

      // Update file state
      set({
        currentFilePath: result.filePath || null,
        isDirty: false,
        isOpening: false,
        lastSavedAt: Date.now()
      });

      // Call success callback to reload data
      if (onSuccess) {
        await onSuccess();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open file';
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
        lastSavedAt: Date.now()
      });

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

      const filePath = await window.api.files.saveAs(defaultName);

      if (!filePath) {
        // User canceled
        set({ isSaving: false });
        return false;
      }

      // Extract new filename and update project name in database
      const parts = filePath.replace(/\\/g, '/').split('/');
      const filename = parts[parts.length - 1];
      const newProjectName = filename.replace(/\.showstack$/, '');

      // Update project name in database
      if (window.api?.projects) {
        try {
          await window.api.projects.update('default-project', { name: newProjectName });
        } catch (error) {
          console.error('Failed to update project name:', error);
        }
      }

      // Update state
      set({
        currentFilePath: filePath,
        isDirty: false,
        isSaving: false,
        lastSavedAt: Date.now()
      });

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
            onDiscard: () => resolve(true),
            onCancel: () => resolve(false)
          }
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
        lastSavedAt: null
      });

      // Call success callback to reload data
      if (onSuccess) {
        await onSuccess();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create new file';
      set({ error: errorMessage });
      return false;
    }
  }
}));

// Expose store to window for close handler in main process
if (typeof window !== 'undefined') {
  (window as any).__fileStore = {
    get isDirty() {
      return useFileStore.getState().isDirty;
    },
    async saveFile() {
      return await useFileStore.getState().saveFile();
    }
  };
}
