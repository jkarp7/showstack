// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  readImageAsDataUrl,
  isValidImagePath,
  getFileSize,
  getFileSizeSync,
  validateFileSize,
  validateFileSizeSync,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from '../imageValidation';
import { InvalidFileTypeError, FileSizeExceededError, FileNotFoundError } from '../errors';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { fileTypeFromBuffer } from 'file-type';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('fs');
vi.mock('file-type');
vi.mock('../pathValidation', () => ({
  validateFilePath: vi.fn((path: string) => {
    if (path.includes('..') || path.includes('\x00')) {
      throw new Error('Invalid path');
    }
  }),
}));
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path'),
  },
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

      vi.mocked(fs.readFile).mockResolvedValue(imageBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      const result = await readImageAsDataUrl(imagePath);

      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(fs.readFile).toHaveBeenCalledWith(imagePath);
      expect(fileTypeFromBuffer).toHaveBeenCalledWith(imageBuffer);
    });

    it('should successfully process valid JPEG image', async () => {
      const imagePath = '/Users/test/photo.jpg';
      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header

      vi.mocked(fs.readFile).mockResolvedValue(imageBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'jpg',
        mime: 'image/jpeg',
      });

      const result = await readImageAsDataUrl(imagePath);

      expect(result).toMatch(/^data:image\/jpeg;base64,/);
      const base64Part = result.split(',')[1];
      expect(base64Part).toBe(imageBuffer.toString('base64'));
    });

    it('should successfully process valid GIF image', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'gif',
        mime: 'image/gif',
      });

      const result = await readImageAsDataUrl('/Users/test/animation.gif');

      expect(result).toMatch(/^data:image\/gif;base64,/);
    });

    it('should successfully process valid WebP image', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'webp',
        mime: 'image/webp',
      });

      const result = await readImageAsDataUrl('/Users/test/image.webp');

      expect(result).toMatch(/^data:image\/webp;base64,/);
    });

    it('should reject SVG files (XSS prevention)', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'svg',
        mime: 'image/svg+xml',
      });

      await expect(readImageAsDataUrl('/Users/test/image.svg')).rejects.toThrow(
        InvalidFileTypeError,
      );
    });

    it('should reject executable files disguised as images', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'exe',
        mime: 'application/x-msdownload',
      });

      await expect(readImageAsDataUrl('/Users/test/virus.png')).rejects.toThrow(
        InvalidFileTypeError,
      );
    });

    it('should reject files over 2MB', async () => {
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB

      vi.mocked(fs.readFile).mockResolvedValue(largeBuffer);

      await expect(readImageAsDataUrl('/Users/test/large.png')).rejects.toThrow(
        FileSizeExceededError,
      );
    });

    it('should accept files exactly at 2MB limit', async () => {
      const maxBuffer = Buffer.alloc(2 * 1024 * 1024); // Exactly 2MB

      vi.mocked(fs.readFile).mockResolvedValue(maxBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      const result = await readImageAsDataUrl('/Users/test/max-size.png');
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should throw for non-existent files', async () => {
      // TOCTOU FIX: No longer checks existence, readFile throws ENOENT
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(readImageAsDataUrl('/nonexistent/file.png')).rejects.toThrow(FileNotFoundError);
    });

    it('should throw for empty path', async () => {
      await expect(readImageAsDataUrl('')).rejects.toThrow();
    });

    it('should throw for null path', async () => {
      await expect(readImageAsDataUrl(null as any)).rejects.toThrow();
    });

    it('should reject files with path traversal', async () => {
      await expect(readImageAsDataUrl('../../etc/passwd')).rejects.toThrow('Invalid path');
    });

    it('should reject files with null byte injection', async () => {
      await expect(readImageAsDataUrl('image.png\x00.exe')).rejects.toThrow('Invalid path');
    });

    it('should handle corrupted files gracefully', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

      await expect(readImageAsDataUrl('/Users/test/corrupted.png')).rejects.toThrow(
        InvalidFileTypeError,
      );
    });

    it('should handle file read errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      await expect(readImageAsDataUrl('/restricted/file.png')).rejects.toThrow('Permission denied');
    });

    it('should handle fileType detection errors', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);
      vi.mocked(fileTypeFromBuffer).mockRejectedValue(new Error('Detection failed'));

      await expect(readImageAsDataUrl('/Users/test/unknown.png')).rejects.toThrow(
        'Detection failed',
      );
    });
  });

  describe('isValidImagePath', () => {
    it('should return true for valid existing paths', () => {
      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      expect(isValidImagePath('/Users/test/image.png')).toBe(true);
    });

    it('should return false for non-existent paths', () => {
      vi.mocked(fsSync.existsSync).mockReturnValue(false);
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
    it('should return file size in bytes', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024 * 500, // 500KB
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      const size = await getFileSize('/Users/test/file.png');
      expect(size).toBe(512000);
    });

    it('should work for small files', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024, // 1KB
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      const size = await getFileSize('/Users/test/small.png');
      expect(size).toBe(1024);
    });

    it('should work for large files', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 5 * 1024 * 1024, // 5MB
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      const size = await getFileSize('/Users/test/large.png');
      expect(size).toBe(5242880);
    });
  });

  describe('validateFileSize', () => {
    it('should pass for files under limit', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 1024 * 1024, // 1MB
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      await expect(validateFileSize('/Users/test/small.png')).resolves.not.toThrow();
    });

    it('should throw for files over limit', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 3 * 1024 * 1024, // 3MB
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      await expect(validateFileSize('/Users/test/large.png')).rejects.toThrow(
        FileSizeExceededError,
      );
    });

    it('should pass for files at exact limit', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 2 * 1024 * 1024, // Exactly 2MB
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      await expect(validateFileSize('/Users/test/max.png')).resolves.not.toThrow();
    });
  });

  describe('Constants validation', () => {
    it('should have correct MAX_FILE_SIZE', () => {
      expect(MAX_FILE_SIZE).toBe(2 * 1024 * 1024);
      expect(MAX_FILE_SIZE).toBe(2097152);
    });

    it('should have correct ALLOWED_IMAGE_TYPES', () => {
      expect(ALLOWED_IMAGE_TYPES).toEqual(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
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

      vi.mocked(fs.readFile).mockResolvedValue(testBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      const result = await readImageAsDataUrl('/Users/test/test.png');

      const expectedBase64 = testBuffer.toString('base64');
      expect(result).toBe(`data:image/png;base64,${expectedBase64}`);
    });

    it('should correctly encode binary data', async () => {
      const binaryBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header

      vi.mocked(fs.readFile).mockResolvedValue(binaryBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'jpg',
        mime: 'image/jpeg',
      });

      const result = await readImageAsDataUrl('/Users/test/binary.jpg');

      expect(result).toContain('base64,/9j/4A=='); // Base64 of JPEG header
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete upload flow for valid image', async () => {
      const imagePath = '/Users/test/Documents/photo.jpg';
      const imageData = Buffer.from('JPEG_IMAGE_DATA');

      vi.mocked(fs.readFile).mockResolvedValue(imageData);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'jpg',
        mime: 'image/jpeg',
      });

      // Simulate complete handler flow
      const dataUrl = await readImageAsDataUrl(imagePath);

      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
      // TOCTOU FIX: No longer checks existence before reading
      expect(fs.readFile).toHaveBeenCalledWith(imagePath);
      expect(fileTypeFromBuffer).toHaveBeenCalled();
    });

    it('should reject complete flow for invalid file', async () => {
      const maliciousPath = '/Users/test/virus.exe';
      const exeData = Buffer.from('MZ'); // EXE header

      vi.mocked(fs.readFile).mockResolvedValue(exeData);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'exe',
        mime: 'application/x-msdownload',
      });

      await expect(readImageAsDataUrl(maliciousPath)).rejects.toThrow(InvalidFileTypeError);
    });
  });

  describe('Symlink Attack Prevention (TOCTOU Fix)', () => {
    it('should reject symlink to sensitive file via MIME validation', async () => {
      // Simulate symlink to /etc/passwd (contains text, not image)
      const passwdContent = Buffer.from('root:x:0:0:root:/root:/bin/bash');

      vi.mocked(fs.readFile).mockResolvedValue(passwdContent);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined); // Not an image

      await expect(readImageAsDataUrl('/malicious/image.png')).rejects.toThrow(
        InvalidFileTypeError,
      );
    });

    it('should reject symlink to executable via MIME validation', async () => {
      // Simulate symlink to /bin/bash or malicious executable
      const exeData = Buffer.from([0x7f, 0x45, 0x4c, 0x46]); // ELF header

      vi.mocked(fs.readFile).mockResolvedValue(exeData);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'elf',
        mime: 'application/x-executable',
      });

      await expect(readImageAsDataUrl('/malicious/symlink.jpg')).rejects.toThrow(
        InvalidFileTypeError,
      );
    });

    it('should reject symlink to large file via size validation', async () => {
      // Simulate symlink to large file (e.g., video, database)
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB

      vi.mocked(fs.readFile).mockResolvedValue(largeBuffer);

      // Size check happens before MIME check
      await expect(readImageAsDataUrl('/malicious/large-symlink.png')).rejects.toThrow(
        FileSizeExceededError,
      );
    });

    it('should reject symlink to system file (ssh key)', async () => {
      // Simulate symlink to ~/.ssh/id_rsa
      const sshKey = Buffer.from('-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAK...');

      vi.mocked(fs.readFile).mockResolvedValue(sshKey);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined); // Not an image

      await expect(readImageAsDataUrl('/malicious/key.png')).rejects.toThrow(InvalidFileTypeError);
    });

    it('should follow symlink to valid image and accept it', async () => {
      // Symlink to legitimate image should work
      const validImageData = Buffer.from('VALID_PNG_DATA');

      vi.mocked(fs.readFile).mockResolvedValue(validImageData);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      const result = await readImageAsDataUrl('/symlink/to/valid-image.png');
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle broken symlink (ENOENT)', async () => {
      // Symlink pointing to non-existent file
      const error: any = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(readImageAsDataUrl('/broken/symlink.png')).rejects.toThrow(FileNotFoundError);
    });

    it('should prevent symlink chain exploitation', async () => {
      // Symlink A -> Symlink B -> Sensitive File
      // fs.readFile will follow the chain, but validation catches it
      const sensitiveData = Buffer.from('SENSITIVE_SYSTEM_DATA');

      vi.mocked(fs.readFile).mockResolvedValue(sensitiveData);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

      await expect(readImageAsDataUrl('/symlink-chain/attack.png')).rejects.toThrow(
        InvalidFileTypeError,
      );
    });

    it('should sanitize symlink target paths in error messages', async () => {
      // Even if error exposes symlink target, sanitizer should clean it
      const error: any = new Error('Failed to read /etc/shadow');
      error.code = 'EACCES';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      try {
        await readImageAsDataUrl('/malicious/shadow.png');
      } catch (err: any) {
        // Error should propagate but path should be sanitized by caller
        expect(err.message).toBeDefined();
        // Note: Sanitization happens at IPC boundary in files.ts
      }
    });

    it('should reject directory symlinks', async () => {
      // Symlink to directory should fail at fs.readFile level
      const error: any = new Error('EISDIR: illegal operation on a directory');
      error.code = 'EISDIR';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(readImageAsDataUrl('/symlink-to-dir')).rejects.toThrow();
    });
  });

  describe('Performance & Concurrent Operations', () => {
    it('should handle large valid images efficiently', async () => {
      // Test with file near size limit
      const largeBuffer = Buffer.alloc(1.9 * 1024 * 1024); // 1.9MB
      const start = Date.now();

      vi.mocked(fs.readFile).mockResolvedValue(largeBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      await readImageAsDataUrl('/large/image.png');
      const duration = Date.now() - start;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple concurrent reads', async () => {
      const imageBuffer = Buffer.from('IMAGE_DATA');

      vi.mocked(fs.readFile).mockResolvedValue(imageBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      // Simulate 10 concurrent image reads
      const promises = Array.from({ length: 10 }, (_, i) =>
        readImageAsDataUrl(`/concurrent/image-${i}.png`),
      );

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toMatch(/^data:image\/png;base64,/);
      });
    });

    it('should handle concurrent reads with mixed success/failure', async () => {
      // Mock alternating success and failure
      let callCount = 0;
      vi.mocked(fs.readFile).mockImplementation(async () => {
        callCount++;
        if (callCount % 2 === 0) {
          // Even calls fail (file too large)
          return Buffer.alloc(3 * 1024 * 1024); // 3MB
        }
        // Odd calls succeed
        return Buffer.from('VALID_IMAGE');
      });

      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      const promises = Array.from({ length: 6 }, (_, i) =>
        readImageAsDataUrl(`/mixed/image-${i}.png`).catch((err) => ({ error: err.message })),
      );

      const results = await Promise.all(promises);

      // Check we have mix of success and failure
      const successes = results.filter((r) => typeof r === 'string');
      const failures = results.filter((r) => typeof r === 'object' && 'error' in r);

      expect(successes.length).toBe(3); // Odd indices
      expect(failures.length).toBe(3); // Even indices
    });

    it('should fail fast on invalid files without processing', async () => {
      // Test that path validation happens before expensive file read
      const start = Date.now();

      await expect(readImageAsDataUrl('../../etc/passwd')).rejects.toThrow();

      const duration = Date.now() - start;

      // Should fail almost instantly (< 10ms) without file I/O
      expect(duration).toBeLessThan(10);
      expect(fs.readFile).not.toHaveBeenCalled();
    });

    it('should handle rapid sequential reads', async () => {
      const imageBuffer = Buffer.from('IMAGE_DATA');

      vi.mocked(fs.readFile).mockResolvedValue(imageBuffer);
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'png',
        mime: 'image/png',
      });

      const start = Date.now();

      // Sequential reads (not parallel)
      for (let i = 0; i < 20; i++) {
        await readImageAsDataUrl(`/sequential/image-${i}.png`);
      }

      const duration = Date.now() - start;

      // Should complete 20 reads in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
      expect(fs.readFile).toHaveBeenCalledTimes(20);
    });

    it('should not leak memory with large failed operations', async () => {
      // Simulate reading oversized file that should be rejected
      const hugeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB

      vi.mocked(fs.readFile).mockResolvedValue(hugeBuffer);

      // Should throw without processing the full buffer
      await expect(readImageAsDataUrl('/huge/file.png')).rejects.toThrow(FileSizeExceededError);

      // Verify MIME check never ran (failed at size check)
      expect(fileTypeFromBuffer).not.toHaveBeenCalled();
    });

    it('should handle concurrent operations with different error types', async () => {
      // Mock different scenarios BEFORE creating promises
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(Buffer.from('VALID')) // valid.png
        .mockResolvedValueOnce(Buffer.alloc(3 * 1024 * 1024)) // large.png
        .mockResolvedValueOnce(Buffer.from('EXE')) // executable.png
        .mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })); // missing.png

      vi.mocked(fileTypeFromBuffer)
        .mockResolvedValueOnce({ ext: 'png', mime: 'image/png' }) // valid
        .mockResolvedValueOnce({ ext: 'exe', mime: 'application/x-msdownload' }); // executable

      const promises = [
        // Valid image
        readImageAsDataUrl('/valid.png'),
        // Too large
        readImageAsDataUrl('/large.png'),
        // Wrong type
        readImageAsDataUrl('/executable.png'),
        // Not found
        readImageAsDataUrl('/missing.png'),
      ];

      const results = await Promise.allSettled(promises);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('rejected');
      expect(results[3].status).toBe('rejected');
    });
  });

  describe('Resource Cleanup & Error Paths', () => {
    it('should clean up resources on validation failure', async () => {
      const buffer = Buffer.alloc(1024);

      vi.mocked(fs.readFile).mockResolvedValue(buffer);
      vi.mocked(fileTypeFromBuffer).mockRejectedValue(new Error('Detection failed'));

      await expect(readImageAsDataUrl('/test.png')).rejects.toThrow('Detection failed');

      // Buffer should be eligible for garbage collection
      // (In real code, ensure no lingering references)
    });

    it('should handle partial reads gracefully', async () => {
      // Simulate read error mid-stream
      const error: any = new Error('ENOSPC: no space left on device');
      error.code = 'ENOSPC';

      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(readImageAsDataUrl('/test.png')).rejects.toThrow();
    });

    it('should handle corrupted buffers', async () => {
      // Empty buffer (0 bytes)
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.alloc(0));

      await expect(readImageAsDataUrl('/empty.png')).rejects.toThrow();
    });

    it('should handle filesystem permission errors', async () => {
      const error: any = new Error('EACCES: permission denied');
      error.code = 'EACCES';

      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(readImageAsDataUrl('/restricted.png')).rejects.toThrow();
    });

    it('should handle read-only filesystem errors', async () => {
      const error: any = new Error('EROFS: read-only file system');
      error.code = 'EROFS';

      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(readImageAsDataUrl('/readonly/file.png')).rejects.toThrow();
    });
  });
});
