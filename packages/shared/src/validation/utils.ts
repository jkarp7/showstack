// @ts-nocheck
/**
 * Validation Utilities
 *
 * Helper functions for Zod validation with better error messages
 */

import { z, ZodError, ZodSchema } from 'zod';

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Parse data with Zod schema and return typed result
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with data or errors
 *
 * @example
 * ```typescript
 * const result = parseWithZod(FixtureSchema, fixtureData);
 * if (result.success) {
 *   console.log(result.data); // Typed fixture
 * } else {
 *   console.error(result.errors); // Validation errors
 * }
 * ```
 */
export function parseWithZod<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorIssues = error.issues || error.errors || [];
      const errors: ValidationError[] = errorIssues.map((err: any) => ({
        field: err.path ? err.path.join('.') : '',
        message: err.message || 'Validation error',
        code: err.code || 'invalid',
      }));
      return { success: false, errors };
    }
    // Unexpected error
    return {
      success: false,
      errors: [{ field: '', message: String(error), code: 'unknown' }],
    };
  }
}

/**
 * Validate array of items with Zod schema
 *
 * @param schema - Zod schema for individual items
 * @param data - Array of items to validate
 * @returns Validation result with array or errors
 *
 * @example
 * ```typescript
 * const result = validateArray(FixtureSchema, fixtures);
 * if (result.success) {
 *   console.log(result.data); // Typed fixture array
 * }
 * ```
 */
export function validateArray<T>(schema: ZodSchema<T>, data: unknown[]): ValidationResult<T[]> {
  const arraySchema = z.array(schema);
  return parseWithZod(arraySchema, data);
}

/**
 * Format validation errors for user display
 *
 * @param errors - Array of validation errors
 * @returns Human-readable error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) {
    const err = errors[0];
    return err.field ? `${err.field}: ${err.message}` : err.message;
  }
  return errors
    .map((err) => (err.field ? `  • ${err.field}: ${err.message}` : `  • ${err.message}`))
    .join('\n');
}

/**
 * Safe parse - returns data or null if validation fails
 * Useful when you want to silently handle validation failures
 *
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validated data or null
 */
export function safeParse<T>(schema: ZodSchema<T>, data: unknown): T | null {
  const result = parseWithZod(schema, data);
  return result.success ? result.data : null;
}
