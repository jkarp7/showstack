/**
 * Pagination Utilities
 *
 * Helper functions and types for paginated database queries.
 * Provides consistent pagination patterns across all query modules.
 */

/**
 * Options for paginated queries
 */
export interface PaginationOptions {
  /** Number of items to skip (0-based) */
  offset: number;
  /** Maximum number of items to return */
  limit: number;
  /** Field to sort by (must be in allowedSortFields) */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Result of a paginated query
 */
export interface PaginatedResult<T> {
  /** The data items for the current page */
  data: T[];
  /** Total number of items matching the query (before pagination) */
  total: number;
  /** The offset used */
  offset: number;
  /** The limit used */
  limit: number;
  /** Whether there are more items after this page */
  hasMore: boolean;
  /** Total number of pages */
  totalPages: number;
  /** Current page number (1-based) */
  currentPage: number;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION = {
  offset: 0,
  limit: 50,
  sortOrder: 'ASC' as const
} as const;

/**
 * Maximum allowed limit to prevent memory issues
 */
export const MAX_PAGINATION_LIMIT = 1000;

/**
 * Validate and normalize pagination options
 *
 * @param options - Raw pagination options from user
 * @param allowedSortFields - List of valid sort field names
 * @returns Normalized and validated pagination options
 */
export function normalizePaginationOptions(
  options: Partial<PaginationOptions>,
  allowedSortFields: readonly string[]
): Required<PaginationOptions> {
  if (allowedSortFields.length === 0) {
    throw new Error('allowedSortFields must not be empty');
  }

  // Handle Infinity/NaN edge cases - fall back to defaults for non-finite values
  const rawOffset = options.offset ?? DEFAULT_PAGINATION.offset;
  const rawLimit = options.limit ?? DEFAULT_PAGINATION.limit;

  const offset = Math.max(0, Math.floor(
    Number.isFinite(rawOffset) ? rawOffset : DEFAULT_PAGINATION.offset
  ));
  const limit = Math.min(
    MAX_PAGINATION_LIMIT,
    Math.max(1, Math.floor(
      Number.isFinite(rawLimit) ? rawLimit : DEFAULT_PAGINATION.limit
    ))
  );

  // Validate sortBy against allowed fields
  let sortBy = allowedSortFields[0]; // Default to first allowed field
  if (options.sortBy && allowedSortFields.includes(options.sortBy)) {
    sortBy = options.sortBy;
  }

  const sortOrder = options.sortOrder === 'DESC' ? 'DESC' : 'ASC';

  return { offset, limit, sortBy, sortOrder };
}

/**
 * Validate a sort field name against an allow list.
 * This is critical for SQL injection prevention.
 *
 * @param field - The field name to validate
 * @param allowedFields - List of valid field names
 * @returns true if the field is in the allow list
 */
export function isValidSortField(
  field: string,
  allowedFields: readonly string[]
): boolean {
  return allowedFields.includes(field);
}

/**
 * Build ORDER BY clause for a paginated query.
 * Only uses fields from the allowedSortFields list for security.
 *
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort direction
 * @param allowedSortFields - List of valid sort field names
 * @returns SQL ORDER BY clause (without the "ORDER BY" keyword)
 */
export function buildOrderByClause(
  sortBy: string,
  sortOrder: 'ASC' | 'DESC',
  allowedSortFields: readonly string[]
): string {
  if (allowedSortFields.length === 0) {
    throw new Error('allowedSortFields must not be empty');
  }

  // Validate sortBy is in allowed list (critical for SQL injection prevention)
  const validSortBy = isValidSortField(sortBy, allowedSortFields)
    ? sortBy
    : allowedSortFields[0];

  const validSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';

  return `${validSortBy} ${validSortOrder}`;
}

/**
 * Build a paginated result object from query results
 *
 * @param data - The data items for the current page
 * @param total - Total number of items matching the query
 * @param options - The pagination options used
 * @returns Complete paginated result object
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  options: Required<PaginationOptions>
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / options.limit);
  const currentPage = Math.floor(options.offset / options.limit) + 1;
  const hasMore = options.offset + data.length < total;

  return {
    data,
    total,
    offset: options.offset,
    limit: options.limit,
    hasMore,
    totalPages,
    currentPage
  };
}

/**
 * Helper to create a paginated query executor.
 * Reduces boilerplate in query modules.
 *
 * @example
 * ```typescript
 * const FIXTURE_SORT_FIELDS = ['position', 'unit_number', 'channel', 'created_at'] as const;
 *
 * export function getFixturesPaginated(
 *   projectId: string,
 *   options: Partial<PaginationOptions>
 * ): PaginatedResult<Fixture> {
 *   const normalized = normalizePaginationOptions(options, FIXTURE_SORT_FIELDS);
 *   const orderBy = buildOrderByClause(normalized.sortBy, normalized.sortOrder, FIXTURE_SORT_FIELDS);
 *
 *   const db = getDatabase();
 *
 *   const total = db.prepare(
 *     'SELECT COUNT(*) as count FROM fixtures WHERE project_id = ?'
 *   ).get(projectId) as { count: number };
 *
 *   const data = db.prepare(
 *     `SELECT * FROM fixtures WHERE project_id = ? ORDER BY ${orderBy} LIMIT ? OFFSET ?`
 *   ).all(projectId, normalized.limit, normalized.offset) as Fixture[];
 *
 *   return buildPaginatedResult(data, total.count, normalized);
 * }
 * ```
 */

/**
 * Calculate the page number for a given offset and limit
 *
 * @param offset - Current offset
 * @param limit - Items per page
 * @returns 1-based page number
 */
export function calculatePageNumber(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}

/**
 * Calculate the offset for a given page number and limit
 *
 * @param page - 1-based page number
 * @param limit - Items per page
 * @returns Offset value
 */
export function calculateOffset(page: number, limit: number): number {
  return Math.max(0, (page - 1) * limit);
}
