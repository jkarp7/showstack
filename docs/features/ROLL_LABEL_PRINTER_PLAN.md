# Roll Label Printer Support Implementation Plan

**Native Driver Support for Dymo, Brother P-Touch, Zebra, and ESC/POS Printers**

## Executive Summary

Add native roll label printer support to ShowStack's existing Avery sheet label system. This implementation maintains 100% backward compatibility while enabling direct printing to Dymo LabelWriter (450/550), Brother P-Touch, Zebra (ZD420/ZD620), and generic ESC/POS thermal printers using native drivers. The unified template system allows one label design to work across both sheet and roll printers with intelligent auto-scaling.

**Key Approach:**

- **Native Drivers**: Use printer-specific libraries (dymo-sdk, node-ptouch, zebra-zpl, escpos) for best quality
- **Unified Templates**: One template works for both sheet and roll printing with auto-scaling
- **Full Size Library**: 30+ standard label sizes per printer type
- **Zero Breaking Changes**: Existing Avery functionality remains untouched
- **Incremental Delivery**: Implement by printer type (Dymo first, then Brother, Zebra, ESC/POS)

**Timeline**: 11 weeks across 8 phases
**Testing**: TDD for utilities, comprehensive integration tests per TESTING_GUIDE.md

---

## Current State Analysis

### Label Printing Architecture

**Current System (Avery Sheet Labels)**:

```
User Design → Grid-Based Template → HTML Generation → Puppeteer → PDF → System Printer
```

**Components**:

- **Designer**: Dual architecture (legacy canvas + modern grid-based at 4 cells/inch)
- **Storage**: SQLite (page_layout_templates, page_layout_elements tables)
- **Renderer**: `/Users/joshkarp/showstack/src/main/utils/labelSheetRenderer.ts`
- **IPC Handler**: `/Users/joshkarp/showstack/src/main/ipc/labelPrinter.ts`
- **Data Mapping**: 40+ fixture fields via labelDataMapper.ts
- **Supported Sheets**: 5 Avery templates (5160, 5163, 5164, 8160, 5167)

**UI Shows (Not Implemented)**:

```typescript
'dymo-450'; // Dymo LabelWriter 450 (UI only - not functional)
'brother-pt'; // Brother P-Touch (UI only)
'zebra'; // Zebra ZD420 (UI only)
'avery-sheet'; // Currently the ONLY working option
```

---

## Architecture Design

### Abstracted Printer Driver Layer

```
┌─────────────────────────────────────────────────────┐
│  Renderer Process (React UI)                        │
│  - Printer selection dropdown                       │
│  - Size selection for roll printers                 │
│  - Unified template designer                        │
└─────────────────┬───────────────────────────────────┘
                  │ IPC (label-printer:*)
┌─────────────────▼───────────────────────────────────┐
│  Main Process                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  labelPrinter.ts (Router)                    │   │
│  │  - Detect printer type                       │   │
│  │  - Route to appropriate driver               │   │
│  └────────────┬─────────────────────────────────┘   │
│               │                                      │
│  ┌────────────▼──────────────┐                      │
│  │  printerDriverManager.ts  │                      │
│  │  - Driver factory         │                      │
│  │  - Printer detection      │                      │
│  └────────┬──────────────────┘                      │
│           │                                          │
│  ┌────────▼───────────────────────────────────┐     │
│  │  Driver Implementations (IPrinterDriver)   │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │     │
│  │  │  Dymo    │ │ Brother  │ │  Zebra   │   │     │
│  │  └──────────┘ └──────────┘ └──────────┘   │     │
│  │  ┌──────────┐ ┌─────────────────────┐     │     │
│  │  │ ESC/POS  │ │ Avery (Puppeteer)   │     │     │
│  │  └──────────┘ └─────────────────────┘     │     │
│  └────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

### Driver Interface

```typescript
// src/main/printing/drivers/IPrinterDriver.ts
interface IPrinterDriver {
  type: PrinterType;
  name: string;

  // Printer management
  detect(): Promise<PrinterInfo[]>;
  connect(printerId: string): Promise<boolean>;
  disconnect(): Promise<void>;

  // Label sizes
  getSupportedSizes(): LabelSize[];

  // Rendering & printing
  render(
    template: PageLayoutTemplate,
    elements: LayoutElement[],
    data: LabelData[],
  ): Promise<PrintJobData>;
  print(jobData: PrintJobData, options: PrintOptions): Promise<void>;

