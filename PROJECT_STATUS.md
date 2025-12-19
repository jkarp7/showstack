# ShowStack Project Status

**Last Updated:** December 18, 2024
**Current Version:** 0.1.0-alpha
**Development Phase:** Alpha

This document tracks the development status of all ShowStack features and modules. It serves as the central source of truth for what's completed, in progress, and planned.

---

## 📊 Overall Progress

| Module | Status | Completion |
|--------|--------|------------|
| ShowStack:Production | 🚧 In Progress | 70% |
| Core Infrastructure | ✅ Complete | 100% |
| ShowStack:Manager | ⬜ Planned | 0% |

---

## 🚧 ShowStack:Production Module

The Production module is a comprehensive lighting production suite that includes fixture management, shop orders, and paperwork generation - a modern alternative to LightWright 6.

### ✅ Completed: Shop Order Tool

Complete shop order and equipment specification builder with professional PDF output.

#### Core Functionality
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
  - Collapse/expand sections

- ✅ **Revision Tracking** - `src/renderer/src/components/prep/RevisionPanel.tsx`
  - Up to 5 revisions per project
  - Automatic change detection (added, modified, removed items)
  - Revision metadata (date, author, notes)
  - Visual diff indicators in equipment table
  - Revision summary export

- ✅ **Notes System** - `src/renderer/src/components/prep/NotesPanel.tsx`
  - 3-tier notes: General Conditions, General Notes, Fixture Notes
  - Rich text formatting
  - Note templates (save/load common notes)
  - Notes export to print output

#### Print & Export
- ✅ **Print Builder** - `src/renderer/src/components/prep/PrintBuilder.tsx`
  - Drag-and-drop section arrangement
  - 11 section types: cover, project details, venue info, schedule, contacts, equipment by section, equipment summary, notes, revision summary, custom text, page breaks
  - Section enable/disable toggles
  - Page settings (size, orientation, margins, headers/footers)
  - Template save/load system
  - Default templates with smart page breaks

- ✅ **Print Preview** - `src/renderer/src/components/prep/PrintPreview.tsx`
  - Live page rendering with actual data
  - Page-by-page navigation
  - Scaling for viewport fit
  - Settings panel for configuration

- ✅ **Page Renderer** - `src/renderer/src/components/prep/PageRenderer.tsx`
  - Grid-based layout system
  - Data field rendering with placeholders
  - Text alignment support
  - Shape elements (rectangles, lines)
  - Margin guides

- ✅ **PDF Export** - `src/main/ipc/prep.ts:prep:exportPDF`
  - Print-ready PDF generation
  - Electron printToPDF API
  - Configurable page settings
  - Custom filename support

- ✅ **Direct Printing** - `src/main/ipc/prep.ts:prep:print`
  - Native OS print dialog
  - Same HTML as PDF export
  - Configurable settings

#### Data Management
- ✅ **Project Creation** - `src/renderer/src/components/prep/NewPrepProjectDialog.tsx`
  - Production name, order date
  - Discipline selection
  - Linked to parent project
  - Logo inheritance from parent

- ✅ **Venue & Scheduling**
  - Venue information (city, state, contact)
  - Comprehensive date tracking:
    - Prep start/complete dates
    - Load-in, focus, tech rehearsal dates
    - Dress rehearsal, opening, closing dates
    - Strike date

- ✅ **Contact Management**
  - GM, PM, LD, ALD, Production Electrician
  - Phone and email for each contact
  - Company information

- ✅ **Logo Integration**
  - Company/project logo upload
  - Logo display on cover pages
  - Fallback to parent project logo

- ✅ **File Operations** - `src/main/services/prepFileService.ts`
  - Export shop orders as part of .showstack files
  - Import shop orders from .showstack files
  - Conflict resolution on import
  - Recent files tracking

