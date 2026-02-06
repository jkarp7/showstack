/**
 * Unit tests for MigrationRunner
 * Tests database migration logic for better-sqlite3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MigrationRunner } from '../core/MigrationRunner';
import type Database from 'better-sqlite3';

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock database seeding functions
vi.mock('../seedDefaultLayoutsFromJSON', () => ({
  seedDefaultPageLayoutsFromJSON: vi.fn(),
}));

vi.mock('../seedPaperworkTemplates', () => ({
  seedPaperworkTemplates: vi.fn(),
  updateSystemTemplates: vi.fn(),
  reseedMissingTemplates: vi.fn(),
}));

vi.mock('../seedPaperworkHeader', () => ({
  seedPaperworkHeaderTemplate: vi.fn(),
}));

vi.mock('../updatePaperworkTemplateHeaders', () => ({
  updatePaperworkTemplateHeaders: vi.fn(),
}));

vi.mock('../queries/layoutTemplates', () => ({
  createLayoutTemplate: vi.fn(),
}));

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(() =>
      JSON.stringify({
        template: { name: 'Test Layout', page_type: 'paperwork-header' },
        elements: [],
      }),
    ),
  };
});

/**
 * Create a mock better-sqlite3 database.
 * better-sqlite3 uses db.prepare(sql).get/all/run pattern, not db.exec/db.run.
 */
const createMockDatabase = (overrides: Record<string, any> = {}) => {
  const mockRun = vi.fn();
  const mockGet = vi.fn().mockReturnValue({ count: 0 });
  const mockAll = vi.fn().mockReturnValue([]);
  const mockPrepare = vi.fn().mockReturnValue({
    run: mockRun,
    get: mockGet,
    all: mockAll,
  });

  return {
    prepare: mockPrepare,
    exec: vi.fn(),
    close: vi.fn(),
    pragma: vi.fn(),
    _mockRun: mockRun,
    _mockGet: mockGet,
    _mockAll: mockAll,
    _mockPrepare: mockPrepare,
    ...overrides,
  };
};

describe('MigrationRunner', () => {
  let mockDb: ReturnType<typeof createMockDatabase>;
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
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'app',
        '/test/path/app.db',
      );
      expect(runner).toBeInstanceOf(MigrationRunner);
    });

    it('should be instantiable with project database type', () => {
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'project',
        '/test/path/project.db',
      );
      expect(runner).toBeInstanceOf(MigrationRunner);
    });

    it('should have run method', () => {
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'app',
        '/test/path/app.db',
      );
      expect(typeof runner.run).toBe('function');
    });
  });

  describe('run', () => {
    it('should execute without throwing for app database', async () => {
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'app',
        '/test/path/app.db',
      );
      await expect(runner.run()).resolves.not.toThrow();
    });

    it('should execute without throwing for project database', async () => {
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'project',
        '/test/path/project.db',
      );
      await expect(runner.run()).resolves.not.toThrow();
    });

    it('should not throw even if migrations fail', async () => {
      const failingDb = createMockDatabase({
        prepare: vi.fn(() => {
          throw new Error('Migration error');
        }),
      });
      const runner = new MigrationRunner(
        failingDb as unknown as Database.Database,
        'app',
        '/test/path/app.db',
      );
      await expect(runner.run()).resolves.not.toThrow();
    });
  });

  describe('app migrations', () => {
    it('should query page_layout_templates count', async () => {
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'app',
        '/test/path/app.db',
      );
      await runner.run();

      // MigrationRunner uses prepare().get() to check page_layout_templates
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('page_layout_templates'));
    });

    it('should handle empty database without errors', async () => {
      // Return 0 count for all queries
      mockDb._mockGet.mockReturnValue({ count: 0 });
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'app',
        '/test/path/app.db',
      );
      await expect(runner.run()).resolves.not.toThrow();
    });
  });

  describe('project migrations', () => {
    it('should check projects table structure via PRAGMA', async () => {
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'project',
        '/test/path/project.db',
      );
      await runner.run();

      // MigrationRunner uses prepare("PRAGMA table_info(projects)").all()
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('PRAGMA table_info(projects)'),
      );
    });

    it('should add missing columns to projects table', async () => {
      // Return empty columns list so all columns need to be added
      const prepareResults = new Map<string, any>();

      const mockPrepare = vi.fn((sql: string) => {
        if (sql.includes('PRAGMA table_info')) {
          return {
            run: vi.fn(),
            get: vi.fn().mockReturnValue({ count: 0 }),
            all: vi.fn().mockReturnValue([]),
          };
        }
        if (sql.includes('sqlite_master')) {
          return {
            run: vi.fn(),
            get: vi.fn().mockReturnValue({ count: 0 }),
            all: vi.fn().mockReturnValue([]),
          };
        }
        // ALTER TABLE and other DDL
        return {
          run: vi.fn(),
          get: vi.fn().mockReturnValue({ count: 0 }),
          all: vi.fn().mockReturnValue([]),
        };
      });

      const dbWithNoColumns = createMockDatabase({ prepare: mockPrepare });
      const runner = new MigrationRunner(
        dbWithNoColumns as unknown as Database.Database,
        'project',
        '/test/path/project.db',
      );
      await runner.run();

      // Should have called prepare with ALTER TABLE for missing columns
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE projects ADD COLUMN logo_path'),
      );
    });

    it('should check for infrastructure_equipment table', async () => {
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'project',
        '/test/path/project.db',
      );
      await runner.run();

      // MigrationRunner checks sqlite_master for infrastructure_equipment
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('infrastructure_equipment'),
      );
    });

    it('should handle missing columns gracefully', async () => {
      // Return empty columns so all migrations run
      mockDb._mockAll.mockReturnValue([]);
      const runner = new MigrationRunner(
        mockDb as unknown as Database.Database,
        'project',
        '/test/path/project.db',
      );
      await expect(runner.run()).resolves.not.toThrow();
    });
  });

  describe('error resilience', () => {
    it('should continue on partial migration failure', async () => {
      let callCount = 0;
      const partiallyFailingPrepare = vi.fn(() => {
        callCount++;
        if (callCount === 3) {
          throw new Error('Partial failure');
        }
        return {
          run: vi.fn(),
          get: vi.fn().mockReturnValue({ count: 0 }),
          all: vi.fn().mockReturnValue([]),
        };
      });

      const partiallyFailingDb = createMockDatabase({ prepare: partiallyFailingPrepare });
      const runner = new MigrationRunner(
        partiallyFailingDb as unknown as Database.Database,
        'app',
        '/test/path/app.db',
      );
      await expect(runner.run()).resolves.not.toThrow();
    });

    it('should not throw when project migration fails', async () => {
      const failingPrepare = vi.fn(() => {
        throw new Error('Migration error');
      });

      const failingDb = createMockDatabase({ prepare: failingPrepare });
      const runner = new MigrationRunner(
        failingDb as unknown as Database.Database,
        'project',
        '/test/path/project.db',
      );
      await expect(runner.run()).resolves.not.toThrow();
    });
  });
});
