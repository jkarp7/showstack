# Phase 5: Polish & UX - Implementation Plan

## Overview

Enhance the unified visual editor with professional UX improvements, keyboard shortcuts, visual effects, template management, and comprehensive polish. This phase transforms the editor from functional to production-ready.

## Goals

Transform the visual editor into a professional, polished tool with:
- **Professional keyboard shortcuts** for power users
- **Inline editing** for faster text updates
- **Visual effects** (shadows, advanced borders) for better designs
- **Smart guides** for precise alignment
- **Template management** for sharing and reuse
- **Comprehensive validation** and error handling
- **Polished UX** with tooltips, loading states, and feedback

## Current Architecture (from Exploration)

### LayoutDesigner Component
- **Local undo/redo** (50 entries) - NOT using global undoRedoStore
- **Minimal keyboard shortcuts** - only Delete key
- **State:** template, selectedElementId, zoom, showGrid, history/historyIndex
- **Operations:** handleElementDrop, Move, Resize, Update, Delete

### ElementInspector
- **Current controls:** Typography, Colors, Fill & Borders, Spacing, Position
- **Missing:** Shadows, transforms, advanced effects
- **Pattern:** Collapsible sections with form controls

### LayoutCanvas
- **Selection feedback:** ring-2 ring-blue-500 (selected), hover:ring-2 ring-gray-400 (hover)
- **Drag/drop:** Full implementation with ghost preview
- **Grid rendering:** CSS background-image linear-gradients
- **Resize handles:** Bottom-right, right edge, bottom edge

### Patterns to Follow
- Immutable state: `prev => ({ ...prev, ... })`
- Mark changes: `hasChanges: true`
- Timestamps: `updated_at: Date.now()`
- Validation at bounds checking
- Colors as hex strings
- Numeric values for sizes/opacity

---

## Implementation Plan: 7 Days

### Day 1: Keyboard Shortcuts & Enhanced Selection

**Goal:** Implement comprehensive keyboard shortcuts and improve selection UX

#### Features to Implement

**Keyboard Shortcuts:**
- `Cmd/Ctrl+S` - Save template
- `Cmd/Ctrl+Z` - Undo
- `Cmd/Ctrl+Shift+Z` - Redo
- `Delete/Backspace` - Delete selected element (already works)
- `Cmd/Ctrl+D` - Duplicate selected element
- `Escape` - Deselect element
- `Arrow Keys` - Nudge element (1 grid cell)
- `Shift+Arrow` - Nudge element (4 grid cells)
- `Cmd/Ctrl+A` - Select all (future: for multi-select)

**Selection Improvements:**
- Thicker selection ring (ring-4 instead of ring-2)
- Selection color based on element type (blue for text, green for shapes, purple for images)
- Show element info badge on selection (type, size, position)
- Hover glow effect with smooth transition
- Selection persists through property changes

#### Files to Modify

**`src/renderer/src/components/prep/layout/LayoutDesigner.tsx`:**
```typescript
// Add useEffect for keyboard listeners
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default for known shortcuts
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key === 's') {
      e.preventDefault();
      handleSave();
    }

    if (isMod && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      handleUndo();
    }

    if (isMod && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      handleRedo();
    }

    if (isMod && e.key === 'd' && selectedElementId) {
      e.preventDefault();
      handleDuplicate();
    }

    if (e.key === 'Escape' && selectedElementId) {
      setSelectedElementId(null);
    }

    // Arrow keys for nudging (only if element selected)
    if (selectedElementId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      handleNudge(e.key, e.shiftKey);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedElementId, template, historyIndex]);

// New function: handleDuplicate
const handleDuplicate = () => {
  const element = template.elements.find(el => el.id === selectedElementId);
  if (!element) return;

  const newElement = {
    ...element,
    id: `${element.element_type}_${Date.now()}`,
    grid_column: Math.min(element.grid_column + 2, template.grid_columns - element.column_span),
    grid_row: Math.min(element.grid_row + 2, template.grid_rows - element.row_span),
    created_at: Date.now(),
    updated_at: Date.now()
  };

  setTemplate(prev => ({
    ...prev,
    elements: [...prev.elements, newElement],
    updated_at: Date.now()
  }));

  setSelectedElementId(newElement.id);
  setHasChanges(true);
  saveHistory();
};

// New function: handleNudge
const handleNudge = (key: string, shift: boolean) => {
  const element = template.elements.find(el => el.id === selectedElementId);
  if (!element) return;

  const step = shift ? 4 : 1;
  let newCol = element.grid_column;
  let newRow = element.grid_row;

  if (key === 'ArrowLeft') newCol = Math.max(0, newCol - step);
  if (key === 'ArrowRight') newCol = Math.min(template.grid_columns - element.column_span, newCol + step);
  if (key === 'ArrowUp') newRow = Math.max(0, newRow - step);
  if (key === 'ArrowDown') newRow = Math.min(template.grid_rows - element.row_span, newRow + step);

  if (newCol !== element.grid_column || newRow !== element.grid_row) {
    handleElementMove(selectedElementId, newCol, newRow);
  }
};
```

**`src/renderer/src/components/prep/layout/LayoutCanvas.tsx`:**
```typescript
// Update selection ring styles (around line 416)
const getSelectionStyles = (elementType: string, isSelected: boolean, isHovered: boolean) => {
  const typeColors = {
    text: 'ring-blue-500',
    dataField: 'ring-blue-500',
    image: 'ring-purple-500',
    shape: 'ring-green-500',
    table: 'ring-orange-500'
  };

  const color = typeColors[elementType] || 'ring-blue-500';

  if (isSelected) {
    return `ring-4 ${color} ring-offset-2 shadow-xl transition-all duration-200`;
  }

  if (isHovered) {
    return `ring-2 ${color} ring-opacity-50 shadow-lg transition-all duration-150`;
  }

  return 'transition-all duration-150';
};

// Add element info badge when selected
{isSelected && (
  <div className="absolute -top-6 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
    {element.element_type} • {element.column_span}×{element.row_span} • ({element.grid_column}, {element.grid_row})
  </div>
)}
```

