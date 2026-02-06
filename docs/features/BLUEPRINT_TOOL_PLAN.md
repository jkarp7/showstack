# Blueprint Tool Implementation Plan

**OmniGraffle Parity for ShowStack:Lighting - Best-in-Class Technical Drawing Module**

## Executive Summary

Implement a professional-grade Blueprint tool for creating rack elevation drawings and system diagrams that **exceeds** OmniGraffle capabilities. This tool will leverage 80% of the existing LayoutCanvas infrastructure from the Label Designer while adding specialized technical drawing features: U-space rack calculations, smart cable routing, equipment symbol libraries with infrastructure integration, layer management, and multi-format export.

**Scope**: Both rack elevations and system drawings in parallel, with best-in-class features including layer management, multiple export formats (PDF/SVG/PNG), smart guides, and advanced styling.

**Testing Approach**: TDD for critical utilities (rack calculations, routing algorithms), followed by comprehensive component and integration tests per TESTING_GUIDE.md patterns.

---

## Architecture Overview

### Foundation: Reuse Existing Infrastructure

**Leverage from Label Designer (~80% reuse)**:

- Grid-based canvas system: `/Users/joshkarp/showstack/src/renderer/src/components/prep/layout/LayoutCanvas.tsx`
- Zoom/pan controls (50-200%)
- Snap guides and grid alignment
- Drag-and-drop framework
- Element inspector pattern
- SQLite storage (page_layout_templates, page_layout_elements tables)
- Puppeteer-based PDF export pipeline

**New Blueprint-Specific (~20%)**:

- Technical drawing elements (racks, equipment symbols, cables, ports, measurements)
- Smart connection routing (orthogonal, Bezier, obstacle avoidance)
- Equipment library with infrastructure integration
- Layer management system
- Multi-format export (SVG, PNG, DXF)
- Advanced styling and measurement tools

### Component Architecture

```
src/renderer/src/components/production/blueprint/
├── BlueprintDesigner.tsx              # Main orchestrator (extends LayoutDesigner pattern)
├── BlueprintCanvas.tsx                # Canvas with technical drawing features
├── BlueprintToolbar.tsx               # Drawing tools (select, rack, equipment, cable, measure)
├── BlueprintLayerPanel.tsx            # Layer management (show/hide/lock/reorder)
├── SymbolLibrary.tsx                  # Equipment symbol palette with infrastructure integration
├── elements/                          # Drawing elements
│   ├── RackElevation.tsx              # 19" rack with U-space ruler
│   ├── EquipmentSymbol.tsx            # Network/lighting/audio equipment
│   ├── Cable.tsx                      # Connection with routing
│   ├── Connector.tsx                  # Port/connector representation
│   ├── MeasurementLine.tsx            # Dimension annotations
│   ├── Callout.tsx                    # Text annotation with leader
│   └── EquipmentGroup.tsx             # Grouped equipment
├── tools/                             # Drawing tools
│   ├── SelectTool.tsx                 # Selection/move/resize
│   ├── RackDrawingTool.tsx            # Rack creation
│   ├── CableRoutingTool.tsx           # Smart cable routing
│   ├── PortConnectionTool.tsx         # Port-to-port connections
│   └── MeasurementTool.tsx            # Dimension lines
├── inspectors/                        # Property panels
│   ├── RackInspector.tsx              # Rack properties (U-count, type)
│   ├── EquipmentInspector.tsx         # Equipment properties (ports, dimensions)
│   ├── CableInspector.tsx             # Cable properties (type, routing, color)
│   └── LayerInspector.tsx             # Layer properties (name, visibility, lock)
└── utils/                             # Business logic
    ├── rackCalculations.ts            # U-space conversions, collision detection
    ├── cableRouting.ts                # Routing algorithms (orthogonal, Bezier, A*)
    ├── portMapping.ts                 # Port connection validation
    ├── symbolLibrary.ts               # Equipment symbol definitions
    └── exportFormats.ts               # SVG/PNG/DXF export utilities
```

### Type Definitions

**New file**: `/Users/joshkarp/showstack/src/renderer/src/types/blueprint.ts`

Key types to define:

- `BlueprintElementType` (rack_elevation, equipment_symbol, cable, connector, measurement_line, callout, equipment_group)
- `RackElevationConfig` (rackUnits, showRuler, equipment[], mountingType)
- `EquipmentSymbolConfig` (equipmentId, symbolType, ports[], dimensions)
- `CableConfig` (cableType, routingPoints[], startPort, endPort, strokeStyle)
- `PortDefinition` (id, number, type, position, connectedTo)
- `LayerConfig` (name, visible, locked, opacity, zIndex)

