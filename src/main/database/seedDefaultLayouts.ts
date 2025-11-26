import { createLayoutTemplate } from './queries/layoutTemplates';
import type { PrintSectionType } from '../types/prep';

/**
 * Seed default page layouts that match the professional shop order format
 * Based on ShowStack Designer templates
 */

interface LayoutElementData {
  element_type: string;
  config: string;
  grid_column: number;
  grid_row: number;
  column_span: number;
  row_span: number;
  layer: number;
  style: string;
}

export function seedDefaultPageLayouts() {
  console.log('Seeding default page layouts...');

  // Cover Page Layout
  seedCoverPageLayout();

  // Contacts & Dates Layout
  seedContactsPageLayout();

  // Equipment Layout
  seedEquipmentPageLayout();

  // Revision Summary Layout
  seedRevisionSummaryLayout();

  // Notes Layout
  seedNotesPageLayout();

  console.log('Default page layouts seeded successfully');
}

function seedCoverPageLayout() {
  const elements: Partial<LayoutElementData>[] = [
    // Production Name (top)
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'production_name',
        showLabel: false
      }),
      grid_column: 0,
      grid_row: 0,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        textAlign: 'center',
        color: '#000000',
        backgroundColor: 'transparent',
        padding: 8
      })
    },

    // Designer name with label
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ld_name',
        label: 'Lighting Designer:',
        showLabel: true
      }),
      grid_column: 0,
      grid_row: 1,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'normal',
        textAlign: 'center',
        color: '#000000',
        backgroundColor: 'transparent',
        padding: 2
      })
    },

    // Horizontal line separator
    {
      element_type: 'shape',
      config: JSON.stringify({
        shapeType: 'line',
        thickness: 1,
        color: '#000000'
      }),
      grid_column: 1,
      grid_row: 2,
      column_span: 10,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        backgroundColor: '#000000',
        padding: 0,
        marginTop: 4,
        marginBottom: 4
      })
    },

    // Logo placeholder (centered, larger)
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'logo',
        showLabel: false
      }),
      grid_column: 3,
      grid_row: 4,
      column_span: 6,
      row_span: 4,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 12,
        textAlign: 'center',
        color: '#666666',
        backgroundColor: 'transparent',
        padding: 16
      })
    },

    // Designer name again (below logo)
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ld_name',
        label: 'Lighting Designer:',
        showLabel: true
      }),
      grid_column: 0,
      grid_row: 9,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
        backgroundColor: 'transparent',
        padding: 8
      })
    },

    // Venue name
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'venue',
        showLabel: false
      }),
      grid_column: 0,
      grid_row: 11,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        color: '#000000',
        padding: 2
      })
    },

    // Venue address (city, state)
    {
      element_type: 'text',
      config: JSON.stringify({
        content: '{venue_city}, {venue_state}'
      }),
      grid_column: 0,
      grid_row: 12,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        color: '#000000',
        padding: 2
      })
    },

    // Document title
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'ELECTRICS SHOP ORDER'
      }),
      grid_column: 0,
      grid_row: 14,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 13,
        fontWeight: 'bold',
        textAlign: 'center',
        textDecoration: 'underline',
        color: '#000000',
        padding: 6
      })
    },

    // Subtitle
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'For Bid Only'
      }),
      grid_column: 0,
      grid_row: 15,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        color: '#000000',
        padding: 2
      })
    },

    // Order date
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'order_date',
        showLabel: false
      }),
      grid_column: 0,
      grid_row: 16,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        color: '#000000',
        padding: 2
      })
    },

    // Revision issued text
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'REVISION ISSUED:'
      }),
      grid_column: 0,
      grid_row: 17,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        color: '#000000',
        padding: 2
      })
    },

    // Revision number
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'current_revision',
        label: 'REVISION #',
        showLabel: true
      }),
      grid_column: 0,
      grid_row: 18,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        color: '#000000',
        padding: 2
      })
    }
  ];

  createLayoutTemplate(
    {
      name: 'Cover Page - ShowStack Default',
      description: 'Professional cover page matching ShowStack Designer format',
      page_type: 'cover' as PrintSectionType,
      grid_columns: 12,
      grid_rows: 20,
      grid_gap: 8,
      page_width: 816,
      page_height: 1056,
      is_default: true
    },
    elements as any
  );

  console.log('✓ Cover page layout created');
}

