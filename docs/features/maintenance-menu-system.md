# Maintenance Menu System

**Created:** January 18, 2026
**Status:** Planned
**Target Release:** TBD
**Estimated Effort:** 3-4 weeks

---

## Overview

Lightwright 6 parity feature - custom categorization system for grouping fixtures.

---

## Core Functionality

### Menu Bar Integration
- Menu bar "Maintenance" menu with entry for every column (including user-defined)
- Each menu item opens dialog with 4 tabs:
  - **Notes**: General category notes
  - **Physical**: Physical characteristics, handling
  - **Vectorworks**: CAD-specific notes, layer assignments
  - **Position**: Location-specific notes

### Custom Categories/Families
- Create custom categories for grouping fixtures
  - Examples: "ALL Incandescent", "ALL Moving Lights", "FOH Fixtures"
- Rule-based auto-assignment (e.g., Type contains "MAC" → "Moving Lights")
- Manual assignment override capability

### Category Integration
- Show on labels
- Group on paperwork
- Drive shop order automation (Equipment Manager → Shop Order)
- Color-coded visual indicators
- Filter/search by category

---

## Implementation Phases

### Phase 1: Core System (5-7 days)
- Database schema for categories and rules
- Category CRUD operations
- Rule engine for auto-assignment
- IPC handlers

### Phase 2: Maintenance Menu UI (3-4 days)
- Menu bar integration
- 4-tab dialog component
- Category creation/editing interface
- Rule builder UI

### Phase 3: Integration (4-5 days)
- Label integration
- Paperwork grouping
- Shop order automation
- Visual indicators in Equipment Manager

### Phase 4: Advanced Features (2-3 days)
- Color-coding system
- Advanced filtering
- Import/export categories
- Category templates

---

## Strategic Value

- **CRITICAL for shop order automation** - Provides grouping mechanism
- Lightwright 6 parity achievement
- Enables sophisticated workflow customization
- Foundation for Equipment Manager → Shop Order automation (#29)

---

## Related Issues

- #29 (shop order automation)
- #14 (auto-complete)

---

## Database Schema

### New Tables

```sql
CREATE TABLE fixture_categories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  notes TEXT,
  physical_notes TEXT,
  vectorworks_notes TEXT,
  position_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE category_rules (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  field TEXT NOT NULL,
  operator TEXT NOT NULL, -- contains, equals, starts_with, ends_with, etc.
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES fixture_categories(id)
);

CREATE TABLE fixture_category_assignments (
  fixture_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  is_manual BOOLEAN DEFAULT 0, -- true if manually assigned, false if auto-assigned
  PRIMARY KEY (fixture_id, category_id),
  FOREIGN KEY (fixture_id) REFERENCES fixtures(id),
  FOREIGN KEY (category_id) REFERENCES fixture_categories(id)
);
```

---

## User Interface

### Maintenance Menu
- Location: Main menu bar
- Dynamic menu items based on columns
- Opens category dialog for selected column

### Category Dialog
- 4 tabs: Notes, Physical, Vectorworks, Position
- Category list on left sidebar
- Add/Edit/Delete category buttons
- Rule builder section

### Rule Builder
- Field dropdown (all fixture columns)
- Operator dropdown (contains, equals, starts_with, etc.)
- Value input
- Add/Remove rule buttons
- Test rule button (shows matching fixtures)

---

## Integration Points

### Equipment Manager
- Color-coded category indicators in grid
- Filter by category dropdown
- Bulk assign category action

### Labels
- Category field available for label design
- Color indicator on labels
- Auto-populate from category

### Paperwork
- Group by category option
- Category-based sections
- Color-coded grouping

### Shop Order Automation
- Auto-generate shop order sections from categories
- Group equipment by category
- Quantity rollup by category

---

## Notes

This feature provides the foundation for automated shop order generation by allowing designers to pre-group fixtures into logical categories that can then be automatically populated into shop order sections.
