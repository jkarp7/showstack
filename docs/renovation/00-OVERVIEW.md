# ShowStack: Comprehensive Renovation Plan
**Architecture:** Local-First with PowerSync + Supabase
**Timeline:** 8.5-11.5 months (solo developer + Claude)
**Focus:** Stability, Cloud Collaboration, Code Organization, Production Readiness
**Date:** February 3, 2026

---

## Executive Summary

Transform ShowStack from a desktop-only lighting tool to a **local-first, cloud-synced Production Operating System** using **PowerSync + Supabase**, while improving code organization and following best practices throughout.

### Key Objectives
✅ **Stability** - Zero data loss, better-sqlite3, error handling, automated backups
✅ **Cloud Collaboration** - Real-time multi-user editing via PowerSync + Supabase
✅ **Code Organization** - Break up large files, follow SOLID principles, improve maintainability
✅ **Type Safety** - Zod validation, service layer, shared types
✅ **Production Ready** - 70% test coverage, CI/CD, monitoring, security
✅ **Clear Naming** - Rename "prep" → "shop-order" throughout codebase

### Architecture Decision
**PowerSync + Supabase** instead of custom backend:
- ⏱️ **15-20 weeks saved** (6-8 weeks vs 16-20 weeks)
- 💰 **$0/month MVP cost** (vs $46-76/month)
- 🛠️ **Zero backend code** to write/maintain
- ✅ **Battle-tested** production stack

---

## Current State Assessment

### Critical Issues
1. ❌ **Data Loss Risk** - Manual `saveDatabase()` after every mutation (line 807 of `database/index.ts`)
2. ❌ **No Cloud Collaboration** - Offline-only (required for Lightwright parity)
3. ❌ **Poor File Organization** - 881-line `database/index.ts`, 1337-line `ipc/prep.ts`
4. ❌ **Confusing Naming** - "prep" references should be "shop-order"
5. ❌ **Limited Validation** - Input validation at IPC level only
6. ❌ **Testing Gaps** - 50% coverage, no integration tests

### Large Files to Refactor
| File | Lines | Status | Action |
|------|-------|--------|--------|
| `src/main/database/index.ts` | 881 | Monolithic | Split into modules |
| `src/main/ipc/prep.ts` | 1337 | Too large | Extract services + rename |
| `src/main/database/queries/fixtures.ts` | 300+ | Decent | Keep, add validation |
| `src/renderer/src/pages/modules/EquipmentManager.tsx` | 54KB | Too large | Split into components |
| `src/renderer/src/pages/modules/Prep.tsx` | 56KB | Too large | Split + rename to ShopOrderBuilder.tsx |

---

## Phase 0: Stabilization & Code Organization (7-9 weeks)

### 0.1 Error Handling & Resilience (2 weeks)

**Goal:** Prevent silent failures and implement proper error handling

**New Files to Create:**
- `src/main/errors/DatabaseError.ts` - Custom error classes
- `src/main/errors/ValidationError.ts` - Validation-specific errors
- `src/main/errors/ErrorHandler.ts` - Global error handler with retry logic

**Example:** `src/main/errors/DatabaseError.ts`
```typescript
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly recoverable: boolean,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 'connection', true, originalError);
    this.name = 'ConnectionError';
  }
}
```

**Success Criteria:**
- ✅ Zero silent failures
- ✅ All IPC handlers wrapped with try-catch
- ✅ 90%+ coverage on error handling

---

### 0.2 Refactor database/index.ts (881 lines → modular structure) (2-3 weeks)

**Goal:** Break monolithic database file into focused modules following Single Responsibility Principle

**New Structure:**
```
src/main/database/
  ├── index.ts (50 lines - exports only)
  ├── /core/
  │   ├── DatabaseManager.ts (database initialization)
  │   ├── ConnectionPool.ts (connection management)
  │   └── MigrationRunner.ts (schema migrations)
  ├── /schemas/
  │   ├── appSchema.ts
  │   └── projectSchema.ts
  ├── /migrations/
  │   ├── 001-initial-schema.ts
  │   ├── 002-add-infrastructure.ts
  │   └── index.ts (migration registry)
  ├── /persistence/
  │   ├── DatabaseWriter.ts (file persistence)
  │   ├── WriteQueue.ts (debounced writes)
  │   └── BackupManager.ts (automatic backups)
  ├── /queries/
  │   ├── fixtures.ts
  │   ├── projects.ts
  │   ├── shop-order.ts (renamed from prep.ts)
  │   └── infrastructure.ts
  └── /indexes/
      └── performanceIndexes.ts
```

