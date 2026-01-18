/**
 * Performance Monitoring Utility
 *
 * Provides helpers for tracking performance metrics throughout the app.
 * All metrics are automatically reported to telemetry.
 */

import { telemetry } from './telemetry';

/**
 * Performance timer for measuring operation duration
 */
class PerformanceTimer {
  private startTime: number;
  private metric: string;
  private context: Record<string, any>;

  constructor(metric: string, context: Record<string, any> = {}) {
    this.metric = metric;
    this.context = context;
    this.startTime = performance.now();
  }

  /**
   * End the timer and report the duration
   */
  end(additionalContext: Record<string, any> = {}): number {
    const duration = performance.now() - this.startTime;

    telemetry.trackPerformance(this.metric, duration, {
      ...this.context,
      ...additionalContext,
      duration_ms: duration,
    });

    return duration;
  }
}

/**
 * Start a performance timer
 *
 * @param metric Name of the metric being measured
 * @param context Additional context
 * @returns PerformanceTimer instance
 *
 * @example
 * const timer = startTimer('pdf_export', { reportType: 'hookup' });
 * // ... do work ...
 * timer.end({ pageCount: 5 });
 */
export function startTimer(
  metric: string,
  context: Record<string, any> = {}
): PerformanceTimer {
  return new PerformanceTimer(metric, context);
}

/**
 * Measure the execution time of an async function
 *
 * @param metric Name of the metric
 * @param fn Async function to measure
 * @param context Additional context
 * @returns Result of the function
 *
 * @example
 * const fixtures = await measureAsync('database_query', async () => {
 *   return await window.api.fixtures.getByProject(projectId);
 * }, { queryType: 'fixtures_by_project' });
 */
export async function measureAsync<T>(
  metric: string,
  fn: () => Promise<T>,
  context: Record<string, any> = {}
): Promise<T> {
  const timer = startTimer(metric, context);

  try {
    const result = await fn();
    timer.end({ success: true });
    return result;
  } catch (error) {
    timer.end({ success: false, error: String(error) });
    throw error;
  }
}

/**
 * Measure the execution time of a synchronous function
 *
 * @param metric Name of the metric
 * @param fn Function to measure
 * @param context Additional context
 * @returns Result of the function
 *
 * @example
 * const data = measureSync('grid_render', () => {
 *   return renderVirtualGrid(fixtures);
 * }, { fixtureCount: fixtures.length });
 */
export function measureSync<T>(
  metric: string,
  fn: () => T,
  context: Record<string, any> = {}
): T {
  const timer = startTimer(metric, context);

  try {
    const result = fn();
    timer.end({ success: true });
    return result;
  } catch (error) {
    timer.end({ success: false, error: String(error) });
    throw error;
  }
}

/**
 * Track grid render performance
 *
 * Call this after virtual grid renders complete.
 *
 * @param duration Render duration in milliseconds
 * @param context Additional context (e.g., row count, column count)
 */
export function trackGridRender(
  duration: number,
  context: Record<string, any> = {}
): void {
  telemetry.trackPerformance('virtual_grid_render', duration, {
    metric_type: 'render_time',
    ...context,
  });
}

/**
 * Track PDF export performance
 *
 * @param duration Export duration in milliseconds
 * @param context Additional context (e.g., page count, report type)
 */
export function trackPDFExport(
  duration: number,
  context: Record<string, any> = {}
): void {
  telemetry.trackPerformance('pdf_export', duration, {
    metric_type: 'export_time',
    ...context,
  });
}

/**
 * Track database query performance
 *
 * @param duration Query duration in milliseconds
 * @param context Additional context (e.g., query type, record count)
 */
export function trackDatabaseQuery(
  duration: number,
  context: Record<string, any> = {}
): void {
  telemetry.trackPerformance('database_query', duration, {
    metric_type: 'query_time',
    ...context,
  });
}

/**
 * Track file operation performance
 *
 * @param operation Operation type (open, save, import, export)
 * @param duration Operation duration in milliseconds
 * @param context Additional context
 */
export function trackFileOperation(
  operation: string,
  duration: number,
  context: Record<string, any> = {}
): void {
  telemetry.trackPerformance(`file_${operation}`, duration, {
    metric_type: 'file_operation',
    operation,
    ...context,
  });
}

/**
 * Monitor React component render performance
 *
 * Use this hook in components to track render performance.
 *
 * @example
 * const RenderMonitor = () => {
 *   useRenderMonitor('EquipmentManager', { fixtureCount: fixtures.length });
 *   return <div>...</div>;
 * };
 */
export function useRenderMonitor(
  componentName: string,
  context: Record<string, any> = {}
): void {
  const startTime = performance.now();

  // Track render time after component mounts/updates
  setTimeout(() => {
    const renderTime = performance.now() - startTime;

    // Only track if render took longer than 16ms (1 frame at 60 FPS)
    if (renderTime > 16) {
      telemetry.trackPerformance('component_render', renderTime, {
        component: componentName,
        metric_type: 'render_time',
        ...context,
      });
    }
  }, 0);
}
