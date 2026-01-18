/**
 * Error Sanitization Utility
 *
 * Sanitizes error messages before sending to renderer process to prevent
 * information disclosure (file paths, system details, stack traces).
 */

import { InvalidFileTypeError, FileSizeExceededError, FileNotFoundError, PathTraversalError, NullByteError, InvalidPathError } from './errors';
import * as path from 'path';

/**
 * Sanitize file paths in error messages
 * Replaces absolute paths with just the filename
 */
export function sanitizeFilePath(filePath: string): string {
  if (!filePath) return 'unknown file';

  try {
    // Handle both Unix and Windows paths
    const unixMatch = filePath.match(/\/([^/]+)$/);
    const windowsMatch = filePath.match(/\\([^\\]+)$/);

    if (unixMatch) return unixMatch[1];
    if (windowsMatch) return windowsMatch[1];

    // Fallback to path.basename
    return path.basename(filePath);
  } catch {
    return 'unknown file';
  }
}

/**
 * Sanitize error for renderer consumption
 * Strips sensitive information while preserving useful context
 */
export function sanitizeError(error: unknown): string {
  // Handle structured error types
  if (error instanceof InvalidFileTypeError) {
    return `Invalid file type: ${error.actualType}. Allowed: ${error.allowedTypes.join(', ')}`;
  }

  if (error instanceof FileSizeExceededError) {
    const actualMB = (error.actualSize / 1024 / 1024).toFixed(2);
    const maxMB = (error.maxSize / 1024 / 1024).toFixed(2);
    return `File size ${actualMB}MB exceeds maximum allowed size of ${maxMB}MB`;
  }

  if (error instanceof FileNotFoundError) {
    // Extract filename from message, don't expose full path
    const match = error.message.match(/File not found: (.+)/);
    const fileName = match ? sanitizeFilePath(match[1]) : 'file';
    return `File not found: ${fileName}`;
  }

  if (error instanceof PathTraversalError) {
    return 'Invalid file path (security violation detected)';
  }

  if (error instanceof NullByteError) {
    return 'Invalid file path (security violation detected)';
  }

  if (error instanceof InvalidPathError) {
    return 'Invalid file path';
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    // Strip file paths from generic error messages
    let message = error.message;

    // Remove absolute Unix paths (aggressive - replaces with filename only)
    // Support Unicode characters in paths
    message = message.replace(/\/[^/\s]+\/([^/\s]+)/gu, (_, filename) => filename);
    // Remove remaining Unix path patterns
    message = message.replace(/\/[^/\s]+/gu, (match) => {
      // If it looks like a path (contains /), sanitize it
      if (match.includes('/') && match.length > 10) {
        return sanitizeFilePath(match);
      }
      return match;
    });

    // Remove absolute Windows paths (aggressive - replaces with filename only)
    message = message.replace(/[A-Z]:\\[\w\\-_.~]+\\([\w\-_.]+)/gi, (_, filename) => filename);
    // Remove remaining Windows path patterns
    message = message.replace(/[A-Z]:\\[\w\\-_.~]+/gi, (match) => {
      if (match.length > 10) {
        return sanitizeFilePath(match);
      }
      return match;
    });

    // Remove stack traces
    message = message.split('\n')[0];

    // Remove system-specific error codes (e.g., ENOENT, EACCES)
    message = message.replace(/\b(ENOENT|EACCES|EPERM|EISDIR|ENOTDIR|EMFILE|ENFILE)\b/g, '');

    return message.trim();
  }

  // Handle non-Error thrown values
  if (typeof error === 'string') {
    return sanitizeError(new Error(error));
  }

  // Fallback for unknown error types
  return 'An error occurred';
}

/**
 * Sanitize error for logging (preserves more detail than sanitizeError)
 * Safe to log to console/files but not send to renderer
 */
export function sanitizeErrorForLogging(error: unknown): string {
  if (error instanceof Error) {
    // Keep full error message but remove stack trace
    return error.message.split('\n')[0];
  }

  if (typeof error === 'string') {
    return error.split('\n')[0];
  }

  return 'Unknown error';
}

/**
 * Create a user-friendly error message with sanitized details
 */
export function createUserFriendlyError(error: unknown, context?: string): string {
  const sanitized = sanitizeError(error);

  if (context) {
    return `${context}: ${sanitized}`;
  }

  return sanitized;
}
