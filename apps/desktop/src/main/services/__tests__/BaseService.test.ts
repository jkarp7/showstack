/**
 * Tests for BaseService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// Mock dependencies
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../errors', async () => {
  const actual = await vi.importActual('../../errors');
  return {
    ...actual,
    errorHandler: {
      executeWithRetry: vi.fn((fn) => fn()),
    },
  };
});

vi.mock('../../monitoring/PerformanceMonitor', () => ({
  performanceMonitor: {
    trackDatabaseQuery: vi.fn(),
  },
}));

vi.mock('../../database/monitoring/DatabaseMonitor', () => ({
  databaseMonitor: {
    recordQuery: vi.fn(),
  },
}));

// Import BaseService after mocking
import { BaseService } from '../BaseService';

// Create a concrete implementation for testing
class TestService extends BaseService {
  // Expose protected methods for testing
  public testValidateRequired(
    value: string | undefined | null,
    fieldName: string,
    displayName?: string,
  ): void {
    this.validateRequired(value, fieldName, displayName);
  }

  public testValidateId(id: string | undefined | null, entityName?: string): void {
    this.validateId(id, entityName);
  }

  public testValidateNonNegative(value: number | undefined | null, fieldName: string): void {
    this.validateNonNegative(value, fieldName);
  }

  public testValidateRange(
    value: number | undefined | null,
    min: number,
    max: number,
    fieldName: string,
  ): void {
    this.validateRange(value, min, max, fieldName);
  }

  public async testExecuteWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    return this.executeWithRetry(operation, operationName);
  }
}

describe('BaseService', () => {
  let service: TestService;

  beforeEach(() => {
    service = new TestService();
    vi.clearAllMocks();
  });

  describe('validateRequired', () => {
    it('should pass for non-empty string', () => {
      expect(() => service.testValidateRequired('value', 'field')).not.toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => service.testValidateRequired('', 'field')).toThrow(ValidationError);
    });

    it('should throw for whitespace-only string', () => {
      expect(() => service.testValidateRequired('   ', 'field')).toThrow(ValidationError);
    });

    it('should throw for null', () => {
      expect(() => service.testValidateRequired(null, 'field')).toThrow(ValidationError);
    });

    it('should throw for undefined', () => {
      expect(() => service.testValidateRequired(undefined, 'field')).toThrow(ValidationError);
    });

    it('should use displayName in error message if provided', () => {
      try {
        service.testValidateRequired('', 'field', 'Display Name');
      } catch (error) {
        expect((error as ValidationError).message).toContain('Display Name');
      }
    });
  });

  describe('validateId', () => {
    it('should pass for non-empty ID', () => {
      expect(() => service.testValidateId('abc-123')).not.toThrow();
    });

    it('should throw for empty ID', () => {
      expect(() => service.testValidateId('')).toThrow(ValidationError);
    });

    it('should throw for null ID', () => {
      expect(() => service.testValidateId(null)).toThrow(ValidationError);
    });

    it('should include entity name in error message', () => {
      try {
        service.testValidateId('', 'Fixture');
      } catch (error) {
        expect((error as ValidationError).message).toContain('Fixture');
      }
    });
  });

  describe('validateNonNegative', () => {
    it('should pass for positive number', () => {
      expect(() => service.testValidateNonNegative(10, 'quantity')).not.toThrow();
    });

    it('should pass for zero', () => {
      expect(() => service.testValidateNonNegative(0, 'quantity')).not.toThrow();
    });

    it('should pass for undefined', () => {
      expect(() => service.testValidateNonNegative(undefined, 'quantity')).not.toThrow();
    });

    it('should pass for null', () => {
      expect(() => service.testValidateNonNegative(null, 'quantity')).not.toThrow();
    });

    it('should throw for negative number', () => {
      expect(() => service.testValidateNonNegative(-5, 'quantity')).toThrow(ValidationError);
    });
  });

  describe('validateRange', () => {
    it('should pass for value within range', () => {
      expect(() => service.testValidateRange(5, 1, 10, 'value')).not.toThrow();
    });

    it('should pass for value at min boundary', () => {
      expect(() => service.testValidateRange(1, 1, 10, 'value')).not.toThrow();
    });

    it('should pass for value at max boundary', () => {
      expect(() => service.testValidateRange(10, 1, 10, 'value')).not.toThrow();
    });

    it('should pass for undefined', () => {
      expect(() => service.testValidateRange(undefined, 1, 10, 'value')).not.toThrow();
    });

    it('should pass for null', () => {
      expect(() => service.testValidateRange(null, 1, 10, 'value')).not.toThrow();
    });

    it('should throw for value below min', () => {
      expect(() => service.testValidateRange(0, 1, 10, 'value')).toThrow(ValidationError);
    });

    it('should throw for value above max', () => {
      expect(() => service.testValidateRange(11, 1, 10, 'value')).toThrow(ValidationError);
    });

    it('should include range in error message', () => {
      try {
        service.testValidateRange(100, 1, 10, 'universe');
      } catch (error) {
        expect((error as ValidationError).message).toContain('1');
        expect((error as ValidationError).message).toContain('10');
      }
    });
  });

  describe('executeWithRetry', () => {
    it('should execute operation successfully', async () => {
      const operation = vi.fn().mockResolvedValue('result');

      const result = await service.testExecuteWithRetry(operation, 'test:operation');

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalled();
    });

    it('should re-throw errors from operation', async () => {
      const error = new Error('Operation failed');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(service.testExecuteWithRetry(operation, 'test:operation')).rejects.toThrow(
        'Operation failed',
      );
    });
  });
});
