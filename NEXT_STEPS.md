# Next Steps - ShowStack Development

**Branch:** `develop`
**Last Updated:** February 6, 2026
**Status:** Renovation ~65% complete (Phases 0-5 done), Phase 6 next

---

## Quick Start (Resuming Work)

```bash
# 1. Ensure you're on develop branch
git checkout develop

# 2. Pull latest changes
git pull origin develop

# 3. Install dependencies (sets up Husky hooks)
npm install

# 4. Start dev server
npm run dev

# 5. Run tests
npm run test:run

# 6. Run linter
npm run lint

# 7. Check formatting
npm run format:check
```

---

## Renovation Progress

### Completed Phases

- **Phase 0: Stabilization** - Error handling, modular code, naming conventions
- **Phase 1: Database Migration** - better-sqlite3 with WAL mode, transactions
- **Phase 2: Validation & Services** - Zod validation, service layer
- **Phase 3: Cloud Collaboration** - PowerSync + Supabase, offline-first sync
- **Phase 4: Testing & QA** - 1,440+ tests, 70%+ coverage, Vitest + RTL
- **Phase 5: CI/CD & DevOps** - ESLint 9, Prettier, Husky, GitHub Actions

### Current: Phase 6 - Security & Monitoring

- [ ] Code quality hardening (PR #76 review items)
  - `no-explicit-any`: warn, ESLint caching, `--max-warnings`, CodeQL/SAST
- [ ] Logger utility (replace ~1,000 console statements)
- [ ] Sentry integration
- [ ] Health check system

### Next: Phase 7 - Disaster Recovery & Documentation

- [ ] BackupService (automatic backups every 6 hours)
- [ ] CrashRecovery (detect and recover from crashes)
- [ ] Update all project documentation to reflect renovated architecture

See `docs/renovation/README.md` for the full renovation plan.

---

## After Renovation: Feature Development Priorities

### High Priority (Lightwright Parity)

- [ ] **MVR export support** - Industry standard CAD/visualizer format
- [ ] **Enhanced error checking** - Overlapping patches, overloaded dimmers, duplicate channels
- [ ] **Basic console integration** - OSC protocol for ETC Eos

### Medium Priority

- [ ] Power distribution printable reports with visualization
- [ ] Vectorworks XML integration
- [ ] Advanced console support (grandMA)

### Shop Order Post-Merge Improvements (Issue #65)

- [ ] Standardize error handling (toast notifications)
- [ ] Virtual scrolling for large tables (500+ items)
- [ ] E2E tests with Playwright

---

## Related Documentation

- `docs/renovation/README.md` - Renovation plan overview
- `docs/renovation/Phase-6-Security-Monitoring.md` - Current phase details
- `PROJECT_STATUS.md` - Overall project status
- `CONTRIBUTING.md` - Contribution guidelines and code standards
- `docs/development/ARCHITECTURE.md` - Architecture guide

---

## Tips for Resuming

1. **Check GitHub Issues** - Look for any critical bugs or feedback
2. **Review renovation status** - See `docs/renovation/README.md`
3. **Run test suite** - Ensure all tests passing: `npm run test:run`
4. **Run lint** - Ensure no errors: `npm run lint`
5. **Check CI** - Ensure GitHub Actions are green on develop

---

**Current Focus:** Phase 6 - Security & Monitoring (renovation ~65% complete)