**Success Criteria:**
- ✅ `database/index.ts` reduced from 881 to ~50 lines
- ✅ Each module <200 lines
- ✅ Single Responsibility Principle followed
- ✅ All existing functionality works

---

### 0.3 Naming Refactor: "prep" → "shop-order" (1 week)

**Goal:** Rename confusing "prep" references to clear "shop-order" naming throughout codebase

**Problem:** "prep" is ambiguous - it's actually the **Shop Order Builder** tool (part of Lighting module, works alongside Equipment Manager)

**Database Tables (rename via migration):**
```sql
ALTER TABLE prep_projects RENAME TO shop_order_projects;
ALTER TABLE prep_sections RENAME TO shop_order_sections;
ALTER TABLE prep_equipment_items RENAME TO shop_order_items;
ALTER TABLE prep_revisions RENAME TO shop_order_revisions;
ALTER TABLE prep_notes RENAME TO shop_order_notes;
ALTER TABLE prep_note_templates RENAME TO shop_order_note_templates;
```

**File Renames (git mv for history preservation):**
```bash
# Database
git mv src/main/database/queries/prep.ts \
       src/main/database/queries/shop-order.ts

# IPC
git mv src/main/ipc/prep.ts \
       src/main/ipc/shop-order.ts

# Stores
git mv src/renderer/src/store/prepStore.ts \
       src/renderer/src/store/shopOrderStore.ts

# Components
git mv src/renderer/src/components/prep \
       src/renderer/src/components/shop-order

git mv src/renderer/src/pages/modules/Prep.tsx \
       src/renderer/src/pages/modules/ShopOrderBuilder.tsx

# Utils
git mv src/renderer/src/utils/prep \
       src/renderer/src/utils/shop-order
```

**IPC Channel Renames:**
```typescript
// Before: 'prep:projects:getAll'
// After:  'shop-order:projects:getAll'
```

**Service Extraction (while refactoring):**
Break 1337-line `ipc/prep.ts` into focused services:
- `ShopOrderProjectService.ts` - Project CRUD
- `ShopOrderSectionService.ts` - Section management
- `ShopOrderItemService.ts` - Equipment items
- `ShopOrderRevisionService.ts` - Revision tracking
- `ShopOrderNoteService.ts` - Notes management

**Success Criteria:**
- ✅ All "prep" references renamed
- ✅ Database migration successful (data preserved)
- ✅ Service layer extracted (1337-line file broken up)
- ✅ All tests passing
- ✅ Git history preserved
- ✅ Consistent naming throughout

---

### 0.4 Monitoring & Observability (1 week)

**Goal:** Track performance and errors from day 1

**File:** `src/main/monitoring/PerformanceMonitor.ts`
```typescript
export class PerformanceMonitor {
  trackDatabaseQuery(operation: string, duration: number): void {
    posthog.capture('database_query', {
      operation,
      duration_ms: duration,
      slow_query: duration > 1000
    });
  }

  trackMemoryUsage(): void {
    const usage = process.memoryUsage();
    posthog.capture('memory_usage', {
      heap_used_mb: usage.heapUsed / 1024 / 1024
    });
  }
}
```

**Success Criteria:**
- ✅ All database queries tracked
- ✅ Slow query alerts (>1s)
- ✅ Memory usage dashboard

---

## Phase 1: Database Migration to better-sqlite3 (8-10 weeks)

### 1.1 Install better-sqlite3
```bash
npm install better-sqlite3 @types/better-sqlite3
```

### 1.2 Update DatabaseManager (2 weeks)

**File:** `src/main/database/core/DatabaseManager.ts` (UPDATE)
```typescript
import Database from 'better-sqlite3';

export class DatabaseManager {
  async initializeProjectDatabase(): Promise<void> {
    this.projectDb = new Database(this.projectDbPath);

    // Enable WAL mode (auto-persists, no manual save needed!)
    this.projectDb.pragma('journal_mode = WAL');
    this.projectDb.pragma('foreign_keys = ON');
    this.projectDb.pragma('synchronous = NORMAL');

    this.projectDb.exec(PROJECT_SCHEMA);

    const migrationRunner = new MigrationRunner(this.projectDb);
    await migrationRunner.runProjectMigrations();
  }
}
```

