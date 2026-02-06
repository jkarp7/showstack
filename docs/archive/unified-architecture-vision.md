# ShowStack Project Status

## Unified Production Management Platform

**Last Updated:** December 29, 2025
**Current Phase:** Strategic Architecture Definition
**Architecture:** Unified Application with Edition-Based Licensing

---

## 🎯 Project Vision

**ShowStack** is a comprehensive production management platform for live entertainment, unifying lighting, sound, video, production management, tour logistics, and producer oversight in a single collaborative application.

### Core Philosophy

- **One Application** - Unified codebase with role-based views
- **Multiple Editions** - Feature access controlled by licensing
- **Single Source of Truth** - All departments share the same project data
- **Real-time Collaboration** - Multi-user, cross-department workflows
- **Discipline-Specific Views** - Clean interfaces tailored to each role

---

## 📦 Product Architecture

### Unified Application: ShowStack

**Single codebase with six feature domains:**

```
ShowStack
├── Lighting Features
│   ├── Fixture management & spreadsheet
│   ├── Dimmer & power distribution
│   ├── DMX mapping & addressing
│   ├── Circuit management
│   ├── Multi-cable tracking (Socapex)
│   ├── Vectorworks integration
│   ├── ETC Eos console integration
│   ├── Label designer & printing
│   └── Lighting-specific paperwork
│
├── Sound Features
│   ├── Sound equipment management
│   ├── Multi-pair cable tracking (snakes)
│   ├── Wireless microphone coordination
│   ├── Frequency management & IAS import
│   ├── Audio patch management
│   ├── Speaker & amplifier assignment
│   ├── QLab integration
│   └── Sound-specific paperwork
│
├── Video Features
│   ├── Projector & display management
│   ├── Screen positions & rigging
│   ├── Media server tracking
│   ├── Video signal routing
│   ├── Playback file management
│   ├── Timecode & sync
│   └── Video-specific paperwork
│
├── Production Management Features
│   ├── Master schedule & timeline
│   ├── Budget tracking (aggregated)
│   ├── Personnel management
│   ├── Venue information
│   ├── Rehearsal schedules
│   ├── Contact database
│   ├── Task management
│   └── Document library
│
├── Tour Management Features
│   ├── Tour routing & advance planning
│   ├── Venue database
│   ├── Travel logistics
│   ├── Per diem & expenses
│   ├── Equipment manifests
│   ├── Load-in/out schedules
│   ├── Truck packing
│   └── Settlement tracking
│
└── Producer Features
    ├── Multi-show portfolio management
    ├── Budget aggregation & reporting
    ├── Contract management
    ├── Royalty tracking
    ├── Box office integration
    ├── Revenue projections
    ├── Vendor management
    └── Board reporting
```

---

## 💰 Edition-Based Pricing

### Professional Editions (Annual Pricing)

| Edition                | Price     | Activated Features        | Target Users                     |
| ---------------------- | --------- | ------------------------- | -------------------------------- |
| **Lighting Edition**   | $249/year | Lighting only             | Lighting Designers, Electricians |
| **Sound Edition**      | $199/year | Sound only                | Sound Designers, A1s             |
| **Video Edition**      | $199/year | Video only                | Video/Projection Designers       |
| **Designer Edition**   | $449/year | Lighting + Sound + Video  | Multi-discipline Designers       |
| **Production Edition** | $599/year | L+S+V + Production + Tour | Production Managers, TDs         |
| **Complete Edition**   | $999/year | All features              | Organizations, Producers         |

### Student & Institutional Pricing

| Edition                        | Price    | Notes                                       |
| ------------------------------ | -------- | ------------------------------------------- |
| **Student Edition**            | $99/year | All features, student verification required |
| **Institutional Site License** | Custom   | Per-seat pricing, volume discounts          |

---

## 🏗️ Technical Architecture

### Core Platform

- **Framework:** Electron (desktop app: Mac, Windows, Linux)
- **Frontend:** React 18+ with TypeScript 5+
- **State Management:** Zustand
- **UI Framework:** Tailwind CSS + Radix UI
- **Database:** SQLite (local) + PostgreSQL (optional cloud sync)
- **Build Tool:** Vite

### Feature Flag System

