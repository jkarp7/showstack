/**
 * Tests for ShopOrderSectionService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// Mock dependencies
vi.mock('../../database/queries/shop-order', () => ({
  getSectionsByProjectId: vi.fn(),
  createShopOrderSection: vi.fn(),
  updateShopOrderSection: vi.fn(),
  deleteShopOrderSection: vi.fn(),
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

import { ShopOrderSectionService } from '../ShopOrderSectionService';
import {
  getSectionsByProjectId,
  createShopOrderSection,
  updateShopOrderSection,
  deleteShopOrderSection,
} from '../../database/queries/shop-order';

const mockGetByProjectId = vi.mocked(getSectionsByProjectId);
const mockCreate = vi.mocked(createShopOrderSection);
const mockUpdate = vi.mocked(updateShopOrderSection);
const mockDelete = vi.mocked(deleteShopOrderSection);

describe('ShopOrderSectionService', () => {
  let service: ShopOrderSectionService;

  const mockSection = {
    id: 'section-1',
    prep_project_id: 'proj-1',
    name: 'Lighting',
    discipline: 'LX',
    sort_order: 0,
    page_break: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockSections = [
    mockSection,
    {
      id: 'section-2',
      prep_project_id: 'proj-1',
      name: 'Sound',
      discipline: 'SND',
      sort_order: 1,
      page_break: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  ];

  beforeEach(() => {
    service = new ShopOrderSectionService();
    vi.clearAllMocks();
  });

  describe('getByProjectId', () => {
    it('should return all sections for a project', async () => {
      mockGetByProjectId.mockResolvedValue(mockSections as any);

      const result = await service.getByProjectId('proj-1');

      expect(result).toEqual(mockSections);
      expect(mockGetByProjectId).toHaveBeenCalledWith('proj-1');
    });

    it('should return an empty array when no sections exist', async () => {
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
    it('should create a new section', async () => {
      const input = { prep_project_id: 'proj-1', name: 'Video' };
      mockCreate.mockResolvedValue(mockSection as any);

      const result = await service.create(input);

      expect(result).toEqual(mockSection);
      expect(mockCreate).toHaveBeenCalledWith(input);
    });

    it('should throw ValidationError when prep_project_id is missing', async () => {
      await expect(service.create({ name: 'Video' })).rejects.toThrow(ValidationError);
      await expect(service.create({ name: 'Video' })).rejects.toThrow('Project ID is required');
    });

    it('should throw ValidationError when prep_project_id is empty string', async () => {
      await expect(service.create({ prep_project_id: '', name: 'Video' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError when prep_project_id is whitespace only', async () => {
      await expect(service.create({ prep_project_id: '   ', name: 'Video' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError with correct field for prep_project_id', async () => {
      try {
        await service.create({ name: 'Video' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('prep_project_id');
      }
    });

    it('should throw ValidationError when name is missing', async () => {
      await expect(service.create({ prep_project_id: 'proj-1' })).rejects.toThrow(ValidationError);
      await expect(service.create({ prep_project_id: 'proj-1' })).rejects.toThrow(
        'Section name is required',
      );
    });

    it('should throw ValidationError when name is empty string', async () => {
      await expect(service.create({ prep_project_id: 'proj-1', name: '' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError when name is whitespace only', async () => {
      await expect(service.create({ prep_project_id: 'proj-1', name: '   ' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError with correct field for name', async () => {
      try {
        await service.create({ prep_project_id: 'proj-1', name: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('name');
      }
    });

    it('should validate prep_project_id before name', async () => {
      try {
        await service.create({ prep_project_id: '', name: '' });
      } catch (error) {
        expect((error as ValidationError).field).toBe('prep_project_id');
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
        prep_project_id: 'proj-1',
        name: 'Rigging',
        discipline: 'RIG',
        sort_order: 3,
        notes: 'Important notes',
      };
      mockCreate.mockResolvedValue({ ...mockSection, ...input } as any);

      await service.create(input);

      expect(mockCreate).toHaveBeenCalledWith(input);
    });
  });

  describe('update', () => {
    it('should update an existing section', async () => {
      const updates = { name: 'Updated Section' };
      mockUpdate.mockResolvedValue({ ...mockSection, ...updates } as any);

      const result = await service.update('section-1', updates);

      expect(result).toEqual({ ...mockSection, ...updates });
      expect(mockUpdate).toHaveBeenCalledWith('section-1', updates);
    });

    it('should throw ValidationError for empty id', async () => {
      await expect(service.update('', { name: 'Name' })).rejects.toThrow(ValidationError);
      await expect(service.update('', { name: 'Name' })).rejects.toThrow('Section ID is required');
    });

    it('should throw ValidationError for whitespace-only id', async () => {
      await expect(service.update('  ', { name: 'Name' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with correct field for id', async () => {
      try {
        await service.update('', { name: 'Name' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('id');
      }
    });

    it('should throw ValidationError when name is explicitly empty string', async () => {
      await expect(service.update('section-1', { name: '' })).rejects.toThrow(ValidationError);
      await expect(service.update('section-1', { name: '' })).rejects.toThrow(
        'Section name cannot be empty',
      );
    });

    it('should throw ValidationError when name is whitespace only', async () => {
      await expect(service.update('section-1', { name: '   ' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError with correct field for name', async () => {
      try {
        await service.update('section-1', { name: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('name');
      }
    });

    it('should allow updates without name', async () => {
      const updates = { discipline: 'VID', sort_order: 5 };
      mockUpdate.mockResolvedValue({ ...mockSection, ...updates } as any);

      const result = await service.update('section-1', updates);

      expect(result).toEqual({ ...mockSection, ...updates });
      expect(mockUpdate).toHaveBeenCalledWith('section-1', updates);
    });

    it('should validate id before name', async () => {
      try {
        await service.update('', { name: '' });
      } catch (error) {
        expect((error as ValidationError).field).toBe('id');
      }
    });

    it('should not call database when id validation fails', async () => {
      try {
        await service.update('', { name: 'Name' });
      } catch {
        // expected
      }

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should not call database when name validation fails', async () => {
      try {
        await service.update('section-1', { name: '' });
      } catch {
        // expected
      }

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a section by ID', async () => {
      mockDelete.mockResolvedValue(undefined as any);

      await service.delete('section-1');

      expect(mockDelete).toHaveBeenCalledWith('section-1');
    });

    it('should throw ValidationError for empty id', async () => {
      await expect(service.delete('')).rejects.toThrow(ValidationError);
      await expect(service.delete('')).rejects.toThrow('Section ID is required');
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

      await expect(service.delete('section-1')).rejects.toThrow('Delete failed');
    });
  });
});
