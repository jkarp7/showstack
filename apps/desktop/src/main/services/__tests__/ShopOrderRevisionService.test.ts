/**
 * Tests for ShopOrderRevisionService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// Mock dependencies
vi.mock('../../database/queries/shop-order', () => ({
  getRevisionsByProjectId: vi.fn(),
  createShopOrderRevision: vi.fn(),
  deleteShopOrderRevision: vi.fn(),
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

// Import after mocking
import { ShopOrderRevisionService } from '../ShopOrderRevisionService';
import {
  getRevisionsByProjectId,
  createShopOrderRevision,
  deleteShopOrderRevision,
} from '../../database/queries/shop-order';
import type { ShopOrderRevision } from '../../database/queries/shop-order';
import { errorHandler } from '../../errors';

describe('ShopOrderRevisionService', () => {
  let service: ShopOrderRevisionService;

  const mockRevision: ShopOrderRevision = {
    id: 'rev-1',
    prep_project_id: 'project-1',
    revision_number: 1,
    revision_date: 1700000000000,
    notes: 'Initial revision',
    change_log: JSON.stringify([{ action: 'created', description: 'Initial order' }]),
    created_at: 1700000000000,
    updated_at: 1700000000000,
  };

  const mockRevision2: ShopOrderRevision = {
    id: 'rev-2',
    prep_project_id: 'project-1',
    revision_number: 2,
    revision_date: 1700100000000,
    notes: 'Added fixtures',
    change_log: JSON.stringify([{ action: 'added', description: '10x Source Four' }]),
    created_at: 1700100000000,
    updated_at: 1700100000000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ShopOrderRevisionService();
  });

  // ------------------------------------------------------------------
  // getByProjectId
  // ------------------------------------------------------------------
  describe('getByProjectId', () => {
    it('should return revisions for a valid project ID', async () => {
      const revisions = [mockRevision, mockRevision2];
      vi.mocked(getRevisionsByProjectId).mockReturnValue(revisions);

      const result = await service.getByProjectId('project-1');

      expect(getRevisionsByProjectId).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(revisions);
    });

    it('should return an empty array when no revisions exist', async () => {
      vi.mocked(getRevisionsByProjectId).mockReturnValue([]);

      const result = await service.getByProjectId('project-no-revisions');

      expect(getRevisionsByProjectId).toHaveBeenCalledWith('project-no-revisions');
      expect(result).toEqual([]);
    });

    it('should call errorHandler.executeWithRetry with correct operation name', async () => {
      vi.mocked(getRevisionsByProjectId).mockReturnValue([]);

      await service.getByProjectId('project-1');

      expect(errorHandler.executeWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        'shop-order:revisions:getByProjectId',
      );
    });

    it('should throw ValidationError when projectId is empty string', async () => {
      await expect(service.getByProjectId('')).rejects.toThrow(ValidationError);
      expect(getRevisionsByProjectId).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when projectId is whitespace only', async () => {
      await expect(service.getByProjectId('   ')).rejects.toThrow(ValidationError);
      expect(getRevisionsByProjectId).not.toHaveBeenCalled();
    });

    it('should throw ValidationError with correct field name for invalid projectId', async () => {
      try {
        await service.getByProjectId('');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('projectId');
      }
    });

    it('should throw ValidationError with the invalid value attached', async () => {
      const invalidValue = '   ';
      try {
        await service.getByProjectId(invalidValue);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).value).toBe(invalidValue);
      }
    });
  });

  // ------------------------------------------------------------------
  // create
  // ------------------------------------------------------------------
  describe('create', () => {
    it('should create a revision with valid data', async () => {
      vi.mocked(createShopOrderRevision).mockReturnValue(mockRevision);

      const data: Partial<ShopOrderRevision> = {
        prep_project_id: 'project-1',
        revision_number: 1,
        notes: 'Initial revision',
      };

      const result = await service.create(data);

      expect(createShopOrderRevision).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockRevision);
    });

    it('should create a revision with revision_number 0', async () => {
      const revisionZero = { ...mockRevision, revision_number: 0 };
      vi.mocked(createShopOrderRevision).mockReturnValue(revisionZero);

      const data: Partial<ShopOrderRevision> = {
        prep_project_id: 'project-1',
        revision_number: 0,
      };

      const result = await service.create(data);

      expect(createShopOrderRevision).toHaveBeenCalledWith(data);
      expect(result).toEqual(revisionZero);
    });

    it('should call errorHandler.executeWithRetry with correct operation name', async () => {
      vi.mocked(createShopOrderRevision).mockReturnValue(mockRevision);

      await service.create({
        prep_project_id: 'project-1',
        revision_number: 1,
      });

      expect(errorHandler.executeWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        'shop-order:revisions:create',
      );
    });

    // Validation: prep_project_id
    it('should throw ValidationError when prep_project_id is missing', async () => {
      await expect(service.create({ revision_number: 1 })).rejects.toThrow(ValidationError);
      expect(createShopOrderRevision).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when prep_project_id is empty string', async () => {
      await expect(service.create({ prep_project_id: '', revision_number: 1 })).rejects.toThrow(
        ValidationError,
      );
      expect(createShopOrderRevision).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when prep_project_id is whitespace only', async () => {
      await expect(service.create({ prep_project_id: '   ', revision_number: 1 })).rejects.toThrow(
        ValidationError,
      );
      expect(createShopOrderRevision).not.toHaveBeenCalled();
    });

    it('should throw ValidationError with correct field for missing prep_project_id', async () => {
      try {
        await service.create({ revision_number: 1 });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('prep_project_id');
      }
    });

    // Validation: revision_number
    it('should throw ValidationError when revision_number is undefined', async () => {
      await expect(service.create({ prep_project_id: 'project-1' })).rejects.toThrow(
        ValidationError,
      );
      expect(createShopOrderRevision).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when revision_number is null', async () => {
      await expect(
        service.create({
          prep_project_id: 'project-1',
          revision_number: null as unknown as number,
        }),
      ).rejects.toThrow(ValidationError);
      expect(createShopOrderRevision).not.toHaveBeenCalled();
    });

    it('should throw ValidationError with correct field for missing revision_number', async () => {
      try {
        await service.create({ prep_project_id: 'project-1' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('revision_number');
      }
    });

    // Both missing
    it('should throw ValidationError for prep_project_id first when both fields are missing', async () => {
      try {
        await service.create({});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        // prep_project_id is validated first in the implementation
        expect((error as ValidationError).field).toBe('prep_project_id');
      }
    });
  });

  // ------------------------------------------------------------------
  // delete
  // ------------------------------------------------------------------
  describe('delete', () => {
    it('should delete a revision with a valid ID', async () => {
      vi.mocked(deleteShopOrderRevision).mockReturnValue(undefined);

      await service.delete('rev-1');

      expect(deleteShopOrderRevision).toHaveBeenCalledWith('rev-1');
    });

    it('should call errorHandler.executeWithRetry with correct operation name', async () => {
      vi.mocked(deleteShopOrderRevision).mockReturnValue(undefined);

      await service.delete('rev-1');

      expect(errorHandler.executeWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        'shop-order:revisions:delete',
      );
    });

    it('should throw ValidationError when id is empty string', async () => {
      await expect(service.delete('')).rejects.toThrow(ValidationError);
      expect(deleteShopOrderRevision).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when id is whitespace only', async () => {
      await expect(service.delete('   ')).rejects.toThrow(ValidationError);
      expect(deleteShopOrderRevision).not.toHaveBeenCalled();
    });

    it('should throw ValidationError with correct field name for empty id', async () => {
      try {
        await service.delete('');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('id');
      }
    });

    it('should throw ValidationError with the invalid value attached', async () => {
      const invalidId = '  ';
      try {
        await service.delete(invalidId);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).value).toBe(invalidId);
      }
    });
  });

  // ------------------------------------------------------------------
  // Error propagation from database layer
  // ------------------------------------------------------------------
  describe('error propagation', () => {
    it('should propagate database errors from getByProjectId', async () => {
      vi.mocked(errorHandler.executeWithRetry).mockRejectedValueOnce(
        new Error('Database connection lost'),
      );

      await expect(service.getByProjectId('project-1')).rejects.toThrow('Database connection lost');
    });

    it('should propagate database errors from create', async () => {
      vi.mocked(errorHandler.executeWithRetry).mockRejectedValueOnce(
        new Error('Unique constraint violation'),
      );

      await expect(
        service.create({ prep_project_id: 'project-1', revision_number: 1 }),
      ).rejects.toThrow('Unique constraint violation');
    });

    it('should propagate database errors from delete', async () => {
      vi.mocked(errorHandler.executeWithRetry).mockRejectedValueOnce(
        new Error('Foreign key constraint'),
      );

      await expect(service.delete('rev-1')).rejects.toThrow('Foreign key constraint');
    });
  });
});
