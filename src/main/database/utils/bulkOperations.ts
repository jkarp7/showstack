/**
 * Bulk Operations Utilities
 *
 * Helper functions for performing bulk database operations within transactions.
 * All operations use transactions to ensure ACID guarantees.
 */

import { getDatabase, createTransactionManager } from '../index';

/**
 * Bulk insert records into a table
 * Uses a transaction to ensure all inserts succeed or all fail
 *
 * @param tableName - Name of the table
 * @param records - Array of records to insert
 * @param columns - Column names in order
 * @returns Number of records inserted
 *
 * @example
 * ```typescript
 * const count = bulkInsert('fixtures', [
 *   ['id1', 'project1', 'Moving Light', 10],
 *   ['id2', 'project1', 'LED Par', 20]
 * ], ['id', 'project_id', 'type', 'quantity']);
 * ```
 */
export function bulkInsert(
  tableName: string,
  records: any[][],
  columns: string[]
): number {
  if (records.length === 0) {
    return 0;
  }

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
 * @param updates - Array of {id, updates} objects
 * @param idColumn - Name of the ID column (default: 'id')
 * @returns Number of records updated
 *
 * @example
 * ```typescript
 * const count = bulkUpdate('fixtures', [
 *   { id: 'id1', updates: { quantity: 15 } },
 *   { id: 'id2', updates: { quantity: 25 } }
 * ]);
 * ```
 */
export function bulkUpdate(
  tableName: string,
  updates: Array<{ id: string; updates: Record<string, any> }>,
  idColumn: string = 'id'
): number {
  if (updates.length === 0) {
    return 0;
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
 * @param records - Array of records to upsert
 * @param columns - Column names in order
 * @returns Number of records upserted
 *
 * @example
 * ```typescript
 * const count = bulkUpsert('fixtures', [
 *   ['id1', 'project1', 'Moving Light', 10],
 *   ['id2', 'project1', 'LED Par', 20]
 * ], ['id', 'project_id', 'type', 'quantity']);
 * ```
 */
export function bulkUpsert(
  tableName: string,
  records: any[][],
  columns: string[]
): number {
  if (records.length === 0) {
    return 0;
  }

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
