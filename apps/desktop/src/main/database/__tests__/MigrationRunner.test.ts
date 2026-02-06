// @ts-nocheck
/**
 * Unit tests for MigrationRunner
 * Tests database migration logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MigrationRunner } from '../core/MigrationRunner';
import type Database from 'better-sqlite3';

// Mock database seeding functions
vi.mock('../seedDefaultLayoutsFromJSON', () => ({
  seedDefaultPageLayoutsFromJSON: vi.fn()
}));

vi.mock('../seedPaperworkTemplates', () => ({
  seedPaperworkTemplates: vi.fn(),
  updateSystemTemplates: vi.fn(),
  reseedMissingTemplates: vi.fn()
}));

vi.mock('../seedPaperworkHeader', () => ({
  seedPaperworkHeaderTemplate: vi.fn()
}));

vi.mock('../updatePaperworkTemplateHeaders', () => ({
  updatePaperworkTemplateHeaders: vi.fn()
}));

vi.mock('../queries/layoutTemplates', () => ({
  createLayoutTemplate: vi.fn()
}));

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(() => JSON.stringify({
      template: { name: 'Test Layout', page_type: 'paperwork-header' },
      elements: []
    }))
  };
});

// Create mock database
const createMockDatabase = (overrides = {}) => ({
  run: vi.fn(),
  exec: vi.fn(() => [{ values: [[0]] }]),
  close: vi.fn(),
  export: vi.fn(() => new Uint8Array([1, 2, 3, 4])),
  ...overrides
});

describe('MigrationRunner', () => {
  let mockDb: any;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockDb = createMockDatabase();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('class structure', () => {
    it('should be instantiable with app database type', () => {
      const runner = new MigrationRunner(mockDb as Database.Database, 'app', '/test/path/app.db');
      expect(runner).toBeInstanceOf(MigrationRunner);
    });

    it('should be instantiable with project database type', () => {
      const runner = new MigrationRunner(mockDb as Database.Database, 'project', '/test/path/project.db');
      expect(runner).toBeInstanceOf(MigrationRunner);
    });

    it('should have run method', () => {
      const runner = new MigrationRunner(mockDb as Database.Database, 'app', '/test/path/app.db');
      expect(typeof runner.run).toBe('function');
    });
  });

  describe('run', () => {
    it('should execute without throwing for app database', async () => {
      const runner = new MigrationRunner(mockDb as Database.Database, 'app', '/test/path/app.db');
      await expect(runner.run()).resolves.not.toThrow();
    });

    it('should execute without throwing for project database', async () => {
      const runner = new MigrationRunner(mockDb as Database.Database, 'project', '/test/path/project.db');
      await expect(runner.run()).resolves.not.toThrow();
    });

    it('should not throw even if migrations fail', async () => {
      const failingDb = createMockDatabase({
        exec: vi.fn(() => {
          throw new Error('Migration error');
        })
      });
      const runner = new MigrationRunner(failingDb as Database.Database, 'app', '/test/path/app.db');
      await expect(runner.run()).resolves.not.toThrow();
    });

    it('should log errors when migrations fail', async () => {
      const failingDb = createMockDatabase({
        exec: vi.fn(() => {
          throw new Error('Migration error');
        })
      });
      const runner = new MigrationRunner(failingDb as Database.Database, 'app', '/test/path/app.db');
      await runner.run();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('app migrations', () => {
    it('should check for existing page layouts', async () => {
      const runner = new MigrationRunner(mockDb as Database.Database, 'app', '/test/path/app.db');
      await runner.run();

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('page_layout_templates')
      );
    });

    it('should handle empty database without errors', async () => {
      const emptyDb = createMockDatabase({
        exec: vi.fn(() => [{ values: [[0]] }])
      });
      const runner = new MigrationRunner(emptyDb as Database.Database, 'app', '/test/path/app.db');
      await expect(runner.run()).resolves.not.toThrow();
    });
  });

  describe('project migrations', () => {
    it('should check projects table structure', async () => {
      const runner = new MigrationRunner(mockDb as Database.Database, 'project', '/test/path/project.db');
      await runner.run();

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('PRAGMA table_info(projects)')
      );
    });

    it('should handle missing columns gracefully', async () => {
      const dbWithMissingColumns = createMockDatabase({
        exec: vi.fn((sql) => {
          if (sql.includes('PRAGMA table_info')) {
            // Return empty columns list to trigger migrations
            return [{ values: [] }];
          }
          return [{ values: [[0]] }];
        })
      });
      const runner = new MigrationRunner(dbWithMissingColumns as Database.Database, 'project', '/test/path/project.db');
      await expect(runner.run()).resolves.not.toThrow();
    });

    it('should add missing columns to projects table', async () => {
      const dbWithMissingColumns = createMockDatabase({
        exec: vi.fn((sql) => {
          if (sql.includes('PRAGMA table_info')) {
            // Return empty columns list
            return [{ values: [] }];
          }
          return [{ values: [[0]] }];
        }),
        run: vi.fn()
      });
      const runner = new MigrationRunner(dbWithMissingColumns as Database.Database, 'project', '/test/path/project.db');
      await runner.run();

      // Should have called run to add columns
      expect(dbWithMissingColumns.run).toHaveBeenCalled();
    });

    it('should check for infrastructure_equipment table', async () => {
      const runner = new MigrationRunner(mockDb as Database.Database, 'project', '/test/path/project.db');
      await runner.run();

      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('infrastructure_equipment')
      );
    });
  });

  describe('error resilience', () => {
    it('should continue on partial migration failure', async () => {
      let callCount = 0;
      const partiallyFailingDb = createMockDatabase({
        exec: vi.fn(() => {
          callCount++;
          if (callCount === 2) {
            throw new Error('Partial failure');
          }
          return [{ values: [[0]] }];
        })
      });
      const runner = new MigrationRunner(partiallyFailingDb as Database.Database, 'app', '/test/path/app.db');
      await expect(runner.run()).resolves.not.toThrow();
    });

    it('should log migration completion even after errors', async () => {
      const failingDb = createMockDatabase({
        exec: vi.fn(() => {
          throw new Error('Migration error');
        })
      });
      const runner = new MigrationRunner(failingDb as Database.Database, 'project', '/test/path/project.db');
      await runner.run();

      // Should still log errors but not throw
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
