# Phase 6: Security & Monitoring

**Duration:** 3-4 weeks
**Status:** 🔵 Ready to Start
**Priority:** MEDIUM
**Goal:** Production-ready security, observability, and code quality hardening

---

## Checklist

### 6.0 PR #76 Review Items (Code Quality Hardening)

- [ ] Change `@typescript-eslint/no-explicit-any` from `off` to `warn` in eslint.config.js
- [ ] Add `--max-warnings` flag to ESLint CI step (set initial threshold, e.g., 1050)
- [ ] Add ESLint caching in CI (`--cache --cache-location .eslintcache`)
- [ ] Add `.eslintcache` to `.gitignore`
- [ ] Change `npm audit` to fail CI on high/critical vulnerabilities (remove `continue-on-error: true`)
- [ ] Create GitHub issue to track ESLint warning reduction (target: reduce from 1,016)
- [ ] Evaluate CodeQL or other SAST tool for security scanning in CI

### 6.1 Logger Utility (~1,000 console statements)

- [ ] Create a logger utility service (structured logging with levels)
- [ ] Migrate `console.log/warn/error` calls to logger in main process
- [ ] Migrate `console.log/warn/error` calls to logger in renderer process
- [ ] Configure log levels per environment (development vs production)

### 6.2 Sentry Integration (1-2 weeks)

- [ ] Install @sentry/electron
- [ ] Initialize Sentry in main + renderer
- [ ] Configure error sampling
- [ ] Filter sensitive data
- [ ] Test error capture

### 6.3 Health Check System (1-2 weeks)

- [ ] Create HealthChecker class
- [ ] Check database, filesystem, memory, cloud connection
- [ ] Add health check IPC handler
- [ ] Build HealthPanel in Admin UI
- [ ] Set up alerts

---

## Success Criteria

- All PR #76 code quality items addressed
- Logger utility replaces raw console statements
- Sentry captures all errors
- Health check in Admin Panel
- Metrics tracked in PostHog
- No secrets in source code
- ESLint warnings trending downward

**Status:** 🔵 Ready to Start
**Next:** Phase 7 - Disaster Recovery & Documentation
