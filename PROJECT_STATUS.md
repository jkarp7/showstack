# ShowStack Project Status

**Last Updated:** December 26, 2024
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

- ✅ **Add Fixture Dialog** - `src/renderer/src/components/fixture/AddFixtureDialog.tsx`
  - Full fixture creation form with all 68+ fields
  - Input validation and type checking
  - Integration with fixture store

- ✅ **Bulk Edit Dialog** - `src/renderer/src/components/fixture/BulkEditDialog.tsx`
  - Comprehensive field coverage (30+ editable fields)
  - 7 collapsible sections (Basic, Control, Power, Color/Accessories, Location, Focus, Other)
  - Typed inputs (number, dropdown, textarea) with validation
  - Enhanced auto-numbering supporting 6 fields (channel, address, unit, position, circuit, dimmer)
  - Multi-fixture editing with field-level control

- ✅ **Column Visibility Menu** - `src/renderer/src/components/fixture/ColumnVisibilityMenu.tsx`
  - Toggle column visibility with persistent user preferences
  - Fixture and infrastructure column configurations
  - Project-scoped preference storage
  - Real-time column show/hide updates

#### Core Features Completed
- ✅ **Undo/Redo System** - `src/renderer/src/store/undoRedoStore.ts`
  - Command pattern implementation for all fixture and infrastructure operations
  - Keyboard shortcuts (Cmd+Z undo, Cmd+Shift+Z redo)
  - Menu integration with dynamic enable/disable states
  - 100-item history limit with automatic trimming
  - History clearing on project changes
  - Commands: Add, Update, Delete, Bulk Update, Bulk Delete (fixtures + infrastructure)
  - Ref-based event handlers to prevent listener duplication
  - React.StrictMode disabled to prevent double-mounting issues in development

#### Core Features In Development
- ✅ **Paperwork Generator & Headers** - Customizable report generation with headers (Phase 1 & 2 complete)
- 🚧 **Label Designer** - Drag-and-drop label creation for equipment/cables

#### Future Enhancements
- 💡 **Auto-complete System** - Manufacturer, type, color, gobo database (deferred - requires extensive fixture database)
- 💡 **DMX Conflict Detection** - Highlight conflicts in grid (waiting for Vectorworks integration)

---

### 🚧 In Development: Label Designer (75% Complete)

Drag-and-drop label creation for various printer types with HTML5 Canvas.

- ✅ **Label Designer Page** - `src/renderer/src/pages/modules/LabelDesigner.tsx` (1,182 lines)
  - ✅ Drag-and-drop label layout with canvas-based WYSIWYG editor
  - ✅ Drawing tools: text, rectangle, circle, line
  - ✅ Template system: cable, circuit, fixture, dimmer labels
  - ✅ Custom label designs with save/load (localStorage)
  - ✅ Avery template support (5 predefined templates)
  - ✅ Printer type selection (Dymo, Brother, Zebra, Avery sheets)
  - ✅ Batch printing mode
  - ✅ Element inspector with property editing
  - ⬜ **PDF export** - handleExportLabels() needs implementation
  - ⬜ **Actual printing** - handlePrintLabels() needs IPC integration
  - ⬜ **Barcode/QR code generation** - Mentioned but not implemented
  - ⬜ **Printer driver integration** - No direct printer communication

---

### ✅ Completed: Paperwork Generator (Phase 1 & 2)

Custom report and paperwork templates with fully customizable headers using visual layout designer.

#### Core Reports
- ✅ **Paperwork Page** - `src/renderer/src/pages/modules/Paperwork.tsx`
  - **Fixture Reports (7)**: Channel hookup, dimmer schedule, circuit list, DMX addresses, power summary, color schedule, gobo schedule
  - **Infrastructure Reports (5)**: Equipment list, network summary, port assignments, power consumption, location map
  - Batch export to PDF
  - Batch print functionality
  - Page setup configuration (size, orientation, margins)
  - Custom report templates with save/load

#### Phase 1: Preset-Based Headers
- ✅ **HeaderRenderer** - `src/renderer/src/components/paperwork/HeaderRenderer.tsx`
  - 5 predefined layout presets (Standard, Minimal, Detailed, Logo-Focused, Custom)
  - Field toggle system (17 available fields)
  - Custom title support
  - Per-project persistence

