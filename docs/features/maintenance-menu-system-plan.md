# Smart Groups Implementation Plan

**Feature:** Fixture Smart Groups — named saved filters driving shop order automation
**Delivery:** Phased approach with 4 iterative milestones
**Timeline:** 3 weeks
**Effort:** 1 developer full-time
**Status:** Planned (not yet implemented)
**Created:** January 20, 2026
**Revised:** March 9, 2026
**Priority:** Medium-High (enables shop order automation)

---

## Overview

Smart Groups replace the originally planned "Maintenance Menu" category system with a
ShowStack-native approach. Rather than replicating Lightwright 6's Maintenance Menu model (separate
rule engine, 3-table schema, 4-tab dialog), Smart Groups use **named saved filters** built on top
of the existing filter system.

**Lightwright context:** Lightwright's own new platform (launched January 2026) has moved away from
the LW6 Maintenance Menu model as part of their full rebuild. Targeting LW6 parity is no longer
the right frame — the goal is a better ShowStack-native solution.

### Core Capabilities

- **Named groups** with color, notes, and shop-specific notes
- **Saved filter membership** — group membership computed on-demand, never stale
- **Manual pins** — force-include fixtures regardless of filter
- **Inspector panel UI** — groups managed in a sidebar, not a modal dialog
- **Shop order automation** — groups become sections; `shop_notes` becomes the section note
- **Labels and paperwork** — group field available throughout

### Note Field Mapping

| Field                      | Level     | Where it appears                             |
| -------------------------- | --------- | -------------------------------------------- |
| Group `notes`              | Section   | Paperwork section headers, inspector display |
| Group `shop_notes`         | Section   | Shop order section note                      |
| Fixture `notes` (existing) | Line item | Shop order line-item notes                   |

---

## Strategic Value

