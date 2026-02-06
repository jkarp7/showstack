import * as path from 'path';
import { app } from 'electron';
import { PathTraversalError, NullByteError, InvalidPathError } from './errors';

/**
 * Path validation utilities for security
 * Prevents path traversal attacks and validates file paths
 */

/**
 * Check if a path contains null bytes (security vulnerability)
 */
export function containsNullByte(filePath: string): boolean {
  return filePath.includes('\x00');
}

/**
 * Check if a path attempts relative path traversal
 */
export function hasPathTraversal(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return normalized.includes('..') || filePath.includes('../') || filePath.includes('..\\');
}

/**
 * Check if a path is within allowed directories
 * Allowed: app data directory, user's home directory, temp directory
 *
 * Uses path.relative() to prevent edge cases like:
 * - /Users/test matching /Users/test-malicious
 * - Case sensitivity issues on Windows
 */
export function isPathAllowed(filePath: string): boolean {
  try {
    const normalized = path.resolve(filePath);

    // Get allowed base paths
    const appData = app.getPath('userData');
    const home = app.getPath('home');
    const temp = app.getPath('temp');
    const documents = app.getPath('documents');
    const downloads = app.getPath('downloads');
    const desktop = app.getPath('desktop');

    const allowedPaths = [appData, home, temp, documents, downloads, desktop];

    // Check if path is within any allowed base path using path.relative()
    // This prevents edge cases like /Users/test matching /Users/test-other
    return allowedPaths.some(allowed => {
      const resolvedAllowed = path.resolve(allowed);
      const relative = path.relative(resolvedAllowed, normalized);

      // Path is allowed if:
      // 1. relative is not empty (not the exact same path)
      // 2. relative doesn't start with '..' (not outside the directory)
      // 3. relative is not an absolute path (stays within the tree)
      return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    });
  } catch (error) {
    console.error('Error validating path:', error);
    return false;
  }
}

/**
 * Validate a file path for security vulnerabilities
 * @throws InvalidPathError if path is not a valid string
 * @throws NullByteError if path contains null bytes
 * @throws PathTraversalError if path contains traversal attempts
 */
export function validateFilePath(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw new InvalidPathError('File path must be a non-empty string');
  }

  if (containsNullByte(filePath)) {
    throw new NullByteError(filePath);
  }

  if (hasPathTraversal(filePath)) {
    throw new PathTraversalError(filePath);
  }

  // Note: We allow paths outside allowed directories if they come from
  // Electron file dialogs, which are trusted. This is more of a defense-in-depth
  // check for future code that might accept user-provided paths directly.
}

/**
 * Validate and sanitize a file path
 * @returns Normalized, validated file path
 * @throws Error if path is invalid or unsafe
 */
export function sanitizeFilePath(filePath: string): string {
  validateFilePath(filePath);
  return path.normalize(filePath);
}