- License-based feature activation
- Role-based UI visibility
- Clean, focused interfaces per edition
- Seamless upgrade path (license key change)

### Data Architecture

- **Unified project file format** (.showstack)
- All feature domains share same database
- Cross-department data automatically synchronized
- Real-time collaboration via optional cloud sync

### Integration Points

- **Vectorworks:** LIR import/export, reconciliation
- **ETC Eos:** OSC protocol, patch export, live control
- **QLab:** Cue import, output assignment
- **Audio Consoles:** Yamaha, DiGiCo, Allen & Heath patch import
- **IAS:** Wireless frequency import
- **Label Printers:** Dymo, Brother, Zebra

---

## 📊 Current Status by Feature Domain

### ✅ Lighting Features

**Status:** Foundation Complete (Proof-of-Concept)

**Completed:**

- ✅ Virtual data grid (10,000+ fixture performance)
- ✅ Basic fixture types and properties
- ✅ In-cell editing with Tab/Enter navigation
- ✅ Multi-select functionality
- ✅ Zustand state management
- ✅ TypeScript type definitions

**In Progress:**

- 🚧 SQLite database integration
- 🚧 Power & dimmer management
- 🚧 Circuit tracking
- 🚧 Multi-cable (Socapex) management

**Planned (Phase 1-2):**

- ⬜ Vectorworks integration
- ⬜ ETC Eos integration
- ⬜ Label designer & printing
- ⬜ Error checking system
- ⬜ Custom paperwork generation

---

### 🎵 Sound Features

**Status:** Planned (Year 2 Development)

**Scope:** Full Minotaur Sound System Database parity

**Key Features to Implement:**

- ⬜ Sound equipment database & management
- ⬜ Multi-pair cable tracking (snakes, fiber, Cat6)
- ⬜ Pin-to-pin cable assignment interface
- ⬜ Wireless microphone coordination system
- ⬜ Frequency management & conflict detection
- ⬜ IAS frequency import
- ⬜ Audio patch management (inputs/outputs)
- ⬜ Speaker & amplifier assignment
- ⬜ Audio power distribution
- ⬜ QLab integration
- ⬜ Console integration (Yamaha, DiGiCo, A&H)
- ⬜ Sound-specific paperwork templates

**Competitive Target:** Minotaur Sound System Database

**Development Timeline:** 16 months (9 phases)

- See `docs/minotaur-parity-analysis.md` for detailed roadmap

---

### 📺 Video Features

**Status:** Planned (Year 3 Development)

**Market Opportunity:** Greenfield (no existing competitor)

**Key Features to Implement:**

- ⬜ Projector & display management
- ⬜ Screen positions & rigging calculations
- ⬜ Throw distance & resolution calculations
- ⬜ Media server tracking (Disguise, Watchout, QLab Video)
- ⬜ Video signal routing (SDI, HDMI, NDI, etc.)
- ⬜ Playback file management
- ⬜ Content resolution & format tracking
- ⬜ Timecode & sync
- ⬜ Camera tracking
- ⬜ Live feed management
- ⬜ Video-specific paperwork

**Target Users:** Video/Projection Designers, Media Server Programmers

---

### 📋 Production Management Features

**Status:** Planned (Year 3 Development)

**Scope:** Unified oversight of all departments

**Key Features to Implement:**

- ⬜ Master schedule & timeline management
- ⬜ Budget tracking (aggregated from all departments)
- ⬜ Personnel & crew management
- ⬜ Venue information & load-in plans
- ⬜ Rehearsal & performance schedules
- ⬜ Contact database
- ⬜ Task management & checklists
- ⬜ Notes & communication
- ⬜ Document library
- ⬜ Travel & housing coordination
- ⬜ Union paperwork tracking
- ⬜ Safety & risk management

**Target Users:** Production Managers, Technical Directors, Stage Managers

---

### 🚌 Tour Management Features

**Status:** Planned (Year 3 Development)

**Scope:** Touring logistics and coordination

**Key Features to Implement:**

