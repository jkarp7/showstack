/**
 * Tests for HealthChecker Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-userdata'),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
  },
  access: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
  constants: { R_OK: 4, W_OK: 2 },
}));

// Mock database manager
const mockGetAppDb = vi.fn();
const mockGetProjectDb = vi.fn();
vi.mock('../../database/core/DatabaseManager', () => ({
  databaseManager: {
    getAppDatabase: () => mockGetAppDb(),
    getProjectDatabase: () => mockGetProjectDb(),
  },
}));

// Mock config
vi.mock('../../config/env', () => ({
  getConfig: vi.fn(() => ({
    app: { nodeEnv: 'development', debugDatabase: false, debugPowerSync: false },
    supabase: { url: undefined, anonKey: undefined, serviceRoleKey: undefined },
    powersync: { url: '' },
    isConfigured: false,
  })),
}));

// Mock sync
vi.mock('../../ipc/sync', () => ({
  getPowerSyncStatus: vi.fn(() => null),
}));

import { HealthCheckerService } from '../HealthChecker';
import * as fs from 'fs/promises';
import { getConfig } from '../../config/env';
import { getPowerSyncStatus } from '../../ipc/sync';
import type { Config } from '../../config/env';

// Helper to create a mock config with powersync URL
function mockConfig(powersyncUrl: string): Config {
  return {
    app: { nodeEnv: 'development', debugDatabase: false, debugPowerSync: false },
    supabase: { url: undefined, anonKey: undefined, serviceRoleKey: undefined },
    powersync: { url: powersyncUrl || undefined },
    isConfigured: false,
  };
}

describe('HealthChecker', () => {
  let checker: HealthCheckerService;

  beforeEach(() => {
    vi.clearAllMocks();
    checker = new HealthCheckerService();

    // Default healthy mocks
    mockGetAppDb.mockReturnValue({
      prepare: () => ({ get: () => ({ ok: 1 }) }),
    });
    mockGetProjectDb.mockReturnValue({
      prepare: () => ({ get: () => ({ ok: 1 }) }),
    });
    vi.mocked(fs.access).mockResolvedValue(undefined);
  });

  describe('check()', () => {
    it('should return healthy when all checks pass', async () => {
      const report = await checker.check();

      expect(report.status).toBe('healthy');
      expect(report.timestamp).toBeDefined();
      expect(report.checks.database.status).toBe('healthy');
      expect(report.checks.filesystem.status).toBe('healthy');
      expect(report.checks.memory.status).toBe('healthy');
      expect(report.checks.sync.status).toBe('healthy');
    });

    it('should return degraded when one check is degraded', async () => {
      // Project DB not available
      mockGetProjectDb.mockImplementation(() => {
        throw new Error('not loaded');
      });

      const report = await checker.check();

      expect(report.status).toBe('degraded');
      expect(report.checks.database.status).toBe('degraded');
    });

    it('should return unhealthy when one check is unhealthy', async () => {
      // App DB not responding
      mockGetAppDb.mockImplementation(() => {
        throw new Error('SQLITE_CORRUPT');
      });

      const report = await checker.check();

      expect(report.status).toBe('unhealthy');
      expect(report.checks.database.status).toBe('unhealthy');
    });

    it('should include a timestamp in ISO format', async () => {
      const report = await checker.check();

      expect(() => new Date(report.timestamp)).not.toThrow();
      expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('database check', () => {
    it('should be healthy when both databases respond', async () => {
      const report = await checker.check();

      expect(report.checks.database.status).toBe('healthy');
      expect(report.checks.database.message).toContain('Both databases');
    });

    it('should be degraded when project database is unavailable', async () => {
      mockGetProjectDb.mockImplementation(() => {
        throw new Error('not loaded');
      });

      const report = await checker.check();

      expect(report.checks.database.status).toBe('degraded');
      expect(report.checks.database.message).toContain('project database not available');
    });

    it('should be unhealthy when app database fails', async () => {
      mockGetAppDb.mockImplementation(() => {
        throw new Error('SQLITE_CORRUPT');
      });

      const report = await checker.check();

      expect(report.checks.database.status).toBe('unhealthy');
      expect(report.checks.database.message).toContain('Database error');
    });
  });

  describe('filesystem check', () => {
    it('should be healthy when filesystem is accessible', async () => {
      const report = await checker.check();

      expect(report.checks.filesystem.status).toBe('healthy');
    });

    it('should be unhealthy when filesystem is not accessible', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('EACCES'));

      const report = await checker.check();

      expect(report.checks.filesystem.status).toBe('unhealthy');
      expect(report.checks.filesystem.message).toContain('Filesystem error');
    });
  });

  describe('memory check', () => {
    it('should be healthy with normal memory usage', async () => {
      const report = await checker.check();

      expect(report.checks.memory.status).toBe('healthy');
      expect(report.checks.memory.details).toBeDefined();
      expect(report.checks.memory.details?.heapUsedMB).toBeDefined();
    });
  });

  describe('sync check', () => {
    it('should be healthy when sync is not configured', async () => {
      vi.mocked(getConfig).mockReturnValue(mockConfig(''));

      const report = await checker.check();

      expect(report.checks.sync.status).toBe('healthy');
      expect(report.checks.sync.message).toContain('not configured');
    });

    it('should be healthy when sync is connected', async () => {
      vi.mocked(getConfig).mockReturnValue(mockConfig('https://sync.example.com'));
      vi.mocked(getPowerSyncStatus).mockReturnValue({
        state: 'connected',
        connected: true,
        hasPendingChanges: false,
        pendingUploadCount: 0,
        lastSyncedAt: new Date(),
        error: null,
        isAuthenticated: true,
      } as ReturnType<typeof getPowerSyncStatus>);

      const report = await checker.check();

      expect(report.checks.sync.status).toBe('healthy');
      expect(report.checks.sync.message).toContain('connected');
    });

    it('should be degraded when sync has an error', async () => {
      vi.mocked(getConfig).mockReturnValue(mockConfig('https://sync.example.com'));
      vi.mocked(getPowerSyncStatus).mockReturnValue({
        state: 'error',
        connected: false,
        hasPendingChanges: false,
        pendingUploadCount: 0,
        lastSyncedAt: null,
        error: 'Connection refused',
        isAuthenticated: false,
      } as ReturnType<typeof getPowerSyncStatus>);

      const report = await checker.check();

      expect(report.checks.sync.status).toBe('degraded');
    });

    it('should be degraded when sync service is not initialized', async () => {
      vi.mocked(getConfig).mockReturnValue(mockConfig('https://sync.example.com'));
      vi.mocked(getPowerSyncStatus).mockReturnValue(null);

      const report = await checker.check();

      expect(report.checks.sync.status).toBe('degraded');
      expect(report.checks.sync.message).toContain('not initialized');
    });
  });
});
