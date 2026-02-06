import { errorHandler, ValidationError } from '../errors';
import { performanceMonitor } from '../monitoring/PerformanceMonitor';

/**
 * BaseService
 *
 * Base class for all service classes, providing common functionality:
 * - Retry logic with errorHandler
 * - Performance monitoring
 * - Validation helpers
 * - Consistent error handling
 *
 * Services handle business logic and provide a clean integration point for PowerSync.
 * IPC handlers remain thin wrappers that:
 * - Validate input with Zod schemas
 * - Call service methods
 * - Handle errors and format user-friendly messages
 */
export abstract class BaseService {
  /**
   * Execute a database operation with automatic retry and performance tracking
   *
   * @param operation The database operation to execute
   * @param operationName Name for logging and monitoring (e.g., 'fixtures:getAll')
   * @param trackCount Optional count for performance monitoring (e.g., result length)
   * @returns Promise with operation result
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    trackCount?: number
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await errorHandler.executeWithRetry(operation, operationName);
      performanceMonitor.trackDatabaseQuery(
        operationName,
        Date.now() - start,
        trackCount
      );
      return result;
    } catch (error) {
      performanceMonitor.trackDatabaseQuery(operationName, Date.now() - start);
      throw error;
    }
  }

  /**
   * Validate that a required field is not empty
   *
   * @param value The value to validate
   * @param fieldName The field name for error messages
   * @param displayName Optional display name for error messages
   * @throws ValidationError if value is empty
   */
  protected validateRequired(
    value: string | undefined | null,
    fieldName: string,
    displayName?: string
  ): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationError(
        `${displayName || fieldName} is required`,
        fieldName,
        value
      );
    }
  }

  /**
   * Validate that an ID is not empty
   *
   * @param id The ID to validate
   * @param entityName Optional entity name for error messages
   * @throws ValidationError if ID is empty
   */
  protected validateId(id: string | undefined | null, entityName?: string): void {
    if (!id || id.trim().length === 0) {
      throw new ValidationError(
        `${entityName || 'Entity'} ID is required`,
        'id',
        id
      );
    }
  }

  /**
   * Validate that a number is non-negative
   *
   * @param value The value to validate
   * @param fieldName The field name for error messages
   * @throws ValidationError if value is negative
   */
  protected validateNonNegative(
    value: number | undefined | null,
    fieldName: string
  ): void {
    if (value !== undefined && value !== null && value < 0) {
      throw new ValidationError(
        `${fieldName} must be non-negative`,
        fieldName,
        value
      );
    }
  }

  /**
   * Validate that a value is within a specific range
   *
   * @param value The value to validate
   * @param min Minimum value (inclusive)
   * @param max Maximum value (inclusive)
   * @param fieldName The field name for error messages
   * @throws ValidationError if value is out of range
   */
  protected validateRange(
    value: number | undefined | null,
    min: number,
    max: number,
    fieldName: string
  ): void {
    if (value !== undefined && value !== null && (value < min || value > max)) {
      throw new ValidationError(
        `${fieldName} must be between ${min} and ${max}`,
        fieldName,
        value
      );
    }
  }
}
