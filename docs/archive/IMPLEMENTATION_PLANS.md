# Implementation Plans - System Docs Core Features

**Last Updated:** December 24, 2024

This document outlines detailed implementation plans for the three core features needed to complete the System Docs tool:

1. Undo/Redo System
2. Paperwork Generator & Headers
3. Label Designer

---

## 1. UNDO/REDO SYSTEM

### Overview

Implement a Command pattern-based undo/redo system that works across all editing operations (fixtures, infrastructure, prep module, bulk edits).

### Current State

- **No existing undo/redo pattern** - needs to be built from scratch
- All stores (fixture, infrastructure, prep) use Zustand for state management
- Dirty state tracking exists via `fileStore.setDirty(true)`
- Operations are already well-defined in store actions

### Architecture: Command Pattern

#### Core Components

**1. Command Interface** (`src/renderer/src/types/commands.ts`)

```typescript
interface Command {
  id: string;
  timestamp: number;
  type: string; // 'fixture:add', 'fixture:update', 'bulk:edit', etc.
  execute(): Promise<void>;
  undo(): Promise<void>;
  description: string; // Human-readable description for UI
}
```

**2. Undo/Redo Store** (`src/renderer/src/store/undoRedoStore.ts`)

- **State:**
  - `undoStack: Command[]` - Stack of commands that can be undone
  - `redoStack: Command[]` - Stack of commands that can be redone
  - `maxHistorySize: number` - Default 100 to prevent memory issues

- **Actions:**
  - `executeCommand(command: Command)` - Execute and add to undo stack, clear redo stack
  - `undo()` - Pop from undo stack, execute undo(), push to redo stack
  - `redo()` - Pop from redo stack, execute(), push to undo stack
  - `clearHistory()` - Clear both stacks (on file close/project switch)
  - `canUndo(): boolean` - Check if undo stack has items
  - `canRedo(): boolean` - Check if redo stack has items
  - `getUndoDescription(): string | null` - Get description of next undo operation
  - `getRedoDescription(): string | null` - Get description of next redo operation

**3. Command Implementations** (`src/renderer/src/commands/`)

Create separate files for each domain:

- **`fixtureCommands.ts`:**
  - `AddFixtureCommand` - Stores fixture data, calls `addFixture()` on execute, `deleteFixture()` on undo
  - `UpdateFixtureCommand` - Stores before/after state, updates on execute, reverts on undo
  - `DeleteFixtureCommand` - Stores deleted fixture data, deletes on execute, re-adds on undo
  - `BulkUpdateCommand` - Stores array of before/after states for multiple fixtures
  - `BulkDeleteCommand` - Stores array of deleted fixtures

- **`infrastructureCommands.ts`:**
  - `AddEquipmentCommand`
  - `UpdateEquipmentCommand`
  - `DeleteEquipmentCommand`
  - `BulkDeleteEquipmentCommand`

- **`prepCommands.ts`:**
  - `CreateProjectCommand`
  - `UpdateProjectCommand`
  - `CreateSectionCommand`
  - `CreateItemCommand`
  - etc.

- **`compositeCommands.ts`:**
  - `CompositeCommand` - Executes multiple commands as a single operation (for complex bulk edits)

### Integration Points

**1. Update Store Actions**

Modify all store actions to use the command system:

Before (fixtureStore.ts:78-96):

```typescript
updateFixture: async (id: string, updates: Partial<Fixture>) => {
  const updated = await window.api.fixtures.update(id, updates);
  set((state) => ({
    fixtures: state.fixtures.map((f) => (f.id === id ? updated : f)),
  }));
  useFileStore.getState().setDirty(true);
};
```

After:

```typescript
updateFixture: async (id: string, updates: Partial<Fixture>) => {
  const oldFixture = get().fixtures.find((f) => f.id === id);
  if (!oldFixture) return;

  const command = new UpdateFixtureCommand(id, oldFixture, updates);
  await useUndoRedoStore.getState().executeCommand(command);
};
```

