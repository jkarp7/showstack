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

import { Database } from 'sql.js';
import { databaseManager } from './core/DatabaseManager';
import { databaseWriter } from './persistence/DatabaseWriter';
import { errorHandler } from '../errors';

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
export function getAppDatabase(): Database {
  return databaseManager.getAppDatabase();
}

/**
 * Get the project-level database (all project data)
 * Backwards compatible with existing code
 */
export function getDatabase(): Database {
  return databaseManager.getProjectDatabase();
}

/**
 * Save app database to disk
 * Backwards compatible with existing code
 */
export function saveAppDatabase(): void {
  const db = databaseManager.getAppDatabase();
  const { appDbPath } = databaseManager.getPaths();
  databaseWriter.save(db, appDbPath, 'app');
}

/**
 * Save project database to disk
 * Backwards compatible with existing code
 */
export function saveDatabase(): void {
  const db = databaseManager.getProjectDatabase();
  const { projectDbPath } = databaseManager.getPaths();
  databaseWriter.save(db, projectDbPath, 'project');
}

// Alias for backwards compatibility
export const saveProjectDatabase = saveDatabase;

/**
 * Close both databases
 * Delegates to DatabaseManager
 */
export function closeDatabase(): void {
  // Save before closing
  try {
    saveAppDatabase();
  } catch (error) {
    console.error('Error saving app database before close:', error);
  }

  try {
    saveProjectDatabase();
  } catch (error) {
    console.error('Error saving project database before close:', error);
  }

  // Close connections
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
 * New function that uses error handler for resilience
 */
export async function saveBothDatabasesWithRetry(): Promise<void> {
  await errorHandler.executeWithRetry(
    async () => {
      const appDb = databaseManager.getAppDatabase();
      const projectDb = databaseManager.getProjectDatabase();
      const { appDbPath, projectDbPath } = databaseManager.getPaths();

      await databaseWriter.saveWithRetry(appDb, appDbPath, 'app');
      await databaseWriter.saveWithRetry(projectDb, projectDbPath, 'project');
    },
    'database:save:both'
  );
}

/**
 * Export database manager for advanced usage
 */
export { databaseManager } from './core/DatabaseManager';
export { databaseWriter } from './persistence/DatabaseWriter';

/**
 * Export Database type for convenience
 */
export type { Database };
