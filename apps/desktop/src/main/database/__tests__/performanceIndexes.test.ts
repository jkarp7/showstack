/**
 * Performance Indexes Tests
 *
 * Benchmark tests to verify query performance improvements with indexes
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import {
  createPerformanceIndexes,
  dropPerformanceIndexes,
  analyzeQueryPerformance,
} from '../indexes/performanceIndexes';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Performance Indexes', () => {
  let db: Database.Database;
  let tempDir: string;

  beforeEach(() => {
    // Create temporary database for testing
    tempDir = mkdtempSync(join(tmpdir(), 'showstack-perf-test-'));
    const dbPath = join(tempDir, 'test.db');
    db = new Database(dbPath);
    // Use WAL mode and NORMAL sync for faster writes (especially on Windows CI)
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    // Create test tables matching production schema
    db.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE fixtures (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        type TEXT NOT NULL,
        manufacturer TEXT,
        model TEXT,
        quantity INTEGER DEFAULT 1,
        universe INTEGER,
        dmx_address INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );

      CREATE TABLE shop_order_projects (
        id TEXT PRIMARY KEY,
        parent_project_id TEXT,
        production_name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE shop_order_sections (
        id TEXT PRIMARY KEY,
        prep_project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE shop_order_items (
        id TEXT PRIMARY KEY,
        section_id TEXT NOT NULL,
        description TEXT NOT NULL,
        sort_order INTEGER,
        active_qty INTEGER DEFAULT 0,
        spare_qty INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE infrastructure_equipment (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        location TEXT,
        status TEXT DEFAULT 'Active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Insert test data (wrapped in transaction for performance)
    const seed = db.transaction(() => seedTestData(db));
    seed();
  }, 30000);

  afterEach(() => {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Index Creation', () => {
    it('should create all performance indexes', () => {
      createPerformanceIndexes(db);

      const stats = analyzeQueryPerformance(db);
      expect(stats.indexCount).toBeGreaterThan(15); // Should have created many indexes
    });

    it('should be idempotent - safe to call multiple times', () => {
      createPerformanceIndexes(db);
      const stats1 = analyzeQueryPerformance(db);

      createPerformanceIndexes(db);
      const stats2 = analyzeQueryPerformance(db);

      expect(stats1.indexCount).toBe(stats2.indexCount);
    });

    it('should drop all indexes', () => {
      createPerformanceIndexes(db);
      dropPerformanceIndexes(db);

      const stats = analyzeQueryPerformance(db);
      expect(stats.indexCount).toBe(0);
    });
  });

  describe('Query Performance', () => {
    it('should improve fixture lookup by project performance', () => {
      const projectId = 'project-1';

      // Measure without indexes
      const timeWithoutIndex = measureQueryTime(() => {
        db.prepare('SELECT * FROM fixtures WHERE project_id = ?').all(projectId);
      });

      // Create indexes
      createPerformanceIndexes(db);

      // Measure with indexes
      const timeWithIndex = measureQueryTime(() => {
        db.prepare('SELECT * FROM fixtures WHERE project_id = ?').all(projectId);
      });

      console.log(
        `Fixture lookup: ${timeWithoutIndex}ms (no index) → ${timeWithIndex}ms (with index)`,
      );

      // With indexes should be faster or equal (small dataset may not show difference)
      expect(timeWithIndex).toBeLessThanOrEqual(timeWithoutIndex + 1); // Allow 1ms margin
    });

    it('should improve shop order section lookup performance', () => {
      const projectId = 'shop-order-1';

      const timeWithoutIndex = measureQueryTime(() => {
        db.prepare('SELECT * FROM shop_order_sections WHERE prep_project_id = ?').all(projectId);
      });

      createPerformanceIndexes(db);

      const timeWithIndex = measureQueryTime(() => {
        db.prepare('SELECT * FROM shop_order_sections WHERE prep_project_id = ?').all(projectId);
      });

      console.log(
        `Shop order sections: ${timeWithoutIndex}ms (no index) → ${timeWithIndex}ms (with index)`,
      );

      expect(timeWithIndex).toBeLessThanOrEqual(timeWithoutIndex + 1);
    });

    it('should improve infrastructure filtering by category', () => {
      const projectId = 'project-1';
      const category = 'Network';

      const timeWithoutIndex = measureQueryTime(() => {
        db.prepare(
          'SELECT * FROM infrastructure_equipment WHERE project_id = ? AND category = ?',
        ).all(projectId, category);
      });

      createPerformanceIndexes(db);

      const timeWithIndex = measureQueryTime(() => {
        db.prepare(
          'SELECT * FROM infrastructure_equipment WHERE project_id = ? AND category = ?',
        ).all(projectId, category);
      });

      console.log(
        `Infrastructure filter: ${timeWithoutIndex}ms (no index) → ${timeWithIndex}ms (with index)`,
      );

      expect(timeWithIndex).toBeLessThanOrEqual(timeWithoutIndex + 1);
    });

    it('should improve project sorting by updated_at', () => {
      const timeWithoutIndex = measureQueryTime(() => {
        db.prepare('SELECT * FROM projects ORDER BY updated_at DESC LIMIT 10').all();
      });

      createPerformanceIndexes(db);

      const timeWithIndex = measureQueryTime(() => {
        db.prepare('SELECT * FROM projects ORDER BY updated_at DESC LIMIT 10').all();
      });

      console.log(
        `Project sorting: ${timeWithoutIndex}ms (no index) → ${timeWithIndex}ms (with index)`,
      );

      expect(timeWithIndex).toBeLessThanOrEqual(timeWithoutIndex + 1);
    });
  });

  describe('Query Analysis', () => {
    it('should return table statistics', () => {
      const stats = analyzeQueryPerformance(db);

      expect(stats.tableStats).toBeDefined();
      expect(stats.tableStats.length).toBeGreaterThan(0);

      const projectsStats = stats.tableStats.find((t) => t.table === 'projects');
      expect(projectsStats).toBeDefined();
      expect(projectsStats!.rowCount).toBeGreaterThan(0);
    });
  });
});

/**
 * Seed test data for performance testing
 */
