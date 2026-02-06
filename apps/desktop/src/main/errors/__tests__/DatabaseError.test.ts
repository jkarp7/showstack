/**
 * Unit tests for DatabaseError custom error classes
 * Tests error structure, inheritance, and metadata
 */

import { describe, it, expect } from 'vitest';
import {
  DatabaseError,
  ConnectionError,
  QueryError,
  TransactionError,
  MigrationError,
} from '../DatabaseError';

describe('DatabaseError', () => {
  describe('DatabaseError base class', () => {
    it('should create error with required fields', () => {
      const error = new DatabaseError('Test error', 'test-op', true);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe('Test error');
      expect(error.operation).toBe('test-op');
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('DatabaseError');
    });

    it('should store original error', () => {
      const originalError = new Error('Original');
      const error = new DatabaseError('Wrapped', 'op', false, originalError);

      expect(error.originalError).toBe(originalError);
    });

    it('should have proper stack trace', () => {
      const error = new DatabaseError('Test', 'op', true);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('DatabaseError');
    });
  });

  describe('ConnectionError', () => {
    it('should create connection error', () => {
      const error = new ConnectionError('Connection failed');

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error).toBeInstanceOf(ConnectionError);
      expect(error.message).toBe('Connection failed');
      expect(error.operation).toBe('connection');
      expect(error.recoverable).toBe(true); // Connection errors are retryable
      expect(error.name).toBe('ConnectionError');
    });

    it('should wrap original error', () => {
      const originalError = new Error('ECONNREFUSED');
      const error = new ConnectionError('Network error', originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('QueryError', () => {
    it('should create query error with SQL', () => {
      const error = new QueryError('Syntax error', 'SELECT * FROM users');

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error).toBeInstanceOf(QueryError);
      expect(error.message).toBe('Syntax error');
      expect(error.query).toBe('SELECT * FROM users');
      expect(error.operation).toBe('query');
      expect(error.recoverable).toBe(false); // Query errors are not retryable
      expect(error.name).toBe('QueryError');
    });

    it('should wrap original error', () => {
      const originalError = new Error('SQL syntax error');
      const error = new QueryError('Bad query', 'INSERT INTO', originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('TransactionError', () => {
    it('should create recoverable transaction error', () => {
      const error = new TransactionError('Deadlock detected', true);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error).toBeInstanceOf(TransactionError);
      expect(error.message).toBe('Deadlock detected');
      expect(error.operation).toBe('transaction');
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('TransactionError');
    });

    it('should create non-recoverable transaction error', () => {
      const error = new TransactionError('Constraint violation', false);

      expect(error.recoverable).toBe(false);
    });

    it('should wrap original error', () => {
      const originalError = new Error('Rollback failed');
      const error = new TransactionError('Transaction failed', false, originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('MigrationError', () => {
    it('should create migration error with version', () => {
      const error = new MigrationError('Migration failed', 5);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error).toBeInstanceOf(MigrationError);
      expect(error.message).toBe('Migration failed');
      expect(error.migrationVersion).toBe(5);
      expect(error.operation).toBe('migration');
      expect(error.recoverable).toBe(false); // Migrations are not retryable
      expect(error.name).toBe('MigrationError');
    });

    it('should wrap original error', () => {
      const originalError = new Error('Table already exists');
      const error = new MigrationError('Migration v3 failed', 3, originalError);

      expect(error.originalError).toBe(originalError);
      expect(error.migrationVersion).toBe(3);
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain proper instanceof checks', () => {
      const connectionError = new ConnectionError('test');
      const queryError = new QueryError('test', 'SELECT *');
      const transactionError = new TransactionError('test', true);
      const migrationError = new MigrationError('test', 1);

      // All should be instances of DatabaseError
      expect(connectionError instanceof DatabaseError).toBe(true);
      expect(queryError instanceof DatabaseError).toBe(true);
      expect(transactionError instanceof DatabaseError).toBe(true);
      expect(migrationError instanceof DatabaseError).toBe(true);

      // All should be instances of Error
      expect(connectionError instanceof Error).toBe(true);
      expect(queryError instanceof Error).toBe(true);
      expect(transactionError instanceof Error).toBe(true);
      expect(migrationError instanceof Error).toBe(true);

      // Should not cross-match
      expect(connectionError instanceof QueryError).toBe(false);
      expect(queryError instanceof TransactionError).toBe(false);
      expect(transactionError instanceof MigrationError).toBe(false);
    });
  });
});
