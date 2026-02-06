# Phase 3: Paperwork Template System - Testing Guide

**Branch:** `feature/unified-visual-editor`
**Status:** Days 1-7 Complete, Day 8 Ready for Manual Testing
**Last Updated:** January 2, 2026

## ✅ Day 8 Setup Complete

- [x] Template seeding verified (13 system templates)
- [x] Test data created (84 fixtures + 13 infrastructure items)
- [x] Preload API fixed and operational
- [x] All components rendering without errors
- [x] App loading successfully at http://localhost:5173/
- [x] All IPC handlers registered
- [ ] **READY FOR MANUAL UI TESTING**

---

## ✅ Completed (Days 1-7)

### Database Infrastructure

- [x] `paperwork_templates` table created in app database
- [x] Full CRUD query operations implemented
- [x] IPC handlers registered for template management
- [x] System template seeding (12 templates) working on first launch

### Renderer Components

- [x] Type definitions (`paperworkTemplate.ts`)
- [x] Column configuration panel with drag-and-drop
- [x] Grouping & sorting controls
- [x] Report table renderer with formatting
- [x] Data connector (bridge to Zustand stores)
- [x] Report organizer (grouping/sorting logic)
- [x] Template library UI
- [x] PaperworkEditor (integrated split-view editor)
- [x] Refactored Paperwork.tsx (2353 → 409 lines, 82% reduction)

### Default Configurations

- [x] Column defaults for all 12 report types
- [x] System templates with descriptions

---

## 🧪 Day 8: Testing & Polish Checklist

### Test Data Available

**Fixtures:** 84 items (sufficient for all fixture reports)

**Infrastructure:** 13 items across 5 categories:

- Network: 4 switches (Cisco, Netgear, Ubiquiti)
- DMX: 3 nodes (ETC Response Gateway, Pathway Pathport)
- Control: 2 lighting consoles (ETC Eos Ti, Eos RPU)
- Media: 2 servers (disguise vx 4)
- Power: 2 PDUs (Leviton, APC)

### Testing Procedure

#### 1. Template System Verification

**Navigate to Paperwork Module:**

1. [x] Launch app (already running at `http://localhost:5173/`)
2. [x] Open default project
3. [x] Navigate to Paperwork module

**Verify System Templates:**

1. [x] Check template library sidebar shows 13 system templates
2. [x] Verify each template has:
   - Correct name
   - Description
   - "System" badge/indicator
   - Lock icon (cannot delete system templates)

**Expected System Templates:**

- Channel Hookup
- Dimmer Schedule
- Circuit List
- DMX Addresses
- Power Summary
- Color Schedule
- Gobo Schedule
- Color Cut Report
- Infrastructure List
- Network Summary
- Port Assignments
- Infrastructure Power
- Infrastructure Location

#### 2. Fixture Reports Testing (8 reports)

For each fixture report type, verify:

**Channel Hookup:**

- [x] Template loads correctly
- [x] All 84 fixtures display
- [x] Columns: channel, dimmer, position, unit, type, wattage, purpose, color, notes
- [x] Default sort by channel (ascending)
- [x] Data displays correctly (no "undefined" or null values)

**Dimmer Schedule:**

- [x] Template loads
- [x] Sort by dimmer works
- [x] Columns show: dimmer, channel, position, unit, type, wattage, color

**Circuit List:**

- [x] Template loads
- [x] Sort by circuit works
- [x] Circuit numbers display correctly

**DMX Addresses:**

- [x] Template loads
- [x] Universe and DMX address columns populated
- [x] Sort by universe/address works

**Power Summary:**

- [x] Aggregates by fixture type
- [x] Shows quantity counts
- [x] Calculates total wattage and amperage
- [x] Formatting: "1,234W" and "10.5A"

**Color Schedule:**

- [x] Groups by color
- [x] Shows quantity per color
- [x] Lists fixtures using each color

**Gobo Schedule:**

- [x] Groups by gobo pattern
- [x] Shows quantity per gobo
- [x] Lists fixtures using each gobo

**Color Cut Report:**

