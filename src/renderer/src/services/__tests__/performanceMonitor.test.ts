import { describe, it, expect, vi, beforeEach } from 'vitest';
import { telemetry } from '../telemetry';
import {
  startTimer,
  measureAsync,
  measureSync,
  trackGridRender,
  trackPDFExport,
  trackDatabaseQuery,
  trackFileOperation,
} from '../performanceMonitor';

/**
 * Performance Monitor Tests
 *
 * Target: 70%+ coverage
 * Tests timer utilities, async/sync measurement, and tracking helpers
 */

// Mock telemetry
vi.mock('../telemetry', () => ({
  telemetry: {
    trackPerformance: vi.fn(),
  },
}));

describe('Performance Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startTimer', () => {
    it('should create a timer and track duration on end', () => {
      const timer = startTimer('test_metric', { foo: 'bar' });

      // Wait a bit
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait
      }

      const duration = timer.end({ additional: 'context' });

      expect(duration).toBeGreaterThan(0);
      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'test_metric',
        duration,
        expect.objectContaining({
          foo: 'bar',
          additional: 'context',
          duration_ms: duration,
        })
      );
    });

    it('should track timer without additional context', () => {
      const timer = startTimer('simple_metric');
      const duration = timer.end();

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'simple_metric',
        duration,
        expect.objectContaining({
          duration_ms: duration,
        })
      );
    });
  });

  describe('measureAsync', () => {
    it('should measure async function execution time', async () => {
      const asyncFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      });

      const result = await measureAsync('async_test', asyncFn, { type: 'test' });

      expect(result).toBe('result');
      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'async_test',
        expect.any(Number),
        expect.objectContaining({
          type: 'test',
          success: true,
        })
      );
    });

    it('should track errors in async functions', async () => {
      const asyncFn = vi.fn(async () => {
        throw new Error('Test error');
      });

      await expect(measureAsync('async_error', asyncFn)).rejects.toThrow('Test error');

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'async_error',
        expect.any(Number),
        expect.objectContaining({
          success: false,
          error: 'Error: Test error',
        })
      );
    });
  });

  describe('measureSync', () => {
    it('should measure sync function execution time', () => {
      const syncFn = vi.fn(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      const result = measureSync('sync_test', syncFn, { type: 'calculation' });

      expect(result).toBe(499500); // Sum of 0 to 999
      expect(syncFn).toHaveBeenCalledTimes(1);
      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'sync_test',
        expect.any(Number),
        expect.objectContaining({
          type: 'calculation',
          success: true,
        })
      );
    });

    it('should track errors in sync functions', () => {
      const syncFn = vi.fn(() => {
        throw new Error('Sync error');
      });

      expect(() => measureSync('sync_error', syncFn)).toThrow('Sync error');

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'sync_error',
        expect.any(Number),
        expect.objectContaining({
          success: false,
          error: 'Error: Sync error',
        })
      );
    });
  });

  describe('trackGridRender', () => {
    it('should track grid render performance', () => {
      trackGridRender(125.5, { rowCount: 100, columnCount: 10 });

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'virtual_grid_render',
        125.5,
        {
          metric_type: 'render_time',
          rowCount: 100,
          columnCount: 10,
        }
      );
    });

    it('should track grid render without context', () => {
      trackGridRender(50);

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'virtual_grid_render',
        50,
        {
          metric_type: 'render_time',
        }
      );
    });
  });

  describe('trackPDFExport', () => {
    it('should track PDF export performance', () => {
      trackPDFExport(3500, { pageCount: 10, reportType: 'hookup' });

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'pdf_export',
        3500,
        {
          metric_type: 'export_time',
          pageCount: 10,
          reportType: 'hookup',
        }
      );
    });
  });

  describe('trackDatabaseQuery', () => {
    it('should track database query performance', () => {
      trackDatabaseQuery(45.2, { queryType: 'select', recordCount: 500 });

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'database_query',
        45.2,
        {
          metric_type: 'query_time',
          queryType: 'select',
          recordCount: 500,
        }
      );
    });
  });

  describe('trackFileOperation', () => {
    it('should track file operations', () => {
      trackFileOperation('save', 250, { fileType: 'project', size: 1024 });

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'file_save',
        250,
        {
          metric_type: 'file_operation',
          operation: 'save',
          fileType: 'project',
          size: 1024,
        }
      );
    });
  });


  describe('Edge Cases', () => {
    it('should handle zero duration', () => {
      const timer = startTimer('zero_duration');
      timer.end();

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'zero_duration',
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should handle empty context objects', () => {
      trackGridRender(100, {});

      expect(telemetry.trackPerformance).toHaveBeenCalledWith(
        'virtual_grid_render',
        100,
        { metric_type: 'render_time' }
      );
    });

    it('should handle functions that return undefined', () => {
      const fn = vi.fn(() => undefined);
      const result = measureSync('undefined_result', fn);

      expect(result).toBeUndefined();
      expect(telemetry.trackPerformance).toHaveBeenCalled();
    });

    it('should handle async functions that return null', async () => {
      const fn = vi.fn(async () => null);
      const result = await measureAsync('null_result', fn);

      expect(result).toBeNull();
      expect(telemetry.trackPerformance).toHaveBeenCalled();
    });
  });
});
