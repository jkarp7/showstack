/**
 * @showstack/shared
 *
 * Shared types, schemas, and utilities for ShowStack monorepo
 *
 * This package contains:
 * - Zod validation schemas (Phase 2.2)
 * - Shared TypeScript types
 * - Common utilities
 */

export const SHARED_VERSION = '0.1.0-alpha';

// Validation schemas and utilities
export * from './validation';

// Auth utilities
export * from './auth/passwordPolicy';

// Network utilities and types
export * from './utils/networkValidation';
export * from './types/network';
