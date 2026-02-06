/**
 * TransactionManager - Manages database transactions for better-sqlite3
 *
 * Responsibilities:
 * - Execute operations within transactions
 * - Automatic rollback on error
 * - Support for nested transactions (savepoints)
 * - ACID guarantees for bulk operations
 *
 * Usage:
 * ```typescript
 * const txManager = new TransactionManager(db);
 *
 * // Simple transaction
 * const result = txManager.execute(() => {
 *   db.prepare('INSERT INTO table VALUES (?, ?)').run(val1, val2);
 *   db.prepare('UPDATE other_table SET x = ?').run(val3);
 *   return { success: true };
 * });
 *
 * // Async transaction (for operations with async logic)
 * await txManager.executeAsync(async () => {
 *   db.prepare('INSERT INTO table VALUES (?, ?)').run(val1, val2);
 *   await someAsyncOperation();
 *   db.prepare('UPDATE other_table SET x = ?').run(val3);
 * });
 * ```
 */

import Database from 'better-sqlite3';
import { DatabaseError } from '../../errors';
import { logger } from '../../utils/logger';

export class TransactionManager {
  constructor(private db: Database.Database) {}

  /**
   * Execute a function within a transaction
   * Automatically commits on success, rolls back on error
   *
   * @param callback - Function to execute within transaction
   * @returns The return value of the callback
   * @throws DatabaseError if transaction fails
   */
  execute<T>(callback: () => T): T {
    const transaction = this.db.transaction(callback);

    try {
      return transaction();
    } catch (error) {
      logger.error(
        'Transaction failed and was rolled back',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw new DatabaseError(
        'Transaction failed',
        'transaction:execute',
        false,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Execute an async function within a transaction
   * Note: The callback should perform all DB operations synchronously,
   * but can include async operations for business logic
   *
   * @param callback - Async function to execute within transaction
   * @returns Promise resolving to the return value of the callback
   * @throws DatabaseError if transaction fails
   */
  async executeAsync<T>(callback: () => Promise<T>): Promise<T> {
    // For async operations, we manually control the transaction
    let result: T;

    this.db.prepare('BEGIN').run();

    try {
      result = await callback();
      this.db.prepare('COMMIT').run();
      return result;
    } catch (error) {
      logger.error(
        'Async transaction failed and was rolled back',
        error instanceof Error ? error : new Error(String(error)),
      );
      this.db.prepare('ROLLBACK').run();
      throw new DatabaseError(
        'Async transaction failed',
        'transaction:executeAsync',
        false,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Execute a function within an immediate transaction
   * Immediate transactions start with BEGIN IMMEDIATE instead of BEGIN DEFERRED
   * Use this when you know you'll be writing to the database
   *
   * @param callback - Function to execute within immediate transaction
   * @returns The return value of the callback
   * @throws DatabaseError if transaction fails
   */
  executeImmediate<T>(callback: () => T): T {
    const transaction = this.db.transaction(callback);
    transaction.immediate();

    try {
      return transaction();
    } catch (error) {
      logger.error(
        'Immediate transaction failed and was rolled back',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw new DatabaseError(
        'Immediate transaction failed',
        'transaction:executeImmediate',
        false,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Execute a function within an exclusive transaction
   * Exclusive transactions prevent any other connection from accessing the database
   * Use sparingly, only for critical operations
   *
   * @param callback - Function to execute within exclusive transaction
   * @returns The return value of the callback
   * @throws DatabaseError if transaction fails
   */
  executeExclusive<T>(callback: () => T): T {
    const transaction = this.db.transaction(callback);
    transaction.exclusive();

    try {
      return transaction();
    } catch (error) {
      logger.error(
        'Exclusive transaction failed and was rolled back',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw new DatabaseError(
        'Exclusive transaction failed',
        'transaction:executeExclusive',
        false,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Execute multiple operations in a single transaction
   * Each operation is a function that performs database work
   * If any operation fails, the entire transaction is rolled back
   *
   * @param operations - Array of functions to execute
   * @returns Array of results from each operation
   * @throws DatabaseError if any operation fails
   */
  executeBatch<T>(operations: Array<() => T>): T[] {
    return this.execute(() => {
      return operations.map((op) => op());
    });
  }

  /**
   * Validate savepoint name to prevent SQL injection
   * Savepoint names must start with a letter or underscore and contain only
   * alphanumeric characters and underscores
   *
   * @param name - Savepoint name to validate
   * @throws DatabaseError if name is invalid
   */
  private validateSavepointName(name: string): void {
    if (!name || name.trim() === '') {
      throw new DatabaseError(
        'Invalid savepoint name: cannot be empty',
        'savepoint:validation',
        false,
      );
    }

    // Savepoint names must start with letter or underscore, contain only alphanumeric and underscore
    const validNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

    if (!validNamePattern.test(name)) {
      throw new DatabaseError(
        `Invalid savepoint name "${name}": must start with letter or underscore and contain only letters, numbers, and underscores`,
        'savepoint:validation',
        false,
      );
    }
  }

  /**
   * Create a savepoint within the current transaction
   * Useful for nested transaction-like behavior
   *
   * @param name - Name of the savepoint
   * @throws DatabaseError if savepoint name is invalid
   */
  savepoint(name: string): void {
    this.validateSavepointName(name);
    this.db.prepare(`SAVEPOINT ${name}`).run();
  }

  /**
   * Release a savepoint (commit the nested transaction)
   *
   * @param name - Name of the savepoint to release
   * @throws DatabaseError if savepoint name is invalid
   */
  releaseSavepoint(name: string): void {
    this.validateSavepointName(name);
    this.db.prepare(`RELEASE SAVEPOINT ${name}`).run();
  }

  /**
   * Rollback to a savepoint (undo changes since savepoint)
   *
   * @param name - Name of the savepoint to rollback to
   * @throws DatabaseError if savepoint name is invalid
   */
  rollbackToSavepoint(name: string): void {
    this.validateSavepointName(name);
    this.db.prepare(`ROLLBACK TO SAVEPOINT ${name}`).run();
  }
}

/**
 * Create a transaction manager for a database
 *
 * @param db - better-sqlite3 database instance
 * @returns TransactionManager instance
 */
export function createTransactionManager(db: Database.Database): TransactionManager {
  return new TransactionManager(db);
}
