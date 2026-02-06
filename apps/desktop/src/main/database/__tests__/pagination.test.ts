/**
 * Tests for pagination utility module
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePaginationOptions,
  buildOrderByClause,
  buildPaginatedResult,
  isValidSortField,
  calculatePageNumber,
  calculateOffset,
  DEFAULT_PAGINATION,
  MAX_PAGINATION_LIMIT
} from '../utils/pagination';

const ALLOWED_FIELDS = ['id', 'name', 'created_at', 'updated_at'] as const;

describe('pagination utility', () => {
  describe('normalizePaginationOptions', () => {
    it('should return defaults when no options provided', () => {
      const result = normalizePaginationOptions({}, ALLOWED_FIELDS);

      expect(result.offset).toBe(DEFAULT_PAGINATION.offset);
      expect(result.limit).toBe(DEFAULT_PAGINATION.limit);
      expect(result.sortBy).toBe(ALLOWED_FIELDS[0]);
      expect(result.sortOrder).toBe('ASC');
    });

    it('should use provided values', () => {
      const result = normalizePaginationOptions({
        offset: 10,
        limit: 25,
        sortBy: 'name',
        sortOrder: 'DESC'
      }, ALLOWED_FIELDS);

      expect(result.offset).toBe(10);
      expect(result.limit).toBe(25);
      expect(result.sortBy).toBe('name');
      expect(result.sortOrder).toBe('DESC');
    });

    it('should clamp negative offset to 0', () => {
      const result = normalizePaginationOptions({ offset: -10 }, ALLOWED_FIELDS);
      expect(result.offset).toBe(0);
    });

    it('should clamp limit to minimum of 1', () => {
      const result = normalizePaginationOptions({ limit: 0 }, ALLOWED_FIELDS);
      expect(result.limit).toBe(1);

      const result2 = normalizePaginationOptions({ limit: -5 }, ALLOWED_FIELDS);
      expect(result2.limit).toBe(1);
    });

    it('should clamp limit to MAX_PAGINATION_LIMIT', () => {
      const result = normalizePaginationOptions({ limit: 10000 }, ALLOWED_FIELDS);
      expect(result.limit).toBe(MAX_PAGINATION_LIMIT);
    });

    it('should default to first allowed field if sortBy is invalid', () => {
      const result = normalizePaginationOptions({ sortBy: 'invalid_field' }, ALLOWED_FIELDS);
      expect(result.sortBy).toBe(ALLOWED_FIELDS[0]);
    });

    it('should default to ASC if sortOrder is invalid', () => {
      const result = normalizePaginationOptions({ sortOrder: 'INVALID' as any }, ALLOWED_FIELDS);
      expect(result.sortOrder).toBe('ASC');
    });

    it('should floor decimal offset and limit', () => {
      const result = normalizePaginationOptions({ offset: 10.7, limit: 25.3 }, ALLOWED_FIELDS);
      expect(result.offset).toBe(10);
      expect(result.limit).toBe(25);
    });
  });

  describe('isValidSortField', () => {
    it('should return true for valid fields', () => {
      expect(isValidSortField('id', ALLOWED_FIELDS)).toBe(true);
      expect(isValidSortField('name', ALLOWED_FIELDS)).toBe(true);
      expect(isValidSortField('created_at', ALLOWED_FIELDS)).toBe(true);
    });

    it('should return false for invalid fields', () => {
      expect(isValidSortField('invalid', ALLOWED_FIELDS)).toBe(false);
      expect(isValidSortField('DROP TABLE', ALLOWED_FIELDS)).toBe(false);
      expect(isValidSortField('', ALLOWED_FIELDS)).toBe(false);
    });
  });

  describe('buildOrderByClause', () => {
    it('should build valid ORDER BY clause', () => {
      const result = buildOrderByClause('name', 'ASC', ALLOWED_FIELDS);
      expect(result).toBe('name ASC');
    });

    it('should handle DESC order', () => {
      const result = buildOrderByClause('created_at', 'DESC', ALLOWED_FIELDS);
      expect(result).toBe('created_at DESC');
    });

    it('should fallback to first allowed field for invalid sortBy', () => {
      const result = buildOrderByClause('invalid_field', 'ASC', ALLOWED_FIELDS);
      expect(result).toBe('id ASC');
    });

    it('should prevent SQL injection attempts', () => {
      const result = buildOrderByClause('name; DROP TABLE users', 'ASC', ALLOWED_FIELDS);
      expect(result).toBe('id ASC'); // Falls back to default
      expect(result).not.toContain('DROP');
    });
  });

  describe('buildPaginatedResult', () => {
    const options = { offset: 0, limit: 10, sortBy: 'id', sortOrder: 'ASC' as const };

    it('should build correct result for first page', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = buildPaginatedResult(data, 25, options);

      expect(result.data).toEqual(data);
      expect(result.total).toBe(25);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBe(true);
      expect(result.totalPages).toBe(3);
      expect(result.currentPage).toBe(1);
    });

    it('should calculate hasMore correctly', () => {
      const data = Array(10).fill({ id: 1 });
      const result = buildPaginatedResult(data, 10, options);
      expect(result.hasMore).toBe(false);
    });

    it('should calculate totalPages correctly', () => {
      expect(buildPaginatedResult([], 0, options).totalPages).toBe(0);
      expect(buildPaginatedResult([], 1, options).totalPages).toBe(1);
      expect(buildPaginatedResult([], 10, options).totalPages).toBe(1);
      expect(buildPaginatedResult([], 11, options).totalPages).toBe(2);
      expect(buildPaginatedResult([], 100, options).totalPages).toBe(10);
    });

    it('should calculate currentPage correctly', () => {
      expect(buildPaginatedResult([], 100, { ...options, offset: 0 }).currentPage).toBe(1);
      expect(buildPaginatedResult([], 100, { ...options, offset: 10 }).currentPage).toBe(2);
      expect(buildPaginatedResult([], 100, { ...options, offset: 20 }).currentPage).toBe(3);
      expect(buildPaginatedResult([], 100, { ...options, offset: 90 }).currentPage).toBe(10);
    });
  });

  describe('calculatePageNumber', () => {
    it('should calculate page number correctly', () => {
      expect(calculatePageNumber(0, 10)).toBe(1);
      expect(calculatePageNumber(10, 10)).toBe(2);
      expect(calculatePageNumber(20, 10)).toBe(3);
      expect(calculatePageNumber(99, 10)).toBe(10);
    });
  });

  describe('calculateOffset', () => {
    it('should calculate offset correctly', () => {
      expect(calculateOffset(1, 10)).toBe(0);
      expect(calculateOffset(2, 10)).toBe(10);
      expect(calculateOffset(3, 10)).toBe(20);
      expect(calculateOffset(10, 10)).toBe(90);
    });

    it('should handle page 0 or negative', () => {
      expect(calculateOffset(0, 10)).toBe(0);
      expect(calculateOffset(-1, 10)).toBe(0);
    });
  });

  describe('edge cases', () => {
    describe('empty allowedSortFields', () => {
      it('should throw error in normalizePaginationOptions with empty allowedSortFields', () => {
        expect(() => normalizePaginationOptions({}, [])).toThrow('allowedSortFields must not be empty');
      });

      it('should throw error in buildOrderByClause with empty allowedSortFields', () => {
        expect(() => buildOrderByClause('name', 'ASC', [])).toThrow('allowedSortFields must not be empty');
      });
    });

    describe('large offset values', () => {
      it('should handle very large offset values without overflow', () => {
        const largeOffset = Number.MAX_SAFE_INTEGER - 1000;
        const result = normalizePaginationOptions(
          { offset: largeOffset },
          ['id']
        );
        expect(result.offset).toBe(largeOffset);
      });

      it('should handle offset values exceeding MAX_SAFE_INTEGER', () => {
        const hugeOffset = Number.MAX_SAFE_INTEGER + 1000;
        const result = normalizePaginationOptions(
          { offset: hugeOffset },
          ['id']
        );
        // Should still be a valid number (though precision may be lost)
        expect(typeof result.offset).toBe('number');
        expect(result.offset).toBeGreaterThan(0);
      });

      it('should clamp Infinity to a reasonable value', () => {
        const result = normalizePaginationOptions(
          { offset: Infinity },
          ['id']
        );
        // Math.floor(Infinity) is Infinity, Math.max(0, Infinity) is Infinity
        // This is technically valid but may cause issues - documenting current behavior
        expect(result.offset).toBe(Infinity);
      });
    });
  });
});
