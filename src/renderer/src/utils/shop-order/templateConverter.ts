/**
 * Template Converter
 *
 * Converts canvas-based label graphics to grid-based layout elements
 * for the unified visual editor system.
 */

import {
  calculateLabelGrid,
  calculateCellDimensions,
  type LabelGridConfig
} from './labelGridCalculator';
import type {
  LayoutElement,
  TextConfig,
  ShapeConfig,
  DataFieldConfig,
  ElementStyle
} from '../../types/shopOrder';

// Legacy canvas-based label graphic interface
export interface LabelGraphic {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  stroke?: boolean;
  strokeWidth?: number;
}

// Legacy custom label design interface
export interface CustomLabelDesign {
  id: string;
  name: string;
  description: string;
  labelType: 'cable' | 'circuit' | 'fixture' | 'dimmer' | 'custom';
  printerType: 'dymo-450' | 'brother-pt' | 'zebra' | 'avery-sheet';
  averyTemplate?: string;
  width: number;  // inches
  height: number; // inches
  graphics: LabelGraphic[];
  created: number;
  updated: number;
}

/**
 * Map legacy graphic type to new element type
 */
function mapGraphicType(graphicType: string): LayoutElement['element_type'] {
  switch (graphicType) {
    case 'text':
      return 'text';
    case 'line':
    case 'rectangle':
    case 'circle':
      return 'shape';
    default:
      return 'text';
  }
}

/**
 * Convert legacy graphic style to new element style
 */
function convertGraphicStyle(graphic: LabelGraphic): ElementStyle {
  return {
    fontFamily: 'Arial',
    fontSize: graphic.fontSize || 12,
    fontWeight: graphic.fontWeight || 'normal',
    textAlign: 'left',
    color: '#000000',
    backgroundColor: 'transparent'
  };
}

/**
 * Convert legacy graphic config to new element config
 */
function convertGraphicConfig(
  graphic: LabelGraphic
): TextConfig | ShapeConfig {
  if (graphic.type === 'text') {
    // Text element
    const textConfig: TextConfig = {
      content: graphic.text || ''
    };
    return textConfig;
  } else {
    // Shape element
    const shapeConfig: ShapeConfig = {
      shapeType: graphic.type === 'line' ? 'divider' :
                 graphic.type === 'circle' ? 'circle' :
                 'rectangle',
      color: '#000000',
      thickness: graphic.strokeWidth || 1,
      fill: !graphic.stroke
    };
    return shapeConfig;
  }
}

/**
 * Convert pixel position to grid cells
 */
function pixelsToGridPosition(
  pixelX: number,
  pixelY: number,
  cellWidth: number,
  cellHeight: number
): { column: number; row: number } {
  return {
    column: Math.floor(pixelX / cellWidth),
    row: Math.floor(pixelY / cellHeight)
  };
}

/**
 * Convert pixel dimensions to grid spans
 */
function pixelsToGridSpan(
  pixelWidth: number,
  pixelHeight: number,
  cellWidth: number,
  cellHeight: number
): { columnSpan: number; rowSpan: number } {
  return {
    columnSpan: Math.max(1, Math.ceil(pixelWidth / cellWidth)),
    rowSpan: Math.max(1, Math.ceil(pixelHeight / cellHeight))
  };
}

/**
 * Convert a single canvas graphic to a grid layout element
 */
export function convertCanvasToGrid(
  canvasGraphic: LabelGraphic,
  labelWidth: number,
  labelHeight: number
): LayoutElement {
  // Calculate grid configuration
  const grid = calculateLabelGrid(labelWidth, labelHeight);
  const { cellWidth, cellHeight } = calculateCellDimensions(grid);

  // Convert position to grid cells
  const { column, row } = pixelsToGridPosition(
    canvasGraphic.x,
    canvasGraphic.y,
    cellWidth,
    cellHeight
  );

  // Convert dimensions to grid spans
  const width = canvasGraphic.type === 'circle'
    ? (canvasGraphic.radius || 10) * 2
    : canvasGraphic.width || 50;
  const height = canvasGraphic.type === 'circle'
    ? (canvasGraphic.radius || 10) * 2
    : canvasGraphic.height || 20;

  const { columnSpan, rowSpan } = pixelsToGridSpan(
    width,
    height,
    cellWidth,
    cellHeight
  );

  // Create layout element
  const element: LayoutElement = {
    id: canvasGraphic.id,
    template_id: '', // Will be set when saving
    element_type: mapGraphicType(canvasGraphic.type),
    config: convertGraphicConfig(canvasGraphic),
    grid_column: column,
    grid_row: row,
    column_span: columnSpan,
    row_span: rowSpan,
    layer: 1,
    style: convertGraphicStyle(canvasGraphic),
    created_at: Date.now(),
    updated_at: Date.now()
  };

  return element;
}

/**
 * Convert an entire label design to grid layout
 */
export function convertLabelDesignToTemplate(
  design: CustomLabelDesign
): {
  name: string;
  description: string;
  pageType: string;
  gridConfig: LabelGridConfig;
  elements: LayoutElement[];
} {
  const grid = calculateLabelGrid(design.width, design.height);
  const elements = design.graphics.map(graphic =>
    convertCanvasToGrid(graphic, design.width, design.height)
  );

  // Determine page type from Avery template if available
  const pageType = design.averyTemplate
    ? `label_${design.averyTemplate}`
    : 'custom_label';

  return {
    name: design.name,
    description: design.description,
    pageType,
    gridConfig: grid,
    elements
  };
}

/**
 * Load label designs from localStorage for a project
 */
export function loadLabelDesignsFromLocalStorage(projectId: string): CustomLabelDesign[] {
  try {
    const stored = localStorage.getItem(`showstack_labelDesigns_${projectId}`);
    if (!stored) {
      return [];
    }

    const designs = JSON.parse(stored) as CustomLabelDesign[];
    return designs;
  } catch (error) {
    console.error('Failed to load label designs from localStorage:', error);
    return [];
  }
}

/**
 * Check if a project has label designs in localStorage
 */
export function hasLabelDesignsInLocalStorage(projectId: string): boolean {
  const designs = loadLabelDesignsFromLocalStorage(projectId);
  return designs.length > 0;
}

/**
 * Clear label designs from localStorage after migration
 */
export function clearLabelDesignsFromLocalStorage(projectId: string): void {
  try {
    // Don't actually delete - just mark as migrated with a backup
    const designs = loadLabelDesignsFromLocalStorage(projectId);
    if (designs.length > 0) {
      // Create backup
      const backupKey = `showstack_labelDesigns_${projectId}_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(designs));

      // Clear original
      localStorage.removeItem(`showstack_labelDesigns_${projectId}`);

      console.log(`Migrated ${designs.length} label designs. Backup created at: ${backupKey}`);
    }
  } catch (error) {
    console.error('Failed to clear label designs from localStorage:', error);
  }
}

/**
 * Get summary of label designs to be migrated
 */
export function getMigrationSummary(projectId: string): {
  totalDesigns: number;
  byTemplate: Record<string, number>;
  customDesigns: number;
} {
  const designs = loadLabelDesignsFromLocalStorage(projectId);

  const byTemplate: Record<string, number> = {};
  let customDesigns = 0;

  designs.forEach(design => {
    if (design.averyTemplate) {
      const key = `Avery ${design.averyTemplate}`;
      byTemplate[key] = (byTemplate[key] || 0) + 1;
    } else {
      customDesigns++;
    }
  });

  return {
    totalDesigns: designs.length,
    byTemplate,
    customDesigns
  };
}