function seedContactsPageLayout() {
  const elements: Partial<LayoutElementData>[] = [
    // Production Name at top
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'production_name',
        showLabel: false
      }),
      grid_column: 0,
      grid_row: 0,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'center',
        color: '#000000',
        padding: 4
      })
    },

    // Designer name
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ld_name',
        label: 'Lighting Designer:',
        showLabel: true
      }),
      grid_column: 0,
      grid_row: 1,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        color: '#000000',
        padding: 2
      })
    },

    // Horizontal line
    {
      element_type: 'shape',
      config: JSON.stringify({
        shapeType: 'line',
        thickness: 1,
        color: '#000000'
      }),
      grid_column: 1,
      grid_row: 2,
      column_span: 10,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        backgroundColor: '#000000',
        padding: 0
      })
    },

    // Section header
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'CONTACT & IMPORTANT DATES'
      }),
      grid_column: 0,
      grid_row: 3,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
        backgroundColor: '#D1D5DB',
        padding: 8
      })
    },

    // ========== GENERAL MANAGER ==========
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'General Manager:'
      }),
      grid_column: 0,
      grid_row: 5,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#000000',
        paddingRight: 8,
        paddingTop: 4
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'gm_company',
        showLabel: false
      }),
      grid_column: 3,
      grid_row: 5,
      column_span: 4,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 4
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'gm_name',
        showLabel: false
      }),
      grid_column: 3,
      grid_row: 6,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        padding: 2
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'gm_email',
        showLabel: false
      }),
      grid_column: 6,
      grid_row: 6,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        padding: 2
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'gm_phone',
        showLabel: false
      }),
      grid_column: 9,
      grid_row: 6,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        padding: 2
      })
    },

    // ========== PRODUCTION MANAGER ==========
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Production Manager:'
      }),
      grid_column: 0,
      grid_row: 7,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#000000',
        paddingRight: 8,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'pm_company',
        showLabel: false
      }),
      grid_column: 3,
      grid_row: 7,
      column_span: 4,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'pm_name',
        showLabel: false
      }),
      grid_column: 3,
      grid_row: 8,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        padding: 2
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'pm_email',
        showLabel: false
      }),
      grid_column: 6,
      grid_row: 8,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        padding: 2
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'pm_phone',
        showLabel: false
      }),
      grid_column: 9,
      grid_row: 8,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        padding: 2
      })
    },

    // ========== LIGHTING DESIGNER ==========
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Lighting Designer:'
      }),
      grid_column: 0,
      grid_row: 9,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#000000',
        paddingRight: 8,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ld_name',
        showLabel: false
      }),
      grid_column: 3,
      grid_row: 9,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ld_email',
        showLabel: false
      }),
      grid_column: 6,
      grid_row: 9,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ld_phone',
        showLabel: false
      }),
      grid_column: 9,
      grid_row: 9,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },

    // ========== ASSOCIATE LIGHTING DESIGNER ==========
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Associate Lighting Designer:'
      }),
      grid_column: 0,
      grid_row: 10,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#000000',
        paddingRight: 8,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ald_name',
        showLabel: false
      }),
      grid_column: 3,
      grid_row: 10,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ald_email',
        showLabel: false
      }),
      grid_column: 6,
      grid_row: 10,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ald_phone',
        showLabel: false
      }),
      grid_column: 9,
      grid_row: 10,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },

    // ========== PRODUCTION ELECTRICIAN ==========
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Production Electrician:'
      }),
      grid_column: 0,
      grid_row: 11,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#000000',
        paddingRight: 8,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'pe_name',
        showLabel: false
      }),
      grid_column: 3,
      grid_row: 11,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'pe_email',
        showLabel: false
      }),
      grid_column: 6,
      grid_row: 11,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'pe_phone',
        showLabel: false
      }),
      grid_column: 9,
      grid_row: 11,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 8
      })
    },

    // ========== SHOW DATES ==========
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Shop Prep'
      }),
      grid_column: 1,
      grid_row: 14,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        paddingRight: 8,
        paddingTop: 12
      })
    },
    {
      element_type: 'text',
      config: JSON.stringify({
        content: '{prep_start_date} to {prep_end_date}'
      }),
      grid_column: 4,
      grid_row: 14,
      column_span: 4,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        paddingTop: 12
      })
    },
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Load In'
      }),
      grid_column: 1,
      grid_row: 15,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        paddingRight: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'load_in_date',
        showLabel: false
      }),
      grid_column: 4,
      grid_row: 15,
      column_span: 4,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10
      })
    },
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'First Preview'
      }),
      grid_column: 1,
      grid_row: 16,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        paddingRight: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'first_preview_date',
        showLabel: false
      }),
      grid_column: 4,
      grid_row: 16,
      column_span: 4,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10
      })
    },
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Opening Night'
      }),
      grid_column: 1,
      grid_row: 17,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        paddingRight: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'opening_night_date',
        showLabel: false
      }),
      grid_column: 4,
      grid_row: 17,
      column_span: 4,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10
      })
    },
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Closing Night'
      }),
      grid_column: 1,
      grid_row: 18,
      column_span: 3,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        paddingRight: 8
      })
    },
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'closing_date',
        showLabel: false
      }),
      grid_column: 4,
      grid_row: 18,
      column_span: 4,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10
      })
    },

    // Footer note
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Please confirm all dates with Production Management'
      }),
      grid_column: 0,
      grid_row: 19,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        textAlign: 'center',
        color: '#000000',
        paddingTop: 12
      })
    }
  ];

  createLayoutTemplate(
    {
      name: 'Contacts & Dates - ShowStack Default',
      description: 'Contact information and schedule matching ShowStack Designer format',
      page_type: 'contacts' as PrintSectionType,
      grid_columns: 12,
      grid_rows: 20,
      grid_gap: 4,
      page_width: 816,
      page_height: 1056,
      is_default: true
    },
    elements as any
  );

  console.log('✓ Contacts & Dates page layout created');
}

