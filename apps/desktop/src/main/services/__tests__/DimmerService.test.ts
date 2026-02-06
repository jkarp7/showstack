/**
 * Tests for DimmerService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// Mock dependencies
vi.mock('../../database/queries/dimmerRacks', () => ({
  getAllDimmerRacks: vi.fn(),
  getDimmerRackById: vi.fn(),
  getDimmerRacksWithUsage: vi.fn(),
  createDimmerRack: vi.fn(),
  updateDimmerRack: vi.fn(),
  deleteDimmerRack: vi.fn(),
}));

vi.mock('../../errors', async () => {
  const actual = await vi.importActual('../../errors');
  return {
    ...actual,
    errorHandler: {
      executeWithRetry: vi.fn((fn) => fn()),
    },
  };
});

vi.mock('../../monitoring/PerformanceMonitor', () => ({
  performanceMonitor: {
    trackDatabaseQuery: vi.fn(),
  },
}));

vi.mock('../../database/monitoring/DatabaseMonitor', () => ({
  databaseMonitor: {
    recordQuery: vi.fn(),
  },
}));

// Import after mocking
import { DimmerService } from '../DimmerService';
import {
  getAllDimmerRacks,
  getDimmerRackById,
  getDimmerRacksWithUsage,
  createDimmerRack,
  updateDimmerRack,
  deleteDimmerRack,
} from '../../database/queries/dimmerRacks';
import type { DimmerRack } from '../../database/queries/dimmerRacks';

describe('DimmerService', () => {
  let service: DimmerService;

  const mockDimmerRack: DimmerRack = {
    id: 'dimmer-1',
    name: 'Dimmer Rack A',
    circuit_count: 48,
    watts_per_module: 2400,
    project_id: 'project-1',
    created_at: 1704067200000,
    updated_at: 1704067200000,
  };

  const mockDimmerRack2: DimmerRack = {
    id: 'dimmer-2',
    name: 'Dimmer Rack B',
    circuit_count: 96,
    watts_per_module: 1200,
    project_id: 'project-1',
    created_at: 1704067200000,
    updated_at: 1704067200000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DimmerService();
  });

  describe('getAll', () => {
    it('should call getAllDimmerRacks with projectId and return results', async () => {
      const racks = [mockDimmerRack, mockDimmerRack2];
      vi.mocked(getAllDimmerRacks).mockResolvedValue(racks);

      const result = await service.getAll('project-1');

      expect(getAllDimmerRacks).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(racks);
    });

    it('should call getAllDimmerRacks without projectId when none provided', async () => {
      vi.mocked(getAllDimmerRacks).mockResolvedValue([]);

      const result = await service.getAll();

      expect(getAllDimmerRacks).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });

    it('should return an empty array when no racks exist', async () => {
      vi.mocked(getAllDimmerRacks).mockResolvedValue([]);

      const result = await service.getAll('project-1');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should validate ID and call getDimmerRackById', async () => {
      vi.mocked(getDimmerRackById).mockResolvedValue(mockDimmerRack);

      const result = await service.getById('dimmer-1');

      expect(getDimmerRackById).toHaveBeenCalledWith('dimmer-1');
      expect(result).toEqual(mockDimmerRack);
    });

    it('should return undefined when rack not found', async () => {
      vi.mocked(getDimmerRackById).mockResolvedValue(undefined);

      const result = await service.getById('nonexistent');

      expect(getDimmerRackById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.getById('')).rejects.toThrow(ValidationError);
      expect(getDimmerRackById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.getById('   ')).rejects.toThrow(ValidationError);
      expect(getDimmerRackById).not.toHaveBeenCalled();
    });
  });

  describe('getWithUsage', () => {
    it('should call getDimmerRacksWithUsage with projectId and return results', async () => {
      const usageData = [{ ...mockDimmerRack, circuits_used: 10 }];
      vi.mocked(getDimmerRacksWithUsage).mockResolvedValue(usageData);

      const result = await service.getWithUsage('project-1');

      expect(getDimmerRacksWithUsage).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(usageData);
    });

    it('should call getDimmerRacksWithUsage without projectId when none provided', async () => {
      vi.mocked(getDimmerRacksWithUsage).mockResolvedValue([]);

      const result = await service.getWithUsage();

      expect(getDimmerRacksWithUsage).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should validate and call createDimmerRack with data and projectId', async () => {
      const data = {
        name: 'New Rack',
        circuit_count: 24 as number,
        watts_per_module: 2400,
        project_id: 'project-1',
      };
      vi.mocked(createDimmerRack).mockResolvedValue({
        ...data,
        id: 'dimmer-3',
        created_at: 1704067200000,
        updated_at: 1704067200000,
      });

      const result = await service.create(data, 'project-1');

      expect(createDimmerRack).toHaveBeenCalledWith(data, 'project-1');
      expect(result.name).toBe('New Rack');
    });

    it('should create without projectId', async () => {
      const data = {
        name: 'New Rack',
        circuit_count: 12 as number,
        watts_per_module: 2400,
        project_id: 'project-1',
      };
      vi.mocked(createDimmerRack).mockResolvedValue({
        ...data,
        id: 'dimmer-3',
        created_at: 1704067200000,
        updated_at: 1704067200000,
      });

      await service.create(data);

      expect(createDimmerRack).toHaveBeenCalledWith(data, undefined);
    });

    it('should accept circuit_count of 12', async () => {
      const data = {
        name: 'Rack',
        circuit_count: 12 as number,
        watts_per_module: 2400,
        project_id: 'p1',
      };
      vi.mocked(createDimmerRack).mockResolvedValue({
        ...data,
        id: 'id',
        created_at: 0,
        updated_at: 0,
      });

      await expect(service.create(data)).resolves.toBeDefined();
    });

    it('should accept circuit_count of 24', async () => {
      const data = {
        name: 'Rack',
        circuit_count: 24 as number,
        watts_per_module: 2400,
        project_id: 'p1',
      };
      vi.mocked(createDimmerRack).mockResolvedValue({
        ...data,
        id: 'id',
        created_at: 0,
        updated_at: 0,
      });

      await expect(service.create(data)).resolves.toBeDefined();
    });

    it('should accept circuit_count of 48', async () => {
      const data = {
        name: 'Rack',
        circuit_count: 48 as number,
        watts_per_module: 2400,
        project_id: 'p1',
      };
      vi.mocked(createDimmerRack).mockResolvedValue({
        ...data,
        id: 'id',
        created_at: 0,
        updated_at: 0,
      });

      await expect(service.create(data)).resolves.toBeDefined();
    });

    it('should accept circuit_count of 96', async () => {
      const data = {
        name: 'Rack',
        circuit_count: 96 as number,
        watts_per_module: 2400,
        project_id: 'p1',
      };
      vi.mocked(createDimmerRack).mockResolvedValue({
        ...data,
        id: 'id',
        created_at: 0,
        updated_at: 0,
      });

      await expect(service.create(data)).resolves.toBeDefined();
    });

    it('should throw ValidationError for empty name', async () => {
      const data = {
        name: '',
        circuit_count: 24 as number,
        watts_per_module: 2400,
        project_id: 'p1',
      };

      await expect(service.create(data)).rejects.toThrow(ValidationError);
      expect(createDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only name', async () => {
      const data = {
        name: '   ',
        circuit_count: 24 as number,
        watts_per_module: 2400,
        project_id: 'p1',
      };

      await expect(service.create(data)).rejects.toThrow(ValidationError);
      expect(createDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw Error for invalid circuit_count', async () => {
      const data = {
        name: 'Rack',
        circuit_count: 30 as number,
        watts_per_module: 2400,
        project_id: 'p1',
      };

      await expect(service.create(data)).rejects.toThrow('Circuit count must be 12, 24, 48, or 96');
      expect(createDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw Error for circuit_count of 0', async () => {
      const data = {
        name: 'Rack',
        circuit_count: 0 as number,
        watts_per_module: 2400,
        project_id: 'p1',
      };

      await expect(service.create(data)).rejects.toThrow('Circuit count must be 12, 24, 48, or 96');
      expect(createDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw Error for negative circuit_count', async () => {
      const data = {
        name: 'Rack',
        circuit_count: -12 as number,
        watts_per_module: 2400,
        project_id: 'p1',
      };

      await expect(service.create(data)).rejects.toThrow('Circuit count must be 12, 24, 48, or 96');
      expect(createDimmerRack).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should validate ID and call updateDimmerRack', async () => {
      const updates = { name: 'Updated Rack' };
      vi.mocked(updateDimmerRack).mockResolvedValue({ ...mockDimmerRack, ...updates });

      const result = await service.update('dimmer-1', updates);

      expect(updateDimmerRack).toHaveBeenCalledWith('dimmer-1', updates);
      expect(result.name).toBe('Updated Rack');
    });

    it('should allow updating circuit_count to a valid value', async () => {
      const updates = { circuit_count: 96 };
      vi.mocked(updateDimmerRack).mockResolvedValue({ ...mockDimmerRack, ...updates });

      const result = await service.update('dimmer-1', updates);

      expect(updateDimmerRack).toHaveBeenCalledWith('dimmer-1', updates);
      expect(result.circuit_count).toBe(96);
    });

    it('should allow updating without name or circuit_count', async () => {
      const updates = { watts_per_module: 1200 };
      vi.mocked(updateDimmerRack).mockResolvedValue({ ...mockDimmerRack, ...updates });

      const result = await service.update('dimmer-1', updates);

      expect(updateDimmerRack).toHaveBeenCalledWith('dimmer-1', updates);
      expect(result.watts_per_module).toBe(1200);
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.update('', { name: 'Test' })).rejects.toThrow(ValidationError);
      expect(updateDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.update('   ', { name: 'Test' })).rejects.toThrow(ValidationError);
      expect(updateDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for empty name when name is provided', async () => {
      await expect(service.update('dimmer-1', { name: '' })).rejects.toThrow(ValidationError);
      expect(updateDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only name when name is provided', async () => {
      await expect(service.update('dimmer-1', { name: '   ' })).rejects.toThrow(ValidationError);
      expect(updateDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw Error for invalid circuit_count when circuit_count is provided', async () => {
      await expect(service.update('dimmer-1', { circuit_count: 50 })).rejects.toThrow(
        'Circuit count must be 12, 24, 48, or 96',
      );
      expect(updateDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw Error for circuit_count of 0 when provided', async () => {
      await expect(service.update('dimmer-1', { circuit_count: 0 })).rejects.toThrow(
        'Circuit count must be 12, 24, 48, or 96',
      );
      expect(updateDimmerRack).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should validate ID and call deleteDimmerRack', async () => {
      vi.mocked(deleteDimmerRack).mockResolvedValue(undefined);

      await service.delete('dimmer-1');

      expect(deleteDimmerRack).toHaveBeenCalledWith('dimmer-1');
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.delete('')).rejects.toThrow(ValidationError);
      expect(deleteDimmerRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.delete('   ')).rejects.toThrow(ValidationError);
      expect(deleteDimmerRack).not.toHaveBeenCalled();
    });
  });

  describe('calculatePowerCapacity', () => {
    it('should return circuit_count * watts_per_module', () => {
      const result = service.calculatePowerCapacity(mockDimmerRack);

      // 48 * 2400 = 115200
      expect(result).toBe(115200);
    });

    it('should use different watts_per_module values', () => {
      const result = service.calculatePowerCapacity(mockDimmerRack2);

      // 96 * 1200 = 115200
      expect(result).toBe(115200);
    });

    it('should default to 2400 watts when watts_per_module is not set', () => {
      const rack: DimmerRack = {
        id: 'dimmer-3',
        name: 'Rack C',
        circuit_count: 24,
        watts_per_module: undefined as unknown as number,
        project_id: 'project-1',
        created_at: 1704067200000,
        updated_at: 1704067200000,
      };

      const result = service.calculatePowerCapacity(rack);

      // 24 * 2400 = 57600
      expect(result).toBe(57600);
    });

    it('should handle 12 circuit rack', () => {
      const rack: DimmerRack = {
        ...mockDimmerRack,
        circuit_count: 12,
        watts_per_module: 2400,
      };

      const result = service.calculatePowerCapacity(rack);

      // 12 * 2400 = 28800
      expect(result).toBe(28800);
    });

    it('should handle 96 circuit rack with custom wattage', () => {
      const rack: DimmerRack = {
        ...mockDimmerRack,
        circuit_count: 96,
        watts_per_module: 600,
      };

      const result = service.calculatePowerCapacity(rack);

      // 96 * 600 = 57600
      expect(result).toBe(57600);
    });
  });

  describe('calculateAvailableCircuits', () => {
    it('should return the circuit_count of the rack', () => {
      const result = service.calculateAvailableCircuits(mockDimmerRack);

      expect(result).toBe(48);
    });

    it('should return circuit_count for a 96-circuit rack', () => {
      const result = service.calculateAvailableCircuits(mockDimmerRack2);

      expect(result).toBe(96);
    });

    it('should return circuit_count for a 12-circuit rack', () => {
      const rack: DimmerRack = {
        ...mockDimmerRack,
        circuit_count: 12,
      };

      const result = service.calculateAvailableCircuits(rack);

      expect(result).toBe(12);
    });
  });
});
