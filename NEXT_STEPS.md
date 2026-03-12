# Next Steps - ShowStack Development

**Last Updated:** March 11, 2026
**Status:** PR #88 (UI Redesign phases 4-9, Smart Groups phases 1-4, bug fixes) open → `develop`

---

## Quick Start (Resuming Work)

```bash
# 1. Ensure you're on the correct branch
git checkout develop

# 2. Pull latest changes
git pull origin develop

# 3. Install dependencies (sets up Husky hooks)
npm install

# 4. Rebuild better-sqlite3 for Electron
npx electron-rebuild -f -w better-sqlite3

# 5. Start dev server
npm run dev

# 6. Run tests
npm run test:run

# 7. Run linter
npm run lint

# 8. Check formatting
npm run format:check
```

---

## Recently Completed

### UI Redesign Phases 4-9, Smart Groups Phases 1-4, Bug Fixes (March 11, 2026) — PR #88 → `develop`

Completes the full UI redesign roadmap and all four phases of Smart Groups.

**UI Redesign (phases 4-9):** Navigation flattened to persistent sidebar; SystemDocs and ModuleLanding eliminated; Labels consolidated to single designer; Racks & Distribution under Equipment Manager; Show Health passive validation with sidebar badges; filter chips; CSS design tokens.

**Smart Groups (phases 1-4):** Named saved filters with pin overrides. Schema: `fixture_groups` + `fixture_group_pins`. Membership computed on demand (no re-evaluate button). Inspector panel shell. Equipment Manager integration (column, bulk pin, context menu). Shop orders auto-populate, labels `{group}` token, paperwork group-by.

**Bug fixes:** paperwork template seeding (FK order, `db.exec` → `db.prepare().get()`), `seedDefaultLayouts` bundler fix, shop order JSON array serialization, `syncFromParent` null/date validation, missing `getNotesByProjectId` import, shop order project column migration.

Plans archived: `docs/archive/completed-features/ui-redesign-plan.md`, `smart-groups-plan.md`, `smart-groups-spec.md`.

### PowerSync Write-Path for Projects & Shop Orders (March 2026) — `feature/powersync-write-path`

Fixes issue #86 (TOCTOU ownership race) by writing project and shop-order rows into the PowerSync local SQLite at creation/update/delete time. PowerSync's CRUD queue then uploads them to Supabase automatically, establishing ownership atomically before any invite RPC can run.

- `sync/projectSync.ts` — new module: `syncProjectToPowerSync`, `deleteProjectFromPowerSync`, `syncShopOrderToPowerSync`, `deleteShopOrderFromPowerSync`; all are no-ops when PowerSync is not initialized
- `powerSyncSchema.ts` — added missing `root_project_id` column to the `projects` table definition
- `ProjectService` — calls `maybeSyncToPowerSync()` after `create`, `update`, `createCopy`; fire-and-forget `deleteProjectFromPowerSync()` after `delete`
- `ShopOrderProjectService` — same pattern; `create()` now injects the authenticated user's ID so the local row is always owned before it reaches Supabase
- `CollaborationService` — backfills the full project/shop-order row to PowerSync before the invite RPC (handles rows created before this fix); the `invite_to_project` stub-upsert remains as a final safety net
- PowerSync writes are fire-and-forget with catch — failures are logged as warnings and do not fail local operations
- +23 tests; 1,933 total (all passing), 0 TypeScript errors

### Multi-User Collaboration (March 2026) — merged to `develop` as PR #85

- **CollaborationService** — invite/remove/accept/decline for projects and shop orders via Supabase RPCs
- **PresenceService** — real-time collaborator presence via Supabase Realtime channels with membership auth guard
- **ProjectSharingDialog** — Share button on project pages; invite by email with editor/viewer role selection; member list with remove/cancel-invite support
- **PendingInvitationsBanner** — persistent banner at the top of the app when the signed-in user has pending invitations; persists dismissed state per user
- **Collaboration settings tab** — shows pending invitations with project name and inviter email; Accept/Decline buttons deep-link to the relevant project on accept
- **16 Supabase migrations (005–016):** `project_members` + `shop_order_members` tables, RLS policies (WITH CHECK + USING), 12 RPCs (invite/remove/accept/decline/cancel/pending for both projects and shop orders), PowerSync denormalization columns, pending-invitation enrichment, license gate enforced server-side (migration 015+), RLS + RPC hardening (migration 016)
- **PowerSync sync rules rewritten** — no JOINs anywhere; parameterized buckets scoped per project and per shop order
- **License-gated:** sending invites requires Professional/Institutional tier with active cloud sync — enforced both client-side (`LicenseService`) and server-side (database function guard)
- **Feature-flagged** behind the `collaboration` flag
- **IPC layer** — 19 collaboration channels with UUID validation on all member ID params
- **Tests:** 1,910 passing across 74 files at merge

