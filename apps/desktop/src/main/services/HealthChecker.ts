/**
 * HealthChecker Service
 *
 * Performs health checks across application subsystems:
 * - Database connectivity (app and project databases)
 * - Filesystem access (project data directory)
 * - Memory usage (heap and RSS thresholds)
 * - Cloud sync status (PowerSync connection)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import { logger } from '../utils/logger';

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

const MEMORY_WARN_MB = 512;
const MEMORY_CRITICAL_MB = 1024;

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
      // Dynamic import to avoid circular dependencies
      const { databaseManager } = await import('../database/core/DatabaseManager');

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
   * Check filesystem access for the user data directory
   */
  private async checkFilesystem(): Promise<CheckResult> {
    try {
      const userDataPath = app.getPath('userData');
      await fs.access(userDataPath, fs.constants.R_OK | fs.constants.W_OK);

      // Check available space by writing and removing a temp file
      const testFile = path.join(userDataPath, '.health-check-test');
      await fs.writeFile(testFile, 'ok');
      await fs.unlink(testFile);

      return {
        status: 'healthy',
        message: 'Filesystem accessible',
        details: { path: userDataPath },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Filesystem error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
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
      const { getConfig } = await import('../config/env');
      const config = getConfig();

      if (!config.POWERSYNC_URL) {
        return {
          status: 'healthy',
          message: 'Cloud sync not configured (offline mode)',
        };
      }

      // Try to get sync status from the PowerSync service
      const { getPowerSyncStatus } = await import('../ipc/sync');
      const status = await getPowerSyncStatus();

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