#### Testing Checklist
- [ ] All keyboard shortcuts work correctly
- [ ] Shortcuts don't conflict with browser defaults
- [ ] Duplicate creates exact copy with offset position
- [ ] Arrow keys nudge elements correctly
- [ ] Shift+Arrow nudges 4 cells
- [ ] Selection ring color varies by element type
- [ ] Info badge shows correct data
- [ ] Hover effects smooth and responsive

**Commit:** `feat: Phase 5 Day 1 - Keyboard shortcuts and enhanced selection`

---

### Day 2: Inline Text Editing

**Goal:** Enable double-click inline editing for text and dataField elements

#### Features to Implement

**Inline Editing:**
- Double-click text/dataField element to edit
- Inline textarea appears over element with same styling
- Auto-focus and select all text on edit
- Save on blur or Enter key
- Cancel on Escape key
- Maintain selection after save
- Visual indicator that element is in edit mode

#### Files to Modify

**`src/renderer/src/components/prep/layout/LayoutCanvas.tsx`:**
```typescript
// Add state for inline editing
const [editingElementId, setEditingElementId] = useState<string | null>(null);
const [editValue, setEditValue] = useState('');

// Add double-click handler for text elements
const handleDoubleClick = (element: LayoutElement) => {
  if (element.element_type === 'text' || element.element_type === 'dataField') {
    const config = JSON.parse(element.config);
    setEditingElementId(element.id);
    setEditValue(config.content || config.label || '');
  }
};

// Save edit
const handleSaveEdit = () => {
  if (!editingElementId) return;

  const element = template.elements.find(el => el.id === editingElementId);
  if (!element) return;

  const config = JSON.parse(element.config);
  const updatedConfig = {
    ...config,
    content: element.element_type === 'text' ? editValue : config.content,
    label: element.element_type === 'dataField' ? editValue : config.label
  };

  onElementUpdate(editingElementId, { config: JSON.stringify(updatedConfig) });
  setEditingElementId(null);
  setEditValue('');
};

// Cancel edit
const handleCancelEdit = () => {
  setEditingElementId(null);
  setEditValue('');
};

// Keyboard handler for inline edit
useEffect(() => {
  if (!editingElementId) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [editingElementId, editValue]);

// Render inline editor
{editingElementId === element.id ? (
  <textarea
    value={editValue}
    onChange={(e) => setEditValue(e.target.value)}
    onBlur={handleSaveEdit}
    autoFocus
    className="absolute inset-0 w-full h-full resize-none bg-white dark:bg-gray-800 border-2 border-blue-500 p-2 z-50"
    style={{
      fontFamily: style.fontFamily,
      fontSize: `${parseFloat(style.fontSize) * (zoom / 100)}pt`,
      fontWeight: style.fontWeight,
      textAlign: style.textAlign,
      color: style.color
    }}
  />
) : (
  // Normal rendering
  <div
    onDoubleClick={() => handleDoubleClick(element)}
    className="cursor-text"
  >
    {/* existing content */}
  </div>
)}
```

**Add edit mode indicator:**
```typescript
{editingElementId === element.id && (
  <div className="absolute -top-6 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg">
    Editing (Enter to save, Esc to cancel)
  </div>
)}
```

#### Testing Checklist
- [ ] Double-click on text element enters edit mode
- [ ] Double-click on dataField label enters edit mode
- [ ] Textarea matches element styling
- [ ] Enter saves and exits edit mode
- [ ] Escape cancels and exits edit mode
- [ ] Blur saves changes
- [ ] Selection persists after save
- [ ] Edit mode indicator visible

**Commit:** `feat: Phase 5 Day 2 - Inline text editing with double-click`

---

### Day 3: Shadow & Border Effects

**Goal:** Add shadow and advanced border controls to ElementInspector

#### Features to Implement

**Shadow Controls (box-shadow):**
- Offset X (px)
- Offset Y (px)
- Blur radius (px)
- Spread radius (px)
- Color (with opacity)
- Enable/disable toggle

**Advanced Borders:**
- Individual side widths (top, right, bottom, left)
- Border radius per corner (top-left, top-right, bottom-right, bottom-left)
- Border style per side (solid, dashed, dotted, double)

**Text Shadow:**
- Same controls as box shadow but for text elements

#### Files to Modify

**Update type definition in `src/renderer/src/types/prep.ts`:**
```typescript
export interface ElementStyle {
  // ... existing properties

  // Shadow
  shadowEnabled?: boolean;
  shadowOffsetX?: number;  // px
  shadowOffsetY?: number;  // px
  shadowBlur?: number;     // px
  shadowSpread?: number;   // px (box-shadow only)
  shadowColor?: string;    // hex
  shadowOpacity?: number;  // 0-1

  // Text Shadow
  textShadowEnabled?: boolean;
  textShadowOffsetX?: number;
  textShadowOffsetY?: number;
  textShadowBlur?: number;
  textShadowColor?: string;
  textShadowOpacity?: number;

  // Advanced Borders
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderTopStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderRightStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderBottomStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderLeftStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
}
```

**`src/renderer/src/components/prep/layout/ElementInspector.tsx`:**

Add new "Effects" section after "Fill & Borders":

