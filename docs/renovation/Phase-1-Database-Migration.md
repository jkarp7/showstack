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

### 1.1 Install better-sqlite3 (1 day)
- [ ] `npm install better-sqlite3 @types/better-sqlite3`
- [ ] Verify installation

### 1.2 Update DatabaseManager (2 weeks)
- [ ] Replace sql.js with better-sqlite3 in DatabaseManager.ts
- [ ] Enable WAL mode: `db.pragma('journal_mode = WAL')`
- [ ] Remove manual `saveDatabase()` calls
- [ ] Test with existing .ss files

### 1.3 Add Transaction Support (1-2 weeks)
- [ ] Create TransactionManager.ts
- [ ] Update bulk operations to use transactions
- [ ] Test rollback on error

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
