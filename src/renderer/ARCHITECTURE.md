# ShowStack Frontend Architecture

## Overview

ShowStack is organized as a modular application where each module (Production, Prep, Manager) operates independently while sharing common infrastructure, data access, and styling.

## Directory Structure

```
src/renderer/src/
├── components/
│   ├── common/           # Shared components across all modules
│   │   ├── ModuleCard.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── NewProjectDialog.tsx
│   │   └── DeleteProjectDialog.tsx
│   └── fixture/          # Production module components
│       ├── AddFixtureDialog.tsx
│       ├── BulkEditDialog.tsx
│       ├── ColumnVisibilityMenu.tsx
│       ├── FilterBar.tsx
│       ├── SortBar.tsx
│       ├── Toolbar.tsx
│       ├── VirtualDataGrid.tsx
│       └── VirtualRow.tsx
├── pages/
│   ├── modules/          # Module entry points
│   │   ├── Production.tsx
│   │   ├── Prep.tsx
│   │   └── Manager.tsx
│   ├── LandingPage.tsx
│   └── Login.tsx
├── store/                # Zustand state management
│   ├── fixtureStore.ts   # Production module store
│   └── projectStore.ts   # App-wide project store
├── types/                # TypeScript type definitions
│   ├── index.ts          # Shared types (Fixture, etc.)
│   └── columns.ts        # Column configuration types
├── constants/            # Shared constants and design tokens
│   ├── index.ts
│   └── theme.ts          # Colors, spacing, UI patterns
├── utils/                # Shared utility functions
│   ├── index.ts
│   └── helpers.ts        # Pure utility functions
├── hooks/                # Shared React hooks
│   ├── index.ts
│   ├── useDebounce.ts
│   └── useKeyPress.ts
└── App.tsx               # Root application component
```

## Module Development Guidelines

### Creating a New Module

When creating a new module (e.g., FocusChart, LabelMaker), follow this pattern:

1. **Create the module page**: `src/renderer/src/pages/modules/FocusChart.tsx`

2. **Create module-specific components**: `src/renderer/src/components/focus-chart/`

3. **Create module-specific store** (if needed): `src/renderer/src/store/focusChartStore.ts`

4. **Use shared resources**:
   - Import constants from `@/constants`
   - Import utilities from `@/utils`
   - Import hooks from `@/hooks`
   - Import common components from `@/components/common`

### Example Module Structure

```typescript
// src/renderer/src/pages/modules/FocusChart.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, UI_PATTERNS } from '../../constants';
import { formatDate, calculateDMXAddress } from '../../utils';
import { useDebounce } from '../../hooks';
import { Toolbar } from '../../components/focus-chart/Toolbar';

export function FocusChart() {
  // Module implementation
}
```

## Shared Resources

### 1. Constants (`src/renderer/src/constants/`)

Centralized design tokens ensure visual consistency:

```typescript
import { COLORS, UI_PATTERNS, MODULE_COLORS } from '@/constants';

// Use predefined color schemes
<div className={COLORS.bg.primary}>
  <button className={UI_PATTERNS.buttonPrimary}>
    Click me
  </button>
</div>
```

**Available constants:**
- `COLORS`: Background, text, border, and action colors
- `SPACING`: Consistent padding/margin values
- `ROUNDED`: Border radius values
- `UI_PATTERNS`: Pre-built class combinations for common UI elements
- `MODULE_COLORS`: Per-module accent colors

### 2. Utilities (`src/renderer/src/utils/`)

Shared helper functions for common operations:

```typescript
import { formatDate, calculateDMXAddress, debounce } from '@/utils';

// Format timestamps
const displayDate = formatDate(fixture.created_at);

// DMX calculations
const { universe, dmx_address } = calculateDMXAddress(rawAddress);

// Debounce functions
const debouncedSave = debounce(saveData, 500);
```

**Available utilities:**
- Date/time formatting
- DMX address calculations and parsing
- Debounce function
- Array sorting and filtering helpers
- JSON parsing with fallbacks
- Pluralization helpers

### 3. Hooks (`src/renderer/src/hooks/`)

Custom React hooks for common patterns:

```typescript
import { useDebounce, useKeyPress } from '@/hooks';

// Debounce values (useful for search)
const debouncedSearchTerm = useDebounce(searchTerm, 300);

// Keyboard shortcuts
const enterPressed = useKeyPress('Enter');
const saveShortcut = useKeyPress('s', { ctrl: true });
```