```typescript
{/* Effects Section */}
<div className="border-b border-gray-700 pb-4">
  <button
    onClick={() => toggleSection('effects')}
    className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-700 rounded"
  >
    <span className="font-medium">Effects</span>
    <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.effects ? 'rotate-180' : ''}`} />
  </button>

  {expandedSections.effects && (
    <div className="px-3 py-2 space-y-4">
      {/* Box Shadow */}
      <div>
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={style.shadowEnabled || false}
            onChange={(e) => handleStyleChange('shadowEnabled', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Drop Shadow</span>
        </label>

        {style.shadowEnabled && (
          <div className="space-y-2 ml-6">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400">Offset X</label>
                <input
                  type="number"
                  value={style.shadowOffsetX || 0}
                  onChange={(e) => handleStyleChange('shadowOffsetX', parseInt(e.target.value))}
                  className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Offset Y</label>
                <input
                  type="number"
                  value={style.shadowOffsetY || 4}
                  onChange={(e) => handleStyleChange('shadowOffsetY', parseInt(e.target.value))}
                  className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400">Blur</label>
                <input
                  type="number"
                  min="0"
                  value={style.shadowBlur || 8}
                  onChange={(e) => handleStyleChange('shadowBlur', parseInt(e.target.value))}
                  className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Spread</label>
                <input
                  type="number"
                  value={style.shadowSpread || 0}
                  onChange={(e) => handleStyleChange('shadowSpread', parseInt(e.target.value))}
                  className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={style.shadowColor || '#000000'}
                  onChange={(e) => handleStyleChange('shadowColor', e.target.value)}
                  className="w-12 h-8 rounded cursor-pointer"
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={style.shadowOpacity || 0.25}
                  onChange={(e) => handleStyleChange('shadowOpacity', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-12 text-right">
                  {Math.round((style.shadowOpacity || 0.25) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Text Shadow (only for text elements) */}
      {(element.element_type === 'text' || element.element_type === 'dataField') && (
        <div>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={style.textShadowEnabled || false}
              onChange={(e) => handleStyleChange('textShadowEnabled', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Text Shadow</span>
          </label>

          {style.textShadowEnabled && (
            <div className="space-y-2 ml-6">
              {/* Similar controls as box shadow but without spread */}
            </div>
          )}
        </div>
      )}
    </div>
  )}
</div>
```

Add "Advanced Borders" subsection in "Fill & Borders":

```typescript
{/* Advanced Borders */}
<div>
  <button
    onClick={() => setShowAdvancedBorders(!showAdvancedBorders)}
    className="text-xs text-blue-400 hover:text-blue-300"
  >
    {showAdvancedBorders ? 'Hide' : 'Show'} Advanced Borders
  </button>

  {showAdvancedBorders && (
    <div className="mt-2 space-y-2">
      <div className="grid grid-cols-4 gap-1">
        <div>
          <label className="text-xs text-gray-400">Top</label>
          <input
            type="number"
            min="0"
            value={style.borderTopWidth ?? style.borderWidth ?? 1}
            onChange={(e) => handleStyleChange('borderTopWidth', parseInt(e.target.value))}
            className="w-full px-1 py-1 bg-gray-700 rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Right</label>
          <input
            type="number"
            min="0"
            value={style.borderRightWidth ?? style.borderWidth ?? 1}
            onChange={(e) => handleStyleChange('borderRightWidth', parseInt(e.target.value))}
            className="w-full px-1 py-1 bg-gray-700 rounded text-sm"
          />
        </div>
        {/* Bottom and Left similar */}
      </div>

      <div>
        <label className="text-xs text-gray-400">Border Radius (per corner)</label>
        <div className="grid grid-cols-2 gap-1 mt-1">
          <input type="number" placeholder="TL" value={style.borderTopLeftRadius ?? style.borderRadius ?? 0} ... />
          <input type="number" placeholder="TR" value={style.borderTopRightRadius ?? style.borderRadius ?? 0} ... />
          <input type="number" placeholder="BL" value={style.borderBottomLeftRadius ?? style.borderRadius ?? 0} ... />
          <input type="number" placeholder="BR" value={style.borderBottomRightRadius ?? style.borderRadius ?? 0} ... />
        </div>
      </div>
    </div>
  )}
</div>
```

**`src/renderer/src/components/prep/layout/LayoutCanvas.tsx`:**

Update element rendering to apply shadow styles:

```typescript
// Build box-shadow CSS
const boxShadow = style.shadowEnabled
  ? `${style.shadowOffsetX || 0}px ${style.shadowOffsetY || 4}px ${style.shadowBlur || 8}px ${style.shadowSpread || 0}px ${hexToRgba(style.shadowColor || '#000000', style.shadowOpacity || 0.25)}`
  : undefined;

// Build text-shadow CSS
const textShadow = style.textShadowEnabled
  ? `${style.textShadowOffsetX || 0}px ${style.textShadowOffsetY || 2}px ${style.textShadowBlur || 4}px ${hexToRgba(style.textShadowColor || '#000000', style.textShadowOpacity || 0.5)}`
  : undefined;

// Helper function
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Apply to element style
<div
  style={{
    // ... existing styles
    boxShadow,
    textShadow: (element.element_type === 'text' || element.element_type === 'dataField') ? textShadow : undefined,

    // Advanced borders
    borderTopWidth: style.borderTopWidth ?? style.borderWidth,
    borderRightWidth: style.borderRightWidth ?? style.borderWidth,
    borderBottomWidth: style.borderBottomWidth ?? style.borderWidth,
    borderLeftWidth: style.borderLeftWidth ?? style.borderWidth,
    borderTopLeftRadius: style.borderTopLeftRadius ?? style.borderRadius,
    borderTopRightRadius: style.borderTopRightRadius ?? style.borderRadius,
    borderBottomRightRadius: style.borderBottomRightRadius ?? style.borderRadius,
    borderBottomLeftRadius: style.borderBottomLeftRadius ?? style.borderRadius,
  }}
>
```

**Update PDF renderer `src/main/utils/labelSheetRenderer.ts`:**

Ensure shadows render in PDF exports (Puppeteer should handle CSS automatically, but verify).

#### Testing Checklist
- [ ] Drop shadow controls work for shapes
- [ ] Text shadow controls work for text elements
- [ ] Advanced border controls set individual sides
- [ ] Border radius per corner works
- [ ] Shadow opacity slider updates correctly
- [ ] Effects render in canvas
- [ ] Effects render in PDF exports
- [ ] Enable/disable toggles work

**Commit:** `feat: Phase 5 Day 3 - Shadow and advanced border effects`

---

### Day 4: Grid Snap & Alignment Guides

**Goal:** Smart snapping and alignment guides for precise positioning

#### Features to Implement

**Grid Snap Settings:**
- Toggle snap-to-grid (on by default)
- Snap size selector (1, 2, 4, 8 cells)
- Visual feedback when snapped
- Magnetic snap feel (subtle resistance)

**Alignment Guides:**
- Red lines appear when element aligns with other elements
- Horizontal and vertical guides
- Show distance measurements
- Snap to guide when close (5px threshold)
- Guide types:
  - Left edge to left edge
  - Right edge to right edge
  - Center to center
  - Top edge to top edge
  - Bottom edge to bottom edge

#### Files to Modify

**Add snap settings to `src/renderer/src/components/prep/layout/LayoutDesigner.tsx`:**

```typescript
// Add state
const [snapEnabled, setSnapEnabled] = useState(true);
const [snapSize, setSnapSize] = useState(1); // cells

// Add toolbar controls
<div className="flex items-center gap-2 border-l border-gray-700 pl-3">
  <button
    onClick={() => setSnapEnabled(!snapEnabled)}
    className={`p-2 rounded ${snapEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
    title="Snap to Grid"
  >
    <Grid className="w-4 h-4" />
  </button>

  {snapEnabled && (
    <select
      value={snapSize}
      onChange={(e) => setSnapSize(parseInt(e.target.value))}
      className="px-2 py-1 bg-gray-700 rounded text-sm"
      title="Snap Size"
    >
      <option value="1">1 cell</option>
      <option value="2">2 cells</option>
      <option value="4">4 cells</option>
      <option value="8">8 cells</option>
    </select>
  )}
</div>

// Update handleElementMove to snap
const handleElementMove = (elementId: string, newCol: number, newRow: number) => {
  if (snapEnabled && snapSize > 1) {
    newCol = Math.round(newCol / snapSize) * snapSize;
    newRow = Math.round(newRow / snapSize) * snapSize;
  }

  // Bounds check
  const element = template.elements.find(el => el.id === elementId);
  if (!element) return;

  newCol = Math.max(0, Math.min(template.grid_columns - element.column_span, newCol));
  newRow = Math.max(0, Math.min(template.grid_rows - element.row_span, newRow));

  // ... existing update logic
};
```

**Add alignment guides to `src/renderer/src/components/prep/layout/LayoutCanvas.tsx`:**

```typescript
// State for guides
const [alignmentGuides, setAlignmentGuides] = useState<{
  vertical: number[];
  horizontal: number[];
}>({ vertical: [], horizontal: [] });

// Calculate guides during drag
const calculateAlignmentGuides = (draggedElement: LayoutElement, newCol: number, newRow: number) => {
  const guides = { vertical: [], horizontal: [] };
  const threshold = 5; // pixels

  const draggedLeft = newCol;
  const draggedRight = newCol + draggedElement.column_span;
  const draggedCenterX = newCol + draggedElement.column_span / 2;
  const draggedTop = newRow;
  const draggedBottom = newRow + draggedElement.row_span;
  const draggedCenterY = newRow + draggedElement.row_span / 2;

  template.elements.forEach(el => {
    if (el.id === draggedElement.id) return;

    const elLeft = el.grid_column;
    const elRight = el.grid_column + el.column_span;
    const elCenterX = el.grid_column + el.column_span / 2;
    const elTop = el.grid_row;
    const elBottom = el.grid_row + el.row_span;
    const elCenterY = el.grid_row + el.row_span / 2;

    // Vertical guides (check alignment within threshold)
    if (Math.abs(draggedLeft - elLeft) < threshold) guides.vertical.push(elLeft);
    if (Math.abs(draggedRight - elRight) < threshold) guides.vertical.push(elRight);
    if (Math.abs(draggedCenterX - elCenterX) < threshold) guides.vertical.push(elCenterX);

    // Horizontal guides
    if (Math.abs(draggedTop - elTop) < threshold) guides.horizontal.push(elTop);
    if (Math.abs(draggedBottom - elBottom) < threshold) guides.horizontal.push(elBottom);
    if (Math.abs(draggedCenterY - elCenterY) < threshold) guides.horizontal.push(elCenterY);
  });

  setAlignmentGuides(guides);
};

// Render guides
{alignmentGuides.vertical.map((col, i) => (
  <div
    key={`v-${i}`}
    className="absolute top-0 bottom-0 border-l-2 border-red-500 border-dashed pointer-events-none z-40"
    style={{ left: `${col * cellWidth}px` }}
  />
))}

{alignmentGuides.horizontal.map((row, i) => (
  <div
    key={`h-${i}`}
    className="absolute left-0 right-0 border-t-2 border-red-500 border-dashed pointer-events-none z-40"
    style={{ top: `${row * cellHeight}px` }}
  />
))}

// Clear guides on drag end
const handleDragEnd = () => {
  setAlignmentGuides({ vertical: [], horizontal: [] });
  // ... existing logic
};
```

**Add snap-to-guide logic:**

```typescript
const snapToGuide = (value: number, guides: number[], threshold: number = 0.5): number => {
  for (const guide of guides) {
    if (Math.abs(value - guide) < threshold) {
      return guide;
    }
  }
  return value;
};

// In handleElementMove, snap to guides
if (alignmentGuides.vertical.length > 0) {
  newCol = snapToGuide(newCol, alignmentGuides.vertical);
}
if (alignmentGuides.horizontal.length > 0) {
  newRow = snapToGuide(newRow, alignmentGuides.horizontal);
}
```

#### Testing Checklist
- [ ] Snap-to-grid toggle works
- [ ] Snap size selector changes snap behavior
- [ ] Alignment guides appear when dragging near other elements
- [ ] Guides disappear after drag ends
- [ ] Snapping to guides feels magnetic
- [ ] Performance is good with many elements

**Commit:** `feat: Phase 5 Day 4 - Grid snap settings and alignment guides`

---

### Day 5: Template Management (Export/Import/Duplicate)

**Goal:** Enable template sharing and reuse

#### Features to Implement

**Export Template:**
- Export button in toolbar
- Save as JSON file with .showstack-template extension
- Include template metadata (name, description, page_type)
- Include all elements with config and style
- Exclude IDs (regenerate on import)
- Include version number for compatibility

**Import Template:**
- Import button in toolbar
- File picker for .json or .showstack-template files
- Validate JSON structure
- Regenerate all IDs
- Confirm before importing
- Preview template before import (future enhancement)

**Duplicate Template:**
- Duplicate button in template library
- Copy template with "(Copy)" suffix
- Increment name if duplicate already exists
- Navigate to duplicated template immediately

**Template Library Improvements:**
- Preview thumbnail for each template
- Filter by page type
- Sort by name or date
- Delete confirmation dialog
- Empty state with "Create Template" prompt

#### Files to Create

**`src/renderer/src/utils/prep/templateExport.ts`:**

```typescript
export interface TemplateExport {
  version: string;
  template: {
    name: string;
    description?: string;
    page_type: string;
    grid_columns: number;
    grid_rows: number;
    grid_gap: number;
    page_width: number;
    page_height: number;
    config?: any;
  };
  elements: Array<{
    element_type: string;
    config: any;
    grid_column: number;
    grid_row: number;
    column_span: number;
    row_span: number;
    layer: number;
    style: any;
  }>;
  exported_at: number;
  exported_by: string;
}

export function exportTemplate(template: PageLayoutTemplate): string {
  const exportData: TemplateExport = {
    version: '1.0',
    template: {
      name: template.name,
      description: template.description,
      page_type: template.page_type,
      grid_columns: template.grid_columns,
      grid_rows: template.grid_rows,
      grid_gap: template.grid_gap,
      page_width: template.page_width,
      page_height: template.page_height,
      config: template.config
    },
    elements: template.elements.map(el => ({
      element_type: el.element_type,
      config: typeof el.config === 'string' ? JSON.parse(el.config) : el.config,
      grid_column: el.grid_column,
      grid_row: el.grid_row,
      column_span: el.column_span,
      row_span: el.row_span,
      layer: el.layer,
      style: typeof el.style === 'string' ? JSON.parse(el.style) : el.style
    })),
    exported_at: Date.now(),
    exported_by: 'ShowStack'
  };

  return JSON.stringify(exportData, null, 2);
}

export function importTemplate(json: string): PageLayoutTemplate {
  const data: TemplateExport = JSON.parse(json);

  // Validate version
  if (!data.version || data.version !== '1.0') {
    throw new Error('Unsupported template version');
  }

  // Validate structure
  if (!data.template || !data.elements) {
    throw new Error('Invalid template structure');
  }

  const now = Date.now();
  const templateId = `imported_${now}`;

  return {
    id: templateId,
    name: `${data.template.name} (Imported)`,
    description: data.template.description,
    page_type: data.template.page_type,
    grid_columns: data.template.grid_columns,
    grid_rows: data.template.grid_rows,
    grid_gap: data.template.grid_gap,
    page_width: data.template.page_width,
    page_height: data.template.page_height,
    config: data.template.config,
    is_default: false,
    created_at: now,
    updated_at: now,
    elements: data.elements.map((el, idx) => ({
      id: `${el.element_type}_${now}_${idx}`,
      template_id: templateId,
      element_type: el.element_type,
      config: JSON.stringify(el.config),
      grid_column: el.grid_column,
      grid_row: el.grid_row,
      column_span: el.column_span,
      row_span: el.row_span,
      layer: el.layer,
      style: JSON.stringify(el.style),
      created_at: now,
      updated_at: now
    }))
  };
}
```

#### Files to Modify

**`src/renderer/src/components/prep/layout/LayoutDesigner.tsx`:**

```typescript
import { exportTemplate, importTemplate } from '../../../utils/prep/templateExport';

// Add export handler
const handleExport = () => {
  try {
    const json = exportTemplate(template);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.showstack-template`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export template');
  }
};

// Add import handler
const handleImport = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.showstack-template';

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = importTemplate(text);

      // Confirm before replacing
      if (!confirm(`Import template "${imported.name}"? This will replace the current template.`)) {
        return;
      }

      setTemplate(imported);
      setHasChanges(true);
      saveHistory();
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Failed to import template: ${error.message}`);
    }
  };

  input.click();
};

// Add toolbar buttons
<div className="flex items-center gap-2 border-l border-gray-700 pl-3">
  <button
    onClick={handleExport}
    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
    title="Export Template"
  >
    <Download className="w-4 h-4" />
  </button>

  <button
    onClick={handleImport}
    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
    title="Import Template"
  >
    <Upload className="w-4 h-4" />
  </button>
</div>
```

**Add duplicate functionality to template library or designer:**

```typescript
const handleDuplicate = async () => {
  try {
    const duplicatedTemplate = {
      ...template,
      id: `${template.page_type}_${Date.now()}`,
      name: generateUniqueName(template.name),
      is_default: false,
      created_at: Date.now(),
      updated_at: Date.now(),
      elements: template.elements.map(el => ({
        ...el,
        id: `${el.element_type}_${Date.now()}_${Math.random()}`,
        template_id: `${template.page_type}_${Date.now()}`,
        created_at: Date.now(),
        updated_at: Date.now()
      }))
    };

    const savedId = await window.api.prep.layoutTemplates.create(duplicatedTemplate);
    await window.api.prep.layoutTemplates.saveElements(savedId, duplicatedTemplate.elements);

    // Navigate to duplicated template
    setTemplate(duplicatedTemplate);
    alert('Template duplicated successfully!');
  } catch (error) {
    console.error('Duplicate failed:', error);
    alert('Failed to duplicate template');
  }
};

const generateUniqueName = (baseName: string): string => {
  const match = baseName.match(/^(.*?)(\s*\(Copy(?:\s+\d+)?\))?$/);
  const base = match ? match[1] : baseName;

  let counter = 1;
  let newName = `${base} (Copy)`;

  // Check if name exists (would need list of existing templates)
  // Increment counter if needed

  return newName;
};
```

#### Testing Checklist
- [ ] Export creates valid JSON file
- [ ] Exported file can be re-imported
- [ ] Import validates JSON structure
- [ ] Import regenerates IDs correctly
- [ ] Duplicate creates exact copy with new name
- [ ] Template library shows all templates
- [ ] Delete confirmation works

**Commit:** `feat: Phase 5 Day 5 - Template export, import, and duplicate`

---

### Day 6: Tooltips, Help & Validation

**Goal:** Comprehensive user guidance and error prevention

#### Features to Implement

**Tooltips:**
- All toolbar buttons have descriptive tooltips
- Show keyboard shortcut in tooltip if available
- ElementInspector property labels have help tooltips
- Palette element types have descriptions

**Help Text:**
- Inline help text for complex controls
- Expandable "?" icon for detailed explanations
- Links to documentation (future)

**Validation:**
- Required fields (template name)
- Min/max value enforcement
- Prevent invalid configurations
- Visual error indicators (red border)
- Error messages below fields
- Prevent deletion of system templates
- Warn before closing with unsaved changes

**User Feedback:**
- Success notifications after save
- Error notifications with recovery options
- Confirmation dialogs for destructive actions
- Empty states with helpful prompts

#### Files to Modify

**Create tooltip component `src/renderer/src/components/common/Tooltip.tsx`:**

```typescript
interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, shortcut, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {show && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap ${getPositionClass(position)}`}
        >
          {content}
          {shortcut && (
            <span className="ml-2 text-gray-400">({shortcut})</span>
          )}
        </div>
      )}
    </div>
  );
}

const getPositionClass = (position: string) => {
  const classes = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };
  return classes[position];
};
```

**Update `src/renderer/src/components/prep/layout/LayoutDesigner.tsx`:**

```typescript
import { Tooltip } from '../../common/Tooltip';

// Wrap toolbar buttons
<Tooltip content="Save template" shortcut="Cmd+S">
  <button onClick={handleSave} className="...">
    <Save className="w-4 h-4" />
  </button>
</Tooltip>

<Tooltip content="Undo" shortcut="Cmd+Z">
  <button onClick={handleUndo} disabled={historyIndex === 0} className="...">
    <Undo className="w-4 h-4" />
  </button>
</Tooltip>

// Add validation for template name
const [nameError, setNameError] = useState('');

const validateTemplateName = (name: string): boolean => {
  if (!name || name.trim() === '') {
    setNameError('Template name is required');
    return false;
  }
  if (name.length > 100) {
    setNameError('Template name must be less than 100 characters');
    return false;
  }
  setNameError('');
  return true;
};

const handleSave = async () => {
  if (!validateTemplateName(template.name)) {
    return;
  }

  try {
    // ... existing save logic
    showSuccessNotification('Template saved successfully!');
  } catch (error) {
    showErrorNotification('Failed to save template', error.message);
  }
};

// Add unsaved changes warning
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasChanges]);
```

**Add notification system `src/renderer/src/components/common/Notification.tsx`:**

```typescript
interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  onClose: () => void;
}

