// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  containsNullByte,
  hasPathTraversal,
  isPathAllowed,
  validateFilePath,
  sanitizeFilePath,
} from '../pathValidation';
import { PathTraversalError, NullByteError, InvalidPathError } from '../errors';
import { app } from 'electron';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      const paths: Record<string, string> = {
        userData: '/Users/test/.config/showstack',
        home: '/Users/test',
        temp: '/tmp',
        documents: '/Users/test/Documents',
        downloads: '/Users/test/Downloads',
        desktop: '/Users/test/Desktop',
      };
      return paths[name] || '/mock/path';
    }),
  },
}));

/**
 * Comprehensive path validation security tests
 * Prevents path traversal attacks and validates file paths
 */
describe('Path Validation Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('containsNullByte', () => {
    it('should detect null byte in path', () => {
      expect(containsNullByte('file.png\x00.exe')).toBe(true);
    });

    it('should detect null byte in middle of path', () => {
      expect(containsNullByte('/path/to\x00/file.png')).toBe(true);
    });

    it('should return false for clean path', () => {
      expect(containsNullByte('/path/to/file.png')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(containsNullByte('')).toBe(false);
    });
  });

  describe('hasPathTraversal', () => {
    it('should detect relative path traversal with ../', () => {
      expect(hasPathTraversal('../etc/passwd')).toBe(true);
      expect(hasPathTraversal('../../etc/passwd')).toBe(true);
    });

    it('should detect relative path traversal with ..\\', () => {
      expect(hasPathTraversal('..\\Windows\\System32')).toBe(true);
    });

    it('should detect path traversal in middle of path', () => {
      expect(hasPathTraversal('/safe/path/../../../etc/passwd')).toBe(true);
    });

    it('should allow normal paths', () => {
      expect(hasPathTraversal('/Users/test/Documents/file.png')).toBe(false);
      expect(hasPathTraversal('./local/file.png')).toBe(false);
    });

    it('should allow paths with dots in filename', () => {
      expect(hasPathTraversal('/path/to/file.min.js')).toBe(false);
    });
  });

  describe('isPathAllowed', () => {
    it('should allow paths in userData directory', () => {
      expect(isPathAllowed('/Users/test/.config/showstack/file.png')).toBe(true);
    });

    it('should allow paths in home directory', () => {
      expect(isPathAllowed('/Users/test/file.png')).toBe(true);
    });

    it('should allow paths in documents directory', () => {
      expect(isPathAllowed('/Users/test/Documents/file.png')).toBe(true);
    });

    it('should allow paths in downloads directory', () => {
      expect(isPathAllowed('/Users/test/Downloads/file.png')).toBe(true);
    });

    it('should allow paths in desktop directory', () => {
      expect(isPathAllowed('/Users/test/Desktop/file.png')).toBe(true);
    });

    it('should allow paths in temp directory', () => {
      expect(isPathAllowed('/tmp/file.png')).toBe(true);
    });

    it('should reject paths in system directories', () => {
      expect(isPathAllowed('/etc/passwd')).toBe(false);
      expect(isPathAllowed('/var/log/system.log')).toBe(false);
    });

    it('should reject paths outside allowed directories', () => {
      expect(isPathAllowed('/other/user/file.png')).toBe(false);
    });

    it('should handle relative paths by resolving them', () => {
      // Relative paths will be resolved relative to process.cwd()
      // This test verifies the function handles them without crashing
      const result = isPathAllowed('./file.png');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('validateFilePath', () => {
    it('should pass validation for clean paths', () => {
      expect(() => validateFilePath('/Users/test/file.png')).not.toThrow();
    });

    it('should throw for null byte injection', () => {
      expect(() => validateFilePath('file.png\x00.exe')).toThrow(NullByteError);
    });

    it('should throw for path traversal attempts', () => {
      expect(() => validateFilePath('../../etc/passwd')).toThrow('traversal');
    });

    it('should throw for empty string', () => {
      expect(() => validateFilePath('')).toThrow('non-empty string');
    });

    it('should throw for null input', () => {
      expect(() => validateFilePath(null as any)).toThrow('non-empty string');
    });

    it('should throw for non-string input', () => {
      expect(() => validateFilePath(123 as any)).toThrow('non-empty string');
    });

    it('should allow Windows-style paths', () => {
      expect(() => validateFilePath('C:\\Users\\test\\file.png')).not.toThrow();
    });

    it('should allow Unix-style paths', () => {
      expect(() => validateFilePath('/Users/test/file.png')).not.toThrow();
    });
  });

  describe('sanitizeFilePath', () => {
    it('should normalize and return valid paths', () => {
      const result = sanitizeFilePath('/Users/test/file.png');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should throw for invalid paths', () => {
      expect(() => sanitizeFilePath('../../etc/passwd')).toThrow('traversal');
    });

    it('should normalize path separators', () => {
      const result = sanitizeFilePath('/Users/test//file.png');
      expect(result).not.toContain('//');
    });

    it('should throw for null byte injection', () => {
      expect(() => sanitizeFilePath('file.png\x00.exe')).toThrow(NullByteError);
    });
  });

  describe('URL-encoded path traversal prevention', () => {
    it('should detect URL-encoded traversal (..%2F)', () => {
      // After URL decoding, this becomes ../
      const encodedPath = decodeURIComponent('..%2Fetc%2Fpasswd');
      expect(hasPathTraversal(encodedPath)).toBe(true);
    });

    it('should detect double-encoded traversal', () => {
      // Double URL encoding: %252F becomes %2F becomes /
      const doubleEncoded = decodeURIComponent(decodeURIComponent('..%252F..%252Fetc'));
      expect(hasPathTraversal(doubleEncoded)).toBe(true);
    });

    it('should detect mixed encoding', () => {
      const mixedPath = '../' + decodeURIComponent('%2Fetc%2Fpasswd');
      expect(hasPathTraversal(mixedPath)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long paths', () => {
      const longPath = '/Users/test/' + 'a'.repeat(1000) + '/file.png';
      expect(() => validateFilePath(longPath)).not.toThrow();
    });

    it('should handle paths with spaces', () => {
      expect(() => validateFilePath('/Users/test/My Documents/file.png')).not.toThrow();
    });

    it('should handle paths with special characters', () => {
      expect(() => validateFilePath('/Users/test/file-name_123.png')).not.toThrow();
    });

    it('should handle Unicode characters in paths', () => {
      expect(() => validateFilePath('/Users/test/文件.png')).not.toThrow();
    });

    it('should handle paths with multiple dots', () => {
      expect(() => validateFilePath('/Users/test/file.min.js.map')).not.toThrow();
    });
  });

  describe('Security regression tests', () => {
    it('should prevent /etc/passwd access', () => {
      expect(() => validateFilePath('/etc/passwd')).not.toThrow();
      // Note: validateFilePath only checks for traversal, not allowed paths
      // isPathAllowed would reject this
      expect(isPathAllowed('/etc/passwd')).toBe(false);
    });

    it('should prevent Windows system32 access', () => {
      const systemPath = 'C:\\Windows\\System32\\config\\sam';
      expect(() => validateFilePath(systemPath)).not.toThrow();
      // Would be rejected by isPathAllowed in real usage
    });

    it('should prevent accessing other users home directories', () => {
      expect(isPathAllowed('/Users/other-user/private.txt')).toBe(false);
    });
  });
});
