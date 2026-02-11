# Phase 6: Security & Monitoring

**Duration:** 3-4 weeks
**Status:** 🟢 Complete
**Priority:** MEDIUM
**Goal:** Production-ready security, observability, and code quality hardening

---

## Checklist

### 6.0 PR #76 Review Items (Code Quality Hardening)

- [x] Change `@typescript-eslint/no-explicit-any` from `off` to `warn` in eslint.config.js
- [x] Add `--max-warnings` flag to ESLint CI step (threshold: 855)
- [x] Add ESLint caching (`--cache` flag in lint scripts)
- [x] `.eslintcache` already in `.gitignore`
- [x] Change `npm audit` to fail CI on high/critical vulnerabilities (removed `continue-on-error: true`)

### 6.1 Logger Migration — Main Process (~450 statements)

- [x] Logger utility already existed at `src/main/utils/logger.ts`
- [x] Migrated all IPC handlers (`src/main/ipc/*.ts`) from console.\* to logger
- [x] Migrated all services, database, and utility files to logger
- [x] Migrated menu template and window manager

### 6.2 Logger Migration — Renderer Process (~450 statements)

- [x] Created renderer logger at `src/renderer/src/utils/logger.ts` (uses `import.meta.env.DEV`)
- [x] Migrated all stores (8 files)
- [x] Migrated all hooks (9 files)
- [x] Migrated all pages (9 files)
- [x] Migrated all components (~52 files across shop-order, settings, power, paperwork, sync)
- [x] Migrated utils and App.tsx (10 files)
- [x] ESLint warnings reduced from 1,559 to 855

### 6.3 Sentry Integration

- [x] Installed `@sentry/electron`
- [x] Created main process Sentry service (`src/main/services/sentry.ts`)
- [x] Created renderer Sentry service (`src/renderer/src/services/sentry.ts`)
- [x] Initialize Sentry in main process (`src/main/index.ts`) — early, after env loading
- [x] Initialize Sentry in renderer (`src/renderer/src/main.tsx`) — before React render
- [x] Updated main logger to forward errors to Sentry
- [x] Updated renderer logger to forward errors to Sentry
- [x] Configured DSN from env vars (`SENTRY_DSN`, `VITE_SENTRY_DSN`)
- [x] Set environment/release metadata
- [x] Filter sensitive data (URL breadcrumbs)
- [x] Added env vars to `.env.example`

### 6.4 Health Check System

- [x] Created `HealthChecker` service (`src/main/services/HealthChecker.ts`)
- [x] Checks: database connectivity (app + project), filesystem access, memory usage, cloud sync
- [x] Created IPC handler (`src/main/ipc/health.ts`)
- [x] Built HealthPanel component in Admin UI (`src/renderer/src/components/admin/HealthPanel.tsx`)
- [x] Added "System Health" tab to Admin Panel
- [x] Updated preload with health API
- [x] 14 unit tests for HealthChecker service (all passing)

### 6.5 Test Fixes

- [x] Fixed 18 test files broken by logger migration (console spy → logger mock)
- [x] All 1,454 tests passing

---

## Success Criteria

- [x] All PR #76 code quality items addressed
- [x] Logger utility replaces raw console statements (~900 statements migrated)
- [x] Sentry integration captures errors (opt-in via env var)
- [x] Health check system in Admin Panel
- [x] No secrets in source code (DSN via env vars)
- [x] ESLint warnings trending downward (1,559 → 855)
- [x] All tests passing (1,454 tests across 48 files)

**Status:** 🟢 Complete
**Next:** Phase 7 - Disaster Recovery & Documentation
