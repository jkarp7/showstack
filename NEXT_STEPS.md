# Next Steps - ShowStack Development

**Last Updated:** March 9, 2026
**Status:** Multi-user collaboration shipped; PowerSync project-sync gap documented below

---

## Quick Start (Resuming Work)

```bash
# 1. Ensure you're on the correct branch
git checkout feature/user-accounts-licensing

# 2. Pull latest changes
git pull origin feature/user-accounts-licensing

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

### Multi-User Collaboration (March 2026)

- Project and shop-order sharing: invite by email with editor/viewer roles
- `CollaborationService` — invite/remove/accept/decline via Supabase RPCs (migrations 005–011)
- `PresenceService` — real-time collaborator presence via Supabase Realtime channels
- `ProjectSharingDialog` — Share button on project pages; member list with remove support
- `PendingInvitationsBanner` — app-top banner surfacing pending invitations on login
- Collaboration settings tab — Accept/Decline UI with project name and inviter email
- PowerSync sync rules rewritten — parameterized buckets, no JOINs anywhere (migration 008 denormalizes `project_id` onto `dimmer_rack_modules` and `shop_order_id` onto `shop_order_items`)
- Feature-flagged behind `collaboration`; license-gated to Professional/Institutional tiers

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

### Current: Phase 7 - Disaster Recovery & Documentation

- [x] Phase 7.0: PR #77 review follow-ups
- [x] Phase 7.1: Automated database backups (every 6 hours, retention policy)
- [x] Phase 7.2: Crash recovery with database integrity validation
- [ ] Phase 7.3: Documentation updates (in progress)

See `docs/archive/renovation/README.md` for the full renovation plan.

---

## Known Issues / Next Steps

### PowerSync: Projects Not Written to Supabase on Creation

**Context:** ShowStack stores project data in a local SQLite file (`showstack-projects.db`). Supabase has a separate `projects` table used by PowerSync sync rules and the collaboration RPCs. These two are currently not kept in sync automatically.

**Workaround in place:** The `invite_to_project` RPC (migration 010) upserts a minimal project stub (`id`, `user_id`, `name`) into Supabase's `projects` table on first invite. This allows the ownership check and `project_members` insert to succeed. Only `name` is populated; all other columns remain NULL in Supabase.

**Full fix needed:** One of the following approaches:

1. **PowerSync write path** — Write project creates/updates/deletes to the PowerSync SQLite instead of (or in addition to) the local project DB. PowerSync's `uploadData` connector will then sync them to Supabase automatically.
2. **Direct Supabase writes** — On every project create/update/delete in `ProjectService`, also call Supabase directly (upsert the full row). Simpler to implement but duplicates the write path.
3. **Migrate primary store to PowerSync** — Make the PowerSync SQLite the single source of truth for project data (replace `showstack-projects.db`). Larger refactor but eliminates the two-DB split entirely.

Until this is resolved, project metadata visible to collaborators in Supabase will only include `name`. Fixtures, racks, and other project data still live exclusively in the local SQLite and are not accessible to collaborators.

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

**Current Focus:** Phase 7.3 - Documentation updates, then merge feature branch to main