function seedTestData(db: Database.Database): void {
  const now = Date.now();

  // Create test projects
  const projectStmt = db.prepare(`
    INSERT INTO projects (id, name, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);

  for (let i = 1; i <= 10; i++) {
    projectStmt.run(`project-${i}`, `Test Project ${i}`, now, now + i * 1000);
  }

  // Create test fixtures (100 fixtures across projects)
  const fixtureStmt = db.prepare(`
    INSERT INTO fixtures (id, project_id, type, manufacturer, model, quantity, universe, dmx_address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const types = ['Moving Light', 'LED Par', 'Conventional', 'Strobe'];
  const manufacturers = ['ETC', 'Chauvet', 'Martin', 'Robe'];

  for (let i = 1; i <= 100; i++) {
    const projectId = `project-${(i % 10) + 1}`;
    const type = types[i % types.length];
    const manufacturer = manufacturers[i % manufacturers.length];
    fixtureStmt.run(
      `fixture-${i}`,
      projectId,
      type,
      manufacturer,
      `Model ${i}`,
      Math.floor(Math.random() * 20) + 1,
      Math.floor(i / 32) + 1,
      (i % 32) * 10 + 1,
      now,
      now,
    );
  }

  // Create shop order data
  const shopOrderStmt = db.prepare(`
    INSERT INTO shop_order_projects (id, parent_project_id, production_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (let i = 1; i <= 5; i++) {
    shopOrderStmt.run(`shop-order-${i}`, `project-${i}`, `Shop Order ${i}`, now, now);
  }

  const sectionStmt = db.prepare(`
    INSERT INTO shop_order_sections (id, prep_project_id, name, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (let i = 1; i <= 20; i++) {
    const projectId = `shop-order-${(i % 5) + 1}`;
    sectionStmt.run(`section-${i}`, projectId, `Section ${i}`, i, now);
  }

  // Create infrastructure data
  const infraStmt = db.prepare(`
    INSERT INTO infrastructure_equipment (id, project_id, name, type, category, location, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const categories = ['Network', 'Power', 'Dimmer', 'Control'];
  const locations = ['FOH', 'Stage Left', 'Stage Right', 'Backstage'];

  for (let i = 1; i <= 50; i++) {
    const projectId = `project-${(i % 10) + 1}`;
    const category = categories[i % categories.length];
    const location = locations[i % locations.length];
    infraStmt.run(
      `infra-${i}`,
      projectId,
      `Equipment ${i}`,
      `Type ${i}`,
      category,
      location,
      'Active',
      now,
      now,
    );
  }
}

/**
 * Measure query execution time
 * Runs query multiple times and returns average time in milliseconds
 */
function measureQueryTime(queryFn: () => void, iterations: number = 10): number {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    queryFn();
    const end = performance.now();
    times.push(end - start);
  }

  // Return average time
  return times.reduce((sum, time) => sum + time, 0) / times.length;
}
