/**
 * Tests for CrashRecoveryService
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
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockUnlink = vi.fn().mockResolvedValue(undefined);
const mockAccess = vi.fn();

vi.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  unlink: (...args: unknown[]) => mockUnlink(...args),
  access: (...args: unknown[]) => mockAccess(...args),
}));

// Mock database manager
const mockAppPragma = vi.fn();
const mockProjectPragma = vi.fn();

vi.mock('../../database/core/DatabaseManager', () => ({
  databaseManager: {
    getAppDatabase: vi.fn(() => ({ pragma: mockAppPragma })),
    getProjectDatabase: vi.fn(() => ({ pragma: mockProjectPragma })),
  },
}));

// Mock BackupService
const mockGetBackupDirs = vi.fn().mockResolvedValue([]);
const mockValidateBackup = vi.fn().mockResolvedValue(false);
const mockRestoreFromBackup = vi.fn().mockResolvedValue({ success: false });

vi.mock('../BackupService', () => ({
  backupService: {
    getBackupDirs: (...args: unknown[]) => mockGetBackupDirs(...args),
    validateBackup: (...args: unknown[]) => mockValidateBackup(...args),
    restoreFromBackup: (...args: unknown[]) => mockRestoreFromBackup(...args),
  },
}));

import { CrashRecoveryService } from '../CrashRecoveryService';

describe('CrashRecoveryService', () => {
  let service: CrashRecoveryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrashRecoveryService();

    // Default: integrity checks pass
    mockAppPragma.mockReturnValue([{ integrity_check: 'ok' }]);
    mockProjectPragma.mockReturnValue([{ integrity_check: 'ok' }]);
  });

  describe('checkAndRecover', () => {
    it('should return no crash when marker file does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await service.checkAndRecover();

      expect(result).toEqual({
        crashDetected: false,
        integrityOk: true,
        restored: false,
      });
    });

    it('should detect crash but not restore when integrity is OK', async () => {
      mockAccess.mockResolvedValue(undefined);

      const result = await service.checkAndRecover();

      expect(result).toEqual({
        crashDetected: true,
        integrityOk: true,
        restored: false,
      });
    });

    it('should restore from latest backup when integrity fails', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockAppPragma.mockReturnValue([{ integrity_check: 'corruption found' }]);

      mockGetBackupDirs.mockResolvedValue(['backup-100', 'backup-200', 'backup-300']);
      mockValidateBackup.mockResolvedValue(true);
      mockRestoreFromBackup.mockResolvedValue({ success: true, restoredFrom: 'backup-300' });

      const result = await service.checkAndRecover();

      expect(result).toEqual({
        crashDetected: true,
        integrityOk: false,
        restored: true,
        restoredFrom: 'backup-300',
      });

      // Should try newest first
      expect(mockValidateBackup).toHaveBeenCalledWith('backup-300');
      expect(mockRestoreFromBackup).toHaveBeenCalledWith('backup-300');
    });

    it('should return error when integrity fails and no backups available', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockProjectPragma.mockReturnValue([{ integrity_check: 'corruption found' }]);

      mockGetBackupDirs.mockResolvedValue([]);

      const result = await service.checkAndRecover();

      expect(result).toEqual({
        crashDetected: true,
        integrityOk: false,
        restored: false,
        error: 'No valid backups available',
      });
    });

    it('should try older backups if newest is invalid', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockAppPragma.mockReturnValue([{ integrity_check: 'corruption' }]);

      mockGetBackupDirs.mockResolvedValue(['backup-100', 'backup-200']);
      mockValidateBackup
        .mockResolvedValueOnce(false) // backup-200 invalid
        .mockResolvedValueOnce(true); // backup-100 valid
      mockRestoreFromBackup.mockResolvedValue({ success: true, restoredFrom: 'backup-100' });

      const result = await service.checkAndRecover();

      expect(result.restored).toBe(true);
      expect(result.restoredFrom).toBe('backup-100');
    });
  });

  describe('markRunning', () => {
    it('should create marker file', async () => {
      await service.markRunning();

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('.showstack-running'),
        expect.any(String),
      );
    });
  });

  describe('markCleanShutdown', () => {
    it('should delete marker file', async () => {
      await service.markCleanShutdown();

      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('.showstack-running'));
    });

    it('should be a no-op if marker does not exist', async () => {
      const enoent = new Error('ENOENT') as NodeJS.ErrnoException;
      enoent.code = 'ENOENT';
      mockUnlink.mockRejectedValue(enoent);

      // Should not throw
      await service.markCleanShutdown();
    });
  });

  describe('validateDatabaseIntegrity', () => {
    it('should return true when both DBs pass integrity_check', async () => {
      const result = await service.validateDatabaseIntegrity();

      expect(result).toBe(true);
      expect(mockAppPragma).toHaveBeenCalledWith('integrity_check');
      expect(mockProjectPragma).toHaveBeenCalledWith('integrity_check');
    });

    it('should return false when app DB fails', async () => {
      mockAppPragma.mockReturnValue([{ integrity_check: 'page 5 corruption' }]);

      const result = await service.validateDatabaseIntegrity();

      expect(result).toBe(false);
    });

    it('should return false when project DB fails', async () => {
      mockProjectPragma.mockReturnValue([{ integrity_check: 'page 10 corruption' }]);

      const result = await service.validateDatabaseIntegrity();

      expect(result).toBe(false);
    });

    it('should return false when pragma throws', async () => {
      mockAppPragma.mockImplementation(() => {
        throw new Error('database is locked');
      });

      const result = await service.validateDatabaseIntegrity();

      expect(result).toBe(false);
    });
  });
});
