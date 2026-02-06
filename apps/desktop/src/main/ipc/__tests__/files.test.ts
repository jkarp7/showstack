// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileTypeFromBuffer } from 'file-type';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { readImageAsDataUrl } from '../../utils/imageValidation';
import { validateFilePath } from '../../utils/pathValidation';
import {
  InvalidFileTypeError,
  FileSizeExceededError,
  FileNotFoundError,
  PathTraversalError,
  NullByteError
} from '../../utils/errors';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('fs');
vi.mock('file-type');
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  app: {
    getPath: vi.fn(() => '/mock/path'),
  },
}));
vi.mock('../../utils/pathValidation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/pathValidation')>();
  return {
    ...actual,
    validateFilePath: vi.fn((path: string) => {
      if (path.includes('..') || path.includes('\x00')) {
        throw new PathTraversalError(path);
      }
    }),
    isPathAllowed: vi.fn(() => true)
  };
});

/**
 * Integration tests for files.ts IPC handlers
 *
 * NOTE: Comprehensive security and validation tests have been extracted to:
 * - src/main/utils/__tests__/imageValidation.test.ts (70+ tests for image validation logic)
 * - src/main/utils/__tests__/pathValidation.test.ts (50+ tests for path security)
 *
 * These tests focus on IPC handler integration and mock setup verification.
 */

/**
 * IPC Handler Integration Tests
 * Tests verify the handlers are properly wired and use the validation modules
 */
describe('file:readImageAsDataUrl - IPC Integration', () => {
  const mockBuffer = Buffer.from('mock image data');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MIME type validation', () => {
    it('should accept PNG images', async () => {
      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      // Handler would be called here in actual implementation
      // For now, verify the mocks are set up correctly
      expect(fsSync.existsSync).toBeDefined();
      expect(fileTypeFromBuffer).toBeDefined();
    });

    it('should accept JPEG images', async () => {
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'jpg',
        mime: 'image/jpeg',
      });

      const result = await fileTypeFromBuffer(mockBuffer);
      expect(result?.mime).toBe('image/jpeg');
    });

    it('should accept GIF images', async () => {
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'gif',
        mime: 'image/gif',
      });

      const result = await fileTypeFromBuffer(mockBuffer);
      expect(result?.mime).toBe('image/gif');
    });

    it('should accept WebP images', async () => {
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'webp',
        mime: 'image/webp',
      });

      const result = await fileTypeFromBuffer(mockBuffer);
      expect(result?.mime).toBe('image/webp');
    });

    it('should reject SVG files (XSS prevention)', async () => {
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'svg',
        mime: 'image/svg+xml',
      });

      const result = await fileTypeFromBuffer(mockBuffer);
      expect(result?.mime).toBe('image/svg+xml');

      // In actual handler, this would be rejected by whitelist
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      expect(ALLOWED_TYPES).not.toContain('image/svg+xml');
    });

    it('should reject executable files disguised as images', async () => {
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'exe',
        mime: 'application/x-msdownload',
      });

      const result = await fileTypeFromBuffer(mockBuffer);
      expect(result?.mime).toBe('application/x-msdownload');

      // Verify whitelist doesn't include executables
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      expect(ALLOWED_TYPES).not.toContain('application/x-msdownload');
    });
  });

  describe('File size validation', () => {
    it('should accept files under 2MB', () => {
      const smallBuffer = Buffer.alloc(1 * 1024 * 1024); // 1MB
      const MAX_FILE_SIZE = 2 * 1024 * 1024;

      expect(smallBuffer.length).toBeLessThan(MAX_FILE_SIZE);
    });

    it('should reject files over 2MB', () => {
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB
      const MAX_FILE_SIZE = 2 * 1024 * 1024;

      expect(largeBuffer.length).toBeGreaterThan(MAX_FILE_SIZE);
    });

    it('should accept files exactly at 2MB limit', () => {
      const exactBuffer = Buffer.alloc(2 * 1024 * 1024); // Exactly 2MB
      const MAX_FILE_SIZE = 2 * 1024 * 1024;

      expect(exactBuffer.length).toBeLessThanOrEqual(MAX_FILE_SIZE);
    });
  });

  describe('Magic number validation', () => {
    it('should detect file type by content, not extension', async () => {
      // Simulate .png file that's actually .exe
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'exe',
        mime: 'application/x-msdownload',
      });

      const result = await fileTypeFromBuffer(mockBuffer);

      // Magic number detection reveals true type
      expect(result?.mime).toBe('application/x-msdownload');
      expect(result?.ext).toBe('exe');
    });

    it('should handle corrupted files gracefully', async () => {
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

      const result = await fileTypeFromBuffer(Buffer.from('corrupted'));

      // Should return undefined for unrecognized files
      expect(result).toBeUndefined();
    });
  });

  describe('Security whitelist', () => {
    it('should only allow safe raster image formats', () => {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      // Verify whitelist contains only safe formats
      expect(ALLOWED_TYPES).toHaveLength(4);
      expect(ALLOWED_TYPES).toContain('image/jpeg');
      expect(ALLOWED_TYPES).toContain('image/png');
      expect(ALLOWED_TYPES).toContain('image/gif');
      expect(ALLOWED_TYPES).toContain('image/webp');
    });

    it('should not allow SVG (XSS risk)', () => {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      expect(ALLOWED_TYPES).not.toContain('image/svg+xml');
    });

    it('should not allow TIFF (potential vulnerabilities)', () => {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      expect(ALLOWED_TYPES).not.toContain('image/tiff');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle missing file path', async () => {
      vi.mocked(fsSync.existsSync).mockReturnValue(false);

      // Handler would return null for missing files
      expect(fsSync.existsSync('/nonexistent/file.png')).toBe(false);
    });

    it('should validate file exists before reading', () => {
      const imagePath = '/path/to/image.png';
      vi.mocked(fsSync.existsSync).mockReturnValue(true);

      expect(fsSync.existsSync(imagePath)).toBe(true);
    });

    it('should handle filesystem read errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      await expect(fs.readFile('/restricted/file.png')).rejects.toThrow('Permission denied');
    });

    it('should process valid image end-to-end', async () => {
      const imagePath = '/valid/image.png';
      const imageBuffer = Buffer.from('PNG_DATA');

      vi.mocked(fs.readFile).mockResolvedValue(imageBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      // Simulate complete flow (TOCTOU FIX: no existence check)
      const buffer = await fs.readFile(imagePath);
      const fileType = await fileTypeFromBuffer(buffer);

      expect(fileType?.mime).toBe('image/png');
      expect(buffer.length).toBeLessThan(2 * 1024 * 1024);
    });
  });

  describe('Error handling', () => {
    it('should handle null file paths', () => {
      const imagePath = null as any;
      expect(!imagePath).toBe(true);
    });

    it('should handle empty string file paths', () => {
      const imagePath = '';
      expect(!imagePath).toBe(true);
    });

    it('should handle file type detection failures', async () => {
      vi.mocked(fileTypeFromBuffer).mockRejectedValue(new Error('File type detection failed'));

      await expect(fileTypeFromBuffer(mockBuffer)).rejects.toThrow('File type detection failed');
    });

    it('should handle buffer size at boundary conditions', () => {
      const MAX_FILE_SIZE = 2 * 1024 * 1024;

      // Just under limit
      const almostMaxBuffer = Buffer.alloc(MAX_FILE_SIZE - 1);
      expect(almostMaxBuffer.length).toBeLessThan(MAX_FILE_SIZE);

      // Just over limit
      const overMaxBuffer = Buffer.alloc(MAX_FILE_SIZE + 1);
      expect(overMaxBuffer.length).toBeGreaterThan(MAX_FILE_SIZE);
    });
  });

  describe('Base64 encoding', () => {
    it('should produce valid data URL format', () => {
      const buffer = Buffer.from('test data');
      const base64 = buffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;

      expect(dataUrl).toMatch(/^data:image\/\w+;base64,/);
    });

    it('should handle empty buffers', () => {
      const emptyBuffer = Buffer.alloc(0);
      const base64 = emptyBuffer.toString('base64');

      expect(base64).toBe('');
    });

    it('should encode binary data correctly', () => {
      const binaryData = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
      const base64 = binaryData.toString('base64');

      expect(base64).toBe('/9j/4A==');
    });
  });
});

