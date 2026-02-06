# Testing Mock Strategies for ShowStack

This document outlines the mocking strategies used in the ShowStack test suite.

## Overview

The ShowStack Electron application uses **Vitest** for unit/integration testing and **React Testing Library** for component testing. This document describes how to mock various dependencies in tests.

## Electron IPC Mocking

### Renderer Process Tests (React Components)

Mock `window.api.*` calls in `src/renderer/test/setup.ts`. The global setup file provides default mocks for all IPC handlers.

**Override mocks per test:**

```typescript
import { vi } from 'vitest';

// Override specific mock behavior
vi.mocked(window.api.fixtures.getAll).mockResolvedValue([mockFixture1, mockFixture2]);
```

**Example:**

```typescript
import { render, screen } from '@/test/testUtils';
import { vi } from 'vitest';
import { FixtureList } from '../FixtureList';

test('displays fixtures from API', async () => {
  vi.mocked(window.api.fixtures.getAll).mockResolvedValue([
    { id: '1', position: '1', type: 'Moving Light', ... }
  ]);

  render(<FixtureList />);

  expect(await screen.findByText('Moving Light')).toBeInTheDocument();
});
```

### Main Process Tests (Node.js)

Mock Electron modules directly:

```typescript
import { vi } from 'vitest';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  BrowserWindow: vi.fn(),
  app: {
    getPath: vi.fn(() => '/mock/path'),
  },
}));
```

Test IPC handlers independently by calling them directly:

```typescript
import { registerFileHandlers } from '../ipc/files';

test('file:open handler works', async () => {
  registerFileHandlers();

  const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === 'file:open')?.[1];

  const result = await handler?.({}, '/path/to/file.showstack');
  expect(result).toBeDefined();
});
```

## Database Mocking

### SQL.js

Global mock in `setup.ts` provides a basic SQL.js mock. For integration tests, use an in-memory database:

```typescript
import initSqlJs from 'sql.js';

test('database query works', async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run('CREATE TABLE fixtures (id TEXT PRIMARY KEY, position TEXT)');
  db.run("INSERT INTO fixtures VALUES ('1', 'FOH')");

  const stmt = db.prepare('SELECT * FROM fixtures WHERE id = ?');
  stmt.bind(['1']);
  stmt.step();
  const result = stmt.getAsObject();

  expect(result.position).toBe('FOH');
});
```

### Query Mocking

For unit tests, mock individual query functions:

```typescript
import { getAllFixtures } from '../database/queries/fixtures';
import { vi } from 'vitest';

vi.mock('../database/queries/fixtures', () => ({
  getAllFixtures: vi.fn().mockResolvedValue([mockFixture]),
}));
```

## Zustand Store Mocking

### Per-Test Store Overrides

```typescript
import { useFixtureStore } from '@/store/fixtureStore';
import { vi } from 'vitest';

vi.mock('@/store/fixtureStore', () => ({
  useFixtureStore: vi.fn(() => ({
    fixtures: [mockFixture],
    addFixture: vi.fn(),
    updateFixture: vi.fn(),
    deleteFixture: vi.fn(),
  })),
}));
```

### Testing Store Logic

Test store reducers independently (they're pure functions):

```typescript
import { fixtureStore } from '@/store/fixtureStore';

test('addFixture adds fixture to store', () => {
  const initialState = { fixtures: [] };
  const newFixture = { id: '1', position: '1', ... };

  // Test the reducer function directly
  const result = fixtureStore.reducer(initialState, {
    type: 'ADD_FIXTURE',
    payload: newFixture,
  });

  expect(result.fixtures).toHaveLength(1);
  expect(result.fixtures[0]).toEqual(newFixture);
});
```

## External Library Mocking

### lucide-react (Icons)

Mocked globally in `setup.ts` to avoid SVG rendering issues. Returns simple div elements for snapshot testing.

If you need specific icon behavior in a test:

```typescript
import { AlertCircle } from 'lucide-react';
import { vi } from 'vitest';

vi.mocked(AlertCircle).mockReturnValue(<div data-testid="alert-icon">Alert</div>);
```

### react-router-dom

Use `renderWithRouter()` helper from `testUtils.tsx` to wrap components with router:

```typescript
import { renderWithRouter, screen } from '@/test/testUtils';

test('navigation works', () => {
  renderWithRouter(<MyComponent />);
  // Component has access to routing context
});
```

Mock `useNavigate()` for navigation testing:

```typescript
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// In test
fireEvent.click(screen.getByRole('button', { name: /go back/i }));
expect(mockNavigate).toHaveBeenCalledWith(-1);
```

## Best Practices

### 1. Mock at the Boundary

Mock external dependencies (Electron, FS, network), but test internal logic with real implementations.

✅ **Good:**

```typescript
vi.mocked(window.api.fixtures.getAll).mockResolvedValue([...]);
// Test component logic with mocked API
```

❌ **Bad:**

```typescript
vi.mock('../utils/powerCalculations'); // Don't mock what you're testing!
```

### 2. Use Real Implementations When Possible

Don't mock pure functions. Test them directly:

```typescript
import { wattsToKW } from '../utils/powerCalculations';

test('converts watts to kilowatts', () => {
  expect(wattsToKW(1000)).toBe(1);
  expect(wattsToKW(2400)).toBe(2.4);
});
```

### 3. Reset Mocks Between Tests

Configured in `vitest.config.ts` with `mockReset: true`. This ensures each test starts with clean mocks.

### 4. Override Defaults Per Test

Global mocks provide defaults, tests override specifics:

```typescript
// Global setup provides default mock
// src/renderer/test/setup.ts
window.api.fixtures.getAll = vi.fn().mockResolvedValue([]);

// Test overrides with specific data
test('displays fixtures', () => {
  vi.mocked(window.api.fixtures.getAll).mockResolvedValue([mockFixture]);
  // ...
});
```

### 5. Test Behavior, Not Implementation

Mock IPC calls, not internal component state:

✅ **Good:**

```typescript
test('saves changes when save button clicked', async () => {
  render(<Editor />);

  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(window.api.projects.update).toHaveBeenCalledWith(...);
  });
});
```

❌ **Bad:**

```typescript
test('isSaving state is true after save', () => {
  const { result } = renderHook(() => useEditor());
  // Don't test internal state
});
```

## Common Pitfalls

### ❌ Don't Mock What You're Testing

If you're testing `powerCalculations.ts`, don't mock it!

### ❌ Avoid Shallow Mocking

Mock the API contract, not individual functions:

```typescript
// ❌ Bad
vi.fn().mockReturnValue(42);

// ✅ Good
vi.fn().mockResolvedValue({ id: '1', data: [...] });
```

### ❌ Watch for Mock Leaks

Use `afterEach(cleanup)` to reset state (configured in setup.ts):

```typescript
afterEach(() => {
  cleanup(); // Cleans up React components
  vi.clearAllMocks(); // Clears mock call history
});
```

### ❌ Test Async Properly

Always `await` async operations, use `waitFor()` for UI updates:

```typescript
test('loads data', async () => {
  render(<DataComponent />);

  // ✅ Wait for element to appear
  expect(await screen.findByText('Data loaded')).toBeInTheDocument();

  // Or use waitFor
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## Mock Data Utilities

Use helpers from `src/renderer/test/mockData.ts`:

```typescript
import { mockFixture, createMockFixture, createMockFixtures } from '@/test/mockData';

// Use pre-defined mock
const fixture = mockFixture;

// Create custom mock
const customFixture = createMockFixture({ wattage: 2400, position: 'FOH' });

// Create multiple mocks
const fixtures = createMockFixtures(10, { wattage: 1200 });
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
