# GitHub Issues for Unified Visual Editor System

## Main Epic Issue

**Title**: 🎨 Unified Visual Editor System - Consolidate Paperwork, Labels, and Shop Orders

**Labels**: `enhancement`, `epic`, `UX`, `major-feature`

**Body**:

```markdown
## Overview

Consolidate all visual editing (Paperwork, Labels, Shop Orders) into a single, modern, production-grade editor with comprehensive formatting controls.

**Vision**: Transform Paperwork tab from "preview mode" to "layout editor mode" - similar to LightWright's layout tab but with drag-and-drop visual design capabilities.

**See**: `docs/mockups/unified-editor-mockup.md` for detailed visual mockups

## Strategic Goals

- **One editor for all contexts** - Paperwork headers, full reports, labels, shop orders
- **Professional UX** - Optimized for production electricians/audio/video techs working in theaters and shops
- **Modern appearance** - Clean, floating toolbars, collapsible panels, dark mode optimized
- **Speed-first design** - Keyboard shortcuts, command palette, inline editing, power user features

## Implementation Phases

- [ ] Phase 1: Core Refactor (2 weeks) - #[TBD]
- [ ] Phase 2: Text & Shape Formatting (1 week) - #[TBD]
- [ ] Phase 3: Paperwork Integration (1 week) - #[TBD]
- [ ] Phase 4: Label Integration (1 week) - #[TBD]
- [ ] Phase 5: Polish & UX (1 week) - #[TBD]

**Estimated Total**: 6 weeks

## Benefits

### For Users

- Consistent UX across all paperwork/label tasks
- Professional-grade formatting control
- Faster workflow with keyboard shortcuts
- Works in dark theaters and bright shops

### For Development

- Single codebase for all visual editing (~40% less code)
- Easier maintenance and bug fixes
- New features benefit all contexts
- Better testability

### Competitive Advantage

- Modern visual editor vs. LightWright's settings-based approach
- Drag-and-drop WYSIWYG beats form-based configuration
- Production-optimized UX (keyboard-first, dark mode, touch-friendly)

## Related Documentation

- Mockup: `docs/mockups/unified-editor-mockup.md`
- Project Status: `PROJECT_STATUS.md` (Section: Unified Visual Editor System)
- Existing Editor: `src/renderer/src/components/prep/layout/LayoutDesigner.tsx`
```

---

## Phase 1: Core Refactor

**Title**: 🔧 Unified Editor - Phase 1: Core Refactor and Architecture

**Labels**: `enhancement`, `architecture`, `Phase 1`

**Milestone**: Unified Editor - Phase 1

**Estimated**: 2 weeks

**Body**:

```markdown
## Goal

Extract common editor components from Prep's LayoutDesigner and create a unified, context-aware editor foundation.

## Tasks

### Architecture

- [ ] Create `src/renderer/src/components/unified-editor/` directory structure
- [ ] Design `UnifiedLayoutEditor.tsx` main wrapper component
- [ ] Define context types: `paperwork-report`, `paperwork-header`, `label`, `shop-order`
- [ ] Create unified data model for LayoutElement (text, shape, image, table, barcode)

### Component Extraction

- [ ] Extract reusable canvas logic from Prep's LayoutCanvas
- [ ] Extract grid system with configurable rows/columns
- [ ] Extract element rendering logic (Text, Shape, Image, Table)
- [ ] Create element factory based on context

### UI Framework

- [ ] Build FloatingToolbar component (Figma-style)
  - Tool buttons with keyboard shortcut hints
  - Undo/Redo controls
  - Zoom control
  - Theme toggle
- [ ] Build LeftPanel with collapsible sections
  - StructureTree (layers/sections)
  - ComponentLibrary (drag templates)
  - FieldSelector (context-specific)
- [ ] Build RightPanel with context-aware properties
  - PageProperties (default when nothing selected)
  - Element-specific properties (show when element selected)

### Keyboard Shortcuts

- [ ] Implement keyboard shortcut system
- [ ] Add shortcut handlers for common actions (Cmd+Z, Cmd+D, Delete, etc.)
- [ ] Create keyboard shortcut help overlay (Cmd+/)

### Testing

- [ ] Unit tests for context switching
- [ ] Component tests for toolbar and panels
- [ ] Integration test for basic element creation

## Acceptance Criteria

- [ ] UnifiedLayoutEditor can be instantiated with different contexts
- [ ] Floating toolbar displays correct tools per context
- [ ] Left/Right panels are collapsible
- [ ] Keyboard shortcuts work for basic operations
- [ ] Elements can be added to canvas via toolbar

## Related Files

- Create: `src/renderer/src/components/unified-editor/UnifiedLayoutEditor.tsx`
- Create: `src/renderer/src/components/unified-editor/toolbar/FloatingToolbar.tsx`
- Create: `src/renderer/src/components/unified-editor/panels/LeftPanel.tsx`
- Create: `src/renderer/src/components/unified-editor/panels/RightPanel.tsx`
- Reference: `src/renderer/src/components/prep/layout/LayoutDesigner.tsx`
```