- ✅ **HeaderLayoutSelector** - `src/renderer/src/components/paperwork/HeaderLayoutSelector.tsx`
  - Preset dropdown selection
  - Field checkboxes for custom layouts
  - Live preview integration

#### Phase 2: Visual Layout Designer
- ✅ **PaperworkHeaderDesigner** - `src/renderer/src/components/paperwork/PaperworkHeaderDesigner.tsx`
  - Wrapper around Prep's LayoutDesigner
  - 12-column × 8-row grid for compact headers
  - Drag-and-drop element positioning
  - Real-time preview with project data

- ✅ **HeaderFromTemplate** - `src/renderer/src/components/paperwork/HeaderFromTemplate.tsx`
  - Renders headers from visual templates
  - Uses PageRenderer from Prep module
  - Supports all 17 paperwork data fields

- ✅ **Data Field Mapper** - `src/renderer/src/utils/paperwork/dataFieldMapper.ts`
  - Maps paperwork data to Prep template format
  - Calculates fixture summaries (count, wattage, amperage, universes, types)
  - Calculates infrastructure summaries (9 metrics including port counts, equipment by category)
  - Automatic date formatting

#### Available Data Fields (17 total)
- **Report Fields**: report_title, revision_date, generated_date
- **Fixture Summaries**: total_fixtures, total_wattage, total_amperage, universe_count, fixture_type_count
- **Infrastructure Summaries**: total_infrastructure, network_equipment_count, audio_equipment_count, video_equipment_count, data_distribution_count, total_ports, active_infrastructure, inactive_infrastructure

#### Database Integration
- ✅ **Default Template** - `src/main/database/defaultLayouts/paperwork-header_default_layout.json`
  - Professional default layout with standard elements
  - Automatic migration adds to existing databases
  - Appears in admin panel layout template manager

- ✅ **Template System Integration**
  - Templates stored in app database
  - Edit/export/import via admin panel
  - Toggle between simple (Phase 1) and advanced (Phase 2) editors

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

### ✅ Completed: Infrastructure Equipment Management

Comprehensive tracking system for network equipment, data distribution, audio/video infrastructure with port assignment management.

#### Core Functionality
- ✅ **Infrastructure Equipment Tracking** - `src/renderer/src/pages/modules/EquipmentManager.tsx`
  - Infrastructure tab in Equipment Manager
  - Add, edit, delete infrastructure equipment
  - Multi-select with bulk operations
  - Double-click to edit equipment
  - Category-based organization (network, data distribution, audio, video)

- ✅ **Port Assignment Management** - `src/renderer/src/components/infrastructure/PortAssignmentEditor.tsx`
  - Dynamic port count configuration (0-128 ports)
  - Per-port detailed configuration:
    - Port number and connection tracking
    - Port types (ethernet, dmx, fiber, power, other)
    - VLAN assignment for network ports
    - Port status (active, inactive, error)
    - Per-port notes
  - Collapsible port detail views
  - Expand/collapse all functionality

- ✅ **Equipment Dialogs** - `src/renderer/src/components/infrastructure/`
  - `AddInfrastructureDialog.tsx` - Full equipment creation form
  - `EditInfrastructureDialog.tsx` - Edit existing equipment with pre-populated data
  - Comprehensive field support:
    - Core: name, manufacturer, model, quantity, category
    - Network: IP address, MAC address, subnet, gateway, VLAN, hostname
    - Power: voltage, amperage, wattage, phase
    - Power rack linking (dimmer/PD racks)
    - Location: location name, X/Y/Z coordinates
    - Notes and status tracking

- ✅ **Column Visibility System** - `src/renderer/src/components/infrastructure/InfrastructureColumnVisibilityMenu.tsx`
  - 17 configurable columns organized by category
  - Grouped visibility toggles (Network, Ports, Power, Location)
  - Expandable column groups
  - Persistent column preferences

- ✅ **Infrastructure Toolbar** - `src/renderer/src/components/infrastructure/InfrastructureToolbar.tsx`
  - Add equipment button
  - Delete selected with count display
  - Deselect all function
  - Column visibility menu integration

