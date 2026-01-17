import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  readImageAsDataUrl,
  isValidImagePath,
  getFileSize,
  validateFileSize,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES
} from '../imageValidation';
import * as fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';

// Mock dependencies
vi.mock('fs');
vi.mock('file-type');
vi.mock('../pathValidation', () => ({
  validateFilePath: vi.fn((path: string) => {
    if (path.includes('..') || path.includes('\x00')) {
      throw new Error('Invalid path');
    }
  })
}));
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path')
  }
}));

/**
 * Comprehensive tests for image validation module
 * Tests actual handler logic with real function invocations
 */
describe('Image Validation Module', () => {
  const mockBuffer = Buffer.from('mock image data');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readImageAsDataUrl - Full Handler Logic', () => {
    it('should successfully process valid PNG image', async () => {
      const imagePath = '/Users/test/image.png';
      const imageBuffer = Buffer.from('PNG_DATA');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(imageBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png'
      });

      const result = await readImageAsDataUrl(imagePath);

      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(fs.existsSync).toHaveBeenCalledWith(imagePath);
      expect(fs.readFileSync).toHaveBeenCalledWith(imagePath);
      expect(fileTypeFromBuffer).toHaveBeenCalledWith(imageBuffer);
    });

    it('should successfully process valid JPEG image', async () => {
      const imagePath = '/Users/test/photo.jpg';
      const imageBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(imageBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'jpg',
        mime: 'image/jpeg'
      });

      const result = await readImageAsDataUrl(imagePath);

      expect(result).toMatch(/^data:image\/jpeg;base64,/);
      const base64Part = result.split(',')[1];
      expect(base64Part).toBe(imageBuffer.toString('base64'));
    });

    it('should successfully process valid GIF image', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'gif',
        mime: 'image/gif'
      });

      const result = await readImageAsDataUrl('/Users/test/animation.gif');

      expect(result).toMatch(/^data:image\/gif;base64,/);
    });

    it('should successfully process valid WebP image', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'webp',
        mime: 'image/webp'
      });

      const result = await readImageAsDataUrl('/Users/test/image.webp');

      expect(result).toMatch(/^data:image\/webp;base64,/);
    });

    it('should reject SVG files (XSS prevention)', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'svg',
        mime: 'image/svg+xml'
      });

      await expect(readImageAsDataUrl('/Users/test/image.svg'))
        .rejects.toThrow('Invalid image file type');
    });

    it('should reject executable files disguised as images', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'exe',
        mime: 'application/x-msdownload'
      });

      await expect(readImageAsDataUrl('/Users/test/virus.png'))
        .rejects.toThrow('Invalid image file type');
    });

    it('should reject files over 2MB', async () => {
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(largeBuffer);

      await expect(readImageAsDataUrl('/Users/test/large.png'))
        .rejects.toThrow('must be smaller');
    });

    it('should accept files exactly at 2MB limit', async () => {
      const maxBuffer = Buffer.alloc(2 * 1024 * 1024); // Exactly 2MB

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(maxBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png'
      });

      const result = await readImageAsDataUrl('/Users/test/max-size.png');
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should throw for non-existent files', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(readImageAsDataUrl('/nonexistent/file.png'))
        .rejects.toThrow('not found');
    });

    it('should throw for empty path', async () => {
      await expect(readImageAsDataUrl(''))
        .rejects.toThrow();
    });

    it('should throw for null path', async () => {
      await expect(readImageAsDataUrl(null as any))
        .rejects.toThrow();
    });

    it('should reject files with path traversal', async () => {
      await expect(readImageAsDataUrl('../../etc/passwd'))
        .rejects.toThrow('Invalid path');
    });

    it('should reject files with null byte injection', async () => {
      await expect(readImageAsDataUrl('image.png\x00.exe'))
        .rejects.toThrow('Invalid path');
    });

    it('should handle corrupted files gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

      await expect(readImageAsDataUrl('/Users/test/corrupted.png'))
        .rejects.toThrow('Invalid image file type');
    });

    it('should handle file read errors', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(readImageAsDataUrl('/restricted/file.png'))
        .rejects.toThrow('Permission denied');
    });

    it('should handle fileType detection errors', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockRejectedValue(new Error('Detection failed'));

      await expect(readImageAsDataUrl('/Users/test/unknown.png'))
        .rejects.toThrow('Detection failed');
    });
  });

  describe('isValidImagePath', () => {
    it('should return true for valid existing paths', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      expect(isValidImagePath('/Users/test/image.png')).toBe(true);
    });

    it('should return false for non-existent paths', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(isValidImagePath('/nonexistent/file.png')).toBe(false);
    });

    it('should return false for path traversal attempts', () => {
      expect(isValidImagePath('../../etc/passwd')).toBe(false);
    });

    it('should return false for null byte injection', () => {
      expect(isValidImagePath('file.png\x00.exe')).toBe(false);
    });

    it('should return false for invalid inputs', () => {
      expect(isValidImagePath('')).toBe(false);
      expect(isValidImagePath(null as any)).toBe(false);
    });
  });

  describe('getFileSize', () => {
    it('should return file size in bytes', () => {
      vi.mocked(fs.statSync).mockReturnValue({
        size: 1024 * 500, // 500KB
        isFile: () => true,
        isDirectory: () => false
      } as any);

      const size = getFileSize('/Users/test/file.png');
      expect(size).toBe(512000);
    });

    it('should work for small files', () => {
      vi.mocked(fs.statSync).mockReturnValue({
        size: 1024, // 1KB
        isFile: () => true,
        isDirectory: () => false
      } as any);

      const size = getFileSize('/Users/test/small.png');
      expect(size).toBe(1024);
    });

    it('should work for large files', () => {
      vi.mocked(fs.statSync).mockReturnValue({
        size: 5 * 1024 * 1024, // 5MB
        isFile: () => true,
        isDirectory: () => false
      } as any);

      const size = getFileSize('/Users/test/large.png');
      expect(size).toBe(5242880);
    });
  });

  describe('validateFileSize', () => {
    it('should pass for files under limit', () => {
      vi.mocked(fs.statSync).mockReturnValue({
        size: 1024 * 1024, // 1MB
        isFile: () => true,
        isDirectory: () => false
      } as any);

      expect(() => validateFileSize('/Users/test/small.png')).not.toThrow();
    });

    it('should throw for files over limit', () => {
      vi.mocked(fs.statSync).mockReturnValue({
        size: 3 * 1024 * 1024, // 3MB
        isFile: () => true,
        isDirectory: () => false
      } as any);

      expect(() => validateFileSize('/Users/test/large.png'))
        .toThrow('must be smaller');
    });

    it('should pass for files at exact limit', () => {
      vi.mocked(fs.statSync).mockReturnValue({
        size: 2 * 1024 * 1024, // Exactly 2MB
        isFile: () => true,
        isDirectory: () => false
      } as any);

      expect(() => validateFileSize('/Users/test/max.png')).not.toThrow();
    });
  });

  describe('Constants validation', () => {
    it('should have correct MAX_FILE_SIZE', () => {
      expect(MAX_FILE_SIZE).toBe(2 * 1024 * 1024);
      expect(MAX_FILE_SIZE).toBe(2097152);
    });

    it('should have correct ALLOWED_IMAGE_TYPES', () => {
      expect(ALLOWED_IMAGE_TYPES).toEqual([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ]);
      expect(ALLOWED_IMAGE_TYPES).toHaveLength(4);
    });

    it('should not include SVG in allowed types', () => {
      expect(ALLOWED_IMAGE_TYPES).not.toContain('image/svg+xml');
    });

    it('should not include TIFF in allowed types', () => {
      expect(ALLOWED_IMAGE_TYPES).not.toContain('image/tiff');
    });
  });

  describe('Base64 encoding validation', () => {
    it('should produce correctly formatted data URL', async () => {
      const testBuffer = Buffer.from('test image data');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(testBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png'
      });

      const result = await readImageAsDataUrl('/Users/test/test.png');

      const expectedBase64 = testBuffer.toString('base64');
      expect(result).toBe(`data:image/png;base64,${expectedBase64}`);
    });

    it('should correctly encode binary data', async () => {
      const binaryBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(binaryBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'jpg',
        mime: 'image/jpeg'
      });

      const result = await readImageAsDataUrl('/Users/test/binary.jpg');

      expect(result).toContain('base64,/9j/4A=='); // Base64 of JPEG header
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete upload flow for valid image', async () => {
      const imagePath = '/Users/test/Documents/photo.jpg';
      const imageData = Buffer.from('JPEG_IMAGE_DATA');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(imageData);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'jpg',
        mime: 'image/jpeg'
      });

      // Simulate complete handler flow
      const dataUrl = await readImageAsDataUrl(imagePath);

      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
      expect(fs.existsSync).toHaveBeenCalledWith(imagePath);
      expect(fs.readFileSync).toHaveBeenCalledWith(imagePath);
      expect(fileTypeFromBuffer).toHaveBeenCalled();
    });

    it('should reject complete flow for invalid file', async () => {
      const maliciousPath = '/Users/test/virus.exe';
      const exeData = Buffer.from('MZ'); // EXE header

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(exeData);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'exe',
        mime: 'application/x-msdownload'
      });

      await expect(readImageAsDataUrl(maliciousPath))
        .rejects.toThrow('Invalid image file type');
    });
  });
});
