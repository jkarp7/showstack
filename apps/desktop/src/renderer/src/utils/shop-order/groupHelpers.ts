/**
 * Group Helpers for Shop Order
 *
 * Generates shop order sections from Smart Groups. One section is created per
 * group; equipment is rolled up by fixture type into line items.
 *
 * Note mapping:
 *   group.shop_notes  → section.notes  (section-level annotation for the shop)
 *   fixture.notes     → item.notes     (joined per type; line-item annotation)
 */

import { getGroupMembers } from '../groupMembership';
import type { FixtureGroup } from '../../types/group';
import type { Fixture } from '../../types';

export interface GenerateFromGroupsResult {
  sectionsCreated: number;
  itemsCreated: number;
  skippedEmpty: number;
}

/**
 * Create one shop order section per group, with equipment rolled up by
 * fixture type. Groups with no members are skipped.
 *
 * Uses the IPC API directly (not the store) so the section ID is available
 * for subsequent item creation. Callers should reload the project afterward.
 */
export async function generateSectionsFromGroups(
  prepProjectId: string,
  groups: FixtureGroup[],
  allFixtures: Fixture[],
  pinsByGroup: Record<string, string[]>,
): Promise<GenerateFromGroupsResult> {
  let sectionsCreated = 0;
  let itemsCreated = 0;
  let skippedEmpty = 0;

  for (const group of groups) {
    const members = getGroupMembers(group, allFixtures, pinsByGroup[group.id] ?? []);

    if (members.length === 0) {
      skippedEmpty++;
      continue;
    }

    // One section per group — shop_notes maps to section.notes
    const section = await window.api.prep.sections.create({
      prep_project_id: prepProjectId,
      name: group.name,
      notes: group.shop_notes ?? '',
      sort_order: 9999, // placed at end; user can reorder
    });
    sectionsCreated++;

    // Quantity rollup by fixture type
    const byType = new Map<string, { count: number; notesList: string[] }>();
    for (const fixture of members) {
      const type = fixture.type || 'Unknown';
      if (!byType.has(type)) byType.set(type, { count: 0, notesList: [] });
      const entry = byType.get(type)!;
      entry.count++;
      if (fixture.notes) entry.notesList.push(fixture.notes);
    }

    let sortOrder = 0;
    for (const [type, { count, notesList }] of byType) {
      const notes = notesList.join('; ') || undefined;
      await window.api.prep.items.create({
        section_id: section.id,
        description: type,
        active_qty: count,
        spare_qty: 0,
        venue_qty: 0,
        ...(notes ? { notes } : {}),
        sort_order: sortOrder++,
      });
      itemsCreated++;
    }
  }

  return { sectionsCreated, itemsCreated, skippedEmpty };
}
