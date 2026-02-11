// @ts-nocheck
/**
 * Unit tests for ErrorHandler retry logic
 * Tests exponential backoff, retryable error detection, and failure scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler } from '../ErrorHandler';
import { ConnectionError, QueryError, TransactionError, DatabaseError } from '../DatabaseError';

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { logger } from '../../utils/logger';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    vi.clearAllMocks();
  });

  describe('executeWithRetry - Success Cases', () => {
    it('should execute operation successfully on first try', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(operation, 'test-operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry once and succeed on second attempt', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new ConnectionError('Connection timeout'))
        .mockResolvedValueOnce('success');

      const result = await errorHandler.executeWithRetry(operation, 'test-operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry multiple times and succeed on final attempt', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new ConnectionError('Timeout 1'))
        .mockRejectedValueOnce(new ConnectionError('Timeout 2'))
        .mockResolvedValueOnce('success');

      const result = await errorHandler.executeWithRetry(operation, 'test-operation', 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('executeWithRetry - Retry Logic', () => {
    it('should not retry non-retryable errors', async () => {
      const queryError = new QueryError('Syntax error', 'SELECT *');
      const operation = vi.fn().mockRejectedValue(queryError);

      await expect(errorHandler.executeWithRetry(operation, 'test-operation', 3)).rejects.toThrow(
        'test-operation failed after 3 attempts',
      );

      // Should only try once since error is not retryable
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry connection errors', async () => {
      const operation = vi.fn().mockRejectedValue(new ConnectionError('Network error'));

      await expect(errorHandler.executeWithRetry(operation, 'test-operation', 3)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should retry transient transaction errors', async () => {
      const operation = vi.fn().mockRejectedValue(new TransactionError('Deadlock', true));

      await expect(errorHandler.executeWithRetry(operation, 'test-operation', 3)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-transient transaction errors', async () => {
      const operation = vi
        .fn()
        .mockRejectedValue(new TransactionError('Constraint violation', false));

      await expect(errorHandler.executeWithRetry(operation, 'test-operation', 3)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry SQLite lock errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('SQLITE_BUSY: database is locked'));

      await expect(errorHandler.executeWithRetry(operation, 'test-operation', 3)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should retry network errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(errorHandler.executeWithRetry(operation, 'test-operation', 3)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('executeWithRetry - Error Messages', () => {
    it('should wrap final error in DatabaseError with attempt count', async () => {
      const originalError = new Error('Connection failed');
      const operation = vi.fn().mockRejectedValue(originalError);

      try {
        await errorHandler.executeWithRetry(operation, 'test-op', 2);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toContain('test-op failed after 2 attempts');
        expect((error as DatabaseError).operation).toBe('test-op');
        expect((error as DatabaseError).originalError).toBe(originalError);
      }
    });
  });

  describe('executeWithRetry - Custom Retry Count', () => {
    it('should respect custom maxRetries parameter', async () => {
      const operation = vi.fn().mockRejectedValue(new ConnectionError('Timeout'));

      await expect(errorHandler.executeWithRetry(operation, 'test-operation', 5)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(5);
    });

    it('should use default 3 retries when not specified', async () => {
      const operation = vi.fn().mockRejectedValue(new ConnectionError('Timeout'));

      await expect(errorHandler.executeWithRetry(operation, 'test-operation')).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('executeWithRetrySync', () => {
    it('should execute sync operation successfully', () => {
      const operation = vi.fn().mockReturnValue('success');

      const result = errorHandler.executeWithRetrySync(operation, 'test-operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry sync operation on retryable errors', () => {
      const operation = vi
        .fn()
        .mockImplementationOnce(() => {
          throw new ConnectionError('Timeout');
        })
        .mockReturnValueOnce('success');

      const result = errorHandler.executeWithRetrySync(operation, 'test-operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries for sync operations', () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new ConnectionError('Timeout');
      });

      expect(() => errorHandler.executeWithRetrySync(operation, 'test-operation', 3)).toThrow(
        'test-operation failed after 3 attempts',
      );

      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('wrap', () => {
    it('should wrap async function with retry logic', async () => {
      const originalFn = vi.fn().mockResolvedValue('result');
      const wrappedFn = errorHandler.wrap(originalFn, 'wrapped-operation');

      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('result');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should apply retry logic to wrapped function', async () => {
      const originalFn = vi
        .fn()
        .mockRejectedValueOnce(new ConnectionError('Timeout'))
        .mockResolvedValueOnce('result');

      const wrappedFn = errorHandler.wrap(originalFn, 'wrapped-operation');

      const result = await wrappedFn('arg1');

      expect(result).toBe('result');
      expect(originalFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('isRetryable - Private Method Testing via Behavior', () => {
    it('should identify various retryable error patterns', async () => {
      const retryableErrors = [
        new ConnectionError('Network error'),
        new TransactionError('Deadlock', true),
        new Error('SQLITE_BUSY'),
        new Error('SQLITE_LOCKED'),
        new Error('database is locked'),
        new Error('ECONNREFUSED'),
        new Error('ETIMEDOUT'),
        new Error('ENOTFOUND'),
        new Error('network error'),
        new Error('fetch failed'),
        new Error('EBUSY'),
        new Error('EAGAIN'),
      ];

      for (const error of retryableErrors) {
        const operation = vi.fn().mockRejectedValue(error);

        try {
          await errorHandler.executeWithRetry(operation, 'test', 2);
        } catch {
          /* expected error */
        }

        // Should have retried (called twice)
        expect(operation).toHaveBeenCalledTimes(2);
        vi.clearAllMocks();
      }
    });

    it('should identify non-retryable errors', async () => {
      const nonRetryableErrors = [
        new QueryError('Syntax error', 'SELECT *'),
        new TransactionError('Constraint violation', false),
        new Error('Validation failed'),
        new Error('Not found'),
        new Error('Permission denied'),
      ];

      for (const error of nonRetryableErrors) {
        const operation = vi.fn().mockRejectedValue(error);

        try {
          await errorHandler.executeWithRetry(operation, 'test', 3);
        } catch {
          /* expected error */
        }

        // Should not have retried (called once)
        expect(operation).toHaveBeenCalledTimes(1);
        vi.clearAllMocks();
      }
    });
  });

  describe('Logging', () => {
    it('should log errors with operation details', async () => {
      const operation = vi.fn().mockRejectedValue(new ConnectionError('Timeout'));

      try {
        await errorHandler.executeWithRetry(operation, 'test-operation', 2);
      } catch {
        /* expected error */
      }

      expect(logger.warn).toHaveBeenCalled();
      const warnCalls = (logger.warn as ReturnType<typeof vi.fn>).mock.calls;
      expect(
        warnCalls.some((call) => call[0].includes('test-operation') && call[0].includes('failed')),
      ).toBe(true);
    });
  });
});
