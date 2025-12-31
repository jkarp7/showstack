# Shop Order Builder: Table-Based Redesign Migration Plan

**Created:** December 30, 2024
**Last Updated:** December 30, 2024
**Status:** Planned
**Target Release:** TBD
**Purpose:** Migrate Shop Order builder from dialog-based "insert item" methodology to spreadsheet-like table format

---

## Overview

Transform the Prep module's Shop Order builder from the current section-based dialog workflow to a spreadsheet-like table interface where revisions are columns rather than snapshots. This better supports vectorworks imports, bulk data entry, and matches designers' familiar workflows (Excel/Google Sheets/Numbers).

**Key Problem Being Solved:**
- Current dialog-based item insertion is slow for bulk data entry
- "Generate Revision" button workflow is cumbersome
- Doesn't match designers' familiar spreadsheet workflows
- Difficult to import from Vectorworks or paste from external tools

---

## Current vs. New Architecture

### Current Workflow
```
1. Click "+ Add Item" → Dialog opens
2. Fill in description, active, spare, venue quantities
3. Submit → Item appears in section list
4. Click "Generate Revision" → Snapshot created with change detection
5. Changes appear in separate revision panel
```

### New Workflow
```
1. Inline table editing (like Excel)
2. Type description, quantities directly in cells
3. Add revision = add new column
4. Changes detected by comparing column values
5. Print view shows DELTA column with +/-/~ indicators
```

---

## Data Entry Table Format

```
Section (dropdown) | Description | Rev 0 | Rev 1 | Rev N | Spare | Venue
───────────────────┼─────────────┼───────┼───────┼───────┼───────┼───────
Moving Lights      | LED Par 64  |  10   |  12   |  12   |   2   |   0
Moving Lights      | MAC Aura XB |   8   |   8   |  10   |   2   |   3
```

**Key Characteristics:**
- Simple, spreadsheet-like layout
- Section dropdown with carry-down behavior
- Revision columns = Active quantity only
- Spare = single shared column (not per-revision)
- Notes handled via modal (not in table)

---

## Print Output Format

```
SECTION: Moving Lights
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DELTA | RENTAL | TOTAL | Active | Spare | Description        | Venue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  +   |   12   |   14  |   12   |   2   | LED Par 64         |    0
  ~   |    7   |   10  |    8   |   2   | MAC Aura XB        |    3
      |   18   |   20  |   18   |   2   | Source Four 26°    |    0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Key Features:**
- **DELTA column**: First column, shows revision changes (+/-/~)
- **RENTAL & TOTAL**: Prominent styling (bold, highlighted)
- **Venue Qty**: Right-aligned
- Section notes appear below section header
- Line notes appear below item row (indented)

---

## Database Schema Changes

### New Columns

```sql
ALTER TABLE prep_equipment_items ADD COLUMN revision_quantities TEXT;
ALTER TABLE prep_equipment_items ADD COLUMN deleted_in_revision INTEGER;
```

### Data Structure

```typescript
// revision_quantities stores active quantities only:
{
  "0": 10,   // Rev 0 active qty
  "1": 12,   // Rev 1 active qty
  "2": 8     // Rev 2 active qty
}

// Spare stored separately in spare_qty column (single value)
// Total calculated: max(all revision values) + spare_qty
// Rental calculated: Total - venue_qty
```

### Updated TypeScript Interface

```typescript
export interface PrepEquipmentItem {
  id: string;
  section_id: string;
  description: string;

  // NEW: JSON string storing revision quantities (active only)
  revision_quantities: string; // JSON: { "0": 10, "1": 12 }

  // Spare quantity (single value, not per-revision)
  spare_qty: number;

  // Venue quantity (constant across revisions)
  venue_qty: number;

  // NEW: Soft delete support
  deleted_in_revision?: number;

  notes?: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}
```

---

## Migration Strategy

### Data Migration Script

```typescript
const migrateToTableFormat = async (projectId: string) => {
  const items = await getItems(projectId);
  const project = await getProject(projectId);
  const currentRevision = project.current_revision;

  for (const item of items) {
    const revQty: RevisionQuantities = {};

    // Populate active quantities from revision tracking
    if (item.added_in_revision !== null) {
      for (let rev = item.added_in_revision; rev <= currentRevision; rev++) {
        if (!item.removed_in_revision || rev < item.removed_in_revision) {
          revQty[rev] = item.active_qty;
        }
      }
    } else {
      // Item exists from beginning
      revQty[0] = item.active_qty;
    }

    await updateItem(item.id, {
      revision_quantities: JSON.stringify(revQty),
      deleted_in_revision: item.removed_in_revision
      // spare_qty already exists, no migration needed
    });
  }
};
```

### Rollback Safety

**Keep old columns for 2 releases:**
- Don't drop `active_qty`, `added_in_revision`, `modified_in_revision`, `removed_in_revision`
- Dual-write to both old and new columns during transition
- Feature flag allows instant rollback

**Feature Flag:**
```typescript
const useTableBasedEditor = localStorage.getItem('prep.useTableEditor') === 'true';

