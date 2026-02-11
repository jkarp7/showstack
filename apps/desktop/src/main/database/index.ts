/**
 * Database Module - Main Export File
 *
 * This file provides a clean facade over the database system.
 * All heavy lifting is delegated to specialized modules:
 * - DatabaseManager: initialization and lifecycle
 * - MigrationRunner: schema migrations
 * - DatabaseWriter: file persistence
 *
 * Reduced from 881 lines to ~120 lines through modularization.
 */

import Database from 'better-sqlite3';
import { databaseManager } from './core/DatabaseManager';
import { logger } from '../utils/logger';

/**
 * Initialize both app and project databases
 * Delegates to DatabaseManager
 */
export async function initDatabase(): Promise<void> {
  await databaseManager.initialize();
}

/**
 * Get the app-level database (licenses, settings, templates)
 * Backwards compatible with existing code
 */
export function getAppDatabase(): Database.Database {
  return databaseManager.getAppDatabase();
}

/**
 * Get the project-level database (all project data)
 * Backwards compatible with existing code
 */
export function getDatabase(): Database.Database {
  return databaseManager.getProjectDatabase();
}

/**
 * Save app database to disk
 * NOTE: With better-sqlite3's WAL mode, this is a no-op.
 * All writes are automatically persisted to disk.
 * Kept for backwards compatibility with existing code.
 */
export function saveAppDatabase(): void {
  // WAL mode handles auto-persistence - no manual save needed
  logger.info('[Database] saveAppDatabase() called - WAL mode handles auto-persistence');
}

/**
 * Save project database to disk
 * NOTE: With better-sqlite3's WAL mode, this is a no-op.
 * All writes are automatically persisted to disk.
 * Kept for backwards compatibility with existing code.
 */
export function saveDatabase(): void {
  // WAL mode handles auto-persistence - no manual save needed
  logger.info('[Database] saveDatabase() called - WAL mode handles auto-persistence');
}

// Alias for backwards compatibility
export const saveProjectDatabase = saveDatabase;

/**
 * Close both databases
 * Delegates to DatabaseManager
 * NOTE: With WAL mode, no manual save is needed before closing
 */
export function closeDatabase(): void {
  // WAL mode auto-persists, so we just close connections
  databaseManager.close();
}

/**
 * Reload project database from disk
 * Delegates to DatabaseManager
 */
export async function reloadDatabase(): Promise<void> {
  await databaseManager.reloadProjectDatabase();
}

/**
 * Replace project database with imported file
 * IMPORTANT: Only replaces PROJECT database, never touches APP database
 */
export async function replaceProjectDatabase(importedData: Uint8Array): Promise<void> {
  await databaseManager.replaceProjectDatabase(importedData);
}

/**
 * Save both databases to disk with retry logic
 * NOTE: With better-sqlite3's WAL mode, this is a no-op.
 * All writes are automatically persisted to disk.
 * Kept for backwards compatibility with existing code.
 */
export async function saveBothDatabasesWithRetry(): Promise<void> {
  // WAL mode handles auto-persistence - no manual save needed
  logger.info('[Database] saveBothDatabasesWithRetry() called - WAL mode handles auto-persistence');
}

/**
 * Export database manager and transaction support for advanced usage
 */
export { databaseManager } from './core/DatabaseManager';
export { databaseWriter } from './persistence/DatabaseWriter';
export { TransactionManager, createTransactionManager } from './core/TransactionManager';

/**
 * Export bulk operations utilities
 */
export {
  bulkInsert,
  bulkUpdate,
  bulkDelete,
  bulkUpsert,
  executeInTransaction,
} from './utils/bulkOperations';

/**
 * Export Database type for convenience
 */
export type { Database };
