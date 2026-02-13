# ShowStack Renovation Implementation Plan

**Objective:** Transition from a monolithic Electron app using in-memory `sql.js` to a modular "Production Operating System" architecture using native SQLite, Prisma, and a shared Service Layer.
**Strategy:** "The Engine Swap" — Retain the Frontend UI, replace the Data/State Backend.

---

## Phase 0: The Monorepo Restructure (Week 1)

_Goal: Create the structural home for the new architecture without breaking the current app._

### Step 0.1: Workspace Setup

1.  **Initialize Workspaces:**
    In your root `package.json`, replace the current contents with the workspace configuration.
    _Action:_ Rename the current `package.json` to `package.old.json` (as a backup) and create a new `package.json`:

    ```json
    {
      "name": "showstack-monorepo",
      "private": true,
      "scripts": {
        "dev": "npm run dev --workspace=@showstack/desktop",
        "build": "npm run build --workspace=@showstack/desktop",
        "test": "npm run test --workspaces"
      },
      "workspaces": ["apps/*", "packages/*"]
    }
    ```

2.  **Move Existing App:**
    - Create directory `apps/desktop`.
    - Move **all** current source code and config files (`src`, `electron.vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `.eslintrc.cjs`, etc.) into `apps/desktop`.
    - Move the `package.old.json` into `apps/desktop`, rename it back to `package.json`, and update its name:
      ```json
      {
        "name": "@showstack/desktop",
        "version": "0.1.0-alpha"
        // ... rest of file (dependencies, scripts, etc.)
      }
      ```

3.  **Create Shared Package:**
    - Create directory `packages/shared`.
    - Initialize `packages/shared/package.json`:
      ```json
      {
        "name": "@showstack/shared",
        "version": "0.0.1",
        "main": "./dist/index.js",
        "module": "./dist/index.mjs",
        "types": "./dist/index.d.ts",
        "scripts": {
          "build": "tsup src/index.ts --format cjs,esm --dts",
          "dev": "tsup src/index.ts --format cjs,esm --dts --watch"
        },
        "devDependencies": {
          "tsup": "^8.0.0",
          "typescript": "^5.0.0"
        }
      }
      ```
    - Create `packages/shared/tsconfig.json` extending the base config.

### Step 0.2: Fix Paths & Dependencies

1.  **Install Shared Package:**
    In `apps/desktop/package.json`, add the dependency:
    ```json
    "dependencies": {
      "@showstack/shared": "*"
    }
    ```
2.  **Verify Build:**
    Run `npm install` from the root.
    Run `npm run dev` to ensure the Electron app still launches from its new location.

---

## Phase 1: The "Contract" (Type Safety) (Week 1-2)

_Goal: Define the strict shape of data using Zod to ensure runtime safety across boundaries._

### Step 1.1: Install Zod

In `packages/shared`:

```bash
npm install zod
```

### Step 1.2: Define Schemas

Create Zod schemas mirroring your current TypeScript interfaces.

- **File:** `packages/shared/src/schemas/fixture.ts`

  ```typescript
  import { z } from 'zod';

  export const FixtureSchema = z.object({
    id: z.string().uuid(),
    manufacturer: z.string(),
    model: z.string(),
    mode: z.string().optional(),
    universe: z.number().int().min(1),
    address: z.number().int().min(1).max(512),
    channel: z.string().optional(),
    type: z.string(),
    // Add all other fields from your projectSchema.ts
  });

  export type Fixture = z.infer<typeof FixtureSchema>;
  ```

- **File:** `packages/shared/src/schemas/project.ts`

  ```typescript
  import { z } from 'zod';

  export const ProjectSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    venue: z.string().optional(),
    created_at: z.number(),
    updated_at: z.number(),
  });

  export type Project = z.infer<typeof ProjectSchema>;
  ```

- **File:** `packages/shared/src/index.ts`
  ```typescript
  export * from './schemas/fixture';
  export * from './schemas/project';
  export * from './constants/ipc';
  ```

### Step 1.3: Define IPC Channels

Create a single source of truth for IPC strings to prevent typos.

- **File:** `packages/shared/src/constants/ipc.ts`
  ```typescript
  export const CHANNELS = {
    FIXTURES: {
      GET_ALL: 'fixtures:get-all',
      CREATE: 'fixtures:create',
      UPDATE: 'fixtures:update',
      DELETE: 'fixtures:delete',
    },
    PROJECTS: {
      GET_CURRENT: 'projects:get-current',
      SAVE: 'projects:save',
    },
  } as const;
  ```

---

## Phase 2: The Heart Transplant (Database Layer) (Week 2-3)

_Goal: Replace in-memory `sql.js` with native `better-sqlite3` via Prisma._

### Step 2.1: Install Prisma in Desktop

In `apps/desktop`:

```bash
npm install prisma --save-dev
npm install @prisma/client
```

### Step 2.2: Define Prisma Schema

Create `apps/desktop/prisma/schema.prisma`.

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./showstack.db"
}

generator client {
  provider = "prisma-client-js"
}

// Mirror your Zod schemas here
model Fixture {
  id           String  @id @default(uuid())
  manufacturer String
  model        String
  mode         String?
  universe     Int
  address      Int
  channel      String?
  type         String
  // ... rest of fields

  projectId    String
  project      Project @relation(fields: [projectId], references: [id])
}

model Project {
  id          String    @id @default(uuid())
  name        String
  fixtures    Fixture[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Step 2.3: Database Service

Create `apps/desktop/src/main/services/DatabaseService.ts`. This replaces your current `database/index.ts`.

```typescript
import { PrismaClient } from '@prisma/client';
import { app } from 'electron';
import path from 'path';

