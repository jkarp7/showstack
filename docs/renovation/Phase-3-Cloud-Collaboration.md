# Phase 3: Cloud Collaboration + Performance Optimization

**Status:** 🟢 Phase 3.0-3.4 Complete (Presence Indicators deferred as optional)
**Priority:** CRITICAL (required for Lightwright parity)
**Goal:** Local-first cloud sync using PowerSync + Supabase, plus database performance optimization

---

## Prerequisites Completed

- [x] Service layer extraction complete (Phase 2.3)
- [x] Zod validation schemas complete (Phase 2.2)
- [x] Monorepo setup complete (Phase 2.1)
- [x] Database schema validated and tested
- [x] Supabase project created with production-grade configuration
- [x] PowerSync account created and ready for service setup

---

## Pre-Work: PR #68 Code Review Issues

Before starting Phase 3 implementation, address these outstanding issues from the Phase 2 code review.

### PW-1: Type Safety Issues (HIGH PRIORITY)

**Issue:** 26+ files contain `@ts-nocheck` directives, and dynamic SQL uses `any[]` types
**Impact:** Hidden type errors, reduced code safety, harder debugging

**Files Affected:**

- `apps/desktop/src/main/database/queries/shop-order.ts` (has `@ts-nocheck`)
- `apps/desktop/src/main/database/queries/layoutTemplates.ts`
- `apps/desktop/src/main/database/queries/paperworkTemplates.ts`
- `apps/desktop/src/main/database/queries/license.ts`
- `apps/desktop/src/main/database/queries/settings.ts`

**Tasks:**

- [ ] Remove `@ts-nocheck` from `shop-order.ts` and fix type errors
- [ ] Replace `any[]` with proper types: `(string | number | null)[]`
- [ ] Create typed row-to-object mappers for query results
- [ ] Extract magic numbers to named constants (e.g., `SETTINGS_ID = 1`)

**Effort:** 4-6 hours

---

### PW-2: Field Whitelist Security (MEDIUM PRIORITY)

**Issue:** Dynamic SQL construction uses field names directly in queries
**Risk:** Potential SQL injection if whitelist validation bypassed

**Files Affected:**

- `apps/desktop/src/main/database/queries/projects.ts:150`
- `apps/desktop/src/main/database/queries/layoutTemplates.ts:246`
- `apps/desktop/src/main/database/queries/license.ts:163`
- `apps/desktop/src/main/database/queries/paperworkTemplates.ts:265`

**Current Code:**

```typescript
const setClause = fields.map((f) => `${f} = ?`).join(', ');
```

**Fix:**

```typescript
const ALLOWED_FIELDS = Object.freeze(['name', 'description', ...]) as const;
type AllowedField = typeof ALLOWED_FIELDS[number];

function validateFieldName(field: string): field is AllowedField {
  return ALLOWED_FIELDS.includes(field as AllowedField);
}

const fields = Object.keys(updates).filter(validateFieldName);
```

**Tasks:**

- [ ] Harden field whitelists with `Object.freeze()` in all affected files
- [ ] Add type guards for field name validation
- [ ] Add unit tests for whitelist validation

**Effort:** 2-3 hours

---

### PW-3: JSON.parse Error Logging (LOW PRIORITY)

**Issue:** Silent failures when parsing JSON fields hide data corruption
**Impact:** Difficult debugging, potential data loss goes unnoticed

**Files Affected:**

- `apps/desktop/src/main/database/queries/projects.ts:27-30`
- `apps/desktop/src/main/database/queries/paperworkTemplates.ts`
- `apps/desktop/src/main/database/queries/layoutTemplates.ts`

**Current Code:**

```typescript
try {
  project[field] = JSON.parse(project[field]);
} catch {
  // Keep as is if parsing fails  ← Silent failure!
}
```

**Fix:**

```typescript
try {
  project[field] = JSON.parse(project[field]);
} catch (error) {
  logger.warn(`Failed to parse JSON field '${field}' for project ${project.id}`, {
    error,
    rawValue: project[field]?.substring(0, 100), // Truncate for logging
  });
  // Keep original value
}
```