---

## Phase 2: Text & Shape Formatting

**Title**: ✏️ Unified Editor - Phase 2: Text & Shape Formatting Controls

**Labels**: `enhancement`, `formatting`, `Phase 2`

**Milestone**: Unified Editor - Phase 2

**Estimated**: 1 week

**Body**:

```markdown
## Goal

Add comprehensive text and shape formatting controls with professional-grade UI components.

## Tasks

### Text Formatting

- [ ] Create FontSelector component
  - Dropdown with production fonts (Inter, Helvetica, Arial, Roboto, Roboto Mono, Courier)
  - Font preview in dropdown
- [ ] Create FontSizeControl component
  - Preset buttons (8, 10, 12, 14, 16, 18, 24, 36)
  - Custom number input (6-144pt)
  - Dual slider + input control
- [ ] Create StyleControls component
  - Toggle buttons: Bold, Italic, Underline, Strikethrough
  - Visual active states
- [ ] Create ColorPicker component
  - Preset swatches (Black, White, Blue, Red, Green, Amber, Gray)
  - Hex input
  - Color wheel picker
  - Eyedropper tool (optional)
- [ ] Create AlignmentControls component
  - Left, Center, Right buttons
  - Visual icons
- [ ] Create SpacingControls component
  - Line height slider
  - Letter spacing input

### Shape Formatting

- [ ] Create FillControls component
  - Enable/disable toggle
  - Color picker integration
  - Opacity slider (0-100%)
  - Fill type selector (Solid, Gradient, Pattern)
- [ ] Create BorderControls component
  - Enable/disable toggle
  - Color picker
  - Width input (0-20px)
  - Style dropdown (Solid, Dashed, Dotted)
  - Corner radius slider (0-100px)

### Properties Panels

- [ ] Build TextProperties panel
  - Integrate all text controls
  - Collapsible sections
  - Live preview of changes
- [ ] Build ShapeProperties panel
  - Integrate fill and border controls
  - Position and size inputs
  - Live preview

### Inline Editing

- [ ] Implement double-click to edit text
- [ ] Create inline text editor overlay
- [ ] Add Enter to confirm, Escape to cancel
- [ ] Tab key navigation between text elements

### Testing

- [ ] Unit tests for all formatting controls
- [ ] Visual regression tests for color picker
- [ ] Integration tests for inline editing
- [ ] Accessibility tests for keyboard navigation

## Acceptance Criteria

- [ ] Text elements support full formatting (font, size, style, color, alignment)
- [ ] Shape elements support fill and border with opacity
- [ ] Double-clicking text enters inline edit mode
- [ ] Color picker supports presets and custom colors
- [ ] All controls have proper keyboard navigation
- [ ] Changes reflect immediately in canvas

## Related Files

- Create: `src/renderer/src/components/unified-editor/controls/FontSelector.tsx`
- Create: `src/renderer/src/components/unified-editor/controls/ColorPicker.tsx`
- Create: `src/renderer/src/components/unified-editor/controls/StyleControls.tsx`
- Create: `src/renderer/src/components/unified-editor/panels/TextProperties.tsx`
- Create: `src/renderer/src/components/unified-editor/panels/ShapeProperties.tsx`
```

---

## Phase 3: Paperwork Integration

**Title**: 📄 Unified Editor - Phase 3: Paperwork Tab Integration

**Labels**: `enhancement`, `paperwork`, `Phase 3`

**Milestone**: Unified Editor - Phase 3

**Estimated**: 1 week

**Body**:

