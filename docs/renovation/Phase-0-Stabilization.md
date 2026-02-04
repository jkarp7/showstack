# Phase 0: Stabilization & Code Organization

**Duration:** 7-9 weeks
**Status:** 🔵 Planned
**Priority:** CRITICAL
**Goal:** Fix stability issues and organize codebase before major refactoring

---

## Overview

Before migrating databases or adding cloud features, we must stabilize the foundation and improve code organization. This phase eliminates data loss risks, implements proper error handling, breaks up monolithic files, and renames confusing "prep" references.

---

## 0.1 Error Handling & Resilience (2 weeks)

### Current Issues
- Database writes can fail silently
- No retry logic for failed operations
- Limited error boundaries in React components
- Generic Error objects (no context)

### Implementation

#### Step 1: Create Custom Error Classes

**File:** `src/main/errors/DatabaseError.ts` (NEW)
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

export class QueryError extends DatabaseError {
  constructor(message: string, query: string, originalError?: Error) {
    super(message, 'query', false, originalError);
    this.name = 'QueryError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### Step 2: Create Error Handler with Retry Logic

**File:** `src/main/errors/ErrorHandler.ts` (NEW)
```typescript
import { DatabaseError, ConnectionError } from './DatabaseError';
import * as Sentry from '@sentry/electron/main';

export class ErrorHandler {
  /**
   * Execute operation with automatic retry on transient failures
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        console.error(`${operationName} failed (attempt ${attempt}/${maxRetries})`, {
          error: lastError.message,
          attempt,
          maxRetries
        });

        // Only retry if error is recoverable
        if (attempt < maxRetries && this.isRetryable(lastError)) {
          // Exponential backoff: 100ms, 200ms, 400ms
          await this.delay(Math.pow(2, attempt) * 100);
        } else {
          break; // Not retryable or max attempts reached
        }
      }
    }

    // Send to Sentry on final failure
    Sentry.captureException(lastError!, {
      tags: {
        operation: operationName,
        attempts: maxRetries
      }
    });

    throw new DatabaseError(
      `${operationName} failed after ${maxRetries} attempts`,
      operationName,
      false,
      lastError!
    );
  }

  /**
   * Check if error is temporary and retryable
   */
  private isRetryable(error: Error): boolean {
    // Retry on connection errors
    if (error instanceof ConnectionError) {
      return true;
    }

    // Retry on SQLite lock errors
    if (error.message.includes('SQLITE_BUSY') ||
        error.message.includes('SQLITE_LOCKED')) {
      return true;
    }

    // Retry on network errors
    if (error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT')) {
      return true;
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();
```

#### Step 3: Update IPC Handlers

**Example:** `src/main/ipc/fixtures.ts` (UPDATE)
```typescript
import { ipcMain } from 'electron';
import { errorHandler } from '../errors/ErrorHandler';
import { ValidationError } from '../errors/DatabaseError';
import * as Sentry from '@sentry/electron/main';

export function registerFixtureHandlers(): void {
  ipcMain.handle('fixtures:create', async (event, input) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => {
          // Existing logic
          return createFixture(input);
        },
        'fixtures:create'
      );
    } catch (error) {
      console.error('Failed to create fixture:', error);

      // Send structured error info to Sentry
      Sentry.captureException(error, {
        tags: {
          ipc_channel: 'fixtures:create'
        },
        extra: {
          input: input // Sanitize if needed
        }
      });

      // Return user-friendly error
      if (error instanceof ValidationError) {
        throw new Error(`Invalid ${error.field}: ${error.message}`);
      }

      throw error;
    }
  });

  // Similar pattern for all other handlers...
}
```

#### Step 4: Expand React ErrorBoundary

**File:** `src/renderer/src/components/common/ErrorBoundary.tsx` (UPDATE - already exists, expand)
```typescript
import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/electron/renderer';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // Send to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap all major UI sections:**
```tsx
// src/renderer/src/App.tsx
<ErrorBoundary>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/equipment-manager" element={
      <ErrorBoundary fallback={<EquipmentManagerError />}>
        <EquipmentManager />
      </ErrorBoundary>
    } />
    {/* Wrap all major routes */}
  </Routes>
</ErrorBoundary>
```

### Checklist

- [ ] Create custom error classes (DatabaseError, ConnectionError, ValidationError)
- [ ] Create ErrorHandler with retry logic
- [ ] Update all 23 IPC handlers with error handling
- [ ] Expand ErrorBoundary component
- [ ] Wrap all major UI sections with ErrorBoundary
- [ ] Add Sentry integration for error tracking
- [ ] Write unit tests for error handler (retry logic, backoff)
- [ ] Write integration tests (simulate disk full, network errors)
- [ ] Test ErrorBoundary (throw error in component)

### Success Criteria

- ✅ All IPC handlers wrapped with try-catch
- ✅ Error boundaries cover all major UI sections
- ✅ Zero silent failures in error tracking
- ✅ 90%+ test coverage on error handling code
- ✅ Errors logged with context (operation, attempt, etc.)

---

## 0.2 Refactor database/index.ts (2-3 weeks)

### Current Issues

- Monolithic 881-line file (too large!)
- Mixed concerns (initialization, migrations, persistence, queries)
- Hard to test individual components
- Difficult to maintain

### New Modular Structure

```
src/main/database/
  ├── index.ts (50 lines - exports only) ✅
  ├── /core/
  │   ├── DatabaseManager.ts (database initialization) ✅
  │   ├── MigrationRunner.ts (schema migrations) ✅
  │   └── ConnectionPool.ts (connection management - future) ⬜
  ├── /schemas/
  │   ├── appSchema.ts (already exists) ✅
  │   └── projectSchema.ts (already exists) ✅
  ├── /migrations/
  │   ├── 001-initial-schema.ts ✅
  │   ├── 002-add-infrastructure.ts ✅
  │   ├── 003-rename-prep-to-shop-order.ts (Phase 0.3) ⬜
  │   └── index.ts (migration registry) ✅
  ├── /persistence/
  │   ├── DatabaseWriter.ts (file persistence) ✅
  │   ├── WriteQueue.ts (debounced writes) ✅
  │   └── BackupManager.ts (automatic backups - Phase 7) ⬜
  ├── /queries/
  │   ├── fixtures.ts (already exists) ✅
  │   ├── projects.ts (already exists) ✅
  │   ├── shop-order.ts (rename from prep.ts - Phase 0.3) ⬜
  │   └── infrastructure.ts (already exists) ✅
  └── /indexes/
      └── performanceIndexes.ts (Phase 1.4) ⬜
```

### Implementation

#### Step 1: Extract DatabaseManager

**File:** `src/main/database/core/DatabaseManager.ts` (NEW)
```typescript
import Database from 'better-sqlite3'; // Phase 1
import { app } from 'electron';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { MigrationRunner } from './MigrationRunner';
import { APP_SCHEMA } from '../schemas/appSchema';
import { PROJECT_SCHEMA } from '../schemas/projectSchema';

/**
 * Manages database lifecycle and connections
 * Singleton pattern ensures single source of truth
 */
export class DatabaseManager {
  private appDb: Database.Database | null = null;
  private projectDb: Database.Database | null = null;

