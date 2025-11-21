import type { PrepEquipmentItem, PrepSection, ItemChange, ChangeType } from '../types/prep';

/**
 * Snapshot of project state for revision comparison
 */
export interface ProjectSnapshot {
  items: PrepEquipmentItem[];
  sections: PrepSection[];
  timestamp: number;
}

/**
 * Compare two snapshots and detect changes
 */
export function detectChanges(
  previousSnapshot: ProjectSnapshot,
  currentSnapshot: ProjectSnapshot,
  sectionsMap: Map<string, PrepSection>
): ItemChange[] {
  const changes: ItemChange[] = [];

  const prevItemsMap = new Map(previousSnapshot.items.map(item => [item.id, item]));
  const currItemsMap = new Map(currentSnapshot.items.map(item => [item.id, item]));

  // Detect deletions (items in previous but not in current)
  for (const [itemId, prevItem] of prevItemsMap) {
    if (!currItemsMap.has(itemId)) {
      const section = sectionsMap.get(prevItem.section_id);
      changes.push({
        item_id: itemId,
        change_type: 'deletion',
        description: prevItem.description,
        section_name: section?.name,
        old_values: {
          description: prevItem.description,
          active_qty: prevItem.active_qty,
          spare_qty: prevItem.spare_qty,
          venue_qty: prevItem.venue_qty,
        }
      });
    }
  }

  // Detect additions and modifications
  for (const [itemId, currItem] of currItemsMap) {
    const prevItem = prevItemsMap.get(itemId);
    const section = sectionsMap.get(currItem.section_id);

    if (!prevItem) {
      // Addition: item in current but not in previous
      changes.push({
        item_id: itemId,
        change_type: 'addition',
        description: currItem.description,
        section_name: section?.name,
        new_values: {
          description: currItem.description,
          active_qty: currItem.active_qty,
          spare_qty: currItem.spare_qty,
          venue_qty: currItem.venue_qty,
        }
      });
    } else {
      // Check for modifications
      const modifications: Partial<PrepEquipmentItem> = {};
      const oldValues: Partial<PrepEquipmentItem> = {};

      // Compare relevant fields
      const fieldsToCompare: (keyof PrepEquipmentItem)[] = [
        'description',
        'active_qty',
        'spare_qty',
        'venue_qty',
        'weight',
        'power',
        'notes'
      ];

      for (const field of fieldsToCompare) {
        if (prevItem[field] !== currItem[field]) {
          modifications[field] = currItem[field] as any;
          oldValues[field] = prevItem[field] as any;
        }
      }

      // Check if section changed
      if (prevItem.section_id !== currItem.section_id) {
        const oldSection = sectionsMap.get(prevItem.section_id);
        const newSection = sectionsMap.get(currItem.section_id);
        modifications.section_id = currItem.section_id;
        oldValues.section_id = prevItem.section_id;
      }

      if (Object.keys(modifications).length > 0) {
        changes.push({
          item_id: itemId,
          change_type: 'modification',
          description: currItem.description,
          section_name: section?.name,
          old_values: oldValues,
          new_values: modifications
        });
      }
    }
  }

  return changes;
}

/**
 * Create a snapshot of current project state
 */
export function createSnapshot(
  items: PrepEquipmentItem[],
  sections: PrepSection[]
): ProjectSnapshot {
  return {
    items: items.map(item => ({ ...item })), // Deep copy
    sections: sections.map(section => ({ ...section })), // Deep copy
    timestamp: Date.now()
  };
}

/**
 * Get a summary of changes
 */
export function getChangeSummary(changes: ItemChange[]): {
  additions: number;
  deletions: number;
  modifications: number;
} {
  return {
    additions: changes.filter(c => c.change_type === 'addition').length,
    deletions: changes.filter(c => c.change_type === 'deletion').length,
    modifications: changes.filter(c => c.change_type === 'modification').length,
  };
}

/**
 * Format a change for display
 */
export function formatChange(change: ItemChange): string {
  const symbol = change.change_type === 'addition' ? '+' :
                 change.change_type === 'deletion' ? '−' : '~';

  let details = '';
  if (change.change_type === 'addition' && change.new_values) {
    details = ` (${change.new_values.active_qty || 0}/${change.new_values.spare_qty || 0})`;
  } else if (change.change_type === 'deletion' && change.old_values) {
    details = ` (${change.old_values.active_qty || 0}/${change.old_values.spare_qty || 0})`;
  } else if (change.change_type === 'modification') {
    const mods: string[] = [];
    if (change.old_values && change.new_values) {
      for (const key of Object.keys(change.new_values)) {
        mods.push(`${key}: ${(change.old_values as any)[key]} → ${(change.new_values as any)[key]}`);
      }
    }
    details = mods.length > 0 ? ` (${mods.join(', ')})` : '';
  }

  return `${symbol} ${change.description}${details}`;
}