function seedEquipmentPageLayout() {
  // This layout will be dynamically generated based on sections
  // We create a basic header structure here
  const elements: Partial<LayoutElementData>[] = [
    // Production Name at top
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'production_name',
        showLabel: false
      }),
      grid_column: 0,
      grid_row: 0,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 14,
        textAlign: 'center',
        padding: 4
      })
    },

    // Designer name
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ld_name',
        label: 'Lighting Designer:',
        showLabel: true
      }),
      grid_column: 0,
      grid_row: 1,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        padding: 2
      })
    },

    // Horizontal line
    {
      element_type: 'shape',
      config: JSON.stringify({
        shapeType: 'line',
        thickness: 1,
        color: '#000000'
      }),
      grid_column: 1,
      grid_row: 2,
      column_span: 10,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        backgroundColor: '#000000'
      })
    },

    // Shop order title
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'SHOP ORDER - REVISION {revision_number}'
      }),
      grid_column: 0,
      grid_row: 3,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 6
      })
    },

    // Revised as of date
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Revised as of {revision_date}'
      }),
      grid_column: 0,
      grid_row: 4,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 2
      })
    },

    // LIGHTING ORDER header (dark)
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'LIGHTING ORDER'
      }),
      grid_column: 0,
      grid_row: 5,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#FFFFFF',
        backgroundColor: '#374151',
        padding: 8
      })
    },

    // MAIN ORDER header (light)
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'MAIN ORDER'
      }),
      grid_column: 0,
      grid_row: 6,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
        backgroundColor: '#DBEAFE',
        padding: 6,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#3B82F6'
      })
    }
  ];

  createLayoutTemplate(
    {
      name: 'Equipment List - ShowStack Default',
      description: 'Equipment sections matching ShowStack Designer format',
      page_type: 'equipment-by-section' as PrintSectionType,
      grid_columns: 12,
      grid_rows: 24,
      grid_gap: 4,
      page_width: 816,
      page_height: 1056,
      is_default: true
    },
    elements as any
  );

  console.log('✓ Equipment page layout created');
}