**Success Criteria:**
- ✅ 10-20x performance improvement
- ✅ Zero data loss during migration
- ✅ Backward compatibility with .ss files

### 1.3 Add Transaction Support (1-2 weeks)

**File:** `src/main/database/core/TransactionManager.ts` (NEW)
```typescript
export class TransactionManager {
  constructor(private db: Database.Database) {}

  execute<T>(callback: () => T): T {
    const transaction = this.db.transaction(callback);
    return transaction();
  }
}
```

**Usage:**
```typescript
// Bulk create with transaction
txManager.execute(() => {
  for (const fixture of fixtures) {
    this.create(fixture);
  }
});
```

**Success Criteria:**
- ✅ All bulk operations use transactions
- ✅ Rollback on error verified
- ✅ ACID guarantees enforced

### 1.4 Performance Optimization (2-3 weeks)

**File:** `src/main/database/indexes/performanceIndexes.ts` (NEW)
```sql
CREATE INDEX idx_fixtures_project ON fixtures(project_id);
CREATE INDEX idx_fixtures_type ON fixtures(type);
CREATE INDEX idx_shop_order_sections_project ON shop_order_sections(shop_order_project_id);
CREATE INDEX idx_shop_order_items_section ON shop_order_items(section_id);
```

**Success Criteria:**
- ✅ Query performance improved by 10x
- ✅ Load time <2s for 10k fixtures
- ✅ p95 latency <50ms

---

## Phase 2: Validation & Service Layer (6-8 weeks)

### 2.1 Monorepo Setup (1 week)

**New Structure:**
```
/apps/
  /desktop/          ← Move existing src/ here
/packages/
  /shared/           ← NEW: Shared types, validation
```

**Root package.json:**
```json
{
  "name": "showstack-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev --workspace=@showstack/desktop"
  }
}
```

### 2.2 Zod Validation Layer (3-4 weeks)

**Install:**
```bash
npm install zod --workspace=@showstack/shared
```

**File:** `packages/shared/src/validation/fixtureSchema.ts`
```typescript
import { z } from 'zod';

export const FixtureSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  type: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(10000),
  universe: z.number().int().min(1).max(64).optional(),
  dmx_address: z.number().int().min(1).max(512).optional(),
  created_at: z.number().int(),
  updated_at: z.number().int()
});

export type Fixture = z.infer<typeof FixtureSchema>;

export const CreateFixtureSchema = FixtureSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});
```

**File:** `packages/shared/src/validation/shopOrderSchema.ts` (renamed from prepSchema.ts)
```typescript
export const ShopOrderProjectSchema = z.object({
  id: z.string().uuid(),
  production_name: z.string().min(1),
  disciplines: z.array(z.enum(['lighting', 'audio', 'video'])),
  current_revision: z.number().int().min(0).max(5)
});

export const ShopOrderSectionSchema = z.object({
  id: z.string().uuid(),
  shop_order_project_id: z.string().uuid(),
  name: z.string().min(1)
});

export const ShopOrderItemSchema = z.object({
  id: z.string().uuid(),
  section_id: z.string().uuid(),
  description: z.string().min(1),
  active_qty: z.number().int().min(0),
  spare_qty: z.number().int().min(0)
});
```

**Success Criteria:**
- ✅ All entities have Zod schemas
- ✅ All IPC handlers validate input
- ✅ Performance impact <5ms per validation

### 2.3 Service Layer Extraction (2-3 weeks)

**File Structure:**
```
apps/desktop/src/main/services/
  ├── FixtureService.ts
  ├── ProjectService.ts
  ├── ShopOrderProjectService.ts (renamed from PrepProjectService)
  ├── ShopOrderSectionService.ts (renamed from PrepSectionService)
  ├── ShopOrderItemService.ts (renamed from PrepItemService)
  ├── InfrastructureService.ts
  └── index.ts
```

