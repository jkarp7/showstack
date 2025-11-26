import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { formatNoteContentAsHTML } from '../utils/noteFormatting';
import {
  // Projects
  getAllPrepProjects,
  getPrepProjectById,
  createPrepProject,
  updatePrepProject,
  deletePrepProject,
  PrepProject,
  // Sections
  getSectionsByProjectId,
  createPrepSection,
  updatePrepSection,
  deletePrepSection,
  PrepSection,
  // Equipment Items
  getItemsBySectionId,
  getItemsByProjectId,
  createPrepEquipmentItem,
  updatePrepEquipmentItem,
  deletePrepEquipmentItem,
  PrepEquipmentItem,
  // Revisions
  getRevisionsByProjectId,
  createPrepRevision,
  deletePrepRevision,
  PrepRevision,
  // Notes
  getNotesByProjectId,
  createPrepNote,
  updatePrepNote,
  deletePrepNote,
  PrepNote,
  // Note Templates
  getAllNoteTemplates,
  getNoteTemplateById,
  getDefaultNoteTemplate,
  createNoteTemplate,
  updateNoteTemplate,
  deleteNoteTemplate,
  PrepNoteTemplate,
} from '../database/queries/prep';
import {
  // Layout Templates (app-level user preferences)
  getAllLayoutTemplates,
  getLayoutTemplateById,
  getLayoutElementsByTemplateId,
  createLayoutTemplate,
  updateLayoutTemplate,
  deleteLayoutTemplate,
  getDefaultLayoutTemplate,
  PageLayoutTemplate,
  LayoutElement,
} from '../database/queries/layoutTemplates';
import { seedDefaultPageLayouts } from '../database/seedDefaultLayouts';
import { prepFileService } from '../services/prepFileService';

