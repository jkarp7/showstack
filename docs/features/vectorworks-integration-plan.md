# Vectorworks Integration Implementation Plan

**Scope:** Full integration (import, export, MVR support, reconciliation)
**Delivery:** Phased approach with 5 iterative milestones
**Target:** Vectorworks 2024+ XML format
**Timeline:** 13 weeks (3.25 months)
**Effort:** 1 developer full-time
**Status:** Planned (not yet implemented)
**Created:** January 20, 2026
**Priority:** Medium-High (addresses competitive gap with Lightwright)

---

## Overview

This plan implements complete bidirectional Vectorworks integration for ShowStack, providing:

- **Import** Vectorworks XML files into ShowStack
- **Export** ShowStack fixtures to Vectorworks XML
- **MVR Export** Industry-standard format for visualizers/consoles
- **Reconciliation** Field-level conflict resolution with side-by-side comparison
- **Testing** 70%+ coverage following testing_guide.md patterns

---

## Architecture Decisions

### 1. XML Library: `fast-xml-parser`

- 2-3x faster than xml2js (critical for 1000+ fixture files)
- Native TypeScript support
- Built-in XSD validation
- Already used in GrandMA export

### 2. File Processing: Main Process (Node.js)

- Follows Electron security best practices
- Matches existing InfrastructureImportDialog pattern
- Centralized security validation

### 3. State Management: Zustand Store

- `vectorworksStore.ts` for reconciliation UI state
- Existing `fixtureStore.ts` unchanged
- Follows existing pattern

### 4. Undo/Redo: YES - Use Existing Command Pattern

- `ImportVectorworksCommand` for fixture import
- `ReconcileVectorworksCommand` for conflict resolution
- Critical for user safety (bulk operations)

### 5. Field Mapping: User-Defined from Start

- **Phase 1:** User-configurable field mapping in import wizard (like infrastructure import)
- Auto-map common fields (channel, universe, dmx_address, position, etc.)
- Allow users to skip unnecessary fields (not all Vectorworks fields needed for lighting paperwork)
- Save mapping preferences per project for reuse
- **Rationale:** Many Vectorworks fields (focus cuts, scenery, etc.) aren't needed for typical lighting workflows

### 6. Field Selection Philosophy

Users should control which Vectorworks fields to import:

- **Core fields** always mapped: position, unit, type, channel, universe, dmx_address
- **Optional fields** user selects: color, gobo, wattage, focus data, Vectorworks coordinates
- **Skip unnecessary** fields that aren't relevant to their workflow
- **Save preferences** so subsequent imports use same mappings

### 7. Reconciliation Matching Logic

1. **Primary:** Match by `vw_uid` field (exact)
2. **Fallback:** Match by position + unit_number + type (fuzzy)
3. **Last Resort:** Manual user selection

---

## Phase 1: Vectorworks XML Import (Weeks 1-4)

**Milestone:** Import Vectorworks 2024 XML files into ShowStack with user-defined field mapping

### New Files to Create

```
src/main/utils/
├── vectorworksParser.ts                      (500 lines) - XML parsing
├── vectorworksFieldMapper.ts                 (300 lines) - Field mapping
└── __tests__/
    ├── vectorworksParser.test.ts             (400 lines, 80%+ coverage)
    └── vectorworksFieldMapper.test.ts        (250 lines, 80%+ coverage)

src/main/ipc/
├── vectorworks.ts                            (400 lines) - IPC handlers
└── __tests__/
    └── vectorworks.test.ts                   (300 lines, 70%+ coverage)

src/renderer/src/components/fixture/
├── VectorworksImportDialog.tsx               (400 lines) - Import UI with field mapping
├── VectorworksFieldMappingStep.tsx           (250 lines) - Field mapping UI component
└── __tests__/
    ├── VectorworksImportDialog.test.tsx      (200 lines, 50%+ coverage)
    └── VectorworksFieldMappingStep.test.tsx  (150 lines, 50%+ coverage)

src/renderer/src/types/
└── vectorworks.ts                            (150 lines) - TypeScript interfaces
```

