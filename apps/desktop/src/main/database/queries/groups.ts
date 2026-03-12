import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';

export interface FixtureGroup {
  id: string;
  project_id: string;
  name: string;
  color?: string;
  notes?: string;
  shop_notes?: string;
  filter_def?: string; // JSON string — existing filter system format
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface FixtureGroupPin {
  fixture_id: string;
  group_id: string;
  created_at: number;
}

// ─── Group CRUD ───────────────────────────────────────────────────────────────

export function getAllGroups(projectId: string): FixtureGroup[] {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT * FROM fixture_groups WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC`,
    )
    .all(projectId) as FixtureGroup[];
}

export function getGroupById(id: string): FixtureGroup | undefined {
  const db = getDatabase();
  return db.prepare(`SELECT * FROM fixture_groups WHERE id = ?`).get(id) as
    | FixtureGroup
    | undefined;
}

export function createGroup(data: Partial<FixtureGroup>, projectId: string): FixtureGroup {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  // Place new group at end of list
  const maxRow = db
    .prepare(`SELECT MAX(sort_order) as max_order FROM fixture_groups WHERE project_id = ?`)
    .get(projectId) as { max_order: number | null };
  const sort_order = (maxRow.max_order ?? -1) + 1;

  db.prepare(
    `INSERT INTO fixture_groups
       (id, project_id, name, color, notes, shop_notes, filter_def, sort_order, created_at, updated_at)
     VALUES
       (@id, @project_id, @name, @color, @notes, @shop_notes, @filter_def, @sort_order, @created_at, @updated_at)`,
  ).run({
    id,
    project_id: projectId,
    name: data.name ?? '',
    color: data.color ?? null,
    notes: data.notes ?? null,
    shop_notes: data.shop_notes ?? null,
    filter_def: data.filter_def ?? null,
    sort_order,
    created_at: now,
    updated_at: now,
  });

  saveDatabase();
  const newGroup = getGroupById(id);
  if (!newGroup) {
    throw new Error(`Failed to retrieve group with id ${id} immediately after creation.`);
  }
  return newGroup;
}

export function updateGroup(id: string, updates: Partial<FixtureGroup>): FixtureGroup {
  const db = getDatabase();
  const now = Date.now();

  const setClauses: string[] = ['updated_at = @updated_at'];
  const params: Record<string, unknown> = { id, updated_at: now };

  const allowedFields: (keyof FixtureGroup)[] = [
    'name',
    'color',
    'notes',
    'shop_notes',
    'filter_def',
    'sort_order',
  ];

  for (const field of allowedFields) {
    if (field in updates) {
      setClauses.push(`${field} = @${field}`);
      params[field] = updates[field] ?? null;
    }
  }

  db.prepare(`UPDATE fixture_groups SET ${setClauses.join(', ')} WHERE id = @id`).run(params);

  saveDatabase();
  const updatedGroup = getGroupById(id);
  if (!updatedGroup) {
    throw new Error(`Failed to retrieve group with id ${id} after update.`);
  }
  return updatedGroup;
}

export function deleteGroup(id: string): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM fixture_groups WHERE id = ?`).run(id);
  saveDatabase();
}

// ─── Pin CRUD ─────────────────────────────────────────────────────────────────

export function getPinsForGroup(groupId: string): FixtureGroupPin[] {
  const db = getDatabase();
  return db
    .prepare(`SELECT * FROM fixture_group_pins WHERE group_id = ? ORDER BY created_at ASC`)
    .all(groupId) as FixtureGroupPin[];
}

export function getPinnedFixtureIds(groupId: string): string[] {
  return getPinsForGroup(groupId).map((p) => p.fixture_id);
}

export function addPin(groupId: string, fixtureId: string): void {
  const db = getDatabase();
  db.prepare(
    `INSERT OR IGNORE INTO fixture_group_pins (fixture_id, group_id, created_at)
     VALUES (?, ?, ?)`,
  ).run(fixtureId, groupId, Date.now());
  saveDatabase();
}

export function removePin(groupId: string, fixtureId: string): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM fixture_group_pins WHERE fixture_id = ? AND group_id = ?`).run(
    fixtureId,
    groupId,
  );
  saveDatabase();
}

export function getGroupsForFixture(fixtureId: string): string[] {
  const db = getDatabase();
  const rows = db
    .prepare(`SELECT group_id FROM fixture_group_pins WHERE fixture_id = ?`)
    .all(fixtureId) as { group_id: string }[];
  return rows.map((r) => r.group_id);
}

/** All pins for every group in a project — used for bulk group indicator rendering. */
export function getAllPinsForProject(
  projectId: string,
): { fixture_id: string; group_id: string }[] {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT fgp.fixture_id, fgp.group_id
       FROM fixture_group_pins fgp
       JOIN fixture_groups fg ON fg.id = fgp.group_id
       WHERE fg.project_id = ?`,
    )
    .all(projectId) as { fixture_id: string; group_id: string }[];
}
