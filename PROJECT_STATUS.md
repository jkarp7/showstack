# ShowStack Project Status

**Created:** December 18, 2024
**Last Updated:** January 2, 2026
**Current Version:** 0.1.0-alpha
**Development Phase:** Alpha
**Active Branch:** `feature/unified-visual-editor`

This document tracks the development status of all ShowStack feature domains and editions. It serves as the central source of truth for what's completed, in progress, and planned.

---

## 📊 Overall Progress

| Feature Domain | Status | Completion |
|----------------|--------|------------|
| Lighting Features | 🚧 In Progress | 70% |
| Core Infrastructure | ✅ Complete | 100% |
| Sound Features | ⬜ Planned | 0% |
| Video Features | ⬜ Planned | 0% |
| Production Features | ⬜ Planned | 0% |
| Tour Features | ⬜ Planned | 5% |
| Producer Features | ⬜ Planned | 0% |

---

## 🎯 Current Development Priorities

### ✅ Recently Completed (December 2024 - January 2026)
1. ✅ Undo/redo system - COMPLETED
2. ✅ Customizable headers to Paperwork Generator - COMPLETED (Phase 1 & 2)
3. ✅ Paperwork Header/Footer System - COMPLETED
   - Compact 3-row grid layout with proper spacing
   - Dynamic data from project (Show Name, LD, Venue, Date)
   - Static footer with page numbers (Puppeteer displayHeaderFooter)
   - Font matching across header, footer, and report content
   - Automatic template migration system for layout updates
   - Fixed duplicate element seeding issue
4. ✅ Paperwork Template System (Phase 3) - COMPLETE
   - Database infrastructure & queries
   - Column configuration UI with drag-and-drop
   - Grouping & sorting controls
   - Report table renderer with color swatch visualization
   - Template library with system templates (13 report types)
   - Integrated PaperworkEditor component
   - Major refactor of Paperwork.tsx (2353 → 409 lines, 82% reduction)
   - Color Cut Report with gel database (628 colors) and sheet calculations
   - Template migration system for automatic updates
4. ✅ Layout Designer UI Improvements - COMPLETED
   - Enhanced LayoutCanvas with better grid visualization, resize handles, snap guides
   - Modernized ElementPalette and ElementInspector
   - Floating toolbar with zoom and undo/redo
   - Improved drag-and-drop feedback with ghost elements
   - Phase 2 text & shape formatting controls
   - Streamlined typography controls

### Immediate (Current Session)
1. **Phase 3: Paperwork Template System** - ✅ COMPLETE
   - ✅ Manual UI testing of all 13 report types
   - ✅ Template operation testing (load, save, duplicate, delete)
   - ✅ Bug fixes based on testing findings
   - ✅ Color Cut Report with gel database and sheet calculations
   - ✅ Color swatch visualization in reports
   - ✅ Template migration system for future updates

### Next Steps (After Phase 3)
1. **Remove emojis from UI for professional appearance**
   - Replace emoji icons with Lucide React icons or text labels
   - Buttons, labels, and UI elements across all modules
2. **Phase 4: Label Integration** - Grid designer for label layouts
3. **Phase 5: Polish & UX** - Inline editing, gradients, shadows, multi-display support
4. **Implement shop order creation from system documentation** (auto-populate from fixture/infrastructure data)

### Short-term (Next 1-2 Months) - **Focus on Lightwright Parity**
1. **MVR export support** - Industry standard CAD/visualizer format
2. **Enhanced error checking** - Overlapping patches, overloaded dimmers, duplicate channels, missing data
3. **Basic console integration** - OSC protocol for ETC Eos
4. Complete Label Designer module
5. Add power distribution printable reports with visualization
6. Implement CSV import/export with field mapping

### Medium-term (Next 3-6 Months) - **Professional Integration**
1. **Vectorworks XML integration** - Automatic data sync with CAD
2. **Advanced console support** - grandMA parameter calculations, additional consoles
3. **Power/cable diagrams** - Visual power distribution and cable path layouts
4. Cloud sync infrastructure (Phase 1 - file sync only)
5. Beta release with 10+ testers

### Long-term (6-12 Months) - **Market Differentiation**
1. **Real-time multi-user collaboration** (strategic decision - requires cloud backend)
2. Tour & Production features (logistics, budgeting)
3. Advanced features (focus charts, work notes, cable tracking)
4. Roll printer support for label printing
5. Public launch at USITT or LDI 2026
6. Paid customer acquisition (target: 100+ customers)

---

## 💡 Lighting Edition

**Price:** $249/year
**Target Users:** Lighting Designers, Production Electricians, Master Electricians
**Competes With:** LightWright 6 ($845 one-time)

Comprehensive lighting production suite including fixture management, shop orders, and paperwork generation - a modern alternative to LightWright 6.

### 🚧 In Development

#### Fixture Management (Equipment Manager) - 80% Complete

Core fixture database and virtual grid for managing lighting plots.

**Completed Components:**
- ✅ **Virtual Data Grid** - `src/renderer/src/components/fixture/VirtualDataGrid.tsx`
  - Virtual scrolling for 10,000+ fixtures
  - 60 FPS performance
  - Auto-linking circuits to racks
  - Multi-select support
  - In-cell editing

- ✅ **Equipment Manager Page** - `src/renderer/src/pages/modules/EquipmentManager.tsx`
  - Full fixture CRUD operations
  - Power rack management
  - Auto-linking on page load
  - Export functionality (CSV, EOS, GrandMA)

- ✅ **Fixture Database** - `src/main/database/projectSchema.ts:fixtures`
  - 68+ columns including power rack assignments
  - LightWright parity achieved
  - Full IPC handler integration

- ✅ **Power Management** - `src/renderer/src/components/power/`
  - Power Summary panel with utilization tracking
  - Dimmer rack and PD rack management
  - Module configuration for mixed rack types
  - Circuit parser and auto-linking

- ✅ **Add Fixture Dialog** - `src/renderer/src/components/fixture/AddFixtureDialog.tsx`
  - Full fixture creation form with all 68+ fields
  - Input validation and type checking

- ✅ **Bulk Edit Dialog** - `src/renderer/src/components/fixture/BulkEditDialog.tsx`
  - Comprehensive field coverage (30+ editable fields)
  - 7 collapsible sections
  - Enhanced auto-numbering supporting 6 fields

- ✅ **Column Visibility Menu** - `src/renderer/src/components/fixture/ColumnVisibilityMenu.tsx`
  - Toggle column visibility with persistent user preferences

- ✅ **Undo/Redo System** - `src/renderer/src/store/undoRedoStore.ts`
  - Command pattern implementation
  - Keyboard shortcuts (Cmd+Z undo, Cmd+Shift+Z redo)
  - 100-item history limit

**Remaining Work:**
- ⬜ **Filter out capability** - Hide fixtures matching criteria (1-2 days)
- ⬜ **Color flags for designations** - Visual indicators for hot circuits, special fixtures (2-3 days)
- ⬜ **Point circuit notation** - Support circuits like "1.2", "1.3" for power thru/daisy chains (3-4 days)
- ⬜ **Auto-complete from project data** - Suggest values based on existing fixtures (3-4 days)
- ⬜ **Click-to-edit infrastructure** - Double-click infrastructure rows to edit (1 day)
- ⬜ **Multi-color row highlighting** - Color-code fixtures by user criteria (2 days)
- ⬜ **Combined fields on reports** - Concatenate fields (e.g., "Type + Accessory") (2-3 days)
- ⬜ **Remove focus columns** - Clean up planned features that won't be implemented (1 hour)