### Files to Modify

```
package.json                                  (Add fast-xml-parser dependency)
src/main/ipc/index.ts                         (Register vectorworks handlers)
src/renderer/src/hooks/useEquipmentMenuHandlers.ts  (Add import handler)
src/main/database/projectSchema.ts            (Add field_mapping_preferences table)
```

### Key Implementation Details

#### 1. Add Dependency

```bash
npm install fast-xml-parser@4.3.3
```

#### 2. Create Vectorworks Parser

**File:** `src/main/utils/vectorworksParser.ts`

```typescript
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export class VectorworksParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
  }

  async parseFile(filePath: string): Promise<VectorworksFixture[]> {
    // 1. Validate file path (security)
    validateFilePath(filePath);

    // 2. Read XML file
    const xmlContent = await fs.readFile(filePath, 'utf-8');

    // 3. Validate XML structure
    const validation = XMLValidator.validate(xmlContent);
    if (validation !== true) {
      throw new VectorworksError('Invalid XML', 'PARSE_ERROR');
    }

    // 4. Parse XML to JSON
    const parsed = this.parser.parse(xmlContent);

    // 5. Extract fixtures from Vectorworks structure
    return this.extractFixtures(parsed);
  }

  private extractFixtures(parsed: any): VectorworksFixture[] {
    // Navigate: VectorworksDocument > Layer > LightObject
    // Extract ALL available fields from Vectorworks
    // User will select which fields to import in UI
  }

  // Get list of available fields in Vectorworks file
  getAvailableFields(filePath: string): string[] {
    // Parse file and return list of all fields found
    // Used by UI to populate field mapping dropdown
  }
}
```

#### 3. Create Field Mapper

**File:** `src/main/utils/vectorworksFieldMapper.ts`

**Default Auto-Mapping (user can override):**

- `Instrument Type` → `type`
- `Unit Number` → `unit_number`
- `Channel` → `channel`
- `Universe` → `universe`
- `Address` → `dmx_address`
- `Position` → `position`
- `Wattage` → `wattage`
- `Color` → `color`
- `Gobo` → `gobo`
- `Purpose` → `purpose`

**Always Map (Required):**

- `UID` → `vw_uid` (for reconciliation)
- `Layer` → `vw_layer` (preserve Vectorworks data)

**User Selects (Optional):**

- All other fields are opt-in via field mapping UI
- Common skipped fields: focus cuts, scenery, Vectorworks coordinates (unless doing 3D work)

```typescript
export class VectorworksFieldMapper {
  // Get default field mappings (auto-detected)
  getDefaultMappings(): FieldMapping[] {
    return [
      { vw_field: 'Instrument Type', ss_field: 'type', required: true },
      { vw_field: 'Unit Number', ss_field: 'unit_number', required: false },
      { vw_field: 'Channel', ss_field: 'channel', required: false },
      // ... more defaults
    ];
  }

  // Apply user-configured mappings
  mapToFixture(vwFixture: VectorworksFixture, fieldMappings: FieldMapping[]): Partial<Fixture> {
    const result: Partial<Fixture> = {
      vw_uid: vwFixture.uid, // Always map
      import_source: 'vectorworks',
      last_vectorworks_sync: Date.now(),
    };

    // Apply user-selected field mappings
    for (const mapping of fieldMappings) {
      if (mapping.ss_field && vwFixture[mapping.vw_field]) {
        result[mapping.ss_field] = vwFixture[mapping.vw_field];
      }
    }

    return result;
  }
}
```

#### 4. Create IPC Handlers

**File:** `src/main/ipc/vectorworks.ts`