**Extend existing**: `/Users/joshkarp/showstack/src/renderer/src/types/prep.ts`

- Add blueprint element types to `LayoutElementType` union
- Extend element config interfaces

---

## Core Features

### 1. Rack Elevation Drawings

**Features**:

- ✅ 19" rack component with configurable U-space (1U-56U, typical 42U)
- ✅ Visual U-space ruler with measurements (1U = 1.75")
- ✅ Equipment mounting with U-position and U-height
- ✅ Front/rear/both depth mounting support
- ✅ Collision detection for overlapping U-space
- ✅ Snap-to-U-space boundaries
- ✅ Equipment auto-sizing (1U, 2U, 3U, 4U standard heights)
- ✅ Port representation on equipment faces
- ✅ Integration with infrastructure_equipment table

**Technical Requirements**:

- U-space calculations: 1U = 1.75" = 44.45mm
- Precision: Snap to 0.5U increments for fractional mounting
- Visual feedback: Highlight available U-space, show collisions in red
- Equipment library: Pull from infrastructure table, categorize by type

### 2. System Drawings

**Features**:

- ✅ Free-form equipment symbol placement
- ✅ Equipment symbol library (network switches, consoles, processors, dimmers, fixtures, PDUs)
- ✅ Port-to-port cable routing
- ✅ Smart cable routing (orthogonal, Bezier curve, manual waypoints)
- ✅ Cable type styling (Ethernet=blue, DMX=purple, Power=red, Audio=green)
- ✅ Connection labels and annotations
- ✅ Signal flow indicators (arrows)
- ✅ Measurement lines with dimensions
- ✅ Text callouts with leader lines

**Cable Routing Algorithms**:

1. **Orthogonal Routing**: Right-angle connections (professional diagrams)
2. **Bezier Curves**: Smooth curved connections (aesthetic)
3. **Manual Waypoints**: User-defined routing points
4. **Obstacle Avoidance**: A\* pathfinding around equipment (advanced)

### 3. Equipment Symbol Library

**Integration with Infrastructure**:

```typescript
// Auto-populate from infrastructure_equipment table
async function loadEquipmentLibrary(projectId: string) {
  const equipment = await window.api.infrastructure.getAll(projectId);

  // Categorize equipment
  const library = {
    network: equipment.filter((eq) => eq.category === 'network'),
    lighting: equipment.filter((eq) => eq.category === 'lighting'),
    audio: equipment.filter((eq) => eq.category === 'audio'),
    power: equipment.filter((eq) => eq.category === 'power'),
    video: equipment.filter((eq) => eq.category === 'video'),
  };

  // Generate symbols with port definitions
  return library;
}
```

**Pre-built Symbols** (20+ standard types):

- Network: Switches (8/16/24/48 port), routers, WiFi APs
- Lighting: Consoles, processors, gateways, fixtures
- Audio: Consoles, processors, speakers
- Power: PDUs, UPS units, distribution panels
- Custom: User-uploadable SVG symbols

---

## Best-in-Class Features

### 1. Layer Management System

**Features**:

- ✅ Multiple layers per drawing (unlimited)
- ✅ Layer visibility toggle (show/hide)
- ✅ Layer locking (prevent editing)
- ✅ Layer opacity control (0-100%)
- ✅ Layer reordering (z-index management)
- ✅ Layer naming and color coding
- ✅ Typical layers: Background, Equipment, Cables, Annotations, Measurements

**UI Component**: `BlueprintLayerPanel.tsx`

- Sidebar panel showing layer list
- Drag-to-reorder layers
- Eye icon for visibility
- Lock icon for edit protection
- Opacity slider per layer

### 2. Multi-Format Export

**Export Formats**:

1. **PDF** (via Puppeteer) - 300 DPI, vector-preserved, print-ready
2. **SVG** - Native vector format, fully editable in Illustrator/Inkscape
3. **PNG** - High-resolution raster (1x, 2x, 3x scaling for presentations)
4. **DXF** (Phase 2) - CAD integration for AutoCAD/Rhino

**Export Options**:

- Page sizes: Letter, Tabloid, A3, A2, A1, A0 (engineering sizes)
- Resolution: 72 DPI (screen), 150 DPI (web), 300 DPI (print), 600 DPI (high-quality)
- Color modes: RGB (screen), CMYK (print), Grayscale
- Include: Layers (all/visible only), Grid (on/off), Margins

**Implementation**: `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/exportFormats.ts`

### 3. Smart Guides and Snapping

**Features**:

- ✅ Grid snapping (configurable grid spacing)
- ✅ Element snapping (align to other element edges)
- ✅ Smart guides (show when aligned with other elements)
- ✅ Port snapping (snap cables to port connection points)
- ✅ U-space snapping (rack elevations snap to U boundaries)
- ✅ Dimension snapping (round to nearest inch/cm)
- ✅ Angle snapping (0°, 45°, 90° for orthogonal lines)

**Visual Feedback**:

- Magenta guide lines when aligned horizontally/vertically
- Blue snap indicators at connection points
- Distance measurements while dragging

### 4. Advanced Styling

**Element-Level Styling**:

- Typography: 50+ fonts, size, weight, style, alignment
- Colors: Full color picker, hex/RGB/HSL, opacity
- Borders: Width, style (solid/dashed/dotted), color, radius
- Shadows: Drop shadow with offset, blur, spread
- Gradients: Linear/radial gradients for backgrounds
- Patterns: Hatching, cross-hatching for fills

**Symbol Customization**:

- Custom colors per symbol instance
- Scaling without quality loss (vector)
- Rotation in 1° increments
- Flip horizontal/vertical
- Custom port configurations

**Cable Styling**:

- Stroke width (1-10px)
- Stroke style (solid/dashed/dotted/double)
- Stroke color with opacity
- Arrow heads (none/start/end/both)
- Cable label styling (font, size, position)

### 5. Professional Drawing Tools

**Measurement Tools**:

- Dimension lines with auto-calculated distances
- Units: pixels, inches, centimeters, U-space
- Label positioning (above/below/center)
- Extension lines (standard engineering style)

**Annotation Tools**:

- Text callouts with leader lines
- Leader styles: straight, elbow (90°), curved (Bezier)
- Arrow/dot/none termination
- Auto-positioning to avoid overlaps

**Title Blocks**:

- Standard engineering title block templates
- Project info integration (name, date, revision)
- Scale indicator (1:1, 1:2, custom)
- Drawing number and sheet count

---

## Implementation Phases

### Phase 1: Foundation & Rack Elevations (Week 1-2)

**Goal**: Establish blueprint infrastructure and implement rack elevation drawings with TDD

**Tasks**:

1. **Create type definitions** (TDD - write types first)
   - `/Users/joshkarp/showstack/src/renderer/src/types/blueprint.ts`
   - Extend `/Users/joshkarp/showstack/src/renderer/src/types/prep.ts`

2. **Implement rack calculation utilities** (TDD - test first!)
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/rackCalculations.ts`
   - Write tests: `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/__tests__/rackCalculations.test.ts`
   - Functions: `uSpaceToPixels()`, `pixelsToUSpace()`, `calculateRackCapacity()`, `detectUSpaceCollision()`
   - **Target**: 80%+ test coverage

3. **Create BlueprintDesigner component**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/BlueprintDesigner.tsx`
   - Pattern: Copy from `/Users/joshkarp/showstack/src/renderer/src/components/prep/layout/LayoutDesigner.tsx`
   - Add tool selection state (select, rack, equipment, cable, measure)
   - Add keyboard shortcuts (R=rack, E=equipment, C=cable, M=measure, Escape=select)

4. **Create BlueprintCanvas component**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/BlueprintCanvas.tsx`
   - Extend `/Users/joshkarp/showstack/src/renderer/src/components/prep/layout/LayoutCanvas.tsx`
   - Add snap-to-U-space for rack elements
   - Add port highlighting on hover

5. **Implement RackElevation element**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/elements/RackElevation.tsx`
   - Visual U-space ruler (1-42U typical)
   - Equipment mounting zones
   - Collision detection visualization
   - Write component tests

6. **Implement RackInspector**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/inspectors/RackInspector.tsx`
   - U-count configuration
   - Rack type (19", custom)
   - Show/hide ruler option

7. **Set up routing**
   - Update `/Users/joshkarp/showstack/src/renderer/src/pages/ModuleLanding.tsx` (set `isLocked: false` for Blueprint)
   - Create route: `/module/production/blueprint`

**Deliverable**: Functional rack elevation drawing with U-space measurements, equipment mounting, and collision detection.

---

### Phase 2: Equipment Library & Infrastructure Integration (Week 3)

**Goal**: Implement equipment symbol library with infrastructure table integration

**Tasks**:

1. **Create symbol library utility** (TDD for data fetching)
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/symbolLibrary.ts`
   - Functions: `loadEquipmentFromInfrastructure()`, `categorizeEquipment()`, `generateSymbolFromEquipment()`
   - Test infrastructure integration

2. **Implement SymbolLibrary component**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/SymbolLibrary.tsx`
   - Categories: Network, Lighting, Audio, Power, Video, Custom
   - Search and filter functionality
   - Drag-to-canvas functionality
   - Show equipment from infrastructure table

3. **Implement EquipmentSymbol element**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/elements/EquipmentSymbol.tsx`
   - SVG-based symbols (vector, scalable)
   - Port representations
   - Equipment labels
   - Custom symbol upload support

4. **Implement EquipmentInspector**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/inspectors/EquipmentInspector.tsx`
   - Equipment selection from library
   - Port configuration
   - Dimensions (width, height)
   - Rotation and scaling

5. **Create pre-built symbol library**
   - Design 20+ SVG symbols for common equipment
   - Store in `/Users/joshkarp/showstack/src/renderer/src/assets/symbols/`
   - Network switches (8/16/24/48 port)
   - Lighting consoles, processors
   - Audio equipment
   - Power distribution

**Deliverable**: Equipment symbol library with infrastructure integration, drag-and-drop placement, and 20+ pre-built symbols.

---

### Phase 3: Cable Routing & Port Connections (Week 4-5)

**Goal**: Implement smart cable routing with port-to-port connections

**Tasks**:

1. **Implement port mapping utilities** (TDD)
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/portMapping.ts`
   - Functions: `findPort()`, `calculatePortPosition()`, `validateConnection()`, `getCompatiblePorts()`
   - Test port type compatibility (Ethernet-to-Ethernet, DMX-to-DMX)
   - **Target**: 80%+ coverage

2. **Implement cable routing algorithms** (TDD)
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/cableRouting.ts`
   - Functions: `orthogonalRoute()`, `bezierRoute()`, `avoidObstacles()`, `optimizeWaypoints()`
   - Orthogonal routing (elbow connections)
   - Bezier curve routing (smooth)
   - Manual waypoint routing
   - Test routing algorithms with various scenarios
   - **Target**: 80%+ coverage

3. **Implement Cable element**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/elements/Cable.tsx`
   - SVG path rendering
   - Cable type styling (Ethernet=blue, DMX=purple, Power=red, Audio=green)
   - Waypoint handles for manual adjustment
   - Arrow heads and labels
   - Write component tests

4. **Implement Connector element**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/elements/Connector.tsx`
   - Port visualization on equipment
   - Hover highlighting
   - Connection indicators

5. **Implement CableRoutingTool**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/tools/CableRoutingTool.tsx`
   - Click port to start connection
   - Click second port to complete
   - Show valid connection targets
   - Real-time routing preview

6. **Implement CableInspector**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/inspectors/CableInspector.tsx`
   - Cable type selection
   - Routing style (orthogonal/Bezier/manual)
   - Stroke width and style
   - Color picker
   - Label text and position

**Deliverable**: Functional cable routing system with smart routing algorithms, port-to-port connections, and manual waypoint editing.

---

### Phase 4: Layer Management & Advanced Styling (Week 6)

**Goal**: Implement layer management system and advanced styling options

**Tasks**:

1. **Extend types for layers**
   - Add `LayerConfig` to blueprint types
   - Add `layerId` to all element configs
   - Default layers: Background, Equipment, Cables, Annotations, Measurements

2. **Implement layer management utilities**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/layerManagement.ts`
   - Functions: `createLayer()`, `deleteLayer()`, `reorderLayers()`, `toggleLayerVisibility()`, `toggleLayerLock()`

3. **Implement BlueprintLayerPanel component**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/BlueprintLayerPanel.tsx`
   - Layer list with drag-to-reorder
   - Visibility toggle (eye icon)
   - Lock toggle (lock icon)
   - Opacity slider per layer
   - Add/delete layers
   - Layer naming

4. **Update BlueprintCanvas for layer support**
   - Filter elements by visible layers
   - Prevent editing of locked layers
   - Apply layer opacity to elements

5. **Implement LayerInspector**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/inspectors/LayerInspector.tsx`
   - Layer name input
   - Color coding
   - Visibility, lock, opacity controls

6. **Implement advanced styling controls**
   - Extend ElementInspector with:
     - Full color picker (hex/RGB/HSL)
     - Gradient support (linear/radial)
     - Shadow controls (offset, blur, spread, color)
     - Pattern fills (hatching, cross-hatching)
   - Symbol-specific styling (rotation, flip, scale)

**Deliverable**: Layer management system with show/hide/lock/reorder, and advanced styling options exceeding OmniGraffle capabilities.

---

### Phase 5: Measurement & Annotation Tools (Week 7)

**Goal**: Implement professional measurement and annotation tools

**Tasks**:

1. **Implement MeasurementLine element**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/elements/MeasurementLine.tsx`
   - Dimension line rendering (extension lines, arrows, label)
   - Auto-calculation of distance
   - Unit conversion (px, in, cm, U)
   - Engineering-style formatting

2. **Implement Callout element**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/elements/Callout.tsx`
   - Text annotation with leader line
   - Leader styles: straight, elbow, curved
   - Arrow/dot/none termination
   - Auto-positioning to avoid overlaps

3. **Implement MeasurementTool**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/tools/MeasurementTool.tsx`
   - Click-drag to create measurement
   - Snap to element edges
   - Show real-time distance preview

4. **Implement CalloutTool**
   - Click to place callout anchor
   - Drag to position text box
   - Auto-generate leader line

5. **Implement title block system**
   - Standard engineering title block templates
   - Integration with project metadata
   - Scale indicator
   - Drawing number/sheet count
   - Revision tracking

**Deliverable**: Professional measurement and annotation tools with engineering-style formatting.

---

### Phase 6: Multi-Format Export & Polish (Week 8-9)

**Goal**: Implement best-in-class export system and UI polish

**Tasks**:

1. **Implement export format utilities**
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/exportFormats.ts`
   - `exportToPDF()` - Leverage existing Puppeteer pipeline
   - `exportToSVG()` - Native SVG generation
   - `exportToPNG()` - Canvas rendering at high resolution
   - `exportToDXF()` - CAD format (basic polylines/circles)

2. **Create export dialog**
   - Format selection (PDF/SVG/PNG/DXF)
   - Page size selection (Letter/Tabloid/A3/A2/A1/A0)
   - Resolution selection (72/150/300/600 DPI)
   - Color mode (RGB/CMYK/Grayscale)
   - Layer options (all/visible only)
   - Grid visibility toggle

3. **Implement PDF export with quality optimization**
   - Vector preservation for SVG elements
   - 300 DPI default for print quality
   - Font embedding
   - Color space conversion (RGB to CMYK)
   - Multi-page support for large drawings

4. **Implement SVG export**
   - Clean, standards-compliant SVG
   - Preserve layers as groups
   - Editable in Illustrator/Inkscape
   - Include metadata (author, creation date)

5. **Implement PNG export**
   - High-resolution raster (1x, 2x, 3x scaling)
   - Transparent background option
   - Anti-aliasing for smooth edges

6. **UI polish and optimization**
   - Keyboard shortcuts reference panel (Cmd+K)
   - Tool tooltips
   - Loading states for export
   - Performance optimization for 100+ elements:
     - Use React.memo for elements
     - Virtualize off-screen elements
     - Debounce cable re-routing
     - Use RequestAnimationFrame for smooth animations

7. **Implement smart guides**
   - Magenta guide lines when aligned
   - Blue snap indicators
   - Distance measurements while dragging

**Deliverable**: Multi-format export (PDF/SVG/PNG/DXF) with professional quality and polished UI.

---

### Phase 7: Testing & Production Readiness (Week 10-11)

**Goal**: Comprehensive testing and bug fixing per TESTING_GUIDE.md standards

**Testing Structure**:

```
src/renderer/src/components/production/blueprint/
├── utils/__tests__/
│   ├── rackCalculations.test.ts      (80%+ coverage)
│   ├── cableRouting.test.ts          (80%+ coverage)
│   ├── portMapping.test.ts           (80%+ coverage)
│   └── symbolLibrary.test.ts         (70%+ coverage)
├── elements/__tests__/
│   ├── RackElevation.test.tsx        (50-60% coverage)
│   ├── EquipmentSymbol.test.tsx      (50-60% coverage)
│   └── Cable.test.tsx                (50-60% coverage)
└── __tests__/
    ├── BlueprintDesigner.test.tsx    (50-60% coverage)
    └── BlueprintCanvas.test.tsx      (50-60% coverage)

src/main/ipc/__tests__/
└── blueprints.test.ts                (70%+ coverage)
    └── blueprints.security.test.ts   (Security tests)
```

**Tasks**:

1. **Unit Tests - Utilities** (TDD approach - already written during implementation)
   - `rackCalculations.test.ts`: U-space math, collision detection, capacity calculations
   - `cableRouting.test.ts`: Orthogonal routing, Bezier curves, obstacle avoidance
   - `portMapping.test.ts`: Port finding, position calculation, connection validation
   - `symbolLibrary.test.ts`: Equipment loading, categorization, symbol generation
   - **Target**: 80%+ coverage per TESTING_GUIDE.md

2. **Component Tests - Elements**
   - `RackElevation.test.tsx`: Render rack, U-count display, equipment placement, collision warnings
   - `EquipmentSymbol.test.tsx`: Symbol rendering, port display, custom symbols
   - `Cable.test.tsx`: Cable rendering, routing display, type styling
   - `MeasurementLine.test.tsx`: Dimension display, unit conversion
   - `Callout.test.tsx`: Leader line rendering, text display
   - Use `@testing-library/react` and `@testing-library/user-event`
   - **Target**: 50-60% coverage

3. **Component Tests - Main Components**
   - `BlueprintDesigner.test.tsx`: Tool selection, keyboard shortcuts, save/load
   - `BlueprintCanvas.test.tsx`: Element placement, drag-and-drop, snap guides
   - `SymbolLibrary.test.tsx`: Equipment filtering, search, drag initiation
   - `BlueprintLayerPanel.test.tsx`: Layer visibility, locking, reordering
   - **Target**: 50-60% coverage

4. **Integration Tests - IPC Handlers**
   - Create `/Users/joshkarp/showstack/src/main/ipc/blueprints.ts` IPC handler
   - Test file: `/Users/joshkarp/showstack/src/main/ipc/__tests__/blueprints.test.ts`
   - Tests:
     - `blueprint:save` - Save blueprint to database
     - `blueprint:load` - Load blueprint from database
     - `blueprint:exportPDF` - Generate PDF
     - `blueprint:exportSVG` - Generate SVG
     - `blueprint:exportPNG` - Generate PNG
   - Mock Node.js modules (fs, path, puppeteer)
   - **Target**: 70%+ coverage

5. **Security Tests**
   - Test file: `/Users/joshkarp/showstack/src/main/ipc/__tests__/blueprints.security.test.ts`
   - Tests:
     - Path traversal prevention (reject `../../../etc/passwd`)
     - Input sanitization (XSS in text content)
     - SVG upload validation (reject `<script>` tags)
     - File size limits
     - Export path validation
   - Follow patterns from `/Users/joshkarp/showstack/src/main/utils/__tests__/errorSanitizer.test.ts`

6. **Performance Tests**
   - Test with 100+ elements on canvas
   - Measure render time (<100ms interaction latency)
   - Test export time for complex drawings
   - Memory leak detection

7. **User Acceptance Testing**
   - Test with real rack elevation scenarios (42U rack, 20+ equipment items)
   - Test with real system diagram scenarios (network topology, power distribution)
   - Test export quality (300 DPI PDF, print quality)
   - Collect feedback and iterate

8. **Bug Fixes & Refinements**
   - Fix issues found in testing
   - Performance optimizations
   - Edge case handling
   - Error messaging improvements

**Test Commands**:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- rackCalculations

# Run in watch mode (development)
npm test -- --watch

# Run UI mode (visual)
npm run test:ui
```

**Coverage Requirements** (per TESTING_GUIDE.md):

- **Critical Utilities**: 80%+ (rackCalculations, cableRouting, portMapping)
- **Components**: 50-60% (RackElevation, EquipmentSymbol, Cable)
- **IPC Handlers**: 70%+ (blueprints.ts)
- **Security Tests**: 100% of security-critical code

**Deliverable**: Fully tested blueprint tool with comprehensive test coverage, security validation, and production-ready quality.

---

## Testing Strategy (TDD for Critical Utils)

### Test-First Development Workflow

**For Utilities (Phase 1, 2, 3)**:

1. **Write test first** - Define expected behavior
2. **Run test (red)** - Test fails (function doesn't exist yet)
3. **Implement function** - Write minimal code to pass test
4. **Run test (green)** - Test passes
5. **Refactor** - Improve code quality while tests stay green

**Example: rackCalculations.ts TDD**:

```typescript
// Step 1: Write test FIRST
// __tests__/rackCalculations.test.ts
describe('uSpaceToPixels', () => {
  it('should convert 1U to correct pixel height', () => {
    expect(uSpaceToPixels(1)).toBe(7); // 1U = 1.75" at 4px/inch
  });

  it('should handle fractional U-space', () => {
    expect(uSpaceToPixels(2.5)).toBe(17.5);
  });

  it('should handle zero', () => {
    expect(uSpaceToPixels(0)).toBe(0);
  });
});

// Step 2: Run test (fails - function doesn't exist)
// npm test -- rackCalculations

// Step 3: Implement function
// utils/rackCalculations.ts
export function uSpaceToPixels(uSpace: number): number {
  const U_SPACE_INCHES = 1.75;
  const PIXELS_PER_INCH = 4; // 96 DPI / 24 scale
  return uSpace * U_SPACE_INCHES * PIXELS_PER_INCH;
}

// Step 4: Run test (passes)
// Step 5: Refactor if needed
```

**For Components (Phase 1-6)**:

1. **Implement component** - Build UI and interactions
2. **Write tests after** - Focus on user interactions, not implementation
3. **Use React Testing Library** - Test like a user would use the component
4. **Follow AAA pattern** - Arrange, Act, Assert

**Example Component Test**:

```typescript
// RackElevation.test.tsx
import { render, screen } from '@testing-library/react';
import { RackElevation } from '../elements/RackElevation';

describe('RackElevation', () => {
  it('should render rack with correct U-count', () => {
    // Arrange
    const props = { rackUnits: 42, showRuler: true, equipment: [] };

    // Act
    render(<RackElevation {...props} />);

    // Assert
    expect(screen.getByText('42U')).toBeInTheDocument();
  });

  it('should detect U-space collision', () => {
    // Arrange
    const equipment = [
      { id: '1', name: 'Switch 1', uPosition: 10, uHeight: 2 },
      { id: '2', name: 'Switch 2', uPosition: 11, uHeight: 2 } // Overlaps!
    ];

    // Act
    render(<RackElevation rackUnits={42} showRuler={true} equipment={equipment} />);

    // Assert
    expect(screen.getByText(/collision/i)).toBeInTheDocument();
  });
});
```

### Testing Best Practices (from TESTING_GUIDE.md)

**DO**:

- ✅ Write tests before fixing bugs
- ✅ Use descriptive test names (`should detect collision when equipment overlaps`)
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Test one thing per test
- ✅ Mock external dependencies (electron, fs, puppeteer)
- ✅ Clean up after tests (`afterEach(() => vi.clearAllMocks())`)
- ✅ Test error boundaries
- ✅ Use real data structures

**DON'T**:

- ❌ Test implementation details
- ❌ Write flaky tests
- ❌ Skip error cases
- ❌ Over-mock (hides bugs)
- ❌ Ignore warnings
- ❌ Commit failing tests
- ❌ Test third-party libraries

---

## Critical Files

### Must Create (New Files)

1. **Type Definitions**:
   - `/Users/joshkarp/showstack/src/renderer/src/types/blueprint.ts` (NEW)
   - Purpose: All blueprint-specific types (RackElevationConfig, EquipmentSymbolConfig, CableConfig, etc.)

2. **Main Components**:
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/BlueprintDesigner.tsx` (NEW)
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/BlueprintCanvas.tsx` (NEW)
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/BlueprintLayerPanel.tsx` (NEW)

3. **Core Utilities** (TDD - Critical for accuracy):
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/rackCalculations.ts` (NEW)
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/cableRouting.ts` (NEW)
   - `/Users/joshkarp/showstack/src/renderer/src/components/production/blueprint/utils/portMapping.ts` (NEW)

4. **IPC Handler**:
   - `/Users/joshkarp/showstack/src/main/ipc/blueprints.ts` (NEW)
   - Purpose: Save/load blueprints, export PDF/SVG/PNG

### Must Modify (Existing Files)

1. **Type Extensions**:
   - `/Users/joshkarp/showstack/src/renderer/src/types/prep.ts` (MODIFY)
   - Add blueprint element types to `LayoutElementType` union
   - Line ~607: Extend element type definitions

2. **Database Schema**:
   - `/Users/joshkarp/showstack/src/main/database/appSchema.ts` (MODIFY)
   - Line ~72: Update `element_type` CHECK constraint to include blueprint types
   - Add: `'rack_elevation', 'equipment_symbol', 'cable', 'connector', 'measurement_line', 'callout', 'equipment_group'`

3. **Module Landing**:
   - `/Users/joshkarp/showstack/src/renderer/src/pages/ModuleLanding.tsx` (MODIFY)
   - Line 32: Change `isLocked: true` to `isLocked: false` for Blueprint tool
   - Enable routing to `/module/production/blueprint`

### Patterns to Follow

1. **LayoutCanvas Pattern**:
   - Source: `/Users/joshkarp/showstack/src/renderer/src/components/prep/layout/LayoutCanvas.tsx`
   - Reuse: Grid system, drag-and-drop, zoom, snap guides, element rendering

2. **Element Inspector Pattern**:
   - Source: `/Users/joshkarp/showstack/src/renderer/src/components/prep/layout/ElementInspector.tsx`
   - Pattern: Property panel with type-specific controls

3. **Export Pattern**:
   - Source: `/Users/joshkarp/showstack/src/main/ipc/paperwork.ts` (Puppeteer PDF export)
   - Pattern: HTML → Puppeteer → PDF with page settings

4. **Testing Patterns**:
   - Utility tests: `/Users/joshkarp/showstack/src/renderer/src/utils/__tests__/powerCalculations.test.ts`
   - Component tests: `/Users/joshkarp/showstack/src/renderer/src/components/prep/layout/__tests__/ElementInspector.test.tsx`
   - Security tests: `/Users/joshkarp/showstack/src/main/utils/__tests__/errorSanitizer.test.ts`

---

## Success Criteria

### MVP Completion (Phase 1-7):

- ✅ Rack elevation drawings with accurate U-space measurements
- ✅ System diagrams with equipment symbols and cable routing
- ✅ Equipment library with 20+ symbols and infrastructure integration
- ✅ Layer management (show/hide/lock/reorder)
- ✅ Smart cable routing (orthogonal, Bezier, manual waypoints)
- ✅ Multi-format export (PDF 300 DPI, SVG, PNG, DXF)
- ✅ Professional measurement and annotation tools
- ✅ Advanced styling (gradients, shadows, patterns)
- ✅ Smart guides and snapping
- ✅ Keyboard shortcuts and tool efficiency
- ✅ Save/load blueprints from database
- ✅ Responsive performance (<100ms interaction latency with 100+ elements)

### Best-in-Class Features:

- ✅ Layer management system (exceeds OmniGraffle)
- ✅ Multi-format export (PDF/SVG/PNG/DXF)
- ✅ Smart guides and advanced snapping
- ✅ Advanced styling (gradients, shadows, patterns)
- ✅ Professional engineering annotations
- ✅ Infrastructure equipment integration
- ✅ High-performance rendering

### Quality Gates:

- ✅ 80%+ test coverage for critical utilities (rackCalculations, cableRouting, portMapping)
- ✅ 50-60% test coverage for components
- ✅ 70%+ test coverage for IPC handlers
- ✅ All security tests passing
- ✅ Performance tests passing (100+ elements, <100ms latency)
- ✅ User acceptance testing completed
- ✅ Export quality validation (300 DPI PDF, vector-preserved SVG)

---

## Risk Mitigation

### Technical Risks:

1. **Complex Cable Routing Algorithms**
   - **Risk**: Routing algorithms may be computationally expensive
   - **Mitigation**: Implement in phases (orthogonal first, then Bezier, then A\*), use Web Workers for complex calculations, cache routing results

2. **Performance with Large Drawings**
   - **Risk**: 100+ elements may cause UI lag
   - **Mitigation**: Use React.memo, virtualize off-screen elements, debounce expensive operations, profile early and often

3. **PDF Export Quality**
   - **Risk**: Vector quality may be lost in export
   - **Mitigation**: Test early with complex drawings, use SVG-based rendering, optimize Puppeteer settings for vector preservation

4. **Infrastructure Integration Complexity**
   - **Risk**: Equipment data structure may not map cleanly to symbols
   - **Mitigation**: Start integration in Phase 2, create adapter layer, allow manual override of equipment properties

### Schedule Risks:

1. **Underestimated Complexity**
   - **Risk**: 11 weeks may be insufficient for best-in-class features
   - **Mitigation**: Prioritize MVP features (Phase 1-6), consider Phase 7 as polish/testing buffer, can extend if needed

2. **Testing Overhead**
   - **Risk**: TDD may slow initial development
   - **Mitigation**: TDD only for critical utilities (rackCalculations, cableRouting), test components after implementation, parallelize testing with development

### User Experience Risks:

1. **Steep Learning Curve**
   - **Risk**: Tool complexity may overwhelm users
   - **Mitigation**: Implement comprehensive keyboard shortcut reference (Cmd+K), add tool tooltips, create onboarding tutorial, provide template drawings

2. **Tool Discoverability**
   - **Risk**: Users may not find advanced features
   - **Mitigation**: Clear toolbar with icons, contextual help, example drawings, video tutorials

---

## Timeline Estimate

**Total Duration**: 11 weeks (best-in-class scope with both rack and system drawings in parallel)

- **Phase 1**: Foundation & Rack Elevations (2 weeks)
- **Phase 2**: Equipment Library & Infrastructure (1 week)
- **Phase 3**: Cable Routing & Connections (2 weeks)
- **Phase 4**: Layer Management & Advanced Styling (1 week)
- **Phase 5**: Measurement & Annotation Tools (1 week)
- **Phase 6**: Multi-Format Export & Polish (2 weeks)
- **Phase 7**: Testing & Production Readiness (2 weeks)

**Note**: User requested both rack elevations and system drawings in parallel with best-in-class features (layer management, multi-format export, smart guides, advanced styling). This is an ambitious scope that exceeds OmniGraffle capabilities.

---

## Next Steps

1. **Review and approve this plan**
2. **Set up project tracking** (GitHub Issues/Projects)
3. **Begin Phase 1**: Create type definitions and implement rack calculations (TDD)
4. **Weekly demos** after each phase completion
5. **User feedback sessions** at Phase 6 and Phase 7

---

**END OF IMPLEMENTATION PLAN**

This comprehensive plan delivers a best-in-class Blueprint tool that exceeds OmniGraffle capabilities while leveraging 80% of ShowStack's existing infrastructure. The TDD approach for critical utilities ensures accuracy, and the phased implementation allows for incremental delivery of value.