  // Capabilities
  getCapabilities(): PrinterCapabilities;
}
```

### Rendering Pipeline

```
┌─────────────────────────────────────────────┐
│ Template + Elements + Data                  │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│ Grid-to-Absolute Position Conversion        │
│ (rollLabelRenderer.ts)                      │
└────────────┬────────────────────────────────┘
             │
       ┌─────▼─────┐
       │  Router   │
       └─────┬─────┘
             │
    ┌────────┴─────────┐
    │                  │
┌───▼────────┐  ┌─────▼──────────────────┐
│ Avery      │  │ Roll Printer           │
│ (existing) │  │ (new)                  │
└───┬────────┘  └──┬─────────────────────┘
    │              │
    │         ┌────▼────────────────────┐
    │         │ Command Generators:     │
    │         │ - ZPL (Zebra)           │
    │         │ - ESC/POS (Generic)     │
    │         │ - Dymo XML              │
    │         │ - Brother Commands      │
    │         └──┬──────────────────────┘
    │            │
┌───▼────────────▼─────┐
│ Print Job Submission │
└──────────────────────┘
```

---

## Database Schema

### New Table: roll_label_sizes

```sql
CREATE TABLE IF NOT EXISTS roll_label_sizes (
  id TEXT PRIMARY KEY,
  printer_type TEXT NOT NULL, -- 'dymo-450', 'brother-pt', 'zebra', 'escpos'
  name TEXT NOT NULL,
  width_inches REAL NOT NULL,
  height_inches REAL NOT NULL,
  is_continuous INTEGER DEFAULT 0, -- Boolean: continuous feed vs fixed size
  manufacturer_code TEXT, -- e.g., "30252" for Dymo, "DK-1201" for Brother
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_roll_label_sizes_printer ON roll_label_sizes(printer_type);
```

### Extended Table: page_layout_templates

```sql
-- Add columns
ALTER TABLE page_layout_templates ADD COLUMN printer_compatibility TEXT DEFAULT '["avery-sheet"]';
-- JSON array: ["avery-sheet", "dymo-450", "brother-pt", "zebra", "escpos"]

ALTER TABLE page_layout_templates ADD COLUMN target_label_size_id TEXT;
-- FK to roll_label_sizes (null for Avery sheets)

ALTER TABLE page_layout_templates ADD COLUMN auto_scale INTEGER DEFAULT 1;
-- Boolean: allow auto-scaling to different label sizes
```

### Standard Label Sizes (Sample)

**Dymo LabelWriter (30+ sizes)**:

- Address (1-1/8" × 3-1/2") - Code 30252
- Large Address (1-4/10" × 3-1/2") - Code 30321
- Shipping (2-5/16" × 4") - Code 30256
- Large Shipping (4" × 6") - Code 1744907
- Name Badge (2-1/4" × 4") - Code 30857
- Continuous (2-1/4" wide) - Code 30270
- File Folder (9/16" × 3-7/16") - Code 30277
- Barcode (3/4" × 2-1/2") - Code 30347
- Return Address (3/4" × 2") - Code 30330
- Multi-Purpose (1" × 2-1/8") - Code 30336
- (20+ more sizes...)

**Brother P-Touch (30+ sizes)**:

- Standard Address (1-1/7" × 3-1/2") - DK-1201
- Shipping (2-4/9" × 4") - DK-1202
- File Folder (2/3" × 3-7/15") - DK-1203
- Continuous (2-4/9" wide) - DK-2205
- Name Badge (2-3/7" × 3-1/2") - DK-1209
- (25+ more sizes...)

**Zebra (30+ sizes)**:

- Shipping (4" × 6")
- Address (2" × 4")
- Product Label (3" × 2")
- Barcode (2" × 1")
- Continuous (4" wide)
- (25+ more sizes...)

**ESC/POS Generic (15-20 sizes)**:

- 58mm Receipt (2.283" wide)
- 80mm Receipt (3.15" wide)
- Label 2" × 1"
- Label 4" × 2"
- Label 4" × 6"
- (10+ more sizes...)

---

## Unified Template System

### Auto-Scaling Logic

**Challenge**: One label template should work for both Avery sheets (e.g., 2.625" × 1") and roll printers (e.g., Dymo 3.5" × 1.125") without manual redesign.

**Solution**: Proportional scaling with grid recalculation

```typescript
// src/main/utils/labelScaler.ts
function scaleTemplateToSize(
  template: PageLayoutTemplate,
  elements: LayoutElement[],
  targetSize: LabelSize,
): { scaledTemplate: PageLayoutTemplate; scaledElements: LayoutElement[] } {
  const scaleX = targetSize.widthPixels / template.page_width;
  const scaleY = targetSize.heightPixels / template.page_height;

  // Scale template dimensions
  const scaledTemplate = {
    ...template,
    page_width: targetSize.widthPixels,
    page_height: targetSize.heightPixels,
    grid_columns: Math.round(template.grid_columns * scaleX),
    grid_rows: Math.round(template.grid_rows * scaleY),
  };

  // Scale elements (grid positions scale proportionally)
  const scaledElements = elements.map((el) => ({
    ...el,
    grid_column: Math.round(el.grid_column * scaleX),
    grid_row: Math.round(el.grid_row * scaleY),
    column_span: Math.round(el.column_span * scaleX),
    row_span: Math.round(el.row_span * scaleY),
    style: scaleStyle(el.style, scaleX, scaleY), // Scale font sizes, etc.
  }));

  return { scaledTemplate, scaledElements };
}
```

**User Experience**:

1. User designs label template using Avery 5160 as base
2. User marks template as "Compatible with: Dymo, Brother, Zebra"
3. When printing to Dymo 30252, template auto-scales from 2.625"×1" → 3.5"×1.125"
4. Layout proportions preserved, fonts scaled appropriately
5. User sees preview before printing to verify

---

## Rendering Implementation

### Text Rendering

```typescript
// src/main/printing/renderers/textRenderer.ts
function renderTextElement(
  element: LayoutElement,
  cellWidth: number,
  cellHeight: number,
  printerType: PrinterType,
): TextCommand {
  // Calculate absolute position from grid
  const x = element.grid_column * cellWidth;
  const y = element.grid_row * cellHeight;
  const width = element.column_span * cellWidth;
  const height = element.row_span * cellHeight;

  // Parse style
  const style = JSON.parse(element.style);
  const fontSize = style.fontSize || 12;
  const fontFamily = style.fontFamily || 'Arial';
  const fontWeight = style.fontWeight || 'normal';
  const textAlign = style.textAlign || 'left';

  // Map to printer-specific font sizes
  const printerFontSize = mapFontSize(fontSize, printerType);

  return {
    type: 'text',
    x,
    y,
    width,
    height,
    content: element.config.content,
    fontSize: printerFontSize,
    fontFamily,
    bold: fontWeight === 'bold',
    align: textAlign,
  };
}
```

### ZPL Generator (Zebra)

```typescript
// src/main/printing/generators/zplGenerator.ts
export function generateZPL(
  commands: PrintCommand[],
  labelWidth: number,
  labelHeight: number,
): string {
  let zpl = '^XA\n'; // Start label format

  // Set label dimensions (203 DPI for ZD420)
  const widthDots = Math.round((labelWidth * 203) / 72);
  const heightDots = Math.round((labelHeight * 203) / 72);
  zpl += `^PW${widthDots}\n`; // Print width
  zpl += `^LL${heightDots}\n`; // Label length

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'text':
        const xDots = Math.round((cmd.x * 203) / 72);
        const yDots = Math.round((cmd.y * 203) / 72);
        zpl += `^FO${xDots},${yDots}\n`; // Field origin
        zpl += `^A0N,${cmd.fontSize * 2}\n`; // Font
        zpl += `^FD${cmd.content}^FS\n`; // Field data
        break;

      case 'rectangle':
        const x = Math.round((cmd.x * 203) / 72);
        const y = Math.round((cmd.y * 203) / 72);
        const w = Math.round((cmd.width * 203) / 72);
        const h = Math.round((cmd.height * 203) / 72);
        zpl += `^FO${x},${y}\n`;
        zpl += `^GB${w},${h},${cmd.thickness},${cmd.fill ? 'B' : 'W'}^FS\n`;
        break;

      case 'barcode':
        const bx = Math.round((cmd.x * 203) / 72);
        const by = Math.round((cmd.y * 203) / 72);
        const bh = Math.round((cmd.height * 203) / 72);
        zpl += `^FO${bx},${by}\n`;
        if (cmd.barcodeType === 'code128') {
          zpl += `^BC,${bh},Y,N,N\n`; // Code 128
          zpl += `^FD${cmd.data}^FS\n`;
        } else if (cmd.barcodeType === 'qr') {
          zpl += `^BQN,2,10\n`; // QR code
          zpl += `^FD${cmd.data}^FS\n`;
        }
        break;
    }
  }

  zpl += '^XZ\n'; // End label format
  return zpl;
}
```

---

## UI Components

### Printer Selection

**Component**: `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/PrinterSelector.tsx`

**Features**:

- Dropdown with printer types (Avery Sheet, Dymo, Brother, Zebra, ESC/POS)
- Auto-detect available printers when type selected
- Show printer status (ready/offline/low paper)
- Refresh button to re-scan for printers

### Size Selection

**Component**: `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/LabelSizeSelector.tsx`

**Features**:

- Filtered list of sizes based on selected printer type
- Shows dimensions and manufacturer code
- Preview of label proportions
- Search/filter functionality

### Printer Settings

**Component**: `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/PrinterSettings.tsx`

**Features**:

- Print darkness (0-30, common to all roll printers)
- Print speed (slow/medium/fast for Zebra)
- Print quality (draft/standard/high for Brother)
- Label rotation (0°/90°/180°/270°)
- Settings persist per printer

### Roll Label Preview

**Component**: `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/RollLabelPreview.tsx`

**Features**:

- Realistic preview of roll label
- Shows scaled dimensions
- Preview with actual fixture data
- "What you see is what you get" accuracy

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Architecture without breaking existing functionality

**Tasks**:

1. Create database migration (005_add_roll_label_support.ts)
2. Create roll_label_sizes table
3. Extend page_layout_templates table (printer_compatibility, target_label_size_id, auto_scale)
4. Seed 100+ label sizes for all printer types
5. Create IPrinterDriver interface
6. Create printerDriverManager.ts stub
7. Add printer detection IPC endpoint
8. Write database query tests
9. Verify all existing tests still pass

**Deliverable**: Database schema extended, no breaking changes, tests green

**Critical Files**:

- `/Users/joshkarp/showstack/src/main/database/migrations/005_add_roll_label_support.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/database/seeds/rollLabelSizes.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/printing/drivers/IPrinterDriver.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/database/schema.ts` (MODIFY)

---

### Phase 2: Dymo Support (Week 3-4)

**Goal**: First working roll printer (most common)

**Tasks**:

1. Install `@dymo/dymo-connect-framework` or `dymo-sdk`
2. Implement DymoDriver class (detect, connect, render, print)
3. Implement dymoGenerator.ts (generate Dymo XML)
4. Implement rollLabelRenderer.ts (grid → absolute positions → commands)
5. Update IPC handler to route Dymo jobs
6. Build PrinterSelector UI component
7. Build LabelSizeSelector UI (Dymo sizes only)
8. Add Dymo to printer dropdown in LabelDesigner
9. Write unit tests (DymoDriver, dymoGenerator, rendering)
10. Write integration test (end-to-end Dymo printing)
11. Manual test with physical Dymo LabelWriter

**Deliverable**: Dymo printing works end-to-end

**Critical Files**:

- `/Users/joshkarp/showstack/src/main/printing/drivers/dymoDriver.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/printing/generators/dymoGenerator.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/printing/renderers/rollLabelRenderer.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/ipc/labelPrinter.ts` (MODIFY - add routing logic)
- `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/PrinterSelector.tsx` (NEW)
- `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/LabelSizeSelector.tsx` (NEW)

---

### Phase 3: Brother P-Touch Support (Week 5)

**Goal**: Second printer type, validate abstraction

**Tasks**:

1. Install `brother-label-printer` or USB library
2. Implement BrotherDriver class
3. Implement brotherGenerator.ts
4. Add Brother sizes to LabelSizeSelector
5. Add Brother to printer dropdown
6. Write unit tests
7. Integration test
8. Manual test with Brother P-Touch

**Deliverable**: Brother printing works

**Critical Files**:

- `/Users/joshkarp/showstack/src/main/printing/drivers/brotherDriver.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/printing/generators/brotherGenerator.ts` (NEW)

---

### Phase 4: Zebra Support (Week 6)

**Goal**: Industrial printer with ZPL, barcode support

**Tasks**:

1. Install Zebra library (`zebra-browser-print-wrapper` or `zpl-printer`)
2. Implement ZebraDriver class
3. Implement zplGenerator.ts (ZPL command generation)
4. Add Zebra sizes to selector
5. Add barcode element type to designer
6. Implement barcode rendering (Code 128, QR)
7. Write tests
8. Manual test with Zebra ZD420

**Deliverable**: Zebra printing with barcodes works

**Critical Files**:

- `/Users/joshkarp/showstack/src/main/printing/drivers/zebraDriver.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/printing/generators/zplGenerator.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/printing/renderers/barcodeRenderer.ts` (NEW)

---

### Phase 5: ESC/POS Support (Week 7)

**Goal**: Generic thermal printer support

**Tasks**:

1. Install `escpos` + `escpos-usb`
2. Implement EscposDriver class
3. Implement escposGenerator.ts
4. Add generic sizes
5. Write tests
6. Manual test with ESC/POS printer

**Deliverable**: ESC/POS printing works

**Critical Files**:

- `/Users/joshkarp/showstack/src/main/printing/drivers/escposDriver.ts` (NEW)
- `/Users/joshkarp/showstack/src/main/printing/generators/escposGenerator.ts` (NEW)

---

### Phase 6: Template Auto-Scaling (Week 8)

**Goal**: Unified templates across printers

**Tasks**:

1. Implement labelScaler.ts (proportional scaling)
2. Add "Compatible Printers" UI to template save dialog
3. Add "Auto-scale" toggle
4. Update template loading to scale when needed
5. Write scaling unit tests
6. Write integration tests (design on Avery, print on Dymo)
7. Manual test: verify layout preserved after scaling

**Deliverable**: One template works across multiple printers

**Critical Files**:

- `/Users/joshkarp/showstack/src/main/utils/labelScaler.ts` (NEW)
- `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/LabelLayoutDesigner.tsx` (MODIFY)

---

### Phase 7: Advanced Features (Week 9-10)

**Goal**: Polish and production readiness

**Tasks**:

1. Implement PrinterSettings UI (darkness, speed, quality, rotation)
2. Add print queue management (queue, retry failed jobs)
3. Add printer status tracking (online/offline/low paper)
4. Implement error recovery
5. Add RollLabelPreview component
6. Optimize performance (connection pooling, caching)
7. Add telemetry for printer usage
8. Comprehensive testing (all printers, all scenarios)

**Deliverable**: Production-ready roll printing

**Critical Files**:

- `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/PrinterSettings.tsx` (NEW)
- `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/RollLabelPreview.tsx` (NEW)

---

### Phase 8: Documentation (Week 11)

**Goal**: User and developer docs

**Tasks**:

1. Update user guide with roll printer setup
2. Create video tutorials (setup each printer)
3. Write developer docs (adding new printer types)
4. Create troubleshooting guide
5. Update TESTING_GUIDE.md with printer tests
6. Create ROLL_LABEL_ARCHITECTURE.md

**Deliverable**: Complete documentation

---

## Testing Strategy

Following TESTING_GUIDE.md patterns (Vitest + React Testing Library).

### Unit Tests (Target: 70%+ for new code)

**Test File**: `/Users/joshkarp/showstack/src/main/printing/__tests__/zplGenerator.test.ts`

```typescript
describe('ZPL Generator', () => {
  it('should generate ZPL for simple text', () => {
    const commands = [{ type: 'text', x: 10, y: 10, content: 'Hello', fontSize: 12 }];
    const zpl = generateZPL(commands, 288, 144);
    expect(zpl).toContain('^XA'); // Start
    expect(zpl).toContain('^FDHello^FS'); // Data
    expect(zpl).toContain('^XZ'); // End
  });

  it('should generate Code 128 barcode', () => {
    const commands = [{ type: 'barcode', x: 10, y: 10, barcodeType: 'code128', data: '12345' }];
    const zpl = generateZPL(commands, 288, 144);
    expect(zpl).toContain('^BC'); // Code 128
    expect(zpl).toContain('^FD12345^FS');
  });
});
```

**Test File**: `/Users/joshkarp/showstack/src/main/printing/__tests__/labelScaler.test.ts`

```typescript
describe('Label Scaler', () => {
  it('should scale Avery 5160 to Dymo 30252', () => {
    const template = { page_width: 189, page_height: 72, grid_columns: 11, grid_rows: 4 };
    const targetSize = { widthPixels: 252, heightPixels: 81 };
    const { scaledTemplate } = scaleTemplateToSize(template, [], targetSize);
    expect(scaledTemplate.page_width).toBe(252);
    expect(scaledTemplate.page_height).toBe(81);
  });
});
```

### Mock Printer Tests

**Test File**: `/Users/joshkarp/showstack/src/main/printing/__tests__/dymoDriver.test.ts`

```typescript
vi.mock('@dymo/dymo-connect-framework');

