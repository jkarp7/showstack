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
  element_type: 'text' | 'data-field' | 'shape' | 'image';
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
 * Load header template from database
 */
export async function loadHeaderTemplate(templateId: string): Promise<{
  template: LayoutTemplate;
  elements: LayoutElement[];
} | null> {
  try {
    if (!window.api?.database) {
      console.error('Database API not available');
      return null;
    }

    // Load template
    const templateQuery = `
      SELECT id, name, page_type, grid_columns, grid_rows, grid_gap, page_width, page_height
      FROM page_layout_templates
      WHERE id = ?
    `;
    const templateResult = await window.api.database.query(templateQuery, [templateId]);

    if (!templateResult || templateResult.length === 0) {
      console.error('Header template not found:', templateId);
      return null;
    }

    const template = templateResult[0] as LayoutTemplate;

    // Load elements
    const elementsQuery = `
      SELECT id, template_id, element_type, config, grid_column, grid_row,
             column_span, row_span, layer, style
      FROM page_layout_elements
      WHERE template_id = ?
      ORDER BY layer ASC, grid_row ASC, grid_column ASC
    `;
    const elementsResult = await window.api.database.query(elementsQuery, [templateId]);

    const elements = (elementsResult || []) as LayoutElement[];

    return { template, elements };
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
      return data.ldName || 'Lighting Designer';
    case 'pe_name':
      return data.peName || '';
    case 'venue':
      return data.venue || '';
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
  const columnWidth = template.page_width / template.grid_columns;
  const rowHeight = template.page_height / template.grid_rows;
  const gap = template.grid_gap;

  const left = element.grid_column * columnWidth + element.grid_column * gap;
  const top = element.grid_row * rowHeight + element.grid_row * gap;
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

    if (element.element_type === 'data-field') {
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
 * Render header template as HTML
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

  // Render all elements
  const elementsHTML = elements
    .map(element => renderElement(element, template, data))
    .join('\n');

  return `
    <div class="page-header" style="
      position: relative;
      width: ${template.page_width}px;
      height: ${template.page_height}px;
      margin: 0 auto;
      margin-bottom: 20px;
    ">
      ${elementsHTML}
    </div>
  `;
}

/**
 * Render footer HTML
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