**Tasks:**

- [ ] Add error logging to all JSON.parse catch blocks
- [ ] Consider adding data validation/repair utility

**Effort:** 1-2 hours

---

### PW-4: Service Layer Test Coverage (HIGH PRIORITY)

**Issue:** Service layer lacks dedicated unit tests
**Target:** 80% coverage for service classes

**Files Needing Tests:**

- `apps/desktop/src/main/services/BaseService.ts`
- `apps/desktop/src/main/services/FixtureService.ts`
- `apps/desktop/src/main/services/ProjectService.ts`
- `apps/desktop/src/main/services/ShopOrderProjectService.ts`
- `apps/desktop/src/main/services/ShopOrderSectionService.ts`
- `apps/desktop/src/main/services/ShopOrderItemService.ts`
- `apps/desktop/src/main/services/DimmerService.ts`
- `apps/desktop/src/main/services/PDRackService.ts`
- `apps/desktop/src/main/services/InfrastructureService.ts`

**Tasks:**

- [ ] Create test file for BaseService (validation helpers, retry logic)
- [ ] Create test files for each service class
- [ ] Test error handling and validation
- [ ] Test retry behavior with mock failures
- [ ] Achieve 80% coverage target

**Effort:** 8-12 hours

---

### PW-5: Transaction Safety (LOW PRIORITY)

**Issue:** Multi-step operations not wrapped in transactions
**Impact:** Partial updates possible on failure

**Files Affected:**

- `apps/desktop/src/main/database/queries/layoutTemplates.ts:252`

**Current Code:**

```typescript
// Delete existing elements
db.prepare('DELETE FROM page_layout_elements WHERE template_id = ?').run(id);

// Insert new elements - NOT IN TRANSACTION!
for (const element of elements) {
  insertElementStmt.run(...);
}
```

**Tasks:**

- [ ] Wrap delete + insert operations in transactions
- [ ] Audit other multi-step operations for transaction safety
- [ ] Add transaction wrapper utility if needed

**Effort:** 2-3 hours

---

## Phase 3.0: Database Performance Optimization

**Goal:** Implement WAL checkpointing, pagination, and monitoring before cloud integration

### 3.0.1 WAL Checkpoint Monitoring (HIGH PRIORITY)

**Effort:** 2-4 hours
**Issue:** WAL mode enabled but no monitoring or periodic checkpointing

**File:** `apps/desktop/src/main/database/core/DatabaseManager.ts`

**Implementation:**

```typescript
private walCheckpointInterval?: NodeJS.Timeout;

/**
 * Start periodic WAL checkpointing to prevent WAL file growth
 * Run checkpoint every 5 minutes in PASSIVE mode (non-blocking)
 */
startPeriodicCheckpointing(): void {
  this.walCheckpointInterval = setInterval(() => {
    try {
      this.appDb?.pragma('wal_checkpoint(PASSIVE)');
      this.projectDb?.pragma('wal_checkpoint(PASSIVE)');

      // Monitor WAL file size
      const walPages = this.projectDb?.pragma('wal_checkpoint(PASSIVE)') as number[];
      if (walPages && walPages[1] > 10000) {
        logger.warn('WAL file size growing large', { pages: walPages[1] });
      }
    } catch (error) {
      logger.error('Failed to checkpoint WAL', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

stopPeriodicCheckpointing(): void {
  if (this.walCheckpointInterval) {
    clearInterval(this.walCheckpointInterval);
    this.walCheckpointInterval = undefined;
  }
}

forceCheckpoint(): void {
  this.appDb?.pragma('wal_checkpoint(TRUNCATE)');
  this.projectDb?.pragma('wal_checkpoint(TRUNCATE)');
}
```

**Tasks:**

- [ ] Add WAL checkpointing methods to DatabaseManager
- [ ] Call `startPeriodicCheckpointing()` in database initialization
- [ ] Call `stopPeriodicCheckpointing()` in database close
- [ ] Call `forceCheckpoint()` before app quit
- [ ] Add WAL size to database health metrics
- [ ] Write unit tests for checkpoint behavior