export class DatabaseService {
  private static instance: PrismaClient;
  private static dbPath: string;

  static async init() {
    if (this.instance) return this.instance;

    // Define path in User Data folder (e.g., AppData/Roaming/ShowStack)
    this.dbPath = path.join(app.getPath('userData'), 'showstack.db');

    // We use an environment variable to tell Prisma where the file is
    process.env.DATABASE_URL = `file:${this.dbPath}`;

    this.instance = new PrismaClient({
      datasources: {
        db: {
          url: `file:${this.dbPath}`,
        },
      },
    });

    // Run migrations (if you have them) or push schema
    // For local desktop apps, 'db push' is often safer/easier than migrations
    // Warning: In production, you will need a migration strategy.

    // CRITICAL: Enable Write-Ahead Logging for performance and concurrency
    await this.instance.$executeRaw`PRAGMA journal_mode = WAL;`;

    return this.instance;
  }

  static get client() {
    if (!this.instance) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.instance;
  }
}
```

---

## Phase 3: The Brain Surgery (Service Layer) (Week 3-4)

_Goal: Decouple business logic from IPC handlers._

### Step 3.1: Create Feature Services

Move logic from `src/main/ipc/fixtures.ts` to `apps/desktop/src/main/services/FixtureService.ts`.

```typescript
import { DatabaseService } from './DatabaseService';
import { FixtureSchema } from '@showstack/shared';

export class FixtureService {
  static async create(projectId: string, data: unknown) {
    const db = DatabaseService.client;

    // Validate incoming data against Zod schema
    // This throws an error if data is invalid, protecting the DB
    const validated = FixtureSchema.parse(data);

    return db.fixture.create({
      data: {
        ...validated,
        projectId,
      },
    });
  }

  static async getAll(projectId: string) {
    const db = DatabaseService.client;
    return db.fixture.findMany({
      where: { projectId },
    });
  }
}
```

### Step 3.2: Rewire IPC Handlers

Refactor `src/main/ipc/fixtures.ts` to be a "dumb" wrapper.

```typescript
import { ipcMain } from 'electron';
import { CHANNELS } from '@showstack/shared';
import { FixtureService } from '../services/FixtureService';