1. **Shop Order Automation** — groups directly drive section creation, quantity rollup, and
   section notes (#29)
2. **Inspector Panel Foundation** — first consumer of the shared `<InspectorPanel>` shell;
   conditional formatting and future panels reuse the same infrastructure
3. **Simpler implementation** — 2 tables + filter reuse vs. 3 tables + custom rule engine
4. **Always current** — no re-evaluate step, no stale assignment table

**Related Issues:** #29 (shop order automation), #14 (auto-complete)

---

## Architecture Decisions

### 1. Database Schema: Two Tables

- `fixture_groups` — group definitions: name, color, notes, shop_notes, filter_def (JSON)
- `fixture_group_pins` — manual fixture pins (force-include regardless of filter)

No assignment join table. Membership is computed on-demand.

### 2. Filter Reuse, No Custom Rule Engine

Group auto-membership is evaluated by running the existing filter system against the stored
`filter_def` JSON. The same logic that powers the Equipment Manager filter toolbar powers group
membership. No new rule engine, no re-evaluate button, no stale state.

### 3. State Management: Zustand Store

- `groupStore.ts` for group CRUD and pin management
- `getGroupMembers(groupId)` evaluates filter + pins against current fixture list
- Integrates with existing `fixtureStore.ts` and filter utilities

### 4. UI Pattern: Inspector Panel

The Inspector Panel is a **shared shell** component, not a one-off sidebar. Smart Groups is
its first consumer. The shell handles docking, resize, and show/hide — content is swapped by
context. This architecture allows conditional formatting and future tools to migrate into the
same panel.

```
<InspectorPanel>
  <GroupsInspector />                    ← this feature
  <ConditionalFormattingInspector />     ← migrate from modal (future)
  <FixturePropertiesInspector />         ← future
  <LabelDesignInspector />              ← future
</InspectorPanel>
```

### 5. Integration Points

- **Equipment Manager:** Inspector panel, color indicator column, grid filter, bulk pin action
- **Shop Orders:** Auto-populate sections from groups; `shop_notes` → section note
- **Labels:** `{group}` field token, color element
- **Paperwork:** "Group by: Smart Group" report option

---

## Completed Infrastructure (Available to Build On)

### Menu Bar Framework (PR #83 — March 4, 2026)

`apps/desktop/src/main/menu/menuTemplate.ts` — Full context-aware menu already exists.
Current top-level menus: ShowStack (macOS), File, Edit, View, Project, Tools, Window, Help.

Smart Groups does **not** add a top-level "Maintenance" menu. Access is via the Inspector Panel
in Equipment Manager. If a menu entry is needed for keyboard discoverability, "Manage Groups..."
can be added under the Project menu, not as a new top-level menu.

`apps/desktop/src/main/menu/menuState.ts` — `MenuStateManager` singleton; `MenuContext` type;
`MenuStateData` interface. IPC convention: `menu:*` channels via `sendToRenderer()`.

### Menu Handler Hook Pattern

- `apps/desktop/src/renderer/src/hooks/useEquipmentMenuHandlers.ts`
- `apps/desktop/src/renderer/src/hooks/useProjectMenuHandlers.ts`
- `apps/desktop/src/renderer/src/hooks/useShopOrderMenuHandlers.ts`

If a menu entry is added for "Manage Groups...", create `useGroupMenuHandlers.ts` following this
pattern (register on mount, unregister on unmount, store props in refs).

### Existing Filter System

The Equipment Manager filter system already evaluates field/operator/value conditions against
fixtures. `filter_def` on `fixture_groups` stores a filter in this same JSON format. Group
membership evaluation calls the same filter utility — no new matching logic to write.

---

## Phase 1: Core System (Week 1)

**Milestone:** Database schema, IPC handlers, filter-based membership evaluation

### New Files to Create

```
src/main/database/queries/
├── groups.ts                             - CRUD for fixture_groups and fixture_group_pins
└── __tests__/
    └── groups.test.ts                    - 80%+ coverage

src/main/ipc/
├── groups.ts                             - IPC handlers
└── __tests__/
    └── groups.test.ts                    - 70%+ coverage

src/renderer/src/types/
└── group.ts                              - TypeScript interfaces

src/renderer/src/store/
├── groupStore.ts                         - Zustand store
└── __tests__/
    └── groupStore.test.ts
```

### Files to Modify

```
src/main/database/projectSchema.ts        (Add 2 tables: fixture_groups, fixture_group_pins)
src/main/ipc/index.ts                     (Register group handlers)
```

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS fixture_groups (
  id            TEXT     PRIMARY KEY,
  project_id    TEXT     NOT NULL,
  name          TEXT     NOT NULL,
  color         TEXT,                    -- hex color
  notes         TEXT,                    -- general notes (paperwork, inspector)
  shop_notes    TEXT,                    -- section-level note for shop order output
  filter_def    TEXT,                    -- JSON: existing filter system format
  sort_order    INTEGER  NOT NULL DEFAULT 0,
  created_at    INTEGER  NOT NULL,
  updated_at    INTEGER  NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fixture_group_pins (
  fixture_id    TEXT     NOT NULL,
  group_id      TEXT     NOT NULL,
  created_at    INTEGER  NOT NULL,
  PRIMARY KEY (fixture_id, group_id),
  FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id)   REFERENCES fixture_groups(id) ON DELETE CASCADE
);

CREATE INDEX idx_group_pins_group   ON fixture_group_pins(group_id);
CREATE INDEX idx_group_pins_fixture ON fixture_group_pins(fixture_id);
```

### TypeScript Interfaces

```typescript
// src/renderer/src/types/group.ts

export interface FixtureGroup {
  id: string;
  project_id: string;
  name: string;
  color?: string;
  notes?: string;
  shop_notes?: string;
  filter_def?: string; // JSON — same format as existing FilterDefinition
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface FixtureGroupPin {
  fixture_id: string;
  group_id: string;
  created_at: number;
}
```

### IPC Handlers

```typescript
// src/main/ipc/groups.ts

export function registerGroupHandlers(): void {
  ipcMain.handle('groups:getAll', async (_event, projectId: string) => getAllGroups(projectId));
  ipcMain.handle('groups:create', async (_event, group: Partial<FixtureGroup>) =>
    createGroup(group),
  );
  ipcMain.handle('groups:update', async (_event, id: string, updates: Partial<FixtureGroup>) =>
    updateGroup(id, updates),
  );
  ipcMain.handle('groups:delete', async (_event, id: string) => deleteGroup(id));
  ipcMain.handle('groups:pin', async (_event, fixtureId: string, groupId: string) =>
    pinFixtureToGroup(fixtureId, groupId),
  );
  ipcMain.handle('groups:unpin', async (_event, fixtureId: string, groupId: string) =>
    unpinFixtureFromGroup(fixtureId, groupId),
  );
  ipcMain.handle('groups:getPins', async (_event, groupId: string) => getGroupPins(groupId));
}
```

### Membership Evaluation

Group membership is not stored — it is computed by running `filter_def` through the existing
filter utility, then unioning pinned fixture IDs:

```typescript
// src/renderer/src/store/groupStore.ts

function getGroupMembers(group: FixtureGroup, allFixtures: Fixture[]): Fixture[] {
  const filterMatches = group.filter_def
    ? applyFilter(allFixtures, JSON.parse(group.filter_def)) // existing utility
    : [];
  const pinnedIds = new Set(group.pins?.map((p) => p.fixture_id) ?? []);
  const matchedIds = new Set(filterMatches.map((f) => f.id));

  return allFixtures.filter((f) => matchedIds.has(f.id) || pinnedIds.has(f.id));
}
```

No re-evaluate step. No stale data. Membership is always derived from the current fixture list.

### Testing Strategy

**Key Tests:**

- Group CRUD (create, read, update, delete)
- Pin/unpin fixture
- `getGroupMembers` with filter-only, pin-only, and combined membership
- Filter evaluation edge cases (null fields, empty strings)
- IPC handler validation

**Coverage Targets:**

- Database Queries: 80%+
- IPC Handlers: 70%+
- Store / membership evaluation: 80%+

### Deliverables

- [ ] Database schema with 2 tables
- [ ] Group CRUD operations with 80%+ coverage
- [ ] Pin/unpin operations
- [ ] Membership evaluation via existing filter system
- [ ] IPC handlers with 70%+ coverage
- [ ] TypeScript interfaces

**Effort:** 1 week

---

## Phase 2: Inspector Panel UI (Week 2)

**Milestone:** `<InspectorPanel>` shell + `<GroupsInspector>` as first consumer

### New Files to Create

```
src/renderer/src/components/inspector/
├── InspectorPanel.tsx                    - Shell: docking, resize, show/hide, context routing
├── GroupsInspector.tsx                   - Groups list + group detail view
├── GroupChip.tsx                         - Colored chip with name and fixture count
├── GroupDetail.tsx                       - Name, color, notes, shop_notes, filter, pins
├── GroupFilterEditor.tsx                 - Filter definition editor (wraps existing filter UI)
└── __tests__/
    ├── InspectorPanel.test.tsx
    ├── GroupsInspector.test.tsx
    └── GroupDetail.test.tsx
```

### Files to Modify

```
src/renderer/src/pages/modules/EquipmentManager.tsx
  (Mount <InspectorPanel> alongside the grid; wire group selection to grid filter)
```

### InspectorPanel Shell

The shell is intentionally minimal — it owns layout and visibility, not content:

```typescript
// src/renderer/src/components/inspector/InspectorPanel.tsx

type InspectorContent = 'groups' | 'conditionalFormatting' | 'fixtureProperties';

interface InspectorPanelProps {
  content: InspectorContent;
  onClose: () => void;
}

export function InspectorPanel({ content, onClose }: InspectorPanelProps) {
  return (
    <aside className="inspector-panel">
      <div className="inspector-panel__header">
        <InspectorTabs content={content} />
        <button onClick={onClose} aria-label="Close inspector" />
      </div>
      <div className="inspector-panel__body">
        {content === 'groups' && <GroupsInspector />}
        {content === 'conditionalFormatting' && <ConditionalFormattingInspector />}
        {content === 'fixtureProperties' && <FixturePropertiesInspector />}
      </div>
    </aside>
  );
}
```

Styling uses CSS custom properties so the panel can be reskinned during the broader UI overhaul
without structural changes.

### GroupsInspector Layout

```
┌─────────────────────────────────┐
│  Groups                    [+]  │  ← header with "New Group" button
├─────────────────────────────────┤
│  ● All Moving Lights    (14) ▶  │  ← colored chip, fixture count, active indicator
│  ● FOH Fixtures          (8) ▶  │
│  ● Rental Package        (6) ▶  │
├─────────────────────────────────┤
│  [Selected group detail]        │
│  Name: ___________________      │
│  Color: ■ ________________      │
│  Notes: ________________        │
│         ________________        │
│  Shop notes: ___________        │
│              ___________        │
│  Filter: [filter definition]    │
│  Pinned fixtures: (3)  [edit]   │
└─────────────────────────────────┘
```

### Group Detail Fields

- **Name**: text input, inline edit
- **Color**: color swatch picker (same palette as conditional formatting)
- **Notes**: textarea — appears in paperwork section headers
- **Shop notes**: textarea — section note in shop order output
- **Filter**: renders `<GroupFilterEditor>` which wraps the existing filter condition UI
- **Pinned fixtures**: list of manually pinned fixture IDs with unpin action

### Menu Entry (Optional, for discoverability)

If a keyboard-accessible entry point is needed, add to the Project menu rather than a new
top-level menu:

```typescript
// apps/desktop/src/main/menu/menuTemplate.ts — in buildProjectMenu()
{
  label: 'Manage Groups...',
  accelerator: 'CmdOrCtrl+Shift+G',
  enabled: !!state.projectId,
  click: () => sendToRenderer('menu:groups:open'),
}
```

### Testing Strategy

**Key Tests:**

- Inspector panel renders correct content for each context
- Groups list shows live fixture counts
- Clicking a group applies filter to grid
- Creating a group from current grid filter
- Color picker updates group color
- Notes and shop_notes autosave on blur

**Coverage Targets:**

- UI Components: 50%+

### Deliverables

- [ ] `<InspectorPanel>` shell (composable, CSS-custom-property styled)
- [ ] `<GroupsInspector>` — group list with live counts, group detail form
- [ ] `<GroupFilterEditor>` — wraps existing filter UI for defining group membership
- [ ] Equipment Manager wired to mount inspector and apply group filter on selection
- [ ] Optional: "Manage Groups..." entry in Project menu
- [ ] 50%+ component test coverage

**Effort:** 1 week

---

## Phase 3: Equipment Manager Integration (Week 3, Part 1)

**Milestone:** Group indicator column, bulk pin action, context menu

### New Files to Create

```
src/renderer/src/components/fixture/
├── GroupIndicator.tsx                    - Color dot(s) showing group membership
└── __tests__/
    └── GroupIndicator.test.tsx
```

### Files to Modify

```
src/renderer/src/pages/modules/EquipmentManager.tsx
  (Add group indicator column; add "Pin to Group" bulk action)
src/renderer/src/components/fixture/VirtualDataGrid.tsx
  (Render GroupIndicator in group column)
src/renderer/src/components/fixture/FixtureContextMenu.tsx
  (Add "Pin to Group" submenu)
```

### Group Indicator Column

```typescript
// GroupIndicator component
export function GroupIndicator({ groups }: { groups: FixtureGroup[] }) {
  return (
    <div className="flex gap-1 items-center">
      {groups.map(group => (
        <div
          key={group.id}
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.color ?? '#94a3b8' }}
          title={group.name}
        />
      ))}
    </div>
  );
}
```

### Context Menu: Pin to Group

```typescript
// FixtureContextMenu — add submenu
{
  label: 'Pin to Group',
  submenu: groups.map(group => ({
    label: group.name,
    checked: isPinnedToGroup(fixture.id, group.id),
    click: () => toggleGroupPin(fixture.id, group.id),
  }))
}
```

### Bulk Pin Action

In the bulk edit toolbar (appears when rows are selected):

```
[Pin to Group ▾]   → dropdown of all groups → applies pin to all selected fixtures
```

### Deliverables

- [ ] Group indicator column in Equipment Manager grid
- [ ] Context menu "Pin to Group" with toggle behavior
- [ ] Bulk "Pin to Group" action on selected fixtures
- [ ] 50%+ component test coverage

**Effort:** 3-4 days

---

## Phase 4: Shop Order, Labels & Paperwork Integration (Week 3, Part 2)

**Milestone:** Groups drive shop order sections; `shop_notes` maps to section note; labels and
paperwork consume group data

### Files to Modify

```
src/renderer/src/components/prep/ShopOrderTable.tsx
  (Add "Auto-populate from Groups" action)