function seedRevisionSummaryLayout() {
  const elements: Partial<LayoutElementData>[] = [
    // Production Name at top
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'production_name',
        showLabel: false
      }),
      grid_column: 0,
      grid_row: 0,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 14,
        textAlign: 'center',
        padding: 4
      })
    },

    // Designer name
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ld_name',
        label: 'Lighting Designer:',
        showLabel: true
      }),
      grid_column: 0,
      grid_row: 1,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        padding: 2
      })
    },

    // Horizontal line
    {
      element_type: 'shape',
      config: JSON.stringify({
        shapeType: 'line',
        thickness: 1,
        color: '#000000'
      }),
      grid_column: 1,
      grid_row: 2,
      column_span: 10,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        backgroundColor: '#000000'
      })
    },

    // Revision change log title
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'REVISION {revision_number} CHANGE LOG'
      }),
      grid_column: 0,
      grid_row: 3,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 13,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#FEF3C7',
        padding: 8
      })
    },

    // Subtitle with stats
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Issued on {revision_date} | {total_items} total items | {increases} increases, {decreases} decreases, {new_items} new items'
      }),
      grid_column: 0,
      grid_row: 4,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 9,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 4
      })
    },

    // Legend title
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'REVISION CHANGE LEGEND'
      }),
      grid_column: 0,
      grid_row: 6,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 6
      })
    },

    // Legend: Increased
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Item quantity increased from previous revision'
      }),
      grid_column: 0,
      grid_row: 7,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 9,
        backgroundColor: '#D1FAE5',
        padding: 6
      })
    },

    // Legend: Decreased
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Item quantity decreased from previous revision'
      }),
      grid_column: 0,
      grid_row: 8,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 9,
        backgroundColor: '#FEE2E2',
        padding: 6
      })
    },

    // Legend: New
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'New item added in this revision'
      }),
      grid_column: 0,
      grid_row: 9,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 9,
        backgroundColor: '#FEF9C3',
        padding: 6
      })
    },

    // Legend: Modified
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'Item modified from previous revision'
      }),
      grid_column: 0,
      grid_row: 10,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 9,
        backgroundColor: '#DBEAFE',
        padding: 6
      })
    },

    // Detailed changes title
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'DETAILED CHANGES:'
      }),
      grid_column: 0,
      grid_row: 12,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'bold',
        paddingTop: 12,
        paddingBottom: 6
      })
    },

    // Previous revisions title
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'PREVIOUS REVISIONS:'
      }),
      grid_column: 0,
      grid_row: 18,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: 'bold',
        paddingTop: 12
      })
    }
  ];

  createLayoutTemplate(
    {
      name: 'Revision Summary - ShowStack Default',
      description: 'Revision change log matching ShowStack Designer format',
      page_type: 'revision-summary' as PrintSectionType,
      grid_columns: 12,
      grid_rows: 20,
      grid_gap: 4,
      page_width: 816,
      page_height: 1056,
      is_default: true
    },
    elements as any
  );

  console.log('✓ Revision Summary page layout created');
}

function seedNotesPageLayout() {
  const elements: Partial<LayoutElementData>[] = [
    // Production Name at top
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'production_name',
        showLabel: false
      }),
      grid_column: 0,
      grid_row: 0,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 14,
        textAlign: 'center',
        padding: 4
      })
    },

    // Designer name
    {
      element_type: 'dataField',
      config: JSON.stringify({
        fieldType: 'ld_name',
        label: 'Lighting Designer:',
        showLabel: true
      }),
      grid_column: 0,
      grid_row: 1,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 11,
        textAlign: 'center',
        padding: 2
      })
    },

    // Horizontal line
    {
      element_type: 'shape',
      config: JSON.stringify({
        shapeType: 'line',
        thickness: 1,
        color: '#000000'
      }),
      grid_column: 1,
      grid_row: 2,
      column_span: 10,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        backgroundColor: '#000000'
      })
    },

    // Section header
    {
      element_type: 'text',
      config: JSON.stringify({
        content: 'GENERAL NOTES & CONDITIONS'
      }),
      grid_column: 0,
      grid_row: 3,
      column_span: 12,
      row_span: 1,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
        backgroundColor: '#D1D5DB',
        padding: 10
      })
    },

    // Notes content area (placeholder - actual content rendered dynamically)
    {
      element_type: 'text',
      config: JSON.stringify({
        content: '{notes_content}'
      }),
      grid_column: 0,
      grid_row: 5,
      column_span: 12,
      row_span: 14,
      layer: 0,
      style: JSON.stringify({
        fontFamily: 'Arial',
        fontSize: 10,
        textAlign: 'left',
        color: '#000000',
        backgroundColor: 'transparent',
        padding: 16,
        lineHeight: 1.4
      })
    }
  ];

  createLayoutTemplate(
    {
      name: 'Notes - ShowStack Default',
      description: 'General notes and conditions matching ShowStack Designer format',
      page_type: 'notes' as PrintSectionType,
      grid_columns: 12,
      grid_rows: 20,
      grid_gap: 4,
      page_width: 816,
      page_height: 1056,
      is_default: true
    },
    elements as any
  );

  console.log('✓ Notes page layout created');
}