**2. Keyboard Shortcuts** (`src/main/ipc/menu.ts`)

Add menu items and keyboard shortcuts:

- Edit → Undo (Cmd+Z / Ctrl+Z)
- Edit → Redo (Cmd+Shift+Z / Ctrl+Shift+Z)
- Show/hide undo description in menu

**3. UI Indicators** (Optional but recommended)

Add undo/redo buttons to toolbars:

- Equipment Manager toolbar
- Prep module toolbar
- Show tooltip with operation description on hover

### Implementation Steps

1. **Create types and interfaces** (`src/renderer/src/types/commands.ts`)
2. **Create undo/redo store** (`src/renderer/src/store/undoRedoStore.ts`)
3. **Implement fixture commands** (`src/renderer/src/commands/fixtureCommands.ts`)
4. **Update fixture store** to use commands (`src/renderer/src/store/fixtureStore.ts`)
5. **Add keyboard shortcuts** (`src/main/ipc/menu.ts`)
6. **Test fixture undo/redo** thoroughly
7. **Repeat steps 3-4 for infrastructure** (commands + store updates)
8. **Repeat steps 3-4 for prep module** (commands + store updates)
9. **Implement composite commands** for bulk operations
10. **Add UI indicators** (optional)

### Edge Cases & Considerations

- **File operations:** Clear undo/redo history when switching projects or closing files
- **Memory management:** Limit undo stack to 100 operations (configurable in settings)
- **Failed operations:** If undo/redo fails, show error and remove from stack
- **Concurrent edits:** If underlying data changes between execute and undo, handle gracefully
- **Bulk operations:** Group multiple edits into single undo operation using CompositeCommand

---

## 2. PAPERWORK GENERATOR & HEADERS

### Overview

Extend existing paperwork/export system with comprehensive report generation and customizable headers with field selection and positioning.

### Current State

- **Export headers exist** (`src/renderer/src/utils/exportHeaders.ts`) - supports CSV, EOS, GrandMA formats
- **Export dialog exists** (`src/renderer/src/components/fixture/ExportHeaderDialog.tsx`) - basic field toggles
- **PrintBuilder exists** (`src/renderer/src/components/prep/PrintBuilder.tsx`) - drag-and-drop template builder
- **PDF generation works** (`src/main/ipc/paperwork.ts`) - uses Electron printToPDF
- **Template system exists** in prep store - save/load print templates

### Enhancements Needed

#### A. Customizable Header System

**1. Database Schema** (Add to `src/main/database/projectSchema.ts`)

