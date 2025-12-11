# Admin Panel Feature - Migration Summary

**Session Date**: 2025-11-24
**Branch**: `claude/prep-module-implementation-01XCiV5mFscuSkzzmo1GmGfe`
**Status**: Ready for new session

---

## Session Summary

This session completed the ShowStack:Prep module's print preview functionality with live page rendering, PDF export, and direct printing. We've identified the need for an admin panel to manage default templates and other system-wide configurations.

---

## Completed Work

### 1. Print Preview Component
**File**: `src/renderer/src/components/prep/PrintPreview.tsx`

**Features**:
- Side-by-side layout: preview on left, settings panel on right
- Page navigation controls (Previous/Next)
- Real-time page rendering with actual project data
- Page settings (size, orientation, page numbers)
- "Arrange Sections" button opens PrintBuilder as modal
- Export PDF and Print buttons (fully functional)

### 2. Page Renderer Component
**File**: `src/renderer/src/components/prep/PageRenderer.tsx`

**Features**:
- Loads page layout templates for each section type
- Renders layout elements (dataField, text, shape)
- Automatic scaling to fit viewport (90% of available space)
- Optimized for small screens (13" MacBook Air tested)
- Grid-based positioning with pixel calculations
- Text alignment support (left, center, right via flexbox)
- Empty value handling (em dash placeholders, skip empty text elements)
- Margin guides for visual reference
- Page number display

### 3. PDF Export & Print
**File**: `src/main/ipc/prep.ts`

**PDF Export**:
- IPC handler: `prep:exportPDF`
- Creates hidden BrowserWindow for PDF generation
- Uses Electron's `printToPDF` API
- Save dialog with default filename: `{ProductionName}_ShopOrder.pdf`
- Respects template page settings (size, orientation, margins via CSS)
- Currently generates placeholder content (Phase 2 will render actual layouts)

**Direct Print**:
- IPC handler: `prep:print`
- Opens native OS print dialog
- Same HTML generation as PDF export
- Configurable page settings

**Margin Handling**:
- Uses `marginsType: 1` (none) in Electron API
- Applies custom margins via CSS padding in HTML
- Avoids "margins must be less than or equal to pageSize" error

### 4. Preload API
**File**: `src/preload/index.ts`

**Added Methods**:
```typescript
prep: {
  exportPDF: (projectId: string, templateData: any) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
  print: (projectId: string, templateData: any) => Promise<{ success: boolean }>;
}
```

---

## Key Improvements Made

### Scaling Improvements
- **Initial**: Pages rendered at full size (816x1056px), causing overflow
- **Fixed**: Dynamic scaling to 90% of available viewport space
- **Result**: Pages fit completely on 13" MacBook Air with minimal scrolling

### Text Rendering Improvements
- **Initial**: "[No Text]" placeholders cluttering layout
- **Fixed**: Skip empty text elements, show em dash (—) for empty data fields
- **Result**: Clean display showing only actual content

### Text Alignment Fixes
- **Initial**: Flexbox overriding textAlign, all text appearing left-aligned
- **Fixed**: Map textAlign to flexbox justify-content (center → center, right → flex-end)
- **Result**: Centered and right-aligned text displaying correctly

---

## Current Database Schema

### Page Layout Templates (App-level)
**Table**: `page_layout_templates` in app database

```sql
CREATE TABLE page_layout_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  page_type TEXT NOT NULL,
  grid_columns INTEGER NOT NULL DEFAULT 12,
  grid_rows INTEGER NOT NULL DEFAULT 20,
  grid_gap INTEGER NOT NULL DEFAULT 8,
  page_width INTEGER NOT NULL,
  page_height INTEGER NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**Table**: `page_layout_elements`

```sql
CREATE TABLE page_layout_elements (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  element_type TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON
  grid_column INTEGER NOT NULL,
  grid_row INTEGER NOT NULL,
  column_span INTEGER NOT NULL,
  row_span INTEGER NOT NULL,
  layer INTEGER DEFAULT 0,
  style TEXT NOT NULL, -- JSON
  FOREIGN KEY (template_id) REFERENCES page_layout_templates(id) ON DELETE CASCADE
);
```

### Default Layouts Seeding
**File**: `src/main/database/seedDefaultLayouts.ts`

**Current Implementation**:
- Hardcoded TypeScript arrays defining layout elements
- Creates default layouts for: cover, contacts, notes
- Called via IPC: `prep:layoutTemplates:seedDefaults`
- Invoked by purple "Create Default Page Layouts" button in PrintBuilder

**Problem**: Difficult to maintain, requires code changes to update layouts

---

## Admin Panel Requirements

### Purpose
Create a centralized admin panel for managing system-wide configurations that should not be accessible to regular users.

### Access Control
**Dual Protection**:
1. **Password Protection**: Set in application settings
2. **Keyboard Shortcut**: Hidden access (e.g., Cmd/Ctrl+Shift+A)

### Proposed Features

#### 1. Layout Template Management (Priority 1)
**Problem**: Currently default layouts are hardcoded in TypeScript
**Solution**:
- Export all page layouts to JSON files
- Import JSON files to replace default layouts
- Store JSON files in `/src/main/database/defaultLayouts/` directory
- Version control friendly
- Easy to update without code changes

**Workflow**:
1. Designer opens admin panel
2. Designs layouts using Layout Designer UI
3. Exports each page type: `cover_default_layout.json`, `contacts_default_layout.json`, etc.
4. Files are saved to `defaultLayouts/` folder
5. Update `seedDefaultLayouts.ts` to read from JSON files instead of hardcoded arrays
6. Commit JSON files to repository
7. Next build includes updated default layouts

**JSON Structure** (proposed):
```json
{
  "template": {
    "name": "Cover Page - Default",
    "description": "Professional cover page layout",
    "page_type": "cover",
    "grid_columns": 12,
    "grid_rows": 20,
    "grid_gap": 8,
    "page_width": 816,
    "page_height": 1056,
    "is_default": true
  },
  "elements": [
    {
      "element_type": "dataField",
      "config": {
        "fieldType": "production_name",
        "showLabel": false
      },
      "grid_column": 0,
      "grid_row": 1,
      "column_span": 12,
      "row_span": 1,
      "layer": 0,
      "style": {
        "fontFamily": "Arial",
        "fontSize": 18,
        "fontWeight": "normal",
        "textAlign": "center",
        "color": "#000000",
        "backgroundColor": "transparent",
        "padding": 8
      }
    }
    // ... more elements
  ]
}
```

#### 2. Future Admin Tools (Lower Priority)
- **Fixture Library Management**: Export/import default fixture libraries
- **Note Template Management**: System-wide note templates
- **Database Tools**: Backup, restore, migrations
- **License Management**: Move existing license UI to admin panel
- **Application Settings**: Advanced settings (API keys, sync settings, etc.)

### UI Design

**Settings Menu Integration**:
```
Settings → (hidden) Admin Panel
  ├── Password prompt (if not in dev mode)
  ├── Layout Templates
  │   ├── Export All Layouts
  │   ├── Import Layouts
  │   └── Reset to Factory Defaults
  ├── (Future) Fixture Library
  ├── (Future) Note Templates
  ├── (Future) Database Tools
  └── (Future) License Management
```

**Access Methods**:
1. Settings menu → "Admin Panel" (hidden unless Cmd+Shift+A pressed recently?)
2. Keyboard shortcut: Cmd+Shift+A (Ctrl+Shift+A on Windows/Linux)
3. Development mode: Always visible in settings

---

## Implementation Plan

### Phase 1: Admin Panel Framework
**Goal**: Create basic admin panel infrastructure with access control

**Tasks**:
1. Create admin panel route/page
2. Implement password protection dialog
3. Add keyboard shortcut listener (Cmd/Ctrl+Shift+A)
4. Store admin password in settings (hashed)
5. Create admin panel layout with navigation
6. Add "Layout Templates" section UI

### Phase 2: Layout Export/Import
**Goal**: Enable exporting layouts to JSON and importing them

**Tasks**:
1. Add "Export Layout to JSON" button in Layout Designer
2. Implement JSON generation from layout template + elements
3. Add file save dialog for JSON export
4. Create admin panel UI for importing JSON files
5. Implement JSON validation and import
6. Add "Export All Defaults" feature in admin panel
7. Add "Import & Replace Defaults" feature

### Phase 3: Seed from JSON Files
**Goal**: Update seeding to read from JSON files instead of hardcoded data

**Tasks**:
1. Create `/src/main/database/defaultLayouts/` directory
2. Export current default layouts to JSON files
3. Update `seedDefaultLayouts.ts` to read JSON files
4. Add file system error handling
5. Test seeding from JSON files
6. Remove hardcoded layout arrays

### Phase 4: Testing & Documentation
**Goal**: Ensure system works end-to-end

**Tasks**:
1. Test export workflow: Design → Export → JSON file
2. Test import workflow: JSON file → Import → Database
3. Test seed workflow: JSON files → Seed → Database
4. Document admin panel usage
5. Document layout design workflow
6. Create video tutorial (optional)

---

## File Structure

### New Files to Create
```
src/renderer/src/pages/AdminPanel.tsx           # Main admin panel page
src/renderer/src/components/admin/              # Admin components folder
  ├── AdminNav.tsx                               # Navigation sidebar
  ├── LayoutTemplateManager.tsx                  # Layout export/import UI
  └── PasswordPrompt.tsx                         # Password entry dialog
src/main/database/defaultLayouts/                # JSON files directory
  ├── cover_default_layout.json
  ├── contacts_default_layout.json
  └── notes_default_layout.json
src/main/database/layoutIO.ts                    # Export/import logic
```

### Files to Modify
```
src/main/database/seedDefaultLayouts.ts          # Read from JSON files
src/renderer/src/components/prep/layout/LayoutDesigner.tsx  # Add export button
src/main/ipc/admin.ts                            # New IPC handlers for admin functions
src/preload/index.ts                             # Expose admin API
src/renderer/src/App.tsx                         # Add admin panel route
```

---

## IPC Handlers Needed

### Admin Panel Access
```typescript
'admin:verifyPassword': (password: string) => Promise<boolean>
'admin:setPassword': (password: string) => Promise<void>
```

### Layout Export/Import
```typescript
'admin:exportLayout': (templateId: string) => Promise<{ success: boolean; filePath?: string }>
'admin:exportAllDefaultLayouts': () => Promise<{ success: boolean; filePath?: string }>
'admin:importLayouts': (filePath: string) => Promise<{ success: boolean; count: number }>
'admin:resetLayoutsToFactory': () => Promise<{ success: boolean }>
```

---

## Security Considerations

### Password Storage
- **Don't**: Store plain text password
- **Do**: Use bcrypt or similar hashing (e.g., `crypto.pbkdf2`)
- Store hash in app settings database
- Default: No password (admin panel accessible to all)
- User sets password on first admin panel access

### JSON File Validation
- Validate JSON structure before import
- Check required fields exist
- Verify data types (numbers, strings, booleans)
- Sanitize strings to prevent injection
- Add schema validation (e.g., using Zod)

### Access Logging (Optional)
- Log admin panel access attempts
- Log layout import/export operations
- Store in separate audit log file

---

## Dependencies Needed

### For Password Hashing
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### For JSON Schema Validation (Optional)
```bash
npm install zod
```

---

## Current State Summary

### What Works
✅ Print preview with live page rendering
✅ Page navigation (Previous/Next)
✅ PDF export with save dialog
✅ Direct print with native dialog
✅ Automatic scaling for small screens
✅ Text alignment (left, center, right)
✅ Empty value handling
✅ Page layout loading from database
✅ Default layout seeding (hardcoded)

### What's Missing (Admin Panel)
❌ Admin panel UI
❌ Password protection
❌ Keyboard shortcut access
❌ Layout export to JSON
❌ Layout import from JSON
❌ JSON-based seeding
❌ Default layouts directory

---

## Testing Checklist for Admin Panel

### Access Control
- [ ] Password prompt appears on first admin panel access
- [ ] Password is hashed before storage
- [ ] Correct password grants access
- [ ] Incorrect password shows error
- [ ] Keyboard shortcut (Cmd+Shift+A) opens admin panel
- [ ] Admin panel hidden from regular users
- [ ] Development mode shows admin panel in settings

### Layout Export
- [ ] "Export Layout" button appears in Layout Designer
- [ ] Export generates valid JSON file
- [ ] JSON contains all template data
- [ ] JSON contains all element data
- [ ] File save dialog shows correct default name
- [ ] Exported file can be opened and read

### Layout Import
- [ ] "Import Layouts" button in admin panel
- [ ] File open dialog accepts .json files
- [ ] Valid JSON imports successfully
- [ ] Invalid JSON shows error message
- [ ] Imported layouts appear in database
- [ ] Imported layouts marked as default if specified

### Seed from JSON
- [ ] JSON files exist in defaultLayouts directory
- [ ] Seed function reads JSON files
- [ ] Seed function creates layouts in database
- [ ] Seeded layouts marked as default
- [ ] Missing JSON files handled gracefully
- [ ] Invalid JSON files show error

### End-to-End Workflow
- [ ] Design layout in UI
- [ ] Export to JSON
- [ ] JSON file in correct format
- [ ] Import JSON in admin panel
- [ ] Layout appears in database
- [ ] Layout loads in print preview
- [ ] Layout renders correctly

---

## Questions to Address in Next Session

1. **Password Implementation**: Use bcrypt or Electron's crypto module?
2. **Keyboard Shortcut**: Cmd+Shift+A or different combination?
3. **Admin Panel Route**: `/admin` or `/settings/admin`?
4. **Default Password**: Force set on first launch or optional?
5. **JSON File Location**: Include in build or external directory?
6. **Import Behavior**: Replace existing defaults or merge?
7. **Version Control**: Include default JSON files in git?

---

## Recommended Next Steps

1. Start new session focused on admin panel
2. Create basic admin panel framework first (access control + UI)
3. Add layout export feature to Layout Designer
4. Implement JSON import in admin panel
5. Update seeding to use JSON files
6. Test complete workflow
7. Document for other developers

---

## Commit History (This Session)

```
ea5ed3e fix: Improve scaling for smaller screens (13" MacBook Air)
691548d fix: Fix text alignment, scaling, and empty element rendering
c750019 fix: Improve page preview visibility and spacing
31415a3 fix: Add automatic scaling to fit pages in preview viewport
2ee5648 feat: Implement live page rendering and navigation in print preview
f54416d fix: Correct margin handling in PDF export and print
8b5c3d8 feat: Implement direct print functionality for shop orders
f05249f feat: Implement PDF export functionality for shop orders
e48d316 fix: Make Export PDF and Print buttons side-by-side and smaller
cd8e51e refactor: Change PrintPreview layout to side-by-side design
9cbde06 feat: Create PrintPreview component with section editor modal
```

---

## Branch Status

**Branch**: `claude/prep-module-implementation-01XCiV5mFscuSkzzmo1GmGfe`
**Status**: Clean (all changes committed and pushed)
**Ready for**: New admin panel feature branch or continuation on same branch

---

**End of Migration Summary**
