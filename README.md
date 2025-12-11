# ShowStack

**Modern production management software for live entertainment**

ShowStack is a comprehensive desktop application suite designed for lighting designers, production electricians, and entertainment professionals. Built with modern technologies, it offers an offline-first alternative to legacy tools like LightWright 6.

---

## 🎯 Project Overview

ShowStack is a modular Electron application providing specialized tools for production management:

- **ShowStack:Production** - Complete lighting production suite including fixture management, shop orders, and paperwork (LightWright alternative)
- **ShowStack:Manager** - Production logistics and budgeting (planned)

### Key Features

- ✅ **Offline-First Architecture** - All data stored locally in SQLite
- ✅ **Module-Based Licensing** - Pay only for what you need
- ✅ **Professional Output** - Print-ready PDFs with custom branding
- ✅ **Modern UX** - Clean interface with full light/dark mode
- ✅ **Cross-Platform** - Windows, macOS, and Linux support

---

## 📁 Repository Structure

```
showstack/
├── docs/                        # Documentation (organized by category)
│   ├── business/               # Business docs (pricing, technical spec)
│   ├── development/            # Developer guides and architecture
│   ├── user/                   # User-facing documentation
│   ├── releases/               # Release process guides
│   ├── planning/               # Future feature plans
│   └── archive/                # Historical implementation docs
│
├── src/
│   ├── main/                   # Electron main process
│   │   ├── database/          # SQLite schema and queries
│   │   ├── ipc/               # IPC handlers for renderer communication
│   │   └── services/          # Business logic services
│   ├── renderer/              # React frontend application
│   │   └── src/
│   │       ├── components/    # UI components (65+)
│   │       ├── pages/         # Page-level components
│   │       ├── store/         # Zustand state management
│   │       ├── hooks/         # Custom React hooks
│   │       └── types/         # TypeScript definitions
│   ├── preload/               # Secure IPC bridge
│   └── shared/                # Shared types (main + renderer)
│
├── resources/                  # App icons and assets
├── .github/workflows/         # CI/CD automation
├── package.json
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

The application will launch as an Electron desktop app.

### Building for Distribution

```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist:mac     # macOS .dmg
npm run dist:win     # Windows installer
npm run dist:linux   # Linux AppImage
```

See [docs/releases/](docs/releases/) for detailed release guides.

---

## 📊 Development Status

**Current Phase:** Alpha
**Version:** 0.1.0-alpha

| Module | Status | Completion |
|--------|--------|------------|
| ShowStack:Production | 🚧 In Progress | 60% |
| Core Infrastructure | ✅ Complete | 100% |
| ShowStack:Manager | ⬜ Planned | 0% |

---

## ✅ ShowStack:Production Module

### Completed Features

#### Shop Order Tool
- ✅ Equipment management with section-based organization
- ✅ Multi-discipline support (lighting, audio, video, rigging, scenic, props)
- ✅ Revision tracking (up to 5 revisions with change detection)
- ✅ 3-tier notes system (general conditions, notes, fixture notes)
- ✅ Drag-and-drop print builder with 11 customizable section types
- ✅ Logo integration and professional PDF export
- ✅ Contact and venue management with scheduling
- ✅ Template system for page layouts
- ✅ File import/export (.showstack files)

### In Development

#### Fixture Management (Equipment Manager)
- 🚧 Fixture database with 50+ columns (LightWright parity)
- 🚧 Virtual data grid for 10,000+ fixtures
- 🚧 Power management and circuit tracking
- ⬜ DMX conflict detection (planned)
- ⬜ Auto-complete for manufacturer, type, color, gobo (planned)
- ⬜ Undo/redo system (planned)

### Planned Features

#### Label Designer
- ⬜ Drag-and-drop label layout
- ⬜ Multiple label sizes (Dymo, Brother, Zebra)
- ⬜ Barcode/QR code support

#### Paperwork Generator
- ⬜ Custom report templates
- ⬜ Magic sheets, channel hookups
- ⬜ Instrument and dimmer schedules

#### Advanced Integrations
- ⬜ Vectorworks import/export with reconciliation
- ⬜ ETC Eos console integration via OSC
- ⬜ CSV import/export

---

## ✅ Core Infrastructure

### Licensing System
- ✅ Offline-first validation (14-day grace period)
- ✅ Module-based access control
- ✅ Tier-based features (Professional, Student, Institutional)
- ✅ Background verification
- ✅ Visual status banners
- ✅ Graceful degradation (read-only on expiration)

### Settings & User Profile
- ✅ 7 settings sections with full persistence
- ✅ User profile management with photo upload
- ✅ Workspace preferences (theme, density, units)
- ✅ Editor settings (auto-save, undo limits)
- ✅ Project defaults and management
- ✅ Print settings configuration
- ✅ Advanced settings (developer mode toggle)

### Admin Panel
- ✅ Password-protected access (Cmd/Ctrl+Shift+A)
- ✅ License management interface
- ✅ Page layout template import/export
- ✅ Factory reset for templates
- ✅ System diagnostics

### Theme System
- ✅ Full light/dark mode support
- ✅ Dynamic theme switching
- ✅ Persistent state across sessions

### File Operations
- ✅ Import/export projects as .showstack files
- ✅ Recent files tracking
- ✅ Auto-save functionality

---

## ⬜ ShowStack:Manager Module (Planned)

- ⬜ Tour logistics tracking
- ⬜ Budget management
- ⬜ Per diem calculation
- ⬜ Multi-show coordination

---

## 💰 Competitive Positioning

**vs LightWright 6:**

| Feature | LightWright 6 | ShowStack:Production |
|---------|---------------|----------------------|
| Price | $845 one-time | $249/year |
| Updates | $625 every 3-5 years | Continuous (included) |
| Shop Orders | Basic | ✅ Advanced with print builder |
| Fixture Management | ✅ | 🚧 In development |
| Offline Mode | ✅ | ✅ 14-day grace period |
| Modern UI | ❌ (1990s) | ✅ (2025) |
| Multi-Module | ❌ | ✅ Production, Manager |
| Dark Mode | ❌ | ✅ Full support |

**Cost Comparison:**
- **Year 1:** 71% cheaper ($249 vs $845)
- **3 Years:** 49% cheaper ($747 vs $1,470)

See [docs/business/pricing.md](docs/business/pricing.md) for detailed market analysis.

---

## 🛠️ Technology Stack

### Desktop Application
- **Electron** 39.2 - Cross-platform desktop framework
- **Node.js** 20+ - Runtime environment
- **TypeScript** 5.9 - Type-safe development
- **Vite** 7.2 - Fast build tool
- **Electron Builder** 26.0 - Application packaging

### Frontend
- **React** 19.2 - UI framework with concurrent features
- **Zustand** 5.0 - Lightweight state management
- **Tailwind CSS** 3.4 - Utility-first styling
- **Lucide React** - Icon library
- **React Router** 6.28 - Client-side routing

### Data Layer
- **sql.js** 1.10 - SQLite compiled to WebAssembly
- **Two-database architecture:**
  - App DB: Licenses, settings, templates (never exported)
  - Project DB: All project data (exportable)

### Security
- **bcryptjs** - Password hashing for admin panel
- **contextBridge** - Secure IPC without nodeIntegration
- **uuid** - Unique identifier generation

---

## 📖 Documentation

### For Developers
- **[Development Setup](docs/development/dev-setup.md)** - Environment setup and build process
- **[Architecture Guide](docs/development/ARCHITECTURE.md)** - Frontend architecture and patterns
- **[Claude Code Quickstart](docs/development/CLAUDE_CODE_QUICKSTART.md)** - Development with Claude Code

### For Users
- **[Admin Panel User Guide](docs/user/ADMIN_PANEL_USER_GUIDE.md)** - Admin panel features
- **[Licensing System](docs/user/LICENSING_SYSTEM_README.md)** - License management

### Business & Planning
- **[Technical Specification](docs/business/technical-spec.md)** - Complete feature specifications
- **[Pricing Strategy](docs/business/pricing.md)** - Market analysis and revenue model
- **[Project Status](PROJECT_STATUS.md)** - Complete feature tracking and roadmap
- **[Future Plans](docs/planning/)** - Upcoming feature implementations

### Releases
- **[Release Setup](docs/releases/ALPHA_BETA_RELEASE_SETUP.md)** - Overview of release process
- **[Alpha Release Guide](docs/releases/alpha-release-guide.md)** - Manual release process
- **[Beta Release Guide](docs/releases/beta-release-guide.md)** - Automated releases with GitHub Actions

---

## 🤝 Contributing

ShowStack is in active development. See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and coding standards.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes with tests
4. Submit a pull request to `develop`

---

## 📄 License

Copyright © 2025 Lytrix
License TBD - Currently proprietary during development.

---

## 📞 Contact

**Josh Karp**
Lytrix
[jkarp.com](https://jkarp.com)

---

**Built with ❤️ for the live entertainment industry**

🎭 Theater • 🎵 Concert • 📺 Broadcast • 🎬 Film/TV
