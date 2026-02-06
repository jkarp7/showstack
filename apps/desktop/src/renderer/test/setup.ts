import { vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Only run jsdom-specific setup when in jsdom environment
const isJsdom = typeof window !== 'undefined' && typeof window.document !== 'undefined';

if (isJsdom) {
  // Import jest-dom matchers for DOM assertions
  await import('@testing-library/jest-dom');

  // Cleanup after each test
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => {
    cleanup();
  });

  // Mock Electron APIs (renderer process)
  // This provides basic mocks for window.api calls
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
      getByProject: vi.fn().mockResolvedValue([]),
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
  };

  // Mock lucide-react icons (to avoid SVG rendering issues)
  const mockIcon = (name: string) => {
    return (props: any) => React.createElement('div', {
      'data-testid': `icon-${name.toLowerCase()}`,
      ...props
    }, name);
  };

  vi.mock('lucide-react', () => ({
    AlertCircle: mockIcon('AlertCircle'),
    ChevronDown: mockIcon('ChevronDown'),
    ChevronRight: mockIcon('ChevronRight'),
    Plus: mockIcon('Plus'),
    X: mockIcon('X'),
    Check: mockIcon('Check'),
    Save: mockIcon('Save'),
    Upload: mockIcon('Upload'),
    Download: mockIcon('Download'),
    Edit: mockIcon('Edit'),
    Trash: mockIcon('Trash'),
    Search: mockIcon('Search'),
    Settings: mockIcon('Settings'),
  }));

  // Suppress noisy console output in tests
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
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
}

// Mock sql.js (used by database) - safe in both environments
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
