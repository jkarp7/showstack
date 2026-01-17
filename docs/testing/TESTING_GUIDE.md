# ShowStack Testing Guide

> **Comprehensive guide for writing and maintaining tests in the ShowStack codebase**

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [When to Write Tests](#when-to-write-tests)
- [Test Organization](#test-organization)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [Running Tests](#running-tests)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Overview

ShowStack uses **Vitest** + **React Testing Library** for comprehensive test coverage. All new features and bug fixes should include appropriate tests.

### Current Test Coverage

- **Total Tests:** 235+ tests
- **Global Coverage:** ~50% (alpha.2 target ✓)
- **Critical Utilities:** 95-100% coverage
- **CI/CD:** GitHub Actions with multi-OS testing

---

## Testing Stack

### Core Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **Vitest** | 3.2.4 | Test framework with V8 coverage |
| **@testing-library/react** | 16.1.0 | Component testing |
| **@testing-library/jest-dom** | 6.6.3 | DOM matchers |
| **@testing-library/user-event** | 14.5.2 | User interaction simulation |
| **jsdom** | 26.0.0 | DOM environment for tests |

### Configuration

- **Config File:** `vitest.config.ts`
- **Setup File:** `src/renderer/test/setup.ts`
- **Coverage Provider:** V8 (built into Node.js)

---

## When to Write Tests

### ✅ ALWAYS Write Tests For:

1. **New Features** - All new functionality must include tests
2. **Bug Fixes** - Write tests that would have caught the bug
3. **Utility Functions** - Critical business logic functions
4. **Complex Components** - Components with significant logic
5. **IPC Handlers** - Main process handlers
6. **Security-Critical Code** - Validation, authentication, file handling

### 🤔 CONSIDER Tests For:

- Simple presentational components (if they have logic)
- Hooks with business logic
- Store actions with complex state updates
- Edge cases and error handling

### ❌ DON'T Write Tests For:

- Pure type definitions
- Simple pass-through functions
- Third-party library wrappers (test your usage, not the library)

---

## Test Organization

### File Naming Convention

```
src/
├── renderer/
│   ├── src/
│   │   ├── utils/
│   │   │   ├── powerCalculations.ts
│   │   │   └── __tests__/
│   │   │       └── powerCalculations.test.ts  ← Test file
│   │   └── components/
│   │       ├── Button.tsx
│   │       └── __tests__/
│   │           └── Button.test.tsx            ← Test file
│   └── test/
│       ├── setup.ts                           ← Global setup
│       ├── testUtils.tsx                      ← Test utilities
│       └── mockData.ts                        ← Shared mocks
└── main/
    └── ipc/
        ├── files.ts
        └── __tests__/
            └── files.test.ts                  ← Main process test
```

### Test File Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { functionToTest } from '../moduleToTest';

/**
 * Brief description of what this test file covers
 * Target: X% coverage with Y-Z test cases
 */

describe('Module/Component Name', () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature Group 1', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      // Test edge cases
    });
  });

  describe('Feature Group 2', () => {
    // More tests...
  });
});
```

---

## Writing Tests

### 1. Utility Function Tests

**Example:** Testing power calculation utilities

```typescript
import { describe, it, expect } from 'vitest';
import { wattsToKW, ampsToWatts } from '../powerCalculations';

describe('Power Conversion Utilities', () => {
  describe('wattsToKW', () => {
    it('should convert watts to kilowatts', () => {
      expect(wattsToKW(1000)).toBe(1);
      expect(wattsToKW(2400)).toBe(2.4);
    });

    it('should handle zero watts', () => {
      expect(wattsToKW(0)).toBe(0);
    });

    it('should handle fractional values', () => {
      expect(wattsToKW(1500)).toBe(1.5);
    });
  });

  describe('ampsToWatts', () => {
    it('should convert amps to watts with default 120V', () => {
      expect(ampsToWatts(10)).toBe(1200); // 10A * 120V
    });

    it('should convert amps to watts with custom voltage', () => {
      expect(ampsToWatts(10, 208)).toBe(2080); // 10A * 208V
    });
  });
});
```

**Key Points:**
- Test the happy path first
- Test edge cases (zero, negative, boundary values)
- Test error handling
- Use descriptive test names
- Group related tests with `describe()`

---

### 2. Component Tests

**Example:** Testing a React component

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click Me</Button>);

    await user.click(screen.getByText('Click Me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);

    expect(screen.getByText('Click Me')).toBeDisabled();
  });
});
```

