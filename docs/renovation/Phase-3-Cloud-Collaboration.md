# Phase 3: Cloud Collaboration + Performance Optimization

**Duration:** 7-9 weeks
**Status:** 🟡 Depends on Phase 2
**Priority:** CRITICAL (required for Lightwright parity)
**Goal:** Local-first cloud sync using PowerSync + Supabase, plus database performance optimization

---

## Overview

Phase 3 combines cloud collaboration features with database performance optimizations identified in Phase 1 code review:

1. **Cloud Collaboration** - PowerSync + Supabase for multi-user editing
2. **Performance Optimization** - WAL checkpointing, pagination, statement caching
3. **Observability** - Database monitoring and metrics

**Why PowerSync + Supabase:**
- ✅ Zero backend code to write
- ✅ Saves 15-20 weeks vs custom backend
- ✅ $0/month MVP cost
- ✅ Built-in auth, real-time, conflict resolution

---

## Phase 1 Follow-Up Issues (Integrated)

Based on PR #67 code review, the following performance optimizations will be addressed in Phase 3:

### 3.0 Database Performance Optimization (2 weeks)

#### 3.0.1 WAL Checkpoint Monitoring ⭐ HIGH PRIORITY
**Effort:** 2-4 hours
**Current Issue:** WAL mode enabled but no monitoring or periodic checkpointing; WAL files can grow unbounded

**Files Affected:**
- `src/main/database/core/DatabaseManager.ts`

**Implementation:**
```typescript
// In DatabaseManager class
private walCheckpointInterval?: NodeJS.Timer;

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
      const walSize = this.appDb?.pragma('page_count') as number;
      if (walSize > 10000) {
        logger.warn('WAL file size growing large', { pages: walSize });
      }
    } catch (error) {
      logger.error('Failed to checkpoint WAL', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

/**
 * Stop periodic checkpointing (called on app shutdown)
 */
stopPeriodicCheckpointing(): void {
  if (this.walCheckpointInterval) {
    clearInterval(this.walCheckpointInterval);
  }
}

/**
 * Force a full checkpoint (blocking, use sparingly)
 */
forceCheckpoint(): void {
  this.appDb?.pragma('wal_checkpoint(FULL)');
  this.projectDb?.pragma('wal_checkpoint(FULL)');
}
```

**Benefits:**
- Prevents WAL file from growing unbounded
- Better disk space management
- Improved backup reliability (smaller WAL files)
- Non-blocking checkpoints don't affect performance

**Tasks:**
- [ ] Add WAL checkpointing methods to DatabaseManager
- [ ] Start checkpointing on database initialization
- [ ] Stop checkpointing on database close
- [ ] Add WAL size monitoring
- [ ] Test checkpoint behavior under load
- [ ] Document checkpoint strategy

---

#### 3.0.2 Add Pagination to Query Methods
**Effort:** 4-8 hours
**Current Issue:** Methods like `getAllFixtures()` return all rows; problematic with large datasets (10k+ fixtures)

**Files Affected:**
- `src/main/database/queries/fixtures.ts`
- `src/main/database/queries/infrastructure.ts`
- `src/main/database/queries/shop-order.ts`
- Other query files

**Implementation:**
```typescript
// Add paginated versions of query methods
export function getFixturesPaginated(
  projectId: string,
  options: {
    offset: number;
    limit: number;
    sortBy?: keyof Fixture;
    sortOrder?: 'ASC' | 'DESC';
    filters?: Partial<Fixture>;
  }
): { fixtures: Fixture[]; total: number } {
  const db = getDatabase();

  // Build WHERE clause from filters
  const whereConditions = ['project_id = ?'];
  const params: any[] = [projectId];

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined) {
        whereConditions.push(`${key} = ?`);
        params.push(value);
      }
    });
  }

  const whereClause = whereConditions.join(' AND ');
  const orderBy = options.sortBy ? `${options.sortBy} ${options.sortOrder || 'ASC'}` : 'id ASC';

  // Get total count
  const countResult = db.prepare(
    `SELECT COUNT(*) as total FROM fixtures WHERE ${whereClause}`
  ).get(...params) as { total: number };

  // Get paginated results
  const fixtures = db.prepare(
    `SELECT * FROM fixtures
     WHERE ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`
  ).all(...params, options.limit, options.offset) as Fixture[];

  return {
    fixtures,
    total: countResult.total
  };
}
```