src/renderer/src/utils/shop-order/shopOrderHelpers.ts
  (Add generateSectionsFromGroups())
src/renderer/src/utils/labels/labelDataMapper.ts
  (Add {group} field token)
src/renderer/src/utils/paperwork/reportGenerators.ts
  (Add groupBy: 'smart-group' option)
```

### Shop Order: Auto-populate from Groups

```typescript
// shopOrderHelpers.ts
export async function generateSectionsFromGroups(
  projectId: string,
  groups: FixtureGroup[],
  allFixtures: Fixture[],
): Promise<void> {
  for (const group of groups) {
    const members = getGroupMembers(group, allFixtures);

    // One section per group
    const section = await createShopOrderSection({
      name: group.name,
      notes: group.shop_notes ?? '', // section-level note
    });

    // Quantity rollup by fixture type
    const byType = groupBy(members, (f) => f.type);
    for (const [type, fixtures] of Object.entries(byType)) {
      await createShopOrderItem({
        section_id: section.id,
        description: type,
        quantity: fixtures.length,
        notes: fixtures
          .map((f) => f.notes)
          .filter(Boolean)
          .join('; '), // line-item notes from fixture.notes
      });
    }
  }
}
```

**Note mapping summary:**

- `group.shop_notes` → `section.notes` (section-level annotation for the shop)
- `fixture.notes` → `item.notes` (line-item annotation per fixture type)

### Label Integration

```typescript
// labelDataMapper.ts — add to AVAILABLE_FIELDS
{
  field: 'group',
  label: 'Group',
  type: 'text',
  getValue: (fixture: Fixture, context: { groups: FixtureGroup[] }) => {
    const memberOf = context.groups.filter(g =>
      getGroupMembers(g, context.allFixtures).some(f => f.id === fixture.id)
    );
    return memberOf.map(g => g.name).join(', ');
  },
},
```

### Paperwork Integration

```typescript
// reportGenerators.ts
export function generateChannelHookup(
  fixtures: Fixture[],
  options: ReportOptions,
  groups?: FixtureGroup[],
) {
  if (options.groupBy === 'smart-group' && groups?.length) {
    return groups.map((group) => ({
      sectionTitle: group.name,
      sectionNotes: group.notes,
      fixtures: getGroupMembers(group, fixtures),
    }));
  }
  // ... existing grouping logic
}
```

### Testing Strategy

**Key Tests:**

- `generateSectionsFromGroups` creates correct section count, names, notes
- `shop_notes` appears as section note, not line-item note
- `fixture.notes` appears as line-item note, not section note
- `{group}` label field resolves correctly for pinned and filter-matched fixtures
- Paperwork groups by smart group in correct sort order
- Fixtures in multiple groups appear in each section

**Coverage Targets:**

- Integration Functions: 60%+

### Deliverables

- [ ] "Auto-populate from Groups" action in Shop Order Builder
- [ ] `shop_notes` → section note; `fixture.notes` → line-item notes
- [ ] `{group}` field token in label designer
- [ ] "Group by: Smart Group" option in paperwork report generator
- [ ] 60%+ test coverage for integration functions

**Effort:** 3-4 days

---

## Testing Summary

| Component                                              | Coverage Target |
| ------------------------------------------------------ | --------------- |
| Database Queries                                       | 80%+            |
| IPC Handlers                                           | 70%+            |
| Group Store / membership evaluation                    | 80%+            |
| UI Components                                          | 50%+            |
| Integration Functions (shop orders, labels, paperwork) | 60%+            |
| **Overall**                                            | **70%+**        |

---

## Risk Assessment

### Medium-Risk Items

1. **Filter definition format stability**
   - **Risk:** The existing filter format changes and stored `filter_def` JSON becomes invalid
   - **Mitigation:** Version the filter format; validate on load; fallback to empty group
     (show 0 members, prompt user to redefine filter)

2. **Membership computation performance**
   - **Risk:** Computing membership for 20 groups × 5,000 fixtures on every render
   - **Mitigation:** Memoize `getGroupMembers` results; recompute only when `filter_def`,
     fixture list, or pins change

3. **Inspector panel restyling**
   - **Risk:** Broader UI overhaul requires significant rework of the inspector shell
   - **Mitigation:** Style exclusively via CSS custom properties; no hardcoded colors or
     dimensions in component files

### Low-Risk Items

1. **Multiple group membership**
   - A fixture can match multiple groups — this is intentional and correct. Shop orders,
     labels, and paperwork all handle it (fixture appears in each section it belongs to).

---

## Success Criteria

### Technical

- [ ] Group membership always reflects current fixture data (no re-evaluate step)
- [ ] Filter definition stored and evaluated using existing filter system format
- [ ] `shop_notes` flows to section note; `fixture.notes` flows to line-item note
- [ ] 70%+ overall test coverage
- [ ] `<InspectorPanel>` shell usable by conditional formatting without structural changes

### User Experience

- [ ] Creating a group takes < 30 seconds (name a filter, pick a color)
- [ ] Inspector shows live fixture count per group
- [ ] Auto-populate from Groups produces a correctly structured shop order
- [ ] Group field available in labels and paperwork

---

## Future Enhancements

1. **Conditional Formatting migration** — move from modal dialog to `<ConditionalFormattingInspector>`
   using the inspector shell built here
2. **Group templates** — pre-built groups for common show types (corporate, concert, theatre)
3. **Import/export groups** — share group definitions across projects
4. **Group analytics** — fixture count by type within each group
5. **Group sort in grid** — sort fixture grid by group membership

---

**Last Updated:** March 9, 2026
**Author:** Claude Code
**Version:** 2.0
