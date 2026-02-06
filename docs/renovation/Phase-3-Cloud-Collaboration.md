# Phase 3: Cloud Collaboration + Performance Optimization

**Status:** 🟢 Phase 3.0 Complete, Ready for 3.1-3.4
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
const setClause = fields.map(f => `${f} = ?`).join(', ');
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
    rawValue: project[field]?.substring(0, 100) // Truncate for logging
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
  allowedSortFields: readonly string[]
): { query: string; countQuery: string } {
  const sortField = options.sortBy && allowedSortFields.includes(options.sortBy)
    ? options.sortBy
    : allowedSortFields[0];
  const sortOrder = options.sortOrder === 'DESC' ? 'DESC' : 'ASC';

  return {
    query: `${baseQuery} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`,
    countQuery: baseQuery.replace('SELECT *', 'SELECT COUNT(*) as total')
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
      count: 0, totalTime: 0, maxTime: 0, errors: 0
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
        avgTime: metrics.count > 0 ? metrics.totalTime / metrics.count : 0
      };
    }
    return summary;
  }

  getSlowQueries(): Array<{ operation: string; avgTime: number }> {
    return Array.from(this.metrics.entries())
      .map(([operation, m]) => ({
        operation,
        avgTime: m.totalTime / m.count
      }))
      .filter(q => q.avgTime > this.slowQueryThresholdMs)
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

### 3.1.1 Project Setup

**Tasks:**
- [ ] Verify Supabase project is active
- [ ] Note project URL and anon key
- [ ] Create `.env.local` with credentials (gitignored)

### 3.1.2 Schema Deployment

**Files:** `supabase/migrations/`

**Tasks:**
- [ ] Deploy `001_initial_schema.sql` via Supabase SQL Editor
- [ ] Deploy `002_indexes.sql`
- [ ] Deploy `003_rls_policies.sql`
- [ ] Verify all 17 tables created
- [ ] Test RLS policies with test user

### 3.1.3 PowerSync Setup

**Files:** `supabase/powersync/sync-rules.yaml`

**Tasks:**
- [ ] Provision PowerSync instance
- [ ] Connect to Supabase database
- [ ] Upload sync rules
- [ ] Verify sync buckets configured

### 3.1.4 Environment Configuration

**New File:** `apps/desktop/.env.example`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
POWERSYNC_URL=https://your-instance.powersync.journeyapps.com
```

**Tasks:**
- [ ] Create `.env.example` template
- [ ] Add env loading to Electron main process
- [ ] Document env setup in README

---

## Phase 3.2: PowerSync Integration

**Goal:** Local-first sync with Supabase backend

### 3.2.1 SDK Installation & Setup

**Tasks:**
- [ ] Install packages: `npm install @powersync/web @supabase/supabase-js`
- [ ] Create PowerSync schema definition matching Supabase
- [ ] Create Supabase connector for auth tokens
- [ ] Initialize PowerSync in main process

**New Files:**
- `apps/desktop/src/main/services/sync/powerSyncSchema.ts`
- `apps/desktop/src/main/services/sync/SupabaseConnector.ts`
- `apps/desktop/src/main/services/sync/PowerSyncService.ts`

### 3.2.2 PowerSyncService Implementation

```typescript
// apps/desktop/src/main/services/sync/PowerSyncService.ts
export class PowerSyncService {
  private powerSync: PowerSyncDatabase | null = null;
  private syncStatus: 'disconnected' | 'connecting' | 'syncing' | 'synced' | 'error' = 'disconnected';

  async connect(userId: string): Promise<void> { /* ... */ }
  async disconnect(): Promise<void> { /* ... */ }
  async sync(): Promise<void> { /* ... */ }

  getSyncStatus(): SyncStatus { /* ... */ }
  getPendingChangesCount(): number { /* ... */ }

  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void { /* ... */ }
}
```

**Tasks:**
- [ ] Implement PowerSyncService class
- [ ] Add connection management
- [ ] Add sync status tracking
- [ ] Add pending changes monitoring
- [ ] Add event emitter for UI updates
- [ ] Write integration tests

### 3.2.3 Service Layer Migration

Migrate services one-by-one to use PowerSync for CRUD operations:

| Service | Priority | Effort |
|---------|----------|--------|
| FixtureService (pilot) | 1 | 4-6 hrs |
| ProjectService | 2 | 3-4 hrs |
| ShopOrderProjectService | 3 | 3-4 hrs |
| ShopOrderSectionService | 4 | 2-3 hrs |
| ShopOrderItemService | 5 | 2-3 hrs |
| ShopOrderRevisionService | 6 | 2-3 hrs |
| ShopOrderNoteService | 7 | 2-3 hrs |
| DimmerService | 8 | 2-3 hrs |
| PDRackService | 9 | 2-3 hrs |
| InfrastructureService | 10 | 2-3 hrs |

**Tasks per service:**
- [ ] Update service to use PowerSync for reads
- [ ] Update service to use PowerSync for writes
- [ ] Test offline operation
- [ ] Test sync after reconnection
- [ ] Verify data integrity

---

## Phase 3.3: Supabase Auth

**Goal:** User authentication for cloud sync

### 3.3.1 Auth Service

**New File:** `apps/desktop/src/main/services/auth/SupabaseAuthService.ts`

**Tasks:**
- [ ] Create SupabaseAuthService class
- [ ] Implement `signUp(email, password)`
- [ ] Implement `signIn(email, password)`
- [ ] Implement `signOut()`
- [ ] Implement `resetPassword(email)`
- [ ] Implement `getCurrentUser()`
- [ ] Add session persistence (Electron safeStorage)
- [ ] Add session refresh handling

### 3.3.2 IPC Handlers

**New File:** `apps/desktop/src/main/ipc/auth-handlers.ts`

**Tasks:**
- [ ] Create auth IPC handlers
- [ ] Add Zod validation for auth inputs
- [ ] Connect to SupabaseAuthService

### 3.3.3 Auth UI Components

**New Files:**
- `apps/desktop/src/renderer/src/components/auth/LoginForm.tsx`
- `apps/desktop/src/renderer/src/components/auth/SignUpForm.tsx`
- `apps/desktop/src/renderer/src/components/auth/PasswordResetForm.tsx`
- `apps/desktop/src/renderer/src/components/auth/AuthModal.tsx`

**Tasks:**
- [ ] Build LoginForm component
- [ ] Build SignUpForm component
- [ ] Build PasswordResetForm component
- [ ] Build AuthModal wrapper
- [ ] Add auth state to app context
- [ ] Add protected route handling

---

## Phase 3.4: Collaboration UI

**Goal:** User-facing sync and collaboration features

### 3.4.1 Sync Status Components

**New Files:**
- `apps/desktop/src/renderer/src/components/sync/SyncStatusIndicator.tsx`
- `apps/desktop/src/renderer/src/components/sync/OfflineBanner.tsx`
- `apps/desktop/src/renderer/src/components/sync/PendingChangesIndicator.tsx`

**Tasks:**
- [ ] Build SyncStatusIndicator (icon + tooltip)
- [ ] Build OfflineBanner (dismissible warning)
- [ ] Build PendingChangesIndicator (count badge)
- [ ] Integrate into app header

### 3.4.2 Conflict Resolution

**New File:** `apps/desktop/src/renderer/src/components/sync/ConflictResolutionDialog.tsx`

**Tasks:**
- [ ] Build ConflictResolutionDialog
- [ ] Show local vs remote values
- [ ] Allow user to choose winner
- [ ] Support "always use local/remote" preference

### 3.4.3 Presence Indicators (Optional)

**Tasks:**
- [ ] Implement real-time presence via Supabase Realtime
- [ ] Show active collaborators on project
- [ ] Show cursor/selection for active users (stretch goal)

---

## Success Criteria

### Performance (Phase 3.0)
- [ ] WAL checkpoint monitoring active
- [ ] Pagination available for large datasets
- [ ] Database metrics visible in dev tools
- [ ] No slow query warnings in normal use

### Cloud Sync (Phase 3.1-3.2)
- [ ] Supabase schema deployed and accessible
- [ ] PowerSync syncing bidirectionally
- [ ] Offline mode queues operations correctly
- [ ] Sync latency < 2 seconds on reconnection

### Authentication (Phase 3.3)
- [ ] Users can sign up/sign in
- [ ] Sessions persist across app restarts
- [ ] Password reset flow works
- [ ] Auth errors displayed clearly

### Collaboration (Phase 3.4)
- [ ] Sync status visible at all times
- [ ] Offline state clearly indicated
- [ ] Conflicts can be resolved manually
- [ ] Multi-user editing tested with 2+ users

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

| Risk | Impact | Mitigation |
|------|--------|------------|
| PowerSync learning curve | Medium | Follow docs, start with single service |
| Sync conflicts | High | Use last-write-wins for MVP, add manual resolution |
| Offline queue growing | Medium | Limit queue size, show warning |
| Supabase free tier limits | Low | Monitor usage, plan upgrade path |
| Type safety regression | High | Address PR #68 issues first |

---

## Phase 1 Issues Addressed

| Issue | Status | Phase |
|-------|--------|-------|
| WAL Checkpoint Monitoring | 🔄 Phase 3.0.1 | 3.0 |
| Add Pagination | 🔄 Phase 3.0.2 | 3.0 |
| Statement Caching | ⏸️ Profile first | 3.0 |
| Database Monitoring | 🔄 Phase 3.0.4 | 3.0 |
| Type Safety (@ts-nocheck) | 🔄 Pre-Work PW-1 | Pre-Work |
| Field Whitelist Security | 🔄 Pre-Work PW-2 | Pre-Work |
| JSON.parse Logging | 🔄 Pre-Work PW-3 | Pre-Work |
| Service Layer Tests | 🔄 Pre-Work PW-4 | Pre-Work |

---

**Next:** Complete Pre-Work items, then proceed to Phase 3.0
**Last Updated:** February 5, 2026
