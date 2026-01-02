/**
 * Header Renderer for PDF Export
 *
 * Renders page layout templates (headers/footers) as HTML/CSS for PDF generation.
 * Loads templates from the database and converts layout elements to positioned HTML.
 */

import type { PaperworkTemplate } from '../../types/paperworkTemplate';

interface LayoutElement {
  id: string;
  template_id: string;
  element_type: 'text' | 'dataField' | 'shape' | 'image';
  config: string; // JSON string
  grid_column: number;
  grid_row: number;
  column_span: number;
  row_span: number;
  layer: number;
  style: string; // JSON string
}

interface LayoutTemplate {
  id: string;
  name: string;
  page_type: string;
  grid_columns: number;
  grid_rows: number;
  grid_gap: number;
  page_width: number;
  page_height: number;
}

interface HeaderData {
  reportTitle: string;
  productionName: string;
  ldName?: string;
  peName?: string;
  venue?: string;
  pageNumber?: number;
  totalPages?: number;
  date?: string;
}

/**
 * Load header template from database using Prep API
 */
export async function loadHeaderTemplate(templateId: string): Promise<{
  template: LayoutTemplate;
  elements: LayoutElement[];
} | null> {
  try {
    if (!window.api?.prep?.layoutTemplates) {
      console.error('Prep layout templates API not available');
      return null;
    }

    // Load template using Prep API
    const template = await window.api.prep.layoutTemplates.getById(templateId);

    if (!template) {
      console.error('Header template not found:', templateId);
      return null;
    }

    // Load elements using Prep API
    const elements = await window.api.prep.layoutTemplates.getElements(templateId);

    return {
      template: template as LayoutTemplate,
      elements: (elements || []) as LayoutElement[]
    };
  } catch (error) {
    console.error('Error loading header template:', error);
    return null;
  }
}

/**
 * Resolve data field value
 */
function resolveDataField(fieldType: string, data: HeaderData): string {
  switch (fieldType) {
    case 'report_title':
      return data.reportTitle || 'Report';
    case 'production_name':
      return data.productionName || '';
    case 'ld_name':
      return data.ldName || ''; // Empty if no LD name
    case 'pe_name':
      return data.peName || '';
    case 'venue':
      return data.venue || ''; // Empty if no venue
    case 'generated_date':
      return data.date || new Date().toLocaleDateString();
    case 'page_number':
      return data.pageNumber ? `${data.pageNumber}` : '1';
    case 'total_pages':
      return data.totalPages ? `${data.totalPages}` : '1';
    default:
      return '';
  }
}

/**
 * Render text element content
 */
function renderTextContent(content: string, data: HeaderData): string {
  // Replace placeholders
  return content
    .replace('{page}', data.pageNumber ? `${data.pageNumber}` : '1')
    .replace('{total}', data.totalPages ? `${data.totalPages}` : '1')
    .replace('{date}', data.date || new Date().toLocaleDateString());
}

/**
 * Calculate element position and size in pixels
 */
function calculateElementStyle(
  element: LayoutElement,
  template: LayoutTemplate
): string {
  const gap = template.grid_gap;

  // Calculate column/row sizes accounting for gaps
  // Total width = columns * columnWidth + (columns - 1) * gap
  const columnWidth = (template.page_width - (template.grid_columns - 1) * gap) / template.grid_columns;
  const rowHeight = (template.page_height - (template.grid_rows - 1) * gap) / template.grid_rows;

  // Position = (column index) * (column width + gap)
  const left = element.grid_column * (columnWidth + gap);
  const top = element.grid_row * (rowHeight + gap);

  // Size = (span) * column width + (span - 1) * gap
  const width = element.column_span * columnWidth + (element.column_span - 1) * gap;
  const height = element.row_span * rowHeight + (element.row_span - 1) * gap;

  // Parse style JSON
  let styleObj: any = {};
  try {
    styleObj = JSON.parse(element.style);
  } catch (e) {
    console.warn('Failed to parse element style:', element.id);
  }

  return `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    width: ${width}px;
    height: ${height}px;
    font-family: ${styleObj.fontFamily || 'Arial'};
    font-size: ${styleObj.fontSize || 12}pt;
    font-weight: ${styleObj.fontWeight || 'normal'};
    text-align: ${styleObj.textAlign || 'left'};
    color: ${styleObj.color || '#000000'};
    display: flex;
    align-items: center;
    justify-content: ${styleObj.textAlign === 'center' ? 'center' : styleObj.textAlign === 'right' ? 'flex-end' : 'flex-start'};
  `.trim();
}

/**
 * Render a single layout element as HTML
 */
function renderElement(element: LayoutElement, template: LayoutTemplate, data: HeaderData): string {
  const style = calculateElementStyle(element, template);
  let content = '';

  try {
    const config = JSON.parse(element.config);

    if (element.element_type === 'dataField') {
      const fieldValue = resolveDataField(config.fieldType, data);
      const prefix = config.prefix || '';
      const suffix = config.suffix || '';
      content = `${prefix}${fieldValue}${suffix}`;
    } else if (element.element_type === 'text') {
      content = renderTextContent(config.content || '', data);
    }
  } catch (e) {
    console.warn('Failed to parse element config:', element.id);
  }

  return `<div style="${style}">${content}</div>`;
}

/**
 * Render header template as HTML for print (simplified layout without absolute positioning)
 */
