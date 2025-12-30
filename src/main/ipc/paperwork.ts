import { ipcMain, BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';
import * as paperworkTemplateQueries from '../database/queries/paperworkTemplates';

export function registerPaperworkHandlers(): void {
  // ============================================
  // PAPERWORK TEMPLATE HANDLERS
  // ============================================

  // Get all templates (optionally filtered by report type)
  ipcMain.handle('paperwork-templates:getAll', async (_event, reportType?: string) => {
    try {
      return paperworkTemplateQueries.getAllPaperworkTemplates(reportType);
    } catch (error) {
      console.error('Error getting paperwork templates:', error);
      throw error;
    }
  });

  // Get template by ID
  ipcMain.handle('paperwork-templates:getById', async (_event, id: string) => {
    try {
      return paperworkTemplateQueries.getPaperworkTemplateById(id);
    } catch (error) {
      console.error('Error getting paperwork template:', error);
      throw error;
    }
  });

  // Create new template
  ipcMain.handle('paperwork-templates:create', async (_event, data: any) => {
    try {
      return paperworkTemplateQueries.createPaperworkTemplate(data);
    } catch (error) {
      console.error('Error creating paperwork template:', error);
      throw error;
    }
  });

  // Update template
  ipcMain.handle('paperwork-templates:update', async (_event, id: string, updates: any) => {
    try {
      return paperworkTemplateQueries.updatePaperworkTemplate(id, updates);
    } catch (error) {
      console.error('Error updating paperwork template:', error);
      throw error;
    }
  });

  // Delete template
  ipcMain.handle('paperwork-templates:delete', async (_event, id: string) => {
    try {
      return paperworkTemplateQueries.deletePaperworkTemplate(id);
    } catch (error) {
      console.error('Error deleting paperwork template:', error);
      throw error;
    }
  });

  // Duplicate template
  ipcMain.handle('paperwork-templates:duplicate', async (_event, id: string, newName?: string) => {
    try {
      return paperworkTemplateQueries.duplicatePaperworkTemplate(id, newName);
    } catch (error) {
      console.error('Error duplicating paperwork template:', error);
      throw error;
    }
  });

  // ============================================
  // PDF EXPORT HANDLER
  // ============================================

  // Export Paperwork Report to PDF
  ipcMain.handle('paperwork:exportPDF', async (_event, htmlContent: string, filename: string, pageSettings: any) => {
    try {
      // Show save dialog
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (!mainWindow) {
        throw new Error('No active window');
      }

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export PDF',
        defaultPath: filename,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      // Create a hidden window for PDF generation
      const pdfWindow = new BrowserWindow({
        width: pageSettings.orientation === 'landscape' ? 1056 : 816,
        height: pageSettings.orientation === 'landscape' ? 816 : 1056,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load the HTML content
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Wait for page to load and render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Map page size names to Electron's format
      const pageSizeMap: Record<string, any> = {
        'letter': 'Letter',
        'legal': 'Legal',
        'a4': 'A4',
        'tabloid': 'Tabloid',
      };

      // Generate PDF with proper page settings
      const pdfData = await pdfWindow.webContents.printToPDF({
        pageSize: pageSizeMap[pageSettings.size] || 'Letter',
        landscape: pageSettings.orientation === 'landscape',
        printBackground: true,
        marginsType: 1, // No margins (we handle them in CSS)
        margins: {
          top: pageSettings.marginTop || 0,
          bottom: pageSettings.marginBottom || 0,
          left: pageSettings.marginLeft || 0,
          right: pageSettings.marginRight || 0,
        },
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

  console.log('✅ Paperwork IPC handlers registered');
}
