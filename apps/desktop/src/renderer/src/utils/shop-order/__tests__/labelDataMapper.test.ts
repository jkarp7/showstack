import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapFixtureToLabelData,
  mapFixturesToLabelData,
  getLabelDataForFixtures,
  getAllLabelDataForProject,
  createSampleLabelData,
  getAvailableLabelFields,
  type LabelData,
} from '../labelDataMapper';
import type { Fixture } from '../../../types';
import { logger } from '../../logger';

// Mock logger
vi.mock('../../logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

/**
 * Comprehensive tests for label data mapper
 * Target: 75% coverage with 12-15 test cases
 */

// Mock fixture data
const mockFixture: Fixture = {
  id: 'fixture-1',
  project_id: 'project-1',
  position: '1st Electric',
  unit_number: 12,
  type: 'Source Four 19°',
  manufacturer: 'ETC',
  model: 'S4-19',
  purpose: 'DS Special',
  mark: 'A',
  channel: '145',
  universe: 1,
  dmx_address: 234,
  mode: 'Direct',
  console_level: 'Full',
  dimmer: 'R23',
  circuit: 'C-145',
  circuit_number: '145',
  phase: 'A',
  wattage: 750,
  amperage: 6.25,
  color: 'R02',
  color_frame: '7.5"',
  gobo: 'R77729',
  gobo_size: 'B',
  template_size: 'A',
  accessories: ['Top Hat', 'Barn Doors'],
  cable: "Soco 50'",
  data_cable: "DMX 25'",
  location: 'Stage Right',
  system: 'FOH',
  status: 'Hung',
  notes: 'Focus to DSC',
  created_at: Date.now(),
  updated_at: Date.now(),
};

describe('Label Data Mapper', () => {
  describe('mapFixtureToLabelData', () => {
    it('should map all fixture fields to label data', () => {
      const result = mapFixtureToLabelData(mockFixture);

      expect(result.position).toBe('1st Electric');
      expect(result.unitNumber).toBe('12');
      expect(result.type).toBe('Source Four 19°');
      expect(result.manufacturer).toBe('ETC');
      expect(result.model).toBe('S4-19');
      expect(result.purpose).toBe('DS Special');
      expect(result.mark).toBe('A');
    });

    it('should convert number fields to strings', () => {
      const result = mapFixtureToLabelData(mockFixture);

      expect(result.unitNumber).toBe('12'); // number → string
      expect(result.universe).toBe('1');
      expect(result.dmxAddress).toBe('234');
      expect(result.wattage).toBe('750');
      expect(result.amperage).toBe('6.25');
    });

    it('should create computed address field from universe and dmx_address', () => {
      const result = mapFixtureToLabelData(mockFixture);

      expect(result.address).toBe('1/234');
    });

    it('should use address field if provided directly', () => {
      const fixtureWithAddress: Fixture = {
        ...mockFixture,
        address: '2/512',
      };

      const result = mapFixtureToLabelData(fixtureWithAddress);
      expect(result.address).toBe('2/512');
    });

    it('should convert accessories array to comma-separated string', () => {
      const result = mapFixtureToLabelData(mockFixture);

      expect(result.accessories).toBe('Top Hat, Barn Doors');
    });

    it('should handle empty accessories array', () => {
      const fixtureNoAccessories: Fixture = {
        ...mockFixture,
        accessories: [],
      };

      const result = mapFixtureToLabelData(fixtureNoAccessories);
      expect(result.accessories).toBe('');
    });

    it('should handle undefined/null fields gracefully', () => {
      const minimalFixture: Partial<Fixture> = {
        id: 'fixture-2',
        project_id: 'project-1',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const result = mapFixtureToLabelData(minimalFixture as Fixture);

      // All fields should default to empty strings
      expect(result.position).toBe('');
      expect(result.unitNumber).toBe('');
      expect(result.type).toBe('');
      expect(result.manufacturer).toBe('');
      expect(result.wattage).toBe('');
      expect(result.accessories).toBe('');
    });

    it('should handle missing universe/dmx_address for address field', () => {
      const fixtureNoAddress: Partial<Fixture> = {
        ...mockFixture,
        universe: undefined,
        dmx_address: undefined,
        address: undefined,
      };

      const result = mapFixtureToLabelData(fixtureNoAddress as Fixture);
      expect(result.address).toBe('');
    });

    it('should handle partial universe/dmx_address data', () => {
      const fixturePartialAddress: Partial<Fixture> = {
        ...mockFixture,
        universe: 1,
        dmx_address: undefined,
      };

      const result = mapFixtureToLabelData(fixturePartialAddress as Fixture);
      // Only computed if both are present
      expect(result.address).toBe('');
      expect(result.universe).toBe('1');
      expect(result.dmxAddress).toBe('');
    });

    it('should handle unit vs unit_number field aliases', () => {
      const fixtureWithUnit: any = {
        ...mockFixture,
        unit_number: undefined,
        unit: 42, // Alternative field name
      };

      const result = mapFixtureToLabelData(fixtureWithUnit);
      expect(result.unitNumber).toBe('42');
    });

    it('should initialize custom fields as empty strings', () => {
      const result = mapFixtureToLabelData(mockFixture);

      expect(result.custom1).toBe('');
      expect(result.custom2).toBe('');
      expect(result.custom3).toBe('');
      expect(result.custom4).toBe('');
    });
  });

  describe('mapFixturesToLabelData', () => {
    it('should map multiple fixtures to label data array', () => {
      const fixture2: Fixture = {
        ...mockFixture,
        id: 'fixture-2',
        position: '2nd Electric',
        unit_number: 24,
      };

      const result = mapFixturesToLabelData([mockFixture, fixture2]);

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe('1st Electric');
      expect(result[0].unitNumber).toBe('12');
      expect(result[1].position).toBe('2nd Electric');
      expect(result[1].unitNumber).toBe('24');
    });

    it('should handle empty fixture array', () => {
      const result = mapFixturesToLabelData([]);
      expect(result).toEqual([]);
    });

    it('should handle array with mixed valid/minimal fixtures', () => {
      const minimalFixture: Partial<Fixture> = {
        id: 'fixture-3',
        project_id: 'project-1',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const result = mapFixturesToLabelData([mockFixture, minimalFixture as Fixture]);

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe('1st Electric');
      expect(result[1].position).toBe('');
    });
  });

  describe('getLabelDataForFixtures', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch and map selected fixtures by IDs', async () => {
      const mockFixtures = [
        mockFixture,
        { ...mockFixture, id: 'fixture-2', position: '2nd Electric' },
        { ...mockFixture, id: 'fixture-3', position: '3rd Electric' },
      ];

      vi.spyOn(window.api.fixtures, 'getByProject').mockResolvedValue(mockFixtures as any);

      const result = await getLabelDataForFixtures(['fixture-1', 'fixture-3'], 'project-1');

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe('1st Electric');
      expect(result[1].position).toBe('3rd Electric');
    });

    it('should return empty array if no fixtures match IDs', async () => {
      vi.spyOn(window.api.fixtures, 'getByProject').mockResolvedValue([mockFixture] as any);

      const result = await getLabelDataForFixtures(['nonexistent-id'], 'project-1');

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      vi.spyOn(window.api.fixtures, 'getByProject').mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await getLabelDataForFixtures(['fixture-1'], 'project-1');

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get label data for fixtures:',
        expect.any(Error),
      );
    });
  });

  describe('getAllLabelDataForProject', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch and map all fixtures in project', async () => {
      const mockFixtures = [
        mockFixture,
        { ...mockFixture, id: 'fixture-2', position: '2nd Electric' },
      ];

      vi.spyOn(window.api.fixtures, 'getByProject').mockResolvedValue(mockFixtures as any);

      const result = await getAllLabelDataForProject('project-1');

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe('1st Electric');
      expect(result[1].position).toBe('2nd Electric');
    });

    it('should return empty array for project with no fixtures', async () => {
      vi.spyOn(window.api.fixtures, 'getByProject').mockResolvedValue([]);

      const result = await getAllLabelDataForProject('project-1');

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      vi.spyOn(window.api.fixtures, 'getByProject').mockRejectedValue(new Error('Database error'));

      const result = await getAllLabelDataForProject('project-1');

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get label data for project:',
        expect.any(Error),
      );
    });
  });

  describe('createSampleLabelData', () => {
    it('should create sample label data with all fields populated', () => {
      const sample = createSampleLabelData();

      expect(sample.position).toBe('1st Electric');
      expect(sample.unitNumber).toBe('12');
      expect(sample.type).toBe('Source Four 19°');
      expect(sample.manufacturer).toBe('ETC');
      expect(sample.channel).toBe('145');
      expect(sample.universe).toBe('1');
      expect(sample.dmxAddress).toBe('234');
      expect(sample.address).toBe('1/234');
      expect(sample.dimmer).toBe('R23');
      expect(sample.wattage).toBe('750');
      expect(sample.color).toBe('R02');
    });

    it('should return consistent sample data on multiple calls', () => {
      const sample1 = createSampleLabelData();
      const sample2 = createSampleLabelData();

      expect(sample1).toEqual(sample2);
    });
  });

  describe('getAvailableLabelFields', () => {
    it('should return all available label fields', () => {
      const fields = getAvailableLabelFields();

      expect(fields.length).toBeGreaterThan(0);
      expect(fields.length).toBe(36); // All LabelData fields (includes group)
    });

    it('should include all field categories', () => {
      const fields = getAvailableLabelFields();
      const categories = [...new Set(fields.map((f) => f.category))];

      expect(categories).toContain('Identification');
      expect(categories).toContain('Control');
      expect(categories).toContain('Power');
      expect(categories).toContain('Color & Accessories');
      expect(categories).toContain('Cables');
      expect(categories).toContain('Location');
      expect(categories).toContain('System');
      expect(categories).toContain('Custom');
    });

    it('should include position field with correct metadata', () => {
      const fields = getAvailableLabelFields();
      const positionField = fields.find((f) => f.key === 'position');

      expect(positionField).toBeDefined();
      expect(positionField?.label).toBe('Position');
      expect(positionField?.category).toBe('Identification');
    });

    it('should include address field with descriptive label', () => {
      const fields = getAvailableLabelFields();
      const addressField = fields.find((f) => f.key === 'address');

      expect(addressField).toBeDefined();
      expect(addressField?.label).toBe('Address (Universe/DMX)');
      expect(addressField?.category).toBe('Control');
    });

    it('should include all custom fields', () => {
      const fields = getAvailableLabelFields();
      const customFields = fields.filter((f) => f.category === 'Custom');

      expect(customFields).toHaveLength(4);
      expect(customFields.map((f) => f.key)).toEqual(['custom1', 'custom2', 'custom3', 'custom4']);
    });
  });

  describe('Type safety and edge cases', () => {
    it('should handle zero values correctly', () => {
      const fixtureWithZeros: Fixture = {
        ...mockFixture,
        unit_number: 0,
        universe: 0,
        dmx_address: 0,
        wattage: 0,
        amperage: 0,
      };

      const result = mapFixtureToLabelData(fixtureWithZeros);

      expect(result.unitNumber).toBe('0');
      expect(result.universe).toBe('0');
      expect(result.dmxAddress).toBe('0');
      expect(result.wattage).toBe('0');
      expect(result.amperage).toBe('0');
    });

    it('should handle very long string values', () => {
      const longString = 'A'.repeat(500);
      const fixtureWithLongStrings: Fixture = {
        ...mockFixture,
        notes: longString,
        purpose: longString,
      };

      const result = mapFixtureToLabelData(fixtureWithLongStrings);

      expect(result.notes).toBe(longString);
      expect(result.purpose).toBe(longString);
    });

    it('should handle special characters in strings', () => {
      const fixtureWithSpecialChars: Fixture = {
        ...mockFixture,
        position: '1st Electric (SL) <FOH>',
        notes: 'Focus @ 18° with "barn doors" & top-hat',
        purpose: 'Special: DS/US cross-fade',
      };

      const result = mapFixtureToLabelData(fixtureWithSpecialChars);

      expect(result.position).toBe('1st Electric (SL) <FOH>');
      expect(result.notes).toBe('Focus @ 18° with "barn doors" & top-hat');
      expect(result.purpose).toBe('Special: DS/US cross-fade');
    });
  });
});
