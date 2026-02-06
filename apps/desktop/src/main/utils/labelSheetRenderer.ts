// @ts-nocheck
/**
 * Label Sheet Renderer
 *
 * Renders multi-label sheets for PDF export using Avery template specifications.
 * Creates properly spaced grid layouts for standard label sheets.
 */

import type { LabelData } from '../../renderer/src/utils/prep/labelDataMapper';

/**
 * Avery template specification (dimensions in points, 1 inch = 72 points)
 */
export interface AverySpec {
  code: string;
  name: string;
  labelsPerRow: number;
  labelsPerColumn: number;
  labelWidth: number;  // points
  labelHeight: number; // points
  topMargin: number;   // points
  leftMargin: number;  // points
  horizontalGap: number; // points
  verticalGap: number;   // points
}

/**
 * Avery template specifications
 * All dimensions in points (72 points = 1 inch)
 */
export const AVERY_SPECS: Record<string, AverySpec> = {
  '5160': {
    code: '5160',
    name: 'Address Labels',
    labelsPerRow: 3,
    labelsPerColumn: 10,
    labelWidth: 189,  // 2.625"
    labelHeight: 72,  // 1"
    topMargin: 36,    // 0.5"
    leftMargin: 11.25, // ~0.156"
    horizontalGap: 9,  // ~0.125"
    verticalGap: 0
  },
  '5163': {
    code: '5163',
    name: 'Shipping Labels',
    labelsPerRow: 2,
    labelsPerColumn: 5,
    labelWidth: 288,  // 4"
    labelHeight: 144, // 2"
    topMargin: 36,    // 0.5"
    leftMargin: 11.25,
    horizontalGap: 13.5,
    verticalGap: 0
  },
  '5164': {
    code: '5164',
    name: 'Shipping Labels',
    labelsPerRow: 2,
    labelsPerColumn: 3,
    labelWidth: 288,  // 4"
    labelHeight: 239.76, // 3.33"
    topMargin: 36,    // 0.5"
    leftMargin: 11.25,
    horizontalGap: 13.5,
    verticalGap: 0
  },
  '8160': {
    code: '8160',
    name: 'Address Labels',
    labelsPerRow: 3,
    labelsPerColumn: 10,
    labelWidth: 189,  // 2.625"
    labelHeight: 72,  // 1"
    topMargin: 36,    // 0.5"
    leftMargin: 11.25,
    horizontalGap: 9,
    verticalGap: 0
  },
  '5167': {
    code: '5167',
    name: 'Return Address Labels',
    labelsPerRow: 4,
    labelsPerColumn: 20,
    labelWidth: 126,  // 1.75"
    labelHeight: 36,  // 0.5"
    topMargin: 36,    // 0.5"
    leftMargin: 11.25,
    horizontalGap: 9,
    verticalGap: 0
  }
};

/**
 * Layout element for rendering
 */
interface LayoutElement {
  element_type: string;
  config: any;
  grid_column: number;
  grid_row: number;
  column_span: number;
  row_span: number;
  style: any;
}

/**
 * Page layout template
 */