**Example:** `apps/desktop/src/main/services/FixtureService.ts`
```typescript
import { CreateFixtureSchema, Fixture } from '@showstack/shared';
import { getProjectDatabase } from '../database';
import { v4 as uuid } from 'uuid';

export class FixtureService {
  async create(input: unknown): Promise<Fixture> {
    const data = CreateFixtureSchema.parse(input);

    const fixture: Fixture = {
      ...data,
      id: uuid(),
      created_at: Date.now(),
      updated_at: Date.now()
    };

    const db = getProjectDatabase();
    const stmt = db.prepare(`
      INSERT INTO fixtures (id, project_id, type, quantity, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(fixture.id, fixture.project_id, fixture.type, fixture.quantity, fixture.created_at, fixture.updated_at);

    return fixture;
  }

  async findByProject(projectId: string): Promise<Fixture[]> {
    const db = getProjectDatabase();
    const stmt = db.prepare('SELECT * FROM fixtures WHERE project_id = ?');
    return stmt.all(projectId);
  }
}
```

**Update IPC Handlers (thin wrappers):**

**File:** `apps/desktop/src/main/ipc/shop-order.ts` (REFACTOR from prep.ts, 1337 lines → ~150 lines)
```typescript
import { ipcMain } from 'electron';
import { ShopOrderProjectService, ShopOrderSectionService, ShopOrderItemService } from '../services';

const projectService = new ShopOrderProjectService();
const sectionService = new ShopOrderSectionService();
const itemService = new ShopOrderItemService();

export function registerShopOrderHandlers(): void {
  // Projects
  ipcMain.handle('shop-order:projects:getAll', async () => {
    return projectService.findAll();
  });

  ipcMain.handle('shop-order:projects:create', async (event, input) => {
    return projectService.create(input);
  });

  // Sections
  ipcMain.handle('shop-order:sections:getAll', async (event, projectId) => {
    return sectionService.findByProject(projectId);
  });

  // Items
  ipcMain.handle('shop-order:items:getAll', async (event, sectionId) => {
    return itemService.findBySection(sectionId);
  });
}
```

**Success Criteria:**
- ✅ All business logic in services
- ✅ IPC handlers <150 lines each
- ✅ 80%+ coverage on service layer
- ✅ "prep" fully renamed to "shop-order"

---

## Phase 3: Cloud Collaboration - Supabase + PowerSync (6-8 weeks)

### 3.1 Supabase Project Setup (1 week)

**Why PowerSync + Supabase:**
- ✅ Zero backend code to write
- ✅ **Saves 15-20 weeks** vs custom backend
- ✅ **$0/month** for MVP

**Setup:**
1. Create Supabase project at https://supabase.com
2. Note credentials (URL, anon key, service role key)

**Database Schema:**

**File:** `supabase/schema.sql` (NEW)
```sql
-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixtures
CREATE TABLE fixtures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  manufacturer TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop Orders (renamed from prep)
CREATE TABLE shop_order_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_project_id UUID REFERENCES projects(id),
  production_name TEXT NOT NULL,
  disciplines JSONB,
  current_revision INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shop_order_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_order_project_id UUID REFERENCES shop_order_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shop_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES shop_order_sections(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  active_qty INTEGER DEFAULT 0,
  spare_qty INTEGER DEFAULT 0,
  venue_qty INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_projects ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Similar policies for fixtures, shop_order_*
```

**Environment Variables:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

### 3.2 PowerSync SDK Integration (3-4 weeks)

**Install:**
```bash
npm install @powersync/web @powersync/common
```

**File:** `apps/desktop/src/main/services/PowerSyncService.ts` (NEW)
```typescript
import { PowerSyncDatabase } from '@powersync/web';
import { Column, ColumnType, Schema, Table } from '@powersync/common';

const SCHEMA = new Schema([
  new Table({
    name: 'projects',
    columns: [
      new Column({ name: 'id', type: ColumnType.TEXT }),
      new Column({ name: 'name', type: ColumnType.TEXT }),
      new Column({ name: 'user_id', type: ColumnType.TEXT })
    ]
  }),
  new Table({
    name: 'fixtures',
    columns: [
      new Column({ name: 'id', type: ColumnType.TEXT }),
      new Column({ name: 'project_id', type: ColumnType.TEXT }),
      new Column({ name: 'type', type: ColumnType.TEXT }),
      new Column({ name: 'quantity', type: ColumnType.INTEGER })
    ]
  }),
  new Table({
    name: 'shop_order_projects',
    columns: [
      new Column({ name: 'id', type: ColumnType.TEXT }),
      new Column({ name: 'production_name', type: ColumnType.TEXT })
    ]
  })
]);

export class PowerSyncService {
  private db: PowerSyncDatabase;

  async init(): Promise<void> {
    this.db = new PowerSyncDatabase({
      database: { dbFilename: 'showstack-powersync.db' },
      schema: SCHEMA
    });

    await this.db.init();

    // Connect to Supabase
    await this.db.connect({
      powerSyncUrl: process.env.POWERSYNC_URL!,
      token: async () => this.getSupabaseToken()
    });
  }

  private async getSupabaseToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }
}
```

**Update Services:**
```typescript
export class FixtureService {
  constructor(private powerSync: PowerSyncService) {}

