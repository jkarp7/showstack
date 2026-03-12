import { describe, it, expect } from 'vitest';
import {
  parseFilterDef,
  fixtureMatchesFilter,
  getGroupMembers,
  countGroupMembers,
} from '../groupMembership';
import type { GroupFilterDef } from '../../types/group';
import type { Fixture } from '../../types';

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'f-1',
    project_id: 'proj-1',
    type: 'MAC Encore',
    position: 'FOH',
    color: 'R02',
    purpose: 'Key',
    notes: '',
    ...overrides,
  } as unknown as Fixture;
}

function makeGroup(filterDef?: GroupFilterDef) {
  return {
    id: 'g-1',
    project_id: 'proj-1',
    name: 'Test',
    sort_order: 0,
    created_at: 0,
    updated_at: 0,
    filter_def: filterDef ? JSON.stringify(filterDef) : undefined,
  };
}

// ─── parseFilterDef ───────────────────────────────────────────────────────────

describe('parseFilterDef', () => {
  it('returns null for undefined', () => {
    expect(parseFilterDef(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseFilterDef('')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseFilterDef('{not json')).toBeNull();
  });

  it('parses valid JSON', () => {
    const def: GroupFilterDef = {
      mode: 'any',
      conditions: [{ field: 'type', operator: 'contains', value: 'MAC' }],
    };
    expect(parseFilterDef(JSON.stringify(def))).toEqual(def);
  });
});

// ─── fixtureMatchesFilter ─────────────────────────────────────────────────────

describe('fixtureMatchesFilter', () => {
  it('returns false for empty conditions', () => {
    const fixture = makeFixture();
    expect(fixtureMatchesFilter(fixture, { mode: 'any', conditions: [] })).toBe(false);
  });

  describe('mode=any (OR)', () => {
    const def: GroupFilterDef = {
      mode: 'any',
      conditions: [
        { field: 'type', operator: 'contains', value: 'MAC' },
        { field: 'type', operator: 'contains', value: 'Robe' },
      ],
    };

    it('matches if any condition matches', () => {
      expect(fixtureMatchesFilter(makeFixture({ type: 'MAC Encore' }), def)).toBe(true);
      expect(fixtureMatchesFilter(makeFixture({ type: 'Robe Pointe' }), def)).toBe(true);
    });

    it('does not match if no condition matches', () => {
      expect(fixtureMatchesFilter(makeFixture({ type: 'ETC Source 4' }), def)).toBe(false);
    });
  });

  describe('mode=all (AND)', () => {
    const def: GroupFilterDef = {
      mode: 'all',
      conditions: [
        { field: 'position', operator: 'starts_with', value: 'FOH' },
        { field: 'type', operator: 'contains', value: 'MAC' },
      ],
    };

    it('matches only when all conditions match', () => {
      expect(
        fixtureMatchesFilter(makeFixture({ position: 'FOH L', type: 'MAC Encore' }), def),
      ).toBe(true);
    });

    it('does not match when only one condition matches', () => {
      expect(
        fixtureMatchesFilter(makeFixture({ position: 'Balcony', type: 'MAC Encore' }), def),
      ).toBe(false);
      expect(
        fixtureMatchesFilter(makeFixture({ position: 'FOH L', type: 'ETC Source 4' }), def),
      ).toBe(false);
    });
  });

  it('handles is_empty operator', () => {
    const def: GroupFilterDef = {
      mode: 'any',
      conditions: [{ field: 'color', operator: 'is_empty', value: '' }],
    };
    expect(fixtureMatchesFilter(makeFixture({ color: '' }), def)).toBe(true);
    expect(fixtureMatchesFilter(makeFixture({ color: 'R02' }), def)).toBe(false);
  });

  it('is case-insensitive', () => {
    const def: GroupFilterDef = {
      mode: 'any',
      conditions: [{ field: 'type', operator: 'contains', value: 'mac' }],
    };
    expect(fixtureMatchesFilter(makeFixture({ type: 'MAC Encore' }), def)).toBe(true);
  });
});

// ─── getGroupMembers ──────────────────────────────────────────────────────────

describe('getGroupMembers', () => {
  const fixtures = [
    makeFixture({ id: 'f-1', type: 'MAC Encore', position: 'FOH' }),
    makeFixture({ id: 'f-2', type: 'Robe Pointe', position: 'BOH' }),
    makeFixture({ id: 'f-3', type: 'ETC Source 4', position: 'FOH' }),
  ];

  it('returns empty array when no filter and no pins', () => {
    const group = makeGroup();
    expect(getGroupMembers(group, fixtures, [])).toHaveLength(0);
  });

  it('returns filter matches', () => {
    const group = makeGroup({
      mode: 'any',
      conditions: [{ field: 'type', operator: 'contains', value: 'MAC' }],
    });
    const members = getGroupMembers(group, fixtures, []);
    expect(members.map((f) => f.id)).toEqual(['f-1']);
  });

  it('includes pinned fixtures regardless of filter', () => {
    const group = makeGroup({
      mode: 'any',
      conditions: [{ field: 'type', operator: 'contains', value: 'MAC' }],
    });
    const members = getGroupMembers(group, fixtures, ['f-3']);
    expect(members.map((f) => f.id)).toContain('f-1');
    expect(members.map((f) => f.id)).toContain('f-3');
  });

  it('includes only pins when no filter defined', () => {
    const group = makeGroup();
    const members = getGroupMembers(group, fixtures, ['f-2']);
    expect(members.map((f) => f.id)).toEqual(['f-2']);
  });

  it('does not include fixture multiple times when pinned AND matches filter', () => {
    const group = makeGroup({
      mode: 'any',
      conditions: [{ field: 'type', operator: 'contains', value: 'MAC' }],
    });
    const members = getGroupMembers(group, fixtures, ['f-1']); // f-1 matches filter AND is pinned
    const ids = members.map((f) => f.id);
    expect(ids.filter((id) => id === 'f-1')).toHaveLength(1);
  });
});

// ─── countGroupMembers ────────────────────────────────────────────────────────

describe('countGroupMembers', () => {
  it('returns the correct count', () => {
    const fixtures = [
      makeFixture({ id: 'f-1', type: 'MAC Encore' }),
      makeFixture({ id: 'f-2', type: 'MAC Viper' }),
      makeFixture({ id: 'f-3', type: 'ETC Source 4' }),
    ];
    const group = makeGroup({
      mode: 'any',
      conditions: [{ field: 'type', operator: 'contains', value: 'MAC' }],
    });
    expect(countGroupMembers(group, fixtures, [])).toBe(2);
  });
});