### 4. Common Components (`src/renderer/src/components/common/`)

Reusable UI components shared across modules:

- `ModuleCard`: Display module information on landing page
- `ProjectCard`: Display project information
- `NewProjectDialog`: Create new projects
- `DeleteProjectDialog`: Confirm project deletion

## State Management

### Module-Specific Stores

Each module should have its own Zustand store for module-specific state:

```typescript
// src/renderer/src/store/focusChartStore.ts
import { create } from 'zustand';

interface FocusChartStore {
  charts: Chart[];
  loadCharts: () => Promise<void>;
  // ... other actions
}

export const useFocusChartStore = create<FocusChartStore>((set) => ({
  charts: [],
  loadCharts: async () => {
    const charts = await window.api.focusCharts.getAll();
    set({ charts });
  },
}));
```

### Shared Application State

Use `projectStore.ts` for application-wide state (current project, user settings, etc.)

## Data Access

All data access goes through the Electron IPC API exposed via `window.api`:

```typescript
// Read data
const fixtures = await window.api.fixtures.getAll();

// Create data
await window.api.fixtures.create(newFixture);

// Update data
await window.api.fixtures.update(id, updates);

// Delete data
await window.api.fixtures.delete(id);
```

## Styling Guidelines

### Use Tailwind CSS Classes

All styling uses Tailwind CSS for consistency and maintainability.

### Prefer Shared Constants

Instead of hardcoding colors and classes, use the constants:

```typescript
// ✅ Good
<button className={UI_PATTERNS.buttonPrimary}>Save</button>

// ❌ Avoid
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">Save</button>
```

### Module Accent Colors

Each module can have its own accent color:

```typescript
import { MODULE_COLORS } from '@/constants';

// Production module uses blue
<div className={MODULE_COLORS.production.accent}>...</div>

// Prep module uses purple
<div className={MODULE_COLORS.prep.accent}>...</div>
```

## Component Organization

### Module-Specific Components

Keep components specific to a module in their own directory:

```
src/renderer/src/components/
├── fixture/          # Production module components
├── focus-chart/      # Focus Chart module components
├── label-maker/      # Label Maker module components
└── common/           # Shared across all modules
```

### Component Naming

- Use PascalCase for component files: `AddFixtureDialog.tsx`
- Use descriptive names that indicate purpose: `BulkEditDialog.tsx`, not `Dialog2.tsx`
- Prefix module-specific components when needed: `FixtureToolbar.tsx`, `ChartToolbar.tsx`

## Performance Considerations

### Virtual Scrolling

For large data grids (1000+ rows), use virtual scrolling:

```typescript
import { VirtualDataGrid } from '@/components/common/VirtualDataGrid';
// Or create module-specific version extending common implementation
```

### Debouncing

Use debounce for expensive operations:

```typescript
import { useDebounce } from '@/hooks';

const debouncedValue = useDebounce(searchTerm, 300);
// Only triggers search after user stops typing for 300ms
```

### Memoization

Use `useMemo` for expensive calculations:

```typescript
const filteredData = useMemo(() => {
  return data.filter(/* expensive filter */);
}, [data, filterCriteria]);
```

## Testing Strategy

(To be implemented)

- Unit tests for utility functions
- Component tests for common components
- Integration tests for critical user flows
- E2E tests for cross-module functionality

## Future Enhancements

### Planned Modules

- **Focus Chart**: Focus point visualization and management
- **Label Maker**: Custom label generation and printing
- **Work Notes**: Collaborative notes and task tracking
- **Console Integration**: Console programming and synchronization
- **Vectorworks Integration**: CAD file import/export
- **System Drawings**: Rack elevations and system diagrams
- **Shop Orders**: Equipment ordering and tracking

### Architectural Improvements

- Implement module lazy loading for faster initial load
- Add offline support with local database caching
- Implement real-time collaboration features
- Add comprehensive error boundary components
- Create a plugin system for third-party extensions

## Contributing

When adding new features:

1. Check if shared components/utilities can be reused
2. Add new shared utilities to `src/renderer/src/utils/`
3. Add new hooks to `src/renderer/src/hooks/`
4. Keep module-specific code in module directories
5. Update this documentation for significant architectural changes

## Questions?

For questions about the architecture or how to implement a specific feature, refer to existing modules (especially Production) as reference implementations.