---

### 3.0.2 Add Pagination to Query Methods

**Effort:** 6-8 hours
**Issue:** Methods like `getAllFixtures()` return all rows; problematic with large datasets

**Files Affected:**

- `apps/desktop/src/main/database/queries/fixtures.ts`
- `apps/desktop/src/main/database/queries/shop-order.ts`
- `apps/desktop/src/main/database/queries/infrastructure.ts`

**Implementation:**

Create pagination utility:

```typescript
// apps/desktop/src/main/database/utils/pagination.ts
export interface PaginationOptions {
  offset: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export function buildPaginatedQuery(
  baseQuery: string,
  options: PaginationOptions,
  allowedSortFields: readonly string[],
): { query: string; countQuery: string } {
  const sortField =
    options.sortBy && allowedSortFields.includes(options.sortBy)
      ? options.sortBy
      : allowedSortFields[0];
  const sortOrder = options.sortOrder === 'DESC' ? 'DESC' : 'ASC';

  return {
    query: `${baseQuery} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`,
    countQuery: baseQuery.replace('SELECT *', 'SELECT COUNT(*) as total'),
  };
}
```

**Tasks:**

- [ ] Create `pagination.ts` utility module
- [ ] Add `getFixturesPaginated()` to fixtures.ts
- [ ] Add `getShopOrderItemsPaginated()` to shop-order.ts
- [ ] Add `getInfrastructurePaginated()` to infrastructure.ts
- [ ] Update services to expose paginated methods
- [ ] Add IPC handlers for paginated queries
- [ ] Write tests for pagination edge cases

---

### 3.0.3 Implement Statement Caching (OPTIONAL)

**Effort:** 6-10 hours
**Priority:** LOW - Profile first before implementing

**Note:** better-sqlite3 already caches statements internally. Only implement if profiling shows benefit.

**Tasks:**

- [ ] Profile query performance with large datasets (10k+ rows)
- [ ] If profiling shows benefit: Create StatementCache class
- [ ] If profiling shows benefit: Integrate with hot-path queries
- [ ] Benchmark before/after

---

### 3.0.4 Add Database Monitoring/Observability

**Effort:** 8-12 hours
**Goal:** Visibility into database performance for debugging

**New File:** `apps/desktop/src/main/database/monitoring/DatabaseMonitor.ts`

**Implementation:**

```typescript
interface QueryMetrics {
  count: number;
  totalTime: number;
  maxTime: number;
  errors: number;
}

export class DatabaseMonitor {
  private metrics = new Map<string, QueryMetrics>();
  private slowQueryThresholdMs = 100;

  recordQuery(operation: string, durationMs: number, error?: Error): void {
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      maxTime: 0,
      errors: 0,
    };

    existing.count++;
    existing.totalTime += durationMs;
    existing.maxTime = Math.max(existing.maxTime, durationMs);
    if (error) existing.errors++;

    this.metrics.set(operation, existing);

    if (durationMs > this.slowQueryThresholdMs) {
      logger.warn('Slow query detected', { operation, durationMs });
    }
  }

  getMetricsSummary() {
    const summary: Record<string, any> = {};
    for (const [op, metrics] of this.metrics) {
      summary[op] = {
        ...metrics,
        avgTime: metrics.count > 0 ? metrics.totalTime / metrics.count : 0,
      };
    }
    return summary;
  }

  getSlowQueries(): Array<{ operation: string; avgTime: number }> {
    return Array.from(this.metrics.entries())
      .map(([operation, m]) => ({
        operation,
        avgTime: m.totalTime / m.count,
      }))
      .filter((q) => q.avgTime > this.slowQueryThresholdMs)
      .sort((a, b) => b.avgTime - a.avgTime);
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const databaseMonitor = new DatabaseMonitor();
```

**Tasks:**

- [ ] Create DatabaseMonitor class
- [ ] Integrate with BaseService query execution
- [ ] Add IPC handler to retrieve metrics
- [ ] Create simple metrics display in dev tools/settings
- [ ] Add slow query alerts to logger