#### Database
- ✅ **Shop Order Schema** - `src/main/database/projectSchema.ts`
  - `prep_projects` table
  - `prep_sections` table
  - `prep_equipment_items` table
  - `prep_revisions` table (up to 5 revisions)
  - `prep_notes` table (3 tiers)
  - `prep_note_templates` table

- ✅ **Default Page Layouts** - `src/main/database/defaultLayouts/`
  - Cover page layout (JSON)
  - Contacts page layout (JSON)
  - Equipment by section layout (JSON)
  - Notes page layout (JSON)
  - Revision summary layout (JSON)
  - Seeding scripts for default templates

- ✅ **Query Functions** - `src/main/database/queries/prep.ts`
  - CRUD operations for all shop order entities
  - Revision management
  - Notes management
  - Template management

---

### 🚧 In Development: Fixture Management (Equipment Manager)

Core fixture database and virtual grid for managing lighting plots.

#### Completed Components
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

#### In Development
- 🚧 **Add Fixture Dialog** - `src/renderer/src/components/fixture/AddFixtureDialog.tsx`
  - Status: Dialog exists but incomplete
  - Needs: All field types, validation, manufacturer auto-complete

- 🚧 **Bulk Edit Dialog** - `src/renderer/src/components/fixture/BulkEditDialog.tsx`
  - Status: Basic UI
  - Needs: Multi-field editing, undo/redo

- 🚧 **Column Visibility Menu** - `src/renderer/src/components/fixture/ColumnVisibilityMenu.tsx`
  - Status: Basic toggle UI
  - Needs: Column reordering, presets, user column configurations

#### Pending Tasks
- ⬜ **Auto-complete System** - Manufacturer, type, color, gobo
- ⬜ **Undo/Redo System** - Command pattern implementation
- ⬜ **DMX Conflict Detection** - Highlight conflicts in grid
- ⬜ **Paperwork Export Headers** - Customizable headers for exported paperwork including:
  - Show name
  - Company/project logo
  - Designer info (name, email, phone)
  - Venue info (name, city, state)
  - Paperwork title (custom per export)

---

### ⬜ Planned: Label Designer

Drag-and-drop label creation for various printer types.

- ⬜ **Label Designer Page** - `src/renderer/src/pages/modules/LabelDesigner.tsx`
  - Drag-and-drop label layout
  - Custom label templates
  - Data field placement
  - Barcode/QR code support
  - Multiple label sizes (Dymo, Brother, Zebra)
  - Preview and print

---

### ⬜ Planned: Paperwork Generator

Custom report and paperwork templates.

- ⬜ **Paperwork Page** - `src/renderer/src/pages/modules/Paperwork.tsx`
  - Custom report templates
  - Magic sheets
  - Channel hookups
  - Instrument schedules
  - Dimmer schedules
  - Circuit layouts
  - Color schedules
  - Accessory schedules

---

### ⬜ Planned: Vectorworks Integration

Import/export fixtures from Vectorworks with reconciliation.

- ⬜ **Vectorworks Import/Export**
  - XML import from Vectorworks
  - Reconciliation workflow (detect changes)
  - Export back to Vectorworks
  - Field mapping configuration

---

### ⬜ Planned: Console Integration

ETC Eos console communication via OSC.

- ⬜ **ETC Eos Integration**
  - OSC communication library (osc-js)
  - Patch import from console
  - Send patch updates to console
  - Channel number sync
  - Fixture type mapping

---

### ✅ Completed: Power Management

Comprehensive power distribution tracking and management system.

#### Core Functionality
- ✅ **Power Rack Management** - `src/renderer/src/components/power/RackManager.tsx`
  - Dimmer rack configuration with circuit counts, voltage, module types
  - PD (power distribution) rack management with dual-voltage support
  - Rack identifier system for auto-linking
  - Per-rack capacity tracking

- ✅ **Module Configuration** - `src/renderer/src/components/power/ModuleConfigDialog.tsx`
  - Configure mixed module types per dimmer rack
  - Module types: dimmer, relay, constant current, thrupower
  - Per-circuit wattage specifications
  - Circuit range assignments

