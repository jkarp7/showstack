# ShowStack UI Redesign Plan

**Created:** March 9, 2026
**Status:** Phases 4–7 complete; Phase 8 (Filter Chips + Toolbar Slim) next
**Priority:** High (foundational — affects all features built after this)
**Scope:** Landing page, navigation model, Equipment Manager layout, inspector panel system,
tool consolidation, error checking

---

## Overview

The current UI has accumulated structural problems as features shipped: navigation is too deep,
tools are duplicated across locations, and modal dialogs interrupt context for tools that should
be persistently accessible. This plan establishes a coherent design direction before the next
wave of features (Smart Groups, Blueprint, Multi-Cable Tracking, etc.) are built on top of it.

**The goal is not a visual reskin.** It is a structural improvement — flattening navigation,
establishing a system-wide inspector pattern, and removing duplication — that happens to create
the foundation for a visual overhaul when that ships.

**Lightwright context:** Lightwright's new platform (launched January 2026) has also gone modern —
dark mode, simplified navigation, at-a-glance insights. A sleek, modern UI is now the industry
expectation, not a differentiator. ShowStack's differentiator is integration depth and
local-first architecture; the UI redesign should make those feel immediate and obvious.

---

## Design Principles

1. **Never navigate to see data you're operating on.** Persistent tools (Smart Groups,
   Conditional Formatting, Validation) live in a sidebar panel, not modal dialogs.
2. **One click to any tool.** The sidebar is always visible and always one click away.
3. **No duplicate implementations.** Each tool has one home. Power is in one place, Labels
   have one designer.
4. **Design tokens, not utility classes.** All colors, spacing, and type sizes flow from CSS
   custom properties so the visual layer can be updated without structural changes.
5. **Errors surface where they occur.** Validation badges appear on affected nav items;
   a Show Health panel aggregates everything for the pre-show checklist use case.

---

## 1. Landing Page

### Layout

