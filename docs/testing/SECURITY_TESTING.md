# Security Testing Guide

This guide covers testing security-critical code in ShowStack, including file validation, error sanitization, and defense-in-depth strategies.

## Table of Contents

1. [Overview](#overview)
2. [Security Principles](#security-principles)
3. [Testing Security-Critical Code](#testing-security-critical-code)
4. [Attack Scenarios to Test](#attack-scenarios-to-test)
5. [Testing Patterns](#testing-patterns)
6. [Real-World Examples](#real-world-examples)
7. [Common Pitfalls](#common-pitfalls)
8. [Security Testing Checklist](#security-testing-checklist)

---

## Overview

Security testing verifies that defensive mechanisms work correctly and cannot be bypassed. This is critical for Electron apps where the main process has system-level access.

**Key Areas:**
- File upload validation (MIME types, size limits, path traversal)
- Error message sanitization (preventing information disclosure)
- IPC boundary validation (main ↔ renderer)
- Race condition prevention (TOCTOU attacks)

---

## Security Principles

### Defense in Depth

Multiple layers of validation ensure that if one layer fails, others prevent exploitation:

```typescript
// Layer 1: Path validation
validateFilePath(imagePath);

// Layer 2: File read with TOCTOU prevention
const buffer = await fs.readFile(imagePath);

// Layer 3: Size validation
if (buffer.length > MAX_FILE_SIZE) {
  throw new FileSizeExceededError(buffer.length, MAX_FILE_SIZE);
}

// Layer 4: MIME type validation (magic numbers)
const fileType = await fileTypeFromBuffer(buffer);
if (!ALLOWED_IMAGE_TYPES.includes(fileType.mime)) {
  throw new InvalidFileTypeError(fileType.mime, ALLOWED_IMAGE_TYPES);
}

// Layer 5: Error sanitization (at IPC boundary)
catch (error) {
  throw new Error(sanitizeError(error));
}
```

### Fail Securely

When validation fails, ensure the error doesn't leak sensitive information:

```typescript
// ❌ BAD: Exposes full path
throw new Error(`File not found: /Users/admin/.ssh/id_rsa`);

// ✅ GOOD: Sanitized error
throw new Error(`File not found: id_rsa`);
```

### Principle of Least Privilege

Only send necessary information to the renderer process:

```typescript
// ❌ BAD: Sends full file path
return { filePath: '/Users/admin/Documents/secret.png', data: base64 };

// ✅ GOOD: Sends only filename
return { fileName: 'secret.png', data: base64 };
```

---

## Testing Security-Critical Code

### Test Structure

Security tests should cover:
1. **Valid inputs** - Ensure legitimate use cases work
2. **Boundary conditions** - Test limits (size, length, etc.)
3. **Attack scenarios** - Verify malicious inputs are rejected
4. **Error handling** - Ensure errors don't leak information

### Example Test Suite

```typescript
describe('Image Upload Security', () => {
  describe('Valid Inputs', () => {
    it('should accept valid PNG images', async () => {
      // Test legitimate use case
    });
  });

  describe('Boundary Conditions', () => {
    it('should accept files exactly at 2MB limit', async () => {
      // Test edge of size limit
    });
  });

  describe('Attack Scenarios', () => {
    it('should reject path traversal attempts', async () => {
      await expect(readImage('../../etc/passwd'))
        .rejects.toThrow();
    });

    it('should reject null byte injection', async () => {
      await expect(readImage('image.png\x00.exe'))
        .rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should not expose file paths in errors', async () => {
      try {
        await readImage('/sensitive/path/file.png');
      } catch (err) {
        expect(err.message).not.toContain('/sensitive/path');
        expect(err.message).toContain('file.png'); // Filename OK
      }
    });
  });
});
```

---

## Attack Scenarios to Test

### 1. Path Traversal

**Attack:** `../../etc/passwd`

**Test Pattern:**
```typescript
it('should reject path traversal attempts', async () => {
  await expect(readImageAsDataUrl('../../etc/passwd'))
    .rejects.toThrow(InvalidPathError);
});

it('should reject encoded path traversal', async () => {
  await expect(readImageAsDataUrl('%2e%2e%2f%2e%2e%2fetc%2fpasswd'))
    .rejects.toThrow(InvalidPathError);
});
```

### 2. Null Byte Injection

**Attack:** `image.png\x00.exe` (tricks extension checks)

**Test Pattern:**
```typescript
it('should reject null byte injection', async () => {
  await expect(readImageAsDataUrl('image.png\x00.exe'))
    .rejects.toThrow(NullByteError);
});
```

### 3. MIME Type Bypass

**Attack:** Rename `virus.exe` to `image.png`

**Test Pattern:**
```typescript
it('should detect MIME type by content, not extension', async () => {
  const exeData = Buffer.from([0x4D, 0x5A]); // MZ header
  vi.mocked(fs.readFile).mockResolvedValue(exeData);
  vi.mocked(fileTypeFromBuffer).mockResolvedValue({
    ext: 'exe',
    mime: 'application/x-msdownload'
  });

  await expect(readImageAsDataUrl('/fake/image.png'))
    .rejects.toThrow(InvalidFileTypeError);
});
```

### 4. Size Limit Bypass

**Attack:** Upload 10GB file to exhaust memory/disk

**Test Pattern:**
```typescript
it('should reject files over size limit', async () => {
  const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
  vi.mocked(fs.readFile).mockResolvedValue(largeBuffer);

  await expect(readImageAsDataUrl('/large/file.png'))
    .rejects.toThrow(FileSizeExceededError);
});
```

### 5. Symlink Attacks (TOCTOU)

**Attack:** Replace file with symlink after validation

**Test Pattern:**
```typescript
it('should reject symlink to sensitive file', async () => {
  // Simulate symlink to /etc/passwd
  const passwdContent = Buffer.from('root:x:0:0:...');
  vi.mocked(fs.readFile).mockResolvedValue(passwdContent);
  vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

  await expect(readImageAsDataUrl('/malicious/symlink.png'))
    .rejects.toThrow(InvalidFileTypeError);
});
```

**Prevention:** Remove TOCTOU race condition by eliminating separate existence check:

```typescript
// ❌ BAD: TOCTOU vulnerability
if (fs.existsSync(path)) {  // Check
  const data = fs.readFile(path);  // Use (file could change here!)
}

// ✅ GOOD: Atomic operation
try {
  const data = await fs.readFile(path);  // Check + Use in one operation
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new FileNotFoundError(path);
  }
}
```

### 6. XSS via SVG

**Attack:** SVG files can contain JavaScript

**Test Pattern:**
```typescript
it('should reject SVG files (XSS prevention)', async () => {
  const svgData = Buffer.from('<svg><script>alert("XSS")</script></svg>');
  vi.mocked(fs.readFile).mockResolvedValue(svgData);
  vi.mocked(fileTypeFromBuffer).mockResolvedValue({
    ext: 'svg',
    mime: 'image/svg+xml'
  });

  await expect(readImageAsDataUrl('/malicious/xss.svg'))
    .rejects.toThrow(InvalidFileTypeError);
});
```

### 7. Information Disclosure

**Attack:** Trigger errors that expose system paths

**Test Pattern:**
```typescript
it('should not expose system paths in errors', async () => {
  const error = new Error('Failed to read /Users/admin/.ssh/id_rsa');
  const sanitized = sanitizeError(error);

  expect(sanitized).not.toContain('/Users/admin');
  expect(sanitized).not.toContain('.ssh');
  expect(sanitized).toContain('id_rsa'); // Filename OK
});

it('should sanitize Windows system paths', async () => {
  const error = new Error('Failed to read C:\\Windows\\System32\\config\\sam');
  const sanitized = sanitizeError(error);

  expect(sanitized).not.toContain('System32');
  expect(sanitized).not.toContain('config');
});
```

### 8. Concurrent Operations

**Attack:** Race condition between validation and use

**Test Pattern:**
```typescript
it('should handle concurrent file reads safely', async () => {
  const promises = Array.from({ length: 10 }, (_, i) =>
    readImageAsDataUrl(`/path/to/image${i}.png`)
  );

  await expect(Promise.all(promises)).resolves.toBeDefined();
});
```

---

## Testing Patterns

### Pattern 1: Mock Attack Payloads

Create realistic attack data in tests:

```typescript
describe('Attack Payload Testing', () => {
  const ATTACK_PAYLOADS = {
    pathTraversal: [
      '../../etc/passwd',
      '..\\..\\Windows\\System32\\config\\sam',
      '....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2fetc%2fpasswd'
    ],
    nullByte: [
      'image.png\x00.exe',
      'file\x00.sh',
      'doc.pdf\x00.js'
    ],
    xss: [
      '<svg><script>alert("XSS")</script></svg>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)'
    ]
  };

  it('should reject all path traversal variants', async () => {
    for (const payload of ATTACK_PAYLOADS.pathTraversal) {
      await expect(validatePath(payload)).rejects.toThrow();
    }
  });
});
```

### Pattern 2: Regression Tests

Test known vulnerabilities to prevent regressions:

```typescript
describe('Security Regression Tests', () => {
  it('should never expose /etc/passwd path (CVE-YYYY-XXXX)', async () => {
    // Simulates CVE from code review
    const error = new Error('Failed to read /etc/passwd');
    const sanitized = sanitizeError(error);

    expect(sanitized).not.toContain('/etc/passwd');
  });
});
```

### Pattern 3: Boundary Value Analysis

Test limits exhaustively:

```typescript
describe('Size Limit Boundary Tests', () => {
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB

  it('should accept file 1 byte under limit', async () => {
    const buffer = Buffer.alloc(MAX_SIZE - 1);
    await expect(validateSize(buffer)).resolves.not.toThrow();
  });

  it('should accept file exactly at limit', async () => {
    const buffer = Buffer.alloc(MAX_SIZE);
    await expect(validateSize(buffer)).resolves.not.toThrow();
  });

  it('should reject file 1 byte over limit', async () => {
    const buffer = Buffer.alloc(MAX_SIZE + 1);
    await expect(validateSize(buffer)).rejects.toThrow();
  });
});
```

### Pattern 4: Error Message Verification

Ensure errors are safe to display:

```typescript
describe('Error Message Security', () => {
  const SENSITIVE_PATTERNS = [
    /\/etc\//,
    /\/Users\/[\w]+\//,
    /C:\\Users\\/,
    /\.ssh/,
    /ENOENT/,
    /stack trace/i
  ];

  it('should not contain sensitive patterns', async () => {
    const error = new Error('Complex error with /etc/passwd and ENOENT');
    const sanitized = sanitizeError(error);

    for (const pattern of SENSITIVE_PATTERNS) {
      expect(sanitized).not.toMatch(pattern);
    }
  });
});
```

---

## Real-World Examples

### Example 1: Image Upload Handler (Full Stack)

**File:** `src/main/ipc/files.ts:167-183`

```typescript
ipcMain.handle('file:readImageAsDataUrl', async (_, imagePath: string) => {
  try {
    return await readImageAsDataUrl(imagePath);
  } catch (error) {
    // Log full error securely (console only)
    console.error('Error reading image:', sanitizeErrorForLogging(error));

    // Sanitize error before sending to renderer
    const sanitizedMessage = sanitizeError(error);
    throw new Error(sanitizedMessage);
  }
});
```

**Tests:** `src/main/ipc/__tests__/files.test.ts`

### Example 2: Error Sanitizer

**File:** `src/main/utils/errorSanitizer.ts:37-111`

**Tests:** `src/main/utils/__tests__/errorSanitizer.test.ts:22-344`

### Example 3: TOCTOU Prevention

**File:** `src/main/utils/imageValidation.ts:45-71`

**Before (Vulnerable):**
```typescript
if (!fs.existsSync(imagePath)) {  // TOCTOU: File could change here
  throw new FileNotFoundError(imagePath);
}
const buffer = fs.readFileSync(imagePath);
```

**After (Secure):**
```typescript
let buffer: Buffer;
try {
  buffer = await fs.readFile(imagePath);  // Atomic read
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new FileNotFoundError(imagePath);
  }
  throw error;
}
```

**Tests:** `src/main/utils/__tests__/imageValidation.test.ts:386-495`

---

## Common Pitfalls

### Pitfall 1: Testing Happy Path Only

❌ **BAD:**
```typescript
it('should process images', async () => {
  const result = await readImage('/valid/image.png');
  expect(result).toBeDefined();
});
```

✅ **GOOD:**
```typescript
describe('Image Processing', () => {
  it('should process valid images', async () => { /* ... */ });
  it('should reject invalid MIME types', async () => { /* ... */ });
  it('should reject oversized files', async () => { /* ... */ });
  it('should reject path traversal', async () => { /* ... */ });
});
```

### Pitfall 2: Insufficient Error Testing

❌ **BAD:**
```typescript
it('should throw error', async () => {
  await expect(readImage('/invalid')).rejects.toThrow();
});
```

✅ **GOOD:**
```typescript
it('should throw error without exposing paths', async () => {
  try {
    await readImage('/Users/admin/secret/file.png');
    fail('Should have thrown');
  } catch (err) {
    expect(err.message).not.toContain('/Users/admin/secret');
    expect(err.message).toContain('file.png');
  }
});
```

### Pitfall 3: Mocking Security Mechanisms

❌ **BAD:**
```typescript
// Mocking validation defeats the purpose
vi.mock('../validation', () => ({
  validatePath: vi.fn(() => true)  // Always passes!
}));
```

✅ **GOOD:**
```typescript
// Test real validation logic
import { validatePath } from '../validation';

it('should reject invalid paths', async () => {
  await expect(validatePath('../../etc/passwd')).rejects.toThrow();
});
```

### Pitfall 4: Not Testing Error Boundaries

❌ **BAD:**
```typescript
// Test stops at function boundary
it('should validate file', async () => {
  await expect(validateFile(path)).resolves.toBe(true);
});
```

✅ **GOOD:**
```typescript
// Test full IPC flow
it('should validate file through IPC boundary', async () => {
  const result = await ipcRenderer.invoke('file:validate', path);
  expect(result.error).not.toContain('/sensitive/');
});
```

---

## Security Testing Checklist

Use this checklist when testing security-critical code:

### File Upload Validation
- [ ] Valid file types accepted (PNG, JPEG, GIF, WebP)
- [ ] Invalid file types rejected (SVG, EXE, TIFF)
- [ ] MIME type validated via magic numbers, not extension
- [ ] File size limits enforced (backend validation)
- [ ] Path traversal attempts blocked
- [ ] Null byte injection blocked
- [ ] Symlink attacks prevented (TOCTOU fix)
- [ ] Broken symlinks handled gracefully

### Error Handling
- [ ] Errors don't expose file paths
- [ ] Errors don't expose system details
- [ ] Stack traces removed before sending to renderer
- [ ] System error codes sanitized (ENOENT, EACCES, etc.)
- [ ] Structured error types used for type safety
- [ ] Unicode paths handled correctly
- [ ] Windows paths sanitized
- [ ] Unix paths sanitized

### IPC Security
- [ ] All inputs from renderer validated
- [ ] Errors sanitized at IPC boundary
- [ ] Sensitive data not sent to renderer
- [ ] File paths sanitized before sending
- [ ] Only necessary data exposed

### Race Conditions
- [ ] No TOCTOU vulnerabilities (check-then-use)
- [ ] File operations are atomic
- [ ] Concurrent operations handled safely
- [ ] No shared mutable state

### Performance & DoS Prevention
- [ ] File size limits prevent memory exhaustion
- [ ] Large datasets tested (performance tests)
- [ ] Concurrent operations tested
- [ ] Resource cleanup in error paths

---

## Best Practices

1. **Write Security Tests First:** Use TDD for security features
2. **Test Attack Scenarios:** Think like an attacker
3. **Use Real Payloads:** Test with actual attack vectors
4. **Verify Error Messages:** Ensure no information leakage
5. **Test Boundary Conditions:** Off-by-one errors are common
6. **Test Concurrent Operations:** Race conditions are subtle
7. **Use Regression Tests:** Prevent known vulnerabilities from returning
8. **Document Security Decisions:** Explain why certain checks exist

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE (Common Weakness Enumeration)](https://cwe.mitre.org/)
- [Electron Security Guidelines](https://www.electronjs.org/docs/latest/tutorial/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## Maintenance

This document should be updated when:
- New security vulnerabilities are discovered
- New attack vectors are identified
- Security mechanisms are added or modified
- Code review identifies security gaps

**Last Updated:** 2026-01-17
