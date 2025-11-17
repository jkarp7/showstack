# ShowStack

**Modern production management software for live entertainment**

ShowStack is a comprehensive suite of tools designed for lighting designers, production electricians, and entertainment professionals. This repository contains the ShowStack:Production module - a modern alternative to LightWright 6.

---

## 🎯 Project Overview

**ShowStack:Production** is a desktop application (Electron) for managing lighting plots, power distribution, and production paperwork. It provides:

- ✅ Virtual spreadsheet interface handling 10,000+ fixtures
- ✅ Real-time collaboration (optional cloud sync)
- ✅ ETC Eos console integration (OSC)
- ✅ Vectorworks import/export with reconciliation
- ✅ Professional label printing (Dymo, Brother, Zebra)
- ✅ Power & DMX management with error checking
- ✅ Custom paperwork generation with branding

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

## 📊 Status

**Current Phase:** Pre-Alpha  
**POC Status:** ✅ Complete (virtual grid validated)  
**Phase 1 Status:** 🚧 In Development

### Completed
- ✅ Technical specification
- ✅ Pricing strategy
- ✅ Proof-of-concept (virtual data grid)
- ✅ Database schema design
- ✅ Architecture decisions

### In Progress
- 🚧 Electron app setup
- 🚧 Database layer (SQLite)
- 🚧 Core CRUD operations

### Planned
- ⬜ Sorting & filtering
- ⬜ Power management
- ⬜ Eos integration
- ⬜ Vectorworks sync
- ⬜ Label designer
- ⬜ Report generation

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
- **Framework:** Electron 27+
- **Database:** better-sqlite3 (local)
- **Hardware:** electron-printer, osc-js

### Frontend (React)
- **Framework:** React 18+
- **Language:** TypeScript 5+
- **State:** Zustand
- **UI:** Tailwind CSS + Radix UI
- **Build:** Vite

### Backend (Optional Cloud Sync)
- **API:** Express.js + PostgreSQL
- **Auth:** JWT
- **Realtime:** Socket.io
- **Storage:** AWS S3 / Cloudflare R2

---

## 📖 Documentation

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