```typescript
ipcMain.handle('vectorworks:showImportDialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Vectorworks Files', extensions: ['xml', 'vwx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  return {
    canceled: result.canceled,
    filePath: result.filePaths[0],
  };
});

ipcMain.handle('vectorworks:parseFile', async (_event, filePath: string) => {
  const parser = new VectorworksParser();
  const vwFixtures = await parser.parseFile(filePath);
  return { success: true, fixtures: vwFixtures };
});

ipcMain.handle('vectorworks:getAvailableFields', async (_event, filePath: string) => {
  const parser = new VectorworksParser();
  const fields = parser.getAvailableFields(filePath);
  return { success: true, fields };
});

ipcMain.handle(
  'vectorworks:import',
  async (
    _event,
    projectId: string,
    fixtures: Partial<Fixture>[],
    fieldMappings: FieldMapping[],
  ) => {
    // Save field mapping preferences for this project
    await saveFieldMappingPreference(projectId, fieldMappings);

    // Import fixtures to database
    // Return import result
  },
);
```

#### 5. Create Import Dialog with Field Mapping

**File:** `src/renderer/src/components/fixture/VectorworksImportDialog.tsx`

**Pattern:** Multi-step wizard (matches InfrastructureImportDialog.tsx)

Steps:

1. **Select File** - File picker for Vectorworks XML
2. **Map Fields** - User selects which Vectorworks fields to import
   - Auto-map common fields (channel, universe, position, etc.)
   - Display dropdown for each Vectorworks field → ShowStack field
   - Allow users to skip fields they don't need
   - Save mapping preference for this project
3. **Preview** - Show fixture count and mapped data preview
4. **Importing** - Progress indicator
5. **Complete** - Success/error summary

**Field Mapping UI:**

```
┌─────────────────────────────────────────────────┐
│ Map Vectorworks Fields to ShowStack             │
├─────────────────────────────────────────────────┤
│ Vectorworks Field      → ShowStack Field        │
│ ├─ Instrument Type     → [Type ▼]               │
│ ├─ Unit Number         → [Unit # ▼]             │
│ ├─ Channel             → [Channel ▼]            │
│ ├─ Universe            → [Universe ▼]           │
│ ├─ Address             → [DMX Address ▼]        │
│ ├─ Position            → [Position ▼]           │
│ ├─ Focus Up/Down       → [Skip ▼]               │
│ ├─ Scenery             → [Skip ▼]               │
│ └─ ...                                          │
├─────────────────────────────────────────────────┤
│ ☑ Save mapping as default for this project     │
│                            [Back]  [Next →]     │
└─────────────────────────────────────────────────┘
```

#### 6. Field Mapping Preferences Storage

**Database Schema Addition:**

```sql
CREATE TABLE IF NOT EXISTS field_mapping_preferences (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'vectorworks', 'eos', 'grandma'
  mapping_data TEXT NOT NULL, -- JSON of field mappings
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Testing Strategy

**Coverage Targets:**

- Parser: 80%+ (critical utility)
- Field Mapper: 80%+ (critical utility)
- IPC Handlers: 70%+ (IPC handlers)
- Components: 50%+ (UI components)

**Key Tests:**

- Valid Vectorworks 2024 XML parsing
- Invalid XML rejection
- Empty fixture list handling
- All field extractions
- Field mapping with user selections
- Skipping unnecessary fields
- Saving/loading mapping preferences
- Error handling (file not found, corrupted XML)
- Security validations (path traversal)

### Deliverables

- [x] XML parser with 80%+ coverage
- [x] Field mapper with configurable mappings and 80%+ coverage
- [x] IPC handlers with 70%+ coverage
- [x] Import dialog with field mapping UI and 50%+ coverage
- [x] Field mapping preferences storage (per project)
- [x] Integration tests
- [x] Documentation: Supported versions, field mapping guide

**Effort:** 3.5 weeks (additional 0.5 week for field mapping UI)

---

## Phase 2: Vectorworks XML Export (Weeks 5-6)

**Milestone:** Export ShowStack fixtures to Vectorworks 2024 XML

### New Files to Create

```
src/main/utils/
├── vectorworksExporter.ts                    (400 lines) - XML generation
└── __tests__/
    └── vectorworksExporter.test.ts           (300 lines, 80%+ coverage)