  private appDbPath: string;
  private projectDbPath: string;

  constructor() {
    this.appDbPath = join(app.getPath('userData'), 'showstack-app.db');
    this.projectDbPath = join(app.getPath('userData'), 'showstack-projects.db');
  }

  /**
   * Initialize both app and project databases
   */
  async initialize(): Promise<void> {
    await this.initializeAppDatabase();
    await this.initializeProjectDatabase();
  }

  /**
   * Initialize app-level database (settings, licenses, templates)
   */
  private async initializeAppDatabase(): Promise<void> {
    console.log('Initializing app database:', this.appDbPath);

    this.appDb = new Database(this.appDbPath);

    // Enable WAL mode for better concurrency
    this.appDb.pragma('journal_mode = WAL');
    this.appDb.pragma('foreign_keys = ON');
    this.appDb.pragma('synchronous = NORMAL');

    // Create tables from schema
    this.appDb.exec(APP_SCHEMA);

    // Run migrations
    const migrationRunner = new MigrationRunner(this.appDb, 'app');
    await migrationRunner.run();

    console.log('App database initialized');
  }

  /**
   * Initialize project-level database (fixtures, shop orders, etc.)
   */
  private async initializeProjectDatabase(): Promise<void> {
    console.log('Initializing project database:', this.projectDbPath);

    this.projectDb = new Database(this.projectDbPath);

    this.projectDb.pragma('journal_mode = WAL');
    this.projectDb.pragma('foreign_keys = ON');
    this.projectDb.pragma('synchronous = NORMAL');

    this.projectDb.exec(PROJECT_SCHEMA);

    const migrationRunner = new MigrationRunner(this.projectDb, 'project');
    await migrationRunner.run();

    console.log('Project database initialized');
  }

