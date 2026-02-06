/**
 * TransactionManager Tests
 *
 * Tests for transaction management, ACID guarantees, and rollback behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { TransactionManager } from '../core/TransactionManager';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('TransactionManager', () => {
  let db: Database.Database;
  let txManager: TransactionManager;
  let tempDir: string;

  beforeEach(() => {
    // Create temporary database for testing
    tempDir = mkdtempSync(join(tmpdir(), 'showstack-test-'));
    const dbPath = join(tempDir, 'test.db');
    db = new Database(dbPath);

    // Create test table
    db.exec(`
      CREATE TABLE test_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        value INTEGER NOT NULL
      )
    `);

    txManager = new TransactionManager(db);
  });

  afterEach(() => {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('execute()', () => {
    it('should commit transaction on success', () => {
      txManager.execute(() => {
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '1',
          'Item 1',
          100,
        );
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '2',
          'Item 2',
          200,
        );
      });

      const count = db.prepare('SELECT COUNT(*) as count FROM test_items').get() as {
        count: number;
      };
      expect(count.count).toBe(2);
    });

    it('should rollback transaction on error', () => {
      try {
        txManager.execute(() => {
          db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
            '1',
            'Item 1',
            100,
          );
          // This will fail - duplicate primary key
          db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
            '1',
            'Item 2',
            200,
          );
        });
      } catch (error) {
        // Expected to throw
      }

      // No rows should be inserted due to rollback
      const count = db.prepare('SELECT COUNT(*) as count FROM test_items').get() as {
        count: number;
      };
      expect(count.count).toBe(0);
    });

    it('should return value from callback', () => {
      const result = txManager.execute(() => {
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '1',
          'Item 1',
          100,
        );
        return { success: true, id: '1' };
      });

      expect(result).toEqual({ success: true, id: '1' });
    });

    it('should handle multiple operations atomically', () => {
      txManager.execute(() => {
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '1',
          'Item 1',
          100,
        );
        db.prepare('UPDATE test_items SET value = ? WHERE id = ?').run(150, '1');
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '2',
          'Item 2',
          200,
        );
      });

      const items = db.prepare('SELECT * FROM test_items ORDER BY id').all();
      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({ id: '1', value: 150 });
      expect(items[1]).toMatchObject({ id: '2', value: 200 });
    });
  });

  describe('executeAsync()', () => {
    it('should commit async transaction on success', async () => {
      await txManager.executeAsync(async () => {
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '1',
          'Item 1',
          100,
        );
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '2',
          'Item 2',
          200,
        );
      });

      const count = db.prepare('SELECT COUNT(*) as count FROM test_items').get() as {
        count: number;
      };
      expect(count.count).toBe(2);
    });

    it('should rollback async transaction on error', async () => {
      try {
        await txManager.executeAsync(async () => {
          db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
            '1',
            'Item 1',
            100,
          );
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));
          // This will fail - duplicate primary key
          db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
            '1',
            'Item 2',
            200,
          );
        });
      } catch (error) {
        // Expected to throw
      }

      // No rows should be inserted due to rollback
      const count = db.prepare('SELECT COUNT(*) as count FROM test_items').get() as {
        count: number;
      };
      expect(count.count).toBe(0);
    });
  });

  describe('executeBatch()', () => {
    it('should execute all operations in transaction', () => {
      const results = txManager.executeBatch([
        () =>
          db
            .prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)')
            .run('1', 'Item 1', 100),
        () =>
          db
            .prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)')
            .run('2', 'Item 2', 200),
        () =>
          db
            .prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)')
            .run('3', 'Item 3', 300),
      ]);

      expect(results).toHaveLength(3);
      const count = db.prepare('SELECT COUNT(*) as count FROM test_items').get() as {
        count: number;
      };
      expect(count.count).toBe(3);
    });

    it('should rollback all operations if one fails', () => {
      try {
        txManager.executeBatch([
          () =>
            db
              .prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)')
              .run('1', 'Item 1', 100),
          () =>
            db
              .prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)')
              .run('2', 'Item 2', 200),
          () =>
            db
              .prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)')
              .run('1', 'Item 3', 300), // Duplicate ID
        ]);
      } catch (error) {
        // Expected to throw
      }

      // No rows should be inserted due to rollback
      const count = db.prepare('SELECT COUNT(*) as count FROM test_items').get() as {
        count: number;
      };
      expect(count.count).toBe(0);
    });
  });

  describe('savepoints', () => {
    it('should support nested transactions with savepoints', () => {
      txManager.execute(() => {
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '1',
          'Item 1',
          100,
        );

        // Create savepoint
        txManager.savepoint('sp1');
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '2',
          'Item 2',
          200,
        );

        // Rollback to savepoint (removes Item 2)
        txManager.rollbackToSavepoint('sp1');

        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '3',
          'Item 3',
          300,
        );
      });

      const items = db.prepare('SELECT * FROM test_items ORDER BY id').all();
      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({ id: '1', value: 100 });
      expect(items[1]).toMatchObject({ id: '3', value: 300 });
    });

    it('should release savepoints', () => {
      txManager.execute(() => {
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '1',
          'Item 1',
          100,
        );

        txManager.savepoint('sp1');
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '2',
          'Item 2',
          200,
        );
        txManager.releaseSavepoint('sp1');

        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '3',
          'Item 3',
          300,
        );
      });

      const count = db.prepare('SELECT COUNT(*) as count FROM test_items').get() as {
        count: number;
      };
      expect(count.count).toBe(3);
    });
  });

  describe('ACID guarantees', () => {
    it('should ensure atomicity - all or nothing', () => {
      try {
        txManager.execute(() => {
          for (let i = 1; i <= 10; i++) {
            if (i === 10) {
              // Fail on last insert
              db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
                '1',
                'Duplicate',
                999,
              );
            } else {
              db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
                `${i}`,
                `Item ${i}`,
                i * 100,
              );
            }
          }
        });
      } catch (error) {
        // Expected to throw
      }

      // No rows should exist - atomicity ensures all-or-nothing
      const count = db.prepare('SELECT COUNT(*) as count FROM test_items').get() as {
        count: number;
      };
      expect(count.count).toBe(0);
    });

    it('should ensure isolation - concurrent transactions', () => {
      // First transaction
      txManager.execute(() => {
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '1',
          'Item 1',
          100,
        );
      });

      // Second transaction sees committed data
      txManager.execute(() => {
        const item = db.prepare('SELECT * FROM test_items WHERE id = ?').get('1');
        expect(item).toBeDefined();
        db.prepare('INSERT INTO test_items (id, name, value) VALUES (?, ?, ?)').run(
          '2',
          'Item 2',
          200,
        );
      });

      const count = db.prepare('SELECT COUNT(*) as count FROM test_items').get() as {
        count: number;
      };
      expect(count.count).toBe(2);
    });
  });
});
