/**
 * DatabaseMonitor - Database Performance Monitoring and Observability
 *
 * Provides visibility into database performance including:
 * - Query timing and counts
 * - Slow query detection and alerting
 * - Error rate tracking
 * - Resource usage monitoring
 *
 * Usage:
 * ```typescript
 * import { databaseMonitor } from './monitoring/DatabaseMonitor';
 *
 * // Record a query
 * const start = Date.now();
 * const result = db.prepare(sql).all(...params);
 * databaseMonitor.recordQuery('fixtures:getAll', Date.now() - start);
 *
 * // Get metrics
 * const summary = databaseMonitor.getMetricsSummary();
 * const slowQueries = databaseMonitor.getSlowQueries();
 * ```
 */

import { logger } from '../../utils/logger';

/**
 * Metrics for a single query type/operation
 */
export interface QueryMetrics {
  /** Number of times this query was executed */
  count: number;
  /** Total time spent on this query (ms) */
  totalTime: number;
  /** Maximum time for a single execution (ms) */
  maxTime: number;
  /** Minimum time for a single execution (ms) */
  minTime: number;
  /** Number of errors encountered */
  errors: number;
  /** Timestamp of last execution */
  lastExecuted: number;
}

/**
 * Summary of all database metrics
 */
export interface MetricsSummary {
  /** Total number of queries executed */
  totalQueries: number;
  /** Total time spent on all queries (ms) */
  totalTime: number;
  /** Total number of errors */
  totalErrors: number;
  /** Number of unique query types */
  uniqueOperations: number;
  /** When monitoring started */
  monitoringStarted: number;
  /** Per-operation metrics */
  operations: Record<string, QueryMetrics & { avgTime: number }>;
}

/**
 * Slow query information
 */
export interface SlowQuery {
  operation: string;
  avgTime: number;
  maxTime: number;
  count: number;
  lastExecuted: number;
}

/**
 * Configuration options for DatabaseMonitor
 */
export interface DatabaseMonitorConfig {
  /** Threshold in ms for slow query alerts (default: 100) */
  slowQueryThresholdMs: number;
  /** Whether to log slow queries automatically (default: true) */
  logSlowQueries: boolean;
  /** Maximum number of operations to track (prevents memory growth) */
  maxTrackedOperations: number;
}

const DEFAULT_CONFIG: DatabaseMonitorConfig = {
  slowQueryThresholdMs: 100,
  logSlowQueries: true,
  maxTrackedOperations: 1000,
};

/**
 * Database performance monitor singleton.
 * Tracks query performance, detects slow queries, and provides metrics.
 */
export class DatabaseMonitor {
  private metrics = new Map<string, QueryMetrics>();
  private config: DatabaseMonitorConfig;
  private monitoringStarted: number;
  private enabled: boolean = true;

  constructor(config: Partial<DatabaseMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.monitoringStarted = Date.now();
  }

  /**
   * Enable or disable monitoring.
   * Useful for disabling in production for performance.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Database monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Record a query execution.
   *
   * @param operation - Name/identifier for the query (e.g., 'fixtures:getAll')
   * @param durationMs - How long the query took in milliseconds
   * @param error - Optional error if the query failed
   */
  recordQuery(operation: string, durationMs: number, error?: Error): void {
    if (!this.enabled) return;

    const now = Date.now();
    const existing = this.metrics.get(operation);

    if (existing) {
      existing.count++;
      existing.totalTime += durationMs;
      existing.maxTime = Math.max(existing.maxTime, durationMs);
      existing.minTime = Math.min(existing.minTime, durationMs);
      existing.lastExecuted = now;
      if (error) existing.errors++;
    } else {
      // Check if we've hit the max tracked operations
      if (this.metrics.size >= this.config.maxTrackedOperations) {
        // Remove oldest operation by lastExecuted
        let oldestOp: string | null = null;
        let oldestTime = Infinity;
        for (const [op, m] of this.metrics) {
          if (m.lastExecuted < oldestTime) {
            oldestTime = m.lastExecuted;
            oldestOp = op;
          }
        }
        if (oldestOp) {
          this.metrics.delete(oldestOp);
        }
      }

      this.metrics.set(operation, {
        count: 1,
        totalTime: durationMs,
        maxTime: durationMs,
        minTime: durationMs,
        errors: error ? 1 : 0,
        lastExecuted: now,
      });
    }

    // Alert on slow queries
    if (this.config.logSlowQueries && durationMs > this.config.slowQueryThresholdMs) {
      logger.warn('Slow database query detected', {
        operation,
        durationMs,
        threshold: this.config.slowQueryThresholdMs,
      });
    }

    // Log errors
    if (error) {
      logger.error('Database query error', {
        operation,
        durationMs,
        error: error.message,
      });
    }
  }