export function Notification({ type, message, details, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  };

  return (
    <div className={`fixed top-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg max-w-md z-50`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{message}</p>
          {details && <p className="text-sm mt-1 opacity-90">{details}</p>}
        </div>
        <button onClick={onClose} className="ml-4 hover:opacity-75">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Usage in LayoutDesigner
const [notification, setNotification] = useState<{ type: string; message: string; details?: string } | null>(null);

const showSuccessNotification = (message: string) => {
  setNotification({ type: 'success', message });
};

const showErrorNotification = (message: string, details?: string) => {
  setNotification({ type: 'error', message, details });
};

{notification && (
  <Notification
    type={notification.type}
    message={notification.message}
    details={notification.details}
    onClose={() => setNotification(null)}
  />
)}
```

**Update `src/renderer/src/components/prep/layout/ElementInspector.tsx`:**

```typescript
// Add help tooltips
<div className="flex items-center gap-2">
  <label className="text-sm">Font Size</label>
  <Tooltip content="Size in points. Common sizes: 12pt (body), 18pt (heading), 24pt (title)">
    <HelpCircle className="w-3 h-3 text-gray-400" />
  </Tooltip>
</div>

// Add input validation with visual feedback
<input
  type="number"
  value={style.fontSize?.replace('pt', '') || 12}
  onChange={(e) => {
    const value = parseInt(e.target.value);
    if (value < 1 || value > 144) {
      setFontSizeError('Font size must be between 1 and 144');
      return;
    }
    setFontSizeError('');
    handleStyleChange('fontSize', `${value}pt`);
  }}
  className={`w-full px-2 py-1 bg-gray-700 rounded ${fontSizeError ? 'border-2 border-red-500' : ''}`}
/>
{fontSizeError && (
  <p className="text-xs text-red-400 mt-1">{fontSizeError}</p>
)}
```

**Add confirmation dialog component:**

```typescript
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}: ConfirmDialogProps) {
  const colors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded ${colors[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Usage for delete confirmation
const handleDelete = () => {
  setConfirmDialog({
    title: 'Delete Element',
    message: 'Are you sure you want to delete this element? This action cannot be undone.',
    onConfirm: () => {
      onElementDelete(selectedElementId);
      setConfirmDialog(null);
    },
    onCancel: () => setConfirmDialog(null),
    variant: 'danger'
  });
};
```

#### Testing Checklist
- [ ] All toolbar buttons have tooltips
- [ ] Tooltips show keyboard shortcuts
- [ ] Help icons provide useful information
- [ ] Template name validation works
- [ ] Input validation prevents invalid values
- [ ] Error messages are clear and helpful
- [ ] Success notifications appear after save
- [ ] Unsaved changes warning works
- [ ] Confirmation dialogs prevent accidental deletions

**Commit:** `feat: Phase 5 Day 6 - Tooltips, help text, and validation`

---

### Day 7: Loading States & Final Polish

**Goal:** Professional UX with loading feedback and overall polish

#### Features to Implement

**Loading States:**
- Spinner during template save
- Loading skeleton for template library
- Disabled state for buttons during operations
- Progress indicators for long operations

**Empty States:**
- Template library empty state with "Create Template" CTA
- Element palette guide when no elements
- Canvas guide for new templates

**Final Polish:**
- Smooth transitions and animations
- Consistent spacing and alignment
- Color contrast improvements
- Accessibility improvements (ARIA labels)
- Performance optimizations
- Bug fixes from testing

**Performance Optimizations:**
- Debounce expensive operations (search, filter)
- Memoize complex calculations
- Virtual scrolling for large element lists (if needed)
- Lazy loading for templates

#### Files to Modify

**Create loading spinner component `src/renderer/src/components/common/LoadingSpinner.tsx`:**

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin`} />
      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  );
}
```

**Update `src/renderer/src/components/prep/layout/LayoutDesigner.tsx`:**

```typescript
import { LoadingSpinner } from '../../common/LoadingSpinner';

// Add loading state
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  if (!validateTemplateName(template.name)) return;

  setIsSaving(true);
  try {
    await onSave(template);
    showSuccessNotification('Template saved successfully!');
    setHasChanges(false);
  } catch (error) {
    showErrorNotification('Failed to save template', error.message);
  } finally {
    setIsSaving(false);
  }
};

