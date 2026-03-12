# ShowStack — Lighting Edition Status

**Last Updated:** March 11, 2026
**Edition Price:** $249/year
**Target Users:** Lighting Designers, Production Electricians, Master Electricians
**Competes With:** LightWright 6 ($845 one-time)
**Overall Completion:** ~90%

---

## 🔴 Pending / Deferred Work

These items are either actively deferred or waiting on a dependency. Address before 1.0.

### Fixture Management

- ⬜ **Auto-complete System** — Manufacturer, type, color, gobo lookup from an external fixture database.
  _Deferred — requires extensive fixture database work before this is feasible._
- ⬜ **DMX Conflict Detection** — Highlight conflicting DMX addresses in the grid.
  _Waiting on Vectorworks integration (conflict detection only meaningful once CAD import is wired up)._

### Power Management

- ⬜ **Cable Run Visualization** — Visual cable path layout on a stage/venue diagram.
- ⬜ **Advanced Phase Balancing** — Automatic phase assignment suggestions based on load.
- ⬜ **Power Distribution Reports** — Printable rack schedules and load summary reports.

### Infrastructure

- ⬜ **Port Validation** — IP address and VLAN range validation on infrastructure port fields.
- ⬜ **Network Topology Visualization** — Visual network layout diagram for infrastructure.

### Shop Orders (Post-Migration Improvements — Issue #65)

Non-critical enhancements identified during PR #63 review:

- ⬜ Standardize error handling (use toast notifications consistently; remove bare `alert()` calls)
- ⬜ Add integration tests for critical shop order workflows
- ⬜ Virtual scrolling for large tables (500+ items)
- ⬜ Extract configuration constants to a separate file
- ⬜ E2E tests with Playwright for shop order flow

### Cloud Services

- ⬜ **E-commerce webhook → Supabase Edge Function** — Auto-fulfill license purchases from Stripe/Shopify.
- ⬜ **Auto-updater maintenance gate** — Block updates released after `maintenanceEndDate` on a license.

---

## 🟡 Planned (Next to Implement)

### Short-term — Lightwright Parity

1. **MVR export** — Industry-standard CAD/visualizer format for Vectorworks, Cast, Depiction, etc.
2. **Enhanced error checking** — Overlapping patches, overloaded dimmers, duplicate channels, missing data warnings.
3. **Basic console integration (ETC Eos via OSC)** — Push/pull patch data from an Eos family console.

**Refs:** `docs/features/console-integration-plan.md`

### Medium-term — Professional Integration

1. **Vectorworks XML integration** — Import from Vectorworks with field mapping and reconciliation workflow; export back.
   - Effort: ~13 weeks. **Ref:** `docs/features/vectorworks-integration-plan.md`
2. **Advanced console support** — grandMA2 (Telnet/XML), grandMA3 (MA-Net3/OSC).
3. **Power/cable diagrams** — Visual power distribution and cable path layouts.
4. Beta release with 10+ testers.

### Advanced Features

- ⬜ **Multi-cable Tracking** — Track multi-cable runs and breakouts.
- ⬜ **Focus Charts** — Custom focus chart generation.
- ⬜ **DMX Map Visualization** — Visual DMX universe layout.
- ⬜ **Work Notes** — Installation notes, issues, and change tracking per fixture.

---

## ✅ Completed Work

### Fixture Management (Equipment Manager)

- ✅ **Virtual Data Grid** (`VirtualDataGrid.tsx`) — Virtual scrolling for 10,000+ fixtures, 60 FPS, multi-select, in-cell editing.
- ✅ **Equipment Manager Page** — Full fixture CRUD, duplicate, export (CSV, Eos, GrandMA), context-aware native menu.
- ✅ **Fixture Database** — 68+ columns, LightWright parity achieved.
- ✅ **Add Fixture Dialog** — Full creation form with all fields and validation.
- ✅ **Bulk Edit Dialog** — 30+ editable fields, 7 collapsible sections, auto-numbering for 6 fields.
- ✅ **Column Visibility Menu** — Per-project persistent column preferences.
- ✅ **Undo/Redo System** — Command pattern, 100-item history, Cmd+Z / Cmd+Shift+Z.
- ✅ **Right-click context menu** — Set flags, hide/unhide (React Portal for correct positioning).
- ✅ **Color flags** — 5 predefined designation types (hot, spare, special, dimmer_doubles, two_fer) shown as vertical colored bars.
- ✅ **Conditional Formatting** — User-defined row highlighting rules with priority ordering; default rules for Spare Circuits (yellow) and Practicals (blue); WCAG text contrast calculation.
- ✅ **Filter out (hidden fixtures)** — Hide fixtures with hidden flag; "Show Hidden" toggle.
- ✅ **Auto-complete from project data** — Inline suggestions based on existing fixture values.
- ✅ **Point circuit notation** — Circuits like "1.2", "1.3" for power-thru / daisy chains.

### Smart Groups (Phases 1–4)