```sql
CREATE TABLE paperwork_header_templates (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  name TEXT NOT NULL,
  description TEXT,

  -- Header layout configuration (JSON)
  layout TEXT NOT NULL, -- JSON: { sections: [{type, position, size, visible}] }

  -- Default field values
  show_name TEXT,
  company_logo_path TEXT,
  designer_name TEXT,
  designer_email TEXT,
  designer_phone TEXT,
  venue_name TEXT,
  venue_city TEXT,
  venue_state TEXT,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**2. Header Layout Editor** (`src/renderer/src/components/paperwork/HeaderLayoutEditor.tsx`)

New component for drag-and-drop header design:

- **Canvas-based editor** similar to LabelDesigner
- **Available fields** (left panel):
  - Show Name
  - Company Logo
  - Designer Info (name, email, phone)
  - Venue Info (name, city, state)
  - Custom Title
  - Date/Time
  - Revision Number
  - Page Numbers
  - Custom Text
- **Drag-and-drop** fields onto canvas
- **Position/resize** controls for each field
- **Text styling** options (font, size, color, alignment)
- **Save as template** for reuse

**3. Header Rendering** (`src/renderer/src/utils/headerRenderer.ts`)

New utility to render headers in various formats:

- `renderHeaderHTML(template, data)` - For PDF export
- `renderHeaderCSV(template, data)` - For CSV comments
- `renderHeaderXML(template, data)` - For console exports

**4. Integration with Export Dialog**

Update `ExportHeaderDialog.tsx`:

- Add "Header Template" dropdown - select from saved templates
- Add "Customize" button - opens HeaderLayoutEditor
- Preview header before export

#### B. Report Types & Templates

**1. New Report Pages** (`src/renderer/src/pages/modules/reports/`)

Create dedicated report pages:

- `ChannelHookup.tsx` - Channel listing with fixture info
- `InstrumentSchedule.tsx` - Fixture schedule grouped by position/type
- `DimmerSchedule.tsx` - Dimmer/circuit assignments
- `ColorSchedule.tsx` - Color cuts and quantities
- `AccessorySchedule.tsx` - Gobo, template, iris inventory
- `PowerDistribution.tsx` - Rack utilization and circuit assignments
- `MagicSheet.tsx` - Custom layout diagrams
- `UniverseMap.tsx` - DMX universe assignments

**2. Report Builder** (`src/renderer/src/components/paperwork/ReportBuilder.tsx`)

Similar to PrintBuilder but for individual reports:

- **Select report type** from list
- **Configure columns** - show/hide, reorder, custom column names
- **Filter data** - by position, type, status, etc.
- **Group by** - position, universe, dimmer rack, etc.
- **Sort options** - channel, position, type, etc.
- **Header template** selection
- **Page layout** - orientation, margins, page size
- **Save as template** for reuse

**3. Data Aggregation** (`src/renderer/src/utils/reportData.ts`)

New utility functions to aggregate data for reports:

- `getChannelHookupData(fixtures, options)` - Returns sorted fixture list
- `getColorCuts(fixtures)` - Groups fixtures by color, calculates quantities
- `getAccessoryInventory(fixtures)` - Groups by gobo, template, etc.
- `getPowerDistributionData(fixtures, racks)` - Aggregates circuit usage
- `getUniverseAssignments(fixtures)` - Groups by universe

**4. Multi-Report Batch Export**

- Select multiple reports to export as single PDF
- Configurable page order
- Shared header across all reports or per-report headers
- Table of contents generation

#### C. Paperwork Manager Page

**Update** `src/renderer/src/pages/modules/Paperwork.tsx`:

Current state: 31,310 tokens (very large file, likely already has significant functionality)

Enhancements:

- **Template library** - Browse saved report templates
- **Quick export** - One-click export of common reports
- **Batch generation** - Generate all standard paperwork at once
- **Export history** - Track what was exported when
- **Share templates** - Export/import template configurations

### Implementation Steps

1. **Create database schema** for header templates
2. **Build HeaderLayoutEditor component** with drag-and-drop
3. **Create header rendering utilities** (HTML, CSV, XML)
4. **Update ExportHeaderDialog** to use templates
5. **Create report data aggregation utilities**
6. **Build report pages** one at a time (start with ChannelHookup)
7. **Create ReportBuilder component** for configuration
8. **Add batch export functionality**
9. **Update Paperwork.tsx** with template library
10. **Test all report types** with real data

### Field Positioning Details (Per User Request)

For header field positioning:

- **Grid-based layout** - Snap to grid for alignment
- **Pixel-perfect positioning** - X/Y coordinates
- **Alignment guides** - Show when fields align
- **Predefined zones** - Header, footer, left sidebar, right sidebar
- **Templates** - Pre-configured layouts (Centered Title, Logo Left + Info Right, etc.)

---

## 3. LABEL DESIGNER

### Overview

Complete the existing Label Designer implementation by adding actual printing and PDF export functionality.

### Current State

- **UI fully built** (`src/pages/modules/LabelDesigner.tsx`, 1182 lines)
- **Canvas-based designer** with graphics editor (text, shapes, lines)
- **Template system** for cable, circuit, fixture, dimmer labels
- **Batch mode** for multiple copies
- **Printer support defined** (Dymo, Brother, Zebra, Avery)
- **Avery templates** configured (5160, 5163, 5164, 8160, 5167)
- **LocalStorage persistence** of designs

### Missing Features (TODOs in code)

**Line 708:** `// TODO: Implement actual printing via Electron IPC`
**Line 713:** `// TODO: Implement PDF export`

