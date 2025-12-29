# ShowStack Naming Restructure - Before & After
## Quick Reference Guide

**Created:** December 29, 2025

---

## 🔄 The Change: From Single Product to Modular Family

### Before (Current)
```
ShowStack
├── ShowStack:Production (lighting-focused, but name unclear)
└── ShowStack:Manager (tour management)
```

**Problems:**
- "Production" is too vague - doesn't indicate it's lighting-specific
- Can't easily add new disciplines (sound, video)
- Confusing market positioning

---

### After (Proposed)
```
ShowStack Product Family
├── ShowStack:Lighting (formerly Production)
├── ShowStack:Sound (new)
├── ShowStack:Video (future)
├── ShowStack:Production (new scope: production managers)
├── ShowStack:Tour (formerly Manager)
└── ShowStack:Producer (future)
```

**Benefits:**
- Each module clearly indicates its discipline
- Scalable architecture for adding new modules
- Clear positioning against competitors
- Natural bundle opportunities

---

## 📊 Module Comparison Table

| Module | Target Users | Replaces/Competes With | Price | Status |
|--------|--------------|------------------------|-------|--------|
| **ShowStack:Lighting** | Lighting Designers, Electricians | LightWright 6 ($845) | $249/yr | Exists (rename from Production) |
| **ShowStack:Sound** | Sound Designers, A1s | Minotaur | $199/yr | Planned (Year 2) |
| **ShowStack:Video** | Video/Projection Designers | Nothing exists! | $199/yr | Planned (Year 3) |
| **ShowStack:Production** | Production Managers, SMs | Manual tools | $299/yr | Planned (Year 3) |
| **ShowStack:Tour** | Tour Managers | Manual tools | $399/yr | Exists (rename from Manager) |
| **ShowStack:Producer** | Producers, GMs | Tessitura (partial) | $499/yr | Planned (Year 4) |

---

## 💰 Bundle Pricing Strategy

### Designer Bundle
**Lighting + Sound + Video = $449/year** (30% savings)
- Regular price: $647/year
- **Save: $198/year**
- Perfect for: Multi-discipline designers

### Production Bundle
**Lighting + Sound + Video + Production = $599/year** (37% savings)
- Regular price: $946/year
- **Save: $347/year**
- Perfect for: Production managers overseeing all departments

### Tour Bundle
**Lighting + Sound + Video + Tour = $699/year** (33% savings)
- Regular price: $1,046/year
- **Save: $347/year**
- Perfect for: Touring productions

### Complete Bundle
**All 6 Modules = $999/year** (46% savings)
- Regular price: $1,844/year
- **Save: $845/year**
- Perfect for: Producing organizations, large institutions

---

## 🎯 Market Positioning by Module

### ShowStack:Lighting
- **Competitor:** LightWright 6 ($845 one-time)
- **Advantage:** 71% cheaper Year 1, real-time collaboration
- **Market:** 10,000+ potential users

### ShowStack:Sound
- **Competitor:** Minotaur Sound System Database
- **Advantage:** Modern UI, QLab integration, collaboration
- **Market:** 5,000+ potential users

### ShowStack:Video
- **Competitor:** None! Greenfield opportunity
- **Advantage:** First-to-market for video/projection design
- **Market:** 3,000+ potential users

### ShowStack:Production
- **Competitor:** Manual spreadsheets, generic PM tools
- **Advantage:** Entertainment-specific, integrated with design modules
- **Market:** 8,000+ potential users

### ShowStack:Tour
- **Competitor:** Manual tools, limited tour apps
- **Advantage:** Equipment manifests from design data
- **Market:** 2,000+ potential users

### ShowStack:Producer
- **Competitor:** Tessitura (expensive), QuickBooks, manual
- **Advantage:** Entertainment-specific, multi-show portfolio
- **Market:** 1,000+ potential users

---

## 🗺️ Implementation Timeline

### Year 1 (2025-2026)
- ✅ Rename **Production → Lighting**
- 🎯 Complete ShowStack:Lighting feature parity with LightWright 6
- 🎯 Begin ShowStack:Sound development (Phases 1-3)

### Year 2 (2026-2027)
- 🎯 Launch **ShowStack:Sound** (full Minotaur parity)
- 🎯 Introduce **Designer Bundle** (Lighting + Sound)
- 🎯 Begin ShowStack:Video planning

### Year 3 (2027-2028)
- 🎯 Launch **ShowStack:Video**
- 🎯 Launch **ShowStack:Production** (PM scope)
- 🎯 Rename **Manager → Tour**
- 🎯 Introduce **Complete Bundle**

### Year 4 (2028-2029)
- 🎯 Launch **ShowStack:Producer**
- 🎯 All modules in production release
- 🎯 Enterprise features (SSO, API, advanced permissions)

---

## 📈 Revenue Impact

### Year 1 (Lighting Only)
- **Users:** 1,050
- **ARR:** $193,350
- Single product

### Year 2 (Lighting + Sound)
- **Users:** 2,100+
- **ARR:** $521,500 (2.7x growth)
- Introduction of bundles

### Year 3 (All Modules)
- **Users:** 4,000+
- **ARR:** $1,377,100 (2.6x growth)
- Full product family

### Year 5 (Mature Platform)
- **Users:** 8,000+
- **ARR:** $5,000,000 (3.6x growth)
- Enterprise + institutional scale