  /**
   * Get app database instance
   */
  getAppDatabase(): Database.Database {
    if (!this.appDb) {
      throw new Error('App database not initialized. Call initialize() first.');
    }
    return this.appDb;
  }

  /**
   * Get project database instance
   */
  getProjectDatabase(): Database.Database {
    if (!this.projectDb) {
      throw new Error('Project database not initialized. Call initialize() first.');
    }
    return this.projectDb;
  }

  /**
   * Close both databases (called on app shutdown)
   */
  close(): void {
    if (this.appDb) {
      this.appDb.close();
      this.appDb = null;
    }
    if (this.projectDb) {
      this.projectDb.close();
      this.projectDb = null;
    }
    console.log('Databases closed');
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();
```

#### Step 2: Extract MigrationRunner

**File:** `src/main/database/core/MigrationRunner.ts` (NEW)
```typescript
import Database from 'better-sqlite3';
import { appMigrations } from '../migrations/app';
import { projectMigrations } from '../migrations/project';

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

/**
 * Handles database schema migrations
 */
export class MigrationRunner {
  constructor(
    private db: Database.Database,
    private type: 'app' | 'project'
  ) {}

  /**
   * Run all pending migrations
   */
  async run(): Promise<void> {
    this.ensureMigrationsTable();

    const migrations = this.type === 'app' ? appMigrations : projectMigrations;
    const appliedVersions = this.getAppliedMigrations();
    const pendingMigrations = migrations.filter(
      m => !appliedVersions.includes(m.version)
    );

    if (pendingMigrations.length === 0) {
      console.log(`No pending ${this.type} migrations`);
      return;
    }

    console.log(`Running ${pendingMigrations.length} ${this.type} migrations`);

    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
    }
  }

  /**
   * Create migrations tracking table if it doesn't exist
   */
  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      )
    `);
  }

  /**
   * Get list of applied migration versions
   */
  private getAppliedMigrations(): number[] {
    const rows = this.db.prepare('SELECT version FROM migrations').all() as { version: number }[];
    return rows.map(r => r.version);
  }

  /**
   * Apply a single migration in a transaction
   */
  private async applyMigration(migration: Migration): Promise<void> {
    const transaction = this.db.transaction(() => {
      // Apply migration
      migration.up(this.db);

      // Record migration
      this.db.prepare(`
        INSERT INTO migrations (version, name, applied_at)
        VALUES (?, ?, ?)
      `).run(migration.version, migration.name, Date.now());

      console.log(`✓ Applied migration: ${migration.name}`);
    });

    transaction();
  }
}
```

#### Step 3: Extract Write Queue

**File:** `src/main/database/persistence/WriteQueue.ts` (NEW)
```typescript
/**
 * Debounced write queue to reduce file I/O
 * Batches multiple operations into single disk write
 */
export class WriteQueue {
  private queue: Array<() => void> = [];
  private processing = false;
  private lastWrite = 0;
  private readonly DEBOUNCE_MS = 500; // Wait 500ms after last operation

  /**
   * Add operation to queue
   */
  async enqueue(operation: () => void): Promise<void> {
    this.queue.push(operation);

    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process queued operations
   */
  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      // Debounce: wait if recent write
      const now = Date.now();
      if (now - this.lastWrite < this.DEBOUNCE_MS) {
        await this.delay(this.DEBOUNCE_MS - (now - this.lastWrite));
      }

      try {
        // Batch all queued operations
        const operations = this.queue.splice(0, this.queue.length);

        for (const op of operations) {
          op();
        }

        // Single atomic write (WAL mode handles persistence)
        this.lastWrite = Date.now();

        console.log(`Processed ${operations.length} operations`);

      } catch (error) {
        console.error('Write queue failed:', error);
        // TODO: Implement recovery logic
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const writeQueue = new WriteQueue();
```

#### Step 4: Update Main Index

**File:** `src/main/database/index.ts` (REFACTOR: 881 → ~50 lines)
```typescript
// Re-export clean API
export { databaseManager } from './core/DatabaseManager';
export { writeQueue } from './persistence/WriteQueue';

// Convenience getters
export const getAppDatabase = () => databaseManager.getAppDatabase();
export const getProjectDatabase = () => databaseManager.getProjectDatabase();

// Lifecycle
export const initDatabase = () => databaseManager.initialize();
export const closeDatabase = () => databaseManager.close();

// Re-export queries (barrel export pattern)
export * from './queries/fixtures';
export * from './queries/projects';
export * from './queries/shop-order'; // Renamed from prep (Phase 0.3)
export * from './queries/infrastructure';
export * from './queries/dimmerRacks';
export * from './queries/pdRacks';
export * from './queries/phaseTemplates';
export * from './queries/paperwork';
```

### Checklist

- [ ] Create `database/core/DatabaseManager.ts`
- [ ] Create `database/core/MigrationRunner.ts`
- [ ] Create `database/persistence/WriteQueue.ts`
- [ ] Create `database/migrations/` directory
- [ ] Extract migrations from old index.ts to migration files
- [ ] Update `database/index.ts` (881 → ~50 lines)
- [ ] Update all imports to use new structure
- [ ] Write unit tests for DatabaseManager
- [ ] Write unit tests for MigrationRunner
- [ ] Write unit tests for WriteQueue
- [ ] Verify all existing functionality works
- [ ] Verify database file paths correct
- [ ] Run integration tests

### Success Criteria

- ✅ `database/index.ts` reduced from 881 to ~50 lines
- ✅ Each module <200 lines
- ✅ Single Responsibility Principle followed
- ✅ All existing functionality works
- ✅ Better testability (can mock individual modules)
- ✅ All tests passing

---

## 0.3 Naming Refactor: "prep" → "shop-order" (1 week)

### Problem

"prep" is ambiguous and confusing. It's actually the **Shop Order Builder** tool - part of the Lighting module that works alongside Equipment Manager to create shop orders for equipment rental/purchase.

### Scope

Rename all "prep" references to "shop-order" or "shopOrder" throughout:
- Database tables (6 tables)
- Files (~12 files)
- IPC channels (~30 channels)
- Components (~15 components)
- Stores (2 stores)
- Routes
- Types

### Database Migration

**File:** `src/main/database/migrations/003-rename-prep-to-shop-order.sql` (NEW)
```sql
-- Migration 003: Rename prep to shop_order
-- Preserves all data, just changes table names

ALTER TABLE prep_projects RENAME TO shop_order_projects;
ALTER TABLE prep_sections RENAME TO shop_order_sections;
ALTER TABLE prep_equipment_items RENAME TO shop_order_items;
ALTER TABLE prep_revisions RENAME TO shop_order_revisions;
ALTER TABLE prep_notes RENAME TO shop_order_notes;
ALTER TABLE prep_note_templates RENAME TO shop_order_note_templates;

-- Update indexes
DROP INDEX IF EXISTS idx_prep_sections_project;
CREATE INDEX idx_shop_order_sections_project
  ON shop_order_sections(shop_order_project_id);

DROP INDEX IF EXISTS idx_prep_items_section;
CREATE INDEX idx_shop_order_items_section
  ON shop_order_items(section_id);

-- Update any foreign key column names
-- (handled by ALTER TABLE above)
```

### File Renames

**Use git mv to preserve history:**

```bash
# Database queries
git mv src/main/database/queries/prep.ts \
       src/main/database/queries/shop-order.ts

# IPC handlers
git mv src/main/ipc/prep.ts \
       src/main/ipc/shop-order.ts

# Stores
git mv src/renderer/src/store/prepStore.ts \
       src/renderer/src/store/shopOrderStore.ts

git mv src/renderer/src/store/prepFileStore.ts \
       src/renderer/src/store/shopOrderFileStore.ts

# Components directory
git mv src/renderer/src/components/prep \
       src/renderer/src/components/shop-order

# Pages
git mv src/renderer/src/pages/modules/Prep.tsx \
       src/renderer/src/pages/modules/ShopOrderBuilder.tsx

# Utils
git mv src/renderer/src/utils/prep \
       src/renderer/src/utils/shop-order
```

### IPC Channel Renames

**File:** `src/main/ipc/shop-order.ts` (UPDATE from prep.ts)
```typescript
// Before
export function registerPrepHandlers(): void {
  ipcMain.handle('prep:projects:getAll', async () => { ... });
  ipcMain.handle('prep:sections:create', async (event, data) => { ... });
  ipcMain.handle('prep:items:update', async (event, id, updates) => { ... });
}

// After
export function registerShopOrderHandlers(): void {
  ipcMain.handle('shop-order:projects:getAll', async () => { ... });
  ipcMain.handle('shop-order:sections:create', async (event, data) => { ... });
  ipcMain.handle('shop-order:items:update', async (event, id, updates) => { ... });
}
```

### Component Renames

```typescript
// Before
<PrepProjectCard />
<NewPrepProjectDialog />
<AddItemDialog />
<PrepToolbar />

// After
<ShopOrderProjectCard />
<NewShopOrderProjectDialog />
<ShopOrderItemDialog />
<ShopOrderToolbar />
```

### Store Renames

**File:** `src/renderer/src/store/shopOrderStore.ts` (UPDATE from prepStore.ts)
```typescript
// Before
export const usePrepStore = create<PrepStore>((set, get) => ({
  prepProjects: [],
  currentPrepProject: null,
  loadPrepProjects: async () => { ... }
}));

// After
export const useShopOrderStore = create<ShopOrderStore>((set, get) => ({
  shopOrderProjects: [],
  currentShopOrderProject: null,
  loadShopOrderProjects: async () => { ... }
}));
```

### Validation Schema Renames

**File:** `packages/shared/src/validation/shopOrderSchema.ts` (NEW from prepSchema.ts)
```typescript
import { z } from 'zod';

export const ShopOrderProjectSchema = z.object({
  id: z.string().uuid(),
  parent_project_id: z.string().uuid().optional(),
  production_name: z.string().min(1),
  order_date: z.number(),
  disciplines: z.array(z.enum(['lighting', 'audio', 'video'])),
  current_revision: z.number().int().min(0).max(5)
});

export type ShopOrderProject = z.infer<typeof ShopOrderProjectSchema>;

export const ShopOrderSectionSchema = z.object({
  id: z.string().uuid(),
  shop_order_project_id: z.string().uuid(),
  name: z.string().min(1),
  sort_order: z.number().int()
});

export type ShopOrderSection = z.infer<typeof ShopOrderSectionSchema>;

export const ShopOrderItemSchema = z.object({
  id: z.string().uuid(),
  section_id: z.string().uuid(),
  description: z.string().min(1),
  active_qty: z.number().int().min(0),
  spare_qty: z.number().int().min(0),
  venue_qty: z.number().int().min(0)
});

export type ShopOrderItem = z.infer<typeof ShopOrderItemSchema>;
```

### Service Extraction

**Break 1337-line ipc/prep.ts into focused services:**

```
src/main/services/
  ├── ShopOrderProjectService.ts  (project CRUD)
  ├── ShopOrderSectionService.ts  (section management)
  ├── ShopOrderItemService.ts     (equipment items)
  ├── ShopOrderRevisionService.ts (revision tracking)
  └── ShopOrderNoteService.ts     (notes management)
```

**File:** `src/main/services/ShopOrderProjectService.ts` (NEW)
```typescript
import { ShopOrderProjectSchema, ShopOrderProject } from '@showstack/shared';
import { getProjectDatabase } from '../database';
import { v4 as uuid } from 'uuid';

export class ShopOrderProjectService {
  async create(input: unknown): Promise<ShopOrderProject> {
    const data = ShopOrderProjectSchema.parse(input);

    const project: ShopOrderProject = {
      ...data,
      id: uuid(),
      created_at: Date.now(),
      updated_at: Date.now()
    };

    const db = getProjectDatabase();
    const stmt = db.prepare(`
      INSERT INTO shop_order_projects (id, production_name, disciplines, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      project.id,
      project.production_name,
      JSON.stringify(project.disciplines),
      project.created_at,
      project.updated_at
    );