- ✅ **Phase 1 — Backend** — `fixture_groups` + `fixture_group_pins` schema, `groups.ts` queries, `ipc/groups.ts` (10 channels), `groupStore.ts`, TypeScript interfaces.
- ✅ **Phase 2 — InspectorPanel shell + GroupsInspector** — Create/edit/delete groups; filter-based membership computed on demand via `applyFilter()` + pins union.
- ✅ **Phase 3 — Equipment Manager integration** — Group indicator column, bulk pin/unpin, context menu.
- ✅ **Phase 4 — Output integration** — Shop orders auto-populate from groups; labels `{group}` token; paperwork group-by.

### Power Management

- ✅ Power rack management (dimmer + PD racks, module configuration).
- ✅ Power Summary panel with real-time utilization tracking.
- ✅ Auto-linking fixtures to racks.
- ✅ Building service assignment (Service A/B/C) with capacity tracking.
- ✅ Custom phase labels (A/B/C → 1/2/3 or custom names).
- ✅ Phase distribution templates (save/load phasing configurations).
- ✅ Color mode PDF exports (color vs. grayscale toggle).

### Infrastructure Equipment Management

- ✅ Full CRUD operations with add/edit dialogs.
- ✅ 33-column schema covering all equipment attributes.
- ✅ 17 configurable columns with per-project visibility persistence.
- ✅ Port assignment management (0–128 ports, dynamic configuration).
- ✅ Port linking — link ports to fixtures, equipment, or free-text notes.
- ✅ Port usage tracking — visual indicators and utilization statistics.
- ✅ CSV import/export with field mapping UI.

### Shop Order Tool

- ✅ Spreadsheet-like table interface with inline editing (PR #63).
- ✅ Paste from clipboard (TSV/CSV) with intelligent format detection.
- ✅ Export to CSV with sanitization and formula injection prevention.
- ✅ Debounced saves (500ms, ~90% DB write reduction).
- ✅ Drag-and-drop row reordering within sections.
- ✅ Quantity tracking across revisions.
- ✅ Merge duplicate items.
- ✅ Input validation (max 1,000 rows, 500-char descriptions).
- ✅ Multi-discipline support (lighting, audio, video, rigging, scenic, props).
- ✅ Section management — create, reorder, rename, delete.
- ✅ Revision tracking — up to 5 revisions, automatic change detection.
- ✅ Notes system — 3-tier (General Conditions, General Notes, Fixture Notes) with templates.
- ✅ Print builder — drag-and-drop section arrangement, 11 section types, template save/load.
- ✅ PDF export via `prep:exportPDF`.
- ✅ 82 tests, 100% passing.

### Paperwork Generator

- ✅ 8 fixture reports: Channel hookup, dimmer schedule, circuit list, DMX addresses, power summary, color schedule, gobo schedule, color cut report.
- ✅ 5 infrastructure reports: Equipment list, network summary, port assignments, power consumption, location map.
- ✅ Batch export to PDF; batch print.
- ✅ Page setup configuration.
- ✅ Gel color database (628 gels: GAM, LEE, Roscolux) with swatch rendering.
- ✅ Color Cut Report with frame size parsing, cuts-per-sheet, dual-color splitting.
- ✅ Visual header designer (12-column × 8-row grid, drag-and-drop elements).
- ✅ Paperwork template system — 13 system report types; column config, grouping, sorting via UI.
- ✅ Logo/image support — project logo storage, PDF rendering.

### Label Designer

- ✅ Grid-based visual designer for 5 Avery templates (5160, 5163, 5164, 8160, 5167).
- ✅ 40+ fixture data field mappings.
- ✅ Background color customization with color picker.
- ✅ Image support (logos, graphics) via base64 storage.
- ✅ Batch printing with Puppeteer PDF generation.
- ✅ Multi-label sheet rendering with precise Avery specifications.
- ✅ Automated migration (localStorage → database).

### UI & Navigation

- ✅ **UI Redesign Phase 4** — Navigation flattening: sidebar replaces tab rows; SystemDocs and ModuleLanding eliminated.
- ✅ **UI Redesign Phase 5** — Labels consolidation: `LabelVisualDesigner` is the single entry point.
- ✅ **UI Redesign Phase 6** — Racks & Distribution moved under Equipment Manager sidebar; power sub-tab removed.
- ✅ **UI Redesign Phase 7** — Show Health: passive validation engine, sidebar badges (red/amber counts), aggregated panel.
- ✅ **UI Redesign Phase 8** — Filter chips + slim toolbar: `FilterBar` dropdowns replaced with inline tag filter chips.
- ✅ **UI Redesign Phase 9** — Design tokens: CSS custom properties across all inspector components.
- ✅ **Menu Bar Reorganization (PR #83)** — Context-aware menu (equipment / infrastructure / power contexts), Duplicate wired, Conditional Formatting moved to View menu, Generate Paperwork in Project menu.

### Cloud & Collaboration

- ✅ **Multi-user collaboration (PR #85)** — Invite/remove/accept/decline via Supabase RPCs; real-time presence; RLS + license gate (migrations 005–016).
- ✅ **PowerSync write-path (PR #87)** — Projects and shop orders written to PowerSync on create/update/delete; fixes TOCTOU ownership race.

---

## 📋 Known Technical Debt

- `useModuleAccess.ts` may need renaming to `useEditionAccess.ts` for clarity.
- ESLint warning count is exactly at the CI threshold (855). Reducing to 0 is a tracked goal.
- Shop order `alert()` calls should migrate to toast notifications (Issue #65).