interface PageLayoutTemplate {
  id: string;
  name: string;
  page_type: string;
  grid_columns: number;
  grid_rows: number;
  grid_gap: number;
  page_width: number;
  page_height: number;
  config?: {
    backgroundColor?: string;
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Render a single label element with data
 */
function renderElement(
  element: LayoutElement,
  template: PageLayoutTemplate,
  data: LabelData
): string {
  const gap = template.grid_gap;
  const columnWidth = (template.page_width - (template.grid_columns - 1) * gap) / template.grid_columns;
  const rowHeight = (template.page_height - (template.grid_rows - 1) * gap) / template.grid_rows;

  // Calculate position and size
  const left = element.grid_column * (columnWidth + gap);
  const top = element.grid_row * (rowHeight + gap);
  const width = element.column_span * columnWidth + (element.column_span - 1) * gap;
  const height = element.row_span * rowHeight + (element.row_span - 1) * gap;

  let content = '';

  // Render based on element type
  if (element.element_type === 'dataField') {
    // Map data field to label data
    const fieldType = element.config.fieldType || '';
    const fieldValue = (data as any)[fieldType] || '';
    const prefix = element.config.prefix || '';
    const suffix = element.config.suffix || '';
    content = escapeHtml(`${prefix}${fieldValue}${suffix}`);
  } else if (element.element_type === 'text') {
    content = escapeHtml(element.config.content || '');
  } else if (element.element_type === 'image') {
    const imageSrc = element.config.src || '';
    const objectFit = element.config.objectFit || 'contain';
    if (imageSrc) {
      content = `<img src="${imageSrc}" alt="${element.config.altText || 'Image'}" style="width: 100%; height: 100%; object-fit: ${objectFit};" />`;
    }
  } else if (element.element_type === 'shape') {
    const shapeType = element.config.shapeType || 'rectangle';
    const color = element.config.color || '#000000';
    const thickness = element.config.thickness || 1;

    if (shapeType === 'rectangle') {
      content = `<div style="width: 100%; height: 100%; border: ${thickness}px solid ${color};"></div>`;
    } else if (shapeType === 'line' || shapeType === 'divider') {
      content = `<div style="width: 100%; height: ${thickness}px; background-color: ${color};"></div>`;
    }
  }

  // Build element style
  const style = element.style || {};
  const isImageOrShape = element.element_type === 'image' || element.element_type === 'shape';

  return `
    <div style="
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
      font-family: ${style.fontFamily || 'Arial'};
      font-size: ${style.fontSize || 12}pt;
      font-weight: ${style.fontWeight || 'normal'};
      text-align: ${style.textAlign || 'left'};
      color: ${style.color || '#000000'};
      display: flex;
      align-items: ${isImageOrShape ? 'stretch' : 'center'};
      justify-content: ${isImageOrShape ? 'stretch' : (style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : 'flex-start')};
      overflow: hidden;
    ">
      ${content}
    </div>
  `;
}

/**
 * Render a single label with template and data
 */
function renderSingleLabel(
  template: PageLayoutTemplate,
  elements: LayoutElement[],
  data: LabelData
): string {
  const elementsHTML = elements.map(el => renderElement(el, template, data)).join('');
  const backgroundColor = template.config?.backgroundColor || '#ffffff';

  return `
    <div style="
      position: relative;
      width: ${template.page_width}px;
      height: ${template.page_height}px;
      background-color: ${backgroundColor};
      overflow: hidden;
    ">
      ${elementsHTML}
    </div>
  `;
}

/**
 * Render a multi-label sheet page
 */
export function renderLabelSheet(
  template: PageLayoutTemplate,
  elements: LayoutElement[],
  dataArray: LabelData[],
  averyCode: string
): string {
  const spec = AVERY_SPECS[averyCode];

  if (!spec) {
    throw new Error(`Unknown Avery template: ${averyCode}`);
  }

  const labelsPerPage = spec.labelsPerRow * spec.labelsPerColumn;
  const pages: string[] = [];

  // Split data into pages
  for (let pageStart = 0; pageStart < dataArray.length; pageStart += labelsPerPage) {
    const pageData = dataArray.slice(pageStart, pageStart + labelsPerPage);
    const labelsHTML: string[] = [];

    // Render each label on this page
    for (let i = 0; i < labelsPerPage; i++) {
      const data = pageData[i];
      const labelHTML = data
        ? renderSingleLabel(template, elements, data)
        : `<div style="width: ${template.page_width}px; height: ${template.page_height}px;"></div>`;

      labelsHTML.push(labelHTML);
    }

    // Create page with grid layout
    const pageHTML = `
      <div class="page" style="
        position: relative;
        width: 8.5in;
        height: 11in;
        padding: ${spec.topMargin}px 0 0 ${spec.leftMargin}px;
        page-break-after: always;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      ">
        <div style="
          display: grid;
          grid-template-columns: repeat(${spec.labelsPerRow}, ${spec.labelWidth}px);
          grid-template-rows: repeat(${spec.labelsPerColumn}, ${spec.labelHeight}px);
          gap: ${spec.verticalGap}px ${spec.horizontalGap}px;
        ">
          ${labelsHTML.join('\n')}
        </div>
      </div>
    `;

    pages.push(pageHTML);
  }

  // Wrap in HTML document
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page:last-child {
          page-break-after: avoid;
        }
        @page {
          size: letter;
          margin: 0;
        }
      </style>
    </head>
    <body>
      ${pages.join('\n')}
    </body>
    </html>
  `;
}

/**
 * Get Avery spec by code
 */
export function getAverySpec(code: string): AverySpec | null {
  return AVERY_SPECS[code] || null;
}

/**
 * Calculate number of pages needed for a label count
 */
export function calculatePageCount(labelCount: number, averyCode: string): number {
  const spec = AVERY_SPECS[averyCode];
  if (!spec) return 0;

  const labelsPerPage = spec.labelsPerRow * spec.labelsPerColumn;
  return Math.ceil(labelCount / labelsPerPage);
}
