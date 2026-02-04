import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { formatNoteContentAsHTML } from '../utils/noteFormatting';
import {
  // Projects
  getAllShopOrderProjects,
  getShopOrderProjectById,
  createShopOrderProject,
  updateShopOrderProject,
  deleteShopOrderProject,
  ShopOrderProject,
  // Sections
  getSectionsByProjectId,
  createShopOrderSection,
  updateShopOrderSection,
  deleteShopOrderSection,
  ShopOrderSection,
  // Equipment Items
  getItemsBySectionId,
  getItemsByProjectId,
  createShopOrderItem,
  updateShopOrderItem,
  deleteShopOrderItem,
  ShopOrderItem,
  // Revisions
  getRevisionsByProjectId,
  createShopOrderRevision,
  deleteShopOrderRevision,
  ShopOrderRevision,
  // Notes
  getNotesByProjectId,
  createShopOrderNote,
  updateShopOrderNote,
  deleteShopOrderNote,
  ShopOrderNote,
  // Note Templates
  getAllNoteTemplates,
  getNoteTemplateById,
  getDefaultNoteTemplate,
  createNoteTemplate,
  updateNoteTemplate,
  deleteNoteTemplate,
  ShopOrderNoteTemplate,
} from '../database/queries/shop-order';
import { getProjectById } from '../database/queries/projects';
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
import { seedDefaultPageLayoutsFromJSON } from '../database/seedDefaultLayoutsFromJSON';
import { shopOrderFileService } from '../services/shopOrderFileService';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

/**
 * NOTE: This file contains 42 IPC handlers for the Prep module.
 * Error handling has been added to critical handlers (Projects section).
 * Remaining handlers follow the same pattern and should be updated similarly:
 *
 * Pattern:
 * 1. Wrap with errorHandler.executeWithRetry() for database operations
 * 2. Add validation for required fields using ValidationError
 * 3. Log with structured data: { operation, ...args, error }
 * 4. Convert DatabaseError and ValidationError to user-friendly messages
 *
 * TODO: Complete error handling for remaining 37 handlers in Phase 0.3 refactor
 * (This file is scheduled for major refactoring/renaming in Phase 0.3)
 */
