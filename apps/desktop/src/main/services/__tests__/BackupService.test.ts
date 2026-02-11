/**
 * Tests for BackupService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
const mockMkdir = vi.fn().mockResolvedValue(undefined);
const mockReaddir = vi.fn().mockResolvedValue([]);
const mockRm = vi.fn().mockResolvedValue(undefined);
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockStat = vi.fn();
const mockCopyFile = vi.fn().mockResolvedValue(undefined);

vi.mock('fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
  rm: (...args: unknown[]) => mockRm(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  stat: (...args: unknown[]) => mockStat(...args),
  copyFile: (...args: unknown[]) => mockCopyFile(...args),
}));

// Mock database manager
const mockBackup = vi.fn().mockResolvedValue(undefined);
const mockAppDb = { backup: mockBackup };
const mockProjectDb = { backup: mockBackup };

vi.mock('../../database/core/DatabaseManager', () => ({
  databaseManager: {
    forceCheckpoint: vi.fn(),
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

    // Default: stat returns valid sizes
    mockStat.mockResolvedValue({ size: 1024 });
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
      // Start a backup that takes a while
      mockBackup.mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      const first = service.performBackup('first');
      const second = await service.performBackup('second');

      expect(second.success).toBe(false);
      expect(second.error).toBe('Backup already in progress');

      // Let the first backup complete
      vi.advanceTimersByTime(1000);
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

      const meta100: any = { timestamp: 100, appDbSize: 100, projectDbSize: 200, version: '1.0.0' };
      const meta200: any = { timestamp: 200, appDbSize: 100, projectDbSize: 200, version: '1.0.0' };
      const meta300: any = { timestamp: 300, appDbSize: 100, projectDbSize: 200, version: '1.0.0' };

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
  });

  describe('restoreFromBackup', () => {
    it('should validate backup, close DBs, copy files, and reinitialize', async () => {
      // Mock validation: all files exist with valid sizes
      mockStat.mockResolvedValue({ size: 1024 });

      const result = await service.restoreFromBackup('backup-12345');

      expect(result.success).toBe(true);
      expect(result.restoredFrom).toBe('backup-12345');
      expect(databaseManager.close).toHaveBeenCalled();
      expect(mockCopyFile).toHaveBeenCalledTimes(2);
      expect(databaseManager.initialize).toHaveBeenCalled();
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

  describe('validateBackup', () => {
    it('should reject dirs without both DB files', async () => {
      // First file exists, second doesn't
      mockStat.mockResolvedValueOnce({ size: 1024 }).mockRejectedValueOnce(new Error('ENOENT'));

      const valid = await service.validateBackup('backup-123');

      expect(valid).toBe(false);
    });

    it('should reject dirs with empty DB files', async () => {
      mockStat
        .mockResolvedValueOnce({ size: 0 })
        .mockResolvedValueOnce({ size: 1024 })
        .mockResolvedValueOnce({ size: 100 });

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
});