---

## 🎓 Educational Impact

### Before (Single Product)
- Limited to lighting programs
- ~100 institutional seats potential

### After (Module Family)
- **Lighting programs:** 1,000+ schools
- **Sound programs:** 500+ schools
- **Video programs:** 300+ schools
- **Production/Theater Management:** 800+ schools
- **Complete Bundle opportunity:** 200+ major programs

**Student Pipeline Value:**
- Student on Complete Bundle ($99/year)
- → Professional on Complete Bundle ($999/year)
- **10x revenue increase at graduation**
- **Lifetime value:** $999/year × 30 years = **$29,970 per user**

---

## 🚀 Competitive Moat

### Unique Position
**ShowStack will be the ONLY platform offering:**
- Unified cross-department management
- Lighting + Sound + Video + Production + Tour + Producer
- Real-time collaboration across disciplines
- Shared equipment libraries and data
- Integrated budgeting and planning

### Competitive Barriers
- **LightWright:** Lighting only, no collaboration
- **Minotaur:** Sound only, no collaboration
- **Video tools:** Don't exist
- **PM tools:** Generic, not entertainment-specific
- **Tour tools:** Limited features
- **Producer tools:** Too expensive or too generic

**ShowStack will be the comprehensive platform for live entertainment production.**

---

## ✅ Migration Tasks: Production → Lighting

### Code Changes
- [ ] Rename repository: `showstack-production` → `showstack-lighting`
- [ ] Update package.json: `@showstack/production` → `@showstack/lighting`
- [ ] Update TypeScript types: `ProductionProject` → `LightingProject`
- [ ] Update app title and branding
- [ ] Update database documentation (no schema changes needed)

### Documentation
- [ ] Update README.md
- [ ] Update docs/technical-spec.md
- [ ] Update docs/summary.md
- [ ] Create migration announcement
- [ ] Update CONTRIBUTING.md

### Marketing
- [ ] Update website copy
- [ ] Update pricing page
- [ ] Create blog post announcement
- [ ] Email existing users (if any)
- [ ] Update social media
- [ ] Update app store listings

**Timeline:** 2-3 weeks

---

## 🎯 Decision Points

### ✅ Recommend: YES to All
1. ✅ **Rename Production → Lighting** (clarity and scalability)
2. ✅ **Build ShowStack:Sound** (clear market opportunity)
3. ✅ **Modular product family** (revenue optimization)
4. ✅ **Bundle pricing strategy** (encourage multi-module adoption)
5. ✅ **Rename Manager → Tour** (clear scope definition)
6. ✅ **Future: Video, Production, Producer modules** (complete ecosystem)

### Risks & Mitigation
**Risk:** Too many products to manage
**Mitigation:** Shared platform team, modular architecture

**Risk:** Confusing pricing
**Mitigation:** Clear bundle recommendations, pricing calculator

**Risk:** Development bandwidth
**Mitigation:** Phased rollout over 4 years, not all at once

---

## 💡 Why This Works

### 1. Market Structure Alignment
The entertainment industry is organized by discipline:
- Lighting departments hire lighting designers
- Sound departments hire sound designers
- Video departments hire projection designers
- Production departments hire production managers

**ShowStack should mirror this structure.**

### 2. Budget Alignment
Departmental budgets are separate:
- Lighting dept budget can pay for ShowStack:Lighting
- Sound dept budget can pay for ShowStack:Sound
- Much easier than getting one large budget approved

### 3. Educational Pipeline
Students specialize in disciplines:
- Lighting design majors → ShowStack:Lighting
- Sound design majors → ShowStack:Sound
- Theater management majors → ShowStack:Production

**Capture them in school, keep them for careers.**

### 4. Natural Upsell Path
Users start with one module, add more:
- Year 1: Lighting only ($249)
- Year 2: Add Sound, upgrade to Designer Bundle ($449)
- Year 3: Add Video, upgrade to Designer Bundle (still $449)
- Year 5: Become PM, upgrade to Production Bundle ($599)

**Lifetime value grows organically.**

### 5. Institutional Appeal
Universities want unified platforms:
- Teach students on the same tools they'll use professionally
- Cross-department collaboration (lighting + sound students)
- Administrative simplicity (one platform, one contract)
- **Complete Bundle is the perfect institutional offering**

---

## 🎉 Summary

**The modular product family architecture transforms ShowStack from a single-purpose tool into a comprehensive platform for live entertainment production.**

### Current State
- ShowStack:Production (unclear scope, lighting-focused)
- Limited growth potential
- Single competitor focus (LightWright)

### Proposed State
- **6 discipline-specific modules**
- **4 bundle options** with clear value propositions
- **Multiple market opportunities** (lighting, sound, video, PM, tour, producer)
- **Educational pipeline** across all disciplines
- **Unique competitive position** as unified platform

### Impact
- **10x revenue potential** (from $193k Year 1 to $5M Year 5)
- **Market leadership** in multiple niches
- **Network effects** from cross-department collaboration
- **Sustainable competitive moat**

---

**Next Step: Approve strategy and begin Production → Lighting rename immediately.**

This sets the foundation for the entire modular product family. The sooner we establish the naming structure, the easier all future development becomes.

---

**Document Version:** 1.0
**Decision Required:** YES/NO to proceed with modular architecture