### Implementation Needed

#### A. Database Persistence

**1. Database Schema** (Add to `src/main/database/projectSchema.ts`)

```sql
CREATE TABLE label_designs (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  label_type TEXT NOT NULL, -- 'cable', 'circuit', 'fixture', 'dimmer', 'custom'

  -- Design configuration (JSON)
  graphics TEXT NOT NULL, -- JSON array of graphic objects
  printer_type TEXT NOT NULL, -- 'dymo', 'brother', 'zebra', 'avery'
  avery_template TEXT, -- Avery template ID if applicable

  -- Label dimensions (in inches)
  width REAL NOT NULL,
  height REAL NOT NULL,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

**2. Query Functions** (`src/main/database/queries/labels.ts`)

```typescript
export function getAllLabelDesigns(projectId: string): LabelDesign[];
export function createLabelDesign(design: Partial<LabelDesign>, projectId: string): LabelDesign;
export function updateLabelDesign(id: string, updates: Partial<LabelDesign>): LabelDesign;
export function deleteLabelDesign(id: string): void;
```

**3. IPC Handlers** (`src/main/ipc/labels.ts`)

```typescript
ipcMain.handle('labels:getAll', async (_, projectId: string) => {
  return getAllLabelDesigns(projectId);
});

ipcMain.handle('labels:create', async (_, design, projectId: string) => {
  return createLabelDesign(design, projectId);
});

ipcMain.handle('labels:update', async (_, id: string, updates) => {
  return updateLabelDesign(id, updates);
});

ipcMain.handle('labels:delete', async (_, id: string) => {
  deleteLabelDesign(id);
});
```

**4. Update Preload** (`src/preload/index.ts`)

Add to API:

```typescript
labels: {
  getAll: (projectId: string) => ipcRenderer.invoke('labels:getAll', projectId),
  create: (design: any, projectId: string) => ipcRenderer.invoke('labels:create', design, projectId),
  update: (id: string, updates: any) => ipcRenderer.invoke('labels:update', id, updates),
  delete: (id: string) => ipcRenderer.invoke('labels:delete', id),
  print: (designId: string, count: number) => ipcRenderer.invoke('labels:print', designId, count),
  exportPDF: (designId: string, count: number) => ipcRenderer.invoke('labels:exportPDF', designId, count)
}
```

#### B. Printing Implementation

**1. Install Printing Library**

```bash
npm install electron-printer
```

**2. Print Handler** (`src/main/ipc/labels.ts`)

```typescript
import { getPrinters, print } from 'electron-printer';

ipcMain.handle('labels:getPrinters', async () => {
  return getPrinters();
});

ipcMain.handle('labels:print', async (_, designId: string, count: number, printerName?: string) => {
  // 1. Fetch label design from database
  const design = getLabelDesignById(designId);

  // 2. Render label as image (canvas to PNG)
  const imageBuffer = await renderLabelAsImage(design);

  // 3. Send to printer
  await print({
    printer: printerName || undefined, // Use default if not specified
    data: imageBuffer,
    type: 'RAW', // or 'PDF' depending on printer
    copies: count,
  });

  return { success: true };
});
```

**3. Label Rendering Utility** (`src/main/utils/labelRenderer.ts`)

Use node-canvas to render labels server-side:

```bash
npm install canvas
```

```typescript
import { createCanvas } from 'canvas';

export function renderLabelAsImage(design: LabelDesign): Buffer {
  const canvas = createCanvas(
    design.width * 96, // Convert inches to pixels (96 DPI)
    design.height * 96,
  );
  const ctx = canvas.getContext('2d');

  // Render each graphic from design.graphics
  design.graphics.forEach((graphic) => {
    if (graphic.type === 'text') {
      ctx.font = `${graphic.fontSize}px ${graphic.fontFamily}`;
      ctx.fillText(graphic.text, graphic.x, graphic.y);
    } else if (graphic.type === 'rectangle') {
      ctx.fillRect(graphic.x, graphic.y, graphic.width, graphic.height);
    }
    // ... render other graphic types
  });

  return canvas.toBuffer('image/png');
}
```

#### C. PDF Export Implementation

**1. PDF Export Handler** (`src/main/ipc/labels.ts`)

```typescript
import PDFDocument from 'pdfkit';

