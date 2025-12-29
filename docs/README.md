# ShowStack Documentation

Welcome to the ShowStack documentation! This directory contains all project documentation organized by category.

**Last Updated:** December 28, 2024

---

## 📁 Documentation Structure

### `/architecture` - System Architecture & Strategy
Strategic architecture decisions and implementation guides for the unified application.

- **`migration-unified-licensing.md`** - Technical guide for implementing license-based feature access
- **`naming-and-editions.md`** - Edition structure, pricing, and naming conventions

### `/features` - Feature Specifications
Detailed specifications and analysis for specific features and integrations.

- **`migration-sound-features.md`** - Complete specification for Sound Edition features
- **`minotaur-parity-analysis.md`** - Analysis of Minotaur competitor for sound features

### `/business` - Business Documentation
Business plans, pricing strategy, and technical specifications.

- **`pricing.md`** - Pricing strategy and edition tiers
- **`summary.md`** - Business overview and market positioning
- **`technical-spec.md`** - Technical specifications for stakeholders

### `/development` - Developer Guides
Documentation for developers working on ShowStack.

- **`ARCHITECTURE.md`** - System architecture overview
- **`CLAUDE_CODE_QUICKSTART.md`** - Quick start guide for Claude Code
- **`dev-setup.md`** - Development environment setup

### `/user` - User Documentation
End-user facing documentation and guides.

- **`ADMIN_PANEL_USER_GUIDE.md`** - Admin panel user guide
- **`LICENSING_SYSTEM_README.md`** - License management guide

### `/releases` - Release Documentation
Alpha and beta release setup and guides.

- **`ALPHA_BETA_RELEASE_SETUP.md`** - Release setup instructions
- **`alpha-release-guide.md`** - Alpha release checklist
- **`beta-release-guide.md`** - Beta release checklist

### `/mockups` - Design Mockups
Visual mockups and UI/UX designs.

- **`unified-editor-mockup.md`** - Unified visual editor system mockup

### `/github-issues` - Issue Templates
Pre-written GitHub issue content ready to be created.

- **`unified-editor-issues.md`** - Unified visual editor implementation issues

### `/archive` - Historical Documentation
Completed implementation plans and archived strategic documents.

- Implementation plans for completed features (Undo/Redo, Telemetry, Developer Mode)
- Historical architecture decisions
- Migration guides for completed migrations

---

## 🎯 Quick Start

### For Developers
1. Read [`/development/ARCHITECTURE.md`](development/ARCHITECTURE.md) - Understand the system
2. Read [`/architecture/migration-unified-licensing.md`](architecture/migration-unified-licensing.md) - Learn the license system
3. Read [`/development/dev-setup.md`](development/dev-setup.md) - Set up your environment

### For Business Stakeholders
1. Read [`/business/summary.md`](business/summary.md) - Business overview
2. Read [`/architecture/naming-and-editions.md`](architecture/naming-and-editions.md) - Edition strategy
3. Read [`/business/pricing.md`](business/pricing.md) - Pricing strategy

### For Feature Development
1. Read [`/architecture/migration-unified-licensing.md`](architecture/migration-unified-licensing.md) - Feature flag system
2. Check [`/features/`](features/) for specific feature specs
3. Review [`/mockups/`](mockups/) for UI designs

---

## 📊 Current Development Status

See **`../PROJECT_STATUS.md`** (root directory) for the comprehensive development status including:
- Feature completion status
- Implementation priorities
- Competitive analysis
- User feedback tracking

---

## 🏗️ Architecture Overview

ShowStack is a **unified application** with **license-based editions**:

### Core Concept
- **One Application** - Single download, single codebase
- **Multiple Editions** - Features activated via license key
- **Six Feature Domains** - Lighting, Sound, Video, Production, Tour, Producer
- **Clean UI** - Only shows licensed features

### Edition Structure
| Edition | Features | Price |
|---------|----------|-------|
| Lighting Edition | Lighting design & management | $249/year |
| Sound Edition | Sound system design | $199/year |
| Video Edition | Video/projection design | $199/year |
| Designer Edition | Lighting + Sound + Video | $449/year |
| Production Edition | All design + Production + Tour | $599/year |
| Complete Edition | All 6 feature domains | $999/year |

---

## 📝 Contributing to Documentation

### Adding New Documentation

1. **Determine the category** - Which folder does it belong in?
2. **Use clear naming** - Use descriptive, kebab-case filenames
3. **Add frontmatter** - Include date, status, and purpose at the top
4. **Update this README** - Add your new doc to the appropriate section

### Archiving Documentation

When a feature is complete or a decision is final:

1. Move implementation plans to `/archive`
2. Add a note indicating completion status
3. Update this README if it was referenced here

### Documentation Standards

- **Markdown format** - Use GitHub-flavored Markdown
- **Clear headers** - Use proper header hierarchy (h1 → h2 → h3)
- **Status indicators** - Use ✅ (complete), 🚧 (in progress), ⬜ (planned)
- **Last updated dates** - Include "Last Updated" in frontmatter
- **Links** - Use relative links to other docs

---

## 🔍 Finding Documentation

### By Topic
- **Architecture decisions**: `/architecture`
- **Feature specs**: `/features`
- **Business info**: `/business`
- **Developer guides**: `/development`
- **User guides**: `/user`
- **Completed work**: `/archive`

### By Status
- **Current/Active**: All folders except `/archive`
- **Historical/Complete**: `/archive`

### By Audience
- **Developers**: `/development`, `/architecture`
- **Business**: `/business`, `/architecture/naming-and-editions.md`
- **Users**: `/user`
- **Designers**: `/mockups`

---

## 📧 Questions?

If you can't find what you're looking for:

1. Check **`../PROJECT_STATUS.md`** for current development status
2. Search the docs folder: `grep -r "search term" docs/`
3. Check the `/archive` for historical context

---

## 📚 Related Documentation

- **`../README.md`** - Project README (root)
- **`../PROJECT_STATUS.md`** - Development status (root)
- **`../CONTRIBUTING.md`** - Contribution guidelines (root)

---

**Documentation maintained by the ShowStack team**
**Last major reorganization:** December 28, 2024
