/**
 * PerformanceMonitor
 * Tracks application performance metrics and sends to PostHog
 */

import { logger } from '../utils/logger';

interface MemoryUsage {
  heap_used_mb: number;
  heap_total_mb: number;
  rss_mb: number;
  external_mb: number;
}

export class PerformanceMonitor {
  private readonly SLOW_QUERY_THRESHOLD_MS = 1000;
  private readonly SLOW_IPC_THRESHOLD_MS = 100;
  private readonly SLOW_RENDER_THRESHOLD_MS = 16; // 60 FPS

  /**
   * Track database query performance
   */
  trackDatabaseQuery(operation: string, duration: number, rowCount?: number): void {
    const isSlow = duration > this.SLOW_QUERY_THRESHOLD_MS;

    // Log to console
    if (isSlow) {
      logger.warn(`⚠️ Slow query: ${operation} took ${duration}ms`);
    } else {
      logger.debug(`Query: ${operation} (${duration}ms, ${rowCount || 0} rows)`);
    }

    // TODO: Send to PostHog when implemented
    // posthog.capture('database_query', {
    //   operation,
    //   duration_ms: duration,
    //   row_count: rowCount,
    //   slow_query: isSlow
    // });
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    const usage = process.memoryUsage();
    const metrics: MemoryUsage = {
      heap_used_mb: Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100,
      heap_total_mb: Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100,
      rss_mb: Math.round((usage.rss / 1024 / 1024) * 100) / 100,
      external_mb: Math.round((usage.external / 1024 / 1024) * 100) / 100,
    };

    // Warn if memory usage is high (>1GB heap)
    if (usage.heapUsed > 1024 * 1024 * 1024) {
      logger.warn(`High memory usage: ${metrics.heap_used_mb}MB`);
    } else {
      logger.debug(`Memory usage: ${metrics.heap_used_mb}MB heap`);
    }

    // TODO: Send to PostHog when implemented
    // posthog.capture('memory_usage', metrics);
  }

  /**
   * Track IPC handler latency
   */
  trackIPCHandler(channel: string, duration: number): void {
    const isSlow = duration > this.SLOW_IPC_THRESHOLD_MS;

    if (isSlow) {
      logger.warn(`⚠️ Slow IPC handler: ${channel} took ${duration}ms`);
    } else {
      logger.debug(`IPC: ${channel} (${duration}ms)`);
    }

    // TODO: Send to PostHog when implemented
    // posthog.capture('ipc_handler', {
    //   channel,
    //   duration_ms: duration,
    //   slow: isSlow
    // });
  }

  /**
   * Track UI component render performance
   */
  trackComponentRender(componentName: string, duration: number): void {
    const isSlow = duration > this.SLOW_RENDER_THRESHOLD_MS;

    if (isSlow) {
      logger.warn(
        `⚠️ Slow render: ${componentName} took ${duration}ms (target: <${this.SLOW_RENDER_THRESHOLD_MS}ms)`,
      );
    }

    // TODO: Send to PostHog when implemented
    // posthog.capture('component_render', {
    //   component: componentName,
    //   duration_ms: duration,
    //   slow: isSlow
    // });
  }

  /**
   * Start tracking an operation
   * Returns a function to call when the operation completes
   */
  startTracking(operationType: 'query' | 'ipc' | 'render', name: string): () => void {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;

      switch (operationType) {
        case 'query':
          this.trackDatabaseQuery(name, duration);
          break;
        case 'ipc':
          this.trackIPCHandler(name, duration);
          break;
        case 'render':
          this.trackComponentRender(name, duration);
          break;
      }
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
