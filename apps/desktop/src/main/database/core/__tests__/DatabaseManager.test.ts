/**
 * Tests for DatabaseManager — WAL checkpoint result
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { MigrationRunner } from '../MigrationRunner';

// Mock electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-userdata'),
  },
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock MigrationRunner
vi.mock('../MigrationRunner', () => ({
  MigrationRunner: vi.fn(),
}));

// Mock errorHandler
vi.mock('../../../errors', () => ({
  errorHandler: {
    executeWithRetry: vi.fn(async (fn: () => Promise<void>) => fn()),
  },
  DatabaseError: class DatabaseError extends Error {
    constructor(
      message: string,
      public operation: string,
      public isRetryable: boolean,
      public cause?: Error,
    ) {
      super(message);
    }
  },
}));

// Mock performance indexes
vi.mock('../../indexes/performanceIndexes', () => ({
  createPerformanceIndexes: vi.fn(),
}));

const mockPragma = vi.fn();
const mockExec = vi.fn();
const mockPrepare = vi.fn();
const mockClose = vi.fn();

vi.mock('better-sqlite3', () => ({
  default: vi.fn(),
}));

import { DatabaseManager, CheckpointResult } from '../DatabaseManager';

describe('DatabaseManager', () => {
  let manager: DatabaseManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new DatabaseManager();

    // Setup pragma mock to handle different pragma calls during initialization
    mockPragma.mockImplementation((pragma: string) => {
      if (pragma.startsWith('wal_checkpoint')) {
        return [{ busy: 0, log: 100, checkpointed: 100 }];
      }
      if (pragma === 'page_size') {
        return [{ page_size: 4096 }];
      }
      return [];
    });

    mockPrepare.mockReturnValue({
      run: vi.fn(),
      get: vi.fn().mockReturnValue({ count: 1 }),
    });

    // Re-setup better-sqlite3 constructor mock
    vi.mocked(Database).mockImplementation(
      () =>
        ({
          pragma: mockPragma,
          exec: mockExec,
          prepare: mockPrepare,
          close: mockClose,
        }) as unknown as Database.Database,
    );

    // Re-setup MigrationRunner mock
    vi.mocked(MigrationRunner).mockImplementation(
      () =>
        ({
          run: vi.fn().mockResolvedValue(undefined),
        }) as unknown as MigrationRunner,
    );
  });

  describe('forceCheckpoint', () => {
    it('should return CheckpointResult with busy flags', async () => {
      await manager.initialize();

      mockPragma.mockImplementation((pragma: string) => {
        if (pragma.startsWith('wal_checkpoint')) {
          return [{ busy: 0, log: 50, checkpointed: 50 }];
        }
        return [];
      });

      const result: CheckpointResult = manager.forceCheckpoint();

      expect(result).toEqual({ appBusy: false, projectBusy: false });
    });

    it('should report appBusy when app DB checkpoint is busy', async () => {
      await manager.initialize();

      let callCount = 0;
      mockPragma.mockImplementation((pragma: string) => {
        if (pragma.startsWith('wal_checkpoint')) {
          callCount++;
          // First call is app DB, second is project DB
          if (callCount === 1) {
            return [{ busy: 1, log: 50, checkpointed: 30 }];
          }
          return [{ busy: 0, log: 50, checkpointed: 50 }];
        }
        return [];
      });

      const result = manager.forceCheckpoint();

      expect(result.appBusy).toBe(true);
      expect(result.projectBusy).toBe(false);
    });

    it('should report projectBusy when project DB checkpoint is busy', async () => {
      await manager.initialize();

      let callCount = 0;
      mockPragma.mockImplementation((pragma: string) => {
        if (pragma.startsWith('wal_checkpoint')) {
          callCount++;
          if (callCount === 1) {
            return [{ busy: 0, log: 50, checkpointed: 50 }];
          }
          return [{ busy: 1, log: 50, checkpointed: 30 }];
        }
        return [];
      });

      const result = manager.forceCheckpoint();

      expect(result.appBusy).toBe(false);
      expect(result.projectBusy).toBe(true);
    });

    it('should report both busy when both DBs are busy', async () => {
      await manager.initialize();

      mockPragma.mockImplementation((pragma: string) => {
        if (pragma.startsWith('wal_checkpoint')) {
          return [{ busy: 1, log: 100, checkpointed: 50 }];
        }
        return [];
      });

      const result = manager.forceCheckpoint();

      expect(result.appBusy).toBe(true);
      expect(result.projectBusy).toBe(true);
    });

    it('should return not busy when databases are not initialized', () => {
      // Don't initialize — both DBs are null
      const result = manager.forceCheckpoint();

      expect(result).toEqual({ appBusy: false, projectBusy: false });
    });
  });
});