- ⬜ Tour routing & advance planning
- ⬜ Venue database & specifications
- ⬜ Travel logistics (buses, flights, hotels)
- ⬜ Per diem & expense tracking
- ⬜ Equipment manifests (from lighting/sound/video data)
- ⬜ Load-in/load-out schedules
- ⬜ Truck packing & shipping
- ⬜ Carnet & customs documentation
- ⬜ Tour budget management
- ⬜ Day sheets & call times
- ⬜ Hospitality & catering riders
- ⬜ Settlement tracking

**Target Users:** Tour Managers, Production Coordinators, Road Chiefs

---

### 🎭 Producer Features

**Status:** Planned (Year 4 Development)

**Scope:** Multi-show portfolio management

**Key Features to Implement:**

- ⬜ Multi-show portfolio overview
- ⬜ Budget aggregation & financial reporting
- ⬜ Contract management
- ⬜ Royalty tracking
- ⬜ Box office integration
- ⬜ Revenue projections vs actuals
- ⬜ Vendor management & payments
- ⬜ Insurance tracking
- ⬜ Rights & licensing
- ⬜ Union agreements
- ⬜ Season planning
- ⬜ Board reporting & analytics

**Target Users:** Producers, General Managers, Executive Producers

---

## 🗺️ Development Roadmap

### Year 1: Foundation (2025-2026)

**Goal:** Launch ShowStack: Lighting Edition

**Q1-Q2:**

- ✅ Strategic architecture defined (unified app with editions)
- ✅ Proof-of-concept validated (virtual data grid)
- 🎯 Electron app shell setup
- 🎯 SQLite database integration
- 🎯 Complete fixture management
- 🎯 Sorting, filtering, search
- 🎯 Smart incrementing & auto-complete
- 🎯 Undo/redo system

**Q3-Q4:**

- 🎯 Power & dimmer management
- 🎯 Circuit tracking & phase balancing
- 🎯 DMX mapping
- 🎯 Multi-cable (Socapex) tracking
- 🎯 Error checking system
- 🎯 Basic paperwork generation
- 🎯 CSV import/export

**Launch:** ShowStack: Lighting Edition ($249/year)
**Target:** 600 paying users, $149k ARR

---

### Year 2: Sound Expansion (2026-2027)

**Goal:** Add sound features, launch Designer Edition

**Q1-Q2:**

- 🎯 Sound equipment database
- 🎯 Multi-pair cable management
- 🎯 Pin-to-pin assignment interface
- 🎯 Wireless microphone coordination
- 🎯 Frequency management & IAS import
- 🎯 Conflict detection algorithm

**Q3-Q4:**

- 🎯 Audio patch management
- 🎯 Speaker & amplifier assignment
- 🎯 Audio power distribution
- 🎯 Sound-specific paperwork
- 🎯 QLab integration (basic)
- 🎯 Label designer enhancements

**Launch:**

- ShowStack: Sound Edition ($199/year)
- ShowStack: Designer Edition ($449/year - L+S)

**Target:** 1,700 total users, $522k ARR

---

### Year 3: Multi-Discipline Platform (2027-2028)

**Goal:** Add Video, Production, Tour features

**Q1-Q2:**

- 🎯 Video equipment management
- 🎯 Projector calculations
- 🎯 Media server tracking
- 🎯 Video signal routing
- 🎯 Production management foundation
- 🎯 Master schedule & timeline

**Q3-Q4:**

- 🎯 Budget aggregation system
- 🎯 Personnel management
- 🎯 Tour routing & logistics
- 🎯 Equipment manifests (integrated)
- 🎯 Venue database
- 🎯 Advanced paperwork system

**Launch:**

- ShowStack: Video Edition ($199/year)
- ShowStack: Production Edition ($599/year)
- ShowStack: Complete Edition ($999/year)

**Target:** 3,000+ users, $1.77M ARR

---

### Year 4: Producer & Enterprise (2028-2029)

**Goal:** Complete feature set, enterprise capabilities

**Q1-Q2:**

- 🎯 Multi-show portfolio management
- 🎯 Financial reporting & analytics
- 🎯 Contract management
- 🎯 Box office integration
- 🎯 Enterprise SSO & permissions

**Q3-Q4:**

- 🎯 API for third-party integrations
- 🎯 Advanced collaboration features
- 🎯 Mobile companion apps
- 🎯 Institutional admin dashboards
- 🎯 Usage analytics

