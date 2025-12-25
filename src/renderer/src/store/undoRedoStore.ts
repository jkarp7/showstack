import { create } from 'zustand';
import { Command } from '../types/commands';

interface UndoRedoState {
  /** Stack of commands that can be undone */
  undoStack: Command[];

  /** Stack of commands that can be redone */
  redoStack: Command[];

  /** Maximum number of commands to keep in history (to prevent memory issues) */
  maxHistorySize: number;

  /** Execute a command and add it to the undo stack */
  executeCommand: (command: Command) => Promise<void>;

  /** Undo the most recent command */
  undo: () => Promise<void>;

  /** Redo the most recently undone command */
  redo: () => Promise<void>;

  /** Clear all undo/redo history */
  clearHistory: () => void;

  /** Check if undo is possible */
  canUndo: () => boolean;

  /** Check if redo is possible */
  canRedo: () => boolean;

  /** Get description of the next undo operation */
  getUndoDescription: () => string | null;

  /** Get description of the next redo operation */
  getRedoDescription: () => string | null;
}

export const useUndoRedoStore = create<UndoRedoState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistorySize: 100,

  executeCommand: async (command: Command) => {
    try {
      // Execute the command
      await command.execute();

      // Add to undo stack and clear redo stack
      set((state) => {
        const newUndoStack = [...state.undoStack, command];

        // Limit stack size
        if (newUndoStack.length > state.maxHistorySize) {
          newUndoStack.shift(); // Remove oldest command
        }

        return {
          undoStack: newUndoStack,
          redoStack: [], // Clear redo stack when new command is executed
        };
      });
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  },

  undo: async () => {
    const { undoStack } = get();

    if (undoStack.length === 0) {
      console.warn('Nothing to undo');
      return;
    }

    // Pop the last command from undo stack
    const command = undoStack[undoStack.length - 1];

    try {
      // Execute the undo operation
      await command.undo();

      // Move command from undo stack to redo stack
      set((state) => ({
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, command],
      }));
    } catch (error) {
      console.error('Failed to undo command:', error);
      // Remove the failed command from the stack
      set((state) => ({
        undoStack: state.undoStack.slice(0, -1),
      }));
      throw error;
    }
  },

  redo: async () => {
    const { redoStack } = get();

    if (redoStack.length === 0) {
      console.warn('Nothing to redo');
      return;
    }

    // Pop the last command from redo stack
    const command = redoStack[redoStack.length - 1];

    try {
      // Re-execute the command
      await command.execute();

      // Move command from redo stack to undo stack
      set((state) => ({
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, command],
      }));
    } catch (error) {
      console.error('Failed to redo command:', error);
      // Remove the failed command from the stack
      set((state) => ({
        redoStack: state.redoStack.slice(0, -1),
      }));
      throw error;
    }
  },

  clearHistory: () => {
    set({
      undoStack: [],
      redoStack: [],
    });
  },

  canUndo: () => {
    return get().undoStack.length > 0;
  },

  canRedo: () => {
    return get().redoStack.length > 0;
  },

  getUndoDescription: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    return undoStack[undoStack.length - 1].description;
  },

  getRedoDescription: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    return redoStack[redoStack.length - 1].description;
  },
}));
