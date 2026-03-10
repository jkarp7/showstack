# Smart Groups

**Created:** January 18, 2026
**Revised:** March 9, 2026
**Status:** Planned
**Target Release:** TBD
**Estimated Effort:** 2-3 weeks

---

## Overview

Smart Groups allow designers to create named fixture groupings that drive shop order automation,
labels, and paperwork. Groups are defined as **named saved filters** — membership is computed
on-demand from existing filter logic rather than stored in a separate assignment table and kept
current by a re-evaluate step.

This is a ShowStack-native approach to fixture categorization. It deliberately does not replicate
Lightwright 6's Maintenance Menu system — Lightwright's own new platform (launched January 2026)
has also moved away from that model as part of their full rebuild.

---

## Core Concept

A **Group** is a named saved filter with:

- **Name** and **color** for visual identification
- **`notes`** — general notes about the group (paperwork, inspector display)
- **`shop_notes`** — flows to the **section-level note** in shop order output
- **`filter_definition`** — JSON using the existing filter system's format
- **Manual pins** — fixtures force-included regardless of filter match

Group membership is always computed fresh from the filter + pins. There is no stale data, no
re-evaluate button, and no assignment join table.

### Note Field Mapping

| Field                      | Where it appears                                                              |
| -------------------------- | ----------------------------------------------------------------------------- |
| `notes`                    | Inspector panel, paperwork section headers                                    |
| `shop_notes`               | Shop order section note (e.g., "Requires road cases — confirm qty with shop") |
| Fixture `notes` (existing) | Shop order line-item notes                                                    |

### Example Groups

| Group Name        | Filter                                      | Color  |
| ----------------- | ------------------------------------------- | ------ |
| All Moving Lights | Type contains "MAC" OR Type contains "Robe" | Blue   |
| FOH Fixtures      | Position starts with "FOH"                  | Green  |
| Rental Package    | Notes contains "rental"                     | Orange |

---

## User Interface: Inspector Panel

Groups are managed via the **Inspector Panel** — a composable sidebar in Equipment Manager. There
is no top-level "Maintenance" menu.

The Inspector Panel is a **shared shell** designed from the start to host multiple tools. Smart
Groups is its first consumer; conditional formatting and future panels (fixture properties, label
design) will use the same shell.

```
<InspectorPanel>
  <GroupsInspector />                    ← first consumer (this feature)
  <ConditionalFormattingInspector />     ← migrates from modal dialog
  <FixturePropertiesInspector />         ← future
  <LabelDesignInspector />              ← future
</InspectorPanel>
```

Context determines which inspector content is active. The shell handles docking, resize, and
show/hide; content components are swapped based on user action.

### Groups Inspector Interactions

- **Group list**: colored chips with name and live fixture count
- **Click a group** → applies it as the active grid filter
- **Select a group** → inspector body shows name, color, notes, shop_notes, filter
  definition, and pinned fixture list
- **Create a group**: define a filter in the grid, then "Save as Group" — or create from
  scratch in the inspector
- **Pin a fixture**: right-click in grid → "Pin to Group" → fixture included regardless of
  filter

---

## Database Schema

Two tables. No assignment join table.

```sql
CREATE TABLE fixture_groups (
  id            TEXT     PRIMARY KEY,
  project_id    TEXT     NOT NULL,
  name          TEXT     NOT NULL,
  color         TEXT,                    -- hex color for visual indicators
  notes         TEXT,                    -- general notes (paperwork, inspector)
  shop_notes    TEXT,                    -- section-level note in shop order output
  filter_def    TEXT,                    -- JSON: existing filter system format
  sort_order    INTEGER  NOT NULL DEFAULT 0,
  created_at    INTEGER  NOT NULL,
  updated_at    INTEGER  NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE fixture_group_pins (
  fixture_id    TEXT     NOT NULL,
  group_id      TEXT     NOT NULL,
  created_at    INTEGER  NOT NULL,
  PRIMARY KEY (fixture_id, group_id),
  FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id)   REFERENCES fixture_groups(id) ON DELETE CASCADE
);
```

---

## Integration Points

### Equipment Manager

- Group chips in inspector with live fixture count
- Clicking a group filters the grid
- Color indicator column shows group membership
- Bulk action: "Pin selected fixtures to Group"

### Shop Orders

- "Auto-populate from Groups" creates one section per group, ordered by `sort_order`
- Group `shop_notes` → section note
- Fixtures grouped by type within each section (quantity rollup)
- Existing fixture `notes` → line-item notes

### Labels

- `{group}` field token available in label designer
- Group color available as a label element

### Paperwork

- "Group by: Smart Group" option in report generator
- One section per group, ordered by `sort_order`
- Section header uses group `notes`

---

## What This Replaces

| Lightwright 6 concept                                 | ShowStack approach                                          |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| "Maintenance" top-level menu                          | Inspector panel in Equipment Manager                        |
| Categories + separate rule engine                     | Smart Groups — saved filters, existing filter system reused |
| 4-tab dialog (Notes, Physical, Vectorworks, Position) | Two fields: `notes` + `shop_notes`                          |
| `fixture_category_assignments` join table             | Computed on-demand from filter + pins                       |
| "Re-evaluate All Fixtures" button                     | Not needed — membership is always current                   |
| Column-per-menu-item dynamic menu                     | Group list in inspector                                     |

---

## Strategic Value

1. **Shop Order Automation** — groups directly drive section creation, quantity rollup, and
   section-level notes (#29)
2. **Inspector Panel Foundation** — establishes the shared UI shell for conditional formatting
   migration and future panels
3. **Simpler implementation** — 2 tables + filter reuse vs. 3 tables + custom rule engine
4. **Always current** — no re-evaluate step, no stale assignments, no sync overhead
5. **Industry-aligned** — matches the direction of modern lighting data tools

---

## Related Issues

- #29 (shop order automation)
- #14 (auto-complete)