// Update save button
<button
  onClick={handleSave}
  disabled={isSaving || !hasChanges}
  className={`px-4 py-2 rounded font-medium transition-colors ${
    isSaving || !hasChanges
      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700 text-white'
  }`}
>
  {isSaving ? (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span>Saving...</span>
    </div>
  ) : (
    'Save'
  )}
</button>
```

**Add empty state component:**

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="text-gray-500 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Usage in template library
{templates.length === 0 && (
  <EmptyState
    icon={<FileText className="w-16 h-16" />}
    title="No templates yet"
    message="Create your first layout template to get started with custom designs."
    action={{
      label: 'Create Template',
      onClick: handleCreateTemplate
    }}
  />
)}
```

**Add smooth transitions:**

```typescript
// LayoutCanvas.tsx - Update element styles
<div
  className={`
    absolute cursor-move
    transition-all duration-150 ease-out
    ${isSelected ? 'ring-4 ring-blue-500 shadow-xl' : ''}
    ${isHovered ? 'ring-2 ring-blue-400 shadow-lg' : ''}
  `}
  style={{
    // ... existing styles
    transition: 'all 150ms ease-out' // Smooth position/size changes
  }}
>
```

**Add accessibility improvements:**

```typescript
// Add ARIA labels to buttons
<button
  onClick={handleSave}
  aria-label="Save template (Cmd+S)"
  className="..."
>
  <Save className="w-4 h-4" />
</button>

// Add keyboard navigation to element inspector
<div
  role="tablist"
  aria-label="Element property tabs"
>
  <button
    role="tab"
    aria-selected={activeTab === 'config'}
    aria-controls="config-panel"
    onClick={() => setActiveTab('config')}
  >
    Config
  </button>
</div>

// Add focus indicators
.focus-visible {
  @apply outline-2 outline-offset-2 outline-blue-500;
}
```