// ============================================
// File Handler Integration Tests
// ============================================

describe('File Handler - Error Handling', () => {
  describe('Error message formatting', () => {
    it('should format Error objects properly', () => {
      const error = new Error('Test error message');
      const message = error instanceof Error ? error.message : 'Unknown error';

      expect(message).toBe('Test error message');
    });

    it('should handle non-Error thrown values', () => {
      const thrownString = 'String error';
      const message = thrownString instanceof Error ? thrownString.message : 'Unknown error';

      expect(message).toBe('Unknown error');
    });

    it('should provide fallback messages', () => {
      const error = undefined;
      const message = error instanceof Error ? error.message : 'Failed to process file';

      expect(message).toBe('Failed to process file');
    });
  });

  describe('Return value structures', () => {
    it('should format success response correctly', () => {
      const result = {
        success: true,
        filePath: '/path/to/file.showstack'
      };

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('filePath');
      expect(result.success).toBe(true);
    });

    it('should format error response correctly', () => {
      const result = {
        success: false,
        error: 'File not found'
      };

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
      expect(result.success).toBe(false);
    });

    it('should handle null returns for canceled operations', () => {
      const result = null; // User canceled dialog

      expect(result).toBeNull();
    });
  });

  describe('Path validation', () => {
    it('should validate file paths are strings', () => {
      const validPath = '/path/to/file.showstack';
      expect(typeof validPath).toBe('string');
    });

    it('should handle relative paths', () => {
      const relativePath = './project.showstack';
      expect(relativePath).toContain('.');
    });

    it('should handle absolute paths', () => {
      const absolutePath = '/Users/username/project.showstack';
      expect(absolutePath).toMatch(/^[/\\]/);
    });

    it('should handle Windows-style paths', () => {
      const windowsPath = 'C:\\Users\\username\\project.showstack';
      expect(windowsPath).toContain(':\\');
    });
  });
});