src/renderer/src/components/fixture/
├── VectorworksExportDialog.tsx               (200 lines) - Export options
└── __tests__/
    └── VectorworksExportDialog.test.tsx      (150 lines, 50%+ coverage)
```

### Files to Modify

```
src/main/ipc/vectorworks.ts                   (Add export handler)
src/renderer/src/hooks/useEquipmentMenuHandlers.ts  (Add export handler)
src/renderer/src/pages/modules/EquipmentManager.tsx  (Add menu item)
```

### Key Implementation Details

#### 1. Create XML Exporter

**File:** `src/main/utils/vectorworksExporter.ts`

```typescript
import { XMLBuilder } from 'fast-xml-parser';

export class VectorworksExporter {
  private builder: XMLBuilder;

  exportToXML(fixtures: Fixture[]): string {
    const document = {
      VectorworksDocument: {
        '@_version': '2024',
        Layer: {
          '@_name': 'Lighting',
          LightObject: fixtures.map((f) => this.fixtureToVectorworks(f)),
        },
      },
    };

    return this.builder.build(document);
  }

  private fixtureToVectorworks(fixture: Fixture): any {
    return {
      UID: fixture.vw_uid || fixture.id,
      InstrumentType: fixture.type,
      UnitNumber: fixture.unit_number,
      // ... map all fields back to Vectorworks

      // Preserve Vectorworks-specific fields
      Layer: fixture.vw_layer,
      Class: fixture.vw_class,
      XCoordinate: fixture.vw_x_coordinate,
      // ...
    };
  }
}
```

#### 2. Add Export IPC Handler

**File:** `src/main/ipc/vectorworks.ts`

```typescript
ipcMain.handle('vectorworks:export', async (_event, projectId: string, fixtureIds?: string[]) => {
  // Get fixtures
  const allFixtures = await getAllFixtures(projectId);
  const fixtures = fixtureIds ? allFixtures.filter((f) => fixtureIds.includes(f.id)) : allFixtures;

  // Generate XML
  const exporter = new VectorworksExporter();
  const xml = exporter.exportToXML(fixtures);

  // Show save dialog and write file
  // ...
});
```

### Testing Strategy

**Key Tests:**

- Generate valid Vectorworks 2024 XML
- Preserve Vectorworks-specific fields
- Handle fixtures without Vectorworks data
- **Round-trip testing:** Import → Export → Import (data integrity)

### Deliverables

- [x] XML exporter with 80%+ coverage
- [x] Round-trip tests
- [x] Export dialog with options
- [x] Menu integration
- [x] Documentation

**Effort:** 2 weeks

---

## Phase 3: MVR Export (Weeks 7-8)

**Milestone:** Export fixtures to MVR format (industry standard)

### New Files to Create

```
src/main/utils/
├── mvrExporter.ts                            (300 lines) - MVR generation
└── __tests__/
    └── mvrExporter.test.ts                   (200 lines, 70%+ coverage)
```

### Files to Modify

```
package.json                                  (Add adm-zip dependency)
src/main/ipc/vectorworks.ts                   (Add MVR export handler)
```

### Key Implementation Details

#### 1. Add Dependency

```bash
npm install adm-zip@0.5.10
```

#### 2. Create MVR Exporter

**File:** `src/main/utils/mvrExporter.ts`

MVR format = ZIP archive containing:

- `GeneralSceneDescription.xml` (Vectorworks format)
- `manifest.xml` (MVR metadata)
- Optional: 3D geometry (future phase)

```typescript
import AdmZip from 'adm-zip';
import { VectorworksExporter } from './vectorworksExporter';

