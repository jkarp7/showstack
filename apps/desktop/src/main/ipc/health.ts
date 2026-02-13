/**
 * Health Check IPC Handler
 *
 * Exposes system health check functionality to the renderer process.
 * Includes IPC-level caching to prevent excessive health checks.
 */

import { ipcMain } from 'electron';
import { healthChecker, HealthReportSchema } from '../services/HealthChecker';
import { logger } from '../utils/logger';
import { z } from 'zod';

type HealthReport = z.infer<typeof HealthReportSchema>;

const HEALTH_CHECK_CACHE_TTL_MS = 5000; // 5 seconds

let cachedReport: HealthReport | null = null;
let cachedAt = 0;

/**
 * Exported for testing — reset the health check cache.
 */
export function resetHealthCache(): void {
  cachedReport = null;
  cachedAt = 0;
}

/**
 * Register health check IPC handlers
 */
export function registerHealthHandlers(): void {
  /**
   * Run a full health check and return the report.
   * Returns a cached report if one exists within the TTL window.
   */
  ipcMain.handle('health:check', async () => {
    const now = Date.now();
    if (cachedReport && now - cachedAt < HEALTH_CHECK_CACHE_TTL_MS) {
      logger.debug('Returning cached health report', {
        ageMs: now - cachedAt,
      });
      return cachedReport;
    }

    try {
      const report = HealthReportSchema.parse(await healthChecker.check());
      cachedReport = report;
      cachedAt = Date.now();
      return report;
    } catch (error) {
      logger.error('Health check failed', error instanceof Error ? error : undefined);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const fallbackMessage = `Health check error: ${errorMessage}`;
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'unhealthy', message: fallbackMessage },
          filesystem: { status: 'unhealthy', message: fallbackMessage },
          memory: { status: 'unhealthy', message: fallbackMessage },
          sync: { status: 'unhealthy', message: fallbackMessage },
        },
      };
    }
  });
}
