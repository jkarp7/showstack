/**
 * Custom error types for validation failures
 * Provides structured error handling with specific error types
 */

/**
 * Thrown when a path traversal attempt is detected
 */
export class PathTraversalError extends Error {
  constructor(path: string) {
    super(`Path traversal detected: ${path}`);
    this.name = 'PathTraversalError';
  }
}

/**
 * Thrown when a null byte is detected in a path
 */
export class NullByteError extends Error {
  constructor(path: string) {
    super(`Null byte detected in path (security violation): ${path}`);
    this.name = 'NullByteError';
  }
}

/**
 * Thrown when a file type is not in the allowed list
 */
export class InvalidFileTypeError extends Error {
  public readonly actualType: string;
  public readonly allowedTypes: string[];

  constructor(actualType: string | undefined, allowedTypes: string[]) {
    const typeStr = actualType || 'unknown';
    super(`Invalid file type: ${typeStr}. Allowed: ${allowedTypes.join(', ')}`);
    this.name = 'InvalidFileTypeError';
    this.actualType = typeStr;
    this.allowedTypes = allowedTypes;
  }
}

/**
 * Thrown when a file exceeds the maximum allowed size
 */
export class FileSizeExceededError extends Error {
  public readonly actualSize: number;
  public readonly maxSize: number;

  constructor(actualSize: number, maxSize: number) {
    const actualMB = (actualSize / 1024 / 1024).toFixed(2);
    const maxMB = (maxSize / 1024 / 1024).toFixed(2);
    super(`File size ${actualMB}MB exceeds maximum allowed size of ${maxMB}MB`);
    this.name = 'FileSizeExceededError';
    this.actualSize = actualSize;
    this.maxSize = maxSize;
  }
}

/**
 * Thrown when a file is not found
 */
export class FileNotFoundError extends Error {
  constructor(path: string) {
    super(`File not found: ${path}`);
    this.name = 'FileNotFoundError';
  }
}

/**
 * Thrown when a path is invalid or malformed
 */
export class InvalidPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPathError';
  }
}
