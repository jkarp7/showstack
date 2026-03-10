import { evaluateHighlightRule } from '../types/highlighting';
import type { Fixture } from '../types';
import type { FixtureGroup, GroupFilterDef } from '../types/group';

/**
 * Parse a group's filter_def JSON, returning null if absent or malformed.
 */
export function parseFilterDef(filterDefJson?: string): GroupFilterDef | null {
  if (!filterDefJson) return null;
  try {
    return JSON.parse(filterDefJson) as GroupFilterDef;
  } catch {
    return null;
  }
}

/**
 * Evaluate whether a single fixture matches a GroupFilterDef.
 *
 * mode='all' → AND  (every condition must match)
 * mode='any' → OR   (at least one condition must match)
 * Empty conditions → no filter-based membership (fixture not included by filter alone).
 */
export function fixtureMatchesFilter(fixture: Fixture, filterDef: GroupFilterDef): boolean {
  if (filterDef.conditions.length === 0) return false;

  if (filterDef.mode === 'all') {
    return filterDef.conditions.every((cond) =>
      evaluateHighlightRule(fixture, {
        id: '',
        name: '',
        enabled: true,
        priority: 0,
        color: '',
        ...cond,
      }),
    );
  }

  return filterDef.conditions.some((cond) =>
    evaluateHighlightRule(fixture, {
      id: '',
      name: '',
      enabled: true,
      priority: 0,
      color: '',
      ...cond,
    }),
  );
}

/**
 * Compute group members from the current fixture list.
 *
 * Membership = filter matches ∪ manually pinned fixtures
 */
export function getGroupMembers(
  group: FixtureGroup,
  allFixtures: Fixture[],
  pinnedFixtureIds: string[],
): Fixture[] {
  const pinnedSet = new Set(pinnedFixtureIds);
  const filterDef = parseFilterDef(group.filter_def);

  if (!filterDef && pinnedSet.size === 0) return [];

  return allFixtures.filter((f) => {
    if (pinnedSet.has(f.id)) return true;
    if (filterDef) return fixtureMatchesFilter(f, filterDef);
    return false;
  });
}

/**
 * Count group members without allocating a new array.
 */
export function countGroupMembers(
  group: FixtureGroup,
  allFixtures: Fixture[],
  pinnedFixtureIds: string[],
): number {
  return getGroupMembers(group, allFixtures, pinnedFixtureIds).length;
}
