import { ipcMain, BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';
import * as paperworkTemplateQueries from '../database/queries/paperworkTemplates';
import puppeteer from 'puppeteer';

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

  // Export Paperwork Report to PDF using Puppeteer
  ipcMain.handle('paperwork:exportPDF', async (_event, htmlContent: string, filename: string, pageSettings: any) => {
    let browser;
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

      console.log('📄 Launching Puppeteer for PDF generation...');

      // Launch Puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Set the HTML content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });

      console.log('📄 Generating PDF with Puppeteer...');

      // Map page size names to Puppeteer format
      const pageSizeMap: Record<string, any> = {
        'letter': 'Letter',
        'legal': 'Legal',
        'a4': 'A4',
        'tabloid': 'Tabloid',
      };

      // Generate PDF with Puppeteer
      await page.pdf({
        path: result.filePath,
        format: pageSizeMap[pageSettings.size] || 'Letter',
        landscape: pageSettings.orientation === 'landscape',
        printBackground: true,
        margin: {
          top: `${pageSettings.marginTop || 0}in`,
          bottom: `${pageSettings.marginBottom || 0}in`,
          left: `${pageSettings.marginLeft || 0}in`,
          right: `${pageSettings.marginRight || 0}in`,
        },
      });

      console.log('✅ PDF generated successfully with Puppeteer');

      await browser.close();

      return {
        success: true,
        filePath: result.filePath,
      };
    } catch (error) {
      console.error('❌ Error exporting PDF with Puppeteer:', error);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  });

  console.log('✅ Paperwork IPC handlers registered');
}