**Performance optimizations:**

```typescript
import { useMemo, useCallback } from 'react';

// Memoize filtered elements
const filteredElements = useMemo(() => {
  return template.elements.filter(/* ... */);
}, [template.elements, filterCriteria]);

// Debounce search
import { debounce } from 'lodash';

const debouncedSearch = useCallback(
  debounce((query: string) => {
    setSearchResults(performSearch(query));
  }, 300),
  []
);
```

**Final testing and bug fixes:**

```typescript
// Add error boundaries
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Layout Designer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-6">The layout designer encountered an error.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap LayoutDesigner
<ErrorBoundary>
  <LayoutDesigner {...props} />
</ErrorBoundary>
```

#### Testing Checklist
- [ ] Loading spinners appear during async operations
- [ ] Buttons disable correctly during operations
- [ ] Empty states are helpful and actionable
- [ ] All transitions are smooth
- [ ] Focus indicators visible for keyboard navigation
- [ ] ARIA labels present on interactive elements
- [ ] No performance issues with many elements
- [ ] Error boundaries catch and display errors gracefully
- [ ] Overall polish and consistency

**Commit:** `feat: Phase 5 Day 7 - Loading states and final polish`

---

## Summary

### Total Implementation
- **Duration:** 7 days
- **Files Created:** 5 (Tooltip, Notification, ConfirmDialog, EmptyState, LoadingSpinner, templateExport)
- **Files Modified:** 15+ (LayoutDesigner, LayoutCanvas, ElementInspector, and supporting files)
- **New Features:** 14 major feature areas
- **Lines of Code:** ~2,500 new, ~1,000 modified

