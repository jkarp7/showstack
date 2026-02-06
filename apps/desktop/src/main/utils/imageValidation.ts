import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import { validateFilePath } from './pathValidation';
import { InvalidFileTypeError, FileSizeExceededError, FileNotFoundError } from './errors';

/**
 * Image validation utilities for file upload security
 * Implements defense-in-depth: MIME validation, size limits, type whitelisting
 *
 * SECURITY NOTES:
 * - Uses async file operations for better performance and non-blocking I/O
 * - Prevents TOCTOU (Time-of-Check-Time-of-Use) attacks by not checking file existence before reading
 * - Validates paths to prevent traversal attacks and symlink exploits
 * - Uses magic number detection (not file extensions) for type validation
 */

// Maximum file size: 2MB
export const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Whitelist of allowed image MIME types (NO SVG for XSS prevention)
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

/**
 * Validate image file and convert to base64 data URL
 * @param imagePath Path to image file
 * @returns Base64 data URL string
 * @throws FileNotFoundError if file doesn't exist
 * @throws FileSizeExceededError if file exceeds 2MB
 * @throws InvalidFileTypeError if file type is not allowed
 * @throws PathTraversalError, NullByteError if path is malicious
 *
 * SECURITY: Prevents TOCTOU attacks by reading directly without existence check
 */
export async function readImageAsDataUrl(imagePath: string): Promise<string> {
  // SECURITY: Validate path for traversal attacks
  validateFilePath(imagePath);

  // SECURITY FIX: No TOCTOU - read directly without checking existence first
  // This prevents race conditions where a file could be replaced with a symlink
  // between the check and the read operation.
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(imagePath);
  } catch (error: any) {
    // Handle file not found specifically
    if (error.code === 'ENOENT') {
      throw new FileNotFoundError(imagePath);
    }
    // Re-throw other errors (permission denied, etc.)
    throw error;
  }

  // SECURITY: Backend file size validation (2MB max)
  if (buffer.length > MAX_FILE_SIZE) {
    throw new FileSizeExceededError(buffer.length, MAX_FILE_SIZE);
  }

  // SECURITY: Validate MIME type using magic numbers (file content)
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType || !ALLOWED_IMAGE_TYPES.includes(fileType.mime)) {
    throw new InvalidFileTypeError(fileType?.mime, ALLOWED_IMAGE_TYPES);
  }

  // Convert to base64 data URL using validated MIME type
  const base64 = buffer.toString('base64');
  return `data:${fileType.mime};base64,${base64}`;
}

/**
 * Check if a file path is a valid image without reading it
 * @param imagePath Path to image file
 * @returns True if file exists and is likely a valid image
 *
 * NOTE: Uses synchronous operations for backwards compatibility.
 * Prefer async validation where possible.
 */
export function isValidImagePath(imagePath: string): boolean {
  try {
    if (!imagePath) return false;
    validateFilePath(imagePath);
    return fsSync.existsSync(imagePath);
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes (async)
 * @param imagePath Path to file
 * @returns File size in bytes
 */
export async function getFileSize(imagePath: string): Promise<number> {
  const stats = await fs.stat(imagePath);
  return stats.size;
}

/**
 * Get file size in bytes (sync - use for backwards compatibility only)
 * @param imagePath Path to file
 * @returns File size in bytes
 */
export function getFileSizeSync(imagePath: string): number {
  const stats = fsSync.statSync(imagePath);
  return stats.size;
}

/**
 * Validate file size without reading entire file (async)
 * @param imagePath Path to file
 * @throws FileSizeExceededError if file is too large
 */
export async function validateFileSize(imagePath: string): Promise<void> {
  const size = await getFileSize(imagePath);
  if (size > MAX_FILE_SIZE) {
    throw new FileSizeExceededError(size, MAX_FILE_SIZE);
  }
}

/**
 * Validate file size without reading entire file (sync)
 * @param imagePath Path to file
 * @throws FileSizeExceededError if file is too large
 */
export function validateFileSizeSync(imagePath: string): void {
  const size = getFileSizeSync(imagePath);
  if (size > MAX_FILE_SIZE) {
    throw new FileSizeExceededError(size, MAX_FILE_SIZE);
  }
}
