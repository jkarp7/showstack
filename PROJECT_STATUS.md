# ShowStack Project Status

**Last Updated:** March 11, 2026
**Current Version:** 0.1.0-alpha
**Development Phase:** Alpha — UI redesign, Smart Groups, and cloud collaboration shipped; Lighting edition ~90% complete.
**Active Branch:** `develop`

This is a high-level index. For detailed status, see the linked documents.

---

## Overall Progress

| Edition / Domain    | Status         | Completion | Detail                                                                                                                   |
| ------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Lighting            | 🚧 In Progress | ~90%       | [`docs/development/lighting_project_status.md`](docs/development/lighting_project_status.md)                             |
| Core Infrastructure | ✅ Complete    | 100%       | See below                                                                                                                |
| Collaboration       | ✅ Complete    | 100%       | See below                                                                                                                |
| Sound               | ⬜ Planned     | 0%         | [`docs/development/future-editions/sound.md`](docs/development/future-editions/sound.md)                                 |
| Video               | ⬜ Planned     | 0%         | [`docs/development/future-editions/video.md`](docs/development/future-editions/video.md)                                 |
| Production / Tour   | ⬜ Planned     | 0%         | [`docs/development/future-editions/production.md`](docs/development/future-editions/production.md)                       |
| Designer / Complete | ⬜ Planned     | 0%         | [`docs/development/future-editions/designer_and_complete.md`](docs/development/future-editions/designer_and_complete.md) |

---

## Lighting Edition — Current Priorities

**Immediate (Lightwright parity):**

1. MVR export support
2. Enhanced error checking (overlapping patches, overloaded dimmers, duplicate channels)
3. Basic console integration — ETC Eos via OSC

**Deferred (waiting on dependencies):**

- Auto-complete system (needs fixture database)
- DMX conflict detection (waiting on Vectorworks integration)
- Cable Run Visualization, Advanced Phase Balancing, Power Distribution Reports
- Port Validation, Network Topology Visualization

See [`docs/development/lighting_project_status.md`](docs/development/lighting_project_status.md) for the full pending/planned/completed breakdown.

---

## Recently Completed

| #   | Feature                                                             | Date              |
| --- | ------------------------------------------------------------------- | ----------------- |
| 16  | UI Redesign Phases 4–9, Smart Groups Phases 1–4, bug fixes (PR #88) | March 11, 2026    |
| 15  | PowerSync write-path for projects & shop orders (PR #87)            | March 2026        |
| 14  | Multi-user collaboration (PR #85)                                   | March 2026        |
| 13  | Menu bar & toolbar reorganization (PR #83)                          | March 2, 2026     |
| 12  | Cloud sync fix — PowerSync Node migration                           | February 23, 2026 |
| 11  | Project Families / Version Stacking                                 | February 23, 2026 |
| 10  | User Accounts, Licensing & Demo Mode (PR #80)                       | February 13, 2026 |
| 9   | Shop Order Table Migration (PR #63)                                 | January 20, 2026  |
| 8   | Telemetry System Hardening (PR #61)                                 | January 18, 2026  |

---

## Core Infrastructure — ✅ Complete

All editions share this foundation.

- **Database:** Two-database architecture (app DB + project DB), migration system, Smart Groups schema
- **Cloud:** Supabase Auth, license management, PowerSync offline-first sync, multi-user collaboration
- **Licensing:** Tier-based access (Demo / Student / Professional / Institutional), edition gating
- **Settings:** 7-section settings system with persistence
- **Telemetry:** PostHog SDK, privacy-first, opt-in, error tracking, performance metrics
- **Theme:** Light/dark mode, system detection, Tailwind CSS
- **Window management:** Per-project windows, singleton landing window
- **File operations:** `.showstack` export/import, conflict resolution

**Pending cloud items:**

- E-commerce webhook → Supabase Edge Function (auto-fulfill purchases)
- Auto-updater maintenance gate

---

## Edition Pricing

| Edition    | Price     | Target Launch       |
| ---------- | --------- | ------------------- |
| Lighting   | $249/year | Now (alpha)         |
| Sound      | $199/year | Year 2 (2026–2027)  |
| Video      | $199/year | Year 3+ (2027–2028) |
| Designer   | $449/year | Year 2 (with Sound) |
| Production | $599/year | Year 3 (2027–2028)  |
| Complete   | $999/year | Year 4+ (2028–2029) |

---

## Key Reference Docs

- Architecture: [`docs/development/ARCHITECTURE.md`](docs/development/ARCHITECTURE.md)
- Dev setup: [`docs/development/dev-setup.md`](docs/development/dev-setup.md)
- Vectorworks plan: `docs/features/vectorworks-integration-plan.md`
- Console integration plan: `docs/features/console-integration-plan.md`
- Propared competitive analysis: `docs/features/propared-parity-analysis.md`
- Sound features spec: `docs/features/migration-sound-features.md`
- Archived plans: `docs/archive/`