1/2 + 1/2 split with a collapsible right panel. Keyboard shortcut (e.g. `⌘\`) toggles the
right panel; collapse state persists between sessions. When collapsed, the list takes full
width — good for keyboard-driven workflows.

```
┌──────────────────────────────────┬────────────────────────────────┬──┐
│  ShowStack        [+ New Project]│  [Show Logo / Placeholder]     │◀ │
│  ──────────────────────────────  │                                │  │
│  🔍 Search                       │  Frozen the Musical            │  │
│  [All] [Broadway] [Tour]   [+]  │  Broadway — St. James Theatre  │  │
│                                  │  Designer: Josh Karp           │  │
│  RECENT                          │  Last modified: Mar 7, 2026    │  │
│  ● Frozen the Musical    3h ago  │                                │  │
│  ● Hamilton Tour 2       2d ago  │  2 versions                    │  │
│                                  │  ● Mar 7, 2026 — Josh (yours)  │  │
│  ALL PROJECTS  [Last Modified ▾] │  ○ Mar 5, 2026 — Liz           │  │
│  ● Frozen the Musical            │                                │  │
│    ↳ Mar 7 — Josh (current)      │  [Open]          [Import…]     │  │
│    ↳ Mar 5 — Liz                 │  [Duplicate]     [Export]      │  │
│  ● Hamilton Tour 2               │                                │  │
│  ● Hadestown                     │                                │  │
│  ● Spring Awakening              │                                │  │
└──────────────────────────────────┴────────────────────────────────┴──┘
```

### Project List

- **List items, not cards.** More information-dense, works at any window width.
- **Recent** section (last 5–6 projects) always at the top, unaffected by sort.
- **All Projects** section with sort control: Last Modified (default), Name A→Z, Date Created.
- Multi-version projects show `↳` indented sub-rows inline — no separate page navigation.
- Single-version projects show nothing extra — the version layer is invisible when not needed.

### Opening a Project

Open exists in two places, with consistent semantics:

| Interaction                     | Result                                     |
| ------------------------------- | ------------------------------------------ |
| Single click on row             | Selects it — loads preview in right panel  |
| Single click on version sub-row | Selects that version — updates right panel |
| Double-click on row             | Opens directly (most recent version)       |
| Double-click on version sub-row | Opens that specific version                |
| Enter key                       | Opens selected project/version             |
| "Open" button in right panel    | Opens currently-selected version           |

For multi-version projects: single-clicking the parent row auto-selects the most recent version
in the right panel while expanding sub-rows for explicit version selection.

### Right Panel

- **Show logo** if uploaded in project details (already exists in the data model).
- **Typographic placeholder** when no logo is uploaded:
  - Multi-word titles: first letter of each word (e.g., "Frozen the Musical" → "FM")
  - Single-word titles: first and last letters (e.g., "Hamilton" → "HN", "Frozen" → "FN")
  - Color: hashed from show name → consistent hue, fixed saturation/lightness
- **Version list** when multiple versions exist — clicking a version updates the right panel
  metadata and the Open button targets that version.
- **Actions**: Open, Import…, Duplicate, Export.

### Tagging

Tags replace the folder concept. A project can have multiple tags; tags are additive filters.

- Filter chips appear above the All Projects list: `[All] [Broadway] [Corporate] [Tour] [+]`
- Clicking a tag chip filters All Projects to projects with that tag (Recent stays unfiltered).
- Multiple chips selected = union (shows projects with any of the selected tags).
- `[+]` opens inline tag management (create, rename, recolor, delete).
- Tags assigned via right-click on a project row or from the right panel.

### Versions (Offline File Sharing)

Versions are how ShowStack handles offline file handoffs — analogous to Eos file versioning.
A designer exports a project, sends it to a colleague, the colleague imports it back with their
changes, and ShowStack creates a timestamped version entry.

- Projects with one version: version layer is invisible.
- Projects with multiple versions: `↳` sub-rows in the list; version history in the right panel.
- "Import…" action in the right panel is the entry point for receiving a file.
- Cloud-synced projects (PowerSync) will rarely have multiple versions in practice.

---

## 2. Navigation Model

### Current vs. Proposed Click Depth

```
Current:  Landing → Project Page → ModuleLanding → SystemDocs → [tool]   (3–4 clicks)
Proposed: Landing → [double-click] → Fixtures                             (1 click)
```

### What Changes

- **ModuleLanding is eliminated for the lighting module.** Clicking a project goes directly
  into the Fixtures view with the sidebar visible.
- **ModuleLanding is preserved as a discipline selector** for when Audio, Video, and other
  modules ship. At that point, it becomes a one-time choice per project (which discipline
  you're working on) rather than a repeated navigation step.
- **Project metadata** (previously on the Project Page / ModuleLanding) moves to
  "Project Info" in the sidebar — accessible at any time, never a required step.
- **SystemDocs is eliminated.** Its four tabs (Equipment Manager, Power Management, Paperwork,
  Labels) become direct sidebar items.
- **`embedded` prop on EquipmentManager, PowerManagement, and LabelDesigner** is removed as
  part of this refactor — it was only needed because these components were rendered inside
  SystemDocs.

### Future Multi-Discipline Navigation

When Audio/Video modules launch, the sidebar gains section dividers rather than requiring
a navigation page:

```
─ LIGHTING ──────────────────
  Fixtures
  ...
─ AUDIO ─────────────────────
  Channel List
  ...
```

---

## 3. Sidebar Navigation Structure

The sidebar is the primary navigation within a project. Always visible, always one click.
Placeholder items are marked — they exist in the nav as disabled/coming-soon items so the
structure is established before the features ship.

```
─ EQUIPMENT MANAGER ─────────────────────────────────────
  Fixtures
  Infrastructure
  Racks & Distribution
  Multi-Cable Tracking                ← placeholder

─ POWER ─────────────────────────────────────────────────
  Services & Templates
  Power Summary
  Power/Cable Diagrams                ← placeholder

─ VISUALIZATION ─────────────────────────────────────────
  DMX Map                             ← placeholder
  Network Topology (Blueprint)        ← placeholder

─ PRODUCTION ────────────────────────────────────────────
  Shop Orders
  Labels
  Paperwork

─ PROJECT ───────────────────────────────────────────────
  Project Info
  Team
  Show Health                         ← validation panel
```

### Sidebar Error Badges

Validation errors appear as count badges on the affected nav item:

```
  Fixtures               (3)   ← red: 3 DMX conflicts
  Racks & Distribution   (1)   ← amber: 1 circuit near capacity
```

- Red badge = hard error (must fix before show)
- Amber badge = warning (worth reviewing)
- Clicking a badge navigates to that tool with errors pre-filtered/highlighted

---

## 4. Equipment Manager Layout

### Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│  Toolbar: [Add Fixture] [Import] [Export ▾]    [⌘K]  [⚙]           │
├───────────────────────────────────────────┬──────────────────────────┤
│                                           │                          │
│  VirtualDataGrid                          │  Inspector Panel         │
│                                           │                          │
│  ← [filter chips inline in grid header] → │  ● Smart Groups          │
│                                           │  ─────────────────────   │
│                                           │  ● Conditional Format.   │
│                                           │  ─────────────────────   │
│                                           │  (future: Properties)    │
│                                           │                          │
└───────────────────────────────────────────┴──────────────────────────┘
```

### Filter Chips (inline, replacing FilterBar row)

The separate `FilterBar` component row is replaced by inline filter chips in the grid header
area — similar to Notion/Linear. Active filters appear as removable chips; the full filter
builder is accessible via a filter icon. This removes a persistent horizontal row that took
up vertical space regardless of whether filters were active.

### Toolbar

Slimmer than today — only primary actions live here. Sort, filter, column visibility, and
persistent tools move to the inspector or inline controls. `⌘K` opens the command palette
app-wide.

### Tabs → Sidebar

The Fixtures / Infrastructure / Power sub-tab row inside Equipment Manager is removed.
Those are now sidebar items:

- **Fixtures** → the VirtualDataGrid (current Equipment Manager fixtures tab)
- **Infrastructure** → the Infrastructure grid (current Equipment Manager infrastructure tab)
- **Racks & Distribution** → the RackManager (promoted from Equipment Manager's power sub-tab;
  the power sub-tab inside Equipment Manager is eliminated)

---

## 5. Inspector Panel System

### Architecture

The Inspector Panel is a **composable shell** — it owns layout, docking, resize, and
show/hide. Content is swapped by context. Built as part of the Smart Groups feature and
designed from the start to be reused.

```typescript
// Conceptual structure
<InspectorPanel>
  <GroupsInspector />                    // Smart Groups — first consumer
  <ConditionalFormattingInspector />     // migrates from modal dialog
  <FixturePropertiesInspector />         // future: selected fixture detail
  <LabelDesignInspector />              // future: label design properties
</InspectorPanel>
```

### Styling

All colors, spacing, and sizing via CSS custom properties — no hardcoded Tailwind values
inside the inspector components. This means the visual layer can be updated during the
broader UI overhaul without touching component logic.

### Consumer Migration Order

1. **Smart Groups** — built with the inspector shell (Phase 2 of Smart Groups plan)
2. **Conditional Formatting** — migrates from `ConditionalFormattingDialog.tsx` modal
3. **Fixture Properties** — future: shows selected fixture fields in the inspector
4. **Label Design** — future: label element properties panel

---

## 6. Tool Consolidations

### Labels: One Implementation

Currently two implementations:

- `pages/modules/LabelDesigner.tsx` — the SystemDocs tab (label type list page)
- `pages/LabelVisualDesigner.tsx` — the canvas-based visual designer, accessed via
  "Edit with Visual Designer" button

**Resolution:** The visual designer (`LabelVisualDesigner.tsx`) becomes the single
implementation. The intermediate list page (`LabelDesigner.tsx`) is retired.

The **Labels sidebar item** opens the visual designer directly. Label type and printer type
selection move into the designer as a "New Label" dialog — same information, collected
upfront when creating a label rather than as a navigation step.

### Power: One Location

Currently duplicated:

- Power sub-tab inside Equipment Manager (`PowerSummaryPanel` + `RackManager`)
- PowerManagement page (`RackManager` + `PowerSummaryPanel` + `PhaseTemplateManager` +
  `ServiceConfigurationPanel`)

**Resolution:**

- Racks & Distribution → Equipment Manager sidebar section
  (physical equipment, belongs with inventory tools)
- Services & Templates and Power Summary → Power sidebar section
  (electrical planning and calculation)
- The power sub-tab inside EquipmentManager is **removed**

### Shop Orders: Joins the Sidebar

Currently accessed through a separate module route, disconnected from the SystemDocs
navigation. Shop Orders and Fixtures are the two most tightly related tools in a production
workflow — designers move between them constantly.

**Resolution:** Shop Orders becomes a sidebar item in the Production section, navigable from
any tool in one click.

---

## 7. Show Health (Validation Panel)

Accessed via "Show Health" in the Project sidebar section. Aggregates all validation errors
across the entire show, filterable by type.

### Error Types and Home Context

| Error                        | Sidebar badge on     | Severity |
| ---------------------------- | -------------------- | -------- |
| Duplicate DMX address        | Fixtures             | Error    |
| Duplicate channel number     | Fixtures             | Error    |
| Fixture missing circuit      | Fixtures             | Warning  |
| Fixture missing focus chart  | Fixtures             | Warning  |
| Circuit over dimmer capacity | Racks & Distribution | Error    |
| Power overload               | Racks & Distribution | Error    |
| Port not assigned            | Infrastructure       | Warning  |
| Port over capacity           | Infrastructure       | Error    |

### Behavior

- Validation runs passively as data changes — no "check now" button.
- Sidebar badges update in real time.
- Clicking a badge navigates to that tool with the affected rows highlighted.
- Show Health panel shows all errors in one list, filterable by type or severity.
- Show Health is the pre-show checklist use case — "is this show ready to go to the shop?"

---

## 8. Design System Notes

### Design Tokens

A thin token layer is required before the visual overhaul — not a full design system, but
enough to avoid hardcoded values:

```css
/* Surface colors */
--color-surface-base
--color-surface-elevated
--color-surface-overlay

/* Interactive */
--color-accent
--color-accent-subtle
--color-destructive

/* Text */
--color-text-primary
--color-text-secondary
--color-text-disabled

/* Layout */
--spacing-sidebar-width
--spacing-inspector-width
--spacing-toolbar-height
--spacing-panel-padding

/* Radius */
--radius-panel
--radius-chip
--radius-button
```

These power both dark and light mode and allow the visual overhaul to retheme by editing
the token values rather than touching component files.

### Typography Placeholder System (Landing Page)

For projects without an uploaded show logo:

- **Multi-word titles:** first letter of each word — "Frozen the Musical" → "FM"
- **Single-word titles:** first and last letters — "Hamilton" → "HN", "Frozen" → "FN"
- **Color:** deterministically generated from show name (hash → hue, fixed saturation and
  lightness for dark mode legibility)

---

## 9. Phasing

This is a structural change, not a big-bang rewrite. Each step ships independently.

### Phase 1 — Inspector Shell (with Smart Groups)

Build `<InspectorPanel>` and `<GroupsInspector>` as planned in the Smart Groups
implementation plan. Establish CSS custom property styling convention.

_Smart Groups Phases 1, 3, and 4 are complete (backend, grid integration, shop order/labels/paperwork). Phase 2 (this phase) adds the visible inspector UI._

### Phase 2 — Conditional Formatting Migration

Move `ConditionalFormattingDialog` into `<ConditionalFormattingInspector>` using the
inspector shell. Modal dialog is retired.

### Phase 3 — Landing Page

New landing page: list + right panel, tags, version handling, show art/placeholder.

### Phase 4 — Navigation Flattening ✅

- `ProjectWorkspace` layout with persistent sidebar (`ProjectSidebar.tsx`)
- Flat nested routes under `/project/:projectId` replacing SystemDocs/ModuleLanding
- `EquipmentManager`, `PowerManagement`, `Paperwork`, `LabelDesigner` — `embedded` prop removed
- `initialTab` prop pattern for tab-based pages; `key` prop forces remount on route change
- `ProjectInfo` page added at `project-info` route
- Shop Orders wired directly into sidebar

### Phase 5 — Labels Consolidation ✅

- `LabelDesigner.tsx` intermediate list page retired
- `LabelsPage.tsx` — inline Avery template picker → `LabelLayoutDesigner` directly
- `LabelVisualDesigner` navigates back to `/project/:id/labels` on save/cancel

### Phase 6 — Power Consolidation ✅

- Power sub-tab removed from `EquipmentManager` tab bar
- Racks & Distribution → `PowerManagement` with `initialTab="racks"` at `/racks` route
- Services & Templates at `/power/services`, Power Summary at `/power/summary`
- All power routes under sidebar Power section

### Phase 7 — Show Health ✅

- `types/validation.ts` — `ValidationIssue`, `ValidationSeverity`, `ValidationSidebarItem`
- `utils/validation.ts` — pure functions: duplicate DMX, duplicate channel, missing circuit, port over capacity
- `hooks/useValidation.ts` — subscribes to fixture + infrastructure stores, returns `{ issues, badgeCounts }`
- `ProjectSidebar` — red/amber count badges on Fixtures, Infrastructure, Racks & Distribution nav items
- `ShowHealth.tsx` — passive panel at `/project/:id/show-health` with grouped error/warning lists

### Phase 8 — Filter Chips + Toolbar Slim — **Next Up**

Replace FilterBar row with inline grid header chips. Slim toolbar to primary actions only.

### Phase 9 — Design Token Rollout

Apply CSS custom properties across all components as they are touched in the above phases.
Full visual overhaul can then retheme by updating token values.

---

## Placeholder Features (Nav Structure Established)

These items appear in the sidebar as disabled/coming-soon entries. Structure is set now so
they slot in without navigation changes when they ship.

| Feature                      | Sidebar location                 | Related plan             |
| ---------------------------- | -------------------------------- | ------------------------ |
| Multi-Cable Tracking         | Equipment Manager section        | TBD                      |
| Power/Cable Diagrams         | Power section                    | TBD                      |
| Power Distribution Reports   | Paperwork (report template type) | TBD                      |
| DMX Map Visualization        | Visualization section            | TBD                      |
| Network Topology (Blueprint) | Visualization section            | `BLUEPRINT_TOOL_PLAN.md` |

---

**Last Updated:** March 11, 2026
**Author:** Claude Code
**Version:** 1.0
