import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Electron APIs (renderer process)
// This provides basic mocks for window.api calls
global.window = global.window || {};
(global.window as any).api = {
  // File operations
  files: {
    open: vi.fn(),
    save: vi.fn(),
    saveAs: vi.fn(),
    new: vi.fn(),
    readImageAsDataUrl: vi.fn(),
    checkUnsavedChanges: vi.fn().mockResolvedValue(false),
  },

  // Project operations
  projects: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(),
  },

  // Fixture operations
  fixtures: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    bulkUpdate: vi.fn(),
  },

  // Infrastructure operations
  infrastructure: {
    validatePortAssignment: vi.fn().mockResolvedValue({ valid: true }),
    createEquipment: vi.fn(),
    updateEquipment: vi.fn(),
    getAllEquipment: vi.fn().mockResolvedValue([]),
  },

  // Prep operations
  prep: {
    createProject: vi.fn(),
    updateProject: vi.fn(),
    createSection: vi.fn(),
    createEquipmentItem: vi.fn(),
    layoutTemplates: {
      getById: vi.fn(),
      getByProjectId: vi.fn().mockResolvedValue([]),
      getDefault: vi.fn(),
      getElements: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
    },
  },

  // Settings
  settings: {
    get: vi.fn(),
    set: vi.fn(),
  },

  // Shell
  shell: {
    openExternal: vi.fn(),
  },

  // Menu
  menu: {
    on: vi.fn(),
    off: vi.fn(),
  },

  // Add other IPC handlers as needed...
};

// Mock sql.js (used by database)
vi.mock('sql.js', () => ({
  default: vi.fn(() => Promise.resolve({
    Database: vi.fn(() => ({
      run: vi.fn(),
      exec: vi.fn(),
      prepare: vi.fn(() => ({
        step: vi.fn(),
        getAsObject: vi.fn(),
        free: vi.fn(),
      })),
      close: vi.fn(),
    })),
  })),
}));

// Mock lucide-react icons (to avoid SVG rendering issues)
vi.mock('lucide-react', () => ({
  // Return simple div components for all icons
  AlertCircle: () => '<div>AlertCircle</div>',
  ChevronDown: () => '<div>ChevronDown</div>',
  ChevronRight: () => '<div>ChevronRight</div>',
  Plus: () => '<div>Plus</div>',
  X: () => '<div>X</div>',
  Check: () => '<div>Check</div>',
  Save: () => '<div>Save</div>',
  Upload: () => '<div>Upload</div>',
  Download: () => '<div>Download</div>',
  Edit: () => '<div>Edit</div>',
  Trash: () => '<div>Trash</div>',
  Search: () => '<div>Search</div>',
  Settings: () => '<div>Settings</div>',
  // Add other icons as needed
}));

// Suppress console errors in tests (optional - can be noisy)
// Comment out if you want to see all console output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Filter out known React warnings
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('Not implemented: HTMLFormElement.prototype.submit') ||
      message.includes('Not implemented: HTMLCanvasElement.prototype.getContext')
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('ReactDOM.render')) {
      return;
    }
    originalConsoleWarn(...args);
  };
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