```markdown
## Goal

Replace Paperwork tab's preview mode with the unified layout editor, transforming it into a layout design tool similar to LightWright's layout tab.

## Tasks

### UI Restructure

- [ ] Remove report selection buttons (replace with sidebar template library)
- [ ] Remove preview-only display
- [ ] Integrate UnifiedLayoutEditor with `context="paperwork-report"`
- [ ] Create left panel FieldSelector for paperwork data fields
  - Channel, Dimmer, Type, Color, Circuit, Location, Wattage, etc.
  - Search/filter fields
  - Drag to add to column list

### Column Configuration

- [ ] Build ColumnConfiguration component
  - Selected fields list
  - Drag-and-drop reordering
  - Column width controls
  - Enable/disable individual columns

### Grouping & Sorting

- [ ] Create GroupingSortingControls
  - Group by dropdown (None, Location, Type, Color, etc.)
  - Sort by dropdown (Channel, Dimmer, Position, etc.)
  - Ascending/Descending toggle

### Template Library

- [ ] Build paperwork template library (left panel)
  - System templates section (Channel Hookup, Dimmer Schedule, etc.)
  - Custom templates section
  - Load template button
  - Save current as template
- [ ] Migrate existing 12 report types to templates
  - Channel Hookup
  - Dimmer Schedule
  - Circuit List
  - DMX Addresses
  - Power Summary
  - Color Schedule
  - Gobo Schedule
  - Infrastructure List (5 types)

### Live Preview

- [ ] Integrate live data preview in canvas
- [ ] Support multi-page rendering
- [ ] Add page navigation controls
- [ ] Implement zoom controls

### Testing

- [ ] Test loading all 12 system templates
- [ ] Test custom template save/load
- [ ] Test field selection and column configuration
- [ ] Test grouping and sorting with live data
- [ ] Test PDF export from editor

## Acceptance Criteria

- [ ] Paperwork tab shows editor instead of preview
- [ ] Users can load system templates or start blank
- [ ] Column configuration UI allows full customization
- [ ] Grouping and sorting controls work with live preview
- [ ] Templates can be saved and loaded
- [ ] PDF export produces same output as before
- [ ] All 12 existing report types available as templates

## Related Files

- Modify: `src/renderer/src/pages/modules/Paperwork.tsx`
- Create: `src/renderer/src/components/unified-editor/panels/FieldSelector.tsx`
- Create: `src/renderer/src/components/unified-editor/panels/ColumnConfiguration.tsx`
- Create: `src/renderer/src/components/unified-editor/panels/GroupingSortingControls.tsx`
- Reference: `src/renderer/src/types/paperwork.ts`
```

---

## Phase 4: Label Integration

**Title**: 🏷️ Unified Editor - Phase 4: Label Designer Integration

**Labels**: `enhancement`, `labels`, `Phase 4`

**Milestone**: Unified Editor - Phase 4

**Estimated**: 1 week

**Body**:

```markdown
## Goal

Migrate Label Designer to use the unified editor with barcode/QR code support.

## Tasks

### Barcode Elements

- [ ] Create BarcodeElement component
  - QR Code rendering
  - Code 128 rendering
  - Code 39 rendering
- [ ] Create BarcodeProperties panel
  - Type selector dropdown
  - Data template input (supports `{equipment.id}`, `{fixture.channel}`, etc.)
  - Size control
  - Error correction level (QR codes)
- [ ] Implement variable data substitution
  - Parse template strings
  - Replace with actual equipment data
  - Preview with sample data

### Label Presets

- [ ] Build label size preset selector
  - 2×4" preset
  - 4×6" preset
  - 4×8" preset
  - Custom size option
- [ ] Create label template library
  - Cable label template
  - Circuit label template
  - Fixture label template
  - Dimmer label template
  - Equipment label template (barcode-focused)

### Equipment Fields

- [ ] Create equipment FieldSelector (label context)
  - Name, Type, ID, Location, Channel, Dimmer, Circuit
  - Manufacturer, Model, Serial Number
  - Custom fields
- [ ] Support variable data fields (not just static text)

### Batch Generation

- [ ] Implement batch label generation
  - Select data source (fixtures, equipment, cables)
  - Filter which items to print
  - Preview all labels
  - Export to PDF (multi-page sheet)

### Label Sheet Layout

- [ ] Build sheet layout calculator
  - Calculate labels per sheet based on label + sheet size
  - Add spacing/margins between labels
  - Preview full sheet before print

### Testing

- [ ] Test all barcode types render correctly
- [ ] Test variable data substitution
- [ ] Test batch generation with 100+ items
- [ ] Test label sheet layout calculations
- [ ] Verify PDF export for printing

## Acceptance Criteria

- [ ] Label Designer uses UnifiedLayoutEditor with `context="label"`
- [ ] Users can add QR codes and barcodes to labels
- [ ] Variable data fields work with equipment data
- [ ] Batch generation produces multi-page PDF sheets
- [ ] Label templates can be saved and reused
- [ ] All existing label types can be recreated in new editor

## Related Files

- Modify: `src/renderer/src/pages/modules/LabelDesigner.tsx`
- Create: `src/renderer/src/components/unified-editor/elements/BarcodeElement.tsx`
- Create: `src/renderer/src/components/unified-editor/panels/BarcodeProperties.tsx`
- Create: `src/renderer/src/components/unified-editor/panels/LabelSizePresets.tsx`
```

---

## Phase 5: Polish & UX

**Title**: ✨ Unified Editor - Phase 5: Polish, UX, and Production Optimization

**Labels**: `enhancement`, `UX`, `polish`, `Phase 5`