### Features Delivered

**UX Improvements:**
1. ✅ Comprehensive keyboard shortcuts (Cmd+S, Cmd+Z, Delete, Arrow keys, etc.)
2. ✅ Undo/redo improvements with keyboard support
3. ✅ Inline text editing with double-click
4. ✅ Enhanced element selection with colored rings and info badges
5. ✅ Tooltips on all interactive elements

**Visual Enhancements:**
6. ✅ Drop shadows for elements
7. ✅ Text shadows for text elements
8. ✅ Advanced border controls (per-side, per-corner)
9. ✅ Grid snap settings (toggle, size selector)
10. ✅ Alignment guides (red lines, snap-to-guide)

**Template Management:**
11. ✅ Export templates to JSON
12. ✅ Import templates from JSON
13. ✅ Duplicate templates
14. ✅ Template library improvements

**Polish & Validation:**
15. ✅ Input validation with error messages
16. ✅ Loading states for async operations
17. ✅ Success/error notifications
18. ✅ Confirmation dialogs
19. ✅ Empty states
20. ✅ Accessibility improvements
21. ✅ Performance optimizations

### Success Criteria

- [x] All keyboard shortcuts functional and documented
- [x] Inline editing works for text elements
- [x] Shadows and borders render correctly in canvas and PDF
- [x] Alignment guides appear during drag operations
- [x] Templates can be exported/imported successfully
- [x] All inputs validated with helpful error messages
- [x] Loading states provide feedback during operations
- [x] Overall UX polished and professional