**Benefits:**
- Better performance with large datasets
- Reduced memory usage
- Improved UI responsiveness
- Enables virtual scrolling in UI

**Tasks:**
- [ ] Add paginated query methods for fixtures
- [ ] Add paginated query methods for infrastructure
- [ ] Add paginated query methods for shop-order items
- [ ] Add paginated query methods for power distribution
- [ ] Add paginated query methods for dimmer racks
- [ ] Update services to use pagination
- [ ] Update UI components to use pagination
- [ ] Test with datasets > 10k rows
- [ ] Benchmark pagination performance

---

#### 3.0.3 Implement Statement Caching (OPTIONAL)
**Effort:** 6-10 hours
**Current Issue:** Prepared statements created on every function call; adds overhead for hot path queries

**Priority:** LOW (better-sqlite3 already caches internally; profile first before implementing)

**Files Affected:**
- All query files in `src/main/database/queries/`

**Implementation:**
```typescript
// In DatabaseManager or new StatementCache class
export class StatementCache {
  private cache = new Map<string, Database.Statement>();

  constructor(private db: Database.Database) {}

  get(sql: string): Database.Statement {
    let stmt = this.cache.get(sql);
    if (!stmt) {
      stmt = this.db.prepare(sql);
      this.cache.set(sql, stmt);
    }
    return stmt;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Usage in query methods
const cache = new StatementCache(db);
export function getFixtureById(id: string): Fixture | undefined {
  const db = getDatabase();
  const stmt = cache.get('SELECT * FROM fixtures WHERE id = ?');
  return stmt.get(id) as Fixture | undefined;
}
```

**Benefits:**
- Faster query execution (skip parsing/planning)
- Reduced CPU usage
- Better for hot path queries
- Minimal memory overhead

**Note:** better-sqlite3 already caches statements internally, so gains may be modest. **Profile first before implementing.**

**Tasks:**
- [ ] **FIRST: Profile query performance to determine if caching needed**
- [ ] If profiling shows benefit: Create StatementCache class
- [ ] If profiling shows benefit: Integrate with query methods
- [ ] If profiling shows benefit: Add cache size monitoring
- [ ] If profiling shows benefit: Add cache clearing on database reload
- [ ] Benchmark with and without statement caching

---

#### 3.0.4 Add Database Monitoring/Observability
**Effort:** 10-16 hours
**Current Issue:** No visibility into database performance, query times, error rates, or resource usage

**Priority:** MEDIUM (useful for production debugging)

**Implementation:**
```typescript
// src/main/database/monitoring/DatabaseMonitor.ts
export class DatabaseMonitor {
  private metrics = {
    queries: new Map<string, { count: number; totalTime: number; errors: number }>(),
    transactions: { success: 0, rollback: 0 },
    walSize: 0,
    lastCheckpoint: Date.now()
  };

  recordQuery(sql: string, durationMs: number, error?: Error): void {
    const existing = this.metrics.queries.get(sql) || { count: 0, totalTime: 0, errors: 0 };
    existing.count++;
    existing.totalTime += durationMs;
    if (error) existing.errors++;
    this.metrics.queries.set(sql, existing);
  }

  getSlowQueries(thresholdMs: number = 100): Array<{ sql: string; avgTime: number }> {
    return Array.from(this.metrics.queries.entries())
      .map(([sql, stats]) => ({
        sql,
        avgTime: stats.totalTime / stats.count
      }))
      .filter(q => q.avgTime > thresholdMs)
      .sort((a, b) => b.avgTime - a.avgTime);
  }

  getMetricsSummary() {
    return {
      totalQueries: Array.from(this.metrics.queries.values())
        .reduce((sum, s) => sum + s.count, 0),
      transactions: this.metrics.transactions,
      slowQueries: this.getSlowQueries(),
      walSize: this.metrics.walSize
    };
  }
}

// Integrate with Transaction wrapper
export class MonitoredTransactionManager extends TransactionManager {
  constructor(db: Database.Database, private monitor: DatabaseMonitor) {
    super(db);
  }

  execute<T>(callback: () => T): T {
    const start = Date.now();
    try {
      const result = super.execute(callback);
      this.monitor.recordQuery('transaction', Date.now() - start);
      return result;
    } catch (error) {
      this.monitor.recordQuery('transaction', Date.now() - start, error as Error);
      throw error;
    }
  }
}
```

