/**
 * Base Entity Schema
 *
 * Common fields shared across all entities in ShowStack
 */

import { z } from 'zod';

/**
 * Base entity with common fields
 * All entities extend this schema
 */
export const BaseEntitySchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
  created_at: z.number().int().positive('Created timestamp must be positive'),
  updated_at: z.number().int().positive('Updated timestamp must be positive'),
});

/**
 * Base entity type (inferred from schema)
 */
export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * Helper to create entity schema that extends BaseEntitySchema
 *
 * @param fields - Additional fields for the entity
 * @returns Zod schema with base fields + custom fields
 *
 * @example
 * ```typescript
 * const UserSchema = extendBaseEntity({
 *   name: z.string(),
 *   email: z.string().email()
 * });
 * ```
 */
export function extendBaseEntity<T extends z.ZodRawShape>(fields: T) {
  return BaseEntitySchema.extend(fields);
}

/**
 * Timestamp validation helpers
 */
export const TimestampSchema = z.number().int().positive();

/**
 * Optional timestamp (can be null or undefined)
 */
export const OptionalTimestampSchema = z.number().int().positive().nullable().optional();

/**
 * ID validation (non-empty string)
 */
export const IDSchema = z.string().min(1, 'ID cannot be empty');

/**
 * Optional ID (can be null or undefined)
 */
export const OptionalIDSchema = z.string().min(1).nullable().optional();
