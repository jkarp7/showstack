# ShowStack Editions & Naming
## License-Based Feature Access Guide

**Created:** December 28, 2024
**Updated:** December 28, 2024

---

## 🎯 Overview

ShowStack is a **unified application** with license-based editions. Users download one app, and their license key determines which features are activated.

### The Approach: One App, Multiple Editions

```
ShowStack (Single Application)
├── License determines active features
├── Clean UI showing only licensed features
└── Seamless upgrades via license key change
```

**Benefits:**
- One download, one installation
- No confusion about which product to use
- Easy feature upgrades (just change license)
- Shared data model across all features
- Natural cross-discipline collaboration

---

## 💳 Edition Structure

### Professional Editions

| Edition | Price | Activated Features | Use Case |
|---------|-------|-------------------|----------|
| **Lighting Edition** | $249/year | Lighting design & management | LDs, Production Electricians, MEs |
| **Sound Edition** | $199/year | Sound system design & management | Sound Designers, A1s, Audio Engineers |
| **Video Edition** | $199/year | Video/projection design | Projection Designers, Video Engineers |
| **Designer Edition** | $449/year | Lighting + Sound + Video | Multi-discipline designers |
| **Production Edition** | $599/year | All design + Production mgmt + Tour | Production Managers, TDs |
| **Complete Edition** | $999/year | All features | Producing organizations, institutions |

### Educational & Institutional

| Edition | Price | Activated Features |
|---------|-------|-------------------|
| **Student Edition** | $99/year | All features (watermarked) |
| **Institutional** | Custom | Based on contract (multi-seat) |

---

## 🏗️ Feature Domains

Each feature domain corresponds to a professional discipline:

### 1. Lighting Features
**Currently Available** (formerly "Production" module)

- Fixture management (virtual spreadsheet, 10k+ rows)
- Power & dimmer rack management
- Circuit management & phase balancing
- DMX mapping and addressing
- Multi-cable tracking (Socapex, etc.)
- Vectorworks integration
- ETC Eos console integration (OSC)
- Shop orders & equipment lists
- Label designer
- Paperwork generation (12 report types)
- Infrastructure tracking
- Error checking

**Competes with:** LightWright 6 ($845)

### 2. Sound Features
**Planned** (see docs/migration-sound-features.md)

- Audio equipment management
- Wireless microphone coordination
- Frequency management & IAS import
- Audio patch management (I/O)
- Multi-pair cable tracking
- Speaker & amplifier assignment
- QLab integration
- Console integration (Yamaha, DiGiCo, A&H)
- Sound-specific paperwork
- Label printing for audio

**Competes with:** Minotaur Sound System Database

### 3. Video Features
**Future** (Year 3+)

- Projector & display management
- Media server tracking
- Video signal routing
- Resolution & throw calculations
- Playback file management

**Competes with:** No direct competitor

### 4. Production Features
**Future** (Year 3+)

- Production calendar & scheduling
- Budget tracking & forecasting
- Crew roster management
- Vendor management
- Purchase orders & invoicing

**For:** Production Managers, Stage Managers

### 5. Tour Features
**Partial** (formerly "Manager" module)

- Tour routing & logistics
- Venue database
- Equipment manifests
- Per diem calculator
- Multi-show coordination

**For:** Tour Managers, Tour Coordinators

### 6. Producer Features
**Future** (Year 4+)

- Multi-show portfolio management
- Financial consolidation
- Season planning
- Fundraising tracking

**For:** Producers, General Managers

---

## 📊 Pricing Strategy

### Individual Editions
- **Lighting:** $249/year (vs LightWright $845 one-time)
- **Sound:** $199/year
- **Video:** $199/year
- Total if purchased separately: $647/year

### Bundle Discounts
- **Designer Edition:** $449/year (saves $198/year, 31% discount)
- **Production Edition:** $599/year (includes Production + Tour features)
- **Complete Edition:** $999/year (includes all 6 feature domains)

### Volume Discounts (Institutional)
- 10-24 seats: 20% discount
- 25-49 seats: 30% discount
- 50+ seats: 40% discount
- Custom enterprise pricing available

---

## 🎨 User Experience Principles

### 1. Clean Interface (No Bloat)
✅ **DO:**
- Hide entire sections for inactive features
- Remove tabs/menus for unlicensed domains
- Show focused view for active features only

❌ **DON'T:**
- Show grayed-out/disabled features (feels crippled)
- Display "Upgrade to unlock" everywhere (annoying)
- Make features visible but non-clickable

### 2. Strategic Upgrade Prompts
Only show upgrade prompts in:
- **Settings/Account Page** - License management section
- **Project Open Warning** - If project contains data for unlicensed features
- **Collaboration** - If inviting users who need different licenses

### 3. Data Preservation
**Key Principle:** Project files contain ALL data for ALL domains, but UI only shows data for activated features.

**Example:**
- User has Lighting Edition
- Opens project with lighting + sound data
- **Sees:** Fixtures, power, circuits (lighting features)
- **Doesn't see:** Sound equipment, mics (sound features hidden)
- **Data preserved:** Sound data remains in file
- **Upgrade path:** If user upgrades to Designer Edition, sound data becomes visible

---

## 🗺️ Implementation Timeline