**Future Enhancements:**
- 💡 **Auto-complete System** - Manufacturer, type, color, gobo database (deferred - requires extensive fixture database)
- 💡 **DMX Conflict Detection** - Highlight conflicts in grid (waiting for Vectorworks integration)

**Estimated Time to Complete:** 2-3 weeks

---

#### Label Designer - 75% Complete

Drag-and-drop label creation for various printer types with HTML5 Canvas.

**Completed:**
- ✅ **Label Designer Page** - `src/renderer/src/pages/modules/LabelDesigner.tsx` (1,182 lines)
  - Drag-and-drop label layout with canvas-based WYSIWYG editor
  - Drawing tools: text, rectangle, circle, line
  - Template system: cable, circuit, fixture, dimmer labels
  - Custom label designs with save/load (localStorage)
  - Avery template support (5 predefined templates)
  - Printer type selection (Dymo, Brother, Zebra, Avery sheets)
  - Batch printing mode
  - Element inspector with property editing

**Remaining Work:**
- ⬜ **PDF export** - handleExportLabels() needs implementation
- ⬜ **Actual printing** - handlePrintLabels() needs IPC integration
- ⬜ **Barcode/QR code generation** - Mentioned but not implemented
- ⬜ **Printer driver integration** - No direct printer communication
- ⬜ **Custom background colors** - User-selectable label background (1 day)
- ⬜ **Background images** - Support logo/image backgrounds on labels (1-2 days)

**Estimated Time to Complete:** 1-2 weeks

---

#### Power Management Enhancements

**Pending Additions:**
- ⬜ **Power service assignment** - Designate services (A, B, C, etc.) (2 days)
- ⬜ **Phase distribution templates** - Save/load phase configurations (AB vs AC phasing) (3-4 days)
- ⬜ **Custom phase labels** - User-defined phase naming (1, 2, 3 or A, B, C) (1 day)
- ⬜ **Cable Run Visualization** - Visual cable path layout
- ⬜ **Advanced Phase Balancing** - Automatic phase assignment suggestions
- ⬜ **Power Distribution Reports** - Printable rack schedules and load reports

**Estimated Total:** 1-2 weeks

---

#### Paperwork Enhancements

**Completed:**
- ✅ **Gel color swatches** - Visual color chips for gel/color fields in reports
  - Complete gel color database (628 theatrical gels: GAM, LEE, Roscolux)
  - Color swatch rendering in Color Cut Report
  - Automatic hex color lookup from gel codes
- ✅ **Color Cut Report** - Gel cutting list with automatic calculations
  - Frame size parsing (square, rectangular, round formats)
  - Cuts per sheet calculation (20" x 24" standard sheets)
  - Total sheets needed calculation
  - Dual color splitting for accurate counting
  - Manufacturer detection from gel codes

**Pending Additions:**
- ⬜ **Color printing support** - Enable color in system docs paperwork (1 day)

**Estimated Total:** 1 day

---

### ✅ Completed

#### Shop Order Tool

Complete shop order and equipment specification builder with professional PDF output.

**Core Functionality:**
- ✅ **Equipment Item Management** - `src/renderer/src/components/prep/EquipmentItemTable.tsx`
  - Add, edit, delete equipment items
  - Section-based organization
  - Drag-and-drop reordering
  - Quantity tracking (venue, rental, shop)
  - Multi-discipline support (lighting, audio, video, rigging, scenic, props)

- ✅ **Section Management** - `src/renderer/src/components/prep/SectionList.tsx`
  - Create custom sections
  - Reorder sections via drag-and-drop
  - Rename and delete sections

- ✅ **Revision Tracking** - `src/renderer/src/components/prep/RevisionPanel.tsx`
  - Up to 5 revisions per project
  - Automatic change detection
  - Revision metadata (date, author, notes)

- ✅ **Notes System** - `src/renderer/src/components/prep/NotesPanel.tsx`
  - 3-tier notes: General Conditions, General Notes, Fixture Notes
  - Rich text formatting
  - Note templates (save/load common notes)

**Print & Export:**
- ✅ **Print Builder** - `src/renderer/src/components/prep/PrintBuilder.tsx`
  - Drag-and-drop section arrangement
  - 11 section types
  - Template save/load system

- ✅ **PDF Export** - `src/main/ipc/prep.ts:prep:exportPDF`
  - Print-ready PDF generation
  - Electron printToPDF API

**Database:**
- ✅ **Shop Order Schema** - `src/main/database/projectSchema.ts`
  - Complete database schema with 6 tables
  - Default page layouts
  - Query functions

---

#### Paperwork Generator (Phase 1 & 2)

Custom report and paperwork templates with fully customizable headers using visual layout designer.

**Core Reports:**
- ✅ **Paperwork Page** - `src/renderer/src/pages/modules/Paperwork.tsx`
  - **Fixture Reports (8)**: Channel hookup, dimmer schedule, circuit list, DMX addresses, power summary, color schedule, gobo schedule, color cut report
  - **Infrastructure Reports (5)**: Equipment list, network summary, port assignments, power consumption, location map
  - Batch export to PDF
  - Batch print functionality
  - Page setup configuration

**Phase 1: Preset-Based Headers:**
- ✅ **HeaderRenderer** - 5 predefined layout presets
- ✅ **HeaderLayoutSelector** - Preset dropdown selection

**Phase 2: Visual Layout Designer:**
- ✅ **PaperworkHeaderDesigner** - 12-column × 8-row grid
- ✅ **HeaderFromTemplate** - Renders headers from visual templates
- ✅ **Data Field Mapper** - Calculates fixture and infrastructure summaries

**Available Data Fields:** 17 total (report fields, fixture summaries, infrastructure summaries)

---

#### Power Management

Comprehensive power distribution tracking and management system.

**Core Functionality:**
- ✅ **Power Rack Management** - Dimmer rack and PD rack configuration
- ✅ **Module Configuration** - Configure mixed module types per rack
- ✅ **Power Summary Panel** - Real-time utilization tracking
- ✅ **Auto-linking System** - Automatic fixture-to-rack linking
- ✅ **Power Calculations** - Per-module capacity calculations

**Database Schema:**
- ✅ **Power Tables** - Complete schema with 3 tables

---

#### Infrastructure Equipment Management

Comprehensive tracking system for network equipment, data distribution, audio/video infrastructure with port assignment management.

**Core Functionality:**
- ✅ **Infrastructure Equipment Tracking** - Full CRUD operations
- ✅ **Port Assignment Management** - Dynamic port count configuration (0-128 ports)
- ✅ **Equipment Dialogs** - Add and edit dialogs with comprehensive fields
- ✅ **Column Visibility System** - 17 configurable columns

**Database Schema:**
- ✅ **Infrastructure Table** - 33 columns covering all equipment attributes
- ✅ **Query Functions** - Complete CRUD operations
- ✅ **IPC Integration** - Full IPC handlers

**State Management:**
- ✅ **Infrastructure Store** - Zustand-based state management

**Integration:**
- ✅ **Equipment Manager Integration** - Three-tab interface (Fixtures | Infrastructure | Power Racks)

**Pending Enhancements:**
- ⬜ **Port Linking** - Link ports to fixtures or other infrastructure
- ⬜ **Port Usage Tracking** - Track which ports are actively in use
- ⬜ **Port Validation** - IP address, VLAN range validation
- ⬜ **Import/Export** - CSV import/export for infrastructure equipment
- ⬜ **Network Topology Visualization** - Visual network layout

