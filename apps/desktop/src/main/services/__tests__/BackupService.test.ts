/**
 * Tests for BackupService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  mockMkdir,
  mockReaddir,
  mockRm,
  mockReadFile,
  mockWriteFile,
  mockStat,
  mockCopyFile,
  mockUnlink,
  mockPipeline,
  mockPragma,
  mockCloseDb,
  mockBetterSqlite3,
  mockBackup,
  mockAppDb,
  mockProjectDb,
} = vi.hoisted(() => {
  const mockBackup = vi.fn().mockResolvedValue(undefined);
  const mockPragma = vi.fn().mockReturnValue([{ quick_check: 'ok' }]);
  const mockCloseDb = vi.fn();
  return {
    mockMkdir: vi.fn().mockResolvedValue(undefined),
    mockReaddir: vi.fn().mockResolvedValue([]),
    mockRm: vi.fn().mockResolvedValue(undefined),
    mockReadFile: vi.fn(),
    mockWriteFile: vi.fn().mockResolvedValue(undefined),
    mockStat: vi.fn(),
    mockCopyFile: vi.fn().mockResolvedValue(undefined),
    mockUnlink: vi.fn().mockResolvedValue(undefined),
    mockPipeline: vi.fn().mockResolvedValue(undefined),
    mockPragma,
    mockCloseDb,
    mockBetterSqlite3: vi.fn().mockReturnValue({
      pragma: mockPragma,
      close: mockCloseDb,
    }),
    mockBackup,
    mockAppDb: { backup: mockBackup },
    mockProjectDb: { backup: mockBackup },
  };
});

// Mock electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-userdata'),
    getVersion: vi.fn(() => '1.0.0'),
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
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
  rm: (...args: unknown[]) => mockRm(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  stat: (...args: unknown[]) => mockStat(...args),
  copyFile: (...args: unknown[]) => mockCopyFile(...args),
  unlink: (...args: unknown[]) => mockUnlink(...args),
}));

// Mock fs (used for createReadStream/createWriteStream in compression)
vi.mock('fs', () => ({
  createReadStream: vi.fn(() => ({ pipe: vi.fn() })),
  createWriteStream: vi.fn(() => ({ on: vi.fn() })),
}));

// Mock zlib (used for createGzip/createGunzip in compression)
vi.mock('zlib', () => ({
  createGzip: vi.fn(() => ({ pipe: vi.fn() })),
  createGunzip: vi.fn(() => ({ pipe: vi.fn() })),
}));

// Mock stream/promises (pipeline used in compression)
vi.mock('stream/promises', () => ({
  pipeline: (...args: unknown[]) => mockPipeline(...args),
}));

// Mock better-sqlite3 for integrity verification
vi.mock('better-sqlite3', () => ({
  default: mockBetterSqlite3,
}));

// Mock database manager
vi.mock('../../database/core/DatabaseManager', () => ({
  databaseManager: {
    forceCheckpoint: vi.fn(() => ({ appBusy: false, projectBusy: false })),
    getPaths: vi.fn(() => ({
      appDbPath: '/tmp/test-userdata/showstack-app.db',
      projectDbPath: '/tmp/test-userdata/showstack-projects.db',
    })),
    getAppDatabase: vi.fn(() => mockAppDb),
    getProjectDatabase: vi.fn(() => mockProjectDb),
    close: vi.fn(),
    initialize: vi.fn().mockResolvedValue(undefined),
  },
}));

import { BackupService } from '../BackupService';
import { databaseManager } from '../../database/core/DatabaseManager';

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    service = new BackupService();

    // Re-setup mocks after clearAllMocks resets them
    mockBackup.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockRm.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockCopyFile.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockPipeline.mockResolvedValue(undefined);
    vi.mocked(databaseManager.initialize).mockResolvedValue(undefined);
    vi.mocked(databaseManager.forceCheckpoint).mockReturnValue({
      appBusy: false,
      projectBusy: false,
    });

    // Mock better-sqlite3 for integrity check
    mockPragma.mockReturnValue([{ quick_check: 'ok' }]);
    mockCloseDb.mockReturnValue(undefined);
    mockBetterSqlite3.mockReturnValue({
      pragma: mockPragma,
      close: mockCloseDb,
    });

    // Mock the private disk space check to avoid real execFile calls
    vi.spyOn(service as never, 'getFreeDiskSpaceMB' as never).mockResolvedValue(50000 as never);

    // Default: stat returns valid sizes for all paths
    mockStat.mockImplementation(() => {
      return Promise.resolve({ size: 1024 });
    });

    // Default: readFile returns valid metadata for restore tests
    mockReadFile.mockImplementation((path: string) => {
      if (typeof path === 'string' && path.includes('metadata.json')) {
        return Promise.resolve(
          JSON.stringify({
            timestamp: 12345,
            appDbSize: 1024,
            projectDbSize: 1024,
            version: '1.0.0',
          }),
        );
      }
      return Promise.reject(new Error('ENOENT'));
    });
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  describe('performBackup', () => {
    it('should create backup directory, backup both DBs, and write metadata', async () => {
      const result = await service.performBackup('manual');

      expect(result.success).toBe(true);
      expect(result.backupDir).toMatch(/^backup-\d+$/);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.reason).toBe('manual');
      expect(result.metadata!.appDbSize).toBe(1024);
      expect(result.metadata!.projectDbSize).toBe(1024);
      expect(result.metadata!.version).toBe('1.0.0');

      // Should have created the backup directory
      expect(mockMkdir).toHaveBeenCalled();

      // Should have called forceCheckpoint before backup
      expect(databaseManager.forceCheckpoint).toHaveBeenCalled();

      // Should have called backup on both databases
      expect(mockBackup).toHaveBeenCalledTimes(2);

      // Should have written metadata.json
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('metadata.json'),
        expect.any(String),
      );
    });

    it('should return early when backup is already in progress', async () => {
      // Use a deferred promise to control backup timing without fake timers
      let resolveBackup: () => void;
      mockBackup.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveBackup = resolve;
          }),
      );

      const first = service.performBackup('first');

      // Allow microtasks to process so first backup reaches the await
      await vi.advanceTimersByTimeAsync(0);

      const second = await service.performBackup('second');

      expect(second.success).toBe(false);
      expect(second.error).toBe('Backup already in progress');

      // Let the first backup complete
      resolveBackup!();
      await first;
    });

    it('should call forceCheckpoint before backup', async () => {
      await service.performBackup();

      // Verify forceCheckpoint was called before backup
      const checkpointOrder = vi.mocked(databaseManager.forceCheckpoint).mock
        .invocationCallOrder[0];
      const backupOrder = mockBackup.mock.invocationCallOrder[0];
      expect(checkpointOrder).toBeLessThan(backupOrder);
    });

    it('should clean up backup directory on failure', async () => {
      mockBackup.mockRejectedValueOnce(new Error('Disk full'));

      const result = await service.performBackup();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Disk full');
      expect(mockRm).toHaveBeenCalledWith(expect.stringContaining('backup-'), {
        recursive: true,
        force: true,
      });
    });
  });

  describe('WAL checkpoint retry', () => {
    it('should retry checkpoint once when database is busy', async () => {
      vi.mocked(databaseManager.forceCheckpoint)
        .mockReturnValueOnce({ appBusy: true, projectBusy: false })
        .mockReturnValueOnce({ appBusy: false, projectBusy: false });

      const backupPromise = service.performBackup('test');
      await vi.advanceTimersByTimeAsync(1000);
      const result = await backupPromise;

      expect(result.success).toBe(true);
      expect(databaseManager.forceCheckpoint).toHaveBeenCalledTimes(2);
    });

    it('should warn but proceed when checkpoint is still busy after retry', async () => {
      const { logger } = await import('../../utils/logger');

      vi.mocked(databaseManager.forceCheckpoint)
        .mockReturnValueOnce({ appBusy: false, projectBusy: true })
        .mockReturnValueOnce({ appBusy: false, projectBusy: true });

      const backupPromise = service.performBackup('test');
      await vi.advanceTimersByTimeAsync(1000);
      const result = await backupPromise;

      expect(result.success).toBe(true);
      expect(databaseManager.forceCheckpoint).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith(
        'WAL checkpoint still busy after retry, proceeding with best-effort backup',
        expect.objectContaining({ projectBusy: true }),
      );
    });

    it('should not retry when checkpoint is not busy', async () => {
      vi.mocked(databaseManager.forceCheckpoint).mockReturnValue({
        appBusy: false,
        projectBusy: false,
      });

      await service.performBackup('test');

      expect(databaseManager.forceCheckpoint).toHaveBeenCalledTimes(1);
    });
  });

  describe('backup integrity verification', () => {
    it('should verify backup integrity with quick_check after backup', async () => {
      await service.performBackup('test');

      // better-sqlite3 constructor should be called twice (once per backup file)
      expect(mockBetterSqlite3).toHaveBeenCalledTimes(2);
      expect(mockBetterSqlite3).toHaveBeenCalledWith(expect.stringContaining('showstack-app.db'), {
        readonly: true,
      });
      expect(mockBetterSqlite3).toHaveBeenCalledWith(
        expect.stringContaining('showstack-projects.db'),
        { readonly: true },
      );

      // quick_check should be called on each backup
      expect(mockPragma).toHaveBeenCalledWith('quick_check');
      expect(mockCloseDb).toHaveBeenCalledTimes(2);
    });

    it('should fail backup when integrity check fails', async () => {
      mockPragma
        .mockReturnValueOnce([{ quick_check: 'ok' }])
        .mockReturnValueOnce([{ quick_check: 'corruption detected on page 42' }]);

      const result = await service.performBackup('test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Integrity check failed');
      // Should clean up the failed backup directory
      expect(mockRm).toHaveBeenCalledWith(expect.stringContaining('backup-'), {
        recursive: true,
        force: true,
      });
    });
  });

  describe('dynamic disk space calculation', () => {
    it('should calculate required space as 2x total DB size', async () => {
      // Source DBs: 300MB each = 600MB total, 2x = 1200MB required
      mockStat.mockImplementation((path: string) => {
        if (path === '/tmp/test-userdata/showstack-app.db') {
          return Promise.resolve({ size: 300 * 1024 * 1024 });
        }
        if (path === '/tmp/test-userdata/showstack-projects.db') {
          return Promise.resolve({ size: 300 * 1024 * 1024 });
        }
        return Promise.resolve({ size: 1024 });
      });

      // Only 1000MB free — less than 1200MB required
      vi.spyOn(service as never, 'getFreeDiskSpaceMB' as never).mockResolvedValue(1000 as never);

      const result = await service.performBackup('test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('1000MB free');
      expect(result.error).toContain('1200MB required');
    });

    it('should use MIN_DISK_SPACE_MB floor when DBs are small', async () => {
      // Source DBs: 1KB each = small, so floor of 500MB should apply
      mockStat.mockImplementation(() => Promise.resolve({ size: 1024 }));

      // Only 400MB free — less than 500MB floor
      vi.spyOn(service as never, 'getFreeDiskSpaceMB' as never).mockResolvedValue(400 as never);

      const result = await service.performBackup('test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('400MB free');
      expect(result.error).toContain('500MB required');
    });
  });

  describe('start/stop', () => {
    it('should set up interval and not double-start', async () => {
      await service.start();
      expect(service.isRunning()).toBe(true);

      // Starting again should be a no-op
      await service.start();
      expect(service.isRunning()).toBe(true);
    });

    it('should clear interval on stop', async () => {
      await service.start();
      expect(service.isRunning()).toBe(true);

      service.stop();
      expect(service.isRunning()).toBe(false);
    });

    it('should clean up incomplete backups on start', async () => {
      // Simulate a directory without metadata.json
      mockReaddir.mockResolvedValueOnce([
        { name: 'backup-100', isDirectory: () => true },
        { name: 'backup-200', isDirectory: () => true },
      ]);

      // First call for backup-100 metadata check: not found
      mockStat
        .mockRejectedValueOnce(new Error('ENOENT'))
        // Second call for backup-200 metadata check: found
        .mockResolvedValueOnce({ size: 100 });

      await service.start();

      // Should have removed the incomplete backup
      expect(mockRm).toHaveBeenCalledWith(expect.stringContaining('backup-100'), {
        recursive: true,
        force: true,
      });
    });
  });

  describe('cleanupOldBackups', () => {
    it('should keep MAX_BACKUPS and delete oldest', async () => {
      // Create 12 backup directories (above the limit of 10)
      const dirs = Array.from({ length: 12 }, (_, i) => ({
        name: `backup-${1000 + i}`,
        isDirectory: () => true,
      }));
      mockReaddir.mockResolvedValueOnce(dirs);

      await service.cleanupOldBackups();

      // Should delete the 2 oldest
      expect(mockRm).toHaveBeenCalledTimes(2);
      expect(mockRm).toHaveBeenCalledWith(expect.stringContaining('backup-1000'), {
        recursive: true,
        force: true,
      });
      expect(mockRm).toHaveBeenCalledWith(expect.stringContaining('backup-1001'), {
        recursive: true,
        force: true,
      });
    });

    it('should be a no-op when under limit', async () => {
      const dirs = Array.from({ length: 5 }, (_, i) => ({
        name: `backup-${1000 + i}`,
        isDirectory: () => true,
      }));
      mockReaddir.mockResolvedValueOnce(dirs);

      await service.cleanupOldBackups();

      expect(mockRm).not.toHaveBeenCalled();
    });
  });

  describe('listBackups', () => {
    it('should return sorted BackupMetadata array (newest first)', async () => {
      mockReaddir.mockResolvedValueOnce([
        { name: 'backup-100', isDirectory: () => true },
        { name: 'backup-300', isDirectory: () => true },
        { name: 'backup-200', isDirectory: () => true },
      ]);

      const meta100 = { timestamp: 100, appDbSize: 100, projectDbSize: 200, version: '1.0.0' };
      const meta200 = { timestamp: 200, appDbSize: 100, projectDbSize: 200, version: '1.0.0' };
      const meta300 = { timestamp: 300, appDbSize: 100, projectDbSize: 200, version: '1.0.0' };

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(meta100))
        .mockResolvedValueOnce(JSON.stringify(meta300))
        .mockResolvedValueOnce(JSON.stringify(meta200));

      const backups = await service.listBackups();

      expect(backups).toHaveLength(3);
      expect(backups[0].timestamp).toBe(300);
      expect(backups[1].timestamp).toBe(200);
      expect(backups[2].timestamp).toBe(100);
    });

    it('should skip backups without valid metadata', async () => {
      mockReaddir.mockResolvedValueOnce([
        { name: 'backup-100', isDirectory: () => true },
        { name: 'backup-200', isDirectory: () => true },
      ]);

      mockReadFile
        .mockResolvedValueOnce(
          JSON.stringify({ timestamp: 100, appDbSize: 100, projectDbSize: 200, version: '1.0.0' }),
        )
        .mockRejectedValueOnce(new Error('ENOENT'));

      const backups = await service.listBackups();

      expect(backups).toHaveLength(1);
      expect(backups[0].timestamp).toBe(100);
    });

    it('should reject metadata with missing required fields (Zod validation)', async () => {
      mockReaddir.mockResolvedValueOnce([{ name: 'backup-100', isDirectory: () => true }]);

      // Missing required fields (no timestamp, version, projectDbSize)
      mockReadFile.mockResolvedValueOnce(JSON.stringify({ appDbSize: 100 }));

      const backups = await service.listBackups();

      expect(backups).toHaveLength(0);
    });

    it('should reject metadata with wrong types (Zod validation)', async () => {
      mockReaddir.mockResolvedValueOnce([{ name: 'backup-100', isDirectory: () => true }]);

      // timestamp should be number, not string
      mockReadFile.mockResolvedValueOnce(
        JSON.stringify({
          timestamp: 'not-a-number',
          appDbSize: 100,
          projectDbSize: 200,
          version: '1.0.0',
        }),
      );

      const backups = await service.listBackups();

      expect(backups).toHaveLength(0);
    });
  });

  describe('restoreFromBackup', () => {
    it('should validate backup, save rollback files, close DBs, copy files, and reinitialize', async () => {
      const result = await service.restoreFromBackup('backup-12345');

      expect(result.success).toBe(true);
      expect(result.restoredFrom).toBe('backup-12345');

      // Should save rollback copies before closing DBs
      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('.restore-rollback'), {
        recursive: true,
      });
      // 2 rollback copies only (restore uses pipeline for compressed files)
      expect(mockCopyFile).toHaveBeenCalledTimes(2);
      // 2 decompress pipeline calls (one per database)
      expect(mockPipeline).toHaveBeenCalledTimes(2);
      expect(databaseManager.close).toHaveBeenCalled();
      expect(databaseManager.initialize).toHaveBeenCalled();
      // Rollback dir should be cleaned up on success
      expect(mockRm).toHaveBeenCalledWith(expect.stringContaining('.restore-rollback'), {
        recursive: true,
        force: true,
      });
    });

    it('should rollback on initialize failure', async () => {
      vi.mocked(databaseManager.initialize)
        .mockRejectedValueOnce(new Error('DB corrupt'))
        .mockResolvedValueOnce(undefined); // Second call succeeds (rollback)

      const result = await service.restoreFromBackup('backup-12345');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB corrupt');
      // Should have called initialize twice (failed restore + rollback)
      expect(databaseManager.initialize).toHaveBeenCalledTimes(2);
    });

    it('should fail on invalid backup directory name', async () => {
      const result1 = await service.restoreFromBackup('../../etc/passwd');
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Invalid backup directory name');

      const result2 = await service.restoreFromBackup('notabackup');
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Invalid backup directory name');

      const result3 = await service.restoreFromBackup('backup-123/../../etc');
      expect(result3.success).toBe(false);
      expect(result3.error).toBe('Invalid backup directory name');
    });

    it('should fail on missing backup', async () => {
      mockStat.mockRejectedValue(new Error('ENOENT'));

      const result = await service.restoreFromBackup('backup-99999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup is invalid or incomplete');
    });
  });

  describe('version compatibility check', () => {
    it('should block restore when major version differs', async () => {
      // Backup is from v2.x, current app is v1.x
      mockReadFile.mockImplementation((path: string) => {
        if (typeof path === 'string' && path.includes('metadata.json')) {
          return Promise.resolve(
            JSON.stringify({
              timestamp: 12345,
              appDbSize: 1024,
              projectDbSize: 1024,
              version: '2.3.0',
            }),
          );
        }
        return Promise.reject(new Error('ENOENT'));
      });

      const result = await service.restoreFromBackup('backup-12345');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Version mismatch');
      expect(result.error).toContain('major 2');
      expect(result.error).toContain('major 1');
      // Should NOT have closed databases or attempted restore
      expect(databaseManager.close).not.toHaveBeenCalled();
    });

    it('should allow restore when major version matches', async () => {
      // Same major version (1.x), different minor
      mockReadFile.mockImplementation((path: string) => {
        if (typeof path === 'string' && path.includes('metadata.json')) {
          return Promise.resolve(
            JSON.stringify({
              timestamp: 12345,
              appDbSize: 1024,
              projectDbSize: 1024,
              version: '1.5.0',
            }),
          );
        }
        return Promise.reject(new Error('ENOENT'));
      });

      const result = await service.restoreFromBackup('backup-12345');

      expect(result.success).toBe(true);
    });
  });

  describe('validateBackup', () => {
    it('should reject dirs without both DB files', async () => {
      // stat call order: metadata.json, app.db.gz, app.db, project.db.gz, project.db
      // Simulate: app.db.gz missing, app.db exists, project.db.gz missing, project.db missing
      mockStat
        .mockResolvedValueOnce({ size: 1024 }) // metadata.json
        .mockRejectedValueOnce(new Error('ENOENT')) // app.db.gz → null
        .mockResolvedValueOnce({ size: 1024 }) // app.db → found
        .mockRejectedValueOnce(new Error('ENOENT')) // project.db.gz → null
        .mockRejectedValueOnce(new Error('ENOENT')); // project.db → null

      const valid = await service.validateBackup('backup-123');

      expect(valid).toBe(false);
    });

    it('should reject dirs with empty DB files', async () => {
      // stat call order: metadata.json, app.db.gz (empty), project.db.gz (valid)
      mockStat
        .mockResolvedValueOnce({ size: 1024 }) // metadata.json
        .mockResolvedValueOnce({ size: 0 }) // app.db.gz → size 0 (empty)
        .mockResolvedValueOnce({ size: 1024 }); // project.db.gz → ok

      const valid = await service.validateBackup('backup-123');

      expect(valid).toBe(false);
    });

    it('should accept dirs with all valid files', async () => {
      mockStat.mockResolvedValue({ size: 1024 });

      const valid = await service.validateBackup('backup-123');

      expect(valid).toBe(true);
    });
  });

  describe('deleteBackup', () => {
    it('should delete a valid backup directory', async () => {
      const result = await service.deleteBackup('backup-12345');

      expect(result.success).toBe(true);
      expect(mockRm).toHaveBeenCalledWith(expect.stringContaining('backup-12345'), {
        recursive: true,
        force: true,
      });
    });

    it('should reject invalid backup directory names', async () => {
      const result = await service.deleteBackup('../escape');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid backup directory name');
    });
  });

  describe('disk space check', () => {
    it('should skip backup when disk space check returns sufficient space', async () => {
      // Default mock returns ~48GB free — backup should proceed
      const result = await service.performBackup('test');

      expect(result.success).toBe(true);
    });
  });

  describe('backup-crash-restore integration', () => {
    it('should complete full backup → validate → restore cycle', async () => {
      // Step 1: Create a backup
      const backupResult = await service.performBackup('integration-test');
      expect(backupResult.success).toBe(true);
      const backupDirName = backupResult.backupDir!;

      // Step 2: Validate the backup
      const isValid = await service.validateBackup(backupDirName);
      expect(isValid).toBe(true);

      // Step 3: Restore from the backup
      const restoreResult = await service.restoreFromBackup(backupDirName);
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restoredFrom).toBe(backupDirName);

      // Verify the full sequence: checkpoint → backup → close → copy → initialize
      expect(databaseManager.forceCheckpoint).toHaveBeenCalled();
      expect(databaseManager.close).toHaveBeenCalled();
      expect(databaseManager.initialize).toHaveBeenCalled();
    });
  });
});