export class MVRExporter {
  async exportToMVR(fixtures: Fixture[], outputPath: string): Promise<void> {
    const zip = new AdmZip();

    // 1. Generate GeneralSceneDescription.xml
    const exporter = new VectorworksExporter();
    const xml = exporter.exportToXML(fixtures);
    zip.addFile('GeneralSceneDescription.xml', Buffer.from(xml, 'utf-8'));

    // 2. Add MVR manifest
    const manifest = this.generateManifest();
    zip.addFile('manifest.xml', Buffer.from(manifest, 'utf-8'));

    // 3. Write MVR file (ZIP)
    await zip.writeZipPromise(outputPath);
  }
}
```

### Testing Strategy

**Key Tests:**

- Valid MVR file creation (ZIP structure)
- GeneralSceneDescription.xml validity
- Manifest.xml structure
- File extraction and validation

### Deliverables

- [x] MVR exporter with 70%+ coverage
- [x] MVR validation tests
- [x] IPC handler
- [x] Menu integration
- [x] Documentation

**Effort:** 2 weeks

---

## Phase 4: Reconciliation UI (Weeks 9-11)

**Milestone:** Field-level conflict resolution with side-by-side comparison

### New Files to Create

```
src/renderer/src/components/fixture/
├── VectorworksReconciliationDialog.tsx       (600 lines) - Main UI
├── ReconciliationTable.tsx                   (400 lines) - Comparison table
├── FieldDiffViewer.tsx                       (200 lines) - Field diff
├── ConflictResolutionPanel.tsx               (300 lines) - Resolution UI
└── __tests__/
    ├── VectorworksReconciliationDialog.test.tsx  (300 lines)
    ├── ReconciliationTable.test.tsx          (200 lines)
    └── FieldDiffViewer.test.tsx              (150 lines)

src/renderer/src/store/
├── vectorworksStore.ts                       (250 lines) - State management
└── __tests__/
    └── vectorworksStore.test.ts              (200 lines)

src/renderer/src/utils/
├── reconciliationUtils.ts                    (400 lines) - Diff logic
└── __tests__/
    └── reconciliationUtils.test.ts           (300 lines, 80%+ coverage)

src/renderer/src/commands/
├── vectorworksCommands.ts                    (350 lines) - Undo/redo
└── __tests__/
    └── vectorworksCommands.test.ts           (250 lines)
```

### Key Implementation Details

#### 1. Create Reconciliation Store

**File:** `src/renderer/src/store/vectorworksStore.ts`

```typescript
interface ReconciliationData {
  vwFixtures: VectorworksFixture[];
  showstackFixtures: Fixture[];
  matches: Map<string, FixtureMatch>;
  conflicts: Conflict[];
}

interface FixtureMatch {
  vwFixture: VectorworksFixture;
  showstackFixture: Fixture | null;
  matchType: 'exact' | 'fuzzy' | 'none';
  conflicts: FieldConflict[];
}

interface FieldConflict {
  field: string;
  vwValue: any;
  showstackValue: any;
  resolution: 'keep' | 'overwrite' | 'merge' | null;
}

export const useVectorworksStore = create<VectorworksStore>((set, get) => ({
  reconciliationData: null,
  // ... state management
}));
```

#### 2. Create Reconciliation Engine

**File:** `src/renderer/src/utils/reconciliationUtils.ts`

**Matching Logic:**

1. Try exact match by `vw_uid`
2. Fallback: fuzzy match by `position` + `unit_number` + `type`
3. Detect field-level conflicts

**Conflict Detection:**

- Compare all imported fields (based on user's field mapping)
- Flag differences where both values are non-null
- Store conflicts for user resolution

#### 3. Create Vectorworks Commands

**File:** `src/renderer/src/commands/vectorworksCommands.ts`

```typescript
export class ImportVectorworksCommand implements Command {
  type = CommandType.VECTORWORKS_IMPORT;

  async execute() {
    // Import fixtures to database
    // Update fixture store
  }

  async undo() {
    // Delete imported fixtures
    // Restore store state
  }
}

export class ReconcileVectorworksCommand implements Command {
  type = CommandType.VECTORWORKS_RECONCILE;

  async execute() {
    // Apply field updates based on resolutions
    // Update fixture store
  }

