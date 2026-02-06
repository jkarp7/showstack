/**
 * Default Paperwork Header Layout Template
 * System default header for all paperwork reports
 */

import { v4 as uuidv4 } from 'uuid';

export interface DefaultHeaderLayout {
  template: {
    id: string;
    user_id?: string;
    name: string;
    description: string;
    page_type: string;
    grid_columns: number;
    grid_rows: number;
    grid_gap: number;
    page_width: number;
    page_height: number;
    is_default: number;
    created_at: number;
    updated_at: number;
  };
  elements: Array<{
    id: string;
    template_id: string;
    element_type: string;
    config: string;
    grid_column: number;
    grid_row: number;
    column_span: number;
    row_span: number;
    layer: number;
    style: string;
    created_at: number;
    updated_at: number;
  }>;
}

export function getDefaultPaperworkHeader(): DefaultHeaderLayout {
  const now = Date.now();
  const templateId = 'default-paperwork-header';

  return {
    template: {
      id: templateId,
      name: 'Default Paperwork Header',
      description: 'System default header for all paperwork reports',
      page_type: 'paperwork-header',
      grid_columns: 12,
      grid_rows: 3,
      grid_gap: 8,
      page_width: 816, // 8.5" at 96 DPI
      page_height: 120, // Compact header height
      is_default: 1,
      created_at: now,
      updated_at: now,
    },
    elements: [
      // Report Name - Top Center, Bold, 18pt
      {
        id: uuidv4(),
        template_id: templateId,
        element_type: 'dataField',
        config: JSON.stringify({
          fieldType: 'report_title',
          label: 'Report Title',
          fallbackText: 'Report',
        }),
        grid_column: 4,
        grid_row: 0,
        column_span: 5,
        row_span: 1,
        layer: 1,
        style: JSON.stringify({
          fontFamily: 'Arial',
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#1f2937',
        }),
        created_at: now,
        updated_at: now,
      },

      // Show Name - Top Left, 14pt
      {
        id: uuidv4(),
        template_id: templateId,
        element_type: 'dataField',
        config: JSON.stringify({
          fieldType: 'production_name',
          label: 'Show Name',
          fallbackText: 'Production',
        }),
        grid_column: 0,
        grid_row: 0,
        column_span: 4,
        row_span: 1,
        layer: 1,
        style: JSON.stringify({
          fontFamily: 'Arial',
          fontSize: 14,
          fontWeight: 'normal',
          textAlign: 'left',
          color: '#374151',
        }),
        created_at: now,
        updated_at: now,
      },

      // Date - Top Right, 12pt
      {
        id: uuidv4(),
        template_id: templateId,
        element_type: 'dataField',
        config: JSON.stringify({
          fieldType: 'generated_date',
          label: 'Date',
          fallbackText: new Date().toLocaleDateString(),
        }),
        grid_column: 9,
        grid_row: 0,
        column_span: 3,
        row_span: 1,
        layer: 1,
        style: JSON.stringify({
          fontFamily: 'Arial',
          fontSize: 12,
          fontWeight: 'normal',
          textAlign: 'right',
          color: '#6b7280',
        }),
        created_at: now,
        updated_at: now,
      },

      // LD Name - Row 3, Left aligned, 10pt
      {
        id: uuidv4(),
        template_id: templateId,
        element_type: 'dataField',
        config: JSON.stringify({
          fieldType: 'ld_name',
          label: 'Lighting Designer',
          fallbackText: '',
          prefix: 'LD: ',
        }),
        grid_column: 0,
        grid_row: 2,
        column_span: 6,
        row_span: 1,
        layer: 1,
        style: JSON.stringify({
          fontFamily: 'Arial',
          fontSize: 10,
          fontWeight: 'normal',
          textAlign: 'left',
          color: '#374151',
        }),
        created_at: now,
        updated_at: now,
      },

      // Venue - Row 3, Right aligned, 10pt
      {
        id: uuidv4(),
        template_id: templateId,
        element_type: 'dataField',
        config: JSON.stringify({
          fieldType: 'venue',
          label: 'Venue',
          fallbackText: '',
        }),
        grid_column: 6,
        grid_row: 2,
        column_span: 6,
        row_span: 1,
        layer: 1,
        style: JSON.stringify({
          fontFamily: 'Arial',
          fontSize: 10,
          fontWeight: 'normal',
          textAlign: 'right',
          color: '#374151',
        }),
        created_at: now,
        updated_at: now,
      },
    ],
  };
}