- [x] Template loads correctly
- [x] Shows gel codes with color swatches
- [x] Columns: gel_code, manufacturer, frame_size, cuts_needed, cuts_per_sheet, sheets_needed
- [x] Color swatches display with correct hex colors
- [x] Dual colors split into separate rows (e.g., "L202+R119" becomes two items)
- [x] Frame sizes parsed correctly (square, rectangular, round)
- [x] Calculations accurate (cuts per 20"x24" sheet)
- [x] Manufacturer detected from gel code prefix (G=GAM, L=LEE, R=Roscolux)
- [x] Sort by gel_code works (alphabetical)
- [x] PDF export includes color swatches

#### 3. Infrastructure Reports Testing (5 reports)

**Infrastructure List:**

- [x] Shows all 13 infrastructure items
- [x] Columns: name, type, manufacturer, model, location, status, notes
- [x] All categories visible (network, dmx, control, media, power)

**Network Summary:**

- [x] Shows 4 network switches
- [x] IP addresses display correctly (192.168.1.x)
- [x] MAC addresses formatted properly
- [x] Hostnames visible

**Port Assignments:**

- [x] Port counts display for switches (28, 24, 24 ports)
- [x] Port information shows correctly

**Infrastructure Power:**

- [x] Voltage displays (120V, 208V)
- [x] Wattage and amperage calculations correct
- [x] Circuit assignments visible

**Infrastructure Location:**

- [x] Groups by location
- [x] All locations visible (FOH Rack, Stage Right, etc.)
- [x] Equipment listed under correct locations

#### 4. Column Configuration Testing

For any report:

- [x] Open column configuration panel
- [x] Drag columns to reorder - verify order changes
- [x] Adjust column width slider - verify width changes in preview
- [x] Toggle column visibility - verify column hides/shows
- [x] Changes reflect in live preview immediately

#### 5. Grouping & Sorting Testing

**Grouping:**

- [x] Select "Group By" dropdown
- [x] Choose a groupable field (e.g., "Position" for Channel Hookup)
- [x] Verify data groups correctly
- [x] Group headers display with item counts
- [x] Toggle "Show Group Headers" - verify headers hide/show
- [x] Toggle "Page Break Between Groups" - verify visual separation

**Sorting:**

- [x] Select "Sort By" dropdown
- [x] Choose different fields
- [x] Toggle Ascending/Descending
- [x] Verify natural sort (e.g., "Channel 1" < "Channel 10" not "Channel 2")
- [x] Verify numeric sorting for number fields
- [x] Verify alphabetical sorting for text fields

#### 6. Template Operations Testing

**Save Template:**

- [x] Make changes to columns/organization
- [x] Click "Save" button
- [x] Verify "Unsaved changes" indicator disappears
- [x] Reload template - changes persist

**Save As New Template:**

- [x] Load system template
- [x] Make customizations
- [x] Click "Save As..."
- [x] Enter new name
- [x] Verify new template appears in library
- [x] Verify it's marked as custom (not system)

**Duplicate Template:**

- [x] Right-click/select any template
- [x] Choose "Duplicate"
- [x] Verify copy created with "(Copy)" suffix
- [x] Verify duplicate is editable

**Delete Custom Template:**

- [x] Select a custom template
- [x] Click delete
- [x] Verify confirmation dialog
- [x] Confirm deletion
- [x] Verify template removed from library
- [x] Try to delete system template - verify error/prevention

**Load Template:**

- [x] Click different templates in library
- [x] Verify editor updates immediately
- [x] Verify preview updates with template data
- [x] Verify unsaved changes warning if switching with edits

#### 7. Live Preview Testing

- [x] Changes to columns update preview instantly
- [x] Changes to grouping update preview instantly
- [x] Changes to sorting update preview instantly
- [x] Zoom slider works (50%-150%)
- [x] Preview shows accurate page layout
- [x] Data formatting correct (numbers, dates, power units)

#### 8. Header/Footer Designer Integration

- [x] Click "Design Header" button
- [x] Header designer modal opens
- [x] Grid-based layout designer loads
- [x] Can place data fields
- [x] Can add text elements
- [x] Can add images
- [x] Changes save to template
- [x] Header appears in report preview