- ✅ **Power Summary Panel** - `src/renderer/src/components/power/PowerSummaryPanel.tsx`
  - Real-time power utilization tracking
  - Per-rack load and capacity visualization
  - Circuit usage counts (used/total)
  - Color-coded warnings (80% = warning, 100% = critical)
  - Phase balance monitoring with imbalance alerts

- ✅ **Auto-linking System** - `src/renderer/src/utils/circuitParser.ts`
  - Automatic fixture-to-rack linking based on circuit identifiers
  - Parse circuit names (e.g., "FOH-A", "DECK-B")
  - Match to rack identifiers
  - Updates on page load and circuit changes

- ✅ **Power Calculations** - `src/renderer/src/utils/powerCalculations.ts`
  - Per-module capacity calculations
  - Total load by rack and phase
  - Utilization percentages
  - Phase balance calculations
  - Warning generation for overcapacity and imbalance

#### Database Schema
- ✅ **Power Tables** - `src/main/database/projectSchema.ts`
  - `dimmer_racks` table with module configuration support
  - `pd_racks` table with dual-voltage support
  - `dimmer_rack_modules` table for per-circuit specifications
  - Power rack assignment columns in `fixtures` table

#### Pending Enhancements
- ⬜ **Cable Run Visualization** - Visual cable path layout
- ⬜ **Advanced Phase Balancing** - Automatic phase assignment suggestions
- ⬜ **Power Distribution Reports** - Printable rack schedules and load reports

---

### ⬜ Planned: Advanced Features

Additional production tools.

- ⬜ **Multi-cable Tracking** - Track multi-cable runs, breakouts
- ⬜ **Error Checking** - DMX conflicts, power overloads, duplicate channels
- ⬜ **DMX Map Visualization** - Visual DMX universe layout
- ⬜ **Focus Charts** - Custom focus chart generation
- ⬜ **Work Notes** - Tracking installation notes, issues, changes

---

## ✅ COMPLETED: Core Infrastructure

### Licensing System
- ✅ **LicenseService** - `src/main/services/LicenseService.ts`
  - Offline-first validation
  - 14-day grace period without internet
  - Module-based access control (Production, Manager)
  - Tier-based features (Professional, Student, Institutional)
  - Background verification (non-blocking)
  - Graceful degradation (read-only on expiration)

- ✅ **License Database** - `src/main/database/appSchema.ts:licenses`
  - License storage in app database
  - Activation tracking
  - Expiration management

- ✅ **License UI** - `src/renderer/src/components/License/`
  - License status banners
  - Module selector
  - Upgrade prompts
  - Account dialog with license section

- ✅ **License Hooks** - `src/renderer/src/hooks/`
  - `useModuleAccess.ts` - Check module permissions
  - `useFeature.ts` - Feature flag access
  - `useEditPermission.ts` - Edit permission checks
  - `useUser.ts` - User info from license

### Settings System
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

### User Profile
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

### Admin Panel
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

### Theme System
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
  - Module-specific colors
  - UI pattern definitions

### File Operations
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

### Database
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

### Window Management
- ✅ **WindowManager** - `src/main/services/WindowManager.ts`
  - Landing window (singleton)
  - Project windows (one per project)
  - Prevent duplicate windows
  - Automatic cleanup on close
  - Focus management

### Splash Screen
- ✅ **SplashScreen** - `src/renderer/src/components/SplashScreen.tsx`
  - App branding
  - Copyright notice
  - License holder display
  - Loading state

---

## ⬜ PLANNED: ShowStack:Manager Module

Production logistics and budgeting tools.

- ⬜ **Manager Page** - `src/renderer/src/pages/modules/Manager.tsx`
  - Tour calendar
  - Venue database
  - Budget tracking
  - Per diem calculator
  - Crew roster management
  - Equipment inventory tracking
  - Vendor contact management
  - Multi-show coordination

