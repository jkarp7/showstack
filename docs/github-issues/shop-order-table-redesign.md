# GitHub Issue: Shop Order Table-Based Redesign

## Main Issue

**Title**: 📊 Shop Order Builder: Table-Based Redesign for Spreadsheet Workflow

**Labels**: `enhancement`, `feature`, `UX`, `prep-module`, `major-feature`

**Milestone**: TBD

**Body**:
```markdown
## Overview

Redesign the Shop Order builder from the current dialog-based "insert item" methodology to a spreadsheet-like table format where revisions are columns rather than snapshots.

**See**: `docs/features/migration-shop-order-table.md` for detailed migration plan

## Problem Statement

Current shop order workflow doesn't match how designers actually work:

- ❌ Dialog-based item insertion is slow for bulk data entry
- ❌ "Generate Revision" button workflow is cumbersome
- ❌ Doesn't match familiar spreadsheet workflows (Excel/Google Sheets/Numbers)
- ❌ Difficult to import from Vectorworks or paste from external tools
- ❌ Section notes and line notes handling is unclear

## Proposed Solution

### Data Entry Table (Spreadsheet-like)

```
Section (dropdown) | Description | Rev 0 | Rev 1 | Rev N | Spare | Venue
───────────────────┼─────────────┼───────┼───────┼───────┼───────┼───────
Moving Lights      | LED Par 64  |  10   |  12   |  12   |   2   |   0
Moving Lights      | MAC Aura XB |   8   |   8   |  10   |   2   |   3
```

**Features:**
- Inline cell editing (like Excel)
- Section dropdown with carry-down behavior
- Revision columns show active quantities
- Spare is single shared column (not per-revision)
- Notes accessed via modal (clean table layout)

### Print Output (Professional)

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

**Features:**
- **DELTA column**: Shows +/-/~ for revision changes (FIRST column)
- **RENTAL & TOTAL**: Prominently styled (bold, highlighted)
- **Venue Qty**: Right-aligned
- Section notes below section header
- Line notes below item rows (indented)

## Implementation Phases

### Phase 1: Database & Core Logic ⏱️ 1 week
- [ ] Add `revision_quantities` JSON column to `prep_equipment_items`
- [ ] Add `deleted_in_revision` column
- [ ] Update TypeScript interfaces
- [ ] Create JSON utilities for revision quantities
- [ ] Write migration script for existing data
- [ ] Update IPC handlers and store methods

**Files:**
- `/src/main/database/schema.ts`
- `/src/renderer/src/types/prep.ts`
- `/src/store/prepStore.ts`
- `/src/main/database/queries/prep.ts`

### Phase 2: ShopOrderTable Component ⏱️ 1.5 weeks
- [ ] Build main table component with spreadsheet layout
- [ ] Implement inline cell editing (click to edit)
- [ ] Section dropdown with carry-down behavior
- [ ] Add/delete revision columns dynamically
- [ ] Deleted item visual treatment (strikethrough)
- [ ] Row reordering (drag-and-drop)
- [ ] Notes modal for section and line notes

**Files:**
- `/src/renderer/src/components/prep/ShopOrderTable.tsx` (NEW)
- `/src/renderer/src/components/prep/RevisionColumnHeader.tsx` (NEW)
- `/src/renderer/src/components/prep/SectionDropdownCell.tsx` (NEW)

### Phase 3: Print View with DELTA Column ⏱️ 1 week
- [ ] DELTA column showing +/-/~ for changes
- [ ] RENTAL & TOTAL columns with prominent styling
- [ ] Venue Qty right-aligned
- [ ] Section headers with section notes
- [ ] Line notes below items (indented)
- [ ] Venue-Owned Equipment Inventory page
- [ ] Revision Change Log page

**Files:**
- `/src/renderer/src/components/prep/ItemNotesModal.tsx` (NEW)
- `/src/renderer/src/components/prep/VenueInventoryPage.tsx` (NEW)
- `/src/renderer/src/components/prep/RevisionChangeLogPage.tsx` (NEW)
- `/src/renderer/src/pages/modules/Prep.tsx`

### Phase 4: Import/Export ⏱️ 0.5 weeks
- [ ] Paste from clipboard (TSV/CSV)
- [ ] Vectorworks/LightWright import
- [ ] Export to spreadsheet format
- [ ] Copy/paste individual cells

### Phase 5: Performance & Polish ⏱️ 0.5 weeks
- [ ] Virtual scrolling for 100+ items
- [ ] Debounced saves for cell edits
- [ ] Keyboard shortcuts (Tab, Enter, Arrow navigation)
- [ ] Optimistic UI updates
- [ ] Accessibility improvements

**Total Estimated Time:** 4.5 weeks

## Technical Details

### Database Schema Changes

```sql
ALTER TABLE prep_equipment_items ADD COLUMN revision_quantities TEXT;
ALTER TABLE prep_equipment_items ADD COLUMN deleted_in_revision INTEGER;
```

### Data Structure

```typescript
interface PrepEquipmentItem {
  revision_quantities: string; // JSON: { "0": 10, "1": 12, "2": 8 }
  spare_qty: number;           // Single value (not per-revision)
  venue_qty: number;           // Constant across revisions
  deleted_in_revision?: number;
}
```

### Calculations

```typescript
// Total = max(all revision active quantities) + spare
const total = Math.max(...Object.values(revisionQty)) + spare_qty;

