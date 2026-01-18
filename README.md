# ShowStack

**Modern production management software for live entertainment**

[![Test Suite](https://github.com/jkarp7/showstack/actions/workflows/test.yml/badge.svg)](https://github.com/jkarp7/showstack/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/jkarp7/showstack/branch/main/graph/badge.svg)](https://codecov.io/gh/jkarp7/showstack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-28-47848F.svg)](https://www.electronjs.org/)

ShowStack is a comprehensive suite of tools designed for lighting designers, production electricians, and entertainment professionals. This repository contains the ShowStack:Production module - a modern alternative to LightWright 6.

---

## 🎯 Project Overview

**ShowStack** is a comprehensive desktop application suite for live entertainment production management. Built with modern web technologies (Electron + React), it provides professional tools for lighting designers, production electricians, and tour managers.

### Current Modules

**ShowStack:Manager** - Tour & Venue Management *(coming soon)*
- Tour scheduling and calendar
- Venue information database
- Crew and personnel tracking

**ShowStack:Production** - Equipment & Documentation *(70% complete)*
- Equipment Manager for fixture tracking with power management
- Shop Order tool with multi-discipline support
- Professional paperwork generation
- Power distribution tracking and analysis
- Label design and printing

### Key Features (Alpha)

- ✅ **Offline-first** - Works without internet, 14-day grace period
- ✅ **Module-based licensing** - Pay only for what you need
- ✅ **Dark mode** - Full light/dark theme support
- ✅ **Privacy-first analytics** - Anonymous, opt-in telemetry with PostHog
- ✅ **Developer mode** - Advanced debugging and feature flags
- ✅ **Multi-window support** - Open multiple projects simultaneously
- ✅ **Auto-save** - Never lose your work
- ✅ **Export flexibility** - PDF, CSV, JSON formats

---

## 📁 Repository Structure

```
showstack/
├── docs/                   # Documentation
│   ├── technical-spec.md   # Complete technical specification
│   ├── pricing.md          # Pricing strategy & competitive analysis
│   └── dev-setup.md        # Development environment setup
│
├── proof-of-concept/       # Working POC of virtual data grid
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── src/                    # Main application (TBD - Phase 1)
│   ├── main/              # Electron main process
│   ├── renderer/          # React application
│   └── preload/           # Preload scripts
│
├── .github/
│   └── workflows/         # CI/CD pipelines
│
├── LICENSE
├── README.md              # This file
└── package.json           # Root package.json
```

---

## 🚀 Getting Started

### Quick Start - Test the Proof of Concept

The POC demonstrates the core virtual data grid:

```bash
cd proof-of-concept
npm install
npm run dev
```

Opens at `http://localhost:5173` with 1,000 fixtures loaded.

**What to try:**
- Scroll performance (60 FPS with 10k+ fixtures)
- In-cell editing (click, type, Tab, Enter)
- Multi-select (Click, Shift+Click, Cmd/Ctrl+Click)
- Add/delete fixtures

### Full App Development (Phase 1+)

Coming soon! See [docs/dev-setup.md](docs/dev-setup.md) for environment setup.

---

## 🧪 Testing

ShowStack has comprehensive test coverage with **235+ tests** across utilities, components, and IPC handlers.

### Running Tests

```bash
# Watch mode - auto-runs on changes
npm test

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage

# Visual UI with coverage
npm run test:ui

# Run specific test file
npm test powerCalculations
```

### Coverage Requirements

| File Type | Target | Current |
|-----------|--------|---------|
| **Critical Utilities** | 80%+ | **95-100%** ✅ |
| **Standard Utilities** | 60-70% | **70%+** ✅ |
| **Components** | 50-60% | **50%+** ✅ |
| **IPC Handlers** | 70%+ | **70%+** ✅ |
| **Global** | 50%+ | **~50%** ✅ |

**Tested Modules:**
- ✅ Power calculations (98% coverage)
- ✅ Circuit parsing & rack linking (95% coverage)
- ✅ Label grid calculations (100% coverage)
- ✅ Fixture data mapping (100% coverage)
- ✅ Component logic (bug fixes verified)
- ✅ File security validation (43 tests)

### Testing Documentation

- **[Testing Guide](docs/testing/TESTING_GUIDE.md)** - Comprehensive guide with examples
- **[Quick Reference](docs/testing/QUICK_REFERENCE.md)** - Common patterns and commands
- **[Mocking Strategy](docs/testing/MOCKING_STRATEGY.md)** - Mock patterns and best practices

### CI/CD

All tests run automatically on:
- ✅ **Ubuntu Latest** - Primary CI environment
- ✅ **macOS Latest** - macOS compatibility
- ✅ **Windows Latest** - Windows compatibility

Coverage reports are uploaded to [Codecov](https://codecov.io/gh/jkarp7/showstack) on every push.

---

## 📊 Status

**Current Phase:** Alpha
**Version:** 0.1.0-alpha
**Status:** Ready for testing and feedback

### ✅ Completed Features

**Core Infrastructure:**
- ✅ Electron application with multi-window support
- ✅ Two-database architecture (app.db + projects.db)
- ✅ sql.js (SQLite compiled to WebAssembly)
- ✅ Offline-first with 14-day grace period
- ✅ Module-based licensing system
- ✅ Dark mode support
- ✅ Settings page with 8 configuration tabs
- ✅ Admin panel for template management

**Modules:**
- ✅ **Manager Module** (placeholder - tour/venue management coming)
- ✅ **Production Module** (~70% complete)
  - Equipment Manager (fixture CRUD, power management)
  - Shop Order tool with revisions
  - Paperwork generation
  - Power distribution tracking
  - Labels designer
- ✅ **Shop Order Tool** (~90% complete)
  - Multi-discipline support
  - Section-based equipment lists
  - Revision management with notes
  - PDF/CSV export
  - Print builder with page layout
- ✅ **Power Management** (~100% complete)
  - Dimmer rack and PD rack configuration
  - Module-based capacity calculations
  - Auto-linking fixtures to racks
  - Real-time utilization tracking
  - Phase balance monitoring

**Privacy & Analytics:**
- ✅ Privacy-first telemetry with PostHog SDK integration
- ✅ User consent dialog with opt-in controls
- ✅ Anonymous analytics (opt-in only)
- ✅ Comprehensive event tracking (fixtures, infrastructure, power, shop orders)
- ✅ Global error tracking with stack traces
- ✅ Performance metrics (grid render, PDF export, app startup)
- ✅ Analytics dashboard in Admin Panel
- ✅ Data retention controls
- ✅ Export/delete personal data

**Developer Tools:**
- ✅ Developer mode with DevTools
- ✅ Feature flags system (13 experimental features)
- ✅ Debug panels in all modules
- ✅ F12 keyboard shortcut
- ✅ Comprehensive documentation

**Testing Infrastructure:**
- ✅ Vitest + React Testing Library setup
- ✅ 235+ comprehensive tests (95-100% coverage on critical code)
- ✅ CI/CD with GitHub Actions (Ubuntu, macOS, Windows)
- ✅ Codecov integration for coverage tracking
- ✅ Testing guides and reference documentation

### 🚧 In Progress
- 🚧 Equipment Manager fixture list UI (~30% remaining)
- 🚧 Customizable paperwork export headers
- 🚧 Fixture library with manufacturers
- 🚧 Auto-complete system for fixture fields

### ⬜ Planned (Post-Alpha)
- ⬜ Eos integration (OSC)
- ⬜ Vectorworks import/export
- ⬜ Label printing (Dymo, Brother, Zebra)
- ⬜ Cloud collaboration features
- ⬜ Advanced reporting engine

---

## 💰 Competitive Positioning

**vs LightWright 6:**

| Feature | LightWright 6 | ShowStack:Production |
|---------|---------------|----------------------|
| Price | $845 one-time | $249/year |
| Updates | $625 every 3-5 years | Continuous (included) |
| Collaboration | ❌ | ✅ Real-time |
| Cloud Sync | ❌ | ✅ Optional |
| Modern UI | ❌ (1990s) | ✅ (2025) |
| Offline Mode | ✅ | ✅ |

**Year 1:** 71% cheaper ($249 vs $845)  
**3 Years:** 49% cheaper ($747 vs $1,470)

---

## 🛠️ Technology Stack

### Desktop App (Electron)
- **Runtime:** Node.js 20+
- **Framework:** Electron 39.2+
- **Database:** sql.js (SQLite → WebAssembly)
- **Analytics:** PostHog (privacy-first, opt-in)
- **Hardware:** electron-printer, osc-js

### Frontend (React)
- **Framework:** React 19+
- **Language:** TypeScript 5.9+
- **State:** Zustand (9 stores)
- **UI:** Tailwind CSS + Radix UI
- **Build:** Vite
- **Routing:** React Router v6

### Backend (Optional Cloud Sync)
- **API:** Express.js + PostgreSQL
- **Auth:** JWT
- **Realtime:** Socket.io
- **Storage:** AWS S3 / Cloudflare R2

---

## 📖 Documentation

### User Documentation
- **[Project Status](PROJECT_STATUS.md)** - Complete feature tracking and development roadmap

### Developer Documentation
- **[Developer Mode Guide](DEVELOPER_MODE.md)** - Enable debugging, feature flags, and DevTools
- **[Telemetry Implementation](TELEMETRY_IMPLEMENTATION_SUMMARY.md)** - Privacy-first analytics system
- **[PostHog Setup](POSTHOG_SETUP.md)** - Analytics configuration and monitoring

### Project Planning
- **[Technical Specification](docs/technical-spec.md)** - Complete feature specs, database schema, architecture
- **[Pricing Strategy](docs/pricing.md)** - Market analysis, revenue model, go-to-market plan
- **[Development Setup](docs/dev-setup.md)** - Environment setup, testing, building
- **[POC README](proof-of-concept/README.md)** - Proof-of-concept documentation

---

## 🗺️ Roadmap

### Phase 1: Foundation (Months 1-2)
- [x] Proof-of-concept (virtual grid)
- [ ] Electron app shell
- [ ] SQLite database
- [ ] CRUD operations
- [ ] Sorting & filtering
- [ ] Auto-complete

### Phase 2: Power & Control (Months 3-4)
- [ ] Dimmer rack configuration
- [ ] Circuit management
- [ ] DMX map visualization
- [ ] Error checking
- [ ] Multi-cable tracking

### Phase 3-7: See [docs/technical-spec.md](docs/technical-spec.md)

---

## 🤝 Contributing

This is currently a private project in early development. Contributions will be welcomed once we reach beta.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📊 Performance Targets

- **Load time:** <2 seconds for 5,000 fixture project
- **Grid rendering:** 60 FPS with virtual scrolling
- **PDF generation:** <5 seconds for 50-page report
- **Sync time:** <10 seconds for typical project

---

## 📄 License

Copyright © 2025 Lytrix / Josh Karp Designs

License TBD - Currently proprietary during development.

---

## 🎯 Success Metrics

### Month 3 Target
- ✅ Core spreadsheet interface complete
- ✅ 10 beta testers
- ✅ 60 FPS performance
- ✅ Positive UX feedback

### Month 12 Target (Launch)
- 100+ paying customers
- $10k+ MRR
- NPS >50
- Public launch at USITT or LDI

---

## 📞 Contact

**Josh Karp**  
Lytrix / Josh Karp Designs  
[jkarp.com](https://jkarp.com)

---

**Built with ❤️ for the live entertainment industry**

🎭 Theater • 🎵 Concert • 📺 Broadcast • 🎬 Film/TV