### Year 1 (2025-2026) - Current
- ✅ Complete Lighting Edition feature parity with LightWright 6
- ✅ Implement license-based feature flags
- 🎯 Launch Lighting Edition to market

### Year 2 (2026-2027)
- 🎯 Build Sound Edition (Minotaur parity)
- 🎯 Launch Designer Bundle (Lighting + Sound)
- 🎯 Begin Video Edition planning

### Year 3 (2027-2028)
- 🎯 Launch Video Edition
- 🎯 Launch Production features
- 🎯 Complete Tour features
- 🎯 Launch Production Edition bundle

### Year 4 (2028-2029)
- 🎯 Launch Producer features
- 🎯 Launch Complete Edition
- 🎯 Enterprise features (SSO, API, advanced permissions)

---

## 📈 Market Positioning

### Competitive Advantages

**vs. LightWright 6:**
- 71% cheaper first year ($249 vs $845)
- Real-time collaboration
- Cross-platform (Mac, Windows, Web)
- Modern UI/UX
- Active development

**vs. Minotaur:**
- Modern UI (Minotaur is dated)
- QLab integration
- Cross-discipline integration (use with lighting)
- Collaboration features

**vs. Existing Video Tools:**
- First-to-market for projection design
- Integrated with lighting/sound

**Unique Position:**
- ONLY platform offering unified lighting + sound + video + production
- Shared equipment libraries across departments
- Cross-discipline collaboration
- Comprehensive solution for entire production team

---

## 🎓 Educational Pipeline

### Student Edition Benefits
- **Price:** $99/year (all features)
- **Value:** Learn on professional tools
- **Pipeline:** Students become paying professionals
- **Lifetime Value:** $99/year → $999/year = 10x increase at graduation

### Institutional Adoption
- Universities teach all disciplines
- Complete Edition perfect for institutions
- Students trained on tools they'll use professionally
- Administrative simplicity (one platform, one contract)

**Target Institutions:**
- 1,000+ theater programs (lighting)
- 500+ sound design programs
- 300+ projection design programs
- 800+ production management programs

---

## 💡 Naming Conventions

### In the App
- **Application Name:** ShowStack
- **Main Sections:** Lighting, Sound, Video, Production, Tour, Producer
- **License Display:** "ShowStack Designer Edition" or "ShowStack Complete Edition"

### In Marketing
- **Product:** ShowStack
- **Editions:** "Lighting Edition", "Designer Edition", "Complete Edition"
- **Tagline:** "Unified platform for live entertainment production"

### In Documentation
- **Feature Domains:** Lighting features, Sound features, Video features
- **License Tiers:** Professional, Student, Institutional
- **Editions:** Refer to specific combinations of activated features

---

## ✅ Migration from Old Naming

### Old Structure (Obsolete)
```
ShowStack:Production (separate app, lighting-focused)
ShowStack:Manager (separate app, tour logistics)
```

**Problems:**
- "Production" too vague
- Separate apps caused confusion
- Limited scalability

### New Structure (Current)
```
ShowStack (unified app)
├── Lighting features (formerly "Production")
├── Sound features (new)
├── Video features (future)
├── Production features (future, new scope)
├── Tour features (formerly "Manager")
└── Producer features (future)
```

**Benefits:**
- Clear feature domains
- Single app experience
- License-based activation
- Seamless upgrades

---

## 🔄 Technical Implementation

See **docs/migration-unified-licensing.md** for detailed technical implementation guide including:
- Feature flag system architecture
- React hooks for feature gates
- Component-level access control
- Database schema considerations
- UI/UX patterns
- Testing strategies

---

## 📊 Success Metrics

### User Adoption
- Year 1: 1,000+ Lighting Edition users
- Year 2: 2,000+ users (50% bundles)
- Year 5: 8,000+ users across all editions

### Revenue Targets
- Year 1: $193k ARR (Lighting only)
- Year 2: $521k ARR (+ Sound)
- Year 5: $5M ARR (all features)

### Feature Usage
- Track which features drive upgrades
- Monitor bundle vs individual adoption
- Measure cross-discipline collaboration

---

## 🎯 Summary

**ShowStack is a unified application with license-based editions that provide feature access based on professional discipline needs.**

### Key Principles
1. **One App** - Single download, single codebase
2. **License Activation** - Features unlocked via license key
3. **Clean UX** - Only show licensed features
4. **Data Preservation** - All data saved, visible features depend on license
5. **Natural Upgrades** - Easy to add features via license change

### Strategic Value
- **Market Coverage** - Serve 6 professional disciplines
- **Revenue Growth** - Bundle pricing encourages multi-feature adoption
- **Competitive Moat** - Only unified platform for entertainment production
- **Educational Pipeline** - Capture students, keep them as professionals

---

**Next Steps:**
1. Complete Lighting Edition feature development
2. Implement license-based feature flag system
3. Launch to market with clear edition messaging
4. Begin Sound Edition development (Year 2)

---

**See Also:**
- `docs/migration-unified-licensing.md` - Technical implementation guide
- `docs/migration-sound-features.md` - Sound feature specifications
- `PROJECT_STATUS.md` - Current development status
- `docs/unified-vs-modular-analysis.md` - Architecture decision rationale
