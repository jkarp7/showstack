/**
 * Bulk Operations Utilities
 *
 * Helper functions for performing bulk database operations within transactions.
 * All operations use transactions to ensure ACID guarantees.
 */

import { getDatabase, createTransactionManager } from '../index';

/**
 * Allowed SQL value types for bulk operations
 * Represents all valid types that can be stored in SQLite
 */
export type SQLValue = string | number | null | boolean | Buffer;

/**
 * Validate SQL identifier (table name, column name) to prevent SQL injection
 * Identifiers must:
 * - Start with a letter or underscore
 * - Contain only letters, numbers, and underscores
 * - Not be empty
 *
 * @param identifier - The identifier to validate
 * @param type - Type of identifier for error messages (e.g., 'table name', 'column name')
 * @throws Error if identifier is invalid
 */
function validateSqlIdentifier(identifier: string, type: string = 'identifier'): void {
  if (!identifier || identifier.trim() === '') {
    throw new Error(`Invalid ${type}: cannot be empty`);
  }

  // SQL identifiers must start with letter or underscore, contain only alphanumeric and underscore
  const validIdentifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  if (!validIdentifierPattern.test(identifier)) {
    throw new Error(
      `Invalid ${type} "${identifier}": must start with letter or underscore and contain only letters, numbers, and underscores`
    );
  }

  // Block SQL keywords and dangerous patterns
  const upperIdentifier = identifier.toUpperCase();
  const dangerousKeywords = [
    'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'EXEC', 'EXECUTE',
    'UNION', 'INSERT', 'UPDATE', 'CREATE', 'REPLACE', 'PRAGMA'
  ];

  if (dangerousKeywords.includes(upperIdentifier)) {
    throw new Error(`Invalid ${type} "${identifier}": SQL keyword not allowed as identifier`);
  }
}

/**
 * Validate an array of SQL identifiers
 *
 * @param identifiers - Array of identifiers to validate
 * @param type - Type of identifiers for error messages
 * @throws Error if any identifier is invalid
 */
function validateSqlIdentifiers(identifiers: string[], type: string = 'identifier'): void {
  for (const identifier of identifiers) {
    validateSqlIdentifier(identifier, type);
  }
}

/**
 * Bulk insert records into a table
 * Uses a transaction to ensure all inserts succeed or all fail
 *
 * @param tableName - Name of the table
 * @param records - Array of records to insert (each record is an array of SQLValue types)
 * @param columns - Column names in order
 * @returns Number of records inserted
 *
 * @example
 * ```typescript
 * const count = bulkInsert('fixtures', [
 *   ['id1', 'project1', 'Moving Light', 10],
 *   ['id2', 'project1', 'LED Par', 20]
 * ], ['id', 'project_id', 'type', 'quantity']);
 * // Each value must be: string | number | null | boolean | Buffer
 * ```
 */
export function bulkInsert(
  tableName: string,
  records: Array<Array<SQLValue>>,
  columns: string[]
): number {
  if (records.length === 0) {
    return 0;
  }

  // Validate SQL identifiers to prevent injection
  validateSqlIdentifier(tableName, 'table name');
  validateSqlIdentifiers(columns, 'column name');

  const db = getDatabase();
  const txManager = createTransactionManager(db);

  const placeholders = columns.map(() => '?').join(', ');
  const columnNames = columns.join(', ');
  const sql = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);

  return txManager.execute(() => {
    let count = 0;
    for (const record of records) {
      stmt.run(...record);
      count++;
    }
    return count;
  });
}

/**
 * Bulk update records in a table
 * Uses a transaction to ensure all updates succeed or all fail
 *
 * @param tableName - Name of the table
 * @param updates - Array of {id, updates} objects (update values must be SQLValue types)
 * @param idColumn - Name of the ID column (default: 'id')
 * @returns Number of records updated
 *
 * @example
 * ```typescript
 * const count = bulkUpdate('fixtures', [
 *   { id: 'id1', updates: { quantity: 15, name: 'Moving Light' } },
 *   { id: 'id2', updates: { quantity: 25, name: 'LED Par' } }
 * ]);
 * // Update values must be: string | number | null | boolean | Buffer
 * ```
 */
