/**
 * Tests for FixtureService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// Mock dependencies
vi.mock('../../database/queries/fixtures', () => ({
  getAllFixtures: vi.fn(),
  createFixture: vi.fn(),
  updateFixture: vi.fn(),
  deleteFixture: vi.fn(),
  deleteMultipleFixtures: vi.fn()
}));

vi.mock('../../errors', async () => {
  const actual = await vi.importActual('../../errors');
  return {
    ...actual,
    errorHandler: {
      executeWithRetry: vi.fn((fn) => fn())
    }
  };
});

vi.mock('../../monitoring/PerformanceMonitor', () => ({
  performanceMonitor: {
    trackDatabaseQuery: vi.fn()
  }
}));

vi.mock('../../database/monitoring/DatabaseMonitor', () => ({
  databaseMonitor: {
    recordQuery: vi.fn()
  }
}));

// Import after mocking
import { FixtureService } from '../FixtureService';
import {
  getAllFixtures,
  createFixture,
  updateFixture,
  deleteFixture,
  deleteMultipleFixtures
} from '../../database/queries/fixtures';
import type { Fixture } from '../../database/queries/fixtures';

describe('FixtureService', () => {
  let service: FixtureService;

  const mockFixture: Fixture = {
    id: 'fixture-1',
    project_id: 'project-1',
    position: 'FOH',
    unit_number: 1,
    type: 'LED',
    manufacturer: 'ETC',
    model: 'Source Four',
    channel: '101',
    wattage: 750,
    status: 'active',
    notes: '',
    created_at: 1704067200000,
    updated_at: 1704067200000
  };

  const mockFixture2: Fixture = {
    id: 'fixture-2',
    project_id: 'project-1',
    position: 'BOH',
    unit_number: 2,
    type: 'Moving Light',
    manufacturer: 'Robe',
    model: 'Pointe',
    channel: '201',
    wattage: 470,
    status: 'active',
    notes: '',
    created_at: 1704067200000,
    updated_at: 1704067200000
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FixtureService();
  });

  describe('getAll', () => {
    it('should call getAllFixtures and return results', async () => {
      const fixtures = [mockFixture, mockFixture2];
      vi.mocked(getAllFixtures).mockResolvedValue(fixtures);

      const result = await service.getAll('project-1');

      expect(getAllFixtures).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(fixtures);
    });

    it('should call getAllFixtures without projectId when none provided', async () => {
      vi.mocked(getAllFixtures).mockResolvedValue([]);

      const result = await service.getAll();

      expect(getAllFixtures).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should call createFixture with data and projectId', async () => {
      const data: Partial<Fixture> = {
        position: 'FOH',
        type: 'LED',
        manufacturer: 'ETC',
        wattage: 750
      };
      vi.mocked(createFixture).mockResolvedValue(mockFixture);

      const result = await service.create(data, 'project-1');

      expect(createFixture).toHaveBeenCalledWith(data, 'project-1');
      expect(result).toEqual(mockFixture);
    });
  });

  describe('update', () => {
    it('should validate ID and call updateFixture', async () => {
      const updates: Partial<Fixture> = { position: 'Updated Position' };
      vi.mocked(updateFixture).mockResolvedValue({ ...mockFixture, ...updates });

      const result = await service.update('fixture-1', updates);

      expect(updateFixture).toHaveBeenCalledWith('fixture-1', updates);
      expect(result.position).toBe('Updated Position');
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.update('', { position: 'Test' })).rejects.toThrow(
        ValidationError
      );
      expect(updateFixture).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.update('   ', { position: 'Test' })).rejects.toThrow(
        ValidationError
      );
      expect(updateFixture).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should validate ID and call deleteFixture', async () => {
      vi.mocked(deleteFixture).mockResolvedValue(undefined);

      await service.delete('fixture-1');

      expect(deleteFixture).toHaveBeenCalledWith('fixture-1');
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.delete('')).rejects.toThrow(ValidationError);
      expect(deleteFixture).not.toHaveBeenCalled();
    });
  });

  describe('deleteMultiple', () => {
    it('should call deleteMultipleFixtures with IDs', async () => {
      const ids = ['fixture-1', 'fixture-2'];
      vi.mocked(deleteMultipleFixtures).mockResolvedValue(undefined);

      await service.deleteMultiple(ids);

      expect(deleteMultipleFixtures).toHaveBeenCalledWith(ids);
    });

    it('should throw Error for empty array', async () => {
      await expect(service.deleteMultiple([])).rejects.toThrow(
        'No fixture IDs provided'
      );
      expect(deleteMultipleFixtures).not.toHaveBeenCalled();
    });
  });

  describe('calculatePowerTotal', () => {
    it('should sum wattage correctly for all fixtures', () => {
      const fixtures = [mockFixture, mockFixture2];

      const result = service.calculatePowerTotal(fixtures);

      expect(result).toBe(1220); // 750 + 470
    });

    it('should handle fixtures with no wattage', () => {
      const fixtureNoWattage: Fixture = {
        id: 'fixture-3',
        created_at: 1704067200000,
        updated_at: 1704067200000
      };
      const fixtures = [mockFixture, fixtureNoWattage];

      const result = service.calculatePowerTotal(fixtures);

      expect(result).toBe(750);
    });

    it('should return 0 for an empty array', () => {
      const result = service.calculatePowerTotal([]);

      expect(result).toBe(0);
    });
  });

  describe('calculateDMXFootprint', () => {
    it('should return 0 (not yet implemented)', () => {
      const fixtures = [mockFixture, mockFixture2];

      const result = service.calculateDMXFootprint(fixtures);

      expect(result).toBe(0);
    });
  });
});