**Milestone**: Unified Editor - Phase 5

**Estimated**: 1 week

**Body**:

```markdown
## Goal

Add professional polish, smart guides, command palette, and production environment optimizations.

## Tasks

### Smart Guides & Snapping

- [ ] Implement snap-to-grid
  - Configurable grid spacing
  - Visual grid overlay
  - Enable/disable toggle
- [ ] Add alignment guides
  - Vertical/horizontal pink lines when elements align
  - Distance indicators between elements
  - Snap to other element edges/centers
- [ ] Create snap indicator tooltips
  - Show distance in pixels
  - Show alignment type (center, edge, etc.)

### Command Palette

- [ ] Build command palette (Cmd+K)
  - Fuzzy search
  - Recent actions
  - All menu actions searchable
- [ ] Add command palette actions
  - Add element types
  - Format actions (Bold, Italic, etc.)
  - Alignment actions
  - Template actions (Load, Save)
  - View actions (Zoom, Grid toggle)
- [ ] Show keyboard shortcuts in palette

### Preview Mode

- [ ] Improve Edit ⇄ Preview toggle
  - Clear visual mode indicator
  - Hide toolbars/panels in preview mode
  - Keyboard shortcut (Cmd+P)
- [ ] Add zoom controls in preview
  - Fit to width
  - Fit to page
  - Zoom presets (25%, 50%, 100%, 150%, 200%)
  - Zoom slider

### Dark Mode Refinement

- [ ] Optimize dark mode colors for theater environments
  - Canvas: `#1A1A1A` (not pure black)
  - Grid: `#2D2D2D` (subtle)
  - Ensure WCAG AAA contrast
- [ ] Test in actual dark environment
- [ ] Add light mode support for shops
- [ ] Smooth theme transitions

### Keyboard Shortcuts

- [ ] Implement full shortcut system
  - Text formatting (Cmd+B, Cmd+I, Cmd+U)
  - Alignment (Cmd+Shift+L/E/R)
  - Element creation (T, R, L, I, B, D keys)
  - Canvas operations (Cmd+Z, Cmd+D, Delete)
- [ ] Create keyboard shortcut help overlay (Cmd+/)
  - Categorized shortcuts
  - Search shortcuts
  - Print reference card

### Touch Optimization

- [ ] Increase touch target sizes for tablet use
  - Minimum 56×56px for all interactive elements
  - Larger button padding
- [ ] Add touch gestures
  - Pinch to zoom
  - Two-finger pan
  - Long-press for context menu
- [ ] Test on iPad in field conditions

### Responsive Design

- [ ] Implement breakpoint system
  - Desktop (≥1400px): Three-panel layout
  - Compact (<1400px): Drawer panels
  - Tablet: Touch-optimized
- [ ] Build drawer panel animations
  - Slide in from right (properties)
  - Slide in from left (fields)
  - Smooth transitions

### Performance

- [ ] Optimize canvas rendering
  - Debounce drag operations
  - Use React.memo for static elements
  - Virtualize large element lists
- [ ] Add loading states
  - Template loading
  - PDF generation
  - Batch operations

### Documentation

- [ ] Create user guide for unified editor
- [ ] Record demo videos for each context
- [ ] Write keyboard shortcut reference
- [ ] Document template creation workflow

### Testing

- [ ] Accessibility audit (WCAG AAA)
- [ ] Keyboard navigation testing
- [ ] Touch device testing (iPad)
- [ ] Performance testing (100+ elements)
- [ ] User testing with production electricians

## Acceptance Criteria

- [ ] Snap guides appear when dragging elements
- [ ] Command palette (Cmd+K) works with fuzzy search
- [ ] Preview mode hides all editing UI
- [ ] Dark mode is optimized for theater use
- [ ] All actions have keyboard shortcuts
- [ ] Touch targets are 56×56px minimum
- [ ] Editor works on tablets
- [ ] Rendering is smooth with 100+ elements
- [ ] User guide and videos published

## Related Files

- Create: `src/renderer/src/components/unified-editor/canvas/SnapGuides.tsx`
- Create: `src/renderer/src/components/unified-editor/toolbar/QuickActions.tsx`
- Create: `src/renderer/src/components/unified-editor/toolbar/KeyboardShortcuts.tsx`
- Create: `docs/user/unified-editor-guide.md`
```

---

## Summary

**Total Issues to Create**: 6

1. Main Epic (tracking issue)
2. Phase 1: Core Refactor
3. Phase 2: Text & Shape Formatting
4. Phase 3: Paperwork Integration
5. Phase 4: Label Integration
6. Phase 5: Polish & UX

**Total Estimated Time**: 6 weeks

**Dependencies**: None (can start immediately)

**Priority**: High (major UX improvement, consolidates technical debt)
