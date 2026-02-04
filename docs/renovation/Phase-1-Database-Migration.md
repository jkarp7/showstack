# Phase 1: Database Migration to better-sqlite3

**Duration:** 8-10 weeks
**Status:** 🟢 READY TO START (Phase 0 Completed)
**Priority:** HIGH
**Goal:** Migrate from sql.js to better-sqlite3 for 10-20x performance and zero data loss

---

## Overview

Replace in-memory sql.js with native better-sqlite3:
- ✅ 10-20x performance improvement
- ✅ WAL mode (auto-persistence, no manual saves!)
- ✅ Transaction support
- ✅ Better concurrency
- ✅ ACID guarantees

---

## Checklist

### 1.1 Install better-sqlite3 ✅ COMPLETED
- [x] `npm install better-sqlite3 @types/better-sqlite3`
- [x] Verify installation

**Installed:**
- better-sqlite3 v12.6.2
- @types/better-sqlite3 v7.6.13

### 1.2 Update DatabaseManager ✅ COMPLETED
- [x] Replace sql.js with better-sqlite3 in DatabaseManager.ts
- [x] Enable WAL mode: `db.pragma('journal_mode = WAL')`
- [x] Remove manual `saveDatabase()` calls (converted to no-ops)
- [x] Test with existing .ss files

**Completed:**
- Updated DatabaseManager.ts and MigrationRunner.ts to use better-sqlite3 API
- Enabled WAL mode, foreign keys, and synchronous=NORMAL for all databases
- Updated all 9 query files to use better-sqlite3 API (prepare/get/all/run)
- Converted saveDatabase() functions to no-ops (WAL mode auto-persists)
- Build successful with better-sqlite3

### 1.3 Add Transaction Support ✅ COMPLETED
- [x] Create TransactionManager.ts
- [x] Update bulk operations to use transactions
- [x] Test rollback on error

**Completed:**
- Created TransactionManager with support for:
  - execute() - synchronous transactions
  - executeAsync() - async transactions
  - executeImmediate() - immediate transactions
  - executeExclusive() - exclusive transactions
  - executeBatch() - batch operations
  - Savepoint support for nested transactions
- Created bulkOperations.ts with utilities:
  - bulkInsert() - bulk insert with transaction
  - bulkUpdate() - bulk update with transaction
  - bulkDelete() - bulk delete with transaction
  - bulkUpsert() - bulk upsert with transaction
  - executeInTransaction() - execute multiple operations atomically
- All 12 tests passing - verified ACID guarantees and rollback behavior

### 1.4 Performance Optimization (2-3 weeks)
- [ ] Create performanceIndexes.ts
- [ ] Add indexes for common queries
- [ ] Benchmark: verify 10x+ improvement

### Integration Testing
- [ ] Test migration with real alpha user data
- [ ] Verify backward compatibility
- [ ] Load test with 10k+ fixtures
- [ ] Measure p95 latency (<50ms target)

---

## Success Criteria

- ✅ 10-20x performance improvement verified
- ✅ Zero data loss during migration
- ✅ Backward compatibility with .ss files
- ✅ All tests passing
- ✅ p95 latency <50ms

**Status:** 🟢 READY TO START (Phase 0 Completed February 2026)
**Next:** Phase 2 - Validation & Service Layer