  async create(input: unknown): Promise<Fixture> {
    // Insert locally - PowerSync automatically syncs to cloud!
    await this.powerSync.execute(`
      INSERT INTO fixtures (id, project_id, type, quantity)
      VALUES (?, ?, ?, ?)
    `, [fixture.id, fixture.project_id, fixture.type, fixture.quantity]);

    return fixture;
  }
}
```

**Success Criteria:**
- ✅ PowerSync syncing bidirectionally
- ✅ Local changes sync to cloud
- ✅ Cloud changes appear locally in real-time
- ✅ Offline mode works

---

### 3.3 Supabase Auth Integration (1-2 weeks)

**Install:**
```bash
npm install @supabase/supabase-js
```

**File:** `apps/desktop/src/main/services/SupabaseAuthService.ts` (NEW)
```typescript
import { createClient } from '@supabase/supabase-js';

export class SupabaseAuthService {
  private supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Initialize PowerSync
    await powerSyncService.init();
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}
```

**UI:**

**File:** `apps/desktop/src/renderer/src/pages/Auth/Login.tsx` (NEW)
```typescript
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await window.api.auth.signIn(email, password);
    navigate('/');
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

---

### 3.4 Collaboration UI (1 week)

**Presence Indicator:**

**File:** `apps/desktop/src/renderer/src/components/collaboration/PresenceIndicator.tsx` (NEW)
```typescript
export function PresenceIndicator({ projectId }: { projectId: string }) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`project:${projectId}`);
    channel.on('presence', { event: 'sync' }, () => {
      setUsers(Object.values(channel.presenceState()).flat());
    }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [projectId]);

  return (
    <div>
      {users.map(user => <div key={user.user_id}>{user.user_id[0]}</div>)}
      <span>{users.length} users online</span>
    </div>
  );
}
```

**Sync Status:**

**File:** `apps/desktop/src/renderer/src/components/collaboration/SyncStatus.tsx` (NEW)
```typescript
export function SyncStatus() {
  const [status, setStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  return (
    <div>
      {status === 'synced' && <span>✓ Synced</span>}
      {status === 'syncing' && <span>⟳ Syncing...</span>}
      {status === 'offline' && <span>○ Offline</span>}
    </div>
  );
}
```

---

## Phase 4: Testing & Quality (4-6 weeks)

### 4.1 Unit Test Expansion (2-3 weeks)

**Goal:** 70% coverage (up from 50%)

**Example:** `apps/desktop/src/main/services/__tests__/FixtureService.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { FixtureService } from '../FixtureService';

describe('FixtureService', () => {
  it('should create fixture with valid data', async () => {
    const service = new FixtureService(mockPowerSync);
    const fixture = await service.create({
      project_id: 'test',
      type: 'Moving Light',
      quantity: 10
    });

    expect(fixture.id).toBeDefined();
    expect(fixture.type).toBe('Moving Light');
  });

  it('should reject invalid data', async () => {
    const service = new FixtureService(mockPowerSync);
    await expect(service.create({})).rejects.toThrow();
  });
});
```

**Success Criteria:**
- ✅ 70%+ overall coverage
- ✅ All services tested
- ✅ All validation schemas tested

### 4.2 Integration Testing (2-3 weeks)

**Example:** Full CRUD lifecycle tests for fixtures, shop orders, etc.

