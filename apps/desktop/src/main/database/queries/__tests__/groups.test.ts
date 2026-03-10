/**
 * Tests for fixture groups query helpers.
 *
 * Uses a real in-memory better-sqlite3 database to exercise actual SQL
 * rather than mocking it away.
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

// ─── In-memory database ───────────────────────────────────────────────────────

let db: Database.Database;

vi.mock('../../index', () => ({
  getDatabase: () => db,
  saveDatabase: vi.fn(),
}));

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fixtures (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fixture_groups (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    notes TEXT,
    shop_notes TEXT,
    filter_def TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fixture_group_pins (
    fixture_id TEXT NOT NULL,
    group_id   TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (fixture_id, group_id),
    FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES fixture_groups(id) ON DELETE CASCADE
  );
`;

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getPinsForGroup,
  getPinnedFixtureIds,
  addPin,
  removePin,
  getGroupsForFixture,
} from '../groups';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function insertProject(id: string, name: string = 'Test Project') {
  db.prepare(`INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
    id,
    name,
    1_000_000,
    1_000_000,
  );
}

function insertFixture(id: string, projectId: string) {
  db.prepare(
    `INSERT INTO fixtures (id, project_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
  ).run(id, projectId, 1_000_000, 1_000_000);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('fixture group queries', () => {
  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(SCHEMA);
    insertProject('proj-1');
    insertProject('proj-2');
  });

  afterEach(() => {
    db.close();
  });

  describe('createGroup', () => {
    it('creates a group with required fields', () => {
      const group = createGroup({ name: 'Moving Lights' }, 'proj-1');

      expect(group.id).toBeTruthy();
      expect(group.project_id).toBe('proj-1');
      expect(group.name).toBe('Moving Lights');
      expect(group.sort_order).toBe(0);
      expect(group.created_at).toBeGreaterThan(0);
    });

    it('stores optional fields', () => {
      const group = createGroup(
        {
          name: 'FOH Fixtures',
          color: '#4A90E2',
          notes: 'All front-of-house positions',
          shop_notes: 'Requires road cases',
          filter_def: JSON.stringify({ field: 'position', op: 'startsWith', value: 'FOH' }),
        },
        'proj-1',
      );

      expect(group.color).toBe('#4A90E2');
      expect(group.notes).toBe('All front-of-house positions');
      expect(group.shop_notes).toBe('Requires road cases');
      expect(group.filter_def).toContain('FOH');
    });

    it('auto-increments sort_order for each new group', () => {
      const g1 = createGroup({ name: 'First' }, 'proj-1');
      const g2 = createGroup({ name: 'Second' }, 'proj-1');
      const g3 = createGroup({ name: 'Third' }, 'proj-1');

      expect(g1.sort_order).toBe(0);
      expect(g2.sort_order).toBe(1);
      expect(g3.sort_order).toBe(2);
    });

    it('sort_order is per-project (proj-2 starts at 0)', () => {
      createGroup({ name: 'In project 1' }, 'proj-1');
      const g2 = createGroup({ name: 'In project 2' }, 'proj-2');

      expect(g2.sort_order).toBe(0);
    });
  });

  describe('getAllGroups', () => {
    it('returns groups ordered by sort_order', () => {
      createGroup({ name: 'A' }, 'proj-1');
      createGroup({ name: 'B' }, 'proj-1');
      createGroup({ name: 'C' }, 'proj-1');

      const groups = getAllGroups('proj-1');
      expect(groups.map((g) => g.name)).toEqual(['A', 'B', 'C']);
    });

    it('scopes results to the given project', () => {
      createGroup({ name: 'Proj1 Group' }, 'proj-1');
      createGroup({ name: 'Proj2 Group' }, 'proj-2');

      const groups = getAllGroups('proj-1');
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe('Proj1 Group');
    });

    it('returns empty array when no groups exist', () => {
      expect(getAllGroups('proj-1')).toEqual([]);
    });
  });

  describe('getGroupById', () => {
    it('returns the group by id', () => {
      const created = createGroup({ name: 'FOH' }, 'proj-1');
      const found = getGroupById(created.id);
      expect(found?.name).toBe('FOH');
    });

    it('returns undefined for unknown id', () => {
      expect(getGroupById('does-not-exist')).toBeUndefined();
    });
  });

  describe('updateGroup', () => {
    it('updates allowed fields', () => {
      const group = createGroup({ name: 'Old Name' }, 'proj-1');
      const updated = updateGroup(group.id, { name: 'New Name', color: '#FF0000' });

      expect(updated.name).toBe('New Name');
      expect(updated.color).toBe('#FF0000');
    });

    it('preserves unmodified fields', () => {
      const group = createGroup({ name: 'FOH', notes: 'Keep this' }, 'proj-1');
      const updated = updateGroup(group.id, { name: 'FOH Updated' });

      expect(updated.notes).toBe('Keep this');
    });

    it('updates sort_order', () => {
      const group = createGroup({ name: 'A' }, 'proj-1');
      const updated = updateGroup(group.id, { sort_order: 99 });
      expect(updated.sort_order).toBe(99);
    });

    it('bumps updated_at', () => {
      const group = createGroup({ name: 'A' }, 'proj-1');
      const before = group.updated_at;
      // Ensure some time passes
      const updated = updateGroup(group.id, { name: 'B' });
      expect(updated.updated_at).toBeGreaterThanOrEqual(before);
    });
  });

  describe('deleteGroup', () => {
    it('removes the group', () => {
      const group = createGroup({ name: 'To Delete' }, 'proj-1');
      deleteGroup(group.id);
      expect(getGroupById(group.id)).toBeUndefined();
    });

    it('does not throw for unknown id', () => {
      expect(() => deleteGroup('ghost-id')).not.toThrow();
    });
  });

  describe('pin operations', () => {
    let groupId: string;

    beforeEach(() => {
      const group = createGroup({ name: 'Test Group' }, 'proj-1');
      groupId = group.id;
      insertFixture('fix-1', 'proj-1');
      insertFixture('fix-2', 'proj-1');
    });

    it('addPin inserts a pin', () => {
      addPin(groupId, 'fix-1');
      const pins = getPinsForGroup(groupId);
      expect(pins).toHaveLength(1);
      expect(pins[0].fixture_id).toBe('fix-1');
    });

    it('addPin is idempotent (INSERT OR IGNORE)', () => {
      addPin(groupId, 'fix-1');
      addPin(groupId, 'fix-1');
      expect(getPinsForGroup(groupId)).toHaveLength(1);
    });

    it('removePin removes the pin', () => {
      addPin(groupId, 'fix-1');
      removePin(groupId, 'fix-1');
      expect(getPinsForGroup(groupId)).toHaveLength(0);
    });

    it('getPinnedFixtureIds returns only ids', () => {
      addPin(groupId, 'fix-1');
      addPin(groupId, 'fix-2');
      const ids = getPinnedFixtureIds(groupId);
      expect(ids).toContain('fix-1');
      expect(ids).toContain('fix-2');
    });

    it('getGroupsForFixture returns group ids', () => {
      const g2 = createGroup({ name: 'Second Group' }, 'proj-1');
      addPin(groupId, 'fix-1');
      addPin(g2.id, 'fix-1');

      const groupIds = getGroupsForFixture('fix-1');
      expect(groupIds).toContain(groupId);
      expect(groupIds).toContain(g2.id);
    });

    it('cascade deletes pins when group is deleted', () => {
      addPin(groupId, 'fix-1');
      deleteGroup(groupId);
      // No pins should remain referencing the deleted group
      const rows = db.prepare(`SELECT * FROM fixture_group_pins WHERE group_id = ?`).all(groupId);
      expect(rows).toHaveLength(0);
    });
  });
});
