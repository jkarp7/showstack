/**
 * HealthChecker Service
 *
 * Performs health checks across application subsystems:
 * - Database connectivity (app and project databases)
 * - Filesystem access and disk space (project data directory)
 * - Memory usage (heap and RSS thresholds)
 * - Cloud sync status (PowerSync connection)
 *
 * Note: Configuration changes (e.g., sync URL) require an app restart
 * to take effect in health checks, since modules are cached on first load.
 */

import * as fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { app } from 'electron';
import { logger } from '../utils/logger';

const execFileAsync = promisify(execFile);

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface CheckResult {
  status: HealthStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  checks: {
    database: CheckResult;
    filesystem: CheckResult;
    memory: CheckResult;
    sync: CheckResult;
  };
}

// Electron apps with large datasets routinely use 500MB+.
// These thresholds are tuned to avoid false positives.
const MEMORY_WARN_MB = 1024;
const MEMORY_CRITICAL_MB = 2048;

const DISK_WARN_MB = 1024; // Warn below 1GB free

// Cached dynamic imports to avoid repeated import overhead.
// These are never invalidated at runtime; configuration changes
// require an app restart. Use clearImportCache() in tests.
let _databaseManager: typeof import('../database/core/DatabaseManager') | null = null;
let _envModule: typeof import('../config/env') | null = null;
let _syncModule: typeof import('../ipc/sync') | null = null;

/**
 * Clear cached dynamic imports.
 * @internal Exposed for testing and potential future config-reload scenarios.
 */
export function clearImportCache(): void {
  _databaseManager = null;
  _envModule = null;
  _syncModule = null;
}

class HealthCheckerService {
  /**
   * Run all health checks and return a comprehensive report
   */
  async check(): Promise<HealthReport> {
    const [database, filesystem, memory, sync] = await Promise.all([
      this.checkDatabase(),
      this.checkFilesystem(),
      this.checkMemory(),
      this.checkSync(),
    ]);

    const checks = { database, filesystem, memory, sync };
    const statuses = Object.values(checks).map((c) => c.status);

    let status: HealthStatus = 'healthy';
    if (statuses.includes('unhealthy')) {
      status = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      status = 'degraded';
    }

    const report: HealthReport = {
      status,
      timestamp: new Date().toISOString(),
      checks,
    };

    logger.debug('Health check completed', { status });
    return report;
  }

  /**
   * Check database connectivity by running a simple query
   */
  private async checkDatabase(): Promise<CheckResult> {
    try {
      if (!_databaseManager) {
        _databaseManager = await import('../database/core/DatabaseManager');
      }
      const { databaseManager } = _databaseManager;

      const appDb = databaseManager.getAppDatabase();
      const appResult = appDb.prepare('SELECT 1 AS ok').get() as { ok: number } | undefined;

      let projectOk = false;
      try {
        const projectDb = databaseManager.getProjectDatabase();
        const projectResult = projectDb.prepare('SELECT 1 AS ok').get() as
          | { ok: number }
          | undefined;
        projectOk = projectResult?.ok === 1;
      } catch {
        // Project database may not be loaded yet
      }

      if (appResult?.ok === 1 && projectOk) {
        return { status: 'healthy', message: 'Both databases responding' };
      } else if (appResult?.ok === 1) {
        return {
          status: 'degraded',
          message: 'App database OK, project database not available',
        };
      }

      return { status: 'unhealthy', message: 'Database not responding' };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check filesystem access and available disk space for the user data directory
   */
  private async checkFilesystem(): Promise<CheckResult> {
    try {
      const userDataPath = app.getPath('userData');
      // Verify read+write permissions
      await fs.access(userDataPath, fs.constants.R_OK | fs.constants.W_OK);

      // Check available disk space
      const freeMB = await this.getFreeDiskSpaceMB(userDataPath);
      const details: Record<string, unknown> = { path: userDataPath };

      if (freeMB !== null) {
        details.freeSpaceMB = freeMB;

        if (freeMB < DISK_WARN_MB) {
          return {
            status: 'degraded',
            message: `Low disk space: ${freeMB}MB free`,
            details,
          };
        }
      }

      return {
        status: 'healthy',
        message: 'Filesystem accessible',
        details,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Filesystem error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get free disk space in MB for the given path.
   * Returns null if unable to determine (non-critical).
   */
  private async getFreeDiskSpaceMB(dirPath: string): Promise<number | null> {
    try {
      if (process.platform === 'win32') {
        // Windows: use wmic or PowerShell
        const { stdout } = await execFileAsync('wmic', [
          'logicaldisk',
          'where',
          `DeviceID='${dirPath.charAt(0)}:'`,
          'get',
          'FreeSpace',
          '/value',
        ]);
        const match = stdout.match(/FreeSpace=(\d+)/);
        if (match) {
          return Math.round(parseInt(match[1], 10) / 1024 / 1024);
        }
      } else {
        // macOS/Linux: use df
        const { stdout } = await execFileAsync('df', ['-k', dirPath]);
        const lines = stdout.trim().split('\n');
        if (lines.length >= 2) {
          const parts = lines[1].split(/\s+/);
          const availableKB = parseInt(parts[3], 10);
          if (!isNaN(availableKB)) {
            return Math.round(availableKB / 1024);
          }
        }
      }
    } catch {
      // Non-critical: disk space check is best-effort
    }
    return null;
  }

  /**
   * Check memory usage against thresholds
   */
  private async checkMemory(): Promise<CheckResult> {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100;
    const rssMB = Math.round((usage.rss / 1024 / 1024) * 100) / 100;
    const heapTotalMB = Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100;

    const details = {
      heapUsedMB,
      heapTotalMB,
      rssMB,
      externalMB: Math.round((usage.external / 1024 / 1024) * 100) / 100,
    };

    if (heapUsedMB > MEMORY_CRITICAL_MB) {
      return {
        status: 'unhealthy',
        message: `Heap usage critical: ${heapUsedMB}MB`,
        details,
      };
    }

    if (heapUsedMB > MEMORY_WARN_MB) {
      return {
        status: 'degraded',
        message: `Heap usage elevated: ${heapUsedMB}MB`,
        details,
      };
    }

    return {
      status: 'healthy',
      message: `Memory OK: ${heapUsedMB}MB heap used`,
      details,
    };
  }

  /**
   * Check cloud sync connection status
   */
  private async checkSync(): Promise<CheckResult> {
    try {
      if (!_envModule) {
        _envModule = await import('../config/env');
      }
      const config = _envModule.getConfig();

      if (!config.powersync.url) {
        return {
          status: 'healthy',
          message: 'Cloud sync not configured (offline mode)',
        };
      }

      if (!_syncModule) {
        _syncModule = await import('../ipc/sync');
      }
      const status = await _syncModule.getPowerSyncStatus();

      if (!status) {
        return {
          status: 'degraded',
          message: 'Sync service not initialized',
        };
      }

      if (status.state === 'connected' || status.state === 'syncing') {
        return {
          status: 'healthy',
          message: `Sync connected`,
          details: {
            state: status.state,
            hasPendingChanges: status.hasPendingChanges,
            pendingUploadCount: status.pendingUploadCount,
          },
        };
      }

      if (status.state === 'error') {
        return {
          status: 'degraded',
          message: `Sync error: ${status.error || 'unknown'}`,
          details: { state: status.state },
        };
      }

      return {
        status: 'healthy',
        message: `Sync state: ${status.state}`,
        details: { state: status.state },
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: `Sync check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

// Export singleton instance
export const healthChecker = new HealthCheckerService();

// Export class for testing
export { HealthCheckerService };