**Success Criteria:**
- ✅ 15+ integration tests
- ✅ All critical workflows tested

---

## Phase 5: CI/CD & DevOps (2-3 weeks)

### 5.1 Enhanced GitHub Actions (1 week)

**File:** `.github/workflows/test.yml` (UPDATE)
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run test:run
      - run: npm run test:coverage
```

### 5.2 Pre-commit Hooks (1 week)

**Install:**
```bash
npm install --save-dev husky lint-staged
npx husky install
```

**File:** `.husky/pre-commit`
```bash
#!/bin/sh
npx lint-staged
npm run type-check
```

---

## Phase 6: Security & Monitoring (3-4 weeks)

### 6.1 Sentry Integration (1-2 weeks)

**Install:**
```bash
npm install @sentry/electron
```

**File:** `apps/desktop/src/main/monitoring/sentry.ts` (NEW)
```typescript
import * as Sentry from '@sentry/electron/main';

export function initSentry(): void {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production'
  });
}
```

### 6.2 Health Check System (1-2 weeks)

**File:** `apps/desktop/src/main/monitoring/HealthChecker.ts` (NEW)
```typescript
export class HealthChecker {
  async checkHealth(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      checks: {
        database: await this.checkDatabase(),
        cloudConnection: await this.checkCloudConnection()
      }
    };
  }
}
```

---

## Phase 7: Disaster Recovery (1-2 weeks)

### 7.1 Automated Backups (1 week)

**File:** `apps/desktop/src/main/services/BackupService.ts` (NEW)
```typescript
export class BackupService {
  private readonly MAX_BACKUPS = 10;
  private readonly BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  start(): void {
    this.createBackup();
    setInterval(() => this.createBackup(), this.BACKUP_INTERVAL_MS);
  }

  createBackup(): void {
    const timestamp = new Date().toISOString();
    const backupPath = `showstack-${timestamp}.db`;
    copyFileSync(dbPath, backupPath);
    this.cleanupOldBackups();
  }
}
```

### 7.2 Crash Recovery (1 week)

**File:** `apps/desktop/src/main/recovery/CrashRecovery.ts` (NEW)
```typescript
export class CrashRecovery {
  async recover(): Promise<void> {
    const isValid = await this.validateDatabase();
    if (!isValid) {
      await this.restoreFromBackup();
    }
  }
}
```

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 0: Stabilization** | 7-9 weeks | Error handling, file organization, shop-order rename, monitoring |
| **Phase 1: Database Migration** | 8-10 weeks | better-sqlite3, transactions, performance |
| **Phase 2: Validation & Services** | 6-8 weeks | Zod, service layer, monorepo |
| **Phase 3: Supabase + PowerSync** | 6-8 weeks | Cloud sync, auth, real-time collaboration |
| **Phase 4: Testing** | 4-6 weeks | 70% coverage, integration tests |
| **Phase 5: CI/CD** | 2-3 weeks | GitHub Actions, pre-commit hooks |
| **Phase 6: Security & Monitoring** | 3-4 weeks | Sentry, health checks |
| **Phase 7: Disaster Recovery** | 1-2 weeks | Backups, crash recovery |

**Total: 37-52 weeks (8.5-12 months)**
**Time Saved vs Custom Backend: 15-20 weeks**

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **Test Coverage** | 50% | 70% |
| **Query Performance (p95)** | Unknown | <50ms |
| **App Load Time** | Unknown | <2s |
| **File Organization** | Some 800+ line files | Max 200 lines per file |
| **Cloud Sync Latency** | N/A | <500ms |
| **Clear Naming** | "prep" confusion | "shop-order" throughout |

---

## Cost Analysis

**PowerSync + Supabase:**
- **MVP: $0/month** (Free tiers)
- **Production: $25-150/month**

**Custom Backend (Not Recommended):**
- **MVP: $46-76/month**
- **Time: 16-20 weeks**
- **Maintenance: High**

---

## Next Steps

1. ✅ Approve this plan
2. ✅ Begin Phase 0 (Stabilization + Shop Order Rename)
3. ✅ Set up Supabase project (parallel to Phase 2)
4. ✅ Create project board to track progress

**This plan transforms ShowStack into a production-ready, cloud-enabled Production Operating System with clear naming, modular architecture, and best practices throughout.**
