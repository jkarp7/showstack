import { errorHandler, ValidationError } from '../errors';
import { performanceMonitor } from '../monitoring/PerformanceMonitor';
import { databaseMonitor } from '../database/monitoring/DatabaseMonitor';

/**
 * BaseService
 *
 * Base class for all service classes, providing common functionality:
 * - Retry logic with errorHandler
 * - Performance monitoring (dual monitoring strategy)
 * - Validation helpers
 * - Consistent error handling
 *
 * Services handle business logic and provide a clean integration point for PowerSync.
 * IPC handlers remain thin wrappers that:
 * - Validate input with Zod schemas
 * - Call service methods
 * - Handle errors and format user-friendly messages
 *
 * ## Dual Monitoring Strategy
 *
 * Every database operation is tracked by TWO monitors:
 *
 * 1. **PerformanceMonitor** - High-level application metrics
 *    - Aggregated stats for UI dashboards
 *    - Overall application health monitoring
 *    - Always enabled (core functionality)
 *
 * 2. **DatabaseMonitor** - Detailed query-level metrics
 *    - Individual query timing and error tracking
 *    - Slow query detection with configurable thresholds
 *    - Per-operation statistics (min/max/avg times)
 *    - Debugging and performance optimization
 *
 * ### Performance Impact
 * - Combined overhead: ~2-5% per query (negligible for most use cases)
 * - DatabaseMonitor uses bounded memory (max 1000 tracked operations)
 *
 * ### When to Disable DatabaseMonitor
 * For high-frequency operations (100+ queries/sec) where detailed metrics
 * aren't needed, disable DatabaseMonitor to reduce overhead:
 *
 * ```typescript
 * import { databaseMonitor } from '../database/monitoring/DatabaseMonitor';
 * databaseMonitor.configure({ enabled: false });
 * ```
 *
 * Re-enable for debugging sessions:
 * ```typescript
 * databaseMonitor.configure({ enabled: true });
 * ```
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
      const duration = Date.now() - start;

      /**
       * Track in both monitors for different purposes:
       * - PerformanceMonitor: High-level application metrics, aggregated stats for UI
       * - DatabaseMonitor: Detailed query-level metrics, slow query detection, debugging
       *
       * Note: Combined overhead is ~2-5% per query (negligible for most use cases).
       * DatabaseMonitor can be disabled via databaseMonitor.configure({ enabled: false })
       * if query-level metrics are not needed in production.
       */
      performanceMonitor.trackDatabaseQuery(operationName, duration, trackCount);
      databaseMonitor.recordQuery(operationName, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      // Track errors in both monitors (see success path for rationale)
      performanceMonitor.trackDatabaseQuery(operationName, duration);
      databaseMonitor.recordQuery(
        operationName,
        duration,
        error instanceof Error ? error : new Error(String(error))
      );

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
