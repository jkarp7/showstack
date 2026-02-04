# ShowStack Renovation Plan

**Architecture:** Local-First with PowerSync + Supabase
**Timeline:** 8.5-12 months (solo developer + Claude)
**Status:** 🔵 Planning Complete

---

## Quick Links

- [00-OVERVIEW.md](./00-OVERVIEW.md) - Complete renovation plan (all phases)
- [Phase-0-Stabilization.md](./Phase-0-Stabilization.md) - **Start here!**
- [Phase-1-Database-Migration.md](./Phase-1-Database-Migration.md)
- [Phase-2-Validation-Services.md](./Phase-2-Validation-Services.md)
- [Phase-3-Cloud-Collaboration.md](./Phase-3-Cloud-Collaboration.md)
- [Phase-4-Testing.md](./Phase-4-Testing.md)
- [Phase-5-CICD.md](./Phase-5-CICD.md)
- [Phase-6-Security-Monitoring.md](./Phase-6-Security-Monitoring.md)
- [Phase-7-Disaster-Recovery.md](./Phase-7-Disaster-Recovery.md)

---

## Phase Status

| Phase | Duration | Status | Priority |
|-------|----------|--------|----------|
| **Phase 0: Stabilization** | 7-9 weeks | 🔵 Ready to start | CRITICAL |
| **Phase 1: Database Migration** | 8-10 weeks | 🟡 Depends on Phase 0 | HIGH |
| **Phase 2: Validation & Services** | 6-8 weeks | 🟡 Depends on Phase 1 | HIGH |
| **Phase 3: Cloud Collaboration** | 6-8 weeks | 🟡 Depends on Phase 2 | CRITICAL |
| **Phase 4: Testing** | 4-6 weeks | 🟡 Depends on Phase 3 | HIGH |
| **Phase 5: CI/CD** | 2-3 weeks | 🟡 Depends on Phase 4 | MEDIUM |
| **Phase 6: Security & Monitoring** | 3-4 weeks | 🟡 Depends on Phase 5 | MEDIUM |
| **Phase 7: Disaster Recovery** | 1-2 weeks | 🟡 Depends on Phase 6 | HIGH |

**Total Timeline:** 37-52 weeks (8.5-12 months)

---

## Key Improvements

### Foundation & Stability
✅ Error handling with retry logic
✅ Modular code organization (<200 lines per file)
✅ Clear naming ("shop-order" not "prep")
✅ Performance monitoring from day 1

### Database & Data
✅ better-sqlite3 (10-20x faster than sql.js)
✅ WAL mode (auto-persistence)
✅ Transaction support
✅ Zod validation (runtime type safety)

### Cloud & Collaboration
✅ PowerSync + Supabase (saves 15-20 weeks vs custom backend)
✅ Real-time multi-user editing
✅ Offline-first architecture
✅ $0/month MVP cost

### Production Ready
✅ 70% test coverage
✅ Automated CI/CD
✅ Sentry error tracking
✅ Automated backups
✅ Crash recovery

---

## How to Use This Plan

1. **Read 00-OVERVIEW.md** - Understand the full strategy
2. **Start with Phase 0** - Foundation must be solid
3. **Follow phases in order** - Each depends on the previous
4. **Check off items** - Track progress with checklists
5. **Update status** - Mark phases as complete

### Tracking Progress

Each phase has:
- ✅ Detailed implementation steps
- ✅ Code examples
- ✅ Checklists
- ✅ Success criteria
- ✅ Testing requirements

Update the status as you complete each phase:
- 🔵 Ready to start
- 🟡 In progress
- 🟢 Complete

---

## Cost Analysis

### PowerSync + Supabase (Recommended)
- **MVP:** $0/month (free tiers)
- **Production:** $25-150/month
- **Time:** 6-8 weeks (Phase 3)

### Custom Backend (Not Recommended)
- **MVP:** $46-76/month
- **Production:** $100-200/month
- **Time:** 16-20 weeks
- **Maintenance:** High

**Decision:** PowerSync + Supabase saves 15-20 weeks and is simpler to maintain.

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test Coverage | 50% | 70% |
| Query Performance (p95) | Unknown | <50ms |
| App Load Time | Unknown | <2s |
| File Organization | Some 800+ line files | Max 200 lines |
| Cloud Sync Latency | N/A | <500ms |
| Clear Naming | "prep" confusion | "shop-order" |

---

## Next Steps

1. ✅ Review 00-OVERVIEW.md
2. ✅ Begin Phase 0 (Stabilization)
3. ⬜ Set up Supabase project (parallel to Phase 2)
4. ⬜ Create project board to track progress
5. ⬜ Celebrate each phase completion!

---

**Last Updated:** February 3, 2026
**Branch:** feature/renovation-plan
**Author:** Senior Architect (Claude + Josh)