**Key Points:**
- Test user interactions, not implementation details
- Use `screen` queries instead of `container` queries
- Simulate user events with `@testing-library/user-event`
- Test accessibility (disabled states, ARIA attributes)

---

### 3. Async/Database Tests

**Example:** Testing async database operations

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getLabelDataForFixtures } from '../labelDataMapper';

describe('getLabelDataForFixtures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and map selected fixtures by IDs', async () => {
    const mockFixtures = [
      { id: 'fixture-1', position: '1st Electric' },
      { id: 'fixture-2', position: '2nd Electric' }
    ];

    vi.spyOn(window.api.fixtures, 'getByProject')
      .mockResolvedValue(mockFixtures);

    const result = await getLabelDataForFixtures(
      ['fixture-1'],
      'project-1'
    );

    expect(result).toHaveLength(1);
    expect(result[0].position).toBe('1st Electric');
  });

  it('should handle database errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error')
      .mockImplementation(() => {});

    vi.spyOn(window.api.fixtures, 'getByProject')
      .mockRejectedValue(new Error('Database connection failed'));

    const result = await getLabelDataForFixtures(['fixture-1'], 'project-1');

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
```

**Key Points:**
- Mock external dependencies (API calls, database)
- Test both success and error cases
- Use `mockResolvedValue` for successful promises
- Use `mockRejectedValue` for promise rejections
- Restore console spies to avoid test pollution

---

### 4. IPC Handler Tests

**Example:** Testing Electron IPC handlers

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileTypeFromBuffer } from 'file-type';
import * as fs from 'fs';

// Mock dependencies
vi.mock('fs');
vi.mock('file-type');

describe('file:readImageAsDataUrl security validation', () => {
  const mockBuffer = Buffer.from('mock image data');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept PNG images', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(mockBuffer);
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({
      ext: 'png',
      mime: 'image/png',
    });

    // Test the logic
    expect(fs.existsSync('/path/to/image.png')).toBe(true);
    const buffer = fs.readFileSync('/path/to/image.png');
    const fileType = await fileTypeFromBuffer(buffer);

    expect(fileType?.mime).toBe('image/png');
  });

  it('should reject SVG files (XSS prevention)', async () => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({
      ext: 'svg',
      mime: 'image/svg+xml',
    });

    const result = await fileTypeFromBuffer(mockBuffer);

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    expect(ALLOWED_TYPES).not.toContain(result?.mime);
  });
});
```

**Key Points:**
- Mock Node.js modules (fs, path, electron)
- Test security validations thoroughly
- Verify error handling and edge cases
- Test file path validations

---

## Coverage Requirements

### Global Thresholds

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    global: {
      lines: 50,
      functions: 50,
      branches: 45,
      statements: 50
    }
  }
}
```

### Per-File Targets

| File Type | Coverage Target | Example |
|-----------|----------------|---------|
| **Critical Utilities** | 80%+ | powerCalculations.ts, circuitParser.ts |
| **Standard Utilities** | 60-70% | helpers.ts, formatters.ts |
| **Components** | 50-60% | Button.tsx, Modal.tsx |
| **IPC Handlers** | 70%+ | files.ts, projects.ts |

### What Counts as "Tested"

✅ **Good Coverage:**
- All code paths executed
- Edge cases covered
- Error handling verified
- Integration scenarios tested

❌ **False Coverage:**
- Tests that don't assert anything
- Tests that only call functions without validation
- Overly mocked tests that don't test real behavior

---

## Running Tests

### Commands

```bash
# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Run specific test file
npm test powerCalculations

