import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
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

  ipcMain.handle('prep:notes:update', async (_event, id: string, content: string) => {
    try {
      return updatePrepNote(id, content);
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

// Helper function to generate HTML content for PDF
function generatePDFContent(project: PrepProject, templateData: any): string {
  const sections = templateData.sections || [];
  const enabledSections = sections.filter((s: any) => s.enabled);

  // Get margin settings (in inches)
  const margins = templateData.pageSettings?.margins || { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 };

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
            width: 100%;
            min-height: 100vh;
            padding: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in;
            page-break-after: always;
          }
          .page:last-child {
            page-break-after: auto;
          }
          h1 {
            font-size: 24pt;
            margin-bottom: 12pt;
            text-align: center;
          }
          h2 {
            font-size: 16pt;
            margin-top: 12pt;
            margin-bottom: 8pt;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4pt;
          }
          .info-row {
            margin: 4pt 0;
          }
          .label {
            font-weight: bold;
            display: inline-block;
            min-width: 120pt;
          }
          .placeholder {
            color: #666;
            font-style: italic;
            text-align: center;
            margin: 24pt 0;
            padding: 24pt;
            border: 1px dashed #ccc;
          }
        </style>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="page">
          <h1>${project.production_name}</h1>
          <div style="text-align: center; margin: 24pt 0;">
            <div style="font-size: 18pt; font-weight: bold;">ELECTRICS SHOP ORDER</div>
            <div style="margin-top: 8pt; color: #666;">For Bid Only</div>
          </div>
          <div style="margin-top: 48pt;">
            <div class="info-row"><span class="label">Venue:</span> ${project.venue || 'TBD'}</div>
            <div class="info-row"><span class="label">Designer:</span> ${project.ld_name || 'TBD'}</div>
            <div class="info-row"><span class="label">Production Manager:</span> ${project.pm_name || 'TBD'}</div>
            <div class="info-row"><span class="label">Revision:</span> ${project.current_revision}</div>
          </div>
        </div>

        <!-- Placeholder for actual content -->
        <div class="page">
          <div class="placeholder">
            <h2>Live Page Rendering Coming Soon</h2>
            <p style="margin-top: 12pt;">This PDF contains ${enabledSections.length} sections:</p>
            <ul style="list-style: none; margin-top: 12pt; text-align: left; display: inline-block;">
              ${enabledSections.map((s: any) => `<li style="margin: 4pt 0;">• ${getSectionLabel(s.type)}</li>`).join('')}
            </ul>
            <p style="margin-top: 24pt; font-size: 9pt;">
              Phase 2 will include full page layout rendering with custom designs,<br/>
              equipment lists, contacts, schedules, notes, and revision tracking.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
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
