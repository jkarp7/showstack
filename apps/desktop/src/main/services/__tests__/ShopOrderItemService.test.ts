/**
 * Tests for ShopOrderItemService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// Mock dependencies
vi.mock('../../database/queries/shop-order', () => ({
  getItemsBySectionId: vi.fn(),
  getItemsByProjectId: vi.fn(),
  createShopOrderItem: vi.fn(),
  updateShopOrderItem: vi.fn(),
  deleteShopOrderItem: vi.fn(),
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

import { ShopOrderItemService } from '../ShopOrderItemService';
import {
  getItemsBySectionId,
  getItemsByProjectId,
  createShopOrderItem,
  updateShopOrderItem,
  deleteShopOrderItem,
} from '../../database/queries/shop-order';

const mockGetBySectionId = vi.mocked(getItemsBySectionId);
const mockGetByProjectId = vi.mocked(getItemsByProjectId);
const mockCreate = vi.mocked(createShopOrderItem);
const mockUpdate = vi.mocked(updateShopOrderItem);
const mockDelete = vi.mocked(deleteShopOrderItem);

describe('ShopOrderItemService', () => {
  let service: ShopOrderItemService;

  const mockItem = {
    id: 'item-1',
    section_id: 'section-1',
    description: 'Source Four 36deg',
    active_qty: 10,
    spare_qty: 2,
    venue_qty: 0,
    total_qty: 12,
    venue_active: 0,
    venue_spare: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockItems = [
    mockItem,
    {
      id: 'item-2',
      section_id: 'section-1',
      description: 'Source Four 26deg',
      active_qty: 5,
      spare_qty: 1,
      venue_qty: 0,
      total_qty: 6,
      venue_active: 0,
      venue_spare: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  ];

  beforeEach(() => {
    service = new ShopOrderItemService();
    vi.clearAllMocks();
  });

  describe('getBySectionId', () => {
    it('should return all items for a section', async () => {
      mockGetBySectionId.mockResolvedValue(mockItems as any);

      const result = await service.getBySectionId('section-1');

      expect(result).toEqual(mockItems);
      expect(mockGetBySectionId).toHaveBeenCalledWith('section-1');
    });

    it('should return an empty array when no items exist', async () => {
      mockGetBySectionId.mockResolvedValue([]);

      const result = await service.getBySectionId('section-1');

      expect(result).toEqual([]);
    });

    it('should throw ValidationError for empty sectionId', async () => {
      await expect(service.getBySectionId('')).rejects.toThrow(ValidationError);
      await expect(service.getBySectionId('')).rejects.toThrow('Section ID is required');
    });

    it('should throw ValidationError for whitespace-only sectionId', async () => {
      await expect(service.getBySectionId('   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with correct field name', async () => {
      try {
        await service.getBySectionId('');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('sectionId');
      }
    });

    it('should not call database when validation fails', async () => {
      try {
        await service.getBySectionId('');
      } catch {
        // expected
      }

      expect(mockGetBySectionId).not.toHaveBeenCalled();
    });
  });

  describe('getByProjectId', () => {
    it('should return all items for a project', async () => {
      mockGetByProjectId.mockResolvedValue(mockItems as any);

      const result = await service.getByProjectId('proj-1');

      expect(result).toEqual(mockItems);
      expect(mockGetByProjectId).toHaveBeenCalledWith('proj-1');
    });

    it('should return an empty array when no items exist', async () => {
      mockGetByProjectId.mockResolvedValue([]);

      const result = await service.getByProjectId('proj-1');

      expect(result).toEqual([]);
    });

    it('should throw ValidationError for empty projectId', async () => {
      await expect(service.getByProjectId('')).rejects.toThrow(ValidationError);
      await expect(service.getByProjectId('')).rejects.toThrow('Project ID is required');
    });

    it('should throw ValidationError for whitespace-only projectId', async () => {
      await expect(service.getByProjectId('   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with correct field name', async () => {
      try {
        await service.getByProjectId('');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('projectId');
      }
    });

    it('should not call database when validation fails', async () => {
      try {
        await service.getByProjectId('');
      } catch {
        // expected
      }

      expect(mockGetByProjectId).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const input = { section_id: 'section-1', description: 'Par 64' };
      mockCreate.mockResolvedValue(mockItem as any);

      const result = await service.create(input);

      expect(result).toEqual(mockItem);
      expect(mockCreate).toHaveBeenCalledWith(input);
    });

    it('should throw ValidationError when section_id is missing', async () => {
      await expect(service.create({ description: 'Par 64' })).rejects.toThrow(ValidationError);
      await expect(service.create({ description: 'Par 64' })).rejects.toThrow(
        'Section ID is required',
      );
    });

    it('should throw ValidationError when section_id is empty string', async () => {
      await expect(service.create({ section_id: '', description: 'Par 64' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError when section_id is whitespace only', async () => {
      await expect(service.create({ section_id: '   ', description: 'Par 64' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError with correct field for section_id', async () => {
      try {
        await service.create({ description: 'Par 64' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('section_id');
      }
    });

    it('should throw ValidationError when description is missing', async () => {
      await expect(service.create({ section_id: 'section-1' })).rejects.toThrow(ValidationError);
      await expect(service.create({ section_id: 'section-1' })).rejects.toThrow(
        'Item description is required',
      );
    });

    it('should throw ValidationError when description is empty string', async () => {
      await expect(service.create({ section_id: 'section-1', description: '' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError when description is whitespace only', async () => {
      await expect(service.create({ section_id: 'section-1', description: '   ' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError with correct field for description', async () => {
      try {
        await service.create({ section_id: 'section-1', description: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('description');
      }
    });

    it('should validate section_id before description', async () => {
      try {
        await service.create({ section_id: '', description: '' });
      } catch (error) {
        expect((error as ValidationError).field).toBe('section_id');
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
        section_id: 'section-1',
        description: 'Moving Light',
        active_qty: 20,
        spare_qty: 4,
      };
      mockCreate.mockResolvedValue({ ...mockItem, ...input } as any);

      await service.create(input);

      expect(mockCreate).toHaveBeenCalledWith(input);
    });
  });

  describe('update', () => {
    it('should update an existing item', async () => {
      const updates = { description: 'Updated Description' };
      mockUpdate.mockResolvedValue({ ...mockItem, ...updates } as any);

      const result = await service.update('item-1', updates);

      expect(result).toEqual({ ...mockItem, ...updates });
      expect(mockUpdate).toHaveBeenCalledWith('item-1', updates);
    });

    it('should throw ValidationError for empty id', async () => {
      await expect(service.update('', { description: 'Desc' })).rejects.toThrow(ValidationError);
      await expect(service.update('', { description: 'Desc' })).rejects.toThrow(
        'Item ID is required',
      );
    });

    it('should throw ValidationError for whitespace-only id', async () => {
      await expect(service.update('  ', { description: 'Desc' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with correct field for id', async () => {
      try {
        await service.update('', { description: 'Desc' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('id');
      }
    });

    it('should throw ValidationError when description is explicitly empty string', async () => {
      await expect(service.update('item-1', { description: '' })).rejects.toThrow(ValidationError);
      await expect(service.update('item-1', { description: '' })).rejects.toThrow(
        'Item description cannot be empty',
      );
    });

    it('should throw ValidationError when description is whitespace only', async () => {
      await expect(service.update('item-1', { description: '   ' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError with correct field for description', async () => {
      try {
        await service.update('item-1', { description: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('description');
      }
    });

    it('should allow updates without description', async () => {
      const updates = { active_qty: 15, spare_qty: 3 };
      mockUpdate.mockResolvedValue({ ...mockItem, ...updates } as any);

      const result = await service.update('item-1', updates);

      expect(result).toEqual({ ...mockItem, ...updates });
      expect(mockUpdate).toHaveBeenCalledWith('item-1', updates);
    });

    it('should validate id before description', async () => {
      try {
        await service.update('', { description: '' });
      } catch (error) {
        expect((error as ValidationError).field).toBe('id');
      }
    });

    it('should not call database when id validation fails', async () => {
      try {
        await service.update('', { description: 'Desc' });
      } catch {
        // expected
      }

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should not call database when description validation fails', async () => {
      try {
        await service.update('item-1', { description: '' });
      } catch {
        // expected
      }

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an item by ID', async () => {
      mockDelete.mockResolvedValue(undefined as any);

      await service.delete('item-1');

      expect(mockDelete).toHaveBeenCalledWith('item-1');
    });

    it('should throw ValidationError for empty id', async () => {
      await expect(service.delete('')).rejects.toThrow(ValidationError);
      await expect(service.delete('')).rejects.toThrow('Item ID is required');
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

      await expect(service.delete('item-1')).rejects.toThrow('Delete failed');
    });
  });
});
