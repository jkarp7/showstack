/**
 * Health Check IPC Handler
 *
 * Exposes system health check functionality to the renderer process.
 */

import { ipcMain } from 'electron';
import { healthChecker, HealthReportSchema } from '../services/HealthChecker';
import { logger } from '../utils/logger';

/**
 * Register health check IPC handlers
 */
export function registerHealthHandlers(): void {
  /**
   * Run a full health check and return the report
   */
  ipcMain.handle('health:check', async () => {
    try {
      const report = await healthChecker.check();
      return HealthReportSchema.parse(report);
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
