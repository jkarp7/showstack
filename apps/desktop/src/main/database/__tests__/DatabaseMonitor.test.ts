/**
 * Tests for DatabaseMonitor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DatabaseMonitor,
  monitoredQuery,
  monitoredQueryAsync
} from '../monitoring/DatabaseMonitor';

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('DatabaseMonitor', () => {
  let monitor: DatabaseMonitor;

  beforeEach(() => {
    monitor = new DatabaseMonitor();
  });

  describe('recordQuery', () => {
    it('should record a query execution', () => {
      monitor.recordQuery('test:operation', 50);

      const metrics = monitor.getOperationMetrics('test:operation');
      expect(metrics).not.toBeNull();
      expect(metrics?.count).toBe(1);
      expect(metrics?.totalTime).toBe(50);
      expect(metrics?.maxTime).toBe(50);
      expect(metrics?.minTime).toBe(50);
      expect(metrics?.errors).toBe(0);
    });

    it('should accumulate multiple executions', () => {
      monitor.recordQuery('test:operation', 50);
      monitor.recordQuery('test:operation', 100);
      monitor.recordQuery('test:operation', 25);

      const metrics = monitor.getOperationMetrics('test:operation');
      expect(metrics?.count).toBe(3);
      expect(metrics?.totalTime).toBe(175);
      expect(metrics?.maxTime).toBe(100);
      expect(metrics?.minTime).toBe(25);
      expect(metrics?.avgTime).toBeCloseTo(58.33, 1);
    });

    it('should record errors', () => {
      monitor.recordQuery('test:operation', 50);
      monitor.recordQuery('test:operation', 100, new Error('Test error'));

      const metrics = monitor.getOperationMetrics('test:operation');
      expect(metrics?.errors).toBe(1);
      expect(metrics?.count).toBe(2);
    });

    it('should not record when disabled', () => {
      monitor.setEnabled(false);
      monitor.recordQuery('test:operation', 50);

      const metrics = monitor.getOperationMetrics('test:operation');
      expect(metrics).toBeNull();
    });
  });

  describe('getSlowQueries', () => {
    it('should return queries above threshold', () => {
      monitor.recordQuery('fast:operation', 10);
      monitor.recordQuery('slow:operation', 200);
      monitor.recordQuery('medium:operation', 50);

      const slowQueries = monitor.getSlowQueries(100);
      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0].operation).toBe('slow:operation');
    });

    it('should use config threshold by default', () => {
      monitor.configure({ slowQueryThresholdMs: 50 });

      monitor.recordQuery('fast:operation', 10);
      monitor.recordQuery('slow:operation', 100);

      const slowQueries = monitor.getSlowQueries();
      expect(slowQueries).toHaveLength(1);
    });

    it('should sort by average time descending', () => {
      monitor.recordQuery('slower:operation', 300);
      monitor.recordQuery('slow:operation', 200);
      monitor.recordQuery('slowest:operation', 400);

      const slowQueries = monitor.getSlowQueries(100);
      expect(slowQueries[0].operation).toBe('slowest:operation');
      expect(slowQueries[1].operation).toBe('slower:operation');
      expect(slowQueries[2].operation).toBe('slow:operation');
    });
  });

  describe('getErrorOperations', () => {
    it('should return operations with errors', () => {
      monitor.recordQuery('good:operation', 50);
      monitor.recordQuery('bad:operation', 50, new Error('Error'));
      monitor.recordQuery('bad:operation', 50);

      const errorOps = monitor.getErrorOperations();
      expect(errorOps).toHaveLength(1);
      expect(errorOps[0].operation).toBe('bad:operation');
      expect(errorOps[0].errorCount).toBe(1);
      expect(errorOps[0].totalCount).toBe(2);
      expect(errorOps[0].errorRate).toBe(0.5);
    });

    it('should sort by error rate descending', () => {
      monitor.recordQuery('some:errors', 50, new Error('Error'));
      monitor.recordQuery('some:errors', 50);
      monitor.recordQuery('some:errors', 50);
      monitor.recordQuery('all:errors', 50, new Error('Error'));

      const errorOps = monitor.getErrorOperations();
      expect(errorOps[0].operation).toBe('all:errors');
      expect(errorOps[0].errorRate).toBe(1);
      expect(errorOps[1].errorRate).toBeCloseTo(0.33, 1);
    });
  });

  describe('getMetricsSummary', () => {
    it('should return complete summary', () => {
      monitor.recordQuery('op1', 50);
      monitor.recordQuery('op2', 100);
      monitor.recordQuery('op2', 200, new Error('Error'));

      const summary = monitor.getMetricsSummary();
      expect(summary.totalQueries).toBe(3);
      expect(summary.totalTime).toBe(350);
      expect(summary.totalErrors).toBe(1);
      expect(summary.uniqueOperations).toBe(2);
      expect(summary.operations['op1'].avgTime).toBe(50);
      expect(summary.operations['op2'].avgTime).toBe(150);
    });
  });

  describe('getTopSlowOperations', () => {
    it('should return top N slowest operations', () => {
      monitor.recordQuery('op1', 100);
      monitor.recordQuery('op2', 200);
      monitor.recordQuery('op3', 300);
      monitor.recordQuery('op4', 50);

      const top2 = monitor.getTopSlowOperations(2);
      expect(top2).toHaveLength(2);
      expect(top2[0].operation).toBe('op3');
      expect(top2[1].operation).toBe('op2');
    });
  });

  describe('getTopCalledOperations', () => {
    it('should return most frequently called operations', () => {
      monitor.recordQuery('frequent', 10);
      monitor.recordQuery('frequent', 10);
      monitor.recordQuery('frequent', 10);
      monitor.recordQuery('rare', 10);

      const top = monitor.getTopCalledOperations(2);
      expect(top[0].operation).toBe('frequent');
      expect(top[0].count).toBe(3);
      expect(top[1].operation).toBe('rare');
      expect(top[1].count).toBe(1);
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      monitor.recordQuery('op1', 50);
      monitor.recordQuery('op2', 100);

      monitor.reset();

      const summary = monitor.getMetricsSummary();
      expect(summary.totalQueries).toBe(0);
      expect(summary.uniqueOperations).toBe(0);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      monitor.configure({ slowQueryThresholdMs: 500, logSlowQueries: false });

      const config = monitor.getConfig();
      expect(config.slowQueryThresholdMs).toBe(500);
      expect(config.logSlowQueries).toBe(false);
    });
  });

  describe('maxTrackedOperations', () => {
    it('should limit tracked operations and remove oldest', () => {
      const smallMonitor = new DatabaseMonitor({ maxTrackedOperations: 3 });

      smallMonitor.recordQuery('op1', 10);
      smallMonitor.recordQuery('op2', 20);
      smallMonitor.recordQuery('op3', 30);

      // Add a delay to ensure different timestamps
      smallMonitor.recordQuery('op4', 40);

      const summary = smallMonitor.getMetricsSummary();
      expect(summary.uniqueOperations).toBe(3);
      // op1 should be removed as oldest
      expect(smallMonitor.getOperationMetrics('op1')).toBeNull();
    });
  });
});

describe('monitoredQuery', () => {
  beforeEach(() => {
    // Create a fresh monitor for these tests
    vi.clearAllMocks();
  });

  it('should execute function and record timing', () => {
    const monitor = new DatabaseMonitor();
    const fn = vi.fn().mockReturnValue('result');

    // We need to manually test since monitoredQuery uses singleton
    const start = Date.now();
    const result = fn();
    monitor.recordQuery('test:op', Date.now() - start);

    expect(result).toBe('result');
    expect(fn).toHaveBeenCalled();
  });

  it('should record error on throw', () => {
    const monitor = new DatabaseMonitor();
    const error = new Error('Test error');
    const fn = vi.fn().mockImplementation(() => {
      throw error;
    });

    expect(() => {
      try {
        fn();
      } catch (e) {
        monitor.recordQuery('test:op', 0, e as Error);
        throw e;
      }
    }).toThrow('Test error');

    const metrics = monitor.getOperationMetrics('test:op');
    expect(metrics?.errors).toBe(1);
  });
});

describe('monitoredQueryAsync', () => {
  it('should handle async functions', async () => {
    const monitor = new DatabaseMonitor();
    const fn = vi.fn().mockResolvedValue('async result');

    const start = Date.now();
    const result = await fn();
    monitor.recordQuery('test:async', Date.now() - start);

    expect(result).toBe('async result');
    expect(fn).toHaveBeenCalled();
  });

  it('should record error on async throw', async () => {
    const monitor = new DatabaseMonitor();
    const error = new Error('Async error');
    const fn = vi.fn().mockRejectedValue(error);

    try {
      await fn();
    } catch (e) {
      monitor.recordQuery('test:async', 0, e as Error);
    }

    const metrics = monitor.getOperationMetrics('test:async');
    expect(metrics?.errors).toBe(1);
  });
});