---

### ⬜ Planned

#### Vectorworks Integration

Import/export fixtures from Vectorworks with reconciliation.

- ⬜ **Vectorworks Import/Export**
  - XML import from Vectorworks
  - Reconciliation workflow (detect changes)
  - Export back to Vectorworks
  - Field mapping configuration

**Effort Estimate:** 8-12 weeks

---

#### Console Integration

ETC Eos console communication via OSC.

- ⬜ **ETC Eos Integration**
  - OSC communication library (osc-js)
  - Patch import from console
  - Send patch updates to console
  - Channel number sync
  - Fixture type mapping

**Effort Estimate:** 8-12 weeks

---

#### Advanced Features

Additional production tools.

- ⬜ **Multi-cable Tracking** - Track multi-cable runs, breakouts
- ⬜ **Error Checking** - DMX conflicts, power overloads, duplicate channels
- ⬜ **DMX Map Visualization** - Visual DMX universe layout
- ⬜ **Focus Charts** - Custom focus chart generation
- ⬜ **Work Notes** - Tracking installation notes, issues, changes

---

#### Unified Visual Editor System (Major Refactor)

**Overview:** Consolidate all visual editing (Paperwork, Labels, Shop Orders) into a single, modern, production-grade editor with comprehensive formatting controls.

**Vision:** Transform Paperwork tab from "preview mode" to "layout editor mode" - similar to LightWright's layout tab but with drag-and-drop visual design capabilities.

**See:** `docs/mockups/unified-editor-mockup.md` for detailed visual mockups

**Strategic Goals:**
- One editor for all contexts - Paperwork headers, full reports, labels, shop orders
- Professional UX - Optimized for production electricians/audio/video techs
- Modern appearance - Clean, floating toolbars, collapsible panels, dark mode optimized
- Speed-first design - Keyboard shortcuts, command palette, inline editing

**Implementation Phases:**
1. ✅ **Phase 1: Core Refactor & UI Improvements** - COMPLETED
   - Enhanced LayoutCanvas with better grid visualization, resize handles, and snap guides
   - Modernized ElementPalette with collapsible category sections and preview cards
   - Enhanced ElementInspector with collapsible sections and modern controls
   - Added floating toolbar with zoom controls and undo/redo functionality
   - Improved drag-and-drop feedback with ghost elements and visual indicators
   - **Branch:** `feature/unified-visual-editor`
   - **Commits:** 4 commits (429d517, 0509313, 652ea0e, b7ab7d2)

2. ⬜ **Phase 2: Text & Shape Formatting** (1 week)
3. ⬜ **Phase 3: Paperwork Integration** (1 week)
4. ⬜ **Phase 4: Label Integration** (1 week)
5. ⬜ **Phase 5: Polish & UX** (1 week)

**Progress:** Phase 1 complete (20% done)
**Estimated Remaining:** 4 weeks

**Benefits:**
- Consistent UX across all paperwork/label tasks
- Professional-grade formatting control
- Faster workflow with keyboard shortcuts
- Single codebase (~40% less code)

**Competitive Advantage:**
- Modern visual editor vs. LightWright's settings-based approach
- Drag-and-drop WYSIWYG beats form-based configuration

**Related Files:**
- **Mockup**: `docs/mockups/unified-editor-mockup.md`
- **Existing Editor**: `src/renderer/src/components/prep/layout/LayoutDesigner.tsx`
- **Paperwork Page**: `src/renderer/src/pages/modules/Paperwork.tsx`
- **Label Designer**: `src/renderer/src/pages/modules/LabelDesigner.tsx`

---

#### Maintenance Menu System (Major Feature)

**Overview:** Lightwright 6 parity feature - custom categorization system for grouping fixtures.

**Core Functionality:**
- Menu bar "Maintenance" menu with entry for every column (including user-defined)
- Each menu item opens dialog with 4 tabs:
  - **Notes**: General category notes
  - **Physical**: Physical characteristics, handling
  - **Vectorworks**: CAD-specific notes, layer assignments
  - **Position**: Location-specific notes
- Create custom categories/families:
  - Examples: "ALL Incandescent", "ALL Moving Lights", "FOH Fixtures"
  - Rule-based auto-assignment (e.g., Type contains "MAC" → "Moving Lights")
  - Manual assignment override
- Category integration:
  - Show on labels
  - Group on paperwork
  - Drive shop order automation (Equipment Manager → Shop Order)
  - Color-coded visual indicators
  - Filter/search by category

**Implementation Phases:**
1. **Phase 1: Core System** (5-7 days)
2. **Phase 2: Maintenance Menu UI** (3-4 days)
3. **Phase 3: Integration** (4-5 days)
4. **Phase 4: Advanced** (2-3 days)

**Estimated Total:** 3-4 weeks

