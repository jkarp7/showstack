/**
 * Unit tests for DatabaseWriter
 * Tests database persistence operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DatabaseWriter } from '../persistence/DatabaseWriter';
import { DatabaseError } from '../../errors';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    writeFileSync: vi.fn()
  };
});

// Mock sql.js Database
const createMockDatabase = () => ({
  export: vi.fn(() => new Uint8Array([1, 2, 3, 4])),
  close: vi.fn(),
  run: vi.fn(),
  exec: vi.fn()
});

describe('DatabaseWriter', () => {
  let writer: DatabaseWriter;
  let mockDb: any;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    writer = new DatabaseWriter();
    mockDb = createMockDatabase();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('save', () => {
    it('should export database data', () => {
      const dbPath = '/test/path/db.sqlite';
      const dbName = 'test';

      // We test error handling in subsequent tests
      // This test just verifies the database export is called
      try {
        writer.save(mockDb, dbPath, dbName);
      } catch {
        // Expected to fail due to file system access in test environment
      }

      // Verify database export was called
      expect(mockDb.export).toHaveBeenCalledOnce();
    });

    it('should throw DatabaseError on write failure', () => {
      const dbPath = '/test/path/db.sqlite';
      const dbName = 'test';

      // Simulate write error
      vi.mocked(fs.writeFileSync).mockImplementationOnce(() => {
        throw new Error('Disk full');
      });

      expect(() => {
        writer.save(mockDb, dbPath, dbName);
      }).toThrow(DatabaseError);
    });

    it('should include database name in error message', () => {
      const dbPath = '/test/path/db.sqlite';
      const dbName = 'project';

      vi.mocked(fs.writeFileSync).mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      expect(() => {
        writer.save(mockDb, dbPath, dbName);
      }).toThrow('Failed to save project database');
    });

    it('should log error before throwing', () => {
      const dbPath = '/test/path/db.sqlite';
      const dbName = 'app';

      vi.mocked(fs.writeFileSync).mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      try {
        writer.save(mockDb, dbPath, dbName);
      } catch {}

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
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
});