export async function renderHeaderHTML(
  templateId: string,
  data: HeaderData
): Promise<string | null> {
  const headerLayout = await loadHeaderTemplate(templateId);

  if (!headerLayout) {
    return null;
  }

  const { template, elements } = headerLayout;

  // Calculate row height
  const rowHeight = Math.floor(template.page_height / template.grid_rows);

  // Render all elements with explicit grid positioning
  const elementsHTML = elements.map(element => {
    const config = JSON.parse(element.config);
    const style = JSON.parse(element.style);
    let content = '';

    if (element.element_type === 'dataField') {
      const fieldValue = resolveDataField(config.fieldType, data);
      const prefix = config.prefix || '';
      const suffix = config.suffix || '';
      content = `${prefix}${fieldValue}${suffix}`;
    } else if (element.element_type === 'text') {
      content = renderTextContent(config.content || '', data);
    }

    // Calculate grid position (1-based for CSS grid)
    const gridColumnStart = element.grid_column + 1;
    const gridColumnEnd = gridColumnStart + element.column_span;
    const gridRowStart = element.grid_row + 1;
    const gridRowEnd = gridRowStart + element.row_span;

    return `
      <div style="
        grid-column: ${gridColumnStart} / ${gridColumnEnd};
        grid-row: ${gridRowStart} / ${gridRowEnd};
        font-family: ${style.fontFamily || 'Arial'};
        font-size: ${style.fontSize || 12}pt;
        font-weight: ${style.fontWeight || 'normal'};
        text-align: ${style.textAlign || 'left'};
        color: ${style.color || '#000000'};
        display: flex;
        align-items: center;
        justify-content: ${style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : 'flex-start'};
      ">
        ${content}
      </div>
    `;
  }).join('');

  return `
    <div style="
      display: grid;
      grid-template-columns: repeat(${template.grid_columns}, 1fr);
      grid-template-rows: repeat(${template.grid_rows}, ${rowHeight}px);
      gap: ${template.grid_gap}px;
      width: 100%;
      padding: 10px;
    ">
      ${elementsHTML}
    </div>
  `;
}

/**
 * Render header template for Electron's printToPDF headerTemplate option
 * Uses special classes like <span class="pageNumber"></span> that are replaced by Electron
 */
export async function renderHeaderTemplate(
  templateId: string,
  data: HeaderData
): Promise<string | null> {
  const headerLayout = await loadHeaderTemplate(templateId);

  if (!headerLayout) {
    return null;
  }

  const { template, elements } = headerLayout;

  // Render elements with special handling for page numbers
  const elementsHTML = elements
    .map(element => {
      const style = calculateElementStyle(element, template);
      let content = '';

      try {
        const config = JSON.parse(element.config);

        if (element.element_type === 'dataField') {
          const fieldValue = resolveDataField(config.fieldType, data);
          const prefix = config.prefix || '';
          const suffix = config.suffix || '';

          // Special handling for page numbers in header template
          if (config.fieldType === 'page_number') {
            content = `${prefix}<span class="pageNumber"></span>${suffix}`;
          } else if (config.fieldType === 'total_pages') {
            content = `${prefix}<span class="totalPages"></span>${suffix}`;
          } else {
            content = `${prefix}${fieldValue}${suffix}`;
          }
        } else if (element.element_type === 'text') {
          // Replace placeholders with Electron's special classes
          let textContent = config.content || '';
          textContent = textContent
            .replace('{page}', '<span class="pageNumber"></span>')
            .replace('{total}', '<span class="totalPages"></span>')
            .replace('{date}', data.date || new Date().toLocaleDateString());
          content = textContent;
        }
      } catch (e) {
        console.warn('Failed to parse element config:', element.id);
      }

      return `<div style="${style}">${content}</div>`;
    })
    .join('\n');

  return `
    <div style="
      position: relative;
      width: ${template.page_width}px;
      height: ${template.page_height}px;
      margin: 0 auto;
      font-size: 10px;
      -webkit-print-color-adjust: exact;
    ">
      ${elementsHTML}
    </div>
  `;
}

/**
 * Render footer HTML for inline display
 */
export function renderFooterHTML(
  userName: string,
  dataRange: string
): string {
  return `
    <div class="page-footer" style="
      width: 100%;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #d1d5db;
      font-size: 9pt;
      color: #6b7280;
    ">
      <div style="display: flex; justify-content: space-between;">
        <div>${userName} • ShowStack</div>
        <div>${dataRange}</div>
      </div>
    </div>
  `;
}

/**
 * Render footer template for Electron's printToPDF footerTemplate option
 */
export function renderFooterTemplate(
  userName: string,
  dataRange: string
): string {
  return `
    <div style="
      width: 100%;
      padding: 10px 20px;
      font-size: 9px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      -webkit-print-color-adjust: exact;
    ">
      <div>${userName} • ShowStack</div>
      <div>${dataRange}</div>
    </div>
  `;
}

/**
 * Calculate data range for report
 */
export function calculateDataRange(
  reportType: string,
  data: any[]
): string {
  if (!data || data.length === 0) {
    return 'No data';
  }

  // Determine the primary field based on report type
  let field: string;
  let label: string;

  switch (reportType) {
    case 'channel-hookup':
      field = 'channel';
      label = 'Channels';
      break;
    case 'dimmer-schedule':
      field = 'dimmer';
      label = 'Dimmers';
      break;
    case 'circuit-list':
      field = 'circuit';
      label = 'Circuits';
      break;
    case 'dmx-addresses':
      field = 'dmx_address';
      label = 'DMX';
      break;
    default:
      return `${data.length} items`;
  }

  // Find min and max values
  const values = data
    .map(item => {
      const val = item[field];
      // Handle numeric strings like "1", "2", etc.
      const num = typeof val === 'string' ? parseInt(val) : val;
      return isNaN(num) ? null : num;
    })
    .filter(v => v !== null) as number[];

  if (values.length === 0) {
    return `${data.length} items`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return `${label} ${min}`;
  }

  return `${label} ${min}–${max}`;
}