**Launch:** ShowStack: Producer Edition ($499/year)

**Target:** 6,000+ users, $3.5M ARR

---

## 🎯 Competitive Positioning

### Direct Competitors by Feature Domain

| ShowStack Edition      | Primary Competitor | Competitor Price | ShowStack Advantage                         |
| ---------------------- | ------------------ | ---------------- | ------------------------------------------- |
| **Lighting Edition**   | LightWright 6      | $845 one-time    | 71% cheaper Year 1, real-time collaboration |
| **Sound Edition**      | Minotaur           | Not public       | Modern UI, QLab integration, cloud sync     |
| **Video Edition**      | None (greenfield!) | N/A              | First-to-market, no competition             |
| **Production Edition** | Manual tools/Excel | Free-$500/year   | Entertainment-specific, integrated data     |
| **Complete Edition**   | None               | N/A              | Only comprehensive platform                 |

### Unique Competitive Moat

**ShowStack is the ONLY platform offering:**

- ✅ Unified cross-department management
- ✅ Real-time collaboration across disciplines
- ✅ Single source of truth for production data
- ✅ Integrated budgets and schedules
- ✅ Seamless data flow between departments
- ✅ Role-based views with unified backend

**No competitor offers this breadth or integration level.**

---

## 📈 Success Metrics

### Year 1 Targets (Lighting Edition)

- 600 professional users
- 400 student users
- 50 institutional seats
- **$193k ARR**
- 60% annual retention
- NPS >50

### Year 2 Targets (+ Sound, Designer Edition)

- 1,700 total users
- 500+ on Designer Edition (bundle)
- **$522k ARR** (2.7x growth)
- 65% retention
- NPS >50

### Year 3 Targets (All Editions)

- 3,000+ total users
- 800+ on Designer Edition
- 400+ on Production Edition
- **$1.77M ARR** (3.4x growth)
- 70% retention
- 50+ institutional sites
- NPS >50

### Year 5 Targets (Mature Platform)

- 8,000+ users
- 200+ institutional sites
- **$5M+ ARR**
- 75% retention
- Market leadership in multiple niches

---

## 🏢 Team & Organization

### Current Team

- **Phase:** Pre-Alpha / Strategic Planning
- **Team Size:** Founder + AI development assistance

### Planned Team Structure (Year 2-3)

**Engineering:**

- 3-4 Core Platform Engineers
- 2-3 Lighting Feature Engineers
- 2-3 Sound Feature Engineers
- 2 Video Feature Engineers
- 2 Production/Tour/Producer Engineers
- 1-2 Infrastructure Engineers

**Product & Design:**

- 1 Product Manager
- 1-2 UX/UI Designers

**Support & Success:**

- 2-3 Support Specialists (discipline-specific)
- 1 Customer Success Manager (institutions)
- 1 Community Manager

**Total:** 15-20 people by Year 3

---

## 🎓 Go-to-Market Strategy

### Target Markets

**Professional Market:**

- Lighting designers (10,000+ potential users)
- Sound designers (5,000+ potential users)
- Video/projection designers (3,000+ potential users)
- Production managers (8,000+ potential users)
- Tour managers (2,000+ potential users)
- Producers (1,000+ potential users)

**Educational Market:**

- University theater programs (1,000+ schools)
- High school theater programs (5,000+ schools)
- Trade schools and conservatories
- Workshop and certificate programs

**Institutional Market:**

- Regional theaters
- Touring productions
- Corporate event companies
- Broadcast and film production

### Marketing Channels

**Industry Events:**

- USITT (United States Institute for Theatre Technology)
- LDI (Live Design International)
- InfoComm
- NAB Show

**Communities:**

- Association of Sound Designers (ASD)
- Vectorworks user community
- ETC user community
- QLab user community
- Facebook groups (lighting, sound, video design)

**Content Marketing:**

- Tutorial videos
- Workflow case studies
- Blog posts on production workflows
- Webinars and workshops

---

## 📚 Documentation

### Strategic Documents

- ✅ `docs/unified-vs-modular-analysis.md` - Architecture decision rationale
- ✅ `docs/product-family-architecture.md` - Original modular proposal
- ✅ `docs/naming-restructure-summary.md` - Naming strategy evolution
- ✅ `docs/minotaur-parity-analysis.md` - Sound feature requirements

