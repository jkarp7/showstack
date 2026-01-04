/**
 * Label Grid Calculator
 *
 * Converts label dimensions (inches) to grid-based layout configuration
 * for use with the unified visual editor system.
 *
 * Grid Resolution: 4 cells per inch
 * - Provides sufficient precision for text and graphics
 * - Maintains simplicity for user interaction
 * - Example: 2.625" × 1" label = 10.5×4 grid (rounded to 11×4)
 */

export interface LabelGridConfig {
  columns: number;
  rows: number;
  pageWidth: number;
  pageHeight: number;
  gridGap: number;
}

export interface AveryTemplate {
  code: string;
  name: string;
  widthInches: number;
  heightInches: number;
  labelsPerRow: number;
  labelsPerColumn: number;
  topMargin: number;
  leftMargin: number;
  horizontalGap: number;
  verticalGap: number;
}

/**
 * Avery template specifications
 * Dimensions in points (1 inch = 72 points)
 */
export const AVERY_TEMPLATES: Record<string, AveryTemplate> = {
  '5160': {
    code: '5160',
    name: 'Address Labels',
    widthInches: 2.625,
    heightInches: 1.0,
    labelsPerRow: 3,
    labelsPerColumn: 10,
    topMargin: 36,
    leftMargin: 11.25,
    horizontalGap: 9,
    verticalGap: 0
  },
  '5163': {
    code: '5163',
    name: 'Shipping Labels',
    widthInches: 4.0,
    heightInches: 2.0,
    labelsPerRow: 2,
    labelsPerColumn: 5,
    topMargin: 36,
    leftMargin: 11.25,
    horizontalGap: 13.5,
    verticalGap: 0
  },
  '5164': {
    code: '5164',
    name: 'Shipping Labels',
    widthInches: 4.0,
    heightInches: 3.33,
    labelsPerRow: 2,
    labelsPerColumn: 3,
    topMargin: 36,
    leftMargin: 11.25,
    horizontalGap: 13.5,
    verticalGap: 0
  },
  '8160': {
    code: '8160',
    name: 'Address Labels',
    widthInches: 2.625,
    heightInches: 1.0,
    labelsPerRow: 3,
    labelsPerColumn: 10,
    topMargin: 36,
    leftMargin: 11.25,
    horizontalGap: 9,
    verticalGap: 0
  },
  '5167': {
    code: '5167',
    name: 'Return Address Labels',
    widthInches: 1.75,
    heightInches: 0.5,
    labelsPerRow: 4,
    labelsPerColumn: 20,
    topMargin: 36,
    leftMargin: 11.25,
    horizontalGap: 9,
    verticalGap: 0
  }
};

/**
 * Calculate grid configuration from label dimensions
 *
 * @param widthInches Label width in inches
 * @param heightInches Label height in inches
 * @param cellsPerInch Grid resolution (default: 4 cells per inch)
 * @returns Grid configuration for LayoutDesigner
 */
export function calculateLabelGrid(
  widthInches: number,
  heightInches: number,
  cellsPerInch: number = 4
): LabelGridConfig {
  // Calculate grid dimensions
  const columns = Math.round(widthInches * cellsPerInch);
  const rows = Math.round(heightInches * cellsPerInch);

  // Convert to points (72 DPI standard)
  const pageWidth = Math.round(widthInches * 72);
  const pageHeight = Math.round(heightInches * 72);

  return {
    columns,
    rows,
    pageWidth,
    pageHeight,
    gridGap: 2 // Small gap for visual alignment in designer
  };
}

/**
 * Get grid configuration for an Avery template by code
 *
 * @param templateCode Avery template code (e.g., '5160', '5163')
 * @returns Grid configuration or null if template not found
 */
export function getAveryGridConfig(templateCode: string): LabelGridConfig | null {
  const template = AVERY_TEMPLATES[templateCode];

  if (!template) {
    return null;
  }

  return calculateLabelGrid(template.widthInches, template.heightInches);
}

/**
 * Get all available Avery templates
 *
 * @returns Array of Avery template specifications
 */
export function getAveryTemplates(): AveryTemplate[] {
  return Object.values(AVERY_TEMPLATES);
}

/**
 * Get Avery template by code
 *
 * @param templateCode Avery template code
 * @returns Template specification or null
 */
export function getAveryTemplate(templateCode: string): AveryTemplate | null {
  return AVERY_TEMPLATES[templateCode] || null;
}

/**
 * Calculate cell dimensions for a label grid
 *
 * @param gridConfig Grid configuration
 * @returns Cell width and height in pixels
 */
export function calculateCellDimensions(gridConfig: LabelGridConfig): {
  cellWidth: number;
  cellHeight: number;
} {
  const { pageWidth, pageHeight, columns, rows, gridGap } = gridConfig;

  // Account for gaps when calculating cell size
  const cellWidth = (pageWidth - (columns - 1) * gridGap) / columns;
  const cellHeight = (pageHeight - (rows - 1) * gridGap) / rows;

  return { cellWidth, cellHeight };
}