export function bulkUpdate(
  tableName: string,
  updates: Array<{ id: string; updates: Record<string, SQLValue> }>,
  idColumn: string = 'id'
): number {
  if (updates.length === 0) {
    return 0;
  }

  // Validate SQL identifiers to prevent injection - ALL validation before transaction
  validateSqlIdentifier(tableName, 'table name');
  validateSqlIdentifier(idColumn, 'column name');

  // Pre-validate all column names from all updates before starting transaction
  // This ensures fast failure without wasting transaction resources
  for (const { updates: updateData } of updates) {
    const columns = Object.keys(updateData);
    validateSqlIdentifiers(columns, 'column name');
  }

  const db = getDatabase();
  const txManager = createTransactionManager(db);

  return txManager.execute(() => {
    let count = 0;
    for (const { id, updates: updateData } of updates) {
      const columns = Object.keys(updateData);
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const values = columns.map(col => updateData[col]);

      const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${idColumn} = ?`;
      const stmt = db.prepare(sql);
      const info = stmt.run(...values, id);
      count += info.changes;
    }
    return count;
  });
}

/**
 * Bulk delete records from a table
 * Uses a transaction to ensure all deletes succeed or all fail
 *
 * @param tableName - Name of the table
 * @param ids - Array of IDs to delete
 * @param idColumn - Name of the ID column (default: 'id')
 * @returns Number of records deleted
 *
 * @example
 * ```typescript
 * const count = bulkDelete('fixtures', ['id1', 'id2', 'id3']);
 * ```
 */
export function bulkDelete(
  tableName: string,
  ids: string[],
  idColumn: string = 'id'
): number {
  if (ids.length === 0) {
    return 0;
  }

  // Validate SQL identifiers to prevent injection
  validateSqlIdentifier(tableName, 'table name');
  validateSqlIdentifier(idColumn, 'column name');

  const db = getDatabase();
  const txManager = createTransactionManager(db);

  const placeholders = ids.map(() => '?').join(', ');
  const sql = `DELETE FROM ${tableName} WHERE ${idColumn} IN (${placeholders})`;
  const stmt = db.prepare(sql);

  return txManager.execute(() => {
    const info = stmt.run(...ids);
    return info.changes;
  });
}

/**
 * Execute multiple database operations in a single transaction
 * If any operation fails, all operations are rolled back
 *
 * @param operations - Array of functions that perform database operations
 * @returns Array of results from each operation
 *
 * @example
 * ```typescript
 * const results = executeInTransaction([
 *   () => db.prepare('INSERT INTO fixtures ...').run(...),
 *   () => db.prepare('UPDATE projects ...').run(...),
 *   () => db.prepare('DELETE FROM old_data ...').run(...)
 * ]);
 * ```
 */
export function executeInTransaction<T>(operations: Array<() => T>): T[] {
  const db = getDatabase();
  const txManager = createTransactionManager(db);

  return txManager.execute(() => {
    return operations.map(op => op());
  });
}

/**
 * Bulk upsert (insert or update) records
 * Uses INSERT OR REPLACE for efficiency
 *
 * @param tableName - Name of the table
 * @param records - Array of records to upsert (each record is an array of SQLValue types)
 * @param columns - Column names in order
 * @returns Number of records upserted
 *
 * @example
 * ```typescript
 * const count = bulkUpsert('fixtures', [
 *   ['id1', 'project1', 'Moving Light', 10],
 *   ['id2', 'project1', 'LED Par', 20]
 * ], ['id', 'project_id', 'type', 'quantity']);
 * // Each value must be: string | number | null | boolean | Buffer
 * ```
 */
export function bulkUpsert(
  tableName: string,
  records: Array<Array<SQLValue>>,
  columns: string[]
): number {
  if (records.length === 0) {
    return 0;
  }

  // Validate SQL identifiers to prevent injection
  validateSqlIdentifier(tableName, 'table name');
  validateSqlIdentifiers(columns, 'column name');

  const db = getDatabase();
  const txManager = createTransactionManager(db);

  const placeholders = columns.map(() => '?').join(', ');
  const columnNames = columns.join(', ');
  const sql = `INSERT OR REPLACE INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);

  return txManager.execute(() => {
    let count = 0;
    for (const record of records) {
      stmt.run(...record);
      count++;
    }
    return count;
  });
}