#### Database Schema
- ✅ **Infrastructure Table** - `src/main/database/projectSchema.ts:infrastructure_equipment`
  - 33 columns covering all equipment attributes
  - JSON storage for port assignments
  - Port count tracking
  - Power rack linking support
  - Location coordinates
  - Full migration system with backward compatibility

- ✅ **Query Functions** - `src/main/database/queries/infrastructure.ts`
  - `getAllInfrastructure()` - Retrieve all equipment with JSON parsing
  - `createInfrastructure()` - Create new equipment with validation
  - `updateInfrastructure()` - Update equipment with selective field updates
  - `deleteInfrastructure()` - Single equipment deletion
  - `deleteMultipleInfrastructure()` - Batch deletion
  - Proper undefined to null conversion for SQL.js compatibility

- ✅ **IPC Integration** - `src/main/ipc/infrastructure.ts`
  - Full CRUD IPC handlers
  - Error handling and logging
  - Integration with infrastructure store

#### State Management
- ✅ **Infrastructure Store** - `src/renderer/src/store/infrastructureStore.ts`
  - Zustand-based state management
  - Equipment loading and caching
  - Add/update/delete operations
  - File dirty flag integration
  - Error handling and logging

- ✅ **Type Definitions** - `src/renderer/src/types/infrastructure.ts`
  - `PortAssignment` interface with full typing
  - `InfrastructureEquipment` interface
  - Column configuration types

#### Integration
- ✅ **Equipment Manager Integration**
  - Three-tab interface: Fixtures | Infrastructure | Power Racks
  - Seamless tab switching
  - Shared selection patterns
  - Consistent UI/UX with fixture management
  - Dark mode support throughout

#### Pending Enhancements
- ⬜ **Port Linking** - Link ports to fixtures or other infrastructure
- ⬜ **Port Usage Tracking** - Track which ports are actively in use
- ⬜ **Port Validation** - IP address, VLAN range validation
- ⬜ **Import/Export** - CSV import/export for infrastructure equipment
- ⬜ **Port Status Monitoring** - Real-time port health checks
- ⬜ **Network Topology Visualization** - Visual network layout

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

## ✅ COMPLETED: Developer Mode

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

- ⬜ **Feature Flag System** - Not yet connected to developer mode

---

## 🚧 IN PROGRESS: Telemetry & Analytics (60% Complete)

Privacy-first telemetry system with PostHog integration.

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

- ⬜ **PostHog SDK** - NOT installed (uses raw fetch() instead of posthog-js)
- ⬜ **API Key Configuration** - .env.local needs PostHog project key
- ⬜ **Extended Event Tracking** - Only app_opened/app_closed currently tracked
- ⬜ **Error Tracking** - Beyond console.log
- ⬜ **Performance Metrics** - Placeholder code only
- ⬜ **Analytics Dashboard** - Admin panel integration not implemented

---

## ⬜ PLANNED: Cloud Sync & Collaboration

**Status:** UI mockups only (2% complete) - No backend implementation

- ⬜ **Backend API** - Express.js + PostgreSQL
- ⬜ **Real-time Sync** - Socket.io or WebSocket integration
- ⬜ **Conflict Resolution** - Automatic merge or manual resolution
- ⬜ **File Storage** - AWS S3 or Cloudflare R2 for assets
- ⬜ **Team Collaboration** - Multi-user access, permissions

**Existing UI Mockups (Non-functional):**
- `IntegrationSettings.tsx` - Cloud storage toggle UI, provider selection (Dropbox, Google Drive, OneDrive, S3)
- `Collaboration.tsx` - Placeholder settings panel
- All backend functions are TODO stubs

---

## ⬜ PLANNED: User Authentication

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

## ⬜ PLANNED: Testing & Quality

**Status:** Not implemented (0% complete)

- ⬜ **Unit Tests** - Vitest test suite
- ⬜ **Component Tests** - React Testing Library
- ⬜ **Integration Tests** - End-to-end critical flows
- ⬜ **E2E Tests** - Playwright user journeys
- ⬜ **Performance Tests** - Load testing with 10k+ fixtures

**Current State:** Zero test files in src/ directory, no testing framework installed

---

## ⬜ PLANNED: Documentation

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

