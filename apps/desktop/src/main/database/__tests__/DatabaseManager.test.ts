/**
 * Unit tests for DatabaseManager
 * Tests database initialization and lifecycle management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseManager } from '../core/DatabaseManager';
import { DatabaseError } from '../../errors';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/test/user/data')
  }
}));

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => new Uint8Array([1, 2, 3, 4]))
  };
});

// Mock sql.js
vi.mock('sql.js', () => ({
  default: vi.fn(() => Promise.resolve({
    Database: vi.fn(() => ({
      run: vi.fn(),
      exec: vi.fn(() => [{ values: [[0]] }]),
      close: vi.fn(),
      export: vi.fn(() => new Uint8Array([1, 2, 3, 4]))
    }))
  }))
}));

// Mock MigrationRunner
vi.mock('../core/MigrationRunner', () => ({
  MigrationRunner: vi.fn(() => ({
    run: vi.fn(() => Promise.resolve())
  }))
}));

describe('DatabaseManager', () => {
  let manager: DatabaseManager;

  beforeEach(() => {
    manager = new DatabaseManager();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be instantiable', () => {
      expect(manager).toBeInstanceOf(DatabaseManager);
    });

    it('should have initialize method', () => {
      expect(typeof manager.initialize).toBe('function');
    });

    it('should have getAppDatabase method', () => {
      expect(typeof manager.getAppDatabase).toBe('function');
    });

    it('should have getProjectDatabase method', () => {
      expect(typeof manager.getProjectDatabase).toBe('function');
    });

    it('should have getPaths method', () => {
      expect(typeof manager.getPaths).toBe('function');
    });

    it('should have reloadProjectDatabase method', () => {
      expect(typeof manager.reloadProjectDatabase).toBe('function');
    });

    it('should have replaceProjectDatabase method', () => {
      expect(typeof manager.replaceProjectDatabase).toBe('function');
    });

    it('should have close method', () => {
      expect(typeof manager.close).toBe('function');
    });
  });

  describe('getAppDatabase', () => {
    it('should throw DatabaseError if not initialized', () => {
      expect(() => {
        manager.getAppDatabase();
      }).toThrow(DatabaseError);
    });

    it('should include helpful error message', () => {
      expect(() => {
        manager.getAppDatabase();
      }).toThrow('App database not initialized');
    });
  });

  describe('getProjectDatabase', () => {
    it('should throw DatabaseError if not initialized', () => {
      expect(() => {
        manager.getProjectDatabase();
      }).toThrow(DatabaseError);
    });

    it('should include helpful error message', () => {
      expect(() => {
        manager.getProjectDatabase();
      }).toThrow('Project database not initialized');
    });
  });

  describe('getPaths', () => {
    it('should return paths object', () => {
      const paths = manager.getPaths();
      expect(paths).toHaveProperty('appDbPath');
      expect(paths).toHaveProperty('projectDbPath');
    });

    it('should return empty strings before initialization', () => {
      const paths = manager.getPaths();
      expect(paths.appDbPath).toBe('');
      expect(paths.projectDbPath).toBe('');
    });
  });

  describe('close', () => {
    it('should not throw when closing uninitialized databases', () => {
      expect(() => {
        manager.close();
      }).not.toThrow();
    });
  });
});
