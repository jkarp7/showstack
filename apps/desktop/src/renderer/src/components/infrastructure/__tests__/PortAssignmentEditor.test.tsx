import { describe, it, expect } from 'vitest';
import { PortAssignment } from '../../../types/infrastructure';

/**
 * Tests for Bug Fix #2: Logic Error in PortAssignmentEditor.tsx
 * Issue: getLinkType() incorrectly detected link types for empty string values
 * Fix: Changed from truthy checks to `!== undefined` checks for property existence
 */
describe('PortAssignmentEditor - getLinkType logic', () => {
  /**
   * Helper function that mimics the getLinkType logic from PortAssignmentEditor
   * This tests the logic independently of the React component
   */
  const getLinkType = (pa: PortAssignment): 'none' | 'fixture' | 'equipment' | 'text' => {
    // Check for property existence (not truthiness) to detect link mode
    // Empty string "" means "mode selected but no item chosen yet"
    if (pa.linked_fixture_id !== undefined) return 'fixture';
    if (pa.linked_equipment_id !== undefined) return 'equipment';
    if (pa.connected_to !== undefined) return 'text';
    return 'none';
  };

  describe('Fixture linking', () => {
    it('should detect fixture mode when linked_fixture_id is set to empty string', () => {
      const port: PortAssignment = {
        port: 1,
        linked_fixture_id: '', // User selected fixture mode but hasn't picked one yet
      };

      const result = getLinkType(port);
      expect(result).toBe('fixture');
    });

    it('should detect fixture mode when linked_fixture_id has a value', () => {
      const port: PortAssignment = {
        port: 1,
        linked_fixture_id: 'fixture-123',
      };

      const result = getLinkType(port);
      expect(result).toBe('fixture');
    });

    it('should detect none when linked_fixture_id is undefined', () => {
      const port: PortAssignment = {
        port: 1,
        linked_fixture_id: undefined,
      };

      const result = getLinkType(port);
      expect(result).toBe('none');
    });

    it('should detect none when linked_fixture_id is not present', () => {
      const port: PortAssignment = {
        port: 1,
      };

      const result = getLinkType(port);
      expect(result).toBe('none');
    });
  });

  describe('Equipment linking', () => {
    it('should detect equipment mode when linked_equipment_id is set to empty string', () => {
      const port: PortAssignment = {
        port: 1,
        linked_equipment_id: '', // User selected equipment mode but hasn't picked one yet
      };

      const result = getLinkType(port);
      expect(result).toBe('equipment');
    });

    it('should detect equipment mode when linked_equipment_id has a value', () => {
      const port: PortAssignment = {
        port: 1,
        linked_equipment_id: 'equipment-456',
      };

      const result = getLinkType(port);
      expect(result).toBe('equipment');
    });
  });

  describe('Text (legacy) linking', () => {
    it('should detect text mode when connected_to is set to empty string', () => {
      const port: PortAssignment = {
        port: 1,
        connected_to: '',
      };

      const result = getLinkType(port);
      expect(result).toBe('text');
    });

    it('should detect text mode when connected_to has a value', () => {
      const port: PortAssignment = {
        port: 1,
        connected_to: 'FOH Console Port 3',
      };

      const result = getLinkType(port);
      expect(result).toBe('text');
    });
  });

  describe('Priority handling', () => {
    it('should prioritize fixture over equipment when both are set', () => {
      const port: PortAssignment = {
        port: 1,
        linked_fixture_id: 'fixture-123',
        linked_equipment_id: 'equipment-456',
      };

      const result = getLinkType(port);
      expect(result).toBe('fixture');
    });

    it('should prioritize equipment over text when both are set', () => {
      const port: PortAssignment = {
        port: 1,
        linked_equipment_id: 'equipment-456',
        connected_to: 'Some text',
      };

      const result = getLinkType(port);
      expect(result).toBe('equipment');
    });

    it('should prioritize fixture over text when both are set', () => {
      const port: PortAssignment = {
        port: 1,
        linked_fixture_id: 'fixture-123',
        connected_to: 'Some text',
      };

      const result = getLinkType(port);
      expect(result).toBe('fixture');
    });
  });

  describe('Edge cases', () => {
    it('should handle port with only port number', () => {
      const port: PortAssignment = {
        port: 1,
      };

      const result = getLinkType(port);
      expect(result).toBe('none');
    });

    it('should handle port with other properties but no link fields', () => {
      const port: PortAssignment = {
        port: 1,
        type: 'ethernet',
        vlan: 100,
        status: 'active',
        notes: 'Test port',
      };

      const result = getLinkType(port);
      expect(result).toBe('none');
    });
  });
});