1. **Lean into unique strengths**: Market Prep module and comprehensive infrastructure tracking - these are ShowStack's differentiators
2. **Address MVR urgently**: Industry standard format, shouldn't be complex to implement
3. **Collaboration decision**: Major architectural shift required - evaluate if local-first or cloud-first is core strategy
4. **Console integration**: Opens professional theater market
5. **Pricing advantage**: Position as "own it outright" alternative to Lightwright's subscription model

---

## 🎙️ User Feedback - New Feature Requests (December 27, 2024)

Based on user testing session, the following features have been identified as high-priority additions:

### 🔴 CRITICAL: Multi-User Collaboration Workflow

**Problem**: Current architecture doesn't support common workflow where multiple people work on same project by passing file back and forth (via email, Dropbox, etc.)

**Impact**: **URGENT** - Lightwright's new platform has native cloud collaboration. This is now a competitive requirement.

**Proposed Solutions**:
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

---

### 📋 Equipment Manager Enhancements

#### High Priority
- ⬜ **Filter out capability** - Hide fixtures matching criteria (1-2 days)
- ⬜ **Color flags for designations** - Visual indicators for hot circuits, special fixtures (2-3 days)
- ⬜ **Point circuit notation** - Support circuits like "1.2", "1.3" for power thru/daisy chains (3-4 days)
- ⬜ **Auto-complete from project data** - Suggest values based on existing fixtures (3-4 days)
- ⬜ **Click-to-edit infrastructure** - Double-click infrastructure rows to edit (1 day)
- ⬜ **Multi-color row highlighting** - Color-code fixtures by user criteria (2 days)

#### Medium Priority
- ⬜ **Combined fields on reports** - Concatenate fields (e.g., "Type + Accessory") (2-3 days)
- ⬜ **Remove focus columns** - Clean up planned features that won't be implemented (1 hour)

**Estimated Total**: 2-3 weeks

---

### 🏷️ Label Designer Enhancements

- ⬜ **Custom background colors** - User-selectable label background (1 day)
- ⬜ **Background images** - Support logo/image backgrounds on labels (1-2 days)

**Estimated Total**: 2-3 days

---

### ⚡ Power Management Enhancements

- ⬜ **Power service assignment** - Designate services (A, B, C, etc.) (2 days)
- ⬜ **Phase distribution templates** - Save/load phase configurations (AB vs AC phasing) (3-4 days)
- ⬜ **Custom phase labels** - User-defined phase naming (1, 2, 3 or A, B, C) (1 day)

**Estimated Total**: 1 week

---

### 📄 Paperwork Enhancements

- ⬜ **Color printing support** - Enable color in system docs paperwork (1 day)
- ⬜ **Gel color swatches** - Visual color chips for gel/color fields (2-3 days)
  - Requires gel color database integration

**Estimated Total**: 3-4 days

---

### 🎨 Unified Visual Editor System (NEW - Major Refactor)

**Overview**: Consolidate all visual editing (Paperwork, Labels, Shop Orders) into a single, modern, production-grade editor with comprehensive formatting controls.

**Vision**: Transform Paperwork tab from "preview mode" to "layout editor mode" - similar to LightWright's layout tab but with drag-and-drop visual design capabilities.

**See**: `docs/mockups/unified-editor-mockup.md` for detailed visual mockups

#### Strategic Goals
- **One editor for all contexts** - Paperwork headers, full reports, labels, shop orders
- **Professional UX** - Optimized for production electricians/audio/video techs working in theaters and shops
- **Modern appearance** - Clean, floating toolbars, collapsible panels, dark mode optimized
- **Speed-first design** - Keyboard shortcuts, command palette, inline editing, power user features

#### Core Architecture