export function registerPrepHandlers(): void {
  // ============================================
  // PREP PROJECTS
  // ============================================

  ipcMain.handle('prep:projects:getAll', async () => {
    try {
      return getAllPrepProjects();
    } catch (error) {
      console.error('Error getting prep projects:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:projects:getById', async (_event, id: string) => {
    try {
      return getPrepProjectById(id);
    } catch (error) {
      console.error('Error getting prep project:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:projects:create', async (_event, data: Partial<PrepProject>) => {
    try {
      return createPrepProject(data);
    } catch (error) {
      console.error('Error creating prep project:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'prep:projects:update',
    async (_event, id: string, updates: Partial<PrepProject>) => {
      try {
        return updatePrepProject(id, updates);
      } catch (error) {
        console.error('Error updating prep project:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:projects:delete', async (_event, id: string) => {
    try {
      deletePrepProject(id);
    } catch (error) {
      console.error('Error deleting prep project:', error);
      throw error;
    }
  });

  // ============================================
  // PREP SECTIONS
  // ============================================

  ipcMain.handle('prep:sections:getByProjectId', async (_event, projectId: string) => {
    try {
      return getSectionsByProjectId(projectId);
    } catch (error) {
      console.error('Error getting prep sections:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:sections:create', async (_event, data: Partial<PrepSection>) => {
    try {
      return createPrepSection(data);
    } catch (error) {
      console.error('Error creating prep section:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'prep:sections:update',
    async (_event, id: string, updates: Partial<PrepSection>) => {
      try {
        return updatePrepSection(id, updates);
      } catch (error) {
        console.error('Error updating prep section:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:sections:delete', async (_event, id: string) => {
    try {
      deletePrepSection(id);
    } catch (error) {
      console.error('Error deleting prep section:', error);
      throw error;
    }
  });

  // ============================================
  // PREP EQUIPMENT ITEMS
  // ============================================

  ipcMain.handle('prep:items:getBySectionId', async (_event, sectionId: string) => {
    try {
      return getItemsBySectionId(sectionId);
    } catch (error) {
      console.error('Error getting prep items by section:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:items:getByProjectId', async (_event, projectId: string) => {
    try {
      return getItemsByProjectId(projectId);
    } catch (error) {
      console.error('Error getting prep items by project:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:items:create', async (_event, data: Partial<PrepEquipmentItem>) => {
    try {
      return createPrepEquipmentItem(data);
    } catch (error) {
      console.error('Error creating prep item:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'prep:items:update',
    async (_event, id: string, updates: Partial<PrepEquipmentItem>) => {
      try {
        return updatePrepEquipmentItem(id, updates);
      } catch (error) {
        console.error('Error updating prep item:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:items:delete', async (_event, id: string) => {
    try {
      deletePrepEquipmentItem(id);
    } catch (error) {
      console.error('Error deleting prep item:', error);
      throw error;
    }
  });

  // ============================================
  // PREP REVISIONS
  // ============================================

  ipcMain.handle('prep:revisions:getByProjectId', async (_event, projectId: string) => {
    try {
      return getRevisionsByProjectId(projectId);
    } catch (error) {
      console.error('Error getting prep revisions:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:revisions:create', async (_event, data: Partial<PrepRevision>) => {
    try {
      return createPrepRevision(data);
    } catch (error) {
      console.error('Error creating prep revision:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:revisions:delete', async (_event, id: string) => {
    try {
      deletePrepRevision(id);
    } catch (error) {
      console.error('Error deleting prep revision:', error);
      throw error;
    }
  });

  // ============================================
  // PREP NOTES
  // ============================================

  ipcMain.handle(
    'prep:notes:getByProjectId',
    async (_event, projectId: string, type?: string) => {
      try {
        return getNotesByProjectId(projectId, type);
      } catch (error) {
        console.error('Error getting prep notes:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:notes:create', async (_event, data: Partial<PrepNote>) => {
    try {
      return createPrepNote(data);
    } catch (error) {
      console.error('Error creating prep note:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:notes:update', async (_event, id: string, updates: { content?: string; format?: string }) => {
    try {
      return updatePrepNote(id, updates);
    } catch (error) {
      console.error('Error updating prep note:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:notes:delete', async (_event, id: string) => {
    try {
      deletePrepNote(id);
    } catch (error) {
      console.error('Error deleting prep note:', error);
      throw error;
    }
  });

  // ============================================
  // PREP NOTE TEMPLATES
  // ============================================

  ipcMain.handle('prep:noteTemplates:getAll', async (_event, type?: string) => {
    try {
      return getAllNoteTemplates(type);
    } catch (error) {
      console.error('Error getting note templates:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:getById', async (_event, id: string) => {
    try {
      return getNoteTemplateById(id);
    } catch (error) {
      console.error('Error getting note template:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:getDefault', async (_event, type: string) => {
    try {
      return getDefaultNoteTemplate(type);
    } catch (error) {
      console.error('Error getting default note template:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:create', async (_event, data: Partial<PrepNoteTemplate>) => {
    try {
      return createNoteTemplate(data);
    } catch (error) {
      console.error('Error creating note template:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:update', async (_event, id: string, updates: Partial<PrepNoteTemplate>) => {
    try {
      return updateNoteTemplate(id, updates);
    } catch (error) {
      console.error('Error updating note template:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:noteTemplates:delete', async (_event, id: string) => {
    try {
      deleteNoteTemplate(id);
    } catch (error) {
      console.error('Error deleting note template:', error);
      throw error;
    }
  });

  // ============================================
  // PREP FILE OPERATIONS
  // ============================================

  ipcMain.handle('prep:file:showOpenDialog', async () => {
    try {
      return await prepFileService.showOpenDialog();
    } catch (error) {
      console.error('Error showing open dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:file:showSaveDialog', async (_event, defaultName?: string) => {
    try {
      return await prepFileService.showSaveDialog(defaultName);
    } catch (error) {
      console.error('Error showing save dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:file:export', async (_event, projectId: string, filePath: string) => {
    try {
      await prepFileService.exportProject(projectId, filePath);
      return { success: true };
    } catch (error) {
      console.error('Error exporting prep project:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:file:import', async (_event, filePath: string) => {
    try {
      return await prepFileService.importProject(filePath);
    } catch (error) {
      console.error('Error importing prep project:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:file:getFileName', (_event, filePath: string) => {
    return prepFileService.getFileName(filePath);
  });

  // ============================================
  // LAYOUT TEMPLATES
  // ============================================

  ipcMain.handle(
    'prep:layoutTemplates:getByProjectId',
    async (_event, _projectId: string, pageType?: string) => {
      try {
        // Note: projectId is ignored since templates are now app-level user preferences
        return getAllLayoutTemplates(pageType);
      } catch (error) {
        console.error('Error getting layout templates:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:layoutTemplates:getById', async (_event, id: string) => {
    try {
      return getLayoutTemplateById(id);
    } catch (error) {
      console.error('Error getting layout template:', error);
      throw error;
    }
  });

  ipcMain.handle('prep:layoutTemplates:getElements', async (_event, templateId: string) => {
    try {
      return getLayoutElementsByTemplateId(templateId);
    } catch (error) {
      console.error('Error getting layout elements:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'prep:layoutTemplates:getDefault',
    async (_event, _projectId: string, pageType: string) => {
      try {
        // Note: projectId is ignored since templates are now app-level user preferences
        return getDefaultLayoutTemplate(pageType);
      } catch (error) {
        console.error('Error getting default layout template:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'prep:layoutTemplates:create',
    async (_event, data: Partial<PageLayoutTemplate>, elements: Partial<LayoutElement>[]) => {
      try {
        return createLayoutTemplate(data, elements);
      } catch (error) {
        console.error('Error creating layout template:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'prep:layoutTemplates:update',
    async (
      _event,
      id: string,
      updates: Partial<PageLayoutTemplate>,
      elements?: Partial<LayoutElement>[]
    ) => {
      try {
        return updateLayoutTemplate(id, updates, elements);
      } catch (error) {
        console.error('Error updating layout template:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('prep:layoutTemplates:delete', async (_event, id: string) => {
    try {
      deleteLayoutTemplate(id);
    } catch (error) {
      console.error('Error deleting layout template:', error);
      throw error;
    }
  });

  // Seed default page layouts
  ipcMain.handle('prep:layoutTemplates:seedDefaults', async () => {
    try {
      seedDefaultPageLayouts();
      return { success: true, message: 'Default page layouts created successfully' };
    } catch (error) {
      console.error('Error seeding default layouts:', error);
      throw error;
    }
  });

  // ============================================
  // PDF EXPORT & PRINT
  // ============================================

  ipcMain.handle('prep:exportPDF', async (_event, projectId: string, templateData: any) => {
    try {
      const project = getPrepProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Show save dialog
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (!mainWindow) {
        throw new Error('No active window');
      }

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export PDF',
        defaultPath: `${project.production_name}_ShopOrder.pdf`,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      // Create a hidden window for PDF generation
      const pdfWindow = new BrowserWindow({
        width: 816, // Letter size width in pixels at 96 DPI
        height: 1056, // Letter size height in pixels at 96 DPI
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Generate simple HTML content for the PDF
      // TODO: In Phase 2, this will render the actual page layouts with real data
      const htmlContent = generatePDFContent(project, templateData);
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Wait for page to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate PDF with proper page settings
      const pdfData = await pdfWindow.webContents.printToPDF({
        pageSize: templateData.pageSettings?.pageSize || 'Letter',
        landscape: templateData.pageSettings?.orientation === 'landscape',
        printBackground: true,
        marginsType: 1, // 0 = default, 1 = none, 2 = minimum (we handle margins in CSS)
      });

      // Save PDF to file
      fs.writeFileSync(result.filePath, pdfData);

      // Close the hidden window
      pdfWindow.close();

      return {
        success: true,
        filePath: result.filePath,
      };
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  });

  // Direct Print
  ipcMain.handle('prep:print', async (_event, projectId: string, templateData: any) => {
    try {
      const project = getPrepProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Create a hidden window for printing
      const printWindow = new BrowserWindow({
        width: 816, // Letter size width in pixels at 96 DPI
        height: 1056, // Letter size height in pixels at 96 DPI
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Generate HTML content
      const htmlContent = generatePDFContent(project, templateData);
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Wait for page to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Print with proper page settings
      printWindow.webContents.print(
        {
          silent: false, // Show print dialog
          printBackground: true,
          pageSize: templateData.pageSettings?.pageSize || 'Letter',
          landscape: templateData.pageSettings?.orientation === 'landscape',
          marginsType: 1, // 0 = default, 1 = none, 2 = minimum (we handle margins in CSS)
        },
        (success, failureReason) => {
          if (!success && failureReason) {
            console.error('Print failed:', failureReason);
          }
          // Close the hidden window after printing or canceling
          printWindow.close();
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error printing:', error);
      throw error;
    }
  });

  console.log('✅ Prep IPC handlers registered');
}

// Helper function to generate HTML content for PDF using page layouts
function generatePDFContent(project: PrepProject, templateData: any): string {
  const sections = templateData.sections || [];
  const enabledSections = sections.filter((s: any) => s.enabled && s.type !== 'page-break');

  // Get margin settings (in inches)
  const margins = templateData.pageSettings?.margins || { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 };

  // Page dimensions in pixels (at 96 DPI)
  const pageWidth = 816; // 8.5" at 96 DPI
  const pageHeight = 1056; // 11" at 96 DPI
  const marginTop = margins.top * 96;
  const marginRight = margins.right * 96;
  const marginBottom = margins.bottom * 96;
  const marginLeft = margins.left * 96;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const contentHeight = pageHeight - marginTop - marginBottom;

  // Fetch notes for the project
  const notes = getNotesByProjectId(project.id);
  const notesMap: Record<string, { content: string; format: string }> = {};
  notes.forEach(note => {
    notesMap[note.type] = { content: note.content, format: note.format || 'plain' };
  });

  // Generate HTML pages for each section
  const pagesHTML = enabledSections.map((section: any) => {
    return renderPageSection(section, project, contentWidth, contentHeight, notesMap);
  }).filter(html => html).join('');

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
            font-family: ${templateData.pageSettings?.fontFamily || 'Arial'}, sans-serif;
            font-size: ${templateData.pageSettings?.fontSize || 10}pt;
            color: #000;
            background: white;
            padding: 0;
          }
          .page {
            width: ${pageWidth}px;
            height: ${pageHeight}px;
            padding: ${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px;
            page-break-after: always;
            position: relative;
            background: white;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .content-area {
            width: ${contentWidth}px;
            height: ${contentHeight}px;
            position: relative;
          }
        </style>
      </head>
      <body>
        ${pagesHTML}
      </body>
    </html>
  `;
}

// Render a page section using its layout template
function renderPageSection(
  section: any,
  project: PrepProject,
  contentWidth: number,
  contentHeight: number,
  notesMap: Record<string, {content: string; format: string}>
): string {
  // Load default layout for this section type
  const layout = getDefaultLayoutTemplate(section.type);

  if (!layout) {
    // Fallback for sections without layouts
    return `<div class="page"><div class="content-area" style="text-align: center; padding: 20px;">Layout not found for ${section.type}</div></div>`;
  }

  // Load layout elements
  const elements = getLayoutElementsByTemplateId(layout.id);

  if (elements.length === 0) {
    return `<div class="page"><div class="content-area"></div></div>`;
  }

  // Render all elements to HTML
  const elementsHTML = elements.map(el => {
    const element = {
      ...el,
      config: typeof el.config === 'string' ? JSON.parse(el.config) : el.config,
      style: typeof el.style === 'string' ? JSON.parse(el.style) : el.style,
    };
    return renderLayoutElement(element, project, layout, contentWidth, contentHeight, notesMap);
  }).filter(html => html).join('');

  return `
    <div class="page">
      <div class="content-area">
        ${elementsHTML}
      </div>
    </div>
  `;
}

// Render a single layout element to HTML
function renderLayoutElement(
  element: any,
  project: PrepProject,
  layout: any,
  contentWidth: number,
  contentHeight: number,
  notesMap: Record<string, {content: string; format: string}>
): string {
  const { grid_column, grid_row, column_span, row_span, config, style, element_type } = element;

  const gridColumns = layout.grid_columns || 12;
  const gridRows = layout.grid_rows || 20;
  const cellWidth = contentWidth / gridColumns;
  const cellHeight = contentHeight / gridRows;

  const left = grid_column * cellWidth;
  const top = grid_row * cellHeight;
  const width = column_span * cellWidth;
  const height = row_span * cellHeight;

  const baseStyle = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    width: ${width}px;
    height: ${height}px;
    font-family: ${style.fontFamily || 'Arial'};
    font-size: ${style.fontSize || 10}pt;
    font-weight: ${style.fontWeight || 'normal'};
    color: ${style.color || '#000'};
    background-color: ${style.backgroundColor || 'transparent'};
    padding: ${style.padding || 0}px;
    text-align: ${style.textAlign || 'left'};
    display: flex;
    align-items: center;
    justify-content: ${getJustifyContent(style.textAlign || 'left')};
    ${style.textDecoration ? `text-decoration: ${style.textDecoration};` : ''}
    ${style.fontStyle ? `font-style: ${style.fontStyle};` : ''}
  `.replace(/\s+/g, ' ').trim();

  if (element_type === 'dataField') {
    const value = getDataFieldValue(config.fieldType, project);
    const label = config.showLabel && config.label ? config.label + ' ' : '';

    if (!value && !label) return '';

    return `<div style="${baseStyle}">
      ${label ? `<span style="font-weight: ${style.fontWeight || 'normal'};">${escapeHtml(label)}</span>` : ''}
      <span style="color: ${value ? (style.color || '#000') : '#999'};">${escapeHtml(value || '')}</span>
    </div>`;
  }

  if (element_type === 'text') {
    const content = config.content || '';
    if (!content) return '';

    // Replace placeholders
    const displayText = content.replace(/\{([^}]+)\}/g, (match: string, fieldName: string) => {
      return getDataFieldValue(fieldName, project) || '';
    });

    if (!displayText.trim()) return '';

    return `<div style="${baseStyle}">${escapeHtml(displayText)}</div>`;
  }

  if (element_type === 'shape') {
    const thickness = config.thickness || 1;
    const color = config.color || style.backgroundColor || '#000';

    if (config.shapeType === 'line' || config.shapeType === 'divider') {
      return `<div style="position: absolute; left: ${left}px; top: ${top + height/2}px; width: ${width}px; border-bottom: ${thickness}px solid ${color}; height: 0;"></div>`;
    }
    if (config.shapeType === 'rectangle') {
      return `<div style="${baseStyle} background-color: ${color};"></div>`;
    }
  }

  return '';
}

// Get data field value for PDF
function getDataFieldValue(fieldType: string, project: PrepProject): string {
  const formatDate = (timestamp?: string | number): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(timestamp);
    }
  };

  const formatPhone = (phone?: string): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  switch (fieldType) {
    case 'production_name': return project.production_name || 'Untitled Production';
    case 'venue': return project.venue || '';
    case 'venue_city': return project.venue_city || '';
    case 'venue_state': return project.venue_state || '';
    case 'order_date': return formatDate(project.order_date);
    case 'gm_name': return project.gm_name || '';
    case 'gm_company': return project.gm_company || '';
    case 'gm_email': return project.gm_email || '';
    case 'gm_phone': return formatPhone(project.gm_phone);
    case 'pm_name': return project.pm_name || '';
    case 'pm_company': return project.pm_company || '';
    case 'pm_email': return project.pm_email || '';
    case 'pm_phone': return formatPhone(project.pm_phone);
    case 'ld_name': return project.ld_name || '';
    case 'ld_email': return project.ld_email || '';
    case 'ld_phone': return formatPhone(project.ld_phone);
    case 'ald_name': return project.ald_name || '';
    case 'ald_email': return project.ald_email || '';
    case 'ald_phone': return formatPhone(project.ald_phone);
    case 'pe_name': return project.pe_name || '';
    case 'pe_email': return project.pe_email || '';
    case 'pe_phone': return formatPhone(project.pe_phone);
    case 'prep_start_date': return formatDate(project.prep_start_date);
    case 'prep_end_date': return formatDate(project.prep_end_date);
    case 'load_in_date': return formatDate(project.load_in_date);
    case 'first_preview_date': return formatDate(project.first_preview_date);
    case 'opening_night_date': return formatDate(project.opening_night_date);
    case 'closing_date': return formatDate(project.closing_date);
    case 'current_revision': return String(project.current_revision);
    default: return '';
  }
}

// Helper to get justify-content for text alignment
function getJustifyContent(textAlign: string): string {
  switch (textAlign) {
    case 'center': return 'center';
    case 'right': return 'flex-end';
    case 'left':
    default: return 'flex-start';
  }
}

// Helper to escape HTML
function escapeHtml(text: string): string {
  const div = { innerHTML: '' } as any;
  div.textContent = text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper function to get section label
function getSectionLabel(type: string): string {
  const labels: Record<string, string> = {
    'cover': 'Cover Page',
    'project-details': 'Project Details',
    'venue-info': 'Venue Information',
    'schedule': 'Schedule',
    'contacts': 'Contacts',
    'equipment-by-section': 'Equipment by Section',
    'equipment-summary': 'Equipment Summary',
    'notes': 'Notes',
    'revision-summary': 'Revision Summary',
    'custom-text': 'Custom Text',
    'page-break': 'Page Break',
  };
  return labels[type] || type;
}

// Helper function to get note type label
function getNoteTypeLabel(noteType: string): string {
  const labels: Record<string, string> = {
    'general_conditions': 'General Conditions',
    'general_notes': 'General Notes',
    'fixture_notes': 'Fixture Notes',
  };
  return labels[noteType] || noteType;
}
