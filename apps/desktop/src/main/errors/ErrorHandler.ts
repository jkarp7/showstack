/**
 * Global error handler with retry logic for transient failures
 * Implements exponential backoff for retryable errors
 */

import { DatabaseError, ConnectionError } from './DatabaseError';
import { logger } from '../utils/logger';

export class ErrorHandler {
  /**
   * Execute operation with automatic retry on transient failures
   *
   * @param operation - Async function to execute
   * @param operationName - Name for logging/debugging
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Result of the operation
   * @throws DatabaseError if all retries fail
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        logger.warn(`${operationName} failed (attempt ${attempt}/${maxRetries})`, {
          error: lastError.message,
          attempt,
          maxRetries,
          retryable: this.isRetryable(lastError)
        });

        // Only retry if error is recoverable and we haven't exhausted attempts
        if (attempt < maxRetries && this.isRetryable(lastError)) {
          // Exponential backoff with jitter to prevent thundering herd
          // Base: 100ms, 200ms, 400ms, 800ms...
          // Jitter: Random 0-10% of base delay
          const baseDelay = 100 * Math.pow(2, attempt - 1);
          const jitter = Math.random() * baseDelay * 0.1;
          const delay = Math.round(baseDelay + jitter);

          logger.info(`Retrying ${operationName} in ${delay}ms`, {
            attempt,
            baseDelay,
            jitter: Math.round(jitter)
          });
          await this.delay(delay);
        } else {
          // Not retryable or max attempts reached
          break;
        }
      }
    }

    // All retries failed
    throw new DatabaseError(
      `${operationName} failed after ${maxRetries} attempts: ${lastError!.message}`,
      operationName,
      false,
      lastError!
    );
  }

  /**
   * Execute operation synchronously with retry
   *
   * @param operation - Synchronous function to execute
   * @param operationName - Name for logging/debugging
   * @param maxRetries - Maximum number of retry attempts
   * @returns Result of the operation
   */
  executeWithRetrySync<T>(
    operation: () => T,
    operationName: string,
    maxRetries = 3
  ): T {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return operation();
      } catch (error) {
        lastError = error as Error;

        logger.warn(`${operationName} failed (attempt ${attempt}/${maxRetries})`, {
          error: lastError.message,
          attempt
        });

        // Only retry if error is recoverable and we haven't exhausted attempts
        if (attempt >= maxRetries || !this.isRetryable(lastError)) {
          break;
        }

        // Synchronous delay with jitter (not ideal, but necessary for sync operations)
        // Exponential backoff with jitter to prevent thundering herd
        const baseDelay = 100 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * baseDelay * 0.1;
        const delay = Math.round(baseDelay + jitter);

        const start = Date.now();
        while (Date.now() - start < delay) {
          // Busy wait
        }
      }
    }

    throw new DatabaseError(
      `${operationName} failed after ${maxRetries} attempts: ${lastError!.message}`,
      operationName,
      false,
      lastError!
    );
  }

  /**
   * Check if error is temporary and worth retrying
   */
  private isRetryable(error: Error): boolean {
    // Retry on connection errors
    if (error instanceof ConnectionError) {
      return true;
    }

    // Retry if error is explicitly marked as recoverable
    if (error instanceof DatabaseError && error.recoverable) {
      return true;
    }

    const errorMessage = error.message.toLowerCase();

    // SQLite lock errors (database is busy/locked)
    if (errorMessage.includes('sqlite_busy') ||
        errorMessage.includes('sqlite_locked') ||
        errorMessage.includes('database is locked')) {
      return true;
    }

    // Network errors
    if (errorMessage.includes('econnrefused') ||
        errorMessage.includes('etimedout') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('fetch failed')) {
      return true;
    }

    // File system temporary errors
    if (errorMessage.includes('ebusy') ||
        errorMessage.includes('eagain')) {
      return true;
    }

    // Not retryable
    return false;
  }

  /**
   * Async delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wrap a function with error handling
   * Returns a new function that automatically handles errors
   */
  wrap<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    operationName: string
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      return this.executeWithRetry(
        () => fn(...args),
        operationName
      );
    };
  }
}

// Singleton instance for global use
export const errorHandler = new ErrorHandler();