### Post-Phase 5 Enhancements

**Future Considerations (not in scope):**
- Multi-select with Cmd/Ctrl+click
- Copy/paste with Cmd+C/V
- Group/ungroup elements
- Element locking
- Layer management panel
- Grid presets (A4, Letter, custom)
- Ruler measurements
- Color palette management
- Recent colors
- Gradient fills (excluded per user request)
- Transform controls (rotation, scale, skew)
- Animation/transition effects

---

## Critical Files Reference

**Core Components:**
- `src/renderer/src/components/prep/layout/LayoutDesigner.tsx` - Main designer with toolbar and state
- `src/renderer/src/components/prep/layout/LayoutCanvas.tsx` - Canvas rendering and interactions
- `src/renderer/src/components/prep/layout/ElementInspector.tsx` - Property editing panel
- `src/renderer/src/components/prep/layout/ElementPalette.tsx` - Element type selection

**New Utilities:**
- `src/renderer/src/utils/prep/templateExport.ts` - Export/import logic
- `src/renderer/src/components/common/Tooltip.tsx` - Tooltip component
- `src/renderer/src/components/common/Notification.tsx` - Notification system
- `src/renderer/src/components/common/ConfirmDialog.tsx` - Confirmation dialogs
- `src/renderer/src/components/common/LoadingSpinner.tsx` - Loading indicators
- `src/renderer/src/components/common/EmptyState.tsx` - Empty state displays

**Type Definitions:**
- `src/renderer/src/types/prep.ts` - ElementStyle interface updates

**Related Systems:**
- `src/renderer/src/store/undoRedoStore.ts` - Global undo/redo (not used by designer)
- `src/main/utils/labelSheetRenderer.ts` - PDF export (verify shadow support)

---

## Implementation Notes

### Keyboard Shortcut Conflicts
- Use `e.preventDefault()` for all shortcuts
- Check `e.metaKey || e.ctrlKey` for cross-platform support
- Don't override browser shortcuts like Cmd+W, Cmd+T, etc.

### State Management
- Continue using local state in LayoutDesigner
- Don't integrate with global undoRedoStore (different patterns)
- Use `prev => ({ ...prev, ... })` for immutable updates
- Always mark `hasChanges: true` and `updated_at: Date.now()`

### Performance Considerations
- Debounce expensive operations (alignment guide calculations)
- Memoize filtered/sorted lists
- Use CSS transitions instead of JS animations
- Virtual scrolling only if template library grows large (100+ templates)

### Testing Strategy
1. Unit test utility functions (templateExport, validation)
2. Integration test keyboard shortcuts
3. Manual test all UI interactions
4. Test PDF export with all new features
5. Cross-browser testing (Chrome/Electron, Safari, Firefox)
6. Accessibility testing with keyboard-only navigation

---

**Ready for user approval and implementation.**