    return project;
  }

  async findAll(): Promise<ShopOrderProject[]> {
    const db = getProjectDatabase();
    const stmt = db.prepare('SELECT * FROM shop_order_projects ORDER BY created_at DESC');
    const rows = stmt.all();

    return rows.map(row => ShopOrderProjectSchema.parse({
      ...row,
      disciplines: JSON.parse(row.disciplines)
    }));
  }

  // ... other methods
}
```

### Checklist

- [x] Run database migration (003-rename-prep-to-shop-order.sql) ✅
- [x] Rename files with git mv (preserve history) ✅ (48 files)
- [x] Update IPC channel names ✅ (42+ channels)
- [x] Update component names ✅ (20+ components)
- [x] Update store names ✅
- [x] Update routes ✅
- [x] Update validation schemas ✅
- [x] Extract services from 1415-line ipc/shop-order.ts ✅ (5 services created)
- [x] Update all imports ✅ (60+ files)
- [x] Update tests ✅
- [x] Update documentation ✅
- [x] Global find/replace "prep" → "shop-order" / "shopOrder" ✅
- [x] Verify all tests pass ✅
- [x] Verify UI still works ✅ (build successful)

### Success Criteria - ALL MET ✅

- ✅ All "prep" references renamed (100+ renames)
- ✅ Database migration successful (data preserved)
- ✅ Service layer extracted (1415-line file broken up into 5 focused services)
- ✅ All tests passing (88 tests)
- ✅ Git history preserved (git mv used throughout)
- ✅ Consistent naming throughout codebase
- ✅ Build successful (120 main + 1769 renderer modules)

**Phase 0.3 Status:** ✅ **COMPLETE**

---

## 0.4 Monitoring & Observability (1 week)

### Goal

Track performance and errors from day 1. Essential for identifying issues early and measuring improvements.

### Implementation

#### Performance Monitor

**File:** `src/main/monitoring/PerformanceMonitor.ts` (UPDATE existing or create)
```typescript
import { posthog } from './telemetry';

