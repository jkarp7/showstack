/**
 * Unit tests for DatabaseWriter
 * Tests database persistence operations
 *
 * Note: With better-sqlite3's WAL mode, DatabaseWriter methods are now no-ops.
 * All writes are automatically persisted to disk by the WAL journal.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseWriter } from '../persistence/DatabaseWriter';

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('DatabaseWriter', () => {
  let writer: DatabaseWriter;
  let mockDb: any;

  beforeEach(() => {
    writer = new DatabaseWriter();
    mockDb = {
      prepare: vi.fn(() => ({
        run: vi.fn(),
        get: vi.fn(),
        all: vi.fn()
      })),
      pragma: vi.fn(),
      close: vi.fn()
    };
  });

  describe('class structure', () => {
    it('should be instantiable', () => {
      expect(writer).toBeInstanceOf(DatabaseWriter);
    });

    it('should have save method', () => {
      expect(typeof writer.save).toBe('function');
    });

    it('should have saveWithRetry method', () => {
      expect(typeof writer.saveWithRetry).toBe('function');
    });
  });

  describe('save', () => {
    it('should be a no-op with WAL mode (does not throw)', () => {
      expect(() => {
        writer.save(mockDb, '/test/path/db.sqlite', 'test');
      }).not.toThrow();
    });

    it('should not attempt to write files (WAL handles persistence)', () => {
      writer.save(mockDb, '/test/path/db.sqlite', 'test');

      // No file operations should occur - WAL mode auto-persists
      expect(mockDb.prepare).not.toHaveBeenCalled();
    });
  });

  describe('saveWithRetry', () => {
    it('should be a no-op with WAL mode (does not throw)', async () => {
      await expect(
        writer.saveWithRetry(mockDb, '/test/path/db.sqlite', 'test')
      ).resolves.not.toThrow();
    });

    it('should resolve immediately without file operations', async () => {
      await writer.saveWithRetry(mockDb, '/test/path/db.sqlite', 'test');

      // No file operations should occur - WAL mode auto-persists
      expect(mockDb.prepare).not.toHaveBeenCalled();
    });
  });
});