**Strategic Value:**
- **CRITICAL for shop order automation** - Provides grouping mechanism
- Lightwright 6 parity
- Enables sophisticated workflow customization
- Foundation for Equipment Manager → Shop Order automation (#29)

**Related Issues:** #29 (shop order automation), #14 (auto-complete)

---

#### UI/UX Improvements

**Quick Fixes:**
- ⬜ **Remove recent files from Production Landing** - Current flow broken (1 hour)

**Menu Bar Reorganization:**
- ⬜ **Evaluate menu bar access** - Move common functions to menu for easier access
  - Add fixture/infrastructure
  - Generate paperwork
  - Export options
  - Settings access

**Estimated Total:** 2-3 days

---

## 🔊 Sound Edition

**Price:** $199/year
**Target Users:** Sound Designers, A1s, Audio Engineers
**Competes With:** Minotaur Sound System Database

**Status:** Planned for Year 2 (2026-2027)

### ⬜ Planned Features

Based on Minotaur parity analysis (see `docs/features/migration-sound-features.md`):

- ⬜ **Audio Equipment Management**
  - Audio equipment database with comprehensive fields
  - Virtual grid for audio plots
  - Multi-select and bulk operations

- ⬜ **Wireless Microphone Coordination**
  - Frequency management & IAS import
  - Wireless microphone tracking
  - Frequency conflict detection

- ⬜ **Audio Patch Management**
  - Input/Output tracking
  - Multi-pair cable tracking
  - Signal routing

- ⬜ **Speaker & Amplifier Assignment**
  - Speaker placement and coverage
  - Amplifier assignment and power calculations
  - Zone management

- ⬜ **QLab Integration**
  - Import cue lists from QLab
  - Sync audio playback files

- ⬜ **Console Integration**
  - Yamaha console support
  - DiGiCo console support
  - Allen & Heath console support
  - Scene import/export

- ⬜ **Sound-Specific Paperwork**
  - Input list
  - Output list
  - Mic plot
  - Speaker plot
  - Patch sheets
  - Zone assignments

- ⬜ **Label Printing for Audio**
  - Audio-specific label templates
  - Cable labels with connector types
  - Input/output labels

**See:** `docs/features/migration-sound-features.md` for complete specifications

---

## 📹 Video Edition

**Price:** $199/year
**Target Users:** Projection Designers, Video Engineers
**Competes With:** No direct competitor (first-to-market opportunity)

**Status:** Planned for Year 3+ (2027-2028)

### ⬜ Planned Features

- ⬜ **Projector & Display Management**
  - Projector database with specs
  - Display tracking (LED walls, monitors, etc.)
  - Placement and coverage calculations

- ⬜ **Media Server Tracking**
  - Media server inventory
  - Output assignments
  - Content file management

- ⬜ **Video Signal Routing**
  - Input/output tracking
  - Signal flow visualization
  - Format conversion tracking

- ⬜ **Resolution & Throw Calculations**
  - Automatic throw distance calculations
  - Resolution and pixel density
  - Lens selection recommendations

- ⬜ **Playback File Management**
  - Media file tracking
  - Timecode integration
  - Cue list management

- ⬜ **Video-Specific Paperwork**
  - Projector schedule
  - Media server assignments
  - Signal flow diagram
  - Content list
  - Playback cue sheet

---

## 🎨 Designer Edition

**Price:** $449/year (saves $198/year vs individual editions)
**Includes:** Lighting + Sound + Video
**Target Users:** Multi-discipline designers

**Status:** Launches with Sound Edition (Year 2)

All features from Lighting, Sound, and Video editions combined. Users can work across all three disciplines in a single unified project.

**Key Advantage:** Cross-discipline integration
- Shared equipment libraries
- Unified paperwork
- Integrated power calculations
- Collaborative workflows

---

## 🎬 Production Edition

**Price:** $599/year (66% cheaper than Propared's $1,750/year)
**Includes:** All design features (Lighting + Sound + Video) + Production Management + Tour Logistics
**Target Users:** Production Managers, Technical Directors, Tour Managers, Producing Organizations
**Competes With:** Propared (production management software for arts organizations)

**Status:** Planned for Year 3 (2027-2028)

**Competitive Advantage:** Only platform integrating technical design tools with production management. ShowStack users can flow data from lighting/sound/video design directly into budgets, schedules, and inventory—eliminating duplicate data entry and reducing errors.

**See:** `docs/features/propared-parity-analysis.md` for detailed competitive analysis

---

### ⬜ Planned: Production Scheduling

Comprehensive production calendar system for managing rehearsals, performances, load-in/load-out, and technical rehearsals.

**Core Features:**
- ⬜ **Production Calendar** (8-10 weeks)
  - Multi-view calendar (year, month, week, day, timeline, list)
  - Event types: rehearsal, performance, load-in, load-out, focus, tech, notes session
  - Drag-and-drop event creation and editing
  - Event templates (e.g., "Standard Tech Day", "Dress Rehearsal")
  - Recurring events with customizable patterns
  - Conflict detection (double-booked venue, crew, equipment)
  - Color-coding by department or event type
  - Export to iCal, Google Calendar, Outlook
  - Print-friendly views

- ⬜ **Event Templates**
  - Reusable event structures (Tech Day, Load-In Day, Performance Day)
  - One-click event creation from templates
  - Share templates across projects

- ⬜ **Integration with Labor & Budget**
  - Calendar events automatically calculate crew hours
  - Labor costs update budget in real-time
  - Crew booking synced with calendar

**Propared Parity:** Full parity with Propared's scheduling features
**Effort Estimate:** 8-10 weeks

---

### ⬜ Planned: Budget Tracking & Management

Comprehensive budget system with line-item tracking, real-time cost updates, and integration with labor, equipment, and vendor costs.

**Core Features:**
- ⬜ **Budget Builder** (6-8 weeks)
  - Line-item budgets with categories (Labor, Equipment, Venue, Materials, Transportation, Other)
  - Estimated vs. actual tracking
  - Variance analysis (over/under budget)
  - Budget templates (save and reuse)
  - Department-level budgets
  - Multi-project budget rollups
  - Export to Excel, PDF

- ⬜ **Labor Cost Integration**
  - Automatic cost calculation from crew bookings
  - Overtime rules applied automatically (1.5× time-and-a-half, 2× double-time)
  - Weekly hour tracking with overtime warnings
  - Real-time updates (calendar event added → Labor hours increase → Budget updates)

- ⬜ **Equipment Cost Integration**
  - Equipment items from shop orders auto-populate budget
  - Rental costs (daily, weekly, per-show rates)
  - Purchase costs for capital expenses
  - Shipping/freight costs

- ⬜ **Vendor Cost Integration**
  - Purchase orders linked to budget line items
  - Invoice tracking updates actual costs
  - Payment status reflected in budget

**Unique Advantage:** ShowStack's budget automatically updates when design data changes (e.g., adding fixtures increases rental costs and labor hours for focus)

**Propared Parity:** Full parity plus design tool integration
**Effort Estimate:** 6-8 weeks

---

### ⬜ Planned: Labor & Crew Management

Comprehensive crew database, position management, booking system, and payroll integration.

**Core Features:**
- ⬜ **Crew Database** (8-10 weeks)
  - Crew member profiles (contact info, emergency contacts, W-9 status)
  - Position/role assignments with pay rates
  - Department tags (lighting, sound, video, production, stage, wardrobe, props)
  - Availability calendar
  - Skills and certifications tracking
  - Document storage (contracts, resumes)

- ⬜ **Position Management**
  - Pre-populated positions (ME, A1, Video Engineer, PM, etc.)
  - Custom position creation
  - Default pay rates by position
  - Overtime multipliers (configurable)

- ⬜ **Crew Booking System**
  - Book crew from calendar events
  - Drag-and-drop crew assignment
  - Conflict detection (crew double-booked)
  - Availability checking
  - Booking status workflow (requested → tentative → confirmed)
  - Bulk booking (assign multiple crew to same event)
  - Weekly hour tracking per crew member
  - Overtime warnings

- ⬜ **Payroll Integration**
  - CSV export for payroll systems (ADP, Gusto, QuickBooks)
  - Weekly or custom date range exports
  - Columns: Name, Position, Regular Hours, OT Hours, Total Hours, Pay Rate, Total Earnings
  - Summary totals by department or project

**Propared Parity:** Full parity with Propared's labor management
**Effort Estimate:** 8-10 weeks

---

### ⬜ Planned: Inventory Management (Extended)

Extend existing fixture and infrastructure tracking to include props, costumes, scenery, video equipment, and general production inventory.

**Core Features:**
- ⬜ **Multi-Department Inventory** (6-8 weeks)
  - Props, costumes, scenery, wardrobe, tools, consumables, general equipment
  - Ownership tracking (owned, rented, borrowed)
  - Rental vendor linkage with daily/weekly rates
  - Condition tracking (new, good, fair, poor, repair needed)
  - Location tracking (storage location)
  - Photo support (multiple images per item)
  - Tag system for categorization

- ⬜ **QR Code System**
  - Generate unique QR code for each inventory item
  - Print QR labels (via existing label designer)
  - Scan QR code to view item details
  - Check-out/check-in workflow
  - Mobile scanning support (future mobile app)

- ⬜ **Rental & Borrowed Tracking**
  - Rental period tracking (start date, end date)
  - Automatic cost calculation (days × daily rate OR weeks × weekly rate)
  - Rental return tracking with late fee calculation
  - Borrowed items (from/to, dates, return confirmation)

- ⬜ **Allocation & Conflict Detection**
  - Allocate inventory to specific projects/shows
  - Check availability across date ranges
  - Detect conflicts (item allocated to multiple shows on same dates)
  - Reservation system (hold items for future shows)
  - Visual warnings when item is double-booked

**Unique Advantage:** ShowStack already tracks lighting fixtures (68+ fields) and infrastructure equipment with port-level detail—extending this to all production inventory creates a unified system

**Propared Parity:** Parity plus integration with existing technical equipment tracking
**Effort Estimate:** 6-8 weeks

---

### ⬜ Planned: Vendor Management

Comprehensive vendor database, purchase order system, and invoice tracking.

**Core Features:**
- ⬜ **Vendor Database** (6-8 weeks)
  - Vendor profiles (name, type, contact info, payment terms, tax ID)
  - Vendor types: equipment rental, consumables, services, fabrication, trucking
  - Rating/review system (1-5 stars)
  - Document storage (contracts, W-9)
  - Search and filter by type, rating, location

- ⬜ **Purchase Order System**
  - Create PO from shop order items or manually
  - Auto-generate PO numbers (e.g., PO-2025-001)
  - Multi-line item support
  - Professional PDF export
  - Email PO to vendor
  - Track PO status (draft, sent, confirmed, received, paid, cancelled)
  - Link to budget line items

- ⬜ **Invoice Tracking**
  - Link invoice to PO
  - Track payment status (received, approved, paid, overdue, disputed)
  - Overdue warnings
  - Payment history
  - Export to accounting software

- ⬜ **PO Workflow**
  1. Create PO from shop order or manually
  2. Generate professional PDF
  3. Send to vendor via email
  4. Vendor confirms → Status: confirmed
  5. Items received → Status: received
  6. Invoice received → Link invoice
  7. Payment made → Status: paid

**Unique Advantage:** PO line items auto-populate from shop orders, eliminating duplicate data entry

**Propared Gap:** Propared has limited vendor management; ShowStack's integration with shop orders provides superior workflow
**Effort Estimate:** 6-8 weeks

---

### ⬜ Planned: Tour Logistics

Tools for managing touring productions, including tour calendar, venue database, per diem tracking, and equipment manifests.

**Core Features:**
- ⬜ **Tour Calendar** (8-12 weeks)
  - Visual tour calendar (timeline view)
  - Tour date tracking (load-in, focus, tech, performances, strike, load-out)
  - Travel days and dark days
  - Multi-show coordination
  - Export tour schedule to PDF/iCal

- ⬜ **Venue Database**
  - Venue profiles (name, address, capacity, stage dimensions, grid height)
  - Technical specs (loading dock, power available, etc.)
  - Contact information
  - Historical notes ("Great load-in, 2hr drive from hotel")
  - Photo storage
  - Search and filter (by city, state, capacity, type)

- ⬜ **Per Diem Calculator**
  - Track per diem by crew member and date
  - Standard per diem rates by city/state
  - Custom per diem rates
  - Meal type tracking (breakfast, lunch, dinner, full day)
  - Currency conversion (for international tours)
  - Export for expense reporting
  - Weekly/monthly summaries

- ⬜ **Equipment Manifests**
  - Packing lists (what equipment goes on tour)
  - Truck packing diagrams
  - Equipment tracking (which truck, which case)
  - Check-in/check-out workflow
  - Damage tracking
  - Replacement tracking
  - Pull from existing fixture/equipment inventory
  - Mark items as "on tour"
  - Conflict detection (item needed in two places)

**Unique Advantage:** Tour manifests pull directly from ShowStack's comprehensive equipment tracking (fixtures, infrastructure, props, etc.)

**Propared Gap:** Propared has limited tour-specific features; ShowStack's tour module is purpose-built
**Effort Estimate:** 8-12 weeks

---

### ⬜ Planned: Production Books & Sharing (Lower Priority)

Web-based information sharing portal for production schedules, notes, rosters, and documents.

**Core Features:**
- ⬜ **Production Book Builder** (6-8 weeks)
  - Cover page (show title, dates, contact info)
  - Production schedule
  - Crew roster with contact information
  - Venue information
  - Technical specifications
  - Equipment lists
  - Notes and instructions
  - Attachments (PDFs, images, documents)

- ⬜ **Web Sharing Portal**
  - Public or password-protected sharing
  - No login required for viewers
  - Mobile-responsive design
  - Real-time updates (when project data changes, portal updates)
  - Embedded calendar (iCal subscription)
  - Download sections as PDF
  - Contact crew directly from roster

- ⬜ **Access Control**
  - Public link (anyone with URL can view)
  - Password-protected (require password to view)
  - Expiration dates (link expires after date)
  - View-only (no editing)

**Note:** Lower priority—can use existing PDF exports initially. Production books provide nice-to-have web sharing but are not essential for core production management.

**Propared Parity:** Full parity with Propared's production books
**Effort Estimate:** 6-8 weeks

---

### ⬜ Planned: Reporting & Analytics

Comprehensive reporting system for budgets, labor, schedules, and production metrics.

**Core Reports:**
- ⬜ **Budget Reports**
  - Budget summary (estimated vs. actual)
  - Variance analysis
  - Department rollup
  - Cost by category
  - Vendor spending report

- ⬜ **Labor Reports**
  - Crew hours summary
  - Overtime report
  - Payroll export (CSV)
  - Labor cost by project
  - Weekly hours by crew member

- ⬜ **Schedule Reports**
  - Production calendar (PDF)
  - Crew call sheet
  - Daily schedule
  - Weekly schedule
  - Conflict report (double-bookings)

- ⬜ **Inventory Reports**
  - Equipment allocation
  - Rental costs
  - Inventory by department
  - Missing/damaged equipment
  - Maintenance schedule

- ⬜ **Tour Reports**
  - Tour schedule
  - Venue contact list
  - Per diem summary
  - Equipment manifest
  - Travel logistics

**Effort Estimate:** 4-6 weeks (ongoing - reports added as features are implemented)

---

### Development Timeline

**Phase 1: Core Production Features** (Year 3, 2027-2028)
- Production Scheduling (8-10 weeks)
- Budget Tracking (6-8 weeks)
- Labor Management (8-10 weeks)
- **Total:** 22-28 weeks (5-7 months)
- **Deliverable:** Production Edition v1.0 with 70% Propared parity

**Phase 2: Enhanced Features** (Year 3-4, 2028)
- Inventory Extensions (6-8 weeks)
- Vendor Management (6-8 weeks)
- Tour Logistics (8-12 weeks)
- **Total:** 20-28 weeks (5-7 months)
- **Deliverable:** Production Edition v2.0 with 90% Propared parity

**Phase 3: Advanced Features** (Year 4+, 2029+)
- Production Books (6-8 weeks)
- Advanced Reporting (4-6 weeks)
- Mobile App (12-16 weeks, optional)
- **Total:** 22-30 weeks (5.5-7.5 months)
- **Deliverable:** Production Edition v3.0 with 100% Propared parity + unique advantages

**Total Development Investment:** 64-86 weeks (16-21 months) for full feature parity

---

### Unique ShowStack Advantages

**1. Technical Design Integration**
- Fixture plot → Equipment list → Shop order → Budget → Schedule
- Labor hours for focus call calculated from fixture count
- Rental costs from shop order feed budget automatically
- Inventory allocation includes technical equipment

**2. Pricing Advantage**
- **ShowStack Production Edition:** $599/year (Lighting + Sound + Video + Production + Tour)
- **Propared alone:** $1,750/user/year (production management only)
- **Cost Savings:** 66% cheaper while offering MORE features

**3. Offline-First Architecture**
- Works fully offline (SQLite database)
- No internet required for day-to-day work
- Fast performance (no cloud latency)
- Data ownership (files on user's machine)

**4. Comprehensive Reporting**
- 12+ technical reports already implemented
- Production reports added to existing system
- Professional PDF export for all documents

**See Also:**
- `docs/features/propared-parity-analysis.md` - Detailed competitive analysis
- `docs/features/migration-production-features.md` - Complete feature specifications

---

## ⭐ Complete Edition

**Price:** $999/year
**Includes:** All 6 feature domains (Lighting + Sound + Video + Production + Tour + Producer)
**Target Users:** Producing organizations, institutions, large production companies

**Status:** Launches with Producer features (Year 4+)

Complete access to all ShowStack features across all professional disciplines. Ideal for:
- Producing theaters and opera companies
- University theater programs
- Large production companies
- Multi-venue organizations

### ⬜ Planned: Producer Features

Portfolio management for producers and general managers. Available in Complete edition only.

- ⬜ **Multi-show Portfolio Management**
  - Season planning
  - Cross-show resource allocation
  - Portfolio dashboard

- ⬜ **Financial Consolidation**
  - Multi-show financial reporting
  - Budget rollups
  - Profitability analysis

- ⬜ **Season Planning**
  - Season calendar
  - Resource planning
  - Conflict detection

- ⬜ **Fundraising Tracking**
  - Donor database
  - Grant tracking
  - Fundraising goals and progress

**Status:** Planned for Year 4+ (2028-2029)
**Effort Estimate:** 16-20 weeks

---

## ⚙️ Core Infrastructure

**Universal features available in all editions**

### 🚧 In Development

#### Telemetry & Analytics - 60% Complete

Privacy-first telemetry system with PostHog integration.

**Completed:**
- ✅ **Telemetry Service** - `src/renderer/src/services/telemetry.ts` (327 lines)
  - Event tracking with localStorage buffering
  - Batch syncing (50 events or 60 seconds)
  - PostHog REST API integration (fetch-based)
  - Privacy-first architecture (opt-in required)
  - Anonymous ID generation (crypto.randomUUID)
  - Session tracking
  - Auto-flush before app close
  - Data retention management (90 days default)

- ✅ **UI Components**
  - `ConsentDialog.tsx` - Full consent dialog implementation
  - `PrivacySettings.tsx` - Privacy settings with telemetry toggles
  - App.tsx integrates telemetry for app lifecycle events

- ✅ **Configuration**
  - Environment variable setup (VITE_POSTHOG_KEY)
  - PostHog setup documentation (`POSTHOG_SETUP.md` - 336 lines)
  - Settings store integration

**Remaining Work:**
- ⬜ **PostHog SDK** - NOT installed (uses raw fetch() instead of posthog-js)
- ⬜ **API Key Configuration** - .env.local needs PostHog project key
- ⬜ **Extended Event Tracking** - Only app_opened/app_closed currently tracked
- ⬜ **Error Tracking** - Beyond console.log
- ⬜ **Performance Metrics** - Placeholder code only
- ⬜ **Analytics Dashboard** - Admin panel integration not implemented

---

### ✅ Completed

#### Licensing System

- ✅ **LicenseService** - `src/main/services/LicenseService.ts`
  - Offline-first validation
  - 14-day grace period without internet
  - Edition-based access control (Lighting, Sound, Video, Designer, Production, Complete)
  - Tier-based features (Professional, Student, Institutional)
  - Background verification (non-blocking)
  - Graceful degradation (read-only on expiration)

- ✅ **License Database** - `src/main/database/appSchema.ts:licenses`
  - License storage in app database
  - Activation tracking
  - Expiration management

- ✅ **License UI** - `src/renderer/src/components/License/`
  - License status banners
  - Edition selector
  - Upgrade prompts
  - Account dialog with license section

- ✅ **License Hooks** - `src/renderer/src/hooks/`
  - `useModuleAccess.ts` - Check edition permissions (Note: May need refactoring to useEditionAccess)
  - `useFeature.ts` - Feature flag access
  - `useEditPermission.ts` - Edit permission checks
  - `useUser.ts` - User info from license

---

#### Settings System

- ✅ **Settings Store** - `src/renderer/src/store/settingsStore.ts`
  - 7 settings sections with full persistence
  - Zustand state management with localStorage
  - Type-safe settings interfaces

- ✅ **Settings Components** - `src/renderer/src/components/settings/`
  - `WorkspacePreferences.tsx` - Theme, UI density, measurement units
  - `EditorSettings.tsx` - Auto-save, undo limits, default values
  - `ProjectDefaults.tsx` - Default values for new projects
  - `ProjectManagement.tsx` - File locations, backups, auto-save interval
  - `PrintSettings.tsx` - Page size, margins, headers/footers
  - `AdvancedSettings.tsx` - Developer mode, telemetry toggles
  - `Collaboration.tsx` - Cloud sync settings (placeholder)

- ✅ **Settings Page** - `src/renderer/src/pages/Settings.tsx`
  - Tabbed interface for 7 sections
  - Real-time updates
  - Persistent state

---

#### User Profile

- ✅ **User Profile Component** - `src/renderer/src/components/account/UserProfile.tsx`
  - Personal information (name, email, company, role, phone)
  - Designer credit for shop orders
  - Profile photo upload
  - Photo stored as base64 in localStorage
  - Auto-save with visual feedback

- ✅ **Account Page** - `src/renderer/src/pages/Account.tsx`
  - User profile section
  - Theme appearance settings
  - License information display
  - Notifications preferences
  - Data privacy settings
  - Advanced settings

---

#### Admin Panel

- ✅ **AdminPanel** - `src/renderer/src/pages/admin/AdminPanel.tsx`
  - Password-protected access (Cmd/Ctrl+Shift+A)
  - License management interface
  - Layout template manager
  - Database management tools
  - Integration settings
  - Audit logging

- ✅ **Password Protection** - `src/renderer/src/components/admin/PasswordPrompt.tsx`
  - bcryptjs password hashing
  - Admin password stored in app database
  - Auto-lock after session

- ✅ **Layout Template Manager** - `src/renderer/src/components/admin/LayoutTemplateManager.tsx`
  - Import/export page layout templates
  - Factory reset to default layouts
  - Template versioning
  - JSON validation

---

#### Theme System

- ✅ **Theme Store** - `src/renderer/src/store/themeStore.ts`
  - Light/dark mode toggle
  - System theme detection
  - Persistent theme preference

- ✅ **Theme Provider** - `src/renderer/src/components/ThemeProvider.tsx`
  - React context for theme
  - Tailwind CSS dark mode classes
  - Real-time theme switching

- ✅ **Theme Constants** - `src/renderer/src/constants/theme.ts`
  - Centralized color palette
  - Edition-specific colors
  - UI pattern definitions

---

#### File Operations

- ✅ **FileService** - `src/main/services/fileService.ts`
  - Export projects as .showstack files
  - Import .showstack files
  - Conflict resolution (prompt user)
  - File validation
  - Recent files tracking

- ✅ **IPC Handlers** - `src/main/ipc/files.ts`
  - `file:open` - Open project file
  - `file:save` - Save project file
  - `file:saveAs` - Save project with new name
  - `file:export` - Export project data
  - `file:import` - Import project data

- ✅ **File Menu** - `src/renderer/src/components/common/FileMenu.tsx`
  - New project
  - Open project
  - Save project
  - Save as...
  - Recent files list
  - Import/export

---

#### Database

- ✅ **Two-Database Architecture** - `src/main/database/index.ts`
  - App Database (`showstack-app.db`): Licenses, settings, templates
  - Project Database (`showstack-projects.db`): All project data
  - App database never exported
  - Project database fully exportable

- ✅ **App Schema** - `src/main/database/appSchema.ts`
  - `licenses` table
  - `app_settings` table (JSON blob)
  - `app_settings_kv` table (key-value pairs)
  - `page_layout_templates` table
  - `page_layout_elements` table

- ✅ **Project Schema** - `src/main/database/projectSchema.ts`
  - `projects` table
  - `fixtures` table (50+ columns)
  - `prep_projects` table (shop orders)
  - `prep_sections` table
  - `prep_equipment_items` table
  - `prep_revisions` table
  - `prep_notes` table
  - `prep_note_templates` table
  - `user_preferences` table

- ✅ **Migration System** - `src/main/database/index.ts`
  - Automatic migrations on app startup
  - Version tracking
  - Safe execution (wrapped in try-catch)
  - Non-blocking migrations

---

#### Window Management

- ✅ **WindowManager** - `src/main/services/WindowManager.ts`
  - Landing window (singleton)
  - Project windows (one per project)
  - Prevent duplicate windows
  - Automatic cleanup on close
  - Focus management

---

#### Splash Screen

- ✅ **SplashScreen** - `src/renderer/src/components/SplashScreen.tsx`
  - App branding
  - Copyright notice
  - License holder display
  - Loading state

---

#### Developer Mode

Full developer mode implementation with DevTools integration.

- ✅ **Developer Mode Toggle** - `src/renderer/src/components/settings/AdvancedSettings.tsx`
  - Settings store integration with developerMode flag
  - Visual feedback in settings UI
  - Per-window DevTools control

- ✅ **IPC Handlers** - `src/main/ipc/settings.ts`
  - `settings:developer-mode-changed` - Opens/closes DevTools for all windows
  - `settings:toggle-devtools` - Toggle DevTools for specific window
  - Menu integration in View menu

- ✅ **Developer Panel** - `src/renderer/src/components/common/DeveloperPanel.tsx`
  - State inspector with JSON display
  - Performance metrics display
  - Log to console functionality
  - Export debug data to JSON
  - Collapsible interface

- ✅ **Hook** - `src/renderer/src/hooks/useDeveloperMode.ts`
  - Access developer mode state from any component

**Future Enhancement:**
- ⬜ **Feature Flag System** - Not yet connected to developer mode

---

## ⬜ Planned Universal Features

**Features planned for all editions**

### Cloud Sync & Collaboration

**Status:** UI mockups only (2% complete) - No backend implementation

- ⬜ **Backend API** - Express.js + PostgreSQL
- ⬜ **Real-time Sync** - Socket.io or WebSocket integration
- ⬜ **Conflict Resolution** - Automatic merge or manual resolution
- ⬜ **File Storage** - AWS S3 or Cloudflare R2 for assets
- ⬜ **Team Collaboration** - Multi-user access, permissions

**Existing UI Mockups (Non-functional):**
- `IntegrationSettings.tsx` - Cloud storage toggle UI, provider selection
- `Collaboration.tsx` - Placeholder settings panel
- All backend functions are TODO stubs

**See Strategic Urgency section below for collaboration decision framework**

---

### User Authentication

**Status:** UI placeholder only (2% complete) - Login page bypasses auth

- ⬜ **JWT Authentication** - jsonwebtoken package not installed
- ⬜ **Authentication Service** - No auth backend
- ⬜ **Session Management** - No session tracking
- ⬜ **Password Hashing** - For user credentials (bcryptjs only used for admin password)
- ⬜ **User Registration** - No registration flow
- ⬜ **Password Reset** - No reset functionality

**Existing UI (Non-functional):**
- `Login.tsx` - Login form with "Skip login (development)" that bypasses everything
- handleLogin() just navigates to /modules without validation

**Note:** License system (LicenseService.ts) handles feature access control but is NOT user authentication

---

### Testing & Quality

**Status:** Not implemented (0% complete)

- ⬜ **Unit Tests** - Vitest test suite
- ⬜ **Component Tests** - React Testing Library
- ⬜ **Integration Tests** - End-to-end critical flows
- ⬜ **E2E Tests** - Playwright user journeys
- ⬜ **Performance Tests** - Load testing with 10k+ fixtures

**Current State:** Zero test files in src/ directory, no testing framework installed

---

### Documentation

- ⬜ **User Manual** - Comprehensive user guide
- ⬜ **Video Tutorials** - Feature walkthrough videos
- ⬜ **API Documentation** - IPC handler reference
- ⬜ **Plugin System Docs** - For future extensibility

---

## 🏆 Competitive Positioning vs Lightwright

**Analysis Date:** December 26, 2024
**Lightwright Platform:** New platform announced Dec 2025, launching January 2026

### ShowStack Competitive Advantages

| Category | ShowStack Advantage | Strategic Value |
|----------|-------------------|-----------------|
| **Infrastructure Management** | Comprehensive tracking for network, audio, video, data distribution with 5 dedicated reports + port-level management | **MAJOR** - Lightwright only covers power/cable |
| **Shop Order System** | Full Prep module for equipment lists, notes, revisions, professional PDFs | **MAJOR** - Unique to ShowStack, Lightwright has no equivalent |
| **Visual Template Designer** | Drag-and-drop layout designer for headers and shop orders with live preview | **MODERATE** - More advanced than Lightwright's customization |
| **Paperwork Customization** | Phase 1 (presets) + Phase 2 (visual editor) for headers | **MODERATE** - Matches/exceeds Lightwright's "re-imagined paperwork" |
| **Dimmer Rack Management** | Module-level configuration with rack identifiers, mixed module types | **MODERATE** - Not mentioned in Lightwright features |
| **Pricing Model** | One-time purchase option | **DEBATABLE** - Different from Lightwright's subscription model |
| **Modern Tech Stack** | Electron + React + TypeScript, cross-platform | **MODERATE** - Future-proof architecture |
| **Multi-Discipline Support** | Unified platform for Lighting + Sound + Video + Production | **MAJOR** - Lightwright is lighting-only |

### Critical Feature Gaps to Address

| Priority | Feature | Lightwright Status | Impact | Effort Estimate |
|----------|---------|-------------------|--------|----------------|
| **🔴 HIGH** | Real-time multi-user collaboration | ✅ Core new feature | Market differentiator | 12-16 weeks |
| **🟡 MEDIUM-HIGH** | MVR export | ✅ Implemented | Industry standard | 6-8 weeks |
| **🟡 MEDIUM** | Console integration (OSC) | ✅ ETC Eos, grandMA | Professional workflow | 8-12 weeks |
| **🟡 MEDIUM** | Vectorworks XML sync | ✅ Implemented | CAD integration | 8-12 weeks |
| **🟢 LOW-MEDIUM** | Roll printer support | ✅ Direct support | Specialized hardware | 4-6 weeks |
| **🟢 LOW** | Circuit breaker labels | ✅ Dedicated functionality | Niche feature | 2-3 weeks |

### Feature Parity Status

| Category | ShowStack | Lightwright New Platform | Parity Status |
|----------|-----------|-------------------------|---------------|
| Fixture Management | ✅ Full | ✅ Full | ✅ **PARITY** |
| Paperwork Generation | ✅ 12 reports | ✅ Multiple reports | ✅ **PARITY** |
| Infrastructure Tracking | ✅ **Advanced** | ⚠️ Power/cable only | 🚀 **ADVANTAGE** |
| Customizable Headers | ✅ Visual designer | ✅ Customization | ✅ **PARITY+** |
| Error Checking | ⚠️ Partial | ✅ Full | ⚠️ **GAP** |
| Dark Mode | ✅ Full | ✅ Native | ✅ **PARITY** |
| Database | ✅ SQLite | ✅ Not disclosed | ✅ **PARITY** |
| Multi-user Collaboration | ❌ | ✅ **Real-time** | ❌ **CRITICAL GAP** |
| MVR Export | ❌ | ✅ Implemented | ❌ **GAP** |
| Console Integration | ❌ | ✅ OSC protocol | ❌ **GAP** |
| CAD Integration | ❌ | ✅ Vectorworks XML | ❌ **GAP** |
| Shop Orders | ✅ **Full module** | ❌ None | 🚀 **UNIQUE** |
| Multi-Discipline | ✅ **6 domains** | ❌ Lighting only | 🚀 **UNIQUE** |

### Recommended Development Priorities

#### **Phase 1: Industry Standards** (6-8 weeks)
1. MVR export support - table stakes for professional workflows
2. Enhanced error checking - overlapping patches, overloaded dimmers, missing data
3. Basic console integration (OSC protocol for ETC Eos)

#### **Phase 2: Advanced Integration** (8-12 weeks)
1. Vectorworks XML integration
2. Power distribution diagrams/visualization
3. Additional console support (grandMA parameters)

#### **Phase 3: Collaboration** (12-16 weeks) - Strategic Decision Required
- Multi-user real-time collaboration (requires cloud backend)
- WebSocket infrastructure
- Conflict resolution system
- Cloud sync architecture

#### **Phase 4: Polish & Professional Features** (6-8 weeks)
1. Roll printer support
2. Circuit breaker label functionality
3. Advanced cable management visualization

### Strategic Recommendations

1. **Lean into unique strengths**: Market Prep module, comprehensive infrastructure tracking, and multi-discipline support - these are ShowStack's differentiators
2. **Address MVR urgently**: Industry standard format, shouldn't be complex to implement
3. **Collaboration decision**: Major architectural shift required - evaluate if local-first or cloud-first is core strategy
4. **Console integration**: Opens professional theater market
5. **Pricing advantage**: Position as "own it outright" alternative to Lightwright's subscription model
6. **Multi-discipline positioning**: Only platform offering unified lighting + sound + video + production

---

## 🎙️ User Feedback

**Session Date:** December 27, 2024

This section preserves user feedback for historical reference. **Action items from this feedback have been incorporated into the appropriate edition sections above.**

### 🔴 CRITICAL: Multi-User Collaboration Workflow

**Problem**: Current architecture doesn't support common workflow where multiple people work on same project by passing file back and forth (via email, Dropbox, etc.)

**Impact**: **URGENT** - Lightwright's new platform has native cloud collaboration. This is now a competitive requirement.

**Proposed Solutions:**
- **Option A (Quick)**: File-based merge/reconciliation system (4-6 weeks)
  - Import/compare two .showstack files
  - Side-by-side diff of changes
  - Selective merge capability
  - No backend required, offline-first
- **Option B (Medium)**: Change tracking with conflict detection (8-10 weeks)
  - Change log in database
  - Export includes change history
  - Automatic conflict detection
  - Manual resolution UI
- **Option C (Full)**: Real-time cloud collaboration (16-20 weeks)
  - Complete backend rewrite
  - WebSocket-based sync
  - Operational Transformation or CRDT
  - Requires subscription model

**Recommendation**: Start with Option A to ship quickly, evaluate Option C based on market response.

**Related Issues**: #33

**Status**: ✅ Incorporated into Planned Universal Features → Cloud Sync & Collaboration

---

### Equipment Manager, Label Designer, Power Management, and Paperwork Enhancements

All specific enhancement requests have been incorporated into the **Lighting Edition** section above under "In Development" and "Planned" subsections.

---

### Unified Visual Editor System

Incorporated into **Lighting Edition → Planned** section above.

---

### Maintenance Menu System

Incorporated into **Lighting Edition → Planned** section above.

---

### UI/UX Improvements

Incorporated into **Lighting Edition → Planned** section above.

---

## 🚨 Strategic Urgency: Cloud Collaboration

**Context**: Lightwright's January 2026 launch includes native cloud collaboration as flagship feature. This fundamentally changes market expectations.

**Decision Point**: ShowStack must choose positioning:

### Option 1: "Own It Outright" (Current Strategy)
- Maintain offline-first, file-based architecture
- Implement file merge/reconciliation (Option A above)
- Position as "no subscription, own your data" alternative
- **Pros**: Unique market position, no backend costs, faster to market
- **Cons**: Perceived as "outdated" vs Lightwright's cloud features

### Option 2: "Cloud-Enabled Pro" (Strategic Pivot)
- Implement real-time collaboration (Option C above)
- Requires subscription model for infrastructure costs
- Compete head-to-head with Lightwright
- **Pros**: Feature parity, modern positioning
- **Cons**: 16-20 week development, operational costs, subscription pricing

### Recommended Hybrid Approach
1. **Immediate (4-6 weeks)**: Ship Option A (file merge) to address workflow pain
2. **Evaluate (Month 2-3)**: Gather user feedback on collaboration needs
3. **Strategic Decision (Month 3)**: Choose Option 1 or Option 2 based on:
   - User demand for real-time collaboration
   - Willingness to pay subscription
   - Competitive pressure from Lightwright adoption
   - Available development resources

**Timeline Pressure**: Lightwright launches January 2026 (4 weeks from now). Quick action needed.

---

## 📝 Notes

### Architecture Decisions
- **Offline-first**: All data stored locally in SQLite (sql.js)
- **Unified application**: Single app with license-based edition access
- **Two-database approach**: App DB (never exported) + Project DB (exportable)
- **Electron + React**: Cross-platform desktop with modern web tech
- **Zustand over Redux**: Simpler state management
- **TypeScript strict mode**: Full type safety throughout

### Edition Structure
- **Six Feature Domains**: Lighting, Sound, Video, Production, Tour, Producer
- **Six Professional Editions**: Lighting, Sound, Video, Designer, Production, Complete
- **License-Based Activation**: Features unlocked via license key, UI only shows licensed features
- **Data Preservation**: Project files contain all data; visible features depend on edition license

### Known Limitations
- **No cloud sync yet**: Planned for future release
- **No testing suite**: Needs to be built
- **Limited telemetry**: Basic implementation, needs expansion
- **Fixture management incomplete**: Core features in progress

### Breaking Changes Log
- None yet (still in alpha)

---

**For detailed implementation plans, see:**
- [Naming & Editions Guide](docs/architecture/naming-and-editions.md)
- [Migration to Unified Licensing](docs/architecture/migration-unified-licensing.md)
- [Sound Features Specification](docs/features/migration-sound-features.md)
- [Minotaur Parity Analysis](docs/features/minotaur-parity-analysis.md)
- [Architecture Guide](docs/development/ARCHITECTURE.md)
- [Technical Specification](docs/business/technical-spec.md)

---

## 📚 References

- [Lightwright Platform Overhaul Announcement](https://www.usitt.org/news/lightwright-unveils-historic-platform-overhaul-introducing-real-time-collaboration-a-new-era-of-data-management)
- [Lightwright New Features | Live Design](https://www.livedesignonline.com/b2b-experience/lightwright-unveils-historic-platform-overhaul-introducing-real-time-collaboration)
- [Lightwright Official Site](https://www.lightwright.com/)

---

**Last Updated:** December 28, 2024 by Claude Code
