# Phase 7: Disaster Recovery, Backups & Documentation

**Duration:** 2-3 weeks
**Status:** 🟡 In Progress
**Priority:** HIGH
**Goal:** Zero data loss guarantee, up-to-date documentation, and Phase 6 follow-up hardening

---

## Checklist

### 7.0 Phase 6 Follow-up (PR #77 Review Items)

**High Priority:**

- [ ] Add Logger unit tests (main process)
  - Test formatting, log levels, environment detection
  - Test Sentry integration (captureError called on error)
  - Test Error object handling vs LogContext handling
  - File: `apps/desktop/src/main/utils/__tests__/logger.test.ts`
- [ ] Add Logger unit tests (renderer process)
  - Same coverage as main logger
  - File: `apps/desktop/src/renderer/src/utils/__tests__/logger.test.ts`
- [ ] Add HealthPanel component tests
  - Test auto-run on mount, refresh button, status display
  - Test loading/error/empty states
  - File: `apps/desktop/src/renderer/src/components/admin/__tests__/HealthPanel.test.tsx`
- [ ] Add health check throttling/debounce to HealthPanel
  - Prevent spamming the refresh button
  - Minimum interval between checks (e.g., 5 seconds)

**Medium Priority:**

- [ ] Add debug logging to empty catch block in HealthChecker project database check
  - `apps/desktop/src/main/services/HealthChecker.ts` — silent catch for project DB
- [ ] Improve IPC health handler error recovery
  - `apps/desktop/src/main/ipc/health.ts` — include error message in fallback report
- [ ] Add security comment for Windows path extraction in disk space check
  - `apps/desktop/src/main/services/HealthChecker.ts` — wmic command path param
- [ ] Extract magic numbers in main/index.ts retry logic to named constants
  - `apps/desktop/src/main/index.ts:105-110`

**Low Priority / Nice-to-Have:**

- [ ] Elevate `no-console` ESLint rule to `error` (test files already exempt)
- [ ] Standardize Sentry release version source (main uses app.getVersion(), renderer uses env var)
- [ ] Add Zod validation for HealthReport type (aligns with Phase 2 patterns)
- [ ] CI enforcement for unmocked logger in tests

### 7.1 Automated Backups (1 week)

- [ ] Create BackupService
- [ ] Automatic backup every 6 hours
- [ ] Keep max 10 backups
- [ ] Backup before destructive operations
- [ ] Test restore from backup

### 7.2 Crash Recovery (1 week)

- [ ] Create CrashRecovery class
- [ ] Detect crash on startup (.running marker file)
- [ ] Validate database integrity
- [ ] Restore from backup if corrupted
- [ ] Test crash scenarios

### 7.3 Documentation Updates (1 week)

Update all project documentation to reflect the renovated architecture and tooling:

- [ ] Update CONTRIBUTING.md
  - Reflect actual TypeScript config (strict mode off in main, on in renderer)
  - Document ESLint + Prettier enforcement
  - Document Husky pre-commit hooks and `--no-verify` bypass
  - Update file path references (old `src/` paths to `apps/desktop/src/`)
  - Document new architecture patterns (services, validation, PowerSync)
  - Update testing section (Vitest, 1,455+ tests, coverage targets)
  - Add new contributor setup instructions (Husky installation)
- [ ] Update PROJECT_STATUS.md
  - Reflect completed renovation phases (testing suite, cloud sync, CI/CD, security)
  - Update architecture decisions (better-sqlite3, PowerSync + Supabase)
  - Update known limitations (remove resolved items)
  - Update completion percentages
- [ ] Update NEXT_STEPS.md
  - Reflect current priorities (Phase 7, then feature development)
  - Update quick start instructions (lint, format commands)
  - Remove completed items
- [ ] Review and update docs/development/ARCHITECTURE.md if needed
- [ ] Review and update docs/development/dev-setup.md if needed

---

## Success Criteria

- Logger unit tests for both main and renderer processes
- HealthPanel component tests with state coverage
- Health check throttling prevents UI spam
- Automatic backups every 6 hours
- Max 10 backups retained
- Crash detection on startup
- Restore from backup if corrupted
- Zero data loss verified
- All documentation reflects current architecture and tooling
- New contributors can onboard using updated docs

**Status:** 🟡 In Progress
**Next:** Production Launch!
