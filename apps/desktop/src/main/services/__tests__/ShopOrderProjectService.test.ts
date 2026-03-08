/**
 * Tests for ShopOrderProjectService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// ============================================
// Hoisted mocks for mutable state
// ============================================

const { mockIsAuthenticated, mockGetUserId, mockSyncShopOrder, mockDeleteShopOrder } = vi.hoisted(
  () => ({
    mockIsAuthenticated: vi.fn(),
    mockGetUserId: vi.fn(),
    mockSyncShopOrder: vi.fn(),
    mockDeleteShopOrder: vi.fn(),
  }),
);

// Mock dependencies
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../database/queries/shop-order', () => ({
  getAllShopOrderProjects: vi.fn(),
  getShopOrderProjectById: vi.fn(),
  createShopOrderProject: vi.fn(),
  updateShopOrderProject: vi.fn(),
  deleteShopOrderProject: vi.fn(),
}));

vi.mock('../../errors', async () => {
  const actual = await vi.importActual('../../errors');
  return {
    ...actual,
    errorHandler: {
      executeWithRetry: vi.fn(async (fn) => fn()),
    },
  };
});

vi.mock('../../monitoring/PerformanceMonitor', () => ({
  performanceMonitor: {
    trackDatabaseQuery: vi.fn(),
  },
}));

vi.mock('../sync/SupabaseConnector', () => ({
  getSupabaseConnector: () => ({
    isAuthenticated: mockIsAuthenticated,
    getUserId: mockGetUserId,
  }),
}));

vi.mock('../sync/projectSync', () => ({
  syncShopOrderToPowerSync: mockSyncShopOrder,
  deleteShopOrderFromPowerSync: mockDeleteShopOrder,
}));

import { ShopOrderProjectService } from '../ShopOrderProjectService';
import {
  getAllShopOrderProjects,
  getShopOrderProjectById,
  createShopOrderProject,
  updateShopOrderProject,
  deleteShopOrderProject,
} from '../../database/queries/shop-order';
import { performanceMonitor } from '../../monitoring/PerformanceMonitor';

const mockGetAll = vi.mocked(getAllShopOrderProjects);
const mockGetById = vi.mocked(getShopOrderProjectById);
const mockCreate = vi.mocked(createShopOrderProject);
const mockUpdate = vi.mocked(updateShopOrderProject);
const mockDelete = vi.mocked(deleteShopOrderProject);
const mockTrackQuery = vi.mocked(performanceMonitor.trackDatabaseQuery);

describe('ShopOrderProjectService', () => {
  let service: ShopOrderProjectService;

  const mockProject = {
    id: 'proj-1',
    production_name: 'Test Production',
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockProjects = [
    mockProject,
    {
      id: 'proj-2',
      production_name: 'Another Production',
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  ];

  beforeEach(() => {
    service = new ShopOrderProjectService();
    vi.clearAllMocks();
    // Default: unauthenticated, sync helpers succeed
    mockIsAuthenticated.mockReturnValue(false);
    mockGetUserId.mockReturnValue(null);
    mockSyncShopOrder.mockResolvedValue(undefined);
    mockDeleteShopOrder.mockResolvedValue(undefined);
  });

  describe('getAll', () => {
    it('should return all shop order projects', async () => {
      mockGetAll.mockResolvedValue(mockProjects as any);

      const result = await service.getAll();

      expect(result).toEqual(mockProjects);
      expect(mockGetAll).toHaveBeenCalledOnce();
    });

    it('should return an empty array when no projects exist', async () => {
      mockGetAll.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
      expect(mockGetAll).toHaveBeenCalledOnce();
    });

    it('should track performance on success', async () => {
      mockGetAll.mockResolvedValue(mockProjects as any);

      await service.getAll();

      expect(mockTrackQuery).toHaveBeenCalledWith(
        'shop-order:projects:getAll',
        expect.any(Number),
        mockProjects.length,
      );
    });

    it('should track performance on failure', async () => {
      const error = new Error('Database error');
      mockGetAll.mockRejectedValue(error);

      await expect(service.getAll()).rejects.toThrow('Database error');

      expect(mockTrackQuery).toHaveBeenCalledWith('shop-order:projects:getAll', expect.any(Number));
    });

    it('should re-throw errors from the database layer', async () => {
      mockGetAll.mockRejectedValue(new Error('Connection failed'));

      await expect(service.getAll()).rejects.toThrow('Connection failed');
    });
  });

  describe('getById', () => {
    it('should return a project by ID', async () => {
      mockGetById.mockResolvedValue(mockProject as any);

      const result = await service.getById('proj-1');

      expect(result).toEqual(mockProject);
      expect(mockGetById).toHaveBeenCalledWith('proj-1');
    });

    it('should return null when project is not found', async () => {
      mockGetById.mockResolvedValue(null as any);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw ValidationError for empty id', async () => {
      await expect(service.getById('')).rejects.toThrow(ValidationError);
      await expect(service.getById('')).rejects.toThrow('Project ID is required');
    });

    it('should throw ValidationError for whitespace-only id', async () => {
      await expect(service.getById('   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with correct field name', async () => {
      try {
        await service.getById('');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('id');
      }
    });

    it('should not call the database query when validation fails', async () => {
      try {
        await service.getById('');
      } catch {
        // expected
      }

      expect(mockGetById).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const input = { production_name: 'New Production' };
      mockCreate.mockResolvedValue(mockProject as any);

      const result = await service.create(input);

      expect(result).toEqual(mockProject);
      // user_id is injected from auth session (null when unauthenticated)
      expect(mockCreate).toHaveBeenCalledWith({ ...input, user_id: undefined });
    });

    it('should throw ValidationError when production_name is missing', async () => {
      await expect(service.create({})).rejects.toThrow(ValidationError);
      await expect(service.create({})).rejects.toThrow('Production name is required');
    });

    it('should throw ValidationError when production_name is empty string', async () => {
      await expect(service.create({ production_name: '' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when production_name is whitespace only', async () => {
      await expect(service.create({ production_name: '   ' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with correct field info', async () => {
      try {
        await service.create({ production_name: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('production_name');
        expect((error as ValidationError).value).toBe('');
      }
    });

    it('should not call database when validation fails', async () => {
      try {
        await service.create({});
      } catch {
        // expected
      }

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should pass additional fields through to the database', async () => {
      const input = {
        production_name: 'My Show',
        parent_project_id: 'parent-1',
        user_id: 'user-1',
      };
      mockCreate.mockResolvedValue({ ...mockProject, ...input } as any);

      await service.create(input);

      expect(mockCreate).toHaveBeenCalledWith(input);
    });
  });

  describe('update', () => {
    it('should update an existing project', async () => {
      const updates = { production_name: 'Updated Name' };
      mockUpdate.mockResolvedValue({ ...mockProject, ...updates } as any);

      const result = await service.update('proj-1', updates);

      expect(result).toEqual({ ...mockProject, ...updates });
      expect(mockUpdate).toHaveBeenCalledWith('proj-1', updates);
    });

    it('should throw ValidationError for empty id', async () => {
      await expect(service.update('', { production_name: 'Name' })).rejects.toThrow(
        ValidationError,
      );
      await expect(service.update('', { production_name: 'Name' })).rejects.toThrow(
        'Project ID is required',
      );
    });

    it('should throw ValidationError for whitespace-only id', async () => {
      await expect(service.update('  ', { production_name: 'Name' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError when production_name is explicitly empty string', async () => {
      await expect(service.update('proj-1', { production_name: '' })).rejects.toThrow(
        ValidationError,
      );
      await expect(service.update('proj-1', { production_name: '' })).rejects.toThrow(
        'Production name cannot be empty',
      );
    });

    it('should throw ValidationError when production_name is whitespace only', async () => {
      await expect(service.update('proj-1', { production_name: '   ' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should allow updates without production_name', async () => {
      const updates = { parent_project_id: 'new-parent' };
      mockUpdate.mockResolvedValue({ ...mockProject, ...updates } as any);

      const result = await service.update('proj-1', updates);

      expect(result).toEqual({ ...mockProject, ...updates });
      expect(mockUpdate).toHaveBeenCalledWith('proj-1', updates);
    });

    it('should not call database when id validation fails', async () => {
      try {
        await service.update('', { production_name: 'Name' });
      } catch {
        // expected
      }

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should not call database when production_name validation fails', async () => {
      try {
        await service.update('proj-1', { production_name: '' });
      } catch {
        // expected
      }

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should validate id before production_name', async () => {
      try {
        await service.update('', { production_name: '' });
      } catch (error) {
        expect((error as ValidationError).field).toBe('id');
      }
    });
  });

  describe('delete', () => {
    it('should delete a project by ID', async () => {
      mockDelete.mockResolvedValue(undefined as any);

      await service.delete('proj-1');

      expect(mockDelete).toHaveBeenCalledWith('proj-1');
    });

    it('should throw ValidationError for empty id', async () => {
      await expect(service.delete('')).rejects.toThrow(ValidationError);
      await expect(service.delete('')).rejects.toThrow('Project ID is required');
    });

    it('should throw ValidationError for whitespace-only id', async () => {
      await expect(service.delete('   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with correct field name', async () => {
      try {
        await service.delete('');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('id');
      }
    });

    it('should not call database when validation fails', async () => {
      try {
        await service.delete('');
      } catch {
        // expected
      }

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should re-throw database errors', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.delete('proj-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('PowerSync write-path', () => {
    beforeEach(() => {
      mockCreate.mockResolvedValue(mockProject as any);
      mockUpdate.mockResolvedValue(mockProject as any);
      mockDelete.mockResolvedValue(undefined as any);
    });

    it('should call syncShopOrderToPowerSync on create when authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserId.mockReturnValue('user-123');

      await service.create({ production_name: 'Test' });

      expect(mockSyncShopOrder).toHaveBeenCalledWith(mockProject, 'user-123');
    });

    it('should NOT call syncShopOrderToPowerSync on create when unauthenticated', async () => {
      await service.create({ production_name: 'Test' });

      expect(mockSyncShopOrder).not.toHaveBeenCalled();
    });

    it('should inject authenticated user_id into create', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserId.mockReturnValue('auth-user');

      await service.create({ production_name: 'Test' });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'auth-user' }));
    });

    it('should preserve caller-supplied user_id when unauthenticated', async () => {
      await service.create({ production_name: 'Test', user_id: 'caller-user' });

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'caller-user' }));
    });

    it('should call syncShopOrderToPowerSync on update when authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserId.mockReturnValue('user-123');

      await service.update('proj-1', { production_name: 'Updated' });

      expect(mockSyncShopOrder).toHaveBeenCalledWith(mockProject, 'user-123');
    });

    it('should call deleteShopOrderFromPowerSync on delete', async () => {
      await service.delete('proj-1');

      // deleteShopOrderFromPowerSync is fire-and-forget; allow microtasks to flush
      await Promise.resolve();

      expect(mockDeleteShopOrder).toHaveBeenCalledWith('proj-1');
    });

    it('should not fail create when PowerSync write throws', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetUserId.mockReturnValue('user-123');
      mockSyncShopOrder.mockRejectedValue(new Error('PS unavailable'));

      await expect(service.create({ production_name: 'Test' })).resolves.toEqual(mockProject);
    });
  });
});