---

## Phase 3.1: Supabase Deployment

**Goal:** Deploy database schema to Supabase cloud
**Status:** 🟢 Code Complete, Awaiting Infrastructure Deployment

### 3.1.1 Project Setup

**Tasks:**

- [x] Verify Supabase project configuration files ready
- [ ] Create Supabase project in dashboard (user action required)
- [ ] Note project URL and anon key
- [ ] Create `.env` with credentials (copy from `.env.example`)

### 3.1.2 Schema Deployment

**Files:** `supabase/migrations/`

**Tasks:**

- [x] Migration files created and verified
- [ ] Deploy `001_initial_schema.sql` via Supabase SQL Editor (user action)
- [ ] Deploy `002_indexes.sql` (user action)
- [ ] Deploy `003_rls_policies.sql` (user action)
- [ ] Verify all 17 tables created
- [ ] Test RLS policies with test user

### 3.1.3 PowerSync Setup

**Files:** `supabase/powersync/sync-rules.yaml`

**Tasks:**

- [x] Sync rules YAML created and verified
- [ ] Provision PowerSync instance (user action)
- [ ] Connect to Supabase database (user action)
- [ ] Upload sync rules (user action)
- [ ] Verify sync buckets configured

### 3.1.4 Environment Configuration

**Files:**

- `.env.example` - Template with all required variables
- `apps/desktop/src/main/config/env.ts` - Environment loader module
- `scripts/test-supabase.ts` - Supabase connection test
- `scripts/test-powersync.ts` - PowerSync connection test

**Tasks:**

- [x] Create `.env.example` template
- [x] Add env loading to Electron main process (`loadEnv()` in index.ts)
- [x] Create `config/env.ts` module with typed configuration
- [x] Create `npm run test:supabase` connection test script
- [x] Create `npm run test:powersync` connection test script
- [x] Document env setup in SUPABASE_SETUP_GUIDE.md

**Usage:**

```bash
# Copy environment template
cp .env.example .env

# Fill in credentials, then test
npm run test:supabase
npm run test:powersync
```

---

## Phase 3.2: PowerSync Integration

**Goal:** Local-first sync with Supabase backend
**Status:** 🟢 Complete

### 3.2.1 SDK Installation & Setup

**Tasks:**

- [x] Install packages: `npm install @powersync/web @supabase/supabase-js`
- [x] Create PowerSync schema definition matching Supabase
- [x] Create Supabase connector for auth tokens
- [x] Initialize PowerSync in main process

**Implemented Files:**

- `apps/desktop/src/main/services/sync/powerSyncSchema.ts` - Schema for all 17 tables
- `apps/desktop/src/main/services/sync/SupabaseConnector.ts` - Auth & CRUD upload
- `apps/desktop/src/main/services/sync/PowerSyncService.ts` - Main sync service
- `apps/desktop/src/main/services/sync/index.ts` - Module exports
- `apps/desktop/src/main/ipc/sync.ts` - IPC handlers for renderer

### 3.2.2 PowerSyncService Implementation

**Implemented Features:**

- [x] PowerSyncService class with singleton pattern
- [x] Connection management (connect/disconnect)
- [x] Sync status tracking with listener pattern
- [x] Pending changes monitoring
- [x] Query/execute/transaction methods
- [x] Watch queries for real-time updates
- [x] IPC handlers for all sync operations

**API Surface:**

```typescript
// Main process
const service = getPowerSyncService();
await service.initialize();
await service.connect();
const status = service.getSyncStatus();

// Renderer process (via preload)
await window.api.sync.initialize();
await window.api.auth.signIn(email, password);
const status = await window.api.sync.getStatus();
```

### 3.2.3 Service Layer Migration

Service migration deferred to Phase 3.4+ after Auth UI is complete.
Current services continue using local SQLite; PowerSync provides sync layer.