export function registerShopOrderHandlers(): void {
  // ============================================
  // PREP PROJECTS
  // ============================================

  ipcMain.handle('shop-order:projects:getAll', async () => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getAllShopOrderProjects(),
        'shop-order:projects:getAll'
      );
    } catch (error) {
      console.error('Failed to get prep projects:', {
        operation: 'shop-order:projects:getAll',
        error: error instanceof Error ? error.message : error
      });
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load prep projects: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle('shop-order:projects:getById', async (_event, id: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => getShopOrderProjectById(id),
        'shop-order:projects:getById'
      );
    } catch (error) {
      console.error('Failed to get prep project:', {
        operation: 'shop-order:projects:getById',
        id,
        error: error instanceof Error ? error.message : error
      });
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load prep project: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle('shop-order:projects:create', async (_event, data: Partial<ShopOrderProject>) => {
    try {
      if (!data.production_name || data.production_name.trim().length === 0) {
        throw new ValidationError('Production name is required', 'production_name', data.production_name);
      }
      return await errorHandler.executeWithRetry(
        async () => createShopOrderProject(data),
        'shop-order:projects:create'
      );
    } catch (error) {
      console.error('Failed to create prep project:', {
        operation: 'shop-order:projects:create',
        data,
        error: error instanceof Error ? error.message : error
      });
      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to create prep project: ${error.message}`);
      }
      throw error;
    }
  });

  ipcMain.handle(
    'shop-order:projects:update',
    async (_event, id: string, updates: Partial<ShopOrderProject>) => {
      try {
        if (updates.production_name !== undefined && (!updates.production_name || updates.production_name.trim().length === 0)) {
          throw new ValidationError('Production name cannot be empty', 'production_name', updates.production_name);
        }
        return await errorHandler.executeWithRetry(
          async () => updateShopOrderProject(id, updates),
          'shop-order:projects:update'
        );
      } catch (error) {
        console.error('Failed to update prep project:', {
          operation: 'shop-order:projects:update',
          id,
          updates,
          error: error instanceof Error ? error.message : error
        });
        if (error instanceof ValidationError) {
          throw new Error(error.toUserMessage());
        }
        if (error instanceof DatabaseError) {
          throw new Error(`Unable to update prep project: ${error.message}`);
        }
        throw error;
      }
    }
  );

  ipcMain.handle('shop-order:projects:delete', async (_event, id: string) => {
    try {
      await errorHandler.executeWithRetry(
        async () => deleteShopOrderProject(id),
        'shop-order:projects:delete'
      );
    } catch (error) {
      console.error('Failed to delete prep project:', {
        operation: 'shop-order:projects:delete',
        id,
        error: error instanceof Error ? error.message : error
      });
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete prep project: ${error.message}`);
      }
      throw error;
    }
  });

  // ============================================
  // PREP SECTIONS
  // ============================================

  ipcMain.handle('shop-order:sections:getByProjectId', async (_event, projectId: string) => {
    try {
      return getSectionsByProjectId(projectId);
    } catch (error) {
      console.error('Error getting prep sections:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:sections:create', async (_event, data: Partial<ShopOrderSection>) => {
    try {
      return createShopOrderSection(data);
    } catch (error) {
      console.error('Error creating prep section:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'shop-order:sections:update',
    async (_event, id: string, updates: Partial<ShopOrderSection>) => {
      try {
        return updateShopOrderSection(id, updates);
      } catch (error) {
        console.error('Error updating prep section:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('shop-order:sections:delete', async (_event, id: string) => {
    try {
      deleteShopOrderSection(id);
    } catch (error) {
      console.error('Error deleting prep section:', error);
      throw error;
    }
  });

  // ============================================
  // PREP EQUIPMENT ITEMS
  // ============================================

  ipcMain.handle('shop-order:items:getBySectionId', async (_event, sectionId: string) => {
    try {
      return getItemsBySectionId(sectionId);
    } catch (error) {
      console.error('Error getting prep items by section:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:items:getByProjectId', async (_event, projectId: string) => {
    try {
      return getItemsByProjectId(projectId);
    } catch (error) {
      console.error('Error getting prep items by project:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:items:create', async (_event, data: Partial<ShopOrderItem>) => {
    try {
      return createShopOrderItem(data);
    } catch (error) {
      console.error('Error creating prep item:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'shop-order:items:update',
    async (_event, id: string, updates: Partial<ShopOrderItem>) => {
      try {
        return updateShopOrderItem(id, updates);
      } catch (error) {
        console.error('Error updating prep item:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('shop-order:items:delete', async (_event, id: string) => {
    try {
      deleteShopOrderItem(id);
    } catch (error) {
      console.error('Error deleting prep item:', error);
      throw error;
    }
  });

  // ============================================
  // PREP REVISIONS
  // ============================================

  ipcMain.handle('shop-order:revisions:getByProjectId', async (_event, projectId: string) => {
    try {
      return getRevisionsByProjectId(projectId);
    } catch (error) {
      console.error('Error getting prep revisions:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:revisions:create', async (_event, data: Partial<ShopOrderRevision>) => {
    try {
      return createShopOrderRevision(data);
    } catch (error) {
      console.error('Error creating prep revision:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:revisions:delete', async (_event, id: string) => {
    try {
      deleteShopOrderRevision(id);
    } catch (error) {
      console.error('Error deleting prep revision:', error);
      throw error;
    }
  });

  // ============================================
  // PREP NOTES
  // ============================================

  ipcMain.handle(
    'shop-order:notes:getByProjectId',
    async (_event, projectId: string, type?: string) => {
      try {
        return getNotesByProjectId(projectId, type);
      } catch (error) {
        console.error('Error getting prep notes:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('shop-order:notes:create', async (_event, data: Partial<ShopOrderNote>) => {
    try {
      return createShopOrderNote(data);
    } catch (error) {
      console.error('Error creating prep note:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:notes:update', async (_event, id: string, updates: { content?: string; format?: string }) => {
    try {
      return updateShopOrderNote(id, updates);
    } catch (error) {
      console.error('Error updating prep note:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:notes:delete', async (_event, id: string) => {
    try {
      deleteShopOrderNote(id);
    } catch (error) {
      console.error('Error deleting prep note:', error);
      throw error;
    }
  });

  // ============================================
  // PREP NOTE TEMPLATES
  // ============================================

  ipcMain.handle('shop-order:noteTemplates:getAll', async (_event, type?: string) => {
    try {
      return getAllNoteTemplates(type);
    } catch (error) {
      console.error('Error getting note templates:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:noteTemplates:getById', async (_event, id: string) => {
    try {
      return getNoteTemplateById(id);
    } catch (error) {
      console.error('Error getting note template:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:noteTemplates:getDefault', async (_event, type: string) => {
    try {
      return getDefaultNoteTemplate(type);
    } catch (error) {
      console.error('Error getting default note template:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:noteTemplates:create', async (_event, data: Partial<ShopOrderNoteTemplate>) => {
    try {
      return createNoteTemplate(data);
    } catch (error) {
      console.error('Error creating note template:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:noteTemplates:update', async (_event, id: string, updates: Partial<ShopOrderNoteTemplate>) => {
    try {
      return updateNoteTemplate(id, updates);
    } catch (error) {
      console.error('Error updating note template:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:noteTemplates:delete', async (_event, id: string) => {
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

  ipcMain.handle('shop-order:file:showOpenDialog', async () => {
    try {
      return await shopOrderFileService.showOpenDialog();
    } catch (error) {
      console.error('Error showing open dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:file:showSaveDialog', async (_event, defaultName?: string) => {
    try {
      return await shopOrderFileService.showSaveDialog(defaultName);
    } catch (error) {
      console.error('Error showing save dialog:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:file:export', async (_event, projectId: string, filePath: string) => {
    try {
      await shopOrderFileService.exportProject(projectId, filePath);
      return { success: true };
    } catch (error) {
      console.error('Error exporting prep project:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:file:import', async (_event, filePath: string) => {
    try {
      return await shopOrderFileService.importProject(filePath);
    } catch (error) {
      console.error('Error importing prep project:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:file:getFileName', (_event, filePath: string) => {
    return shopOrderFileService.getFileName(filePath);
  });

  // ============================================
  // LAYOUT TEMPLATES
  // ============================================

  ipcMain.handle(
    'shop-order:layoutTemplates:getByProjectId',
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

  ipcMain.handle('shop-order:layoutTemplates:getById', async (_event, id: string) => {
    try {
      return getLayoutTemplateById(id);
    } catch (error) {
      console.error('Error getting layout template:', error);
      throw error;
    }
  });

  ipcMain.handle('shop-order:layoutTemplates:getElements', async (_event, templateId: string) => {
    try {
      return getLayoutElementsByTemplateId(templateId);
    } catch (error) {
      console.error('Error getting layout elements:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'shop-order:layoutTemplates:getDefault',
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
    'shop-order:layoutTemplates:create',
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
    'shop-order:layoutTemplates:update',
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

  ipcMain.handle('shop-order:layoutTemplates:delete', async (_event, id: string) => {
    try {
      deleteLayoutTemplate(id);
    } catch (error) {
      console.error('Error deleting layout template:', error);
      throw error;
    }
  });

  // Seed default page layouts
  ipcMain.handle('shop-order:layoutTemplates:seedDefaults', async () => {
    try {
      seedDefaultPageLayoutsFromJSON();
      return { success: true, message: 'Default page layouts created successfully' };
    } catch (error) {
      console.error('Error seeding default layouts:', error);
      throw error;
    }
  });

  // ============================================
  // PDF EXPORT & PRINT
  // ============================================

  ipcMain.handle('shop-order:exportPDF', async (_event, projectId: string, templateData: any) => {
    try {
      const project = getShopOrderProjectById(projectId);
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
  ipcMain.handle('shop-order:print', async (_event, projectId: string, templateData: any) => {
    try {
      const project = getShopOrderProjectById(projectId);
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
function generatePDFContent(project: ShopOrderProject, templateData: any): string {
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

  // Grayscale CSS for black & white mode
  const grayscaleCSS = templateData.pageSettings?.colorMode === 'bw' ? `
    -webkit-filter: grayscale(100%);
    filter: grayscale(100%);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  ` : '';

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
            ${grayscaleCSS}
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
  project: ShopOrderProject,
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
  project: ShopOrderProject,
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
    const label = config.showLabel && config.label ? config.label : '';

    // Special handling for logo field - render as image
    if (config.fieldType === 'logo') {
      console.log('[PDF] Logo field detected!');
      console.log('[PDF] Project logo_path:', (project as any).logo_path);
      console.log('[PDF] Project logo_storage_path:', project.logo_storage_path);
      console.log('[PDF] Project logo_url:', project.logo_url);
      console.log('[PDF] Project parent_project_id:', project.parent_project_id);

      // Support both unified Project (logo_path) and legacy ShopOrderProject (logo_storage_path)
      // Prioritize logo_path as the unified field
      let logoPath = project.logo_path || project.logo_storage_path;

      // If no logo in prep project, check parent project
      if (!logoPath && project.parent_project_id) {
        console.log('[PDF] No logo in ShopOrderProject, checking parent project...');
        try {
          const parentProject = getProjectById(project.parent_project_id);
          if (parentProject?.logo_path) {
            console.log('[PDF] Found logo in parent project:', parentProject.logo_path);
            logoPath = parentProject.logo_path;
          } else {
            console.log('[PDF] Parent project has no logo');
          }
        } catch (error) {
          console.error('[PDF] Error loading parent project:', error);
        }
      }

      if (logoPath) {
        console.log('[PDF] Using logo path:', logoPath);
        try {
          // Read logo file and convert to base64 data URL
          if (fs.existsSync(logoPath)) {
            console.log('[PDF] File exists, reading...');
            const buffer = fs.readFileSync(logoPath);
            const ext = path.extname(logoPath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
              '.webp': 'image/webp'
            };
            const mimeType = mimeTypes[ext] || 'image/png';
            const base64 = buffer.toString('base64');
            const dataUrl = `data:${mimeType};base64,${base64}`;
            console.log('[PDF] Logo converted to data URL, length:', dataUrl.length);

            return `<div style="${baseStyle} padding: 0;">
              <img src="${dataUrl}" alt="Project Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
            </div>`;
          } else {
            console.log('[PDF] File does NOT exist at path:', logoPath);
          }
        } catch (error) {
          console.error('[PDF] Error loading logo:', error);
        }
      } else {
        console.log('[PDF] No logo_path or logo_storage_path in project');
      }
      return ''; // No logo or failed to load
    }

    if (!value && !label) return '';

    return `<div style="${baseStyle}">
      ${label ? `<span style="font-weight: ${style.fontWeight || 'normal'};">${escapeHtml(label)}</span>` : ''}
      <span style="color: ${value ? (style.color || '#000') : '#999'}; ${label ? 'margin-left: 8px;' : ''}">${escapeHtml(value || '')}</span>
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

  // Dynamic content: Equipment List
  if (element_type === 'equipment_list') {
    const sections = getSectionsByProjectId(project.id);
    if (sections.length === 0) {
      return `<div style="${baseStyle}">No equipment items</div>`;
    }

    // Get revision information for delta calculation
    const revisions = getRevisionsByProjectId(project.id);
    const currentRevisionNum = project.current_revision;
    const previousRevisionNum = currentRevisionNum > 0 ? currentRevisionNum - 1 : undefined;

    // Get spare snapshot from previous revision
    let previousSpareSnapshot: any = {};
    if (previousRevisionNum !== undefined) {
      const previousRevision = revisions.find(r => r.revision_number === previousRevisionNum);
      if (previousRevision?.spare_snapshot) {
        try {
          previousSpareSnapshot = JSON.parse(previousRevision.spare_snapshot);
        } catch (e) {
          console.error('Error parsing spare snapshot:', e);
        }
      }
    }

    let equipmentHTML = '';
    let currentY = top;

    sections.forEach(section => {
      const items = getItemsBySectionId(section.id);
      if (items.length === 0) return;

      // Section header - no background fill
      equipmentHTML += `
        <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${width}px; padding: 6px 0; font-weight: bold; font-size: 11pt;">
          ${escapeHtml(section.name.toUpperCase())}
        </div>
      `;
      currentY += 28;

      // Section notes (if present) - formatted as bulleted list
      if (section.notes && section.notes.trim()) {
        const noteLines = section.notes.split('\n').filter(line => line.trim());
        const bulletedNotes = noteLines.map(line => `• ${escapeHtml(line.trim())}`).join('<br/>');
        equipmentHTML += `
          <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${width}px; padding: 4px 8px; font-size: 8pt; line-height: 1.4;">
            ${bulletedNotes}
          </div>
        `;
        currentY += (noteLines.length * 12) + 20; // Extra space before equipment table
      }

      // Table headers: Δ | Total | Rental | Active | Spare | Description
      const deltaWidth = width * 0.04;   // Delta
      const totalWidth = width * 0.07;   // Total - prominent
      const rentalWidth = width * 0.07;  // Rental - prominent
      const activeWidth = width * 0.06;  // Active
      const spareWidth = width * 0.06;   // Spare
      const descWidth = width * 0.70;    // Description

      equipmentHTML += `
        <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${deltaWidth}px; background-color: #F3F4F6; padding: 4px 2px; font-size: 8pt; font-weight: bold; text-align: center;">Δ</div>
        <div style="position: absolute; left: ${left + deltaWidth}px; top: ${currentY}px; width: ${totalWidth}px; background-color: #3B82F6; padding: 4px 2px; font-size: 9pt; font-weight: bold; text-align: center; color: white;">TOTAL</div>
        <div style="position: absolute; left: ${left + deltaWidth + totalWidth}px; top: ${currentY}px; width: ${rentalWidth}px; background-color: #10B981; padding: 4px 2px; font-size: 9pt; font-weight: bold; text-align: center; color: white;">RENTAL</div>
        <div style="position: absolute; left: ${left + deltaWidth + totalWidth + rentalWidth}px; top: ${currentY}px; width: ${activeWidth}px; background-color: #F3F4F6; padding: 4px 2px; font-size: 8pt; font-weight: bold; text-align: center;">Active</div>
        <div style="position: absolute; left: ${left + deltaWidth + totalWidth + rentalWidth + activeWidth}px; top: ${currentY}px; width: ${spareWidth}px; background-color: #F3F4F6; padding: 4px 2px; font-size: 8pt; font-weight: bold; text-align: center;">Spare</div>
        <div style="position: absolute; left: ${left + deltaWidth + totalWidth + rentalWidth + activeWidth + spareWidth}px; top: ${currentY}px; width: ${descWidth}px; background-color: #F3F4F6; padding: 4px; font-size: 8pt; font-weight: bold;">Description</div>
      `;
      currentY += 20;

      // Equipment items
      items.forEach(item => {
        // Parse revision quantities
        let revisionQuantities: any = {};
        try {
          revisionQuantities = item.revision_quantities ? JSON.parse(item.revision_quantities) : {};
        } catch (e) {
          console.error('Error parsing revision_quantities:', e);
        }

        // Get quantities for current and previous revisions
        const currentActive = revisionQuantities[currentRevisionNum] || 0;
        const previousActive = previousRevisionNum !== undefined ? (revisionQuantities[previousRevisionNum] || 0) : 0;
        const currentSpare = item.spare_qty || 0;
        const previousSpare = previousRevisionNum !== undefined ? (previousSpareSnapshot[item.id] || item.spare_qty) : 0;

        // Calculate delta indicator
        let deltaContent = '';
        let rowBgColor = '#FFFFFF';

        if (previousRevisionNum !== undefined && currentRevisionNum > 0) {
          if (previousActive === 0 && currentActive > 0) {
            // Addition
            deltaContent = '<span style="color: #3B82F6; font-weight: bold;">+</span>';
            rowBgColor = '#DBEAFE';
          } else if (previousActive > 0 && currentActive === 0) {
            // Deletion
            deltaContent = '<span style="color: #DC2626; font-weight: bold;">−</span>';
            rowBgColor = '#FEE2E2';
          } else if (previousActive !== currentActive || previousSpare !== currentSpare) {
            // Modification
            const prevTotal = previousActive + previousSpare;
            const currTotal = currentActive + currentSpare;
            const delta = currTotal - prevTotal;

            if (delta > 0) {
              deltaContent = `<span style="color: #059669; font-weight: bold;">▲${delta > 0 ? '+' : ''}${delta}</span>`;
              rowBgColor = '#D1FAE5';
            } else if (delta < 0) {
              deltaContent = `<span style="color: #DC2626; font-weight: bold;">▼${delta}</span>`;
              rowBgColor = '#FEE2E2';
            } else {
              deltaContent = '<span style="color: #CA8A04;">~</span>';
              rowBgColor = '#FEF9C3';
            }
          }
        }

        // Calculate total and rental using max of all revisions
        const allRevisionValues = Object.values(revisionQuantities);
        const maxActive = allRevisionValues.length > 0 ? Math.max(...allRevisionValues as number[]) : 0;
        const total = maxActive + currentSpare;
        const rental = total - (item.venue_qty || 0);

        equipmentHTML += `
          <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${deltaWidth}px; padding: 3px 2px; font-size: 7pt; text-align: center; background-color: ${rowBgColor};">${deltaContent}</div>
          <div style="position: absolute; left: ${left + deltaWidth}px; top: ${currentY}px; width: ${totalWidth}px; padding: 3px 2px; font-size: 9pt; text-align: center; background-color: ${rowBgColor}; font-weight: bold; color: #1E40AF;">${total}</div>
          <div style="position: absolute; left: ${left + deltaWidth + totalWidth}px; top: ${currentY}px; width: ${rentalWidth}px; padding: 3px 2px; font-size: 9pt; text-align: center; background-color: ${rowBgColor}; font-weight: bold; color: #047857;">${rental}</div>
          <div style="position: absolute; left: ${left + deltaWidth + totalWidth + rentalWidth}px; top: ${currentY}px; width: ${activeWidth}px; padding: 3px 2px; font-size: 8pt; text-align: center; background-color: ${rowBgColor};">${currentActive}</div>
          <div style="position: absolute; left: ${left + deltaWidth + totalWidth + rentalWidth + activeWidth}px; top: ${currentY}px; width: ${spareWidth}px; padding: 3px 2px; font-size: 8pt; text-align: center; background-color: ${rowBgColor};">${currentSpare}</div>
          <div style="position: absolute; left: ${left + deltaWidth + totalWidth + rentalWidth + activeWidth + spareWidth}px; top: ${currentY}px; width: ${descWidth}px; padding: 3px 4px; font-size: 8pt; background-color: ${rowBgColor};">${escapeHtml(item.description)}</div>
        `;
        currentY += 18;

        // Item notes (if present)
        if (item.notes && item.notes.trim()) {
          equipmentHTML += `
            <div style="position: absolute; left: ${left + deltaWidth + totalWidth + rentalWidth + activeWidth + spareWidth}px; top: ${currentY}px; width: ${descWidth}px; padding: 2px 4px 2px 8px; font-size: 7pt; font-style: italic; color: #6B7280;">
              ${escapeHtml(item.notes)}
            </div>
          `;
          currentY += 15;
        }
      });

      currentY += 15; // Space between sections
    });

    return equipmentHTML;
  }

  // Dynamic content: Notes
  if (element_type === 'notes_content') {
    const noteType = config.noteType || 'general_notes';
    const notes = getNotesByProjectId(project.id, noteType);

    if (notes.length === 0) {
      return ''; // No placeholder
    }

    let allContent: string[] = [];

    notes.forEach(note => {
      const content = note.content || '';
      const format = note.format || 'plain';

      // Format content based on format type
      let formattedContent = '';
      if (format === 'bullets') {
        const lines = content.split('\n').filter(l => l.trim());
        formattedContent = lines.map(line => `• ${escapeHtml(line.trim())}`).join('<br/>');
      } else if (format === 'numbered') {
        const lines = content.split('\n').filter(l => l.trim());
        formattedContent = lines.map((line, idx) => `${idx + 1}. ${escapeHtml(line.trim())}`).join('<br/>');
      } else {
        formattedContent = escapeHtml(content).replace(/\n/g, '<br/>');
      }

      if (formattedContent) {
        allContent.push(formattedContent);
      }
    });

    if (allContent.length === 0) {
      return ''; // No placeholder
    }

    // Render all notes in a single container
    const combinedContent = allContent.join('<br/><br/>');
    return `
      <div style="${baseStyle} overflow: hidden; align-items: flex-start;">
        ${combinedContent}
      </div>
    `;
  }

  // Dynamic content: Revision Log
  if (element_type === 'revision_log') {
    const revisions = getRevisionsByProjectId(project.id);

    if (revisions.length === 0) {
      return `<div style="${baseStyle}">No revision history</div>`;
    }

    const currentRevision = revisions.find(r => r.revision_number === project.current_revision);
    if (!currentRevision) {
      return `<div style="${baseStyle}">Current revision not found</div>`;
    }

    let changeLog: any[] = [];
    try {
      changeLog = JSON.parse(currentRevision.change_log || '[]');
    } catch (e) {
      changeLog = [];
    }

    let revisionHTML = '';
    let currentY = top;

    // Helper function to format dates
    const formatRevDate = (timestamp?: number): string => {
      if (!timestamp) return '';
      try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return '';
      }
    };

    // Add spacing after page header
    currentY += 24;

    // Legend - compact grid at top
    const legendHeight = 14;
    const legendPadding = 3;
    const legendFontSize = 7;

    revisionHTML += `
      <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${width * 0.22}px; background-color: #D1FAE5; padding: ${legendPadding}px 4px; font-size: ${legendFontSize}pt; text-align: center; border: 1px solid #ccc;">
        <span style="color: #059669;">▲ Increase</span>
      </div>
      <div style="position: absolute; left: ${left + width * 0.24}px; top: ${currentY}px; width: ${width * 0.22}px; background-color: #FEE2E2; padding: ${legendPadding}px 4px; font-size: ${legendFontSize}pt; text-align: center; border: 1px solid #ccc;">
        <span style="color: #DC2626;">▼ Decrease</span>
      </div>
      <div style="position: absolute; left: ${left + width * 0.48}px; top: ${currentY}px; width: ${width * 0.22}px; background-color: #DBEAFE; padding: ${legendPadding}px 4px; font-size: ${legendFontSize}pt; text-align: center; border: 1px solid #ccc;">
        <span style="color: #3B82F6;">NEW</span>
      </div>
      <div style="position: absolute; left: ${left + width * 0.72}px; top: ${currentY}px; width: ${width * 0.26}px; background-color: #FEF9C3; padding: ${legendPadding}px 4px; font-size: ${legendFontSize}pt; text-align: center; border: 1px solid #ccc;">
        Modified
      </div>
    `;
    currentY += legendHeight + 16; // Increased spacing after legend

    // Current revision header with number and date
    revisionHTML += `
      <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${width}px; background-color: #F3F4F6; padding: 6px 8px; font-size: 10pt; font-weight: bold;">
        Revision ${project.current_revision} - Issued ${formatRevDate(currentRevision.revision_date)}
      </div>
    `;
    currentY += 32; // Increased spacing after header

    // Current revision changes
    if (changeLog.length > 0) {
      changeLog.forEach(change => {
        let bgColor = '#FFF';
        let deltaSymbol = '';

        // Determine change display based on change_type
        if (change.change_type === 'addition') {
          // New item added
          bgColor = '#DBEAFE'; // Light blue
          deltaSymbol = `<span style="color: #3B82F6;">NEW</span>`;
        } else if (change.change_type === 'deletion') {
          // Item removed
          bgColor = '#FEE2E2'; // Light red
          deltaSymbol = `<span style="color: #DC2626;">REMOVED</span>`;
        } else if (change.change_type === 'modification') {
          // Check if quantity changed
          const oldActive = change.old_values?.active_qty || 0;
          const oldSpare = change.old_values?.spare_qty || 0;
          const newActive = change.new_values?.active_qty || 0;
          const newSpare = change.new_values?.spare_qty || 0;
          const oldTotal = oldActive + oldSpare;
          const newTotal = newActive + newSpare;

          if (newTotal > oldTotal) {
            // Quantity increased
            const delta = newTotal - oldTotal;
            bgColor = '#D1FAE5'; // Light green
            deltaSymbol = `<span style="color: #059669;">▲ +${delta}</span>`;
          } else if (newTotal < oldTotal) {
            // Quantity decreased
            const delta = oldTotal - newTotal;
            bgColor = '#FEE2E2'; // Light red
            deltaSymbol = `<span style="color: #DC2626;">▼ -${delta}</span>`;
          } else {
            // Other modification (description, notes, etc.)
            bgColor = '#FEF9C3'; // Light yellow
            deltaSymbol = `<span style="color: #CA8A04;">MOD</span>`;
          }
        }

        revisionHTML += `
          <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${width}px; background-color: ${bgColor}; padding: 5px 8px; font-size: 8pt; line-height: 1.4;">
            ${deltaSymbol} ${escapeHtml(change.description || '')}
          </div>
        `;
        currentY += 22;
      });
    } else {
      revisionHTML += `
        <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${width}px; padding: 5px 8px; font-size: 8pt; font-style: italic; color: #666;">
          No changes in this revision
        </div>
      `;
      currentY += 22;
    }

    currentY += 12; // Space before previous revisions

    // Previous revisions list
    const previousRevisions = revisions.filter(r => r.revision_number < project.current_revision).sort((a, b) => b.revision_number - a.revision_number);

    if (previousRevisions.length > 0) {
      revisionHTML += `
        <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${width}px; font-size: 9pt; font-weight: bold; padding: 4px 0;">
          Previous Revisions
        </div>
      `;
      currentY += 20;

      previousRevisions.forEach(rev => {
        revisionHTML += `
          <div style="position: absolute; left: ${left}px; top: ${currentY}px; width: ${width}px; padding: 3px 8px; font-size: 8pt; color: #374151;">
            Revision ${rev.revision_number} - ${formatRevDate(rev.revision_date)}
          </div>
        `;
        currentY += 18;
      });
    }

    return revisionHTML;
  }

  return '';
}

// Get data field value for PDF
function getDataFieldValue(fieldType: string, project: ShopOrderProject): string {
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

  const getRevisionDate = (): string => {
    const revisions = getRevisionsByProjectId(project.id);
    const currentRevision = revisions.find(r => r.revision_number === project.current_revision);
    return currentRevision ? formatDate(currentRevision.revision_date) : '';
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
    case 'revision_number': return String(project.current_revision);
    case 'revision_date': return getRevisionDate();
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
