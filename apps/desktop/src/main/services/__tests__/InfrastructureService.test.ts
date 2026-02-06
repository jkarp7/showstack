/**
 * Tests for InfrastructureService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// Mock dependencies
vi.mock('../../database/queries/infrastructure', () => ({
  getAllInfrastructure: vi.fn(),
  createInfrastructure: vi.fn(),
  updateInfrastructure: vi.fn(),
  deleteInfrastructure: vi.fn(),
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
import { InfrastructureService } from '../InfrastructureService';
import {
  getAllInfrastructure,
  createInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
} from '../../database/queries/infrastructure';
import type { InfrastructureEquipment } from '../../database/queries/infrastructure';

describe('InfrastructureService', () => {
  let service: InfrastructureService;

  const mockEquipment: InfrastructureEquipment = {
    id: 'equip-1',
    project_id: 'project-1',
    name: 'Main Network Switch',
    manufacturer: 'Cisco',
    model: 'SG350-28',
    quantity: 1,
    category: 'network',
    ip_address: '192.168.1.1',
    vlan_id: 100,
    port_count: 28,
    port_assignments: [{ port: 1, connected_to: 'DMX Node', type: 'ethernet' }] as any,
    wattage: 45,
    status: 'active',
    created_at: 1704067200000,
    updated_at: 1704067200000,
  };

  const mockEquipment2: InfrastructureEquipment = {
    id: 'equip-2',
    project_id: 'project-1',
    name: 'DMX Node',
    manufacturer: 'Pathport',
    model: 'Octo',
    quantity: 2,
    category: 'data_distribution',
    wattage: 20,
    status: 'active',
    created_at: 1704153600000,
    updated_at: 1704153600000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InfrastructureService();
  });

  describe('getAll', () => {
    it('should call getAllInfrastructure with projectId and return results', async () => {
      const equipment = [mockEquipment, mockEquipment2];
      vi.mocked(getAllInfrastructure).mockReturnValue(equipment as any);

      const result = await service.getAll('project-1');

      expect(getAllInfrastructure).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(equipment);
    });

    it('should return an empty array when no equipment exists', async () => {
      vi.mocked(getAllInfrastructure).mockReturnValue([] as any);

      const result = await service.getAll('project-1');

      expect(getAllInfrastructure).toHaveBeenCalledWith('project-1');
      expect(result).toEqual([]);
    });

    it('should throw ValidationError for empty projectId', async () => {
      await expect(service.getAll('')).rejects.toThrow(ValidationError);
      expect(getAllInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only projectId', async () => {
      await expect(service.getAll('   ')).rejects.toThrow(ValidationError);
      expect(getAllInfrastructure).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should call createInfrastructure with data and projectId', async () => {
      const data: Partial<InfrastructureEquipment> = {
        name: 'Main Network Switch',
        category: 'network',
        wattage: 45,
      };
      vi.mocked(createInfrastructure).mockReturnValue(mockEquipment as any);

      const result = await service.create(data, 'project-1');

      expect(createInfrastructure).toHaveBeenCalledWith(data, 'project-1');
      expect(result).toEqual(mockEquipment);
    });

    it('should throw ValidationError for empty projectId', async () => {
      const data: Partial<InfrastructureEquipment> = { name: 'Switch' };

      await expect(service.create(data, '')).rejects.toThrow(ValidationError);
      expect(createInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only projectId', async () => {
      const data: Partial<InfrastructureEquipment> = { name: 'Switch' };

      await expect(service.create(data, '   ')).rejects.toThrow(ValidationError);
      expect(createInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when name is missing', async () => {
      const data: Partial<InfrastructureEquipment> = { category: 'network' };

      await expect(service.create(data, 'project-1')).rejects.toThrow(ValidationError);
      expect(createInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when name is empty string', async () => {
      const data: Partial<InfrastructureEquipment> = { name: '' };

      await expect(service.create(data, 'project-1')).rejects.toThrow(ValidationError);
      expect(createInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when name is whitespace only', async () => {
      const data: Partial<InfrastructureEquipment> = { name: '   ' };

      await expect(service.create(data, 'project-1')).rejects.toThrow(ValidationError);
      expect(createInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError with correct field for missing name', async () => {
      const data: Partial<InfrastructureEquipment> = { category: 'network' };

      try {
        await service.create(data, 'project-1');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('name');
      }
    });
  });

  describe('update', () => {
    it('should validate ID and call updateInfrastructure', async () => {
      const updates: Partial<InfrastructureEquipment> = { name: 'Updated Switch' };
      vi.mocked(updateInfrastructure).mockReturnValue({ ...mockEquipment, ...updates } as any);

      const result = await service.update('equip-1', updates);

      expect(updateInfrastructure).toHaveBeenCalledWith('equip-1', updates);
      expect(result.name).toBe('Updated Switch');
    });

    it('should allow updating fields other than name without name validation', async () => {
      const updates: Partial<InfrastructureEquipment> = { ip_address: '10.0.0.1' };
      vi.mocked(updateInfrastructure).mockReturnValue({ ...mockEquipment, ...updates } as any);

      const result = await service.update('equip-1', updates);

      expect(updateInfrastructure).toHaveBeenCalledWith('equip-1', updates);
      expect(result.ip_address).toBe('10.0.0.1');
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.update('', { name: 'Test' })).rejects.toThrow(ValidationError);
      expect(updateInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.update('   ', { name: 'Test' })).rejects.toThrow(ValidationError);
      expect(updateInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when name is updated to empty string', async () => {
      await expect(service.update('equip-1', { name: '' })).rejects.toThrow(ValidationError);
      expect(updateInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when name is updated to whitespace only', async () => {
      await expect(service.update('equip-1', { name: '   ' })).rejects.toThrow(ValidationError);
      expect(updateInfrastructure).not.toHaveBeenCalled();
    });

    it('should accept valid VLAN ID within range', async () => {
      const updates: Partial<InfrastructureEquipment> = { vlan_id: 100 };
      vi.mocked(updateInfrastructure).mockReturnValue({ ...mockEquipment, ...updates } as any);

      const result = await service.update('equip-1', updates);

      expect(updateInfrastructure).toHaveBeenCalledWith('equip-1', updates);
      expect(result.vlan_id).toBe(100);
    });

    it('should accept VLAN ID at minimum boundary (1)', async () => {
      const updates: Partial<InfrastructureEquipment> = { vlan_id: 1 };
      vi.mocked(updateInfrastructure).mockReturnValue({ ...mockEquipment, ...updates } as any);

      const result = await service.update('equip-1', updates);

      expect(updateInfrastructure).toHaveBeenCalledWith('equip-1', updates);
      expect(result.vlan_id).toBe(1);
    });

    it('should accept VLAN ID at maximum boundary (4094)', async () => {
      const updates: Partial<InfrastructureEquipment> = { vlan_id: 4094 };
      vi.mocked(updateInfrastructure).mockReturnValue({ ...mockEquipment, ...updates } as any);

      const result = await service.update('equip-1', updates);

      expect(updateInfrastructure).toHaveBeenCalledWith('equip-1', updates);
      expect(result.vlan_id).toBe(4094);
    });

    it('should throw ValidationError for VLAN ID below minimum (0)', async () => {
      await expect(service.update('equip-1', { vlan_id: 0 })).rejects.toThrow(ValidationError);
      expect(updateInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for VLAN ID above maximum (4095)', async () => {
      await expect(service.update('equip-1', { vlan_id: 4095 })).rejects.toThrow(ValidationError);
      expect(updateInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for negative VLAN ID', async () => {
      await expect(service.update('equip-1', { vlan_id: -1 })).rejects.toThrow(ValidationError);
      expect(updateInfrastructure).not.toHaveBeenCalled();
    });

    it('should allow null VLAN ID (clearing the value)', async () => {
      const updates: Partial<InfrastructureEquipment> = { vlan_id: null as any };
      vi.mocked(updateInfrastructure).mockReturnValue({
        ...mockEquipment,
        vlan_id: undefined,
      } as any);

      await service.update('equip-1', updates);

      expect(updateInfrastructure).toHaveBeenCalledWith('equip-1', updates);
    });

    it('should not validate VLAN ID when it is not in updates', async () => {
      const updates: Partial<InfrastructureEquipment> = { location: 'Stage Left' };
      vi.mocked(updateInfrastructure).mockReturnValue({ ...mockEquipment, ...updates } as any);

      const result = await service.update('equip-1', updates);

      expect(updateInfrastructure).toHaveBeenCalledWith('equip-1', updates);
      expect(result.location).toBe('Stage Left');
    });
  });

  describe('delete', () => {
    it('should validate ID and call deleteInfrastructure', async () => {
      vi.mocked(deleteInfrastructure).mockReturnValue(undefined as any);

      await service.delete('equip-1');

      expect(deleteInfrastructure).toHaveBeenCalledWith('equip-1');
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.delete('')).rejects.toThrow(ValidationError);
      expect(deleteInfrastructure).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.delete('   ')).rejects.toThrow(ValidationError);
      expect(deleteInfrastructure).not.toHaveBeenCalled();
    });
  });

  describe('getPortAssignments', () => {
    it('should parse a valid JSON array of port assignments', () => {
      const equipment: InfrastructureEquipment = {
        ...mockEquipment,
        port_assignments: '[{"port":1,"connected_to":"DMX Node","type":"ethernet"}]' as any,
      };

      const result = service.getPortAssignments(equipment);

      expect(result).toEqual([{ port: 1, connected_to: 'DMX Node', type: 'ethernet' }]);
    });

    it('should parse multiple port assignments', () => {
      const equipment: InfrastructureEquipment = {
        ...mockEquipment,
        port_assignments:
          '[{"port":1,"connected_to":"DMX Node"},{"port":2,"connected_to":"Audio Console"}]' as any,
      };

      const result = service.getPortAssignments(equipment);

      expect(result).toHaveLength(2);
      expect(result[0].port).toBe(1);
      expect(result[1].port).toBe(2);
    });

    it('should return an empty array when port_assignments is null', () => {
      const equipment: InfrastructureEquipment = {
        ...mockEquipment,
        port_assignments: null as any,
      };

      const result = service.getPortAssignments(equipment);

      expect(result).toEqual([]);
    });

    it('should return an empty array when port_assignments is undefined', () => {
      const equipment: InfrastructureEquipment = {
        ...mockEquipment,
        port_assignments: undefined,
      };

      const result = service.getPortAssignments(equipment);

      expect(result).toEqual([]);
    });

    it('should return an empty array for invalid JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const equipment: InfrastructureEquipment = {
        ...mockEquipment,
        port_assignments: 'not-valid-json' as any,
      };

      const result = service.getPortAssignments(equipment);

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should return an empty array for malformed JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const equipment: InfrastructureEquipment = {
        ...mockEquipment,
        port_assignments: '[{"port":1,' as any,
      };

      const result = service.getPortAssignments(equipment);

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should handle an empty JSON array', () => {
      const equipment: InfrastructureEquipment = {
        ...mockEquipment,
        port_assignments: '[]' as any,
      };

      const result = service.getPortAssignments(equipment);

      expect(result).toEqual([]);
    });
  });

  describe('calculatePowerTotal', () => {
    it('should sum wattage across all equipment', () => {
      const equipment = [mockEquipment, mockEquipment2];

      const result = service.calculatePowerTotal(equipment);

      expect(result).toBe(65); // 45 + 20
    });

    it('should handle equipment with undefined wattage', () => {
      const equipmentNoWattage: InfrastructureEquipment = {
        id: 'equip-3',
        project_id: 'project-1',
        name: 'Passive Patch Panel',
        quantity: 1,
        status: 'active',
        created_at: 1704067200000,
        updated_at: 1704067200000,
      };
      const equipment = [mockEquipment, equipmentNoWattage];

      const result = service.calculatePowerTotal(equipment);

      expect(result).toBe(45); // 45 + 0
    });

    it('should handle equipment with null wattage', () => {
      const equipmentNullWattage: InfrastructureEquipment = {
        ...mockEquipment2,
        wattage: null as any,
      };
      const equipment = [mockEquipment, equipmentNullWattage];

      const result = service.calculatePowerTotal(equipment);

      expect(result).toBe(45); // 45 + 0
    });

    it('should return 0 for an empty array', () => {
      const result = service.calculatePowerTotal([]);

      expect(result).toBe(0);
    });

    it('should handle a single equipment item', () => {
      const result = service.calculatePowerTotal([mockEquipment]);

      expect(result).toBe(45);
    });

    it('should handle all equipment having zero wattage', () => {
      const zeroWattage1: InfrastructureEquipment = {
        ...mockEquipment,
        wattage: 0,
      };
      const zeroWattage2: InfrastructureEquipment = {
        ...mockEquipment2,
        wattage: 0,
      };

      const result = service.calculatePowerTotal([zeroWattage1, zeroWattage2]);

      expect(result).toBe(0);
    });
  });
});
