# Claude Code Quickstart — ShowStack

**For:** AI-assisted development on an active codebase
**Branch:** `develop` (feature branches off this)
**Status:** Alpha — ~92% complete, actively seeking beta testers

---

## Current State

The app is largely built. Day-to-day work is bug fixes, feature additions, and polish — not scaffolding.

**Start every session:**

```bash
npm run dev          # start Electron + Vite dev server
npx tsc --noEmit     # type check (must be 0 errors)
npm run lint         # ESLint (≤855 warnings in CI)
npm run test:run     # run full test suite
```

**Key files to orient yourself:**

- `docs/development/lighting_project_status.md` — feature tracking, pending/completed work
- `README.md` — high-level overview and feature list
- `PROJECT_STATUS.md` — comprehensive tracking (root level)

---

## Architecture

```
apps/desktop/src/
├── main/           # Electron main process (Node.js)
│   ├── ipc/        # IPC handlers — one file per domain
│   ├── database/   # better-sqlite3 queries + migrations
│   ├── services/   # Business logic (FixtureService, etc.)
│   └── menu/       # App menu state machine
│
├── preload/
│   └── index.ts    # contextBridge — exposes window.api to renderer
│
└── renderer/src/
    ├── pages/      # Route-level components
    ├── components/ # Reusable UI components
    ├── store/      # Zustand stores (9 stores)
    ├── hooks/      # Custom hooks (useValidation, etc.)
    ├── utils/      # Pure utility functions
    └── types/      # TypeScript interfaces
```

**Two databases:**

- `app.db` — global (auth, licenses, preferences)
- `projects.db` — per-project (fixtures, shop orders, infrastructure, racks)

---

## Adding a New IPC Handler (Standard Pattern)

**1. Main process** (`apps/desktop/src/main/ipc/<domain>.ts`):

```typescript
ipcMain.handle('domain:action', async (_event, param: string) => {
  try {
    const result = await someService.doThing(param);
    return result;
  } catch (error) {
    logger.error('Failed to do thing:', {
      operation: 'domain:action',
      param,
      error: error instanceof Error ? error.message : error,
    });
    throw new Error(error instanceof Error ? error.message : 'Failed');
  }
});
```

**2. Preload** (`apps/desktop/src/preload/index.ts`):

Add to both the `contextBridge.exposeInMainWorld` implementation block AND the `ElectronAPI` TypeScript interface:

```typescript
// Implementation (contextBridge block):
doThing: (param: string) => ipcRenderer.invoke('domain:action', param),

// Type declaration (ElectronAPI interface):
doThing: (param: string) => Promise<ResultType>;
```

**3. Renderer:**

```typescript
const result = await window.api.domain.doThing(param);
```

---

## Saving Files (Native Save Dialog)

Use the `file:saveText` IPC handler for text-based exports:

```typescript
// Renderer
const result = await window.api.files.saveText(
  content, // string content
  'default-name.csv', // suggested filename
  [{ name: 'CSV Files', extensions: ['csv'] }], // filters
);
if (result.success) {
  /* saved to result.filePath */
}
```

This shows a native macOS/Windows save dialog. Don't use `URL.createObjectURL` + `link.click()` — that silently saves to Downloads.

---

## Menu Context System

The app menu is context-aware. When a component mounts, it sets its context:

```typescript
useEffect(() => {
  window.api?.menu?.setState({ context: 'equipment' });
  return () => {
    window.api?.menu?.setState({ context: 'module' });
  };
}, []);
```

**Contexts:** `landing` | `project` | `module` | `equipment` | `infrastructure` | `power` | `shop-order` | `paperwork` | `labels`

**Critical:** React runs child effects before parent effects. `ProjectWorkspace` intentionally does NOT set `context` — only child route components do, to avoid overwriting each other.

---

## Validation / Show Health

Add new checks to `apps/desktop/src/renderer/src/utils/validation.ts`:

```typescript
function detectMyCheck(fixtures: Fixture[]): ValidationIssue[] {
  const ids = fixtures.filter(/* condition */).map((f) => f.id);
  if (!ids.length) return [];
  return [
    {
      id: 'unique-check-id',
      severity: 'error' | 'warning',
      sidebarItem: 'fixtures' | 'infrastructure' | 'racks',
      type: 'Human Readable Name',
      message: `${ids.length} fixture(s) have the problem.`,
      entityIds: ids,
    },
  ];
}
```

Then add it to `runValidation()`. The `useValidation` hook and Show Health page pick it up automatically — no other changes needed.

---

## Logger

```typescript
// Correct usage — context must be an object, NOT a string
logger.info(`Loading project: ${projectId}`);
logger.error('Failed to load project:', { projectId, error: error.message });

// Wrong — second arg must be LogContext object
logger.error('Failed', 'some string'); // ❌
```

---

## Common Pitfalls

- **`ProjectRowSchema`** validates raw SQLite rows BEFORE JSON parsing. JSON fields (`show_dates`, associates arrays, etc.) must be typed as `z.string().nullish()` in the schema since they're stored as strings in SQLite.
- **Zustand `mockReset: true`** in vitest.config.ts resets mock implementations between tests. Always re-set mock return values in `beforeEach`.
- **`better-sqlite3`** needs `npm rebuild better-sqlite3` after Electron rebuilds, or `npx electron-rebuild -f -w better-sqlite3` for Electron (breaks vitest until you run `npm rebuild`).
- **Renderer files** using `import.meta.env` need `apps/desktop/src/env.d.ts` for root tsconfig type resolution.
- **Don't use `z.infer`** as canonical types — `"strict": false` in tsconfig makes all inferred fields optional.

---

## Running Tests

```bash
npm run test:run          # all tests, CI mode
npm test                  # watch mode
npm run test:coverage     # with coverage report
npm run test:ui           # visual UI
```

Test files live alongside source: `ComponentName.test.ts` or in `__tests__/` directories.

---

## Supabase / Database

```bash
npx supabase link --project-ref jfjvlsvuojuglfnokddl
npx supabase db push      # push migrations (needs SUPABASE_ACCESS_TOKEN)
```

Migrations: `supabase/migrations/` — numbered sequentially (001, 002, ...).

---

## Branching

```bash
git checkout develop
git checkout -b feature/my-feature
# work...
git push origin feature/my-feature
# open PR → develop
```

Main branch (`main`) is for releases. `develop` is the integration branch.