  /**
   * Get slow queries (queries with average time above threshold).
   *
   * @param thresholdMs - Optional custom threshold (uses config default if not specified)
   * @returns Array of slow queries sorted by average time (slowest first)
   */
  getSlowQueries(thresholdMs?: number): SlowQuery[] {
    const threshold = thresholdMs ?? this.config.slowQueryThresholdMs;

    return Array.from(this.metrics.entries())
      .map(([operation, m]) => ({
        operation,
        avgTime: m.count > 0 ? m.totalTime / m.count : 0,
        maxTime: m.maxTime,
        count: m.count,
        lastExecuted: m.lastExecuted,
      }))
      .filter((q) => q.avgTime > threshold)
      .sort((a, b) => b.avgTime - a.avgTime);
  }

  /**
   * Get operations with errors.
   *
   * @returns Array of operations that have encountered errors
   */
  getErrorOperations(): Array<{
    operation: string;
    errorCount: number;
    totalCount: number;
    errorRate: number;
  }> {
    return Array.from(this.metrics.entries())
      .filter(([, m]) => m.errors > 0)
      .map(([operation, m]) => ({
        operation,
        errorCount: m.errors,
        totalCount: m.count,
        errorRate: m.count > 0 ? m.errors / m.count : 0,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);
  }

  /**
   * Get metrics for a specific operation.
   *
   * @param operation - The operation name to get metrics for
   * @returns QueryMetrics or null if not found
   */
  getOperationMetrics(operation: string): (QueryMetrics & { avgTime: number }) | null {
    const m = this.metrics.get(operation);
    if (!m) return null;

    return {
      ...m,
      avgTime: m.count > 0 ? m.totalTime / m.count : 0,
    };
  }

  /**
   * Get complete metrics summary.
   *
   * @returns Full metrics summary including all operations
   */
  getMetricsSummary(): MetricsSummary {
    let totalQueries = 0;
    let totalTime = 0;
    let totalErrors = 0;
    const operations: Record<string, QueryMetrics & { avgTime: number }> = {};

    for (const [operation, m] of this.metrics) {
      totalQueries += m.count;
      totalTime += m.totalTime;
      totalErrors += m.errors;
      operations[operation] = {
        ...m,
        avgTime: m.count > 0 ? m.totalTime / m.count : 0,
      };
    }

    return {
      totalQueries,
      totalTime,
      totalErrors,
      uniqueOperations: this.metrics.size,
      monitoringStarted: this.monitoringStarted,
      operations,
    };
  }

  /**
   * Get top N slowest operations by average time.
   *
   * @param n - Number of operations to return (default: 10)
   * @returns Array of slowest operations
   */
  getTopSlowOperations(n: number = 10): SlowQuery[] {
    return Array.from(this.metrics.entries())
      .map(([operation, m]) => ({
        operation,
        avgTime: m.count > 0 ? m.totalTime / m.count : 0,
        maxTime: m.maxTime,
        count: m.count,
        lastExecuted: m.lastExecuted,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, n);
  }

  /**
   * Get top N most frequently called operations.
   *
   * @param n - Number of operations to return (default: 10)
   * @returns Array of most called operations
   */
  getTopCalledOperations(
    n: number = 10,
  ): Array<{ operation: string; count: number; avgTime: number }> {
    return Array.from(this.metrics.entries())
      .map(([operation, m]) => ({
        operation,
        count: m.count,
        avgTime: m.count > 0 ? m.totalTime / m.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  /**
   * Reset all metrics.
   * Useful for starting fresh after app initialization or for testing.
   */
  reset(): void {
    this.metrics.clear();
    this.monitoringStarted = Date.now();
    logger.info('Database monitor metrics reset');
  }

  /**
   * Update configuration.
   *
   * @param config - Partial configuration to update
   */
  configure(config: Partial<DatabaseMonitorConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('Database monitor configured', { ...this.config });
  }

  /**
   * Get current configuration.
   */
  getConfig(): DatabaseMonitorConfig {
    return { ...this.config };
  }
}

/**
 * Singleton instance of DatabaseMonitor.
 * Use this for application-wide monitoring.
 */
export const databaseMonitor = new DatabaseMonitor();

/**
 * Helper function to wrap a database operation with monitoring.
 *
 * @param operation - Name for the operation
 * @param fn - The function to execute
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const result = await monitoredQuery('fixtures:getAll', () => {
 *   return db.prepare('SELECT * FROM fixtures').all();
 * });
 * ```
 */
export function monitoredQuery<T>(operation: string, fn: () => T): T {
  const start = Date.now();
  try {
    const result = fn();
    databaseMonitor.recordQuery(operation, Date.now() - start);
    return result;
  } catch (error) {
    databaseMonitor.recordQuery(
      operation,
      Date.now() - start,
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}

/**
 * Async version of monitoredQuery.
 *
 * @param operation - Name for the operation
 * @param fn - The async function to execute
 * @returns The result of the function
 */
export async function monitoredQueryAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    databaseMonitor.recordQuery(operation, Date.now() - start);
    return result;
  } catch (error) {
    databaseMonitor.recordQuery(
      operation,
      Date.now() - start,
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}
