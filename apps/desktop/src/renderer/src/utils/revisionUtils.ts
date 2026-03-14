import { logger } from './logger';
import type { ShopOrderItem, ShopOrderSection, ItemChange, ChangeType } from '../types/shopOrder';

/**
 * Snapshot of project state for revision comparison
 */
export interface ProjectSnapshot {
  items: ShopOrderItem[];
  sections: ShopOrderSection[];
  timestamp: number;
}

/**
 * Compare two snapshots and detect changes
 */
export function detectChanges(
  previousSnapshot: ProjectSnapshot,
  currentSnapshot: ProjectSnapshot,
  sectionsMap: Map<string, ShopOrderSection>,
): ItemChange[] {
  const changes: ItemChange[] = [];

  const prevItemsMap = new Map(previousSnapshot.items.map((item) => [item.id, item]));
  const currItemsMap = new Map(currentSnapshot.items.map((item) => [item.id, item]));

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
        },
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
        },
      });
    } else {
      // Check for modifications
      const modifications: Partial<ShopOrderItem> = {};
      const oldValues: Partial<ShopOrderItem> = {};

      // Compare relevant fields
      const fieldsToCompare: (keyof ShopOrderItem)[] = [
        'description',
        'active_qty',
        'spare_qty',
        'venue_qty',
        'weight',
        'power',
        'notes',
      ];

      for (const field of fieldsToCompare) {
        if (prevItem[field] !== currItem[field]) {
          (modifications as ShopOrderItem)[field] = currItem[field];
          (oldValues as ShopOrderItem)[field] = prevItem[field];
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
          new_values: modifications,
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
  items: ShopOrderItem[],
  sections: ShopOrderSection[],
): ProjectSnapshot {
  return {
    items: items.map((item) => ({ ...item })), // Deep copy
    sections: sections.map((section) => ({ ...section })), // Deep copy
    timestamp: Date.now(),
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
    additions: changes.filter((c) => c.change_type === 'addition').length,
    deletions: changes.filter((c) => c.change_type === 'deletion').length,
    modifications: changes.filter((c) => c.change_type === 'modification').length,
  };
}

/**
 * Format a change for display
 */
export function formatChange(change: ItemChange): string {
  const symbol =
    change.change_type === 'addition' ? '+' : change.change_type === 'deletion' ? '−' : '~';

  let details = '';
  if (change.change_type === 'addition' && change.new_values) {
    details = ` (${change.new_values.active_qty || 0}/${change.new_values.spare_qty || 0})`;
  } else if (change.change_type === 'deletion' && change.old_values) {
    details = ` (${change.old_values.active_qty || 0}/${change.old_values.spare_qty || 0})`;
  } else if (change.change_type === 'modification') {
    const mods: string[] = [];
    if (change.old_values && change.new_values) {
      for (const key of Object.keys(change.new_values) as Array<keyof ShopOrderItem>) {
        mods.push(`${key}: ${change.old_values[key]} → ${change.new_values[key]}`);
      }
    }
    details = mods.length > 0 ? ` (${mods.join(', ')})` : '';
  }

  return `${symbol} ${change.description}${details}`;
}

/**
 * ============================================
 * NEW: Table-based Revision Utilities
 * ============================================
 */

import type { RevisionQuantities, SpareSnapshot } from '../types/shopOrder';

/**
 * Parse revision quantities from JSON string
 */
export function parseRevisionQuantities(jsonString?: string): RevisionQuantities {
  if (!jsonString) return {};
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.error('Failed to parse revision_quantities:', error);
    return {};
  }
}

/**
 * Stringify revision quantities to JSON
 */
export function stringifyRevisionQuantities(quantities: RevisionQuantities): string {
  return JSON.stringify(quantities);
}

/**
 * Get active quantity for a specific revision
 */
export function getRevisionQuantity(item: ShopOrderItem, revisionNumber: number): number {
  const quantities = parseRevisionQuantities(item.revision_quantities);
  return quantities[revisionNumber] || 0;
}

/**
 * Set active quantity for a specific revision
 */
export function setRevisionQuantity(
  item: ShopOrderItem,
  revisionNumber: number,
  quantity: number,
): ShopOrderItem {
  const quantities = parseRevisionQuantities(item.revision_quantities);
  quantities[revisionNumber] = quantity;
  return {
    ...item,
    revision_quantities: stringifyRevisionQuantities(quantities),
  };
}

/**
 * Get all revision numbers for an item
 */
export function getItemRevisions(item: ShopOrderItem): number[] {
  const quantities = parseRevisionQuantities(item.revision_quantities);
  return Object.keys(quantities)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Calculate total quantity (max of all revisions + spare)
 */
export function calculateTotalQuantity(item: ShopOrderItem): number {
  const quantities = parseRevisionQuantities(item.revision_quantities);
  const maxActive = Math.max(...Object.values(quantities), 0);
  return maxActive + (item.spare_qty || 0);
}

/**
 * Calculate rental quantity (total - venue)
 */
export function calculateRentalQuantity(item: ShopOrderItem): number {
  const total = calculateTotalQuantity(item);
  return total - (item.venue_qty || 0);
}

/**
 * Detect changes between two revisions using revision_quantities
 */
export function detectRevisionChanges(
  items: ShopOrderItem[],
  fromRevision: number,
  toRevision: number,
  previousSpareSnapshot?: SpareSnapshot,
): ItemChange[] {
  const changes: ItemChange[] = [];

  for (const item of items) {
    const quantities = parseRevisionQuantities(item.revision_quantities);
    const prevActive = quantities[fromRevision] || 0;
    const currActive = quantities[toRevision] || 0;

    // Get spare quantities
    const prevSpare = previousSpareSnapshot?.[item.id] ?? item.spare_qty;
    const currSpare = item.spare_qty;

    // Determine change type
    if (prevActive === 0 && currActive > 0) {
      // Addition
      changes.push({
        item_id: item.id,
        change_type: 'addition',
        description: item.description,
        new_values: {
          active_qty: currActive,
          spare_qty: currSpare,
          venue_qty: item.venue_qty,
        },
      });
    } else if (prevActive > 0 && currActive === 0) {
      // Deletion
      changes.push({
        item_id: item.id,
        change_type: 'deletion',
        description: item.description,
        old_values: {
          active_qty: prevActive,
          spare_qty: prevSpare,
          venue_qty: item.venue_qty,
        },
      });
    } else if (prevActive !== currActive || prevSpare !== currSpare) {
      // Modification
      changes.push({
        item_id: item.id,
        change_type: 'modification',
        description: item.description,
        old_values: {
          active_qty: prevActive,
          spare_qty: prevSpare,
        },
        new_values: {
          active_qty: currActive,
          spare_qty: currSpare,
        },
      });
    }
  }

  return changes;
}

/**
 * Create spare snapshot for a revision
 */
export function createSpareSnapshot(items: ShopOrderItem[]): SpareSnapshot {
  const snapshot: SpareSnapshot = {};
  for (const item of items) {
    snapshot[item.id] = item.spare_qty || 0;
  }
  return snapshot;
}

/**
 * Parse spare snapshot from JSON string
 */
export function parseSpareSnapshot(jsonString?: string): SpareSnapshot {
  if (!jsonString) return {};
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.error('Failed to parse spare_snapshot:', error);
    return {};
  }
}

/**
 * Get DELTA indicator for print view (+/-/~)
 */
export function getDeltaIndicator(
  item: ShopOrderItem,
  currentRevision: number,
  previousRevision?: number,
): string {
  if (previousRevision === undefined || currentRevision === 0) {
    return ''; // No delta for revision 0 or if no previous revision
  }

  const quantities = parseRevisionQuantities(item.revision_quantities);
  const prevQty = quantities[previousRevision] || 0;
  const currQty = quantities[currentRevision] || 0;

  if (prevQty === 0 && currQty > 0) return '+';
  if (prevQty > 0 && currQty === 0) return '−';
  if (prevQty !== currQty) return '~';
  return '';
}
