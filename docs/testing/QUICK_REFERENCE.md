# Testing Quick Reference Card

> **Quick reference for common testing tasks**

## Test Commands

```bash
# Development
npm test                    # Watch mode - auto-runs on changes
npm run test:ui             # Visual UI with coverage

# CI/Verification
npm run test:run            # Run once (no watch)
npm run test:coverage       # Generate coverage report

# Specific Tests
npm test powerCalculations  # Run tests matching name
npm test -- --grep="bug"    # Run tests matching pattern
```

---

## Common Test Patterns

### Utility Function Test

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myModule';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('output');
  });

  it('should handle null', () => {
    expect(myFunction(null)).toBe(null);
  });
});
```

### Component Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should handle click', async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();

  render(<Button onClick={onClick}>Click</Button>);
  await user.click(screen.getByText('Click'));

  expect(onClick).toHaveBeenCalled();
});
```

### Async Test

```typescript
it('should fetch data', async () => {
  vi.spyOn(window.api, 'getData')
    .mockResolvedValue({ data: 'test' });

  const result = await fetchData();

  expect(result.data).toBe('test');
});
```

### Error Handling Test

```typescript
it('should handle errors', async () => {
  const spy = vi.spyOn(console, 'error')
    .mockImplementation(() => {});

  vi.spyOn(window.api, 'getData')
    .mockRejectedValue(new Error('Failed'));

  const result = await fetchData();

  expect(result).toEqual([]);
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});
```

---

## Useful Matchers

```typescript
// Equality
expect(value).toBe(5)                    // ===
expect(value).toEqual({ a: 1 })          // Deep equality
expect(value).toStrictEqual({ a: 1 })    // Strict deep equality

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeDefined()
expect(value).toBeNull()
expect(value).toBeUndefined()

// Numbers
expect(value).toBeGreaterThan(3)
expect(value).toBeGreaterThanOrEqual(3)
expect(value).toBeLessThan(5)
expect(value).toBeCloseTo(0.3, 5)        // Floating point

// Strings
expect(string).toMatch(/pattern/)
expect(string).toContain('substring')

// Arrays
expect(array).toHaveLength(3)
expect(array).toContain(item)

// Objects
expect(obj).toHaveProperty('key')
expect(obj).toHaveProperty('key', 'value')

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledTimes(2)
expect(fn).toHaveBeenCalledWith('arg')

// DOM (jest-dom)
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveTextContent('text')
```

---

## Mock Patterns

### Mock Function

```typescript
const mockFn = vi.fn();                  // Create mock
mockFn.mockReturnValue('value');         // Return value
mockFn.mockResolvedValue('value');       // Return promise
mockFn.mockRejectedValue(new Error());   // Reject promise
mockFn.mockImplementation(() => 'value');// Custom implementation
```

### Mock Module

```typescript
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => 'content'),
  existsSync: vi.fn(() => true)
}));
```

### Spy on Method

```typescript
const spy = vi.spyOn(obj, 'method');
spy.mockReturnValue('value');
// ... test ...
spy.mockRestore();                       // Clean up!
```

---

## Coverage Targets

| File Type | Target | Critical? |
|-----------|--------|-----------|
| Critical Utilities | 80%+ | ✅ Yes |
| Standard Utilities | 60-70% | ⚠️ Important |
| Components | 50-60% | 📊 Standard |
| IPC Handlers | 70%+ | ✅ Yes |

---

## AAA Pattern

```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const input = 'test';
  const expected = 'result';

  // Act - Execute the code
  const result = myFunction(input);

  // Assert - Verify the result
  expect(result).toBe(expected);
});
```

---

## Common Mistakes

### ❌ DON'T

```typescript
// Async without await
it('test', () => {
  myAsyncFunction();  // Won't wait!
});

// No assertions
it('test', () => {
  myFunction();  // What are we testing?
});

// Testing implementation
it('test', () => {
  expect(component.state.count).toBe(1); // Internal detail
});
```

### ✅ DO

```typescript
// Async with await
it('test', async () => {
  await myAsyncFunction();
});

// Clear assertions
it('test', () => {
  const result = myFunction();
  expect(result).toBe('expected');
});

// Testing behavior
it('test', () => {
  render(<Counter />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
});
```

---

## Debugging Tests

```typescript
// See what's rendered
import { screen } from '@testing-library/react';
screen.debug();                          // Print DOM
screen.logTestingPlaygroundURL();        // Get selector hints

// See mock calls
console.log(mockFn.mock.calls);          // All calls
console.log(mockFn.mock.calls[0]);       // First call arguments

// Pause execution
await new Promise(r => setTimeout(r, 5000)); // Wait 5s to inspect
```

---

## File Organization

```
src/
└── renderer/
    └── src/
        └── utils/
            ├── myModule.ts
            └── __tests__/
                └── myModule.test.ts     ← Tests here
```

---

## Before Committing

- [ ] All tests pass (`npm run test:run`)
- [ ] Coverage meets targets
- [ ] No console warnings
- [ ] Mocks are cleaned up
- [ ] Tests are deterministic

---

**Full Guide:** `docs/testing/TESTING_GUIDE.md`
**Mocking Strategies:** `docs/testing/MOCKING_STRATEGY.md`