export function registerFixtureHandlers() {
  ipcMain.handle(CHANNELS.FIXTURES.CREATE, async (_, { projectId, data }) => {
    try {
      return await FixtureService.create(projectId, data);
    } catch (e) {
      console.error('Failed to create fixture:', e);
      throw e; // Electron will pass this error to the renderer
    }
  });

  ipcMain.handle(CHANNELS.FIXTURES.GET_ALL, async (_, { projectId }) => {
    return await FixtureService.getAll(projectId);
  });
}
```

---

## Phase 4: Nerve Rewiring (Frontend State) (Week 5-6)

_Goal: Remove data fetching from Zustand and use React Query._

### Step 4.1: Install TanStack Query

In `apps/desktop`:

```bash
npm install @tanstack/react-query
```

### Step 4.2: Setup Provider

Wrap your app in `apps/desktop/src/renderer/src/App.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your existing app components */}
    </QueryClientProvider>
  );
}
```

### Step 4.3: Create Query Hooks

Create `apps/desktop/src/renderer/src/hooks/queries/useFixtures.ts`.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CHANNELS } from '@showstack/shared';

export function useFixtures(projectId: string) {
  return useQuery({
    queryKey: ['fixtures', projectId],
    queryFn: () => window.api.invoke(CHANNELS.FIXTURES.GET_ALL, { projectId }),
  });
}

export function useCreateFixture(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => window.api.invoke(CHANNELS.FIXTURES.CREATE, { projectId, data }),
    onSuccess: () => {
      // Automatically refetch the fixtures list
      queryClient.invalidateQueries({ queryKey: ['fixtures', projectId] });
    },
  });
}
```

### Step 4.4: Refactor Components

Update `VirtualDataGrid.tsx` to remove Zustand usage.

```tsx
// Before
// const fixtures = useFixtureStore(state => state.fixtures);

// After
const { data: fixtures, isLoading } = useFixtures(currentProjectId);

if (isLoading) return <LoadingSpinner />;
return <DataGrid data={fixtures} ... />;
```

---

## Phase 5: The "OS" Pivot (Unified Resource Model) (Week 7+)

_Goal: Implement the polymorphic "Asset" structure to support Sound/Video._

### Step 5.1: Update Prisma Schema

Refactor `schema.prisma` to support polymorphism.

```prisma
model Asset {
  id          String   @id @default(uuid())
  type        String   // "fixture", "speaker", "projector"
  weight      Float
  cost        Float
  projectId   String

  // Relations
  fixtureData FixtureData?
  audioData   AudioData?
}

model FixtureData {
  assetId     String @id
  asset       Asset  @relation(fields: [assetId], references: [id])
  dmxAddress  Int
  universe    Int
  gobo        String?
}

model AudioData {
  assetId     String @id
  asset       Asset  @relation(fields: [assetId], references: [id])
  frequency   String
  inputChannel Int
}
```

### Step 5.2: Create Migration Script

Write a script to migrate existing `Fixture` rows into `Asset` + `FixtureData` rows.

1. Read all rows from old `Fixture` table.
2. For each, create an `Asset` row with common fields (weight, cost).
3. Create a `FixtureData` row with lighting-specific fields.
4. Use a transaction to ensure integrity.

---

## Execution Checklist

### Week 1: Setup

- [ ] Create Monorepo structure (apps/desktop, packages/shared).
- [ ] Set up `@showstack/shared` with Zod.
- [ ] Define `Fixture` and `Project` schemas in shared package.
- [ ] Verify `npm run dev` works in the new structure.

### Week 2: Database

- [ ] Install Prisma & `better-sqlite3` in desktop app.
- [ ] Create `schema.prisma` mirroring current data structure.
- [ ] Implement `DatabaseService.ts` with correct path resolution and WAL mode.

### Week 3: Services

- [ ] Create `FixtureService.ts` (CRUD logic).
- [ ] Create `ProjectService.ts` (CRUD logic).
- [ ] Refactor IPC handlers to import CHANNELS and call Services.

### Week 4: Frontend Hookup

- [ ] Setup `QueryClientProvider` in root App component.
- [ ] Create `useFixtures` and `useCreateFixture` hooks.
- [ ] Refactor `VirtualDataGrid` to use React Query.
- [ ] Remove data fetching logic from `fixtureStore.ts` (keep UI state).

### Week 5: Cleanup & Verification

- [ ] Delete `sql.js` dependency.
- [ ] Delete manual SQL migration scripts (`src/main/database`).
- [ ] Verify 100% feature parity with Alpha v0.1.0.
- [ ] Run full test suite.
