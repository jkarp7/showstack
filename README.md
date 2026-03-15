# ShowStack

**Modern production management software for live entertainment**

[![Test Suite](https://github.com/jkarp7/showstack/actions/workflows/test.yml/badge.svg)](https://github.com/jkarp7/showstack/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/jkarp7/showstack/branch/main/graph/badge.svg)](https://codecov.io/gh/jkarp7/showstack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-39-47848F.svg)](https://www.electronjs.org/)

ShowStack is a comprehensive suite of tools designed for lighting designers, production electricians, and entertainment professionals. This repository contains the **ShowStack:Production** module — a modern alternative to LightWright 6.

---

## Project Overview

**ShowStack** is a unified desktop application for live entertainment production management. Built with Electron + React, it provides professional tools for lighting designers, production electricians, and tour managers. Features are activated via a license-based edition system — one app, multiple editions.

### Current Modules

**ShowStack:Lighting** — Equipment & Documentation _(Alpha — ~92% complete)_

- Fixture Manager with virtual grid (10,000+ fixtures at 60 FPS)
- Export to CSV, ETC Eos ASCII, GrandMA2/3 XML with native save dialog
- Shop Order builder with spreadsheet-like table interface and revision tracking
- Paperwork generation with 13 customizable report types
- Power distribution tracking, phase balancing, and rack management
- Label designer with 5 Avery templates and batch PDF printing
- Infrastructure equipment tracking with port assignment management
- Show Health — passive validation with 7 check types and sidebar badges

**ShowStack:Sound / Video / Production / Tour** _(planned — Year 2+)_

---

## Key Features

- **Offline-first** — Works without internet; perpetual license fallback keeps the app running on versions built during your active maintenance window
- **User accounts** — Supabase Auth (sign in/up, password reset); licenses auto-claimed by email
- **Cloud sync** — PowerSync integration for project sync across devices (enabled per license tier)
- **Demo mode** — Restricted access for unauthenticated users (25 fixtures, no exports)
- **Module-based licensing** — Pay only for what you need; tier-based feature limits
- **Dark mode** — Full light/dark theme support
- **Privacy-first analytics** — Anonymous, opt-in telemetry with PostHog
- **Developer mode** — Advanced debugging, feature flags (13 experimental features), DevTools
- **Multi-window support** — Open multiple projects simultaneously
- **Auto-save** — Never lose your work
- **Export flexibility** — PDF, CSV, JSON formats

---

## Repository Structure

```
showstack/
├── apps/
│   └── desktop/            # Electron desktop app
│       └── src/
│           ├── main/       # Main process (IPC, database, services)
│           ├── renderer/   # React application (UI, stores, components)
│           └── preload/    # Preload scripts
│
├── packages/
│   └── shared/             # Shared types and utilities
│
├── supabase/               # Supabase Edge Functions and schema
│
├── docs/                   # Documentation
│   ├── development/        # Developer guides and architecture
│   ├── features/           # Feature specifications and roadmaps
│   ├── architecture/       # Licensing and edition strategy
│   ├── business/           # Pricing, market analysis
│   ├── user/               # End-user documentation
│   ├── testing/            # Testing guides and patterns
│   ├── releases/           # Release checklists
│   └── archive/            # Completed plans and historical docs
│
├── proof-of-concept/       # Original virtual grid POC (reference only)
├── scripts/                # Build and utility scripts
├── resources/              # App icons and static assets
│
├── PROJECT_STATUS.md       # Comprehensive feature tracking
├── README.md               # This file
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Development Setup

```bash
# Install dependencies
npm install

# Start the app in development mode
npm run dev

# Type-check the codebase
npx tsc --noEmit

# Run linter
npm run lint
```

See [docs/development/dev-setup.md](docs/development/dev-setup.md) for full environment setup including Supabase and PowerSync configuration.

---

## Testing

ShowStack has comprehensive test coverage with **1,500+ tests** across 50+ test files.

### Running Tests

```bash
# Watch mode — auto-runs on changes
npm test

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage

# Visual UI with coverage
npm run test:ui
```

### Coverage Requirements

| File Type              | Target | Current        |
| ---------------------- | ------ | -------------- |
| **Critical Utilities** | 80%+   | **95-100%** ✅ |
| **Standard Utilities** | 60-70% | **70%+** ✅    |
| **Components**         | 50-60% | **50%+** ✅    |
| **IPC Handlers**       | 70%+   | **70%+** ✅    |
| **Global**             | 50%+   | **~50%** ✅    |

**Tested Modules:**

- Power calculations (98% coverage)
- Circuit parsing & rack linking (95% coverage)
- Label grid calculations (100% coverage)
- Fixture data mapping (100% coverage)
- Auth flow, demo mode, license verification (comprehensive)
- File security validation (43 tests)

### Testing Documentation

- **[Testing Guide](docs/testing/TESTING_GUIDE.md)** — Comprehensive guide with examples
- **[Quick Reference](docs/testing/QUICK_REFERENCE.md)** — Common patterns and commands
- **[Mocking Strategy](docs/testing/MOCKING_STRATEGY.md)** — Mock patterns and best practices

### CI/CD

All tests run automatically on:

- **Ubuntu Latest** — Primary CI environment
- **macOS Latest** — macOS compatibility
- **Windows Latest** — Windows compatibility

Coverage reports are uploaded to [Codecov](https://codecov.io/gh/jkarp7/showstack) on every push.

---

## Status

**Current Phase:** Alpha
**Version:** 0.1.0-alpha
**Status:** User accounts, licensing, and demo mode implemented; core lighting feature set ~92% complete — actively seeking beta testers

### Completed

**Core Infrastructure:**

- Electron app with multi-window support
- Two-database architecture (app.db + projects.db via better-sqlite3)
- PowerSync schema for offline-first cloud sync
- Supabase Auth — sign in, sign up, password reset
- Supabase license auto-claim by email with perpetual fallback model
- Demo mode for unauthenticated users
- Module-based licensing with tier-based feature limits
- Dark mode support
- Settings page with 8 configuration tabs
- Admin panel with analytics dashboard
- Privacy-first telemetry with PostHog (opt-in)

**Lighting Features:**

- Fixture Manager — virtual grid, 68+ columns, LightWright parity
- Equipment Export — CSV, ETC Eos ASCII, GrandMA2/3 XML with native save dialog and configurable headers
- Show Health — passive validation engine with 7 check types (duplicate DMX/channel, missing type, patched without channel, channel without patch, missing circuit, port over capacity); sidebar error/warning badges
- Shop Order builder — spreadsheet-like table with revision tracking, clipboard paste, CSV export
- Paperwork Generator — 13 report types with customizable headers and visual layout designer
- Power Management — rack configuration, phase balancing, port linking
- Label Designer — grid-based visual editor, 5 Avery templates, batch PDF printing
- Infrastructure tracking — network equipment, port assignments, CSV import/export
- Smart Groups — named saved filters with shop order and label integration
- Color flags, conditional row highlighting, auto-complete from project data

### In Progress / Near-term

- MVR / Vectorworks export support
- Enhanced error checking — rack overload detection (DMX conflicts and basic data quality checks complete)
- Basic ETC Eos console integration (OSC)
- E-commerce → Supabase webhook (auto-fulfill purchases)
- Auto-updater maintenance gate

### Planned (Post-Alpha)

- Eos integration (OSC bidirectional sync)
- Vectorworks XML import/export
- Roll label printer support (Dymo, Brother, Zebra)
- Sound Edition (Year 2)
- Video Edition (Year 3+)
- Production / Tour Edition (Year 3+)

---

## Competitive Positioning

**vs LightWright 6:**

| Feature       | LightWright 6        | ShowStack:Lighting    |
| ------------- | -------------------- | --------------------- |
| Price         | $845 one-time        | $249/year             |
| Updates       | $625 every 3-5 years | Continuous (included) |
| Collaboration | No                   | Cloud sync (optional) |
| Cloud Sync    | No                   | Yes (optional)        |
| Modern UI     | No (1990s)           | Yes (2025)            |
| Offline Mode  | Yes                  | Yes                   |
| Demo Mode     | No                   | Yes                   |

**Year 1:** 71% cheaper ($249 vs $845)
**3 Years:** 49% cheaper ($747 vs $1,470)

---

## Technology Stack

### Desktop App (Electron)

- **Runtime:** Node.js 20+
- **Framework:** Electron 39+
- **Database:** better-sqlite3 (main process) + PowerSync schema (offline-first sync)
- **Analytics:** PostHog (privacy-first, opt-in)

### Frontend (React)

- **Framework:** React 19+
- **Language:** TypeScript 5.9+
- **State:** Zustand (9 stores)
- **UI:** Tailwind CSS + Radix UI
- **Build:** Vite (via electron-vite)
- **Routing:** React Router v6

### Cloud Services

- **Auth:** Supabase Auth (email/password)
- **Database:** Supabase (PostgreSQL) — licenses, user accounts
- **Sync:** PowerSync — offline-first project sync across devices
- **Analytics:** PostHog

---

## Documentation

### User Documentation

- **[Project Status](PROJECT_STATUS.md)** — Complete feature tracking and development roadmap
- **[Licensing System](docs/user/LICENSING_SYSTEM_README.md)** — License management and demo mode guide
- **[Admin Panel Guide](docs/user/ADMIN_PANEL_USER_GUIDE.md)** — Admin panel user guide

### Developer Documentation

- **[Architecture](docs/development/ARCHITECTURE.md)** — System architecture overview
- **[Dev Setup](docs/development/dev-setup.md)** — Environment setup, Supabase, PowerSync
- **[Claude Code Quickstart](docs/development/CLAUDE_CODE_QUICKSTART.md)** — AI-assisted development guide
- **[Testing Guide](docs/testing/TESTING_GUIDE.md)** — Testing patterns and coverage requirements

### Project Planning

- **[Edition Strategy](docs/architecture/naming-and-editions.md)** — Edition structure and pricing
- **[Licensing Architecture](docs/architecture/migration-unified-licensing.md)** — License-based feature access
- **[Pricing Strategy](docs/business/pricing.md)** — Market analysis and revenue model
- **[Post-Refactor Roadmap](docs/features/POST_REFACTOR_ROADMAP.md)** — E-commerce pipeline, update distribution

---

## Performance Targets

- **Load time:** <2 seconds for 5,000 fixture project
- **Grid rendering:** 60 FPS with virtual scrolling
- **PDF generation:** <5 seconds for 50-page report

---

## License

Copyright © 2025–2026 Lytrix / Josh Karp Designs

Proprietary — all rights reserved during development. License terms TBD at public launch.

---

## Contact

**Josh Karp**
Lytrix / Josh Karp Designs
[jkarp.com](https://jkarp.com)

---

**Built for the live entertainment industry**

Theater • Concert • Broadcast • Film/TV
