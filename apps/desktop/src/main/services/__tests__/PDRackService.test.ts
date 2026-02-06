/**
 * Tests for PDRackService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// Mock dependencies
vi.mock('../../database/queries/pdRacks', () => ({
  getAllPDRacks: vi.fn(),
  getPDRackById: vi.fn(),
  getPDRacksWithUsage: vi.fn(),
  createPDRack: vi.fn(),
  updatePDRack: vi.fn(),
  deletePDRack: vi.fn()
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
import { PDRackService } from '../PDRackService';
import {
  getAllPDRacks,
  getPDRackById,
  getPDRacksWithUsage,
  createPDRack,
  updatePDRack,
  deletePDRack
} from '../../database/queries/pdRacks';
import type { PDRack } from '../../database/queries/pdRacks';

describe('PDRackService', () => {
  let service: PDRackService;

  const mockPDRack: PDRack = {
    id: 'pd-1',
    name: 'PD Rack A',
    circuit_count: 48,
    voltage: 208,
    amps_per_breaker: 20,
    project_id: 'project-1',
    created_at: 1704067200000,
    updated_at: 1704067200000
  };

  const mockPDRack2: PDRack = {
    id: 'pd-2',
    name: 'PD Rack B',
    circuit_count: 96,
    voltage: 120,
    amps_per_breaker: 30,
    project_id: 'project-1',
    created_at: 1704067200000,
    updated_at: 1704067200000
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PDRackService();
  });

  describe('getAll', () => {
    it('should call getAllPDRacks with projectId and return results', async () => {
      const racks = [mockPDRack, mockPDRack2];
      vi.mocked(getAllPDRacks).mockResolvedValue(racks);

      const result = await service.getAll('project-1');

      expect(getAllPDRacks).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(racks);
    });

    it('should call getAllPDRacks without projectId when none provided', async () => {
      vi.mocked(getAllPDRacks).mockResolvedValue([]);

      const result = await service.getAll();

      expect(getAllPDRacks).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });

    it('should return an empty array when no racks exist', async () => {
      vi.mocked(getAllPDRacks).mockResolvedValue([]);

      const result = await service.getAll('project-1');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should validate ID and call getPDRackById', async () => {
      vi.mocked(getPDRackById).mockResolvedValue(mockPDRack);

      const result = await service.getById('pd-1');

      expect(getPDRackById).toHaveBeenCalledWith('pd-1');
      expect(result).toEqual(mockPDRack);
    });

    it('should return undefined when rack not found', async () => {
      vi.mocked(getPDRackById).mockResolvedValue(undefined);

      const result = await service.getById('nonexistent');

      expect(getPDRackById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.getById('')).rejects.toThrow(ValidationError);
      expect(getPDRackById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.getById('   ')).rejects.toThrow(ValidationError);
      expect(getPDRackById).not.toHaveBeenCalled();
    });
  });

  describe('getWithUsage', () => {
    it('should call getPDRacksWithUsage with projectId and return results', async () => {
      const usageData = [{ ...mockPDRack, circuits_used: 5 }];
      vi.mocked(getPDRacksWithUsage).mockResolvedValue(usageData);

      const result = await service.getWithUsage('project-1');

      expect(getPDRacksWithUsage).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(usageData);
    });

    it('should call getPDRacksWithUsage without projectId when none provided', async () => {
      vi.mocked(getPDRacksWithUsage).mockResolvedValue([]);

      const result = await service.getWithUsage();

      expect(getPDRacksWithUsage).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should validate and call createPDRack with data and projectId', async () => {
      const data = {
        name: 'New PD Rack',
        circuit_count: 24 as number,
        voltage: 208 as number,
        amps_per_breaker: 20,
        project_id: 'project-1'
      };
      vi.mocked(createPDRack).mockResolvedValue({
        ...data,
        id: 'pd-3',
        created_at: 1704067200000,
        updated_at: 1704067200000
      });

      const result = await service.create(data, 'project-1');

      expect(createPDRack).toHaveBeenCalledWith(data, 'project-1');
      expect(result.name).toBe('New PD Rack');
    });

    it('should create without projectId', async () => {
      const data = {
        name: 'New PD Rack',
        circuit_count: 12 as number,
        voltage: 120 as number,
        amps_per_breaker: 20,
        project_id: 'project-1'
      };
      vi.mocked(createPDRack).mockResolvedValue({
        ...data,
        id: 'pd-3',
        created_at: 1704067200000,
        updated_at: 1704067200000
      });

      await service.create(data);

      expect(createPDRack).toHaveBeenCalledWith(data, undefined);
    });

    it('should accept all valid circuit counts (12, 24, 48, 96)', async () => {
      for (const count of [12, 24, 48, 96]) {
        vi.clearAllMocks();
        const data = { name: 'Rack', circuit_count: count, voltage: 208 as number, amps_per_breaker: 20, project_id: 'p1' };
        vi.mocked(createPDRack).mockResolvedValue({ ...data, id: 'id', created_at: 0, updated_at: 0 });

        await expect(service.create(data)).resolves.toBeDefined();
      }
    });

    it('should accept all valid voltages (120, 208, 230, 240)', async () => {
      for (const voltage of [120, 208, 230, 240]) {
        vi.clearAllMocks();
        const data = { name: 'Rack', circuit_count: 24 as number, voltage, amps_per_breaker: 20, project_id: 'p1' };
        vi.mocked(createPDRack).mockResolvedValue({ ...data, id: 'id', created_at: 0, updated_at: 0 });

        await expect(service.create(data)).resolves.toBeDefined();
      }
    });

    it('should throw ValidationError for empty name', async () => {
      const data = { name: '', circuit_count: 24 as number, voltage: 208 as number, amps_per_breaker: 20, project_id: 'p1' };

      await expect(service.create(data)).rejects.toThrow(ValidationError);
      expect(createPDRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only name', async () => {
      const data = { name: '   ', circuit_count: 24 as number, voltage: 208 as number, amps_per_breaker: 20, project_id: 'p1' };

      await expect(service.create(data)).rejects.toThrow(ValidationError);
      expect(createPDRack).not.toHaveBeenCalled();
    });

    it('should throw Error for invalid voltage', async () => {
      const data = { name: 'Rack', circuit_count: 24 as number, voltage: 110 as number, amps_per_breaker: 20, project_id: 'p1' };

      await expect(service.create(data)).rejects.toThrow('Voltage must be 120, 208, 230, or 240');
      expect(createPDRack).not.toHaveBeenCalled();
    });

    it('should throw Error for voltage of 0', async () => {
      const data = { name: 'Rack', circuit_count: 24 as number, voltage: 0 as number, amps_per_breaker: 20, project_id: 'p1' };

      await expect(service.create(data)).rejects.toThrow('Voltage must be 120, 208, 230, or 240');
      expect(createPDRack).not.toHaveBeenCalled();
    });

    it('should throw Error for invalid circuit_count', async () => {
      const data = { name: 'Rack', circuit_count: 30 as number, voltage: 208 as number, amps_per_breaker: 20, project_id: 'p1' };

      await expect(service.create(data)).rejects.toThrow('Circuit count must be 12, 24, 48, or 96');
      expect(createPDRack).not.toHaveBeenCalled();
    });

    it('should throw Error for circuit_count of 0', async () => {
      const data = { name: 'Rack', circuit_count: 0 as number, voltage: 208 as number, amps_per_breaker: 20, project_id: 'p1' };

      await expect(service.create(data)).rejects.toThrow('Circuit count must be 12, 24, 48, or 96');
      expect(createPDRack).not.toHaveBeenCalled();
    });

    it('should throw Error for negative circuit_count', async () => {
      const data = { name: 'Rack', circuit_count: -12 as number, voltage: 208 as number, amps_per_breaker: 20, project_id: 'p1' };

      await expect(service.create(data)).rejects.toThrow('Circuit count must be 12, 24, 48, or 96');
      expect(createPDRack).not.toHaveBeenCalled();
    });

    it('should validate voltage before circuit_count', async () => {
      const data = { name: 'Rack', circuit_count: 30 as number, voltage: 110 as number, amps_per_breaker: 20, project_id: 'p1' };

      // Voltage is checked first in the implementation
      await expect(service.create(data)).rejects.toThrow('Voltage must be 120, 208, 230, or 240');
      expect(createPDRack).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should validate ID and call updatePDRack', async () => {
      const updates = { name: 'Updated PD Rack' };
      vi.mocked(updatePDRack).mockResolvedValue({ ...mockPDRack, ...updates });

      const result = await service.update('pd-1', updates);

      expect(updatePDRack).toHaveBeenCalledWith('pd-1', updates);
      expect(result.name).toBe('Updated PD Rack');
    });

    it('should allow updating voltage to a valid value', async () => {
      const updates = { voltage: 240 };
      vi.mocked(updatePDRack).mockResolvedValue({ ...mockPDRack, ...updates });

      const result = await service.update('pd-1', updates);

      expect(updatePDRack).toHaveBeenCalledWith('pd-1', updates);
      expect(result.voltage).toBe(240);
    });

    it('should allow updating circuit_count to a valid value', async () => {
      const updates = { circuit_count: 96 };
      vi.mocked(updatePDRack).mockResolvedValue({ ...mockPDRack, ...updates });

      const result = await service.update('pd-1', updates);

      expect(updatePDRack).toHaveBeenCalledWith('pd-1', updates);
      expect(result.circuit_count).toBe(96);
    });

    it('should allow updating without name, voltage, or circuit_count', async () => {
      const updates = { amps_per_breaker: 30 };
      vi.mocked(updatePDRack).mockResolvedValue({ ...mockPDRack, ...updates });

      const result = await service.update('pd-1', updates);

      expect(updatePDRack).toHaveBeenCalledWith('pd-1', updates);
      expect(result.amps_per_breaker).toBe(30);
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.update('', { name: 'Test' })).rejects.toThrow(ValidationError);
      expect(updatePDRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.update('   ', { name: 'Test' })).rejects.toThrow(ValidationError);
      expect(updatePDRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for empty name when name is provided', async () => {
      await expect(service.update('pd-1', { name: '' })).rejects.toThrow(ValidationError);
      expect(updatePDRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only name when name is provided', async () => {
      await expect(service.update('pd-1', { name: '   ' })).rejects.toThrow(ValidationError);
      expect(updatePDRack).not.toHaveBeenCalled();
    });

    it('should throw Error for invalid voltage when voltage is provided', async () => {
      await expect(service.update('pd-1', { voltage: 110 })).rejects.toThrow(
        'Voltage must be 120, 208, 230, or 240'
      );
      expect(updatePDRack).not.toHaveBeenCalled();
    });

    it('should throw Error for voltage of 0 when provided', async () => {
      await expect(service.update('pd-1', { voltage: 0 })).rejects.toThrow(
        'Voltage must be 120, 208, 230, or 240'
      );
      expect(updatePDRack).not.toHaveBeenCalled();
    });

    it('should throw Error for invalid circuit_count when circuit_count is provided', async () => {
      await expect(service.update('pd-1', { circuit_count: 50 })).rejects.toThrow(
        'Circuit count must be 12, 24, 48, or 96'
      );
      expect(updatePDRack).not.toHaveBeenCalled();
    });

    it('should throw Error for circuit_count of 0 when provided', async () => {
      await expect(service.update('pd-1', { circuit_count: 0 })).rejects.toThrow(
        'Circuit count must be 12, 24, 48, or 96'
      );
      expect(updatePDRack).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should validate ID and call deletePDRack', async () => {
      vi.mocked(deletePDRack).mockResolvedValue(undefined);

      await service.delete('pd-1');

      expect(deletePDRack).toHaveBeenCalledWith('pd-1');
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.delete('')).rejects.toThrow(ValidationError);
      expect(deletePDRack).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.delete('   ')).rejects.toThrow(ValidationError);
      expect(deletePDRack).not.toHaveBeenCalled();
    });
  });

  describe('calculatePowerCapacity', () => {
    it('should return amps_per_breaker * voltage * circuit_count', () => {
      const result = service.calculatePowerCapacity(mockPDRack);

      // 20 * 208 * 48 = 199680
      expect(result).toBe(199680);
    });

    it('should use different amps_per_breaker and voltage values', () => {
      const result = service.calculatePowerCapacity(mockPDRack2);

      // 30 * 120 * 96 = 345600
      expect(result).toBe(345600);
    });

    it('should default to 20 amps when amps_per_breaker is not set', () => {
      const rack: PDRack = {
        id: 'pd-3',
        name: 'Rack C',
        circuit_count: 24,
        voltage: 240,
        amps_per_breaker: undefined as unknown as number,
        project_id: 'project-1',
        created_at: 1704067200000,
        updated_at: 1704067200000
      };

      const result = service.calculatePowerCapacity(rack);

      // 20 * 240 * 24 = 115200
      expect(result).toBe(115200);
    });

    it('should handle 120V rack with 12 circuits', () => {
      const rack: PDRack = {
        ...mockPDRack,
        circuit_count: 12,
        voltage: 120,
        amps_per_breaker: 20
      };

      const result = service.calculatePowerCapacity(rack);

      // 20 * 120 * 12 = 28800
      expect(result).toBe(28800);
    });

    it('should handle 230V rack with 96 circuits and 30A breakers', () => {
      const rack: PDRack = {
        ...mockPDRack,
        circuit_count: 96,
        voltage: 230,
        amps_per_breaker: 30
      };

      const result = service.calculatePowerCapacity(rack);

      // 30 * 230 * 96 = 662400
      expect(result).toBe(662400);
    });

    it('should handle 240V rack', () => {
      const rack: PDRack = {
        ...mockPDRack,
        circuit_count: 48,
        voltage: 240,
        amps_per_breaker: 20
      };

      const result = service.calculatePowerCapacity(rack);

      // 20 * 240 * 48 = 230400
      expect(result).toBe(230400);
    });
  });

  describe('calculateAvailableCircuits', () => {
    it('should return the circuit_count of the rack', () => {
      const result = service.calculateAvailableCircuits(mockPDRack);

      expect(result).toBe(48);
    });

    it('should return circuit_count for a 96-circuit rack', () => {
      const result = service.calculateAvailableCircuits(mockPDRack2);

      expect(result).toBe(96);
    });

    it('should return circuit_count for a 12-circuit rack', () => {
      const rack: PDRack = {
        ...mockPDRack,
        circuit_count: 12
      };

      const result = service.calculateAvailableCircuits(rack);

      expect(result).toBe(12);
    });
  });
});