**Unified Component Structure**:
```
src/renderer/src/components/unified-editor/
├── UnifiedLayoutEditor.tsx          # Main wrapper, context-aware
├── toolbar/
│   ├── FloatingToolbar.tsx         # Context-aware tools, always accessible
│   ├── QuickActions.tsx            # Cmd+K command palette
│   └── ModeToggle.tsx              # Edit ⇄ Preview mode
├── panels/
│   ├── LeftPanel.tsx               # Collapsible structure panel
│   │   ├── StructureTree.tsx       # Layers/sections
│   │   ├── ComponentLibrary.tsx    # Drag templates
│   │   └── FieldSelector.tsx       # Data fields (context-specific)
│   └── RightPanel.tsx              # Collapsible properties panel
│       ├── TextProperties.tsx      # Font, size, style, color, alignment
│       ├── ShapeProperties.tsx     # Fill, border, corner radius, opacity
│       ├── ImageProperties.tsx     # Source, fit, border
│       ├── TableProperties.tsx     # Columns, styling, grouping
│       ├── BarcodeProperties.tsx   # QR/Code128/Code39 (labels)
│       └── PageProperties.tsx      # Size, orientation, margins, background
├── canvas/
│   ├── Canvas.tsx                  # Main design surface
│   ├── Grid.tsx                    # Configurable grid
│   ├── SnapGuides.tsx              # Alignment helpers
│   └── elements/
│       ├── TextElement.tsx         # Inline editable text
│       ├── ShapeElement.tsx        # Rectangles, circles, lines
│       ├── ImageElement.tsx        # Logo, graphics
│       ├── TableElement.tsx        # Data tables
│       └── BarcodeElement.tsx      # QR codes, barcodes
└── controls/
    ├── FontSelector.tsx            # Font family dropdown
    ├── ColorPicker.tsx             # Presets + custom + eyedropper
    ├── NumberInput.tsx             # With slider dual control
    ├── Slider.tsx                  # Range input
    ├── ToggleButton.tsx            # Bold/italic/underline/strikethrough
    └── StyleControls.tsx           # Grouped formatting buttons
```

#### New Formatting Features

**Text Formatting** (currently missing):
- ✅ Font family selector (Inter, Helvetica, Arial, Roboto, Roboto Mono, Courier)
- ✅ Font size (6-144pt) with presets (8, 10, 12, 14, 16, 18, 24, 36)
- ✅ Style toggles: Bold, Italic, Underline, Strikethrough
- ✅ Color picker with presets (Black, White, Blue, Red, Green, Amber, Gray)
- ✅ Alignment: Left, Center, Right
- ✅ Line height control
- ✅ Letter spacing control

**Shape Formatting** (currently missing):
- ✅ Fill enabled/disabled toggle
- ✅ Fill color with opacity slider (0-100%)
- ✅ Fill type: Solid, Gradient, Pattern
- ✅ Border enabled/disabled toggle
- ✅ Border color, width, style (solid/dashed/dotted)
- ✅ Corner radius (0-100px)
- ✅ Shadow effects (optional)

**Image Formatting**:
- ✅ Fit modes: Cover, Contain, Fill, None
- ✅ Border controls
- ✅ Position controls

**Table Formatting**:
- ✅ Column selection
- ✅ Header style (background, text color, font size)
- ✅ Row striping with alternating colors
- ✅ Grouping and sorting controls

**Barcode/QR Code** (label-specific):
- ✅ Type selector: QR Code, Code 128, Code 39
- ✅ Data template variables (e.g., `{equipment.id}`)
- ✅ Size control
- ✅ Error correction level (QR)

#### Context-Specific Adaptations

**Paperwork Context** (`context="paperwork-report"`):
- Available elements: Text, Shape, Image, Table, Data Field
- Left panel: Report type selector, field checkboxes, grouping/sorting
- Focus: Multi-page documents, data tables, headers/footers

