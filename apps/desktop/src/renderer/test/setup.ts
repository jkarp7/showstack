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

    // License
    license: {
      getStatus: vi.fn().mockResolvedValue({ canCollaborate: false, tier: 'demo' }),
      getCurrent: vi.fn(),
      hasModule: vi.fn().mockResolvedValue(false),
      getModuleFeatures: vi.fn(),
      getAvailableModules: vi.fn().mockResolvedValue([]),
      canUseFeature: vi.fn().mockResolvedValue(false),
      refresh: vi.fn(),
      verifyOnline: vi.fn(),
      createDemo: vi.fn(),
    },

    // Collaboration
    collaboration: {
      inviteToProject: vi.fn().mockResolvedValue({ success: true }),
      removeProjectMember: vi.fn().mockResolvedValue({ success: true }),
      getProjectMembers: vi.fn().mockResolvedValue([]),
      acceptProjectInvitation: vi.fn().mockResolvedValue({ success: true }),
      checkPendingProjectInvitations: vi.fn().mockResolvedValue([]),
      declineProjectInvitation: vi.fn().mockResolvedValue({ success: true }),
      cancelProjectInvitation: vi.fn().mockResolvedValue({ success: true }),
      inviteToShopOrder: vi.fn().mockResolvedValue({ success: true }),
      removeShopOrderMember: vi.fn().mockResolvedValue({ success: true }),
      getShopOrderMembers: vi.fn().mockResolvedValue([]),
      acceptShopOrderInvitation: vi.fn().mockResolvedValue({ success: true }),
      checkPendingShopOrderInvitations: vi.fn().mockResolvedValue([]),
      declineShopOrderInvitation: vi.fn().mockResolvedValue({ success: true }),
      cancelShopOrderInvitation: vi.fn().mockResolvedValue({ success: true }),
      joinPresence: vi.fn().mockResolvedValue({ success: true }),
      leavePresence: vi.fn().mockResolvedValue({ success: true }),
      getPresence: vi.fn().mockResolvedValue([]),
      subscribePresence: vi.fn().mockResolvedValue({ success: true }),
      unsubscribePresence: vi.fn().mockResolvedValue({ success: true }),
      onPresenceChanged: vi.fn(),
      offPresenceChanged: vi.fn(),
    },
  };

  // Mock lucide-react icons (to avoid SVG rendering issues).
  // The factory must be self-contained (no references to outer-scope variables)
  // because vi.mock is hoisted to the top of the file before any setup code runs.
  // Each icon is mocked as () => null so React renders nothing in its place.
  vi.mock('lucide-react', () => ({
    AlertCircle: () => null,
    ChevronDown: () => null,
    ChevronRight: () => null,
    Plus: () => null,
    X: () => null,
    Check: () => null,
    Save: () => null,
    Upload: () => null,
    Download: () => null,
    Edit: () => null,
    Trash: () => null,
    Search: () => null,
    Settings: () => null,
    Users: () => null,
    UserPlus: () => null,
    Trash2: () => null,
    Crown: () => null,
    Edit3: () => null,
    Eye: () => null,
    CheckCircle2: () => null,
    Clock: () => null,
    Package: () => null,
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
  default: vi.fn(() =>
    Promise.resolve({
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
    }),
  ),
}));
