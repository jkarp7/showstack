import * as fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import { validateFilePath } from './pathValidation';

/**
 * Image validation utilities for file upload security
 * Implements defense-in-depth: MIME validation, size limits, type whitelisting
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
 * @throws Error if validation fails
 */
export async function readImageAsDataUrl(imagePath: string): Promise<string> {
  // SECURITY: Validate path for traversal attacks
  validateFilePath(imagePath);

  // Check if file exists
  if (!imagePath || !fs.existsSync(imagePath)) {
    throw new Error('Image file not found');
  }

  // Read file as buffer
  const buffer = fs.readFileSync(imagePath);

  // SECURITY: Backend file size validation (2MB max)
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`Image must be smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // SECURITY: Validate MIME type using magic numbers (file content)
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType || !ALLOWED_IMAGE_TYPES.includes(fileType.mime)) {
    throw new Error('Invalid image file type. Allowed: PNG, JPG, GIF, WebP');
  }

  // Convert to base64 data URL using validated MIME type
  const base64 = buffer.toString('base64');
  return `data:${fileType.mime};base64,${base64}`;
}

/**
 * Check if a file path is a valid image without reading it
 * @param imagePath Path to image file
 * @returns True if file exists and is likely a valid image
 */
export function isValidImagePath(imagePath: string): boolean {
  try {
    if (!imagePath) return false;
    validateFilePath(imagePath);
    return fs.existsSync(imagePath);
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 * @param imagePath Path to file
 * @returns File size in bytes
 */
export function getFileSize(imagePath: string): number {
  const stats = fs.statSync(imagePath);
  return stats.size;
}

/**
 * Validate file size without reading entire file
 * @param imagePath Path to file
 * @throws Error if file is too large
 */
export function validateFileSize(imagePath: string): void {
  const size = getFileSize(imagePath);
  if (size > MAX_FILE_SIZE) {
    throw new Error(`Image must be smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
}