**Benefits:**
- Identify slow queries
- Track error rates
- Monitor resource usage
- Performance regression detection
- Production debugging

**Tasks:**
- [ ] Create DatabaseMonitor class
- [ ] Integrate monitoring with TransactionManager
- [ ] Add monitoring to query methods
- [ ] Create metrics dashboard UI
- [ ] Add slow query alerts
- [ ] Export metrics to logging service
- [ ] Document monitoring capabilities

---

## Cloud Collaboration Work

### 3.1 Supabase Setup (1 week)

Set up Supabase project for cloud database and authentication.

**Tasks:**
- [ ] Create Supabase project (free tier)
- [ ] Deploy database schema to Supabase:
  - [ ] projects table
  - [ ] fixtures table
  - [ ] shop_order_projects table
  - [ ] shop_order_sections table
  - [ ] shop_order_items table
  - [ ] shop_order_revisions table
  - [ ] shop_order_notes table
  - [ ] infrastructure_equipment table
  - [ ] power_distribution table
  - [ ] dimmer_racks table
  - [ ] dimmer_modules table
- [ ] Configure Row-Level Security (RLS) policies
  - [ ] Users can only access their own projects
  - [ ] Shared projects accessible by team members
  - [ ] Admin users can access all projects
- [ ] Set up environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Test Supabase connection from desktop app
- [ ] Document Supabase setup process

**Success Criteria:**
- ✅ Supabase project created and accessible
- ✅ All tables deployed with correct schema
- ✅ RLS policies configured and tested
- ✅ Environment variables set correctly
- ✅ Connection test successful

---

### 3.2 PowerSync Integration (3-4 weeks)

Integrate PowerSync SDK for local-first sync with Supabase backend.

#### 3.2.1 PowerSync SDK Setup
**Tasks:**
- [ ] Install PowerSync SDK: `npm install @powersync/web`
- [ ] Create PowerSync configuration
- [ ] Define PowerSync schema (match Supabase tables)
- [ ] Set up PowerSync SQLite adapter (use existing better-sqlite3)
- [ ] Configure sync rules and conflict resolution

#### 3.2.2 PowerSync Service
**Tasks:**
- [ ] Create `PowerSyncService` class
- [ ] Implement `connect()` - establish PowerSync connection
- [ ] Implement `disconnect()` - close PowerSync connection
- [ ] Implement `sync()` - trigger manual sync
- [ ] Add sync status monitoring (syncing, offline, error)
- [ ] Add conflict resolution strategies
- [ ] Handle offline queue and replay

#### 3.2.3 Service Layer Integration
**Tasks:**
- [ ] Update `FixtureService` to use PowerSync
- [ ] Update `ProjectService` to use PowerSync
- [ ] Update `ShopOrderService` to use PowerSync
- [ ] Update `InfrastructureService` to use PowerSync
- [ ] Update `PowerService` to use PowerSync
- [ ] Update `DimmerService` to use PowerSync
- [ ] Test bidirectional sync (desktop → cloud → desktop)
- [ ] Test offline mode (queue operations, sync when online)
- [ ] Test conflict resolution

**Success Criteria:**
- ✅ PowerSync syncing bidirectionally
- ✅ Offline mode queues operations
- ✅ Conflicts resolved correctly
- ✅ Sync status visible in UI
- ✅ No data loss during sync

---

### 3.3 Supabase Auth (1-2 weeks)

Implement user authentication using Supabase Auth.