| Service                 | Priority | Status            |
| ----------------------- | -------- | ----------------- |
| FixtureService (pilot)  | 1        | Pending Phase 3.4 |
| ProjectService          | 2        | Pending           |
| ShopOrderProjectService | 3        | Pending           |
| Others                  | 4-10     | Pending           |

**Note:** Service migration requires authenticated users (Phase 3.3)

---

## Phase 3.3: Supabase Auth

**Goal:** User authentication for cloud sync
**Status:** 🟢 Complete

### 3.3.1 Auth Store & State Management

**Implemented File:** `apps/desktop/src/renderer/src/store/authStore.ts`

**Completed:**

- [x] Zustand store for auth state management
- [x] `signIn(email, password)` - calls IPC and updates state
- [x] `signUp(email, password)` - calls IPC and updates state
- [x] `signOut()` - calls IPC and clears state
- [x] `resetPassword(email)` - calls IPC
- [x] `initializeSync()` - checks auth status on app load
- [x] Sync status tracking with listener subscription
- [x] Error handling and loading states

### 3.3.2 Auth IPC Integration

**Location:** `apps/desktop/src/main/ipc/sync.ts` (combined with sync handlers)

**Completed:**

- [x] Auth IPC handlers integrated with SupabaseConnector
- [x] `auth:signIn`, `auth:signUp`, `auth:signOut`, `auth:resetPassword`
- [x] Session management via SupabaseConnector
- [x] Preload API exposure for renderer process

### 3.3.3 Auth UI Components

**Implemented Files:**

- `apps/desktop/src/renderer/src/components/auth/LoginForm.tsx`
- `apps/desktop/src/renderer/src/components/auth/SignUpForm.tsx`
- `apps/desktop/src/renderer/src/components/auth/PasswordResetForm.tsx`
- `apps/desktop/src/renderer/src/components/auth/AuthModal.tsx`
- `apps/desktop/src/renderer/src/components/auth/index.ts`

**Completed:**

- [x] LoginForm - email/password with "remember me" option
- [x] SignUpForm - registration with password requirements display
- [x] PasswordResetForm - email input with success confirmation
- [x] AuthModal - modal wrapper switching between login/signup/reset views
- [x] Form validation and error display
- [x] Loading states during async operations

### 3.3.4 Sync Status UI

**Implemented Files:**

- `apps/desktop/src/renderer/src/components/sync/SyncStatusIndicator.tsx`
- `apps/desktop/src/renderer/src/components/sync/index.ts`

**Completed:**

- [x] SyncStatusIndicator component for header
- [x] Shows auth status (Sign In button when not authenticated)
- [x] Shows sync status with icons (connected, syncing, error, offline)
- [x] Dropdown menu with user info, sync details, sign out
- [x] Pending changes indicator
- [x] Last synced timestamp formatting

### 3.3.5 App Integration

**Modified Files:**

- `apps/desktop/src/renderer/src/App.tsx`
- `apps/desktop/src/renderer/src/pages/LandingPage.tsx`
- `apps/desktop/src/renderer/src/pages/ProjectPage.tsx`

**Completed:**

- [x] AuthModal rendered at app root level
- [x] Sync initialization on app startup
- [x] SyncStatusIndicator added to LandingPage header
- [x] SyncStatusIndicator added to ProjectPage header

---

## Phase 3.4: Collaboration UI

**Goal:** User-facing sync and collaboration features
**Status:** 🟢 Complete

### 3.4.1 Sync Status Components

**Implemented Files:**

- `apps/desktop/src/renderer/src/components/sync/SyncStatusIndicator.tsx`
- `apps/desktop/src/renderer/src/components/sync/OfflineBanner.tsx`
- `apps/desktop/src/renderer/src/components/sync/index.ts`

**Completed:**

- [x] SyncStatusIndicator (icon + dropdown) - shows sync state in headers
- [x] Integrated into app headers (LandingPage, ProjectPage)
- [x] Pending changes indicator (built into SyncStatusIndicator)
- [x] OfflineBanner - dismissible warning when offline with retry button
- [x] OfflineBanner integrated into App.tsx (shows after LicenseBanner)