  async undo() {
    // Restore old field values
    // Update fixture store
  }
}
```

#### 4. Create Reconciliation UI

**File:** `src/renderer/src/components/fixture/VectorworksReconciliationDialog.tsx`

**UI Layout:**

```
┌─────────────────────────────────────────────────┐
│ Reconcile with Vectorworks                      │
│ 250 fixtures | 37 conflicts detected            │
├─────────────────────────────────────────────────┤
│ [All Fixtures] [Conflicts Only (37)]            │
│                    [Keep All] [Overwrite All]   │
├─────────────────────────────────────────────────┤
│ Fixture         Match    Conflicts   Actions    │
│ ├─ 1st Electric  Exact    3          [Show]    │
│ ├─ FOH           Fuzzy    1          [Show]    │
│ └─ ...                                          │
├─────────────────────────────────────────────────┤
│             [Cancel]  [Apply Changes (37)]      │
└─────────────────────────────────────────────────┘
```

**Expanded Row (Field Diff):**

```
┌─────────────────────────────────────────────────┐
│ Channel                                          │
│ ┌──────────────┬──────────────┐                │
│ │ ShowStack    │ Vectorworks  │                 │
│ │ "100"        │ "101"        │                 │
│ └──────────────┴──────────────┘                │
│          [Keep ShowStack] [Use Vectorworks]     │
└─────────────────────────────────────────────────┘
```

### Testing Strategy

**Key Tests:**

- Fixture matching (exact, fuzzy, none)
- Conflict detection (all field types)
- Resolution application
- Undo/redo for import and reconciliation
- Component interactions

### Deliverables

- [x] Reconciliation engine with 80%+ coverage
- [x] Vectorworks commands with 70%+ coverage
- [x] Reconciliation UI with 50%+ coverage
- [x] Field-level diff viewer
- [x] Conflict resolution workflow
- [x] Documentation

**Effort:** 3 weeks

---

## Phase 5: Integration & Polish (Weeks 12-13)

**Milestone:** Production-ready Vectorworks integration

### Implementation Steps

#### 1. Menu Integration

Add to Equipment Manager menu:

- File → Import → From Vectorworks...
- File → Export → To Vectorworks...
- File → Export → To MVR...
- File → Import → Reconcile with Vectorworks...

#### 2. Error Handling

Global error handling with actionable messages:

- `PARSE_ERROR` → "Failed to parse Vectorworks file. Please check the file format."
- `UNSUPPORTED_VERSION` → "This Vectorworks file version is not supported. Please export as Vectorworks 2024 XML."
- `IMPORT_FAILED` → "Import failed. Check fixture data for errors."

#### 3. Progress Indicators

For large operations (1000+ fixtures):

- Parsing XML progress
- Importing fixtures progress
- Reconciliation progress
- Cancelable operations

#### 4. Documentation

Create comprehensive user documentation:

- Import guide with field mapping instructions
- Export guide
- Reconciliation workflow
- Field mapping best practices
- Troubleshooting guide
- Keyboard shortcuts

#### 5. End-to-End Testing

Test full workflow:

1. Import Vectorworks XML with custom field mapping
2. Edit fixtures in ShowStack
3. Export to Vectorworks
4. Re-import with reconciliation
5. Resolve conflicts
6. Verify final state

### Deliverables

- [x] Complete menu integration
- [x] Global error handling
- [x] Progress indicators
- [x] User documentation
- [x] Keyboard shortcuts
- [x] E2E tests
- [x] Performance optimization
- [x] Bug fixes from QA

**Effort:** 2 weeks

---

## Testing Summary

| Component             | Files  | Tests   | Coverage |
| --------------------- | ------ | ------- | -------- |
| XML Parser            | 1      | 20      | 80%+     |
| Field Mapper          | 1      | 18      | 80%+     |
| XML Exporter          | 1      | 18      | 80%+     |
| MVR Exporter          | 1      | 12      | 70%+     |
| Reconciliation Engine | 1      | 25      | 80%+     |
| IPC Handlers          | 1      | 22      | 70%+     |
| Commands              | 1      | 10      | 70%+     |
| UI Components         | 8      | 40      | 50%+     |
| E2E Tests             | 1      | 5       | N/A      |
| **TOTAL**             | **16** | **170** | **70%**  |

**Testing Tools:**

- Vitest + React Testing Library
- Mock data from real Vectorworks files
- CI/CD: GitHub Actions

---

## Dependencies

### New NPM Packages

```json
{
  "dependencies": {
    "fast-xml-parser": "^4.3.3",
    "adm-zip": "^0.5.10"
  },
  "devDependencies": {
    "@types/adm-zip": "^0.5.5"
  }
}
```

**Bundle Size Impact:** ~65KB gzipped (acceptable for Electron)

---

## Risk Assessment

### High-Risk Items

1. **Vectorworks Schema Changes**
   - **Risk:** Vectorworks updates XML in future versions
   - **Mitigation:** Version detection, schema validation, comprehensive tests

2. **Data Loss in Reconciliation**
   - **Risk:** User accidentally overwrites important data
   - **Mitigation:** Undo/redo support, confirmation dialogs, backup prompts

3. **Performance with Large Files**
   - **Risk:** 5000+ fixtures cause UI freezing
   - **Mitigation:** Streaming parser, progress indicators, web workers

### Medium-Risk Items

1. **Field Mapping Complexity**
   - **Risk:** Users confused by field mapping UI
   - **Mitigation:** Smart defaults, tooltips, "skip all optional" button, help documentation

2. **Cross-Platform Path Issues**
   - **Risk:** Windows vs Mac path handling
   - **Mitigation:** Use `path.join()`, comprehensive Windows testing

---

## Timeline & Milestones

```
Week 1-2:   Phase 1 - Parser & Field Mapper
Week 3:     Phase 1 - Import Dialog (File Selection & Field Mapping)
Week 4:     Phase 1 - Field Mapping UI & Tests
Week 5:     Phase 2 - XML Exporter
Week 6:     Phase 2 - Export Dialog & Tests
Week 7:     Phase 3 - MVR Exporter
Week 8:     Phase 3 - MVR Tests & Integration
Week 9:     Phase 4 - Reconciliation Engine
Week 10:    Phase 4 - Reconciliation UI (part 1)
Week 11:    Phase 4 - Reconciliation UI (part 2) & Commands
Week 12:    Phase 5 - Integration & Error Handling
Week 13:    Phase 5 - Documentation & E2E Tests
```

### Iterative Delivery Points

- ✅ **Week 4:** Import works with field mapping (Phase 1)
- ✅ **Week 6:** Export works (Phase 2)
- ✅ **Week 8:** MVR export works (Phase 3)
- ✅ **Week 11:** Reconciliation works (Phase 4)
- ✅ **Week 13:** Production-ready (Phase 5)

---

## Critical Files Reference

### Existing Files to Study (Patterns)

```
src/renderer/src/components/infrastructure/InfrastructureImportDialog.tsx
  → Multi-step wizard pattern (select → map → importing → complete)
  → Field mapping UI with auto-detection

