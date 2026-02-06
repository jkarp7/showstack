/**
 * Unit tests for DatabaseManager
 * Tests database initialization, lifecycle management, and WAL checkpoint monitoring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../core/DatabaseManager';
import type { WalCheckpointConfig } from '../core/DatabaseManager';
import { DatabaseError } from '../../errors';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/test/user/data')
  }
}));

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock better-sqlite3
const createMockBetterSqlite3Db = () => ({
  pragma: vi.fn().mockReturnValue([{ busy: 0, log: 0, checkpointed: 0 }]),
  exec: vi.fn(),
  prepare: vi.fn().mockReturnValue({
    run: vi.fn(),
    get: vi.fn().mockReturnValue({ count: 1 }),
    all: vi.fn().mockReturnValue([])
  }),
  close: vi.fn()
});

vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => createMockBetterSqlite3Db())
}));

// Mock MigrationRunner
vi.mock('../core/MigrationRunner', () => ({
  MigrationRunner: vi.fn(() => ({
    run: vi.fn(() => Promise.resolve())
  }))
}));

// Mock errorHandler
vi.mock('../../errors', async () => {
  const actual = await vi.importActual('../../errors');
  return {
    ...actual,
    errorHandler: {
      executeWithRetry: vi.fn(async (fn: () => Promise<void>) => fn())
    }
  };
});

// Mock performance indexes
vi.mock('../indexes/performanceIndexes', () => ({
  createPerformanceIndexes: vi.fn()
}));

describe('DatabaseManager', () => {
  let manager: DatabaseManager;

  beforeEach(() => {
    manager = new DatabaseManager();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up any intervals
    manager.stopPeriodicCheckpointing();
    vi.useRealTimers();
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

  describe('WAL checkpoint configuration', () => {
    it('should return default config', () => {
      const config = manager.getWalConfig();
      expect(config.checkpointIntervalMs).toBe(5 * 60 * 1000);
      expect(config.sizeWarningThreshold).toBe(10000);
    });

    it('should update config with partial values', () => {
      manager.configureWalCheckpoint({ checkpointIntervalMs: 60000 });
      const config = manager.getWalConfig();
      expect(config.checkpointIntervalMs).toBe(60000);
      expect(config.sizeWarningThreshold).toBe(10000); // unchanged
    });

    it('should update config with all values', () => {
      manager.configureWalCheckpoint({
        checkpointIntervalMs: 120000,
        sizeWarningThreshold: 5000
      });
      const config = manager.getWalConfig();
      expect(config.checkpointIntervalMs).toBe(120000);
      expect(config.sizeWarningThreshold).toBe(5000);
    });

    it('should return a copy (not reference) from getWalConfig', () => {
      const config1 = manager.getWalConfig();
      (config1 as any).checkpointIntervalMs = 999;
      const config2 = manager.getWalConfig();
      expect(config2.checkpointIntervalMs).toBe(5 * 60 * 1000);
    });
  });

  describe('periodic checkpointing', () => {
    it('should start periodic checkpointing', () => {
      manager.startPeriodicCheckpointing();
      // Should not throw
      manager.stopPeriodicCheckpointing();
    });

    it('should stop periodic checkpointing', () => {
      manager.startPeriodicCheckpointing();
      manager.stopPeriodicCheckpointing();
      // Should not throw when stopping again
      manager.stopPeriodicCheckpointing();
    });

    it('should clean up previous interval when starting again', () => {
      manager.startPeriodicCheckpointing();
      // Starting again should not leak intervals
      manager.startPeriodicCheckpointing();
      manager.stopPeriodicCheckpointing();
    });
  });

  describe('getWalStatus', () => {
    it('should return null for both databases when not initialized', () => {
      const status = manager.getWalStatus();
      expect(status.app).toBeNull();
      expect(status.project).toBeNull();
    });
  });

  describe('forceCheckpoint', () => {
    it('should not throw when databases are not initialized', () => {
      expect(() => {
        manager.forceCheckpoint();
      }).not.toThrow();
    });
  });

  describe('WAL checkpoint methods exist', () => {
    it('should have startPeriodicCheckpointing method', () => {
      expect(typeof manager.startPeriodicCheckpointing).toBe('function');
    });

    it('should have stopPeriodicCheckpointing method', () => {
      expect(typeof manager.stopPeriodicCheckpointing).toBe('function');
    });

    it('should have forceCheckpoint method', () => {
      expect(typeof manager.forceCheckpoint).toBe('function');
    });

    it('should have configureWalCheckpoint method', () => {
      expect(typeof manager.configureWalCheckpoint).toBe('function');
    });

    it('should have getWalConfig method', () => {
      expect(typeof manager.getWalConfig).toBe('function');
    });

    it('should have getWalStatus method', () => {
      expect(typeof manager.getWalStatus).toBe('function');
    });
  });

  describe('validateSQLiteDatabase (via replaceProjectDatabase)', () => {
    it('should reject empty data', async () => {
      await expect(
        manager.replaceProjectDatabase(new Uint8Array([]))
      ).rejects.toThrow(DatabaseError);
    });

    it('should reject data too small for SQLite header', async () => {
      await expect(
        manager.replaceProjectDatabase(new Uint8Array(50))
      ).rejects.toThrow(DatabaseError);
    });

    it('should reject data without SQLite magic bytes', async () => {
      const invalidData = new Uint8Array(200);
      invalidData.fill(0);
      await expect(
        manager.replaceProjectDatabase(invalidData)
      ).rejects.toThrow(DatabaseError);
    });
  });
});