### User Accounts, Licensing & Demo Mode (February 2026)

- Supabase Auth integration (sign in, sign up, sign out, password reset)
- Email-based license auto-claim (no manual key entry)
- Perpetual fallback licensing model
- Demo mode for unauthenticated users (25 fixtures, no cloud sync, no exports)
- First-launch auth prompt with "Continue in Demo Mode" option
- Account page shows auth status with demo badge and upgrade prompts
- `maxFixtures` feature limit per tier
- Cloud sync flag on Supabase licenses table
- 5 new test cases for demo mode licensing

---

## Renovation Progress

### Completed Phases

- **Phase 0: Stabilization** - Error handling, modular code, naming conventions
- **Phase 1: Database Migration** - better-sqlite3 with WAL mode, transactions
- **Phase 2: Validation & Services** - Zod validation, service layer
- **Phase 3: Cloud Collaboration** - PowerSync + Supabase, offline-first sync
- **Phase 4: Testing & QA** - 1,576+ tests, 70%+ coverage, Vitest + RTL
- **Phase 5: CI/CD & DevOps** - ESLint 9, Prettier, Husky, GitHub Actions

### Completed: Phase 6 - Security & Monitoring

- [x] Code quality hardening (PR #76 review items)
- [x] Logger utility (replace ~1,000 console statements)
- [x] Sentry integration
- [x] Health check system

### Completed: Phase 7 - Disaster Recovery & Documentation

- [x] Phase 7.0: PR #77 review follow-ups
- [x] Phase 7.1: Automated database backups (every 6 hours, retention policy)
- [x] Phase 7.2: Crash recovery with database integrity validation
- [x] Phase 7.3: Documentation updates

See `docs/archive/renovation/README.md` for the full renovation plan.

---

## Open Issues / Next Steps

### Merge PR #88 → `develop`

PR #88 (UI Redesign + Smart Groups + bug fixes) is open and passing CI. Merge when approved.

### Merge `develop` → `main`

Batch `develop` → `main` after PR #88 merges. Includes: collaboration (PR #85), PowerSync write-path (PR #87), UI redesign + Smart Groups (PR #88).

### Next Feature Work

- [ ] **Smart Groups Phase 5 (if planned)** — any remaining group features
- [ ] **MVR export** — industry standard CAD/visualizer format (Lightwright parity)
- [ ] **Enhanced error checking** — overlapping patches, overloaded dimmers, duplicate channels
- [ ] **Basic console integration** — OSC protocol for ETC Eos
- [ ] **E-commerce webhook** → Supabase Edge Function (auto-fulfill Stripe/Shopify purchases)

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

- `docs/archive/renovation/README.md` - Renovation plan overview
- `docs/archive/renovation/Phase-6-Security-Monitoring.md` - Phase 6 details
- `docs/archive/renovation/Phase-7-Disaster-Recovery.md` - Phase 7 disaster recovery details
- `docs/user/LICENSING_SYSTEM_README.md` - Licensing system documentation
- `PROJECT_STATUS.md` - Overall project status
- `CONTRIBUTING.md` - Contribution guidelines and code standards
- `docs/development/ARCHITECTURE.md` - Architecture guide

---

## Tips for Resuming

1. **Check GitHub Issues** - Look for any critical bugs or feedback
2. **Review renovation status** - See `docs/archive/renovation/README.md`
3. **Run test suite** - Ensure all tests passing: `npm run test:run`
4. **Run lint** - Ensure no errors: `npm run lint`
5. **Check CI** - Ensure GitHub Actions are green
6. **Rebuild native modules** - `npx electron-rebuild -f -w better-sqlite3` for Electron, `npm rebuild better-sqlite3` for vitest

---

**Current Focus:** Merge PR #88 → `develop`, then batch `develop` → `main`