src/renderer/src/commands/fixtureCommands.ts
  → Command pattern for undo/redo (execute/undo methods)

src/main/ipc/fixtures.ts
  → IPC handler pattern (ipcMain.handle)

src/main/database/queries/fixtures.ts
  → Database operations (getAllFixtures, createFixture, updateFixture)

src/renderer/src/pages/modules/EquipmentManager.tsx
  → Export implementation (performExport function, lines 519-633)

src/renderer/src/store/fixtureStore.ts
  → Zustand store pattern

docs/testing/TESTING_GUIDE.md
  → Testing patterns and requirements
```

### New Files to Create (Summary)

```
Phase 1 (Import):
  src/main/utils/vectorworksParser.ts
  src/main/utils/vectorworksFieldMapper.ts
  src/main/ipc/vectorworks.ts
  src/renderer/src/components/fixture/VectorworksImportDialog.tsx
  src/renderer/src/components/fixture/VectorworksFieldMappingStep.tsx
  src/renderer/src/types/vectorworks.ts

Phase 2 (Export):
  src/main/utils/vectorworksExporter.ts
  src/renderer/src/components/fixture/VectorworksExportDialog.tsx

Phase 3 (MVR):
  src/main/utils/mvrExporter.ts

Phase 4 (Reconciliation):
  src/renderer/src/utils/reconciliationUtils.ts
  src/renderer/src/components/fixture/VectorworksReconciliationDialog.tsx
  src/renderer/src/components/fixture/ReconciliationTable.tsx
  src/renderer/src/components/fixture/FieldDiffViewer.tsx
  src/renderer/src/store/vectorworksStore.ts
  src/renderer/src/commands/vectorworksCommands.ts