---

## ⬜ PLANNED: Future Enhancements

### Cloud Sync (Optional)
- ⬜ **Backend API** - Express.js + PostgreSQL
- ⬜ **Real-time Sync** - Socket.io integration
- ⬜ **Conflict Resolution** - Automatic merge or manual resolution
- ⬜ **File Storage** - AWS S3 or Cloudflare R2 for assets
- ⬜ **User Authentication** - JWT-based auth
- ⬜ **Team Collaboration** - Multi-user access, permissions

### Telemetry & Analytics
- ⬜ **Telemetry System** - See `docs/planning/TELEMETRY_DEVMODE_IMPLEMENTATION.md`
  - PostHog integration
  - Privacy-first approach (opt-in, anonymous)
  - Usage analytics
  - Error tracking
  - Performance metrics
  - Analytics dashboard in admin panel

### Developer Features
- ⬜ **Developer Mode Enhancements** - See `docs/planning/TELEMETRY_DEVMODE_IMPLEMENTATION.md`
  - Electron DevTools integration
  - Debug panels
  - State inspector
  - Performance metrics
  - Feature flag system

### Testing & Quality
- ⬜ **Unit Tests** - Vitest test suite
- ⬜ **Component Tests** - React Testing Library
- ⬜ **Integration Tests** - End-to-end critical flows
- ⬜ **E2E Tests** - Playwright user journeys
- ⬜ **Performance Tests** - Load testing with 10k+ fixtures

### Documentation
- ⬜ **User Manual** - Comprehensive user guide
- ⬜ **Video Tutorials** - Feature walkthrough videos
- ⬜ **API Documentation** - IPC handler reference
- ⬜ **Plugin System Docs** - For future extensibility

---

## 🎯 Current Development Priorities

### Immediate (Next 2 Weeks)
1. Add customizable headers to Equipment Manager paperwork exports
2. Implement auto-complete for manufacturer, type, color, gobo
3. Add undo/redo system
4. Implement DMX conflict detection

### Short-term (Next 1-2 Months)
1. Complete Label Designer module
2. Build advanced Paperwork Generator templates
3. Add power distribution printable reports
4. Implement CSV import/export with field mapping

### Medium-term (Next 3-6 Months)
1. Vectorworks integration
2. ETC Eos console integration
3. Cloud sync infrastructure
4. Beta release with 10+ testers

### Long-term (6-12 Months)
1. ShowStack:Manager module
2. Advanced features (focus charts, work notes)
3. Public launch at USITT or LDI
4. Paid customer acquisition (target: 100+ customers)

---

## 📝 Notes

### Architecture Decisions
- **Offline-first**: All data stored locally in SQLite (sql.js)
- **Module-based**: Separate modules with independent licensing
- **Two-database approach**: App DB (never exported) + Project DB (exportable)
- **Electron + React**: Cross-platform desktop with modern web tech
- **Zustand over Redux**: Simpler state management
- **TypeScript strict mode**: Full type safety throughout

### Module Structure
- **Production Module**: Includes Shop Order tool, Fixture Management, Label Designer, Paperwork Generator
- **Manager Module**: Separate logistics and budgeting tools
- **Licensing**: Module-based (Production, Manager) with tier-based features (Professional, Student, Institutional)

### Known Limitations
- **No cloud sync yet**: Planned for future release
- **No testing suite**: Needs to be built
- **No telemetry**: Planned, privacy-first approach
- **Fixture management incomplete**: Core features in progress

### Breaking Changes Log
- None yet (still in alpha)

---

**For detailed implementation plans, see:**
- [Telemetry & DevMode Plan](docs/planning/TELEMETRY_DEVMODE_IMPLEMENTATION.md)
- [Architecture Guide](docs/development/ARCHITECTURE.md)
- [Technical Specification](docs/business/technical-spec.md)

---

**Last Updated:** December 10, 2024 by Claude Code
