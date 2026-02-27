import { describe, it, expect } from 'vitest';
import { groupProjectsIntoFamilies } from '../projectFamilies';
import type { Project } from '../../store/projectStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProject(overrides: Partial<Project> & { id: string; name: string }): Project {
  return {
    created_at: 1000,
    updated_at: 1000,
    root_project_id: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('groupProjectsIntoFamilies', () => {
  describe('empty and single-project inputs', () => {
    it('returns empty families and standalones for an empty list', () => {
      const result = groupProjectsIntoFamilies([]);
      expect(result.families).toEqual([]);
      expect(result.standalones).toEqual([]);
    });

    it('puts a single standalone project in standalones', () => {
      const p = makeProject({ id: 'p1', name: 'Solo' });
      const result = groupProjectsIntoFamilies([p]);
      expect(result.standalones).toEqual([p]);
      expect(result.families).toEqual([]);
    });
  });

  describe('family formation', () => {
    it('groups root + one child into a family', () => {
      const root = makeProject({ id: 'root', name: 'Root', updated_at: 1000 });
      const child = makeProject({
        id: 'child',
        name: 'Child',
        root_project_id: 'root',
        updated_at: 2000,
      });

      const result = groupProjectsIntoFamilies([root, child]);

      expect(result.families).toHaveLength(1);
      expect(result.standalones).toHaveLength(0);
      expect(result.families[0].root).toEqual(root);
      expect(result.families[0].children).toEqual([child]);
    });

    it('groups root + multiple children into a single family', () => {
      const root = makeProject({ id: 'root', name: 'Root', updated_at: 1000 });
      const c1 = makeProject({
        id: 'c1',
        name: 'Copy 1',
        root_project_id: 'root',
        updated_at: 2000,
      });
      const c2 = makeProject({
        id: 'c2',
        name: 'Copy 2',
        root_project_id: 'root',
        updated_at: 3000,
      });

      const result = groupProjectsIntoFamilies([root, c1, c2]);

      expect(result.families).toHaveLength(1);
      const { root: r, children } = result.families[0];
      expect(r).toEqual(root);
      expect(children).toHaveLength(2);
    });

    it('keeps children sorted by updated_at DESC within a family', () => {
      const root = makeProject({ id: 'root', name: 'Root', updated_at: 1000 });
      const older = makeProject({
        id: 'older',
        name: 'Older',
        root_project_id: 'root',
        updated_at: 1500,
      });
      const newer = makeProject({
        id: 'newer',
        name: 'Newer',
        root_project_id: 'root',
        updated_at: 3000,
      });
      const middle = makeProject({
        id: 'middle',
        name: 'Middle',
        root_project_id: 'root',
        updated_at: 2000,
      });

      const result = groupProjectsIntoFamilies([root, older, middle, newer]);

      const { children } = result.families[0];
      expect(children.map((c) => c.id)).toEqual(['newer', 'middle', 'older']);
    });

    it('handles multiple independent families', () => {
      const rootA = makeProject({ id: 'rootA', name: 'A', updated_at: 1000 });
      const childA = makeProject({
        id: 'childA',
        name: 'A-copy',
        root_project_id: 'rootA',
        updated_at: 2000,
      });
      const rootB = makeProject({ id: 'rootB', name: 'B', updated_at: 5000 });
      const childB = makeProject({
        id: 'childB',
        name: 'B-copy',
        root_project_id: 'rootB',
        updated_at: 6000,
      });

      const result = groupProjectsIntoFamilies([rootA, childA, rootB, childB]);

      expect(result.families).toHaveLength(2);
      expect(result.standalones).toHaveLength(0);
      // Family B is more recently updated — should come first
      expect(result.families[0].root.id).toBe('rootB');
      expect(result.families[1].root.id).toBe('rootA');
    });

    it('a root with no children goes to standalones, not families', () => {
      const root = makeProject({ id: 'root', name: 'Root' });

      const result = groupProjectsIntoFamilies([root]);

      expect(result.families).toHaveLength(0);
      expect(result.standalones).toEqual([root]);
    });
  });

  describe('orphan handling', () => {
    it('promotes a child whose root was deleted to standalones', () => {
      // No root project in the list — 'missing-root' was deleted
      const orphan = makeProject({
        id: 'orphan',
        name: 'Orphan',
        root_project_id: 'missing-root',
        updated_at: 2000,
      });

      const result = groupProjectsIntoFamilies([orphan]);

      expect(result.families).toHaveLength(0);
      expect(result.standalones).toEqual([orphan]);
    });

    it('promotes multiple orphans from the same deleted root', () => {
      const o1 = makeProject({
        id: 'o1',
        name: 'Orphan 1',
        root_project_id: 'gone',
        updated_at: 1000,
      });
      const o2 = makeProject({
        id: 'o2',
        name: 'Orphan 2',
        root_project_id: 'gone',
        updated_at: 2000,
      });

      const result = groupProjectsIntoFamilies([o1, o2]);

      expect(result.families).toHaveLength(0);
      expect(result.standalones).toHaveLength(2);
    });
  });

  describe('sort order', () => {
    it('sorts families by most-recently-updated member, not just root', () => {
      // Family A: root updated_at=1000, child updated_at=9000 — most recent member wins
      const rootA = makeProject({ id: 'rootA', name: 'A', updated_at: 1000 });
      const childA = makeProject({
        id: 'childA',
        name: 'A-copy',
        root_project_id: 'rootA',
        updated_at: 9000,
      });
      // Family B: root updated_at=5000, child updated_at=5500
      const rootB = makeProject({ id: 'rootB', name: 'B', updated_at: 5000 });
      const childB = makeProject({
        id: 'childB',
        name: 'B-copy',
        root_project_id: 'rootB',
        updated_at: 5500,
      });

      const result = groupProjectsIntoFamilies([rootA, childA, rootB, childB]);

      // Family A's most-recent member (9000) > Family B's (5500)
      expect(result.families[0].root.id).toBe('rootA');
      expect(result.families[1].root.id).toBe('rootB');
    });

    it('sorts standalones by updated_at DESC', () => {
      const old = makeProject({ id: 'old', name: 'Old', updated_at: 1000 });
      const newest = makeProject({ id: 'newest', name: 'Newest', updated_at: 5000 });
      const mid = makeProject({ id: 'mid', name: 'Mid', updated_at: 3000 });

      const result = groupProjectsIntoFamilies([old, newest, mid]);

      expect(result.standalones.map((p) => p.id)).toEqual(['newest', 'mid', 'old']);
    });
  });

  describe('mixed families and standalones', () => {
    it('correctly separates families from standalones', () => {
      const root = makeProject({ id: 'root', name: 'Root', updated_at: 1000 });
      const child = makeProject({
        id: 'child',
        name: 'Child',
        root_project_id: 'root',
        updated_at: 2000,
      });
      const solo = makeProject({ id: 'solo', name: 'Solo', updated_at: 500 });

      const result = groupProjectsIntoFamilies([root, child, solo]);

      expect(result.families).toHaveLength(1);
      expect(result.families[0].root.id).toBe('root');
      expect(result.standalones).toHaveLength(1);
      expect(result.standalones[0].id).toBe('solo');
    });
  });
});
