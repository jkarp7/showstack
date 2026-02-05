/**
 * Custom error classes for database operations
 * Provides structured error information for better debugging and error handling
 */

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly recoverable: boolean,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

/**
 * Connection errors are typically temporary and retryable
 */
export class ConnectionError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 'connection', true, originalError);
    this.name = 'ConnectionError';
  }
}

/**
 * Query errors indicate SQL syntax or data issues
 * Usually not retryable without fixing the query
 */
export class QueryError extends DatabaseError {
  constructor(
    message: string,
    public readonly query: string,
    originalError?: Error
  ) {
    super(message, 'query', false, originalError);
    this.name = 'QueryError';
  }
}

/**
 * Transaction errors occur during multi-step operations
 * May be retryable depending on the cause
 */
export class TransactionError extends DatabaseError {
  constructor(message: string, recoverable: boolean, originalError?: Error) {
    super(message, 'transaction', recoverable, originalError);
    this.name = 'TransactionError';
  }
}

/**
 * Migration errors occur during schema changes
 * Usually not retryable without fixing the migration
 */
export class MigrationError extends DatabaseError {
  constructor(
    message: string,
    public readonly migrationVersion: number,
    originalError?: Error
  ) {
    super(message, 'migration', false, originalError);
    this.name = 'MigrationError';
  }
}
