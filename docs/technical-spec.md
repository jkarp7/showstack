# ShowStack:Production Technical Specification
## LightWright 6 Competitor Module

**Version:** 1.0-ALPHA
**Target Platform:** Electron Desktop Application
**Author:** Lytrix
**Last Updated:** November 16, 2025

---

## 🎯 Executive Overview

ShowStack:Production is a comprehensive lighting design and production management tool built to directly compete with and exceed LightWright 6's capabilities.

### Key Differentiators
- **Native performance** for large datasets (10,000+ fixtures)
- **Offline-first** functionality for venue load-ins
- **Direct hardware integration** with label printers and lighting consoles
- **Real-time collaboration** with optional cloud sync
- **Modern UX** built for 2025+

### Market Position
- **Primary Competitor:** LightWright 6 ($845 new license, $625-695 upgrade)
- **Institutional:** $2,595 for 6 seats ($433/seat)
- **Student:** $135 for 3 years ($45/year)
- **Target Users:** Lighting Designers, Associate Designers, Production Electricians
- **Pricing Model:** $29/month or $249/year subscription (see detailed pricing below)
- **Differentiation:** Modern UX, offline-first, real-time collaboration, continuous updates

---

## 📋 MUST-HAVE FEATURES (LightWright 6 Parity)

### 1. SPREADSHEET INTERFACE ✓

**Core Capabilities:**
- Custom virtual scrolling data grid (10,000+ row performance)
- 50+ customizable columns with user-defined ordering
- In-cell editing with Tab/Enter navigation
- Multi-cell selection and bulk editing
- Smart incrementing (1→2→3, 1A→1B→1C, etc.)
- Auto-complete from project history and equipment library
- Full undo/redo with unlimited history

**Standard Columns:**
```
Position | Unit# | Type | Purpose | Channel | Dimmer | Circuit | 
Phase | Wattage | Amperage | Color | Gobo | Template | Location |
Universe | Address | Mode | Notes | Status | Weight | Accessories
```

**Sorting & Filtering:**
- Multi-level sort (primary, secondary, tertiary)
- Natural sort for alphanumeric values
- Advanced filters with AND/OR logic
- Quick filter bar for common searches
- Save/load filter presets

---

### 2. LABEL SYSTEM ✓

**Drag & Drop Designer:**
- Visual canvas with snap-to-grid
- Element types: Text, Field, Image, Barcode, QR, Line, Box
- Alignment tools (left, center, right, top, middle, bottom)
- Distribution tools (horizontal, vertical spacing)
- Rotation and layering controls

**Avery Template Library:**
- Pre-built templates for common Avery label sizes
- 5160, 5167, 5263, 5264, and more
- Custom template creation and sharing
- Import/export label layouts as JSON

