/**
 * Health Check IPC Handler
 *
 * Exposes system health check functionality to the renderer process.
 */

import { ipcMain } from 'electron';
import { healthChecker } from '../services/HealthChecker';
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
      return await healthChecker.check();
    } catch (error) {
      logger.error('Health check failed', error instanceof Error ? error : undefined);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'unhealthy', message: 'Health check error' },
          filesystem: { status: 'unhealthy', message: 'Health check error' },
          memory: { status: 'unhealthy', message: 'Health check error' },
          sync: { status: 'unhealthy', message: 'Health check error' },
        },
      };
    }
  });
}
