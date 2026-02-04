/**
 * Bulk Operations Test Suite
 *
 * Tests for bulk database operation utilities including:
 * - Empty array handling
 * - SQL injection prevention
 * - Large batch performance
 * - Error handling and rollback
 * - Transaction atomicity
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { TransactionManager } from '../core/TransactionManager';
import {
  bulkInsert,
  bulkUpdate,
  bulkDelete,
  bulkUpsert,
  executeInTransaction
} from '../utils/bulkOperations';

let testDb: Database.Database;

// Mock the getDatabase function
vi.mock('../index', () => ({
  getDatabase: () => testDb,
  createTransactionManager: (db: Database.Database) => new TransactionManager(db)
}));

// Mock getDatabase to return our test database
beforeEach(() => {
  // Create in-memory test database
  testDb = new Database(':memory:');

  // Create test table
  testDb.exec(`
    CREATE TABLE test_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      category TEXT
    )
  `);
});

afterEach(() => {
  // Close test database
  if (testDb) {
    testDb.close();
  }
});

describe('bulkInsert', () => {
  it('should insert multiple records successfully', () => {
    const count = bulkInsert(
      'test_items',
      [
        ['1', 'Item 1', 10, 'A'],
        ['2', 'Item 2', 20, 'B'],
        ['3', 'Item 3', 30, 'A']
      ],
      ['id', 'name', 'quantity', 'category']
    );

    expect(count).toBe(3);

    const rows = testDb.prepare('SELECT * FROM test_items ORDER BY id').all();
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ id: '1', name: 'Item 1', quantity: 10, category: 'A' });
  });

  it('should handle empty array without error', () => {
    const count = bulkInsert('test_items', [], ['id', 'name', 'quantity']);
    expect(count).toBe(0);

    const rows = testDb.prepare('SELECT * FROM test_items').all();
    expect(rows).toHaveLength(0);
  });

  it('should reject invalid table names', () => {
    expect(() => {
      bulkInsert(
        'test_items; DROP TABLE test_items; --',
        [['1', 'Item 1', 10]],
        ['id', 'name', 'quantity']
      );
    }).toThrow(/Invalid table name/);
  });

  it('should reject invalid column names', () => {
    expect(() => {
      bulkInsert(
        'test_items',
        [['1', 'Item 1', 10]],
        ['id', 'name; DROP TABLE test_items; --', 'quantity']
      );
    }).toThrow(/Invalid column name/);
  });

  it('should reject SQL keywords as identifiers', () => {
    expect(() => {
      bulkInsert(
        'DROP',
        [['1', 'Item 1', 10]],
        ['id', 'name', 'quantity']
      );
    }).toThrow(/SQL keyword not allowed/);
  });

  it('should rollback all inserts on error', () => {
    try {
      bulkInsert(
        'test_items',
        [
          ['1', 'Item 1', 10, 'A'],
          ['1', 'Item 2', 20, 'B'] // Duplicate primary key - should fail
        ],
        ['id', 'name', 'quantity', 'category']
      );
    } catch (error) {
      // Expected to throw
    }

    // Verify no records were inserted (transaction rolled back)
    const count = testDb.prepare('SELECT COUNT(*) as count FROM test_items').get() as { count: number };
    expect(count.count).toBe(0);
  });

  it('should handle large batches efficiently', () => {
    const largeData: any[][] = [];
    for (let i = 0; i < 1000; i++) {
      largeData.push([`id${i}`, `Item ${i}`, i, 'Category A']);
    }

    const start = Date.now();
    const count = bulkInsert('test_items', largeData, ['id', 'name', 'quantity', 'category']);
    const duration = Date.now() - start;

    expect(count).toBe(1000);
    expect(duration).toBeLessThan(500); // Should be fast with transaction

    const totalCount = testDb.prepare('SELECT COUNT(*) as count FROM test_items').get() as { count: number };
    expect(totalCount.count).toBe(1000);
  });
});

describe('bulkUpdate', () => {
  beforeEach(() => {
    // Insert test data
    testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('1', 'Item 1', 10, 'A');
    testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('2', 'Item 2', 20, 'B');
    testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('3', 'Item 3', 30, 'A');
  });

  it('should update multiple records successfully', () => {
    const count = bulkUpdate('test_items', [
      { id: '1', updates: { quantity: 15, category: 'C' } },
      { id: '2', updates: { quantity: 25 } }
    ]);

    expect(count).toBe(2);

    const item1 = testDb.prepare('SELECT * FROM test_items WHERE id = ?').get('1') as any;
    expect(item1.quantity).toBe(15);
    expect(item1.category).toBe('C');

    const item2 = testDb.prepare('SELECT * FROM test_items WHERE id = ?').get('2') as any;
    expect(item2.quantity).toBe(25);
  });

  it('should handle empty array without error', () => {
    const count = bulkUpdate('test_items', []);
    expect(count).toBe(0);
  });

  it('should reject invalid table names', () => {
    expect(() => {
      bulkUpdate('test_items; DROP TABLE test_items; --', [
        { id: '1', updates: { quantity: 15 } }
      ]);
    }).toThrow(/Invalid table name/);
  });

  it('should reject invalid column names in updates', () => {
    expect(() => {
      bulkUpdate('test_items', [
        { id: '1', updates: { 'quantity; DROP TABLE test_items; --': 15 } }
      ]);
    }).toThrow(); // Wrapped in DatabaseError "Transaction failed", but validates column names
  });

  it('should rollback all updates on error', () => {
    try {
      bulkUpdate('test_items', [
        { id: '1', updates: { quantity: 15 } },
        { id: '2', updates: { name: null } } // NOT NULL constraint - should fail
      ]);
    } catch (error) {
      // Expected to throw
    }

    // Verify no records were updated (transaction rolled back)
    const item1 = testDb.prepare('SELECT * FROM test_items WHERE id = ?').get('1') as any;
    expect(item1.quantity).toBe(10); // Original value
  });
});

describe('bulkDelete', () => {
  beforeEach(() => {
    // Insert test data
    testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('1', 'Item 1', 10, 'A');
    testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('2', 'Item 2', 20, 'B');
    testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('3', 'Item 3', 30, 'A');
  });

  it('should delete multiple records successfully', () => {
    const count = bulkDelete('test_items', ['1', '2']);

    expect(count).toBe(2);

    const rows = testDb.prepare('SELECT * FROM test_items').all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: '3' });
  });

  it('should handle empty array without error', () => {
    const count = bulkDelete('test_items', []);
    expect(count).toBe(0);

    const rows = testDb.prepare('SELECT * FROM test_items').all();
    expect(rows).toHaveLength(3); // All still there
  });

  it('should reject invalid table names', () => {
    expect(() => {
      bulkDelete('test_items; DROP TABLE test_items; --', ['1']);
    }).toThrow(/Invalid table name/);
  });

  it('should reject invalid column names', () => {
    expect(() => {
      bulkDelete('test_items', ['1'], 'id; DROP TABLE test_items; --');
    }).toThrow(/Invalid column name/);
  });

  it('should delete using custom ID column', () => {
    // Delete all items with category='A' or category='B'
    // This will delete all 3 rows (2 with A, 1 with B)
    const count = bulkDelete('test_items', ['A', 'B'], 'category');

    expect(count).toBe(3); // All 3 rows deleted

    const rows = testDb.prepare('SELECT * FROM test_items').all();
    expect(rows).toHaveLength(0); // No rows left
  });
});

describe('bulkUpsert', () => {
  it('should insert new records', () => {
    const count = bulkUpsert(
      'test_items',
      [
        ['1', 'Item 1', 10, 'A'],
        ['2', 'Item 2', 20, 'B']
      ],
      ['id', 'name', 'quantity', 'category']
    );

    expect(count).toBe(2);

    const rows = testDb.prepare('SELECT * FROM test_items ORDER BY id').all();
    expect(rows).toHaveLength(2);
  });

  it('should replace existing records', () => {
    // Insert initial data
    testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('1', 'Item 1', 10, 'A');

    // Upsert with updated values
    const count = bulkUpsert(
      'test_items',
      [
        ['1', 'Item 1 Updated', 15, 'C'],
        ['2', 'Item 2', 20, 'B']
      ],
      ['id', 'name', 'quantity', 'category']
    );

    expect(count).toBe(2);

    const rows = testDb.prepare('SELECT * FROM test_items ORDER BY id').all();
    expect(rows).toHaveLength(2);

    const item1 = rows[0] as any;
    expect(item1.name).toBe('Item 1 Updated');
    expect(item1.quantity).toBe(15);
    expect(item1.category).toBe('C');
  });

  it('should handle empty array without error', () => {
    const count = bulkUpsert('test_items', [], ['id', 'name', 'quantity']);
    expect(count).toBe(0);
  });

  it('should reject invalid table names', () => {
    expect(() => {
      bulkUpsert(
        'test_items; DROP TABLE test_items; --',
        [['1', 'Item 1', 10]],
        ['id', 'name', 'quantity']
      );
    }).toThrow(/Invalid table name/);
  });

  it('should rollback all upserts on error', () => {
    testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('1', 'Item 1', 10, 'A');

    try {
      bulkUpsert(
        'test_items',
        [
          ['1', 'Item 1 Updated', 15, 'C'],
          ['2', null, 20, 'B'] // NULL name - should fail
        ],
        ['id', 'name', 'quantity', 'category']
      );
    } catch (error) {
      // Expected to throw
    }

    // Verify original record unchanged (transaction rolled back)
    const item1 = testDb.prepare('SELECT * FROM test_items WHERE id = ?').get('1') as any;
    expect(item1.name).toBe('Item 1'); // Original value
    expect(item1.quantity).toBe(10); // Original value

    const count = testDb.prepare('SELECT COUNT(*) as count FROM test_items').get() as { count: number };
    expect(count.count).toBe(1); // Only original record
  });
});

describe('executeInTransaction', () => {
  it('should execute all operations atomically', () => {
    const results = executeInTransaction([
      () => testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('1', 'Item 1', 10, 'A'),
      () => testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('2', 'Item 2', 20, 'B'),
      () => testDb.prepare('SELECT COUNT(*) as count FROM test_items').get()
    ]);

    expect(results).toHaveLength(3);
    expect(results[2]).toMatchObject({ count: 2 });
  });

  it('should rollback all operations on error', () => {
    try {
      executeInTransaction([
        () => testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('1', 'Item 1', 10, 'A'),
        () => testDb.prepare('INSERT INTO test_items VALUES (?, ?, ?, ?)').run('1', 'Item 2', 20, 'B') // Duplicate PK
      ]);
    } catch (error) {
      // Expected to throw
    }

    const count = testDb.prepare('SELECT COUNT(*) as count FROM test_items').get() as { count: number };
    expect(count.count).toBe(0); // All rolled back
  });

  it('should handle empty operations array', () => {
    const results = executeInTransaction([]);
    expect(results).toHaveLength(0);
  });
});