# Run tests matching pattern
npm test -- --grep="should calculate"
```

### Coverage Reports

After running `npm run test:coverage`:
- **Terminal:** Summary table in console
- **HTML Report:** `coverage/index.html`
- **LCOV:** `coverage/lcov.info` (for CI/CD)

---

## Best Practices

### ✅ DO

1. **Write tests BEFORE fixing bugs** - Ensure the test fails first
2. **Use descriptive test names** - "should calculate total capacity when modules provided"
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Test one thing per test** - Keep tests focused
5. **Mock external dependencies** - window.api, fs, database
6. **Clean up after tests** - Use `afterEach` to reset mocks
7. **Test error boundaries** - Verify error handling works
8. **Use real data structures** - Don't over-simplify mocks

### ❌ DON'T

1. **Don't test implementation details** - Test behavior, not internals
2. **Don't write flaky tests** - Tests should be deterministic
3. **Don't skip error cases** - Error handling is critical
4. **Don't mock everything** - Over-mocking hides bugs
5. **Don't ignore warnings** - Fix test warnings immediately
6. **Don't commit failing tests** - All tests must pass
7. **Don't test third-party libraries** - Test YOUR code
8. **Don't duplicate test logic** - Use helper functions

---

## Common Patterns

### Pattern 1: Testing Type Conversions

```typescript
describe('Type Conversion', () => {
  it('should convert numbers to strings', () => {
    const fixture = { unit_number: 42 };
    const result = mapFixtureToLabelData(fixture);

    expect(result.unitNumber).toBe('42'); // Number → String
  });

  it('should handle undefined values', () => {
    const fixture = { unit_number: undefined };
    const result = mapFixtureToLabelData(fixture);

    expect(result.unitNumber).toBe('');
  });
});
```

### Pattern 2: Testing Complex Calculations

```typescript
describe('Phase Balance Calculations', () => {
  it('should detect imbalance above 15%', () => {
    const fixtures = [
      { phase: 'A', wattage: 4160 }, // 20A
      { phase: 'B', wattage: 2080 }, // 10A
      { phase: 'C', wattage: 2080 }  // 10A
    ];

    const balance = calculatePhaseBalance(fixtures, 208);

    expect(balance.max_imbalance_percentage).toBeGreaterThan(15);
    expect(balance.warnings.length).toBeGreaterThan(0);
    expect(balance.warnings[0]).toContain('WARNING');
  });
});
```

### Pattern 3: Testing React Hooks

```typescript
describe('useSettings Hook', () => {
  it('should return default settings when not set', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.theme).toBe('light');
    expect(result.current.autoSave).toBe(true);
  });

  it('should update settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });

    expect(result.current.theme).toBe('dark');
  });
});
```

### Pattern 4: Testing User Interactions

```typescript
describe('Modal Component', () => {
  it('should close when clicking overlay', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<Modal isOpen onClose={handleClose}>Content</Modal>);

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
```

---

## Troubleshooting

### Issue: Tests Pass Locally but Fail in CI

**Causes:**
- Timing issues (async operations)
- File system differences
- Environment variables not set

**Solutions:**
- Use `waitFor()` for async assertions
- Mock file system operations
- Set env vars in CI config

### Issue: "Cannot find module" in Tests

**Causes:**
- Missing mock in setup.ts
- Import path issues

**Solutions:**
- Add mock to `src/renderer/test/setup.ts`
- Check import paths are correct
- Ensure `vitest.config.ts` has correct aliases

### Issue: Coverage Not Updating

**Causes:**
- Cached coverage data
- File not being imported

**Solutions:**
```bash
rm -rf coverage/ .vitest/
npm run test:coverage
```

### Issue: React Testing Library Warnings

**Common Warnings:**
- "not wrapped in act()"
- "Can't perform state update on unmounted component"

**Solutions:**
- Use `waitFor()` for async state updates
- Clean up subscriptions in component cleanup
- Use `cleanup()` from `@testing-library/react`

---

## Additional Resources

### Documentation

- **Vitest Docs:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react
- **Testing Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

### Internal Docs

- `docs/testing/MOCKING_STRATEGY.md` - Mocking patterns
- `src/renderer/test/testUtils.tsx` - Custom test utilities
- `src/renderer/test/mockData.ts` - Shared mock data

### Example Test Files

- `src/renderer/src/utils/__tests__/powerCalculations.test.ts` - Utility tests
- `src/renderer/src/components/prep/layout/__tests__/ElementInspector.test.tsx` - Component tests
- `src/main/ipc/__tests__/files.test.ts` - IPC handler tests

---

## Checklist for New Tests

Before committing new tests, ensure:

- [ ] All tests pass locally
- [ ] Tests follow naming conventions
- [ ] Tests are in `__tests__` directory
- [ ] Mocks are properly cleaned up
- [ ] Coverage meets target for file type
- [ ] Tests are deterministic (no random values)
- [ ] Error cases are tested
- [ ] Edge cases are covered
- [ ] Tests have descriptive names
- [ ] No test warnings or errors

---

## Updating This Guide

This guide should be updated when:
- New testing patterns emerge
- Testing tools are upgraded
- Coverage requirements change
- New test types are added

**Last Updated:** 2026-01-17
**Version:** 1.0.0