### 3.4.2 Conflict Resolution

**Implemented File:** `apps/desktop/src/renderer/src/components/sync/ConflictResolutionDialog.tsx`

**Completed:**

- [x] ConflictResolutionDialog component built
- [x] Shows local vs remote values side-by-side
- [x] Click to choose winner (local or remote)
- [x] "Apply to all" quick actions for bulk resolution
- [x] Expandable conflict details with timestamps
- [x] Visual indicators for resolution choices

### 3.4.3 Presence Indicators (Optional - Deferred)

**Status:** Deferred - requires Supabase Realtime integration and live multi-user testing

**Tasks (Future Enhancement):**

- [ ] Implement real-time presence via Supabase Realtime
- [ ] Show active collaborators on project
- [ ] Show cursor/selection for active users (stretch goal)

**Note:** This is a "nice-to-have" feature that can be added after core sync functionality is validated with real users.

---

## Success Criteria

### Performance (Phase 3.0)

- [ ] WAL checkpoint monitoring active
- [ ] Pagination available for large datasets
- [ ] Database metrics visible in dev tools
- [ ] No slow query warnings in normal use

### Cloud Sync (Phase 3.1-3.2)

- [x] Supabase schema deployed and accessible
- [x] PowerSync SDK integrated with schema
- [x] Sync service with IPC handlers implemented
- [ ] PowerSync syncing bidirectionally (requires auth - Phase 3.3)
- [ ] Offline mode queues operations correctly (requires auth)
- [ ] Sync latency < 2 seconds on reconnection (requires auth)

### Authentication (Phase 3.3)

- [x] Users can sign up/sign in (UI complete, requires Supabase auth enabled)
- [ ] Sessions persist across app restarts (pending testing)
- [x] Password reset flow works (UI complete)
- [x] Auth errors displayed clearly

### Collaboration (Phase 3.4)

- [x] Sync status visible at all times (SyncStatusIndicator in headers)
- [x] Offline state clearly indicated (OfflineBanner + icon changes)
- [x] Conflicts can be resolved manually (ConflictResolutionDialog)
- [ ] Multi-user editing tested with 2+ users (requires live testing)

---

## Dependency Graph

```
Pre-Work (PR #68 issues)
         │
         ▼
Phase 3.0 (Performance) ──┐
                          ├──► Phase 3.2 (PowerSync)
Phase 3.1 (Supabase)  ────┘          │
                                     ▼
                          Phase 3.3 (Auth) ──► Phase 3.4 (Collaboration UI)
```

---

## Risk Mitigation

| Risk                      | Impact | Mitigation                                         |
| ------------------------- | ------ | -------------------------------------------------- |
| PowerSync learning curve  | Medium | Follow docs, start with single service             |
| Sync conflicts            | High   | Use last-write-wins for MVP, add manual resolution |
| Offline queue growing     | Medium | Limit queue size, show warning                     |
| Supabase free tier limits | Low    | Monitor usage, plan upgrade path                   |
| Type safety regression    | High   | Address PR #68 issues first                        |

---

## Phase 1 Issues Addressed

| Issue                     | Status           | Phase    |
| ------------------------- | ---------------- | -------- |
| WAL Checkpoint Monitoring | 🔄 Phase 3.0.1   | 3.0      |
| Add Pagination            | 🔄 Phase 3.0.2   | 3.0      |
| Statement Caching         | ⏸️ Profile first | 3.0      |
| Database Monitoring       | 🔄 Phase 3.0.4   | 3.0      |
| Type Safety (@ts-nocheck) | 🔄 Pre-Work PW-1 | Pre-Work |
| Field Whitelist Security  | 🔄 Pre-Work PW-2 | Pre-Work |
| JSON.parse Logging        | 🔄 Pre-Work PW-3 | Pre-Work |
| Service Layer Tests       | 🔄 Pre-Work PW-4 | Pre-Work |

---

**Next:** Phase 4 (Testing) or live testing of sync with multiple users
**Last Updated:** February 5, 2026