describe('Dymo Driver', () => {
  it('should detect connected Dymo printers', async () => {
    vi.mocked(dymo.getPrinters).mockResolvedValue([
      { name: 'DYMO LabelWriter 450', isConnected: true },
    ]);

    const driver = new DymoDriver();
    const printers = await driver.detect();

    expect(printers).toHaveLength(1);
    expect(printers[0].status).toBe('ready');
  });
});
```

### Integration Tests

**Test File**: `/Users/joshkarp/showstack/src/main/printing/__tests__/labelPrinter.integration.test.ts`

```typescript
describe('Label Printer Integration', () => {
  it('should maintain Avery sheet printing (regression test)', async () => {
    const pdfPath = await printLabelBatch(null, 'template-5160', [mockData], '5160');
    expect(pdfPath).toMatch(/\.pdf$/);
    expect(fs.existsSync(pdfPath)).toBe(true);
  });

  it('should print Dymo roll labels', async () => {
    const result = await printLabelBatch(null, 'template-dymo', [mockData], 'dymo-450');
    expect(result.status).toBe('success');
  });
});
```

### Manual Test Plan

**For Each Printer Type**:

1. Print single label
2. Print batch of 10 labels
3. Verify text readability
4. Verify graphics render correctly
5. Test barcode scanning (if applicable)
6. Test different darkness/speed settings
7. Test with scaled template (from Avery)

---

## Technical Considerations

### Node Module Compatibility

**Electron**: v39.2.1 with built-in Node.js v20+

**Driver Libraries**:

- `@dymo/dymo-connect-framework` - Official Dymo SDK (Electron compatible)
- `brother-label-printer` - Brother support
- `zebra-browser-print-wrapper` - Zebra ZPL
- `escpos` + `escpos-usb` - Generic thermal
- `node-usb` - Generic USB device access

**Lazy Loading**:

```typescript
// Only load driver when printer type selected
export async function loadDriver(printerType: PrinterType): Promise<IPrinterDriver | null> {
  try {
    switch (printerType) {
      case 'dymo-450':
        const { DymoDriver } = await import('./drivers/dymoDriver');
        return new DymoDriver();
      // ... other drivers
    }
  } catch (error) {
    console.error(`Failed to load ${printerType} driver:`, error);
    return null; // Graceful fallback
  }
}
```

### Cross-Platform Support

**macOS**: CUPS integration, no special permissions
**Windows**: Windows driver API, may need libusb driver
**Linux**: CUPS integration, udev rules for USB permissions

### Driver Installation Requirements

**User Setup**:

- **Dymo**: Install Dymo Label Software (provides USB drivers)
- **Brother**: Install Brother P-Touch Editor
- **Zebra**: Install Zebra Designer
- **ESC/POS**: Generic USB thermal printer (no special drivers)

**Fallback**:

```typescript
if (!driver) {
  throw new Error(`
    ${printerType} driver not available.

    Please install required drivers:
    - Dymo: Install Dymo Label Software
    - Brother: Install Brother P-Touch Editor
    - Zebra: Install Zebra Designer

    See https://showstack.app/docs/label-printing for details.
  `);
}
```

### Performance

**Print Speed**:

- Avery sheets: 10-30 seconds (Puppeteer PDF generation)
- Roll printers: 0.5-2 seconds per label (native commands)
- Batch: 50-100 labels/minute

**Optimizations**:

- Connection pooling (reuse printer connections)
- Parallel rendering (generate commands for multiple labels simultaneously)
- Lazy driver loading
- Cache font metrics and label sizes

---

## Success Criteria

### Phase 1 (Foundation):

- ✅ Database migration runs successfully
- ✅ 100+ label sizes seeded
- ✅ All existing tests pass
- ✅ Zero breaking changes to Avery printing

### Phase 2 (Dymo):

- ✅ Dymo printers auto-detected
- ✅ Single label prints correctly
- ✅ Batch of 10 labels prints correctly
- ✅ Text, shapes, images render correctly
- ✅ Unit test coverage >70% for Dymo code

### Phases 3-5 (Other Printers):

- ✅ Each printer meets same criteria as Dymo
- ✅ Cross-printer compatibility verified

### Phase 6 (Auto-Scaling):

- ✅ Avery template scales correctly to Dymo/Brother/Zebra
- ✅ Layout proportions preserved
- ✅ User can mark template as multi-printer compatible

### Phase 7 (Polish):

- ✅ Error handling comprehensive
- ✅ Status indicators functional
- ✅ Settings persist
- ✅ Performance <2s per label

### Phase 8 (Documentation):

- ✅ User guide complete
- ✅ Developer docs complete
- ✅ Video tutorials published

### Overall:

- ✅ 4 printer types functional (Dymo, Brother, Zebra, ESC/POS)
- ✅ 100% backward compatibility with Avery sheets
- ✅ Test coverage >50% global, >70% for new printer code
- ✅ Zero critical bugs
- ✅ Positive beta user feedback

---

## Critical Files Summary

### Must Create (New Files):

1. `/Users/joshkarp/showstack/src/main/database/migrations/005_add_roll_label_support.ts` - Database migration
2. `/Users/joshkarp/showstack/src/main/database/seeds/rollLabelSizes.ts` - 100+ label sizes
3. `/Users/joshkarp/showstack/src/main/printing/drivers/IPrinterDriver.ts` - Driver interface
4. `/Users/joshkarp/showstack/src/main/printing/drivers/dymoDriver.ts` - Dymo implementation
5. `/Users/joshkarp/showstack/src/main/printing/generators/zplGenerator.ts` - ZPL for Zebra
6. `/Users/joshkarp/showstack/src/main/printing/renderers/rollLabelRenderer.ts` - Grid→commands converter
7. `/Users/joshkarp/showstack/src/main/utils/labelScaler.ts` - Auto-scaling logic
8. `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/PrinterSelector.tsx` - Printer selection UI
9. `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/LabelSizeSelector.tsx` - Size selection UI
10. `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/PrinterSettings.tsx` - Printer settings UI

### Must Modify (Existing Files):

1. `/Users/joshkarp/showstack/src/main/ipc/labelPrinter.ts` - Add routing logic (Avery vs Roll)
2. `/Users/joshkarp/showstack/src/main/database/schema.ts` - Extend tables
3. `/Users/joshkarp/showstack/src/renderer/src/components/prep/label/LabelLayoutDesigner.tsx` - Add printer/size selection
4. `/Users/joshkarp/showstack/package.json` - Add printer driver dependencies

### Reference (Existing Patterns):

1. `/Users/joshkarp/showstack/src/main/utils/labelSheetRenderer.ts` - Current rendering pattern
2. `/Users/joshkarp/showstack/src/renderer/src/utils/prep/labelDataMapper.ts` - Data mapping (40+ fields)
3. `/Users/joshkarp/showstack/docs/testing/TESTING_GUIDE.md` - Testing patterns

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@dymo/dymo-connect-framework": "^3.1.0",
    "brother-label-printer": "^1.2.0",
    "zebra-browser-print-wrapper": "^2.0.0",
    "escpos": "^3.0.0",
    "escpos-usb": "^3.0.0",
    "node-usb": "^2.0.0"
  }
}
```

---

## Risk Mitigation

**High-Risk Areas**:

1. **Driver Compatibility**: Test early with physical printers, fallback to generic
2. **Cross-Platform USB**: Clear setup instructions, graceful errors
3. **Template Scaling Quality**: Extensive preview testing, manual override option
4. **Breaking Changes**: Separate code paths, comprehensive regression tests
5. **Performance**: Lazy load drivers, benchmark startup time

**Testing Checkpoints**:

- After each phase: Full regression test suite
- Before merge: Test on macOS, Windows, Linux
- Manual testing with actual printers (minimum Dymo + one other)
- User acceptance testing with beta users

---

**END OF IMPLEMENTATION PLAN**

**Estimated Effort**: 11 weeks (1 developer)
**Risk Level**: Medium (requires hardware testing)
**Backward Compatibility**: 100% maintained