### Technical Documents

- ✅ `docs/technical-spec.md` - Original technical specification
- ✅ `docs/pricing.md` - Pricing strategy and analysis
- ✅ `docs/dev-setup.md` - Development environment setup
- ✅ `docs/summary.md` - Development package summary

### Migration Documents

- 🎯 `docs/migration-sound-features.md` - Sound edition implementation guide
- 🎯 `docs/migration-unified-licensing.md` - License-based feature flag implementation

---

## 🔄 Recent Strategic Decisions

### December 29, 2025: Unified Architecture Approved

**Decision:** Build unified application with edition-based licensing instead of separate modular applications.

**Rationale:**

- Production workflows require integration, not fragmentation
- Single source of truth eliminates data sync issues
- Unique competitive position (only comprehensive platform)
- Better for real-time collaboration
- Simpler development (one codebase vs six)
- Higher revenue potential ($1.77M vs $1.38M by Year 3)

**Impact:**

- All features developed in single ShowStack application
- Feature flags control edition access
- Unified project file format
- Role-based UI views
- Seamless upgrade path between editions

**See:** `docs/unified-vs-modular-analysis.md` for full analysis

---

## 🚀 Next Actions

### Immediate (This Week)

- ✅ Finalize unified architecture strategy
- ✅ Document Minotaur parity requirements
- 🎯 Create migration documents
- 🎯 Update technical specification
- 🎯 Begin Electron app setup

### Next Month

- 🎯 Complete lighting feature parity with LightWright 6
- 🎯 Implement SQLite database layer
- 🎯 Build feature flag system
- 🎯 Create edition-based licensing mechanism
- 🎯 Recruit beta testers (lighting designers)

### Next Quarter

- 🎯 Launch ShowStack: Lighting Edition beta
- 🎯 Begin sound feature development
- 🎯 Build marketing website
- 🎯 Develop pricing calculator
- 🎯 Create demo videos and tutorials

---

## 📞 Contact & Resources

**Project Lead:** Josh Karp / Lytrix
**Website:** [jkarp.com](https://jkarp.com)
**Repository:** github.com/jkarp7/showstack

**Industry Partnerships:**

- USITT (United States Institute for Theatre Technology)
- Association of Sound Designers
- Entertainment Technology organizations

---

## 📊 Risk Assessment & Mitigation

### Technical Risks

**Risk:** Feature flag complexity creates bugs
**Mitigation:** Comprehensive testing per edition, automated QA

**Risk:** Database schema changes affect multiple features
**Mitigation:** Migration scripts, version control, backwards compatibility

**Risk:** Performance degradation with all features active
**Mitigation:** Lazy loading, code splitting, performance monitoring

### Market Risks

**Risk:** Specialists resist "all-in-one" tool perception
**Mitigation:** Edition-specific marketing, clean focused interfaces

**Risk:** Higher price point vs single-discipline tools
**Mitigation:** Emphasize integration value, offer flexible pricing tiers

**Risk:** Incumbent competitors improve collaboration features
**Mitigation:** First-mover advantage, continuous innovation, network effects

### Business Risks

**Risk:** Development timeline extends beyond projections
**Mitigation:** Phased rollout, ship Lighting Edition first, iterate

**Risk:** Customer acquisition costs too high
**Mitigation:** Educational pipeline, word-of-mouth, community building

**Risk:** Support complexity across all disciplines
**Mitigation:** Discipline-specific support specialists, comprehensive docs

---

## ✅ Current Phase Summary

**Status:** Strategic Architecture Complete
**Next Milestone:** Lighting Edition Beta Launch (Q3 2026)
**Confidence Level:** High

**Key Achievements:**

- ✅ Validated unified app architecture
- ✅ Completed Minotaur parity analysis
- ✅ Defined edition-based pricing strategy
- ✅ Proof-of-concept demonstrates technical feasibility
- ✅ Clear 4-year roadmap

**Ready to Begin:** Full development of ShowStack: Lighting Edition

---

**Last Updated:** December 29, 2025
**Next Review:** Q1 2026 (after Lighting Edition foundation complete)
