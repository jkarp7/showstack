import { describe, it, expect } from 'vitest';
import {
  parseRevisionQuantities,
  stringifyRevisionQuantities,
  getRevisionQuantity,
  setRevisionQuantity,
  getItemRevisions,
  calculateTotalQuantity,
  calculateRentalQuantity,
  detectRevisionChanges,
  createSpareSnapshot,
  parseSpareSnapshot,
  getDeltaIndicator,
} from '../revisionUtils';
import type { PrepEquipmentItem, RevisionQuantities, SpareSnapshot } from '../../types/prep';

/**
 * Revision Utilities Tests
 *
 * Target: 80%+ coverage
 * Tests table-based revision quantity tracking utilities
 */

describe('revisionUtils - Table-Based Revision Tracking', () => {
  // Helper to create a mock PrepEquipmentItem
  const createMockItem = (overrides?: Partial<PrepEquipmentItem>): PrepEquipmentItem => ({
    id: 'item-1',
    section_id: 'section-1',
    description: 'LED Par 64',
    active_qty: 10,
    spare_qty: 2,
    venue_qty: 0,
    total_qty: 12,
    venue_active: 0,
    venue_spare: 0,
    sort_order: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
    ...overrides,
  });

  describe('parseRevisionQuantities', () => {
    it('should parse valid JSON string', () => {
      const json = '{"0":10,"1":12,"2":8}';
      const result = parseRevisionQuantities(json);

      expect(result).toEqual({
        0: 10,
        1: 12,
        2: 8,
      });
    });

    it('should return empty object for undefined', () => {
      const result = parseRevisionQuantities(undefined);
      expect(result).toEqual({});
    });

    it('should return empty object for invalid JSON', () => {
      const result = parseRevisionQuantities('invalid json');
      expect(result).toEqual({});
    });

    it('should return empty object for empty string', () => {
      const result = parseRevisionQuantities('');
      expect(result).toEqual({});
    });
  });

  describe('stringifyRevisionQuantities', () => {
    it('should stringify quantities object', () => {
      const quantities: RevisionQuantities = {
        0: 10,
        1: 12,
        2: 8,
      };

      const result = stringifyRevisionQuantities(quantities);
      expect(result).toBe('{"0":10,"1":12,"2":8}');
    });

    it('should stringify empty object', () => {
      const result = stringifyRevisionQuantities({});
      expect(result).toBe('{}');
    });
  });

  describe('getRevisionQuantity', () => {
    it('should get quantity for existing revision', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10,"1":12,"2":8}',
      });

      expect(getRevisionQuantity(item, 0)).toBe(10);
      expect(getRevisionQuantity(item, 1)).toBe(12);
      expect(getRevisionQuantity(item, 2)).toBe(8);
    });

    it('should return 0 for non-existent revision', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10}',
      });

      expect(getRevisionQuantity(item, 5)).toBe(0);
    });

    it('should return 0 for item without revision_quantities', () => {
      const item = createMockItem();
      expect(getRevisionQuantity(item, 0)).toBe(0);
    });
  });

  describe('setRevisionQuantity', () => {
    it('should set quantity for new revision', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10}',
      });

      const updated = setRevisionQuantity(item, 1, 12);

      expect(updated.revision_quantities).toBe('{"0":10,"1":12}');
      expect(updated.id).toBe(item.id); // Original item unchanged
    });

    it('should update existing revision quantity', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10,"1":12}',
      });

      const updated = setRevisionQuantity(item, 1, 15);

      expect(updated.revision_quantities).toBe('{"0":10,"1":15}');
    });

    it('should initialize revision_quantities if missing', () => {
      const item = createMockItem();
      const updated = setRevisionQuantity(item, 0, 10);

      expect(updated.revision_quantities).toBe('{"0":10}');
    });
  });

  describe('getItemRevisions', () => {
    it('should return sorted list of revision numbers', () => {
      const item = createMockItem({
        revision_quantities: '{"2":8,"0":10,"1":12}',
      });

      const revisions = getItemRevisions(item);
      expect(revisions).toEqual([0, 1, 2]);
    });

    it('should return empty array for item without revisions', () => {
      const item = createMockItem();
      const revisions = getItemRevisions(item);

      expect(revisions).toEqual([]);
    });
  });

  describe('calculateTotalQuantity', () => {
    it('should calculate max active + spare', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10,"1":15,"2":12}',
        spare_qty: 3,
      });

      const total = calculateTotalQuantity(item);
      expect(total).toBe(18); // max(10,15,12) + 3
    });

    it('should handle item with no revisions', () => {
      const item = createMockItem({
        spare_qty: 2,
      });

      const total = calculateTotalQuantity(item);
      expect(total).toBe(2); // 0 + 2
    });

    it('should handle item with zero spare', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10}',
        spare_qty: 0,
      });

      const total = calculateTotalQuantity(item);
      expect(total).toBe(10);
    });
  });

  describe('calculateRentalQuantity', () => {
    it('should calculate total - venue', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10,"1":15}',
        spare_qty: 3,
        venue_qty: 5,
      });

      const rental = calculateRentalQuantity(item);
      expect(rental).toBe(13); // (15 + 3) - 5
    });

    it('should handle zero venue quantity', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10}',
        spare_qty: 2,
        venue_qty: 0,
      });

      const rental = calculateRentalQuantity(item);
      expect(rental).toBe(12);
    });
  });

  describe('detectRevisionChanges', () => {
    const item1 = createMockItem({
      id: 'item-1',
      description: 'LED Par 64',
      revision_quantities: '{"0":0,"1":10}', // Added in rev 1
      spare_qty: 2,
      venue_qty: 0,
    });

    const item2 = createMockItem({
      id: 'item-2',
      description: 'MAC Aura',
      revision_quantities: '{"0":8,"1":12}', // Modified in rev 1
      spare_qty: 2,
      venue_qty: 0,
    });

    const item3 = createMockItem({
      id: 'item-3',
      description: 'Source Four',
      revision_quantities: '{"0":10,"1":0}', // Deleted in rev 1
      spare_qty: 2,
      venue_qty: 0,
    });

    it('should detect additions', () => {
      const changes = detectRevisionChanges([item1], 0, 1);

      expect(changes).toHaveLength(1);
      expect(changes[0].change_type).toBe('addition');
      expect(changes[0].item_id).toBe('item-1');
      expect(changes[0].new_values?.active_qty).toBe(10);
    });

    it('should detect modifications', () => {
      const changes = detectRevisionChanges([item2], 0, 1);

      expect(changes).toHaveLength(1);
      expect(changes[0].change_type).toBe('modification');
      expect(changes[0].item_id).toBe('item-2');
      expect(changes[0].old_values?.active_qty).toBe(8);
      expect(changes[0].new_values?.active_qty).toBe(12);
    });

    it('should detect deletions', () => {
      const changes = detectRevisionChanges([item3], 0, 1);

      expect(changes).toHaveLength(1);
      expect(changes[0].change_type).toBe('deletion');
      expect(changes[0].item_id).toBe('item-3');
      expect(changes[0].old_values?.active_qty).toBe(10);
    });

    it('should detect spare quantity changes', () => {
      const itemWithSpareChange = createMockItem({
        id: 'item-4',
        revision_quantities: '{"0":10,"1":10}', // Active unchanged
        spare_qty: 5, // Changed from 2 to 5
      });

      const spareSnapshot: SpareSnapshot = {
        'item-4': 2, // Previous spare value
      };

      const changes = detectRevisionChanges([itemWithSpareChange], 0, 1, spareSnapshot);

      expect(changes).toHaveLength(1);
      expect(changes[0].change_type).toBe('modification');
      expect(changes[0].old_values?.spare_qty).toBe(2);
      expect(changes[0].new_values?.spare_qty).toBe(5);
    });

    it('should return empty array when no changes', () => {
      const unchangedItem = createMockItem({
        revision_quantities: '{"0":10,"1":10}',
        spare_qty: 2,
      });

      const spareSnapshot: SpareSnapshot = {
        [unchangedItem.id]: 2,
      };

      const changes = detectRevisionChanges([unchangedItem], 0, 1, spareSnapshot);
      expect(changes).toEqual([]);
    });
  });

  describe('createSpareSnapshot', () => {
    it('should create snapshot of spare quantities', () => {
      const items = [
        createMockItem({ id: 'item-1', spare_qty: 2 }),
        createMockItem({ id: 'item-2', spare_qty: 3 }),
        createMockItem({ id: 'item-3', spare_qty: 0 }),
      ];

      const snapshot = createSpareSnapshot(items);

      expect(snapshot).toEqual({
        'item-1': 2,
        'item-2': 3,
        'item-3': 0,
      });
    });

    it('should handle empty items array', () => {
      const snapshot = createSpareSnapshot([]);
      expect(snapshot).toEqual({});
    });
  });

  describe('parseSpareSnapshot', () => {
    it('should parse valid JSON string', () => {
      const json = '{"item-1":2,"item-2":3}';
      const result = parseSpareSnapshot(json);

      expect(result).toEqual({
        'item-1': 2,
        'item-2': 3,
      });
    });

    it('should return empty object for undefined', () => {
      const result = parseSpareSnapshot(undefined);
      expect(result).toEqual({});
    });

    it('should return empty object for invalid JSON', () => {
      const result = parseSpareSnapshot('invalid');
      expect(result).toEqual({});
    });
  });

  describe('getDeltaIndicator', () => {
    it('should return "+" for additions', () => {
      const item = createMockItem({
        revision_quantities: '{"0":0,"1":10}',
      });

      const indicator = getDeltaIndicator(item, 1, 0);
      expect(indicator).toBe('+');
    });

    it('should return "−" for deletions', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10,"1":0}',
      });

      const indicator = getDeltaIndicator(item, 1, 0);
      expect(indicator).toBe('−');
    });

    it('should return "~" for modifications', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10,"1":12}',
      });

      const indicator = getDeltaIndicator(item, 1, 0);
      expect(indicator).toBe('~');
    });

    it('should return empty string for no change', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10,"1":10}',
      });

      const indicator = getDeltaIndicator(item, 1, 0);
      expect(indicator).toBe('');
    });

    it('should return empty string for revision 0', () => {
      const item = createMockItem({
        revision_quantities: '{"0":10}',
      });

      const indicator = getDeltaIndicator(item, 0);
      expect(indicator).toBe('');
    });

    it('should return empty string when no previous revision', () => {
      const item = createMockItem({
        revision_quantities: '{"1":10}',
      });

      const indicator = getDeltaIndicator(item, 1, undefined);
      expect(indicator).toBe('');
    });
  });
});