export class PerformanceMonitor {
  /**
   * Track database query performance
   */
  trackDatabaseQuery(
    operation: string,
    duration: number,
    rowCount?: number
  ): void {
    posthog.capture('database_query', {
      operation,
      duration_ms: duration,
      row_count: rowCount,
      slow_query: duration > 1000
    });

    // Warn about slow queries
    if (duration > 1000) {
      console.warn(`⚠️ Slow query: ${operation} took ${duration}ms`);
    }
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    const usage = process.memoryUsage();
    posthog.capture('memory_usage', {
      heap_used_mb: usage.heapUsed / 1024 / 1024,
      heap_total_mb: usage.heapTotal / 1024 / 1024,
      rss_mb: usage.rss / 1024 / 1024
    });

    // Warn if memory usage is high
    if (usage.heapUsed > 1024 * 1024 * 1024) { // 1GB
      console.warn('⚠️ High memory usage:', usage.heapUsed / 1024 / 1024, 'MB');
    }
  }

  /**
   * Track IPC handler latency
   */
  trackIPCHandler(channel: string, duration: number): void {
    posthog.capture('ipc_handler', {
      channel,
      duration_ms: duration,
      slow: duration > 100
    });
  }

  /**
   * Track UI render performance
   */
  trackComponentRender(componentName: string, duration: number): void {
    posthog.capture('component_render', {
      component: componentName,
      duration_ms: duration,
      slow: duration > 16 // 60 FPS = 16ms per frame
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

#### Wrap Database Queries

**Example:** `src/main/database/queries/fixtures.ts` (UPDATE)
```typescript
import { performanceMonitor } from '../../monitoring/PerformanceMonitor';

export async function getAllFixtures(projectId: string): Promise<Fixture[]> {
  const start = Date.now();

  const db = getProjectDatabase();
  const stmt = db.prepare('SELECT * FROM fixtures WHERE project_id = ?');
  const rows = stmt.all(projectId);

  const duration = Date.now() - start;
  performanceMonitor.trackDatabaseQuery('getAllFixtures', duration, rows.length);

  return rows;
}
```

#### Periodic Memory Monitoring

**File:** `src/main/index.ts` (UPDATE)
```typescript
import { performanceMonitor } from './monitoring/PerformanceMonitor';

app.on('ready', async () => {
  await initDatabase();

  // Monitor memory usage every 5 minutes
  setInterval(() => {
    performanceMonitor.trackMemoryUsage();
  }, 5 * 60 * 1000);
});
```

### Checklist

- [ ] Create/update PerformanceMonitor class
- [ ] Wrap all database queries with performance tracking
- [ ] Add periodic memory monitoring
- [ ] Add IPC handler latency tracking
- [ ] Create PostHog dashboard for:
  - Slow queries (>1s)
  - Memory usage trends
  - IPC handler latency (p95)
- [ ] Set up alerts for:
  - Slow queries
  - High memory usage (>1.5GB)
  - High IPC latency (>100ms p95)

### Success Criteria

- ✅ All database queries tracked
- ✅ Slow query threshold alerts (>1s)
- ✅ Memory usage dashboard
- ✅ IPC handler latency <100ms (p95)
- ✅ Dashboard accessible in PostHog

---

## Overall Phase 0 Checklist

- [x] 0.1: Error Handling & Resilience (2 weeks) ✅ **COMPLETED**
- [x] 0.2: Refactor database/index.ts (2-3 weeks) ✅ **COMPLETED**
- [x] 0.3: Naming Refactor: prep → shop-order (1 week) ✅ **COMPLETED**
- [ ] 0.4: Monitoring & Observability (1 week)
- [x] All tests passing ✅ (88 tests passing)
- [x] No regressions (feature parity maintained) ✅
- [ ] Code review complete
- [x] Documentation updated ✅

## Phase 0 Progress Summary

**Phases 0.1-0.3 Complete:** Database stabilization, modular architecture, and comprehensive naming refactor finished.

**What's Done:**
- ✅ Error handling infrastructure with retry logic
- ✅ Custom error classes (DatabaseError, ValidationError, etc.)
- ✅ All IPC handlers updated with error handling
- ✅ Database refactored from 881-line monolith to modular architecture
- ✅ All "prep" references renamed to "shop-order" (48 files, 60+ modifications)
- ✅ Service layer extracted (5 focused services)
- ✅ Build successful, tests passing

**Phase 0.4 Remaining:** Add performance monitoring and observability.

## Next Steps

After Phase 0.4 completion, proceed to **Phase 1: Database Migration to better-sqlite3**

---

**Status:** 🟢 In Progress (0.1-0.3 Complete, 0.4 Remaining)
**Ready for Phase 0.4:** ✅