{useTableBasedEditor ? (
  <ShopOrderTable projectId={projectId} />
) : (
  <SectionList sections={sections} />
)}
```

---

## Implementation Phases

### Phase 1: Database & Core Logic (1 week)
**Files:**
- `/src/main/database/schema.ts` - Add columns
- `/src/renderer/src/types/prep.ts` - Update interfaces
- `/src/store/prepStore.ts` - Update store methods
- `/src/main/database/queries/prep.ts` - Update queries

**Tasks:**
1. Add `revision_quantities` and `deleted_in_revision` columns
2. Update TypeScript interfaces
3. Create utilities for JSON parsing/updating
4. Write migration script
5. Update IPC handlers
6. Update prepStore methods

### Phase 2: ShopOrderTable Component (1.5 weeks)
**Files:**
- `/src/renderer/src/components/prep/ShopOrderTable.tsx` (NEW)
- `/src/renderer/src/components/prep/RevisionColumnHeader.tsx` (NEW)
- `/src/renderer/src/components/prep/SectionDropdownCell.tsx` (NEW)

**Tasks:**
1. Build main table component
2. Implement inline cell editing
3. Section dropdown with carry-down behavior
4. Add/delete revision columns
5. Deleted item visual treatment
6. Row reordering (drag-and-drop)
7. Notes modal

### Phase 3: Print View with DELTA Column (1 week)
**Files:**
- `/src/renderer/src/components/prep/ItemNotesModal.tsx` (NEW)
- `/src/renderer/src/components/prep/VenueInventoryPage.tsx` (NEW)
- `/src/renderer/src/components/prep/RevisionChangeLogPage.tsx` (NEW)
- `/src/renderer/src/pages/modules/Prep.tsx`

**Tasks:**
1. DELTA column showing +/-/~ for changes
2. RENTAL & TOTAL columns with prominent styling
3. Venue Qty right-aligned
4. Section headers with section notes
5. Line notes below items
6. Venue-Owned Equipment Inventory page
7. Revision Change Log page

### Phase 4: Import/Export (0.5 weeks)
**Files:**
- `/src/renderer/src/components/prep/ShopOrderTable.tsx`
- `/src/main/ipc/prep.ts`

**Tasks:**
1. Paste from clipboard (TSV/CSV)
2. Vectorworks import mapping
3. Export to spreadsheet
4. Copy/paste individual cells

### Phase 5: Performance & Polish (0.5 weeks)
**Tasks:**
1. Virtual scrolling for 100+ items
2. Debounced saves
3. Keyboard shortcuts
4. Optimistic UI updates
5. Accessibility improvements

**Total Estimated Time:** 4.5 weeks

---

## Import/Export Support

### Paste from Spreadsheet

**Input format:**
```
Description    Section         Rev 0 Active  Rev 0 Spare  Venue
LED Par        Moving Lights   10            2            0
MAC Aura       Moving Lights   8             1            2
```

### Vectorworks Import

**LightWright export format:**
```csv
Position,Type,Unit #,Wattage,Purpose
1st Electric,Source Four 750W 26°,1,750,Front Light
```

**Mapping:**
- Group by Type → Description
- Map Position → Section
- Count units → Rev 0 Active quantity

---

## Revision Change Detection

### New Approach

Calculate on-demand by comparing column values horizontally:

```typescript
const detectChanges = (items, fromRev, toRev, previousSpareSnapshot) => {
  items.forEach(item => {
    const revQty = JSON.parse(item.revision_quantities);
    const prevActive = revQty[fromRev] || 0;
    const currActive = revQty[toRev] || 0;

    const prevSpare = previousSpareSnapshot.get(item.id) || item.spare_qty;
    const currSpare = item.spare_qty;

    if (prevActive === 0 && currActive > 0) {
      // Addition: +
    } else if (prevActive > 0 && currActive === 0) {
      // Deletion: -
    } else if (prevActive !== currActive || prevSpare !== currSpare) {
      // Modification: ~
    }
  });
};
```

**Spare Tracking:** Since spare is not per-revision, snapshot spare values in `prep_revisions.spare_snapshot` JSON field when creating revisions.

---

## Print Output Pages

### 1. Main Shop Order
- DELTA column with change indicators
- RENTAL & TOTAL columns prominent
- Section headers with notes
- Line notes below items

### 2. Venue-Owned Equipment Inventory (Optional)
- Lists all items with venue_qty > 0
- Shows allocation breakdown
- Optional printable page

### 3. Revision Change Log (Optional)
- Full change log for revision
- Additions, deletions, modifications
- Old → new quantities

---

## Success Metrics

1. **Import workflow**: Paste 100+ items from spreadsheet in under 10 seconds
2. **Revision workflow**: Add revision column instantly (no "generate" button)
3. **Performance**: Render 1000 items in under 500ms
4. **Familiarity**: Users report table feels like Excel/Google Sheets
5. **Vectorworks**: Import LightWright CSV with single click

---

## Breaking Changes

### For Users
- New UI requires retraining
- Different revision workflow (columns vs. snapshots)
- Notes accessed via modal instead of inline

### For Data
- Existing projects need migration
- Old revision tracking replaced by column-based approach

### Mitigation
- Feature flag for gradual rollout
- Migration script for existing data
- Keep old columns for rollback safety
- User documentation and video tutorials

---

## Related Documents

- Implementation Plan: `/Users/joshkarp/.claude/plans/indexed-twirling-bentley.md`
- GitHub Issue: `/docs/github-issues/shop-order-table-redesign.md`
- Current Architecture: `/src/renderer/src/pages/modules/Prep.tsx`

---

## Notes

**User Feedback:**
> "Most designers/associates are used to using Google Sheets, Excel, Numbers, or even a table inside a Pages document to generate their shop order. I think a more table format would work better here instead of this insert item methodology we have going now."

**Section Notes Problem Solution:**
> "I had built out a similar system within google sheets but had issues with finding an elegant way to handle section notes and line notes."

**Solution:** Section notes and line notes stored separately, rendered in print view only (not in table). Keeps data entry table clean and focused.
