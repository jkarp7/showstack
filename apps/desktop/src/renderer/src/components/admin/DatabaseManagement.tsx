import { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type OpStatus = { type: 'success' | 'error' | 'info'; message: string } | null;

interface DbInfo {
  appDbSizeBytes: number;
  projectsDbSizeBytes: number;
  lastBackupTime: number | null;
}

interface BackupEntry {
  timestamp: number;
  reason?: string;
  appDbSize: number;
  projectDbSize: number;
  version: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DatabaseManagement() {
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [vacuumStatus, setVacuumStatus] = useState<OpStatus>(null);
  const [integrityStatus, setIntegrityStatus] = useState<OpStatus>(null);
  const [backupStatus, setBackupStatus] = useState<OpStatus>(null);
  const [restoreStatus, setRestoreStatus] = useState<OpStatus>(null);

  const [showBackups, setShowBackups] = useState(false);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [restoringDir, setRestoringDir] = useState<string | null>(null);
  const [confirmRestoreDir, setConfirmRestoreDir] = useState<string | null>(null);

  const [isWorking, setIsWorking] = useState(false);

  const loadDbInfo = async () => {
    setIsLoading(true);
    try {
      const info = await window.api.admin.getDatabaseInfo();
      setDbInfo(info);
    } catch (err) {
      // silently fail — info will show as unavailable
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDbInfo();
  }, []);

  const autoClear = (setter: (s: OpStatus) => void) => {
    setTimeout(() => setter(null), 3000);
  };

  const handleVacuum = async () => {
    setIsWorking(true);
    setVacuumStatus(null);
    try {
      const result = await window.api.admin.vacuumDatabase();
      if (result.success) {
        setVacuumStatus({ type: 'success', message: 'Vacuum completed successfully.' });
        await loadDbInfo();
      } else {
        setVacuumStatus({ type: 'error', message: result.error ?? 'Vacuum failed.' });
      }
    } catch (err) {
      setVacuumStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Vacuum failed.',
      });
    } finally {
      setIsWorking(false);
      autoClear(setVacuumStatus);
    }
  };

  const handleIntegrityCheck = async () => {
    setIsWorking(true);
    setIntegrityStatus(null);
    try {
      const result = await window.api.admin.integrityCheck();
      if (result.success && result.appDb && result.projectDb) {
        const appOk = result.appDb.ok;
        const projectOk = result.projectDb.ok;
        if (appOk && projectOk) {
          setIntegrityStatus({ type: 'success', message: 'app.db: OK, projects.db: OK' });
        } else {
          const parts: string[] = [];
          if (!appOk) parts.push(`app.db: ${result.appDb.details.join(', ')}`);
          if (!projectOk) parts.push(`projects.db: ${result.projectDb.details.join(', ')}`);
          setIntegrityStatus({ type: 'error', message: parts.join(' | ') });
        }
      } else {
        setIntegrityStatus({ type: 'error', message: result.error ?? 'Integrity check failed.' });
      }
    } catch (err) {
      setIntegrityStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Check failed.',
      });
    } finally {
      setIsWorking(false);
      autoClear(setIntegrityStatus);
    }
  };

  const handleBackup = async () => {
    setIsWorking(true);
    setBackupStatus(null);
    try {
      const result = await window.api.backup.create('admin-manual');
      if (result.success) {
        setBackupStatus({ type: 'success', message: `Backup created: ${result.backupDir ?? ''}` });
        await loadDbInfo();
      } else {
        setBackupStatus({ type: 'error', message: result.error ?? 'Backup failed.' });
      }
    } catch (err) {
      setBackupStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Backup failed.',
      });
    } finally {
      setIsWorking(false);
      autoClear(setBackupStatus);
    }
  };

  const handleShowBackups = async () => {
    if (showBackups) {
      setShowBackups(false);
      return;
    }
    setBackupsLoading(true);
    setShowBackups(true);
    try {
      const list = await window.api.backup.list();
      setBackups(list);
    } catch (err) {
      setRestoreStatus({ type: 'error', message: 'Failed to load backups.' });
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleRestore = async (backupDirName: string) => {
    setConfirmRestoreDir(null);
    setRestoringDir(backupDirName);
    setRestoreStatus(null);
    setIsWorking(true);
    try {
      const result = await window.api.backup.restore(backupDirName);
      if (result.success) {
        setRestoreStatus({
          type: 'success',
          message: `Restored from ${result.restoredFrom}. Restart the app to apply.`,
        });
      } else {
        setRestoreStatus({ type: 'error', message: result.error ?? 'Restore failed.' });
      }
    } catch (err) {
      setRestoreStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Restore failed.',
      });
    } finally {
      setRestoringDir(null);
      setIsWorking(false);
    }
  };

  const statusClass = (s: OpStatus) => {
    if (!s) return '';
    if (s.type === 'success') return 'text-green-600 dark:text-green-400';
    if (s.type === 'error') return 'text-red-600 dark:text-red-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Database Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Maintain, backup, and optimize application database
        </p>
      </div>

      {/* Warning Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
              Important Safety Information
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Always create a backup before performing maintenance operations or restoring from a
              backup file. These operations can significantly impact your data and should be
              performed with caution.
            </p>
          </div>
        </div>
      </div>

      {/* Database Info */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Database Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">App DB Size</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? '...' : dbInfo ? formatBytes(dbInfo.appDbSizeBytes) : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Projects DB Size</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? '...' : dbInfo ? formatBytes(dbInfo.projectsDbSizeBytes) : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Backup</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {isLoading
                ? '...'
                : dbInfo?.lastBackupTime
                  ? formatRelative(dbInfo.lastBackupTime)
                  : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Backup & Restore</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Create Backup</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Export a complete backup of the application database including all settings and
                templates
              </p>
              {backupStatus && (
                <p className={`text-xs mt-1 ${statusClass(backupStatus)}`}>
                  {backupStatus.message}
                </p>
              )}
            </div>
            <button
              onClick={handleBackup}
              disabled={isWorking}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Backup</span>
            </button>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Restore from Backup
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Select a previous backup to restore from
                </p>
                {restoreStatus && (
                  <div className="flex items-center gap-3 mt-1">
                    <p className={`text-xs ${statusClass(restoreStatus)}`}>
                      {restoreStatus.message}
                    </p>
                    {restoreStatus.type === 'success' && (
                      <button
                        onClick={() => window.api.backup.relaunch()}
                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Restart Now
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleShowBackups}
                disabled={isWorking}
                className="ml-4 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                <span>Show Backups</span>
                {showBackups ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {showBackups && (
              <div className="mt-4 space-y-2">
                {backupsLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading backups...</p>
                ) : backups.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No backups found.</p>
                ) : (
                  backups.map((b) => {
                    const dirName = `backup-${b.timestamp}`;
                    return (
                      <div
                        key={b.timestamp}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatTimestamp(b.timestamp)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {b.reason ?? 'automatic'} &bull; v{b.version} &bull;{' '}
                            {formatBytes(b.appDbSize + b.projectDbSize)}
                          </div>
                        </div>
                        {confirmRestoreDir === dirName ? (
                          <div className="ml-3 flex items-center gap-2">
                            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                              Restore? App will restart.
                            </span>
                            <button
                              onClick={() => handleRestore(dirName)}
                              disabled={isWorking}
                              className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmRestoreDir(null)}
                              className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRestoreDir(dirName)}
                            disabled={restoringDir === dirName || isWorking}
                            className="ml-3 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
                          >
                            {restoringDir === dirName ? 'Restoring...' : 'Restore'}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Database Maintenance</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Vacuum Database</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Optimize and reclaim unused space. Recommended after large deletions.
              </p>
              {vacuumStatus && (
                <p className={`text-xs mt-1 ${statusClass(vacuumStatus)}`}>
                  {vacuumStatus.message}
                </p>
              )}
            </div>
            <button
              onClick={handleVacuum}
              disabled={isWorking}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Vacuum</span>
            </button>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Data Integrity Check
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Verify database integrity and detect potential corruption
              </p>
              {integrityStatus && (
                <p className={`text-xs mt-1 ${statusClass(integrityStatus)}`}>
                  {integrityStatus.message}
                </p>
              )}
            </div>
            <button
              onClick={handleIntegrityCheck}
              disabled={isWorking}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Check</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