ipcMain.handle('labels:exportPDF', async (_, designId: string, count: number, filePath: string) => {
  const design = getLabelDesignById(designId);

  // Create PDF
  const doc = new PDFDocument({
    size: [design.width * 72, design.height * 72], // Convert inches to points
    margin: 0,
  });

  // Pipe to file
  doc.pipe(fs.createWriteStream(filePath));

  // Render label `count` times
  for (let i = 0; i < count; i++) {
    if (i > 0) doc.addPage();

    const imageBuffer = await renderLabelAsImage(design);
    doc.image(imageBuffer, 0, 0, {
      width: design.width * 72,
      height: design.height * 72,
    });
  }

  doc.end();
  return { success: true, path: filePath };
});
```

**2. For Avery Sheets** (Multiple labels per page)

Special handling for Avery templates:

```typescript
function renderAverySheet(
  design: LabelDesign,
  averyTemplate: AveryTemplate,
  count: number,
): Buffer {
  const doc = new PDFDocument({
    size: 'LETTER',
    margin: 0,
  });

  const labelsPerPage = averyTemplate.rows * averyTemplate.cols;
  const totalPages = Math.ceil(count / labelsPerPage);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();

    let labelIndex = 0;
    for (let row = 0; row < averyTemplate.rows; row++) {
      for (let col = 0; col < averyTemplate.cols; col++) {
        if (labelIndex >= count) break;

        const x =
          averyTemplate.marginLeft +
          col * (averyTemplate.labelWidth + averyTemplate.horizontalSpacing);
        const y =
          averyTemplate.marginTop +
          row * (averyTemplate.labelHeight + averyTemplate.verticalSpacing);

        const labelImage = await renderLabelAsImage(design);
        doc.image(labelImage, x * 72, y * 72, {
          width: averyTemplate.labelWidth * 72,
          height: averyTemplate.labelHeight * 72,
        });

        labelIndex++;
      }
    }
  }

  doc.end();
  return doc;
}
```

#### D. Variable Field Binding (Batch Generation)

**1. Add Variable Fields to Designer**

Update LabelDesigner.tsx to support placeholder fields:

- `[Channel]` - Replaced with fixture channel
- `[Address]` - Replaced with DMX address
- `[Color]` - Replaced with color
- `[Purpose]` - Replaced with purpose/position
- `[Circuit]` - Replaced with circuit number
- `[Dimmer]` - Replaced with dimmer number

**2. Batch Label Generation** (`src/renderer/src/utils/batchLabelGeneration.ts`)

```typescript
export function generateLabelsFromFixtures(
  designTemplate: LabelDesign,
  fixtures: Fixture[],
): LabelDesign[] {
  return fixtures.map((fixture) => {
    const design = { ...designTemplate };
    design.graphics = design.graphics.map((graphic) => {
      if (graphic.type === 'text') {
        let text = graphic.text;
        text = text.replace('[Channel]', fixture.channel?.toString() || '');
        text = text.replace('[Address]', fixture.dmx_address?.toString() || '');
        text = text.replace('[Color]', fixture.color || '');
        text = text.replace('[Purpose]', fixture.purpose || '');
        // ... replace other variables
        return { ...graphic, text };
      }
      return graphic;
    });
    return design;
  });
}
```

**3. UI for Batch Generation**

Add to LabelDesigner.tsx:

- "Generate from Fixtures" button
- Fixture selection dialog (multi-select)
- Preview batch with variable replacement
- Print all or export all to PDF

#### E. Migration from LocalStorage to Database

**1. Migration Function** (Run on component mount)

```typescript
useEffect(() => {
  const migrateFromLocalStorage = async () => {
    const localKey = `showstack_labelDesigns_${currentProjectId}`;
    const localData = localStorage.getItem(localKey);

    if (localData) {
      const designs = JSON.parse(localData);
      for (const design of designs) {
        await window.api.labels.create(design, currentProjectId);
      }
      localStorage.removeItem(localKey); // Clear after migration
    }
  };

  migrateFromLocalStorage();
}, [currentProjectId]);
```

### Implementation Steps

1. **Add database schema** for label_designs table
2. **Create query functions** (`src/main/database/queries/labels.ts`)
3. **Create IPC handlers** (`src/main/ipc/labels.ts`)
4. **Update preload API** to expose label functions
5. **Install printing dependencies** (electron-printer, canvas, pdfkit)
6. **Implement label rendering utility** (canvas → PNG)
7. **Implement print handler** with printer discovery
8. **Implement PDF export handler**
9. **Add Avery sheet rendering** for multi-label pages
10. **Update LabelDesigner.tsx** to use database instead of localStorage
11. **Add variable field support** ([Channel], [Address], etc.)
12. **Build batch generation UI** for fixture-based labels
13. **Add migration from localStorage** to database
14. **Test printing** with all supported printers
15. **Test PDF export** with various label types

### Printer-Specific Considerations

- **Dymo LabelWriter:** Uses proprietary drivers, may need Dymo SDK
- **Brother P-Touch:** Standard printing via electron-printer should work
- **Zebra ZD420:** May need ZPL (Zebra Programming Language) for best results
- **Avery (Standard Printer):** PDF export to standard printer is simplest approach

Consider using ZPL for Zebra printers:

```typescript
function generateZPL(design: LabelDesign): string {
  let zpl = '^XA'; // Start format
  design.graphics.forEach((graphic) => {
    if (graphic.type === 'text') {
      zpl += `^FO${graphic.x},${graphic.y}^A0N,${graphic.fontSize},${graphic.fontSize}^FD${graphic.text}^FS`;
    }
  });
  zpl += '^XZ'; // End format
  return zpl;
}
```

---

## PRIORITY ORDER RECOMMENDATION

Based on complexity and dependencies:

1. **Label Designer** (Easiest) - Most of the UI is done, just needs IPC/printing
2. **Paperwork Generator** (Medium) - Extend existing systems, build on PrintBuilder
3. **Undo/Redo** (Most Complex) - Requires refactoring all stores and operations

However, **undo/redo** provides immediate value across the entire app, while the other two are module-specific. Consider tackling undo/redo first for maximum impact, or Label Designer first for a quick win.

---

## DEPENDENCIES TO INSTALL

```bash
# For Label Designer
npm install electron-printer canvas pdfkit

# For Paperwork Generator (may already be installed)
npm install pdfkit

# No new dependencies needed for Undo/Redo
```

---

## TESTING STRATEGY

### Undo/Redo

- Unit tests for Command implementations
- Integration tests for each store
- Manual testing: Perform 100+ operations, undo all, redo all
- Edge case: Undo after file reload (should clear history)

### Paperwork Generator

- Generate reports with varying data sizes (10 fixtures vs 1000 fixtures)
- Test all report types with edge cases (missing data, special characters)
- PDF generation on different OS (macOS, Windows, Linux)
- Header positioning accuracy across different page sizes

### Label Designer

- Test printing on actual hardware (Dymo, Brother, Zebra)
- Verify Avery spacing matches physical labels
- Batch generation with 100+ fixtures
- Variable field replacement accuracy
- PDF export quality (DPI, resolution)

---

## ESTIMATED COMPLEXITY

- **Undo/Redo:** ~3-5 days (Command pattern, store refactoring, testing)
- **Paperwork Generator:** ~5-7 days (Report pages, header editor, templates)
- **Label Designer:** ~2-3 days (IPC handlers, printing, PDF export)

**Total:** ~10-15 days for all three features