#### 8.5. Header/Footer System (Completed)

**Header Rendering:**

- [x] Compact 3-row grid layout displays correctly
- [x] Row 0: Show Name (left), Report Title (center), Date (right)
- [x] Row 1: Empty spacing row
- [x] Row 2: LD Name (left), Venue (right)
- [x] Dynamic data from project displays correctly
- [x] Empty fields show blank (not "undefined" or placeholder text)
- [x] Font matching with report content
- [x] Proper spacing between header rows

**Footer Rendering:**

- [x] Footer appears at bottom of each page
- [x] Page numbers display correctly (Puppeteer displayHeaderFooter)
- [x] Footer shows: Username • ShowStack on left
- [x] Footer shows: Data range on right (e.g., "Channels 1-48")
- [x] Footer font matches header style

**Template Migration:**

- [x] Automatic detection of old header layouts
- [x] Re-seeding on app startup when old layout detected
- [x] No duplicate elements after migration
- [x] Foreign key constraints handled properly

#### 9. PDF Export Testing

- [x] Click "Export PDF" button
- [x] Save dialog appears
- [x] PDF generates successfully
- [x] Open PDF - verify:
  - [x] Header renders correctly
  - [x] Table data present and formatted
  - [x] Page breaks work
  - [x] Footer renders (if configured)
  - [x] Multi-page reports paginate correctly

#### 10. Batch Export Testing

- [x] Open batch export dialog
- [x] Select multiple report types
- [x] Click "Export All"
- [x] Verify all reports generate
- [x] Verify each uses correct template
- [x] Verify PDFs created for each

#### 11. Performance Testing

**With 84 Fixtures:**

- [x] Template loads in < 500ms
- [x] Preview updates in < 300ms
- [x] Column reorder feels instant
- [x] Grouping/sorting applies quickly
- [x] No UI lag or freezing

**Stress Test (if time permits):**

- N/A - Performance acceptable with current test data

#### 12. Edge Cases & Error Handling

- [x] Empty report (no data) - shows "No data" message
- [x] Invalid column field - graceful fallback
- [x] Malformed template data - error message
- [x] Network error during template save - retry/error
- [x] Attempt to modify system template - prevented
- [x] Attempt to delete system template - prevented

#### 13. UI/UX Polish

- [x] All text legible (contrast, size)
- [x] Icons clear and meaningful
- [x] Hover states work
- [x] Active states clear
- [x] Loading states where appropriate
- [x] Error messages helpful
- [x] Success feedback clear
- [x] Responsive to window resize
- [x] Keyboard navigation works
- [x] Tab order logical

---

## 🐛 Known Issues / To Fix

_Document any issues found during testing here_

### Critical

- [ ] None yet

### Major

- [ ] None yet

### Minor

- [ ] None yet

### Nice to Have

- [ ] None yet

---

## 📊 Test Results Summary

**Fixture Reports (8):**

- [x] Channel Hookup
- [x] Dimmer Schedule
- [x] Circuit List
- [x] DMX Addresses
- [x] Power Summary
- [x] Color Schedule
- [x] Gobo Schedule
- [x] Color Cut Report

**Infrastructure Reports (5):**

- [x] Infrastructure List
- [x] Network Summary
- [x] Port Assignments
- [x] Infrastructure Power
- [x] Infrastructure Location

**Template Operations:**

- [x] Load
- [x] Save
- [x] Save As
- [x] Duplicate
- [x] Delete

**UI Features:**

- [x] Column Configuration
- [x] Grouping
- [x] Sorting
- [x] Live Preview
- [x] Header Designer
- [x] PDF Export
- [x] Batch Export

**Phase 3 Status:** ✅ COMPLETE

---

## 🚀 Next Steps After Testing

1. Fix any critical/major issues found
2. Polish UI based on feedback
3. Update documentation
4. Create PR for merge to `develop`
5. Plan Phase 4 (Label Integration)

---

## 📝 Notes

_Add testing observations here_