```

---

## Success Criteria

### Technical Requirements

- [x] Import Vectorworks 2024 XML with user-defined field mapping
- [x] Export to Vectorworks 2024 XML with round-trip integrity
- [x] Export to MVR format compatible with GrandMA3, Vectorworks, Vision
- [x] Reconciliation UI supports field-level conflict resolution
- [x] Undo/redo works for all operations
- [x] 70%+ overall test coverage
- [x] Performance: Import 5000 fixtures in < 30 seconds
- [x] Performance: Export 5000 fixtures in < 20 seconds
- [x] Zero data loss through import → export → import cycle

### User Experience Requirements

- [x] Import wizard is intuitive (< 4 clicks with field mapping)
- [x] Field mapping is clear with smart defaults
- [x] Reconciliation clearly shows conflicts
- [x] Error messages are actionable
- [x] Progress indicators for operations > 5 seconds
- [x] Keyboard shortcuts for common operations
- [x] Comprehensive documentation

---

## Future Enhancements (Post-Launch)

1. **MVR Import** - Import from MVR files
2. **3D Visualization** - Display Vectorworks coordinates in 3D
3. **GDTF Integration** - Full GDTF fixture library
4. **Vectorworks Plugin** - Direct communication with running Vectorworks
5. **Bidirectional Sync** - Real-time sync
6. **Advanced Field Mapping** - Computed fields, conditional mappings
7. **Vectorworks 2025+ Support** - Stay current
8. **Batch Import/Export** - Process multiple files
9. **Import Templates** - Save/share mapping templates across projects
10. **Smart Merge Rules** - Automated conflict resolution strategies

---

## Implementation Notes

### Field Mapping Best Practices (for users)

**Recommended Core Fields:**

- Position, Unit Number, Type, Manufacturer, Model
- Channel, Universe, DMX Address, Mode
- Wattage, Purpose

**Optional Fields (import as needed):**

- Color, Gobo, Accessories (if using these)
- Location, System (if tracking these)
- Vectorworks coordinates (only if doing 3D work)

**Fields to Skip (typically):**

- Focus cuts (unless you track focus in Vectorworks)
- Scenery references (unless relevant to your workflow)
- Work notes (these are typically ShowStack-specific)

### Development Best Practices

1. **Test with Real Files:** Use actual Vectorworks files from productions
2. **Version Detection:** Check Vectorworks version in XML header
3. **Graceful Degradation:** Handle missing fields gracefully
4. **Error Messages:** Provide actionable guidance ("export as Vectorworks 2024 XML")
5. **Performance:** Stream large files, don't load all into memory

---

## Next Steps

1. **Team Review** - Review plan with stakeholders
2. **Resource Allocation** - Assign developer
3. **Test Environment** - Set up Vectorworks for testing
4. **Sample Files** - Gather real Vectorworks files from productions (various versions)
5. **Field Mapping Research** - Survey users on which Vectorworks fields they actually use
6. **Begin Phase 1** - Start with XML parser implementation

---

**Last Updated:** January 20, 2026
**Author:** Claude Code
**Version:** 1.1 (with user-defined field mapping)
