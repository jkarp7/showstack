/**
 * Tests for project query helpers — specifically createProjectCopy and
 * the flat-tree family invariant it enforces.
 *
 * Uses a real in-memory better-sqlite3 database so that we exercise the
 * actual SQL (column quoting, INSERT shape, round-trip read) rather than
 * mocking it away.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── In-memory database setup ─────────────────────────────────────────────────

let db: Database.Database;

vi.mock('../../index', () => ({
  getDatabase: () => db,
  saveDatabase: vi.fn(),
}));

// Minimal projects schema matching production (includes root_project_id).
const PROJECTS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_path TEXT,
    enabled_modules TEXT,
    root_project_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { createProjectCopy, formatCopyTimestamp } from '../projects';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function insertProject(
  overrides: Partial<{
    id: string;
    name: string;
    description: string;
    root_project_id: string | null;
    created_at: number;
    updated_at: number;
  }> & { id: string; name: string },
) {
  const row = {
    description: null,
    root_project_id: null,
    logo_path: null,
    enabled_modules: null,
    created_at: 1_000_000,
    updated_at: 1_000_000,
    ...overrides,
  };
  db.prepare(
    `INSERT INTO projects (id, name, description, logo_path, enabled_modules, root_project_id, created_at, updated_at)
     VALUES (@id, @name, @description, @logo_path, @enabled_modules, @root_project_id, @created_at, @updated_at)`,
  ).run(row);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('createProjectCopy', () => {
  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(PROJECTS_SCHEMA);
  });

  afterEach(() => {
    db.close();
  });

  // ── Flat-tree invariant ───────────────────────────────────────────────────

  describe('flat-tree invariant', () => {
    it('a root project copy sets root_project_id to the original id', () => {
      insertProject({ id: 'root-1', name: 'Hamlet' });

      const copy = createProjectCopy('root-1');

      expect(copy.root_project_id).toBe('root-1');
    });

    it("a child project copy inherits the child's root_project_id (not the child's own id)", () => {
      insertProject({ id: 'root-1', name: 'Root' });
      insertProject({ id: 'child-1', name: 'Child', root_project_id: 'root-1' });

      const copy = createProjectCopy('child-1');

      // Must point to root-1, not child-1 — enforces flat tree
      expect(copy.root_project_id).toBe('root-1');
    });

    it('never chains child → child (no two-level depth)', () => {
      insertProject({ id: 'root-1', name: 'Root' });
      insertProject({ id: 'child-1', name: 'Child', root_project_id: 'root-1' });
      insertProject({ id: 'grand-1', name: 'Grand', root_project_id: 'root-1' }); // also flat

      const copy = createProjectCopy('grand-1');

      // Even though grand-1 points at root-1, copy should too
      expect(copy.root_project_id).toBe('root-1');
    });
  });

  // ── Identity and uniqueness ───────────────────────────────────────────────

  describe('identity', () => {
    it('copy receives a new UUID different from the original', () => {
      insertProject({ id: 'root-1', name: 'Hamlet' });

      const copy = createProjectCopy('root-1');

      expect(copy.id).not.toBe('root-1');
      expect(copy.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('two copies of the same project get different IDs', () => {
      insertProject({ id: 'root-1', name: 'Hamlet' });

      const copy1 = createProjectCopy('root-1');
      const copy2 = createProjectCopy('root-1');

      expect(copy1.id).not.toBe(copy2.id);
    });
  });

  // ── Name generation ───────────────────────────────────────────────────────

  describe('name generation', () => {
    it('defaults to "Original Name — YYYY-MM-DD HH:mm"', () => {
      insertProject({ id: 'root-1', name: 'Hamlet' });

      const before = Date.now();
      const copy = createProjectCopy('root-1');
      const after = Date.now();

      expect(copy.name).toMatch(/^Hamlet — \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);

      // Timestamp in the name should fall within the test window
      const tsString = copy.name.replace('Hamlet — ', '');
      const [datePart, timePart] = tsString.split(' ');
      const [y, m, d] = datePart.split('-').map(Number);
      const [h, min] = timePart.split(':').map(Number);
      const nameDate = new Date(y, m - 1, d, h, min);
      expect(nameDate.getTime()).toBeGreaterThanOrEqual(before - 60_000); // ±1 min tolerance
      expect(nameDate.getTime()).toBeLessThanOrEqual(after + 60_000);
    });

    it('uses the supplied copyName override when provided', () => {
      insertProject({ id: 'root-1', name: 'Hamlet' });

      const copy = createProjectCopy('root-1', 'Custom Name');

      expect(copy.name).toBe('Custom Name');
    });
  });

  // ── Field propagation ─────────────────────────────────────────────────────

  describe('field propagation', () => {
    it('copies description from the original', () => {
      insertProject({ id: 'root-1', name: 'Hamlet', description: 'A tragedy' });

      const copy = createProjectCopy('root-1');

      expect(copy.description).toBe('A tragedy');
    });

    it('sets both created_at and updated_at to now (not the original timestamps)', () => {
      insertProject({ id: 'root-1', name: 'Hamlet', created_at: 100, updated_at: 200 });

      const before = Date.now();
      const copy = createProjectCopy('root-1');
      const after = Date.now();

      expect(copy.created_at).toBeGreaterThanOrEqual(before);
      expect(copy.created_at).toBeLessThanOrEqual(after);
      expect(copy.updated_at).toBeGreaterThanOrEqual(before);
      expect(copy.updated_at).toBeLessThanOrEqual(after);
    });

    it('copy is actually persisted in the database', () => {
      insertProject({ id: 'root-1', name: 'Hamlet' });

      const copy = createProjectCopy('root-1');

      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(copy.id) as any;
      expect(row).not.toBeNull();
      expect(row.name).toBe(copy.name);
    });
  });

  // ── Column quoting ────────────────────────────────────────────────────────

  describe('column quoting', () => {
    it('handles projects with all optional columns populated without SQL errors', () => {
      // Populate every column — ensures the quoted INSERT handles all column names
      db.prepare(
        `INSERT INTO projects
           (id, name, description, logo_path, enabled_modules, root_project_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        'full-1',
        'Full Project',
        'Has everything',
        '/logo.png',
        '["lighting"]',
        null,
        1_000_000,
        1_000_000,
      );

      expect(() => createProjectCopy('full-1')).not.toThrow();
      const copies = db.prepare("SELECT * FROM projects WHERE id != 'full-1'").all();
      expect(copies).toHaveLength(1);
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws when the original project does not exist', () => {
      expect(() => createProjectCopy('nonexistent')).toThrow(/not found/i);
    });
  });
});

// ─── formatCopyTimestamp ─────────────────────────────────────────────────────

describe('formatCopyTimestamp', () => {
  it('formats a known timestamp correctly', () => {
    // 2024-01-15 09:05 local — use a date constructor so test is tz-agnostic
    const d = new Date(2024, 0, 15, 9, 5); // Jan 15 2024 09:05
    expect(formatCopyTimestamp(d.getTime())).toBe('2024-01-15 09:05');
  });

  it('zero-pads month, day, hours, and minutes', () => {
    const d = new Date(2024, 1, 3, 4, 7); // Feb 3 2024 04:07
    const result = formatCopyTimestamp(d.getTime());
    expect(result).toBe('2024-02-03 04:07');
  });
});