**Label Context** (`context="label"`):
- Available elements: Text, Shape, Image, Barcode, Data Field
- Left panel: Label size presets (2×4", 4×6", 4×8"), equipment fields
- Focus: Small format, barcode generation, variable data

**Shop Order Context** (`context="shop-order"`):
- Available elements: Text, Shape, Image, Table, Section divider
- Left panel: Section list, notes blocks, revision markers
- Focus: Professional documents, notes, revision tracking

#### UX Improvements

**Visual Design**:
- ✅ Three-panel layout (Content | Canvas | Properties)
- ✅ Floating toolbar (Figma-style, always accessible)
- ✅ Collapsible side panels (VS Code-style)
- ✅ Dark mode optimized (primary for theater environments)
- ✅ High contrast, WCAG AAA accessibility
- ✅ Large touch targets (56×56px min for tablet/glove use)

**Interaction Patterns**:
- ✅ Inline text editing (double-click to edit)
- ✅ Smart guides and snapping (pink/blue alignment helpers)
- ✅ Multi-select with Cmd+Click
- ✅ Drag-and-drop from component library
- ✅ Keyboard shortcuts for all actions
- ✅ Command palette (Cmd+K) for power users
- ✅ Preview ⇄ Edit mode toggle

**Keyboard Shortcuts**:
```
TEXT FORMATTING
Cmd+B          Bold
Cmd+I          Italic
Cmd+U          Underline
Cmd+Shift+>    Increase font size
Cmd+Shift+<    Decrease font size

ALIGNMENT
Cmd+Shift+L    Align left
Cmd+Shift+E    Align center
Cmd+Shift+R    Align right

ELEMENTS
T              Add text
R              Add rectangle
L              Add line
I              Add image
B              Add barcode (labels)
D              Add data field

CANVAS
Cmd+Z          Undo
Cmd+Shift+Z    Redo
Cmd+D          Duplicate
Delete         Delete selected

TOOLS
Cmd+K          Command palette
Cmd+/          Show shortcuts
Cmd+P          Preview mode
Cmd+S          Save template
```

**Responsive Design**:
- Desktop (≥1400px): Three-panel layout
- Compact (<1400px): Full-width canvas, drawer panels
- Tablet: Touch-optimized, larger buttons (56×56px)

#### Multi-Discipline Support

**Current**: Lighting-specific fields (Channel, Dimmer, Color, Gobo, etc.)

**Phase 2 Expansion**:
- Audio fields: Input/Output, Channel strip, Mic type, Phantom power, Zone, Mix bus
- Video fields: Input/Output, Resolution, Signal type, Routing, Pixel mapping, Layer
- Unified field selector adapts to discipline

#### Unified Data Model

```typescript
interface LayoutElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'table' | 'barcode' | 'dataField';
  position: { x: number; y: number };
  size: { width: number; height: number };

  // NEW: Text properties
  text?: {
    content: string;
    font: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline' | 'line-through';
    color: string;
    alignment: 'left' | 'center' | 'right';
    lineHeight: number;
    letterSpacing: number;
  };

  // NEW: Shape properties
  shape?: {
    type: 'rectangle' | 'circle' | 'line';
    fill: {
      enabled: boolean;
      color: string;
      opacity: number;
      type: 'solid' | 'gradient' | 'pattern';
    };
    border: {
      enabled: boolean;
      color: string;
      width: number;
      style: 'solid' | 'dashed' | 'dotted';
    };
    cornerRadius: number;
  };

  // Existing: Image, table, barcode, dataField...
}
```

#### Implementation Phases

**Phase 1: Core Refactor** (2 weeks)
- Extract common editor components from Prep's LayoutDesigner
- Create UnifiedLayoutEditor wrapper
- Implement context-aware element library
- Build floating toolbar and collapsible panels
- Add keyboard shortcut system

**Phase 2: Text & Shape Formatting** (1 week)
- FontSelector, ColorPicker, StyleControls
- TextProperties panel with full formatting
- ShapeProperties panel with fill/border/radius
- Inline text editing
- Color preset library

**Phase 3: Paperwork Integration** (1 week)
- Replace Paperwork tab preview with editor
- Field selector panel (left)
- Column configuration
- Grouping/sorting controls
- Template library (system + custom)

**Phase 4: Label Integration** (1 week)
- Barcode element support (QR, Code128, Code39)
- Label size presets (2×4", 4×6", 4×8")
- Variable data fields
- Batch generation support

**Phase 5: Polish & UX** (1 week)
- Smart snap guides
- Command palette (Cmd+K)
- Preview mode improvements
- Dark mode refinements
- Keyboard shortcut help overlay
- Touch optimization for tablets

**Estimated Total**: 6 weeks

#### Benefits

**For Users**:
- Consistent UX across all paperwork/label tasks
- Professional-grade formatting control
- Faster workflow with keyboard shortcuts
- Works in dark theaters and bright shops

**For Development**:
- Single codebase for all visual editing (~40% less code)
- Easier maintenance and bug fixes
- New features benefit all contexts
- Better testability

**Competitive Advantage**:
- Modern visual editor vs. LightWright's settings-based approach
- Drag-and-drop WYSIWYG beats form-based configuration
- Production-optimized UX (keyboard-first, dark mode, touch-friendly)

#### Related Files

**Mockup**: `docs/mockups/unified-editor-mockup.md`
**Existing Editor**: `src/renderer/src/components/prep/layout/LayoutDesigner.tsx`
**Paperwork Page**: `src/renderer/src/pages/modules/Paperwork.tsx`
**Label Designer**: `src/renderer/src/pages/modules/LabelDesigner.tsx`

---

### 🔧 Maintenance Menu System (NEW - Major Feature)

**Overview**: Lightwright 6 parity feature - custom categorization system for grouping fixtures.

#### Core Functionality
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

#### Database Schema
```typescript
// New tables
- custom_categories (id, project_id, name, column_name, color)
- category_rules (id, category_id, rule_type, rule_value)
- category_metadata (id, category_id, notes, physical_notes, vectorworks_notes, position_notes)
- fixture_category_assignments (fixture_id, category_id)
```

#### Implementation Phases
1. **Phase 1: Core System** (5-7 days)
   - Database schema
   - Category CRUD operations
   - Rule engine for auto-assignment
2. **Phase 2: Maintenance Menu UI** (3-4 days)
   - Menu bar integration
   - Category dialogs with 4 tabs
   - Manual assignment
3. **Phase 3: Integration** (4-5 days)
   - Labels integration
   - Paperwork grouping
   - Shop order sections
   - Color flags
4. **Phase 4: Advanced** (2-3 days)
   - User-defined columns support
   - Category-based auto-complete
   - Import/export

**Estimated Total**: 3-4 weeks

**Strategic Value**:
- **CRITICAL for shop order automation** - Provides grouping mechanism
- Lightwright 6 parity
- Enables sophisticated workflow customization
- Foundation for Equipment Manager → Shop Order automation (#29)

**Related Issues**: #29 (shop order automation), #14 (auto-complete)

---

### 🖥️ UI/UX Improvements

#### Quick Fixes
- ⬜ **Remove recent files from Production Landing** - Current flow broken (1 hour)

#### Menu Bar Reorganization
- ⬜ **Evaluate menu bar access** - Move common functions to menu for easier access
  - Add fixture/infrastructure
  - Generate paperwork
  - Export options
  - Settings access

**Estimated Total**: 2-3 days

---

## 🚨 STRATEGIC URGENCY: Cloud Collaboration

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

## 🎯 Current Development Priorities

### Immediate (Next 2 Weeks)
1. ✅ ~~Add undo/redo system~~ - COMPLETED
2. ✅ ~~Add customizable headers to Paperwork Generator~~ - COMPLETED (Phase 1 & 2)
3. ✅ ~~Complete Paperwork Generator with template system~~ - COMPLETED (12 reports)
4. **UI upgrade for Visual Layout Editors** - Improve LayoutDesigner, LayoutCanvas, ElementPalette UX
   - Better visual hierarchy and spacing
   - Improved drag-and-drop feedback
   - Enhanced element selection and manipulation
   - Clearer grid guidelines and snapping
5. **Remove emojis from UI for professional appearance** - Replace emoji icons with proper icons/text
   - Buttons, labels, and UI elements across all modules
   - Replace with Lucide React icons or text labels
   - Maintain visual clarity without emoji decoration
6. **Implement shop order creation from system documentation** (auto-populate from fixture/infrastructure data)
7. Implement auto-complete for manufacturer, type, color, gobo (deferred - requires database)

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
2. ShowStack:Manager module (tour logistics, budgeting)
3. Advanced features (focus charts, work notes, cable tracking)
4. Roll printer support for label printing
5. Public launch at USITT or LDI 2026
6. Paid customer acquisition (target: 100+ customers)

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

**Last Updated:** December 27, 2024 by Claude Code

---

## 📚 References

- [Lightwright Platform Overhaul Announcement](https://www.usitt.org/news/lightwright-unveils-historic-platform-overhaul-introducing-real-time-collaboration-a-new-era-of-data-management)
- [Lightwright New Features | Live Design](https://www.livedesignonline.com/b2b-experience/lightwright-unveils-historic-platform-overhaul-introducing-real-time-collaboration)
- [Lightwright Official Site](https://www.lightwright.com/)