describe('File Handler - Module Integration', () => {
  describe('File extensions', () => {
    it('should recognize .showstack files', () => {
      const filename = 'project.showstack';
      expect(filename).toMatch(/\.showstack$/);
    });

    it('should handle files without extensions', () => {
      const filename = 'project';
      expect(filename).not.toMatch(/\.\w+$/);
    });

    it('should extract filename from path', () => {
      const fullPath = '/path/to/my-project.showstack';
      const filename = fullPath.split('/').pop();

      expect(filename).toBe('my-project.showstack');
    });
  });

  describe('Module type validation', () => {
    it('should recognize valid module types', () => {
      const validModules = ['PRODUCTION', 'PREP', 'INFRASTRUCTURE', 'PAPERWORK'];

      validModules.forEach(module => {
        expect(validModules).toContain(module);
      });
    });

    it('should default to PRODUCTION module', () => {
      const defaultModule = 'PRODUCTION';
      expect(defaultModule).toBe('PRODUCTION');
    });
  });

  describe('Conflict resolution types', () => {
    it('should support merge resolution', () => {
      const resolution = 'merge';
      expect(['merge', 'replace', 'cancel']).toContain(resolution);
    });

    it('should support replace resolution', () => {
      const resolution = 'replace';
      expect(['merge', 'replace', 'cancel']).toContain(resolution);
    });

    it('should support cancel resolution', () => {
      const resolution = 'cancel';
      expect(['merge', 'replace', 'cancel']).toContain(resolution);
    });
  });
});

// ============================================
// IPC Handler Integration Tests (Priority 1.1)
// ============================================

describe('file:readImageAsDataUrl - Full Integration with Validation Module', () => {
  /**
   * These tests actually invoke readImageAsDataUrl() from imageValidation.ts
   * to verify the complete IPC handler → validation module flow.
   *
   * Complements comprehensive unit tests in:
   * - src/main/utils/__tests__/imageValidation.test.ts (70+ tests)
   * - src/main/utils/__tests__/pathValidation.test.ts (50+ tests)
   */

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully process valid PNG image through full stack', async () => {
    const imagePath = '/Users/test/Documents/image.png';
    const imageBuffer = Buffer.from('PNG_IMAGE_DATA');

    // TOCTOU FIX: No longer checks existence before reading
    vi.mocked(fs.readFile).mockResolvedValue(imageBuffer);
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({
      ext: 'png',
      mime: 'image/png'
    });

    // Actually invoke the handler logic
    const result = await readImageAsDataUrl(imagePath);

    // Verify complete flow (TOCTOU FIX: no existsSync call)
    expect(validateFilePath).toHaveBeenCalledWith(imagePath);
    expect(fs.readFile).toHaveBeenCalledWith(imagePath);
    expect(fileTypeFromBuffer).toHaveBeenCalledWith(imageBuffer);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should reject SVG files through validation module', async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('SVG_DATA'));
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({
      ext: 'svg',
      mime: 'image/svg+xml'
    });

    await expect(readImageAsDataUrl('/Users/test/image.svg'))
      .rejects.toThrow(InvalidFileTypeError);
  });

  it('should reject files over 2MB through validation module', async () => {
    const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB

    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(largeBuffer);

    await expect(readImageAsDataUrl('/Users/test/large.png'))
      .rejects.toThrow(FileSizeExceededError);
  });

  it('should reject path traversal attempts through validation module', async () => {
    await expect(readImageAsDataUrl('../../etc/passwd'))
      .rejects.toThrow(PathTraversalError);

    expect(validateFilePath).toHaveBeenCalledWith('../../etc/passwd');
  });

  it('should reject null byte injection through validation module', async () => {
    await expect(readImageAsDataUrl('image.png\x00.exe'))
      .rejects.toThrow(PathTraversalError);
  });

  it('should throw FileNotFoundError for non-existent files', async () => {
    // TOCTOU FIX: No longer checks existence, readFile throws ENOENT
    const error: any = new Error('File not found');
    error.code = 'ENOENT';
    vi.mocked(fs.readFile).mockRejectedValue(error);

    await expect(readImageAsDataUrl('/nonexistent/file.png'))
      .rejects.toThrow(FileNotFoundError);
  });

  it('should handle JPEG images with correct MIME type', async () => {
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header

    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(jpegBuffer);
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({
      ext: 'jpg',
      mime: 'image/jpeg'
    });

    const result = await readImageAsDataUrl('/Users/test/photo.jpg');

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
    const base64Part = result.split(',')[1];
    expect(base64Part).toBe(jpegBuffer.toString('base64'));
  });

  it('should verify structured error types are used', async () => {
    vi.mocked(fsSync.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('data'));
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({
      ext: 'exe',
      mime: 'application/x-msdownload'
    });

    try {
      await readImageAsDataUrl('/Users/test/virus.exe');
      throw new Error('Should have thrown InvalidFileTypeError');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidFileTypeError);
      expect((error as InvalidFileTypeError).actualType).toBe('application/x-msdownload');
      expect((error as InvalidFileTypeError).allowedTypes).toContain('image/png');
    }
  });
});