// Rental = Total - Venue (prominently displayed)
const rental = total - venue_qty;
```

## Import/Export Support

### Paste from Spreadsheet
```
Description    Section         Active  Spare  Venue
LED Par        Moving Lights   10      2      0
MAC Aura       Moving Lights   8       1      2
```

### Vectorworks Import
```csv
Position,Type,Unit #,Wattage,Purpose
1st Electric,Source Four 750W 26°,1,750,Front Light
```

## Migration Strategy

1. **Phase 1**: Add new columns, keep old ones
2. **Phase 2**: Dual-write to both formats
3. **Phase 3**: Feature flag for new UI
4. **Phase 4**: Migrate existing projects
5. **Phase 5**: Full rollout, deprecate old UI

**Feature Flag:**
```typescript
const useTableBasedEditor = localStorage.getItem('prep.useTableEditor') === 'true';
```

## Success Metrics

- ✅ Paste 100+ items from spreadsheet in <10 seconds
- ✅ Add revision column instantly (no "generate" button)
- ✅ Render 1000 items in <500ms
- ✅ Users report table feels like Excel/Google Sheets
- ✅ Import LightWright CSV with single click

## Benefits

### For Users
- **Familiar workflow**: Matches Excel/Google Sheets UX
- **Faster data entry**: Inline editing, paste from clipboard
- **Better vectorworks support**: Direct import from LightWright
- **Clearer revisions**: Column-based instead of snapshot-based
- **Prominent rental info**: RENTAL column hard to miss

### For Development
- **Simpler revision model**: Compare columns instead of snapshots
- **Better import/export**: Standard TSV/CSV format
- **Performance**: Fewer database queries, virtual scrolling
- **Flexibility**: Easy to add new revision columns

## User Feedback

> "Most designers/associates are used to using Google Sheets, Excel, Numbers, or even a table inside a Pages document to generate their shop order. I think a more table format would work better here."

> "I had built out a similar system within google sheets but had issues with finding an elegant way to handle section notes and line notes."

**Solution:** Section and line notes stored separately, rendered in print view only. Keeps data entry table clean.

## Related Documents

- Migration Plan: `/docs/features/migration-shop-order-table.md`
- Implementation Plan: `/Users/joshkarp/.claude/plans/indexed-twirling-bentley.md`
- Current Implementation: `/src/renderer/src/pages/modules/Prep.tsx`

## Breaking Changes

⚠️ **User Impact:**
- New UI requires retraining
- Different revision workflow (columns vs. snapshots)
- Notes accessed via modal instead of inline

**Mitigation:**
- Feature flag for gradual rollout
- User documentation and video tutorials
- Migration script handles data conversion
- Keep old columns for rollback safety (2 releases)

## Acceptance Criteria

- [ ] Data entry table matches spreadsheet UX (Section, Description, Rev columns, Spare, Venue)
- [ ] Print output has DELTA column first, RENTAL & TOTAL prominent
- [ ] Section notes appear below section header in print
- [ ] Line notes appear below items in print (indented)
- [ ] Venue Qty right-aligned in print
- [ ] Paste from Excel/Sheets works (TSV format)
- [ ] Vectorworks import works (LightWright CSV)
- [ ] Revision changes calculated by comparing columns
- [ ] Virtual scrolling for 100+ items
- [ ] Feature flag allows rollback to old UI
- [ ] Migration script converts existing projects
- [ ] All tests pass
```

---

## Related Issues

*To be created as subtasks:*

### Phase 1 Subtasks
- [ ] #TBD - Database schema changes and migration script
- [ ] #TBD - TypeScript interface updates
- [ ] #TBD - IPC handlers and store methods

### Phase 2 Subtasks
- [ ] #TBD - ShopOrderTable component with spreadsheet layout
- [ ] #TBD - Inline cell editing implementation
- [ ] #TBD - Section dropdown with carry-down
- [ ] #TBD - Revision column management

### Phase 3 Subtasks
- [ ] #TBD - DELTA column implementation
- [ ] #TBD - Print view styling (RENTAL & TOTAL prominent)
- [ ] #TBD - Section and line notes rendering
- [ ] #TBD - Venue inventory page

### Phase 4 Subtasks
- [ ] #TBD - Clipboard paste (TSV/CSV)
- [ ] #TBD - Vectorworks import

### Phase 5 Subtasks
- [ ] #TBD - Virtual scrolling optimization
- [ ] #TBD - Keyboard shortcuts and accessibility

---

## Dependencies

- None (self-contained feature within Prep module)

---

## Priority

**Medium-High** - Addresses significant UX pain point for shop order users, but not blocking for other features.

---

## Estimated Effort

**4.5 weeks** (see phase breakdown above)