**Tasks:**
- [ ] Install Supabase client: `npm install @supabase/supabase-js`
- [ ] Create `SupabaseAuthService` class
- [ ] Implement email/password sign up
- [ ] Implement email/password sign in
- [ ] Implement sign out
- [ ] Implement password reset
- [ ] Add session persistence (remember user on app restart)
- [ ] Build Login UI component
- [ ] Build Sign Up UI component
- [ ] Build Password Reset UI component
- [ ] Test full auth flow
- [ ] Add error handling for auth failures
- [ ] Document authentication flow

**Success Criteria:**
- ✅ Users can sign up with email/password
- ✅ Users can sign in with email/password
- ✅ Sessions persist across app restarts
- ✅ Password reset flow works
- ✅ Auth errors displayed to user
- ✅ User session synced with PowerSync

---

### 3.4 Collaboration UI (1 week)

Build UI components for multi-user collaboration.

**Tasks:**
- [ ] Create `PresenceIndicator` component
  - [ ] Show who is currently viewing the project
  - [ ] Show user avatars and names
  - [ ] Update in real-time
- [ ] Create `SyncStatus` component
  - [ ] Show sync state (syncing, synced, offline, error)
  - [ ] Show pending changes count
  - [ ] Allow manual sync trigger
- [ ] Create `ConflictResolution` dialog
  - [ ] Show conflicting changes
  - [ ] Allow user to choose resolution strategy
  - [ ] Preview before/after
- [ ] Test with 2+ simultaneous users
- [ ] Test offline → online sync
- [ ] Test conflict scenarios

**Success Criteria:**
- ✅ Presence indicators working
- ✅ Sync status visible and accurate
- ✅ Conflicts can be resolved manually
- ✅ Multi-user editing tested with 2+ users
- ✅ Real-time updates working

---

## Success Criteria

### Performance
- ✅ WAL checkpoint monitoring implemented
- ✅ Pagination available for all large datasets
- ✅ Statement caching profiled (implemented if beneficial)
- ✅ Database monitoring collecting metrics

### Cloud Collaboration
- ✅ PowerSync syncing bidirectionally
- ✅ Offline mode works (queue and replay)
- ✅ Multi-user editing tested with 2+ users
- ✅ Presence indicators working
- ✅ Auth flow complete (sign up, sign in, reset)

### Quality
- ✅ No data loss during sync
- ✅ Conflicts resolved correctly
- ✅ Sync latency < 2 seconds
- ✅ All existing tests still passing

---

## Estimated Effort Breakdown

| Task | Duration |
|------|----------|
| 3.0 Database Performance Optimization | 2 weeks |
| 3.1 Supabase Setup | 1 week |
| 3.2 PowerSync Integration | 3-4 weeks |
| 3.3 Supabase Auth | 1-2 weeks |
| 3.4 Collaboration UI | 1 week |
| **Total** | **7-9 weeks** |

---

## Dependencies

**Depends on:** Phase 2 - Validation & Service Layer

**Blocking:** Phase 4 - Testing & Quality (needs cloud sync for integration tests)

---

## Risk Mitigation

### Risk: PowerSync Learning Curve
**Mitigation:** Follow PowerSync documentation examples, start with simple sync scenarios

### Risk: Sync Conflicts
**Mitigation:** Use last-write-wins for MVP, add manual conflict resolution for critical fields

### Risk: Offline Queue Growing Large
**Mitigation:** Limit queue size, show warning to user, periodic sync reminders

### Risk: Supabase Free Tier Limits
**Mitigation:** Monitor usage, plan upgrade path, optimize queries to reduce API calls

### Risk: Statement Caching Premature Optimization
**Mitigation:** Profile first before implementing, may skip if no benefit

---

## Phase 1 Issues Resolved in Phase 3

✅ **Issue #7:** WAL Checkpoint Monitoring
✅ **Issue #8:** Add Pagination to Query Methods
🔄 **Issue #9:** Implement Statement Caching (profile first, optional)
✅ **Issue #10:** Add Database Monitoring/Observability

**Already resolved in Phase 2:**
- Issue #5: Logging Abstraction
- Issue #6: Type Safety in bulkOperations
- Issue #11: Improved Error Messages
- Issue #12: Rate Limiting to Retry Logic

---

**Status:** 🟡 Depends on Phase 2
**Next:** Phase 4 - Testing & Quality Assurance

**Last Updated:** February 4, 2026
