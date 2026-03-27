# ShowStack — Lighting Edition Status

**Last Updated:** March 27, 2026
**Edition Price:** $249/year
**Target Users:** Lighting Designers, Production Electricians, Master Electricians
**Competes With:** LightWright 6 ($845 one-time)
**Overall Completion:** ~96%

---

## ⚠️ Priority Flags

All pre-1.0 priority flags resolved. ✅

---

## 🔴 Pending / Deferred Work

These items are either actively deferred or waiting on a dependency. Address before 1.0.

### Fixture Management

- ✅ **GDTF Personality Library (Phases 1–4)** — See completed section below. ~~Auto-complete deferred.~~ Superseded by GDTF library.
- ~~**DMX Conflict Highlighting in Grid**~~ — Evaluated and closed. Show Health collapsible details + DMX Map visualization supersede inline grid highlighting.

### Power Management

- ⬜ **Cable Run Visualization** — Visual cable path layout on a stage/venue diagram.
- ⬜ **Advanced Phase Balancing** — Automatic phase assignment suggestions based on load.
- ⬜ **Power Distribution Reports** — Printable rack schedules and load summary reports.

### Infrastructure

- ⬜ **Port Validation** — IP address and VLAN range validation on infrastructure port fields. (Issue #17)
- ⬜ **Network Topology Visualization** — Visual network layout diagram for infrastructure. (Issue #19)
- ⬜ **Real-time Port Status Monitoring** — Ping/connectivity checks, port up/down status, SNMP integration, status dashboard. (Issue #20)

### Shop Orders

- ✅ **Integration tests for critical shop order workflows** — 35 tests across 8 suites in `shopOrderIntegration.test.ts`: project lifecycle, section management, item CRUD with quantity calculations (total_qty, venue_active/spare), revision tracking (up to 5 revisions, change_log), notes system (3 types, filter by type), full workflow, cascade delete, multi-discipline.
- ~~Virtual scrolling for large tables~~ — Sections cap at ~30 items in practice; not needed.
- ~~E2E tests with Playwright~~ — Project uses Puppeteer; second E2E framework not warranted.
- ~~Performance optimization for large revision sets~~ — Not a real issue given section sizes; revision diff logic is already lightweight.

### Cloud Services

- ⬜ **E-commerce webhook → Supabase Edge Function** — Auto-fulfill license purchases from Stripe/Shopify.
- ⬜ **Auto-updater maintenance gate** — Block updates released after `maintenanceEndDate` on a license.
- ⬜ **Supabase dashboard** — Add `showstack://*` to Auth → URL Configuration → Redirect URLs (required for email verification deep link to complete). _Manual step — cannot be done in code._

### Developer / Admin

- ✅ **Feature flag system (Issue #35)** — Per-flag overrides added to `settingsStore.advanced.featureFlagOverrides`; `useFeatureFlag` precedence: override > dev mode blanket > default. Dev mode now shows a Feature Flags section in Advanced Settings with per-flag toggles, override/default labels, and clear buttons.
- ✅ **Admin Panel backend (Issue #52)** — `DatabaseManagement`: real DB file sizes, last backup time, vacuum (PRAGMA VACUUM on both DBs), integrity check (PRAGMA integrity_check), backup via `backup:create`, two-step restore UI from backup list. `ApplicationSettings`: persisted via `settingsStore.adminConfig`, folder browse via native dialog. New IPC: `admin:getDatabaseInfo`, `admin:vacuumDatabase`, `admin:integrityCheck`, `admin:selectFolder`.

### User Documentation (Issue #53)

- ⬜ Getting Started guide (installation, first project, basic workflow)
- ⬜ Equipment Manager guide
- ⬜ Shop Order guide
- ⬜ Power Management guide
- ⬜ Collaboration guide
- ⬜ In-app help / tooltips system

---

## 🟡 Planned (Next to Implement)

### Short-term — Lightwright Parity

1. **Basic console integration (ETC Eos via OSC)** — Push/pull patch data from an Eos family console. (Issue #25, 5% complete)

**Refs:** `docs/features/console-integration-plan.md`

### Medium-term — Professional Integration

1. **Vectorworks XML integration** — Import from Vectorworks with field mapping and reconciliation workflow; export back. (Issue #32)
   - Effort: ~13 weeks. **Ref:** `docs/features/vectorworks-integration-plan.md`
2. **Advanced console support** — grandMA2 (Telnet/XML), grandMA3 (MA-Net3/OSC).
3. **Power/cable diagrams** — Visual power distribution and cable path layouts.
4. Beta release with 10+ testers.

### Advanced Features

- ⬜ **Multi-cable Tracking** — Track multi-cable runs and breakouts.
- ~~**Focus Charts**~~ — Deferred indefinitely; re-open if users request.
- ✅ **DMX Map Visualization** — Universe grid view (32×16, 512 addresses/universe). Multi-channel fixtures shown as contiguous color blocks with thick outer borders and thin inner cell dividers. 4 cell states: empty (gray), start cell (dark blue), continuation (light blue), shared/intentional (teal), conflict (red). Hover tooltip shows channel · type · mode · footprint. Header: universe count, patched count, shared count, conflict count. Intentional sharing suppressed. Reloads fixtures on mount for fresh data.
- ✅ **GDTF Personality Library (Phases 1–4)** — See completed section below. **Ref:** `docs/features/gdtf-personality-library-plan.md`
- ~~**Work Notes**~~ — Deferred indefinitely; re-open if users request.

---

## ✅ Completed Work

### Fixture Management (Equipment Manager)

- ✅ **Virtual Data Grid** (`VirtualDataGrid.tsx`) — Virtual scrolling for 10,000+ fixtures, 60 FPS, multi-select, in-cell editing.
- ✅ **Equipment Manager Page** — Full fixture CRUD, duplicate, export. (Issue #51 — closed)
- ✅ **Equipment Manager Export (Issue #51)** — CSV, ETC Eos ASCII, GrandMA2 XML, GrandMA3 XML exports via `ExportHeaderDialog`; native save dialog via `file:saveText` IPC; RFC 4180 CSV escaping.
- ✅ **Fixture Database** — 68+ columns, LightWright parity achieved.
- ✅ **Add Fixture Dialog** — Full creation form with all fields and validation.
- ✅ **Bulk Edit Dialog** — 30+ editable fields, 7 collapsible sections, auto-numbering for 6 fields.
- ✅ **Column Visibility Menu** — Per-project persistent column preferences. Session-level cache (module variable) ensures non-default columns survive navigation without async flash.
- ✅ **Undo/Redo System** — Command pattern, 100-item history, Cmd+Z / Cmd+Shift+Z.
- ✅ **Right-click context menu** — Set flags, hide/unhide (React Portal for correct positioning).
- ✅ **Color flags** — 5 predefined designation types (hot, spare, special, dimmer_doubles, two_fer) shown as vertical colored bars.
- ✅ **Conditional Formatting** — User-defined row highlighting rules with priority ordering; default rules for Spare Circuits (yellow) and Practicals (blue); WCAG text contrast calculation.
- ✅ **Filter out (hidden fixtures)** — Hide fixtures with hidden flag; "Show Hidden" toggle.
- ✅ **Auto-complete from project data** — Inline suggestions based on existing fixture values.
- ✅ **Point circuit notation** — Circuits like "1.2", "1.3" for power-thru / daisy chains.
- ✅ **DMX Map** — Visualization page (`/project/:id/dmx-map`) showing all universes as 32×16 grids (512 addresses each). Multi-channel fixtures rendered as contiguous color blocks: start cell (dark blue `bg-blue-500`) shows channel label, continuation cells (light blue `bg-blue-200`) extend the block. Thick outer border (`border-2 border-blue-700`) encloses each fixture block; thin inner cell dividers. Single-channel fixtures: one dark-blue cell. Shared/intentional (teal), conflict (red). Tooltip shows `Ch · type · position · mode · footprint`. Per-universe utilization bar + `used / 512 (XX%)` counter. Reloads fixtures on mount. Intentional sharing suppressed via `isIntentionalAddressSharing()`.
- ✅ **DMX Conflict Detection** — Full-range conflict detection across both Show Health (validates duplicate DMX addresses, flags with fixture details) and DMX Map (conflict cells rendered red). Multi-channel fixture ranges (`dmx_address` through `dmx_address + dmx_footprint - 1`) checked end-to-end. Intentional sharing (two-fers, dimmer doubles, gang-patched fixtures) suppressed in both places. `⬜ Future: click a conflict cell in DMX Map to navigate/highlight the fixture in Equipment Manager.`

### GDTF Personality Library (Phases 1–3)

- ✅ **Phase 1 — User-editable footprint** — `dmx_footprint` column added to `fixtures` table (migration, `DEFAULT 1`). Added to `FIXTURE_ALLOWED_FIELDS`. `dmx_footprint` added to `FixtureSchema` Zod validation (was missing — caused silent stripping on every save). DMX Map updated to shade full address range per fixture. Conflict detection extended to cover full ranges.
- ✅ **Phase 2 — Bundled starter set + picker UI** — `gdtf_cache` SQLite table (`id`, `manufacturer`, `model`, `revision_id`, `source`, `cached_at`, `file_path`, `modes_json`). `GdtfService` parses `.gdtf` ZIP files, caches modes. `GdtfPickerDialog` — fuzzy search across 8,000+ fixtures, mode selection with channel count. Wired into Add Fixture and Bulk Edit dialogs. On select: auto-fills manufacturer, model, type, mode, and `dmx_footprint`. `gdtf-bundled/` directory for offline starter fixtures (not yet populated — maintainer step).
- ✅ **Phase 3 — CDN sync + update notifications** — Supabase Storage bucket `gdtf-library` (public). Manifest format: `{ version_hash, updated_at, fixture_count, fixtures: [{id, manufacturer, model, rid, modes}] }`. `scripts/sync-gdtf-library.mjs` syncs from GDTF-Share REST API and uploads manifest; run to populate **8,033 fixtures** (hash `9bcf41fe2e17a451`, 4.5 MB). `GdtfService.applyManifestUpdate()` bulk-upserts all manifest fixtures in a single SQLite transaction. `gdtf:applyUpdate` IPC wired through preload. `GdtfLibraryUpdateBanner` shows on launch when CDN version differs from stored hash; "Update Now" button triggers bulk upsert and auto-dismisses on success. GitHub Actions workflow `sync-gdtf-library.yml` for future automated syncs.
- ✅ **Phase 4 — MVR import (Issue #30)** — `MvrService.ts` parses `.mvr` ZIP archives (`GeneralSceneDescription.xml`), recursively traverses `GroupObject`/`SceneObject` layer trees, maps `GDTFSpec` (`Manufacturer@Model@Rev.gdtf`) to `gdtf_cache` (exact then case-insensitive fallback), computes `universe`/`dmx_address` from absolute DMX address (Break="0"), bulk-creates fixtures via `createFixture`. `ipc/mvr.ts` shows native file open dialog, returns `{ created, gdtfResolved, warnings }`. Wired into Equipment Manager toolbar ("Import MVR" button) with auto-dismissing success/error banner. Defensive `Number(channelCount)` coercion guards against string `channel_count` values from manifest JSON.
- ✅ **Phase 4 — Multi-token search** — `GdtfService.search()` splits query into tokens, requires all tokens match `LOWER(manufacturer || ' ' || model)` (AND logic, word-order independent). Relevance scoring: exact combined match → manufacturer-prefix → alphabetical. Up to 50 results.
- ✅ **Phase 4 — CDN picker UX** — Collapsible "Download from CDN" section appears for any non-empty search query (not just zero results). Auto pre-fills manufacturer/model from query words on first expand.

### Smart Groups (Phases 1–4)

_Note: Supersedes Issue #40 (Maintenance Menu) and Issue #29 (Shop Order from System Docs) — both issues should be closed._

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
- ✅ **Enhanced error checking (Issue #31 — closed)** — Show Health validates: duplicate DMX address, duplicate channel, missing circuit, missing instrument type, patched-without-channel, channel-without-patch, port over capacity. Rack overload detection is not in Show Health — covered with richer context (% utilization, kW loads, phase balance) by the dedicated Power Summary panel.
- ✅ **Show Health — intentional sharing suppression** — Duplicate DMX errors suppressed for two-fers, dimmer doubles, and gang-patched fixtures. Logic in `isIntentionalAddressSharing()` (`fixtureUtils.ts`) — checks color flags (`two_fer`, `dimmer_doubles`), shared circuit name+number, or shared dimmer. Used by both Show Health validation and DMX Map.
- ✅ **Show Health — collapsible fixture details** — Each issue row shows a "show N" toggle (default collapsed). Expanding reveals Ch · Type · Position per affected fixture, or Name · Location for infrastructure issues.
- ✅ **UI Redesign Phase 8** — Filter chips + slim toolbar: `FilterBar` dropdowns replaced with inline tag filter chips.
- ✅ **UI Redesign Phase 9** — Design tokens: CSS custom properties across all inspector components.
- ✅ **Menu Bar Reorganization (PR #83)** — Context-aware menu (equipment / infrastructure / power contexts), Duplicate wired, Conditional Formatting moved to View menu, Generate Paperwork in Project menu.

### Cloud & Collaboration

- ✅ **Multi-user collaboration (PR #85)** — Invite/remove/accept/decline via Supabase RPCs; real-time presence; RLS + license gate (migrations 005–016).
- ✅ **PowerSync write-path (PR #87)** — Projects and shop orders written to PowerSync on create/update/delete; fixes TOCTOU ownership race (Issue #86, closed). Student-tier cloud sync eligibility still TBD.

### Pre-1.0 Fixes (branch `feature/pre-1.0-fixes`, March 12, 2026)

- ✅ **Issue #81 — Email verification deep link** — `showstack://` custom URL scheme registered; main process receives `open-url`/`second-instance` callbacks and forwards to renderer via `auth:deepLink` IPC. New `auth:exchangeDeepLink` handler calls `supabase.auth.setSession()` to complete verification. `signUp` now returns `emailConfirmationRequired` flag. Renderer refreshes auth/license/sync state on successful exchange. _Supabase dashboard redirect URL still requires manual configuration — see pending items._
- ✅ **Issue #81 — `license:getStatus` rate limiting** — IPC handler caches result for 2 seconds to prevent renderer hammering.
- ✅ **Issue #62 — Telemetry unbounded growth** — Added `MAX_UNSYNCED_EVENTS = 500` cap; oldest unsynced event dropped when offline queue exceeds limit (separate from the 1,000 total cap).
- ✅ **Issue #64 — Type safety in revisionUtils** — Replaced all `PrepEquipmentItem`/`PrepSection` references (types were renamed) with `ShopOrderItem`/`ShopOrderSection`; removed all `as any` casts in revision diff logic.
- ✅ **Issue #65 — Shop order error handling** — Replaced `alert()` calls in `shopOrderFileStore` with `errorMessage` state; `ShopOrderFileMenu` displays errors inline with click-to-dismiss.
- ✅ **Issue #79 — Backup compression** — Backups now stored as `.db.gz` (gzip via `stream/promises` pipeline); restore transparently decompresses; legacy uncompressed `.db` backups still supported.
- ✅ **Issue #84 — Logo URL mapping for shop orders** — `logo_path` field added to `ShopOrderProject` type; store maps parent project `logo_path` to the correct field instead of silently dropping it; `PageRenderer` uses typed fields without `as any`.
- ✅ **Issue #62 — Telemetry batch flush on quit** — `telemetry.shutdown()` now calls `posthog.shutdown(3000)` instead of `posthog.reset()`, flushing queued events before the Electron process exits (3 s timeout prevents hangs). PostHog SDK handles network retry backoff internally — no additional implementation needed.
- ✅ **Issue #79 — Backup integrity checksums** — `BackupService` computes SHA-256 checksums of both `.db.gz` files after each backup and persists them in metadata; checksums are verified before restore and abort with an error on mismatch. Auto-backup hook added to `ShopOrderProjectService.delete()` matching the existing `ProjectService.delete()` pattern.
- ✅ **Issue #81 — Session token & demo mode audit** — Supabase SDK stores session tokens in Electron's sandboxed `localStorage` (acceptable for desktop). `demo_mode` is properly gated: `canSync: false`, `canCollaborate: false`, explicit downgrade protection in `LicenseService`. No code changes required.

---

## 📋 Known Technical Debt

- `useModuleAccess.ts` may need renaming to `useEditionAccess.ts` for clarity.
- `gdtf-bundled/` starter fixture set not yet populated — maintainer must add .gdtf files for offline Tier 1 support.
- Supabase dashboard: `showstack://*` must be added to Auth → URL Configuration → Redirect URLs manually.
- ESLint warning count is exactly at the CI threshold (855). Reducing to 0 is a tracked goal.
- Issue #51 (Equipment Manager export) — Closed. All 4 formats implemented (CSV, Eos ASCII, GrandMA2 XML, GrandMA3 XML) with native save dialog via `file:saveText` IPC. CSV uses proper RFC 4180 escaping.
- Issue #40 (Maintenance Menu) closed — superseded by Smart Groups. Per-column maintenance menu and 4-tab notes dialog not implemented; re-open if user feedback demands.
- Issue #29 (Shop Order from System Docs) closed — superseded by Smart Groups Phase 4.
- Issue #86 (TOCTOU security) closed — fixed by PR #87 PowerSync write-path. Student-tier cloud sync eligibility still TBD.