**Professional Printing:**
- Direct integration with Dymo, Brother, Zebra printers
- PDF export for standard printers
- Print preview with zoom controls
- Batch printing with filtering/sorting
- Partial sheet support (start at label #15, etc.)

---

### 3. VECTORWORKS INTEGRATION ✓

**File Format Support:**
- Import from VW Light Info Record (LIR) - XML, CSV, TXT
- Parse fixture data with custom field mapping
- Handle nested properties and custom records

**Discrepancy Detection:**
- Match fixtures by position, unit#, or object handle
- Detect: Missing in VW, Missing in ShowStack, Data mismatches, Duplicates
- Confidence scoring for fuzzy matches

**Reconciliation Interface:**
- Side-by-side comparison view
- Per-fixture resolution (Use VW, Keep ShowStack, Manual Merge, Ignore)
- Bulk actions (Accept All VW, Keep All SS, Auto-Merge Safe)
- Preview changes before applying

**Custom Property Matching:**
- Visual field mapper (VW field → ShowStack column)
- Transform rules: Regex, Formula, Lookup Table, Concatenate, Split
- Conflict resolution preferences
- Save/load mapping presets

**Selective Sync:**
- Exclude fixtures by status (house fixtures, work lights, etc.)
- Exclude specific fields from sync
- Conditional exclusion rules
- Enable/disable sync entirely

---

### 4. ETC EOS INTEGRATION ✓

**Console Connection:**
- OSC, TCP, or UDP protocols
- Auto-discovery of consoles on network
- Connection status monitoring
- Secure authentication (if required)

**Patch Export:**
- Generate patch from ShowStack data
- Fixture personality matching (ShowStack type → Eos personality)
- Support for ASCII, CSV, XML export formats
- Direct OSC commands to console

**Query Tiles:**
- Import query definitions from Eos
- Execute queries against ShowStack data
- Export query results as groups
- Visual query builder

**Live Cue List Sync:**
- Fetch active cue list from console
- Display current cue, timing, channel data
- Auto-refresh at configurable interval
- Detect discrepancies (missing cues, timing mismatches)

**Live Fixture Control:**
- Set intensity, color, pan/tilt, parameters
- Record to cue / Update cue
- Snapshots for quick recall
- Safety features (blackout protection, confirmation dialogs)
- Grand master limit
- Auto-release on disconnect

---

### 5. POWER & CONTROL MANAGEMENT ✓

**Dimmer & PD Configuration:**
- Create dimmer racks (ETC Sensor3, Strand CD80, etc.)
- Configure: Total dimmers, amperage, voltage, numbering
- Sequential vs rack/port numbering formats
- Dimmed vs relay (switched) ports
- RDM support flags

**Circuit Management:**
- Circuit-to-dimmer mapping
- Direct circuits (no dimmer)
- Phase assignment (A, B, C)
- Breaker and panel board tracking
- Current load calculation

**DMX Map Visualization:**
- Universe-by-universe view
- Address allocation display
- Utilization percentage
- Color-coded by fixture type or status
- Interactive (click to see fixture details)

**Multi-Cable Tracking:**
- Socapex 6-way, 12-way configurations
- Breakout assignment (circuit, fixture, color code)
- Load calculation per breakout
- Cable routing documentation
- Test logging (tested, condition, date)
- Auto-assignment algorithms

**Error Checking:**
- Patch overlap detection (duplicate channels/dimmers)
- Overloaded circuits
- Phase imbalance warnings
- DMX address conflicts
- Invalid address ranges
- Missing data (no channel, no circuit, etc.)
- Auto-fix suggestions

---

### 6. PAPERWORK GENERATION ✓

**Standard Report Templates:**
1. Instrument Schedule (all fixtures, all details)
2. Channel Hookup (sorted by channel)
3. Dimmer Hookup (sorted by dimmer, grouped by rack)
4. Circuit Schedule (sorted by circuit, with load calculations)
5. Load-In Schedule (grouped by location for hanging)
6. Color Cut List (summary of gel needs)
7. Gobo List (summary of gobo needs)
8. Equipment Count (quantity summary by type)

**Custom Layout Editor:**
- Drag-and-drop section builder
- Table sections with column selection
- Text sections with template variables
- Image sections for logos
- Chart sections for visualizations
- Page break controls
- Group headers/footers

**PDF Generation:**
- Professional PDF output
- Custom page sizes (Letter, Legal, A4, Tabloid)
- Header/footer with show branding
- Page numbering
- Landscape/portrait orientation
- DPI selection (72, 150, 300)
- Compression options

**Preview Before Printing:**
- Paginated preview with zoom
- Navigate pages
- Show/hide margins, grid, cut lines
- Preview with or without branding

**Multi-Report Combination:**
- Select multiple reports
- Reorder report sequence
- Insert page breaks between reports
- Optional table of contents
- Continuous page numbering
- Single PDF output

**Custom Branding:**
- Main logo (position, size)
- Secondary logo (optional)
- Color scheme (primary, secondary, accent)
- Custom fonts (header, body)
- Footer text
- Watermark for drafts (text, opacity, rotation)

---

## 🗄️ DATABASE SCHEMA (PostgreSQL / SQLite)

See full schema in technical spec document (too long to include here).

**Key Tables:**
- projects
- fixtures (main data table)
- power_systems
- dimmer_racks
- circuits
- multi_cables
- console_connections
- fixture_groups
- cue_lists
- cues
- report_templates
- label_templates
- show_branding
- revisions (change history)
- vw_sync_history
- user_preferences
- activity_log (audit trail)

---

## 🏗️ TECHNICAL ARCHITECTURE

**Desktop App (Electron):**
```
Main Process: Node.js 20+
- Database: better-sqlite3 (offline)
- Printing: electron-printer
- Hardware: node-dymo, osc-js

Renderer Process: React 18+
- Language: TypeScript 5+
- State: Zustand
- UI: Tailwind CSS + Radix UI
- Grid: Custom virtual grid
- PDF: pdfkit / pdf-lib
```

**Optional Cloud Sync:**
```
Backend: Express.js + PostgreSQL 15+
Auth: JWT + bcrypt
Realtime: Socket.io
Storage: AWS S3 / Cloudflare R2
Deployment: Railway / Render
```

**File Storage:**
- Projects: `~/Documents/ShowStack/Projects/{id}.db`
- Assets: `~/Documents/ShowStack/Assets/`
- Exports: `~/Documents/ShowStack/Exports/`
- Preferences: `~/Documents/ShowStack/preferences.json`

---

## 🚀 DEVELOPMENT ROADMAP

**Phase 1: Foundation (Months 1-2)**
- Electron shell + React renderer
- Custom virtual data grid
- Local SQLite database
- CRUD operations
- Sorting, filtering, search
- Smart incrementing
- Auto-complete
- Undo/redo
- CSV import/export

**Phase 2: Power & Control (Months 3-4)**
- Dimmer rack configuration
- Circuit management
- Phase balancing
- DMX map visualization
- Multi-cable tracking
- Error checking system
- Auto-fix engine

**Phase 3: Labels (Month 5)**
- Label designer canvas
- Avery template library
- Printer integration (Dymo, Brother, Zebra)
- PDF export
- Batch printing

**Phase 4: Vectorworks (Month 6)**
- VW file parser
- Field mapping interface
- Discrepancy detection
- Reconciliation dialog
- Custom property matching
- Sync history tracking

**Phase 5: ETC Eos (Months 7-8)**
- OSC protocol implementation
- Connection manager
- Patch export
- Group management
- Cue list sync
- Live fixture control

**Phase 6: Paperwork (Months 9-10)**
- Report template engine
- Standard report library
- Custom report designer
- PDF generation
- Branding system
- Multi-report combination

**Phase 7: Polish (Months 11-12)**
- Performance optimization (10,000+ fixtures)
- Auto-update system
- User onboarding
- Documentation
- Beta testing
- Marketing materials

**Phase 8: Cloud Sync (Optional, Month 13+)**
- Backend API
- Authentication
- Differential sync
- Real-time collaboration
- Team management

---

## 💰 PRICING STRATEGY

**Free Tier:**
- Up to 100 fixtures
- 3 basic reports
- Local storage only
- Community support

**Professional: $29/month or $249/year**
- Unlimited fixtures
- All features (Eos, VW, Labels, Branding)
- Priority support
- Optional cloud sync

**Team: $79/month or $699/year (5 users)**
- Real-time collaboration
- Team project sharing
- Admin dashboard
- Usage analytics

**Enterprise: Custom pricing**
- Unlimited users
- Custom integrations
- On-premise deployment
- SLA + account manager

**Competitive Edge:**
- **LightWright 6 New:** $845 one-time (or $625-695 upgrade)
- **LightWright 6 Institutional:** $2,595 / 6 seats = $433/seat
- **LightWright 6 Student:** $135 / 3 years = $45/year
- **ShowStack Pro:** $249/year - 71% cheaper than new LW6 license in year 1
- **ShowStack over 3 years:** $747 total vs $845 one-time (comparable cost but with continuous updates)
- **ShowStack Student:** $60/year (33% more but includes cloud sync, collaboration)
- **Value proposition:** Modern UX, continuous updates, collaboration, cloud sync, mobile-ready

---

## 📊 SUCCESS METRICS

**Launch Targets (6 months):**
- 1,000 paid subscribers
- $29,000 MRR
- 15% free-to-paid conversion
- <5% monthly churn
- NPS >50

**Feature Adoption:**
- Eos Integration: 70% of pro users
- Vectorworks Sync: 50%
- Label Printing: 40%
- Cloud Sync: 30%

**Performance:**
- Load 5,000 fixtures: <2 seconds
- Grid rendering: 60 FPS
- PDF generation: <5 seconds (50 pages)
- Sync time: <10 seconds

---

**Next Steps:**
1. Review spec with stakeholders
2. Set up development environment
3. Create UI mockups (Figma)
4. Build Phase 1 prototype
5. Beta test with Shop Order Builder users
6. Iterate based on feedback
7. Launch!

