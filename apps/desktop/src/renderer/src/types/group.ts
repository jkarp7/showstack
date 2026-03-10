import type { HighlightConditionOperator } from './highlighting';
import type { Fixture } from './index';

// ─── Filter Definition ────────────────────────────────────────────────────────

/** A single field/operator/value condition */
export interface GroupFilterCondition {
  field: keyof Fixture;
  operator: HighlightConditionOperator;
  value: string;
}

/**
 * Stored as JSON in `fixture_groups.filter_def`.
 * mode='all' → AND (fixture must match every condition)
 * mode='any' → OR  (fixture must match at least one condition)
 */
export interface GroupFilterDef {
  mode: 'all' | 'any';
  conditions: GroupFilterCondition[];
}

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface FixtureGroup {
  id: string;
  project_id: string;
  name: string;
  color?: string;
  notes?: string;
  shop_notes?: string;
  filter_def?: string; // JSON-serialised GroupFilterDef
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface FixtureGroupPin {
  fixture_id: string;
  group_id: string;
  created_at: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface GroupStore {
  groups: FixtureGroup[];
  /** Flat list of all fixture-group pins for the current project. */
  allPins: { fixture_id: string; group_id: string }[];
  /** Pin lookup by group ID → fixture IDs. Derived from allPins. */
  pinsByGroup: Record<string, string[]>;
  loading: boolean;
  currentProjectId: string | null;

  loadGroups: (projectId: string) => Promise<void>;
  createGroup: (data: Partial<FixtureGroup>, projectId: string) => Promise<FixtureGroup>;
  updateGroup: (id: string, updates: Partial<FixtureGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;

  addPin: (groupId: string, fixtureId: string) => Promise<void>;
  removePin: (groupId: string, fixtureId: string) => Promise<void>;
}
