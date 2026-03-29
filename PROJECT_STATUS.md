# ShowStack Project Status

**Last Updated:** March 28, 2026
**Current Version:** 0.2.0-alpha
**Development Phase:** Alpha — console integration Phases 1 & 2 shipped, cloud sync packaged-build fixed, auth flow improved; Lighting edition ~97% complete.
**Active Branch:** `develop`

This is a high-level index. For detailed status, see the linked documents.

---

## Overall Progress

| Edition / Domain    | Status         | Completion | Detail                                                                                                                   |
| ------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Lighting            | 🚧 In Progress | ~97%       | [`docs/development/lighting_project_status.md`](docs/development/lighting_project_status.md)                             |
| Core Infrastructure | ✅ Complete    | 100%       | See below                                                                                                                |
| Collaboration       | ✅ Complete    | 100%       | See below                                                                                                                |
| Sound               | ⬜ Planned     | 0%         | [`docs/development/future-editions/sound.md`](docs/development/future-editions/sound.md)                                 |
| Video               | ⬜ Planned     | 0%         | [`docs/development/future-editions/video.md`](docs/development/future-editions/video.md)                                 |
| Production / Tour   | ⬜ Planned     | 0%         | [`docs/development/future-editions/production.md`](docs/development/future-editions/production.md)                       |
| Designer / Complete | ⬜ Planned     | 0%         | [`docs/development/future-editions/designer_and_complete.md`](docs/development/future-editions/designer_and_complete.md) |

---

## Lighting Edition — Current Priorities

**In progress:**

1. ~~MVR export support~~ — **Done** (PR #90)
2. ~~Enhanced error checking~~ — **Done** (Show Health, PR #90)
3. **Console integration — ETC Eos via OSC** — Phases 1 & 2 complete; paused for hardware testing before Phase 3 (GrandMA2)
4. ~~IP/VLAN port validation (Issue #17)~~ — **Closed** (shipped as console network prereqs)

**Deferred:**

- Cable Run Visualization, Advanced Phase Balancing, Power Distribution Reports
- Network Topology Visualization (Issue #19)
- Real-time Port Status Monitoring dashboard (Issue #20 — service + IPC shipped; UI panel shipped; status dashboard complete)
- Vectorworks XML integration (Issue #32)

See [`docs/development/lighting_project_status.md`](docs/development/lighting_project_status.md) for the full pending/planned/completed breakdown.

---

## Recently Completed

| #   | Feature                                                                            | Date           |
| --- | ---------------------------------------------------------------------------------- | -------------- |
| 22  | Cloud sync packaged-build fix + license-gated sync + returning-user auth flow      | March 28, 2026 |
| 21  | Console integration Phase 1 (Eos OSC backend) + Phase 2 (UI)                       | March 2026     |
| 20  | IP/VLAN validation + PortStatusMonitorService + Network Status panel (Issue #17)   | March 2026     |
| 19  | GDTF personality library Phases 1–4, MVR export, Show Health, DMX Map (PR #90)     | March 2026     |
| 18  | Pre-1.0 fixes: email deep links, backup checksums, telemetry, type safety (PR #90) | March 2026     |
| 17  | Feature flags + Admin Panel backend (Issues #35, #52, PR #90)                      | March 2026     |
| 16  | UI Redesign Phases 4–9, Smart Groups Phases 1–4, bug fixes (PR #88)                | March 11, 2026 |
| 15  | PowerSync write-path for projects & shop orders (PR #87)                           | March 2026     |
| 14  | Multi-user collaboration (PR #85)                                                  | March 2026     |
| 13  | Menu bar & toolbar reorganization (PR #83)                                         | March 2, 2026  |

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
