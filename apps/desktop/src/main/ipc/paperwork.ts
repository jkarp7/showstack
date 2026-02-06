import { ipcMain, BrowserWindow, dialog } from 'electron';
// import fs from 'fs'';
import * as paperworkTemplateQueries from '../database/queries/paperworkTemplates';
import puppeteer from 'puppeteer';
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

export function registerPaperworkHandlers(): void {
  // ============================================
  // PAPERWORK TEMPLATE HANDLERS
  // ============================================

  // Get all templates (optionally filtered by report type)
  ipcMain.handle('paperwork-templates:getAll', async (_event, reportType?: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => paperworkTemplateQueries.getAllPaperworkTemplates(reportType),
        'paperwork-templates:getAll'
      );
    } catch (error) {
      console.error('Failed to get paperwork templates:', {
        operation: 'paperwork-templates:getAll',
        reportType,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load paperwork templates: ${error.message}`);
      }
      throw error;
    }
  });

  // Get template by ID
  ipcMain.handle('paperwork-templates:getById', async (_event, id: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => paperworkTemplateQueries.getPaperworkTemplateById(id),
        'paperwork-templates:getById'
      );
    } catch (error) {
      console.error('Failed to get paperwork template:', {
        operation: 'paperwork-templates:getById',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to load paperwork template: ${error.message}`);
      }
      throw error;
    }
  });

  // Create new template
  ipcMain.handle('paperwork-templates:create', async (_event, data: any) => {
    try {
      // Basic validation
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('Template name is required', 'name', data.name);
      }

      return await errorHandler.executeWithRetry(
        async () => paperworkTemplateQueries.createPaperworkTemplate(data),
        'paperwork-templates:create'
      );
    } catch (error) {
      console.error('Failed to create paperwork template:', {
        operation: 'paperwork-templates:create',
        data,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to create paperwork template: ${error.message}`);
      }
      throw error;
    }
  });

  // Update template
  ipcMain.handle('paperwork-templates:update', async (_event, id: string, updates: any) => {
    try {
      // Validate name if being updated
      if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
        throw new ValidationError('Template name cannot be empty', 'name', updates.name);
      }

      return await errorHandler.executeWithRetry(
        async () => paperworkTemplateQueries.updatePaperworkTemplate(id, updates),
        'paperwork-templates:update'
      );
    } catch (error) {
      console.error('Failed to update paperwork template:', {
        operation: 'paperwork-templates:update',
        id,
        updates,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      if (error instanceof DatabaseError) {
        throw new Error(`Unable to update paperwork template: ${error.message}`);
      }
      throw error;
    }
  });

  // Delete template
  ipcMain.handle('paperwork-templates:delete', async (_event, id: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => paperworkTemplateQueries.deletePaperworkTemplate(id),
        'paperwork-templates:delete'
      );
    } catch (error) {
      console.error('Failed to delete paperwork template:', {
        operation: 'paperwork-templates:delete',
        id,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to delete paperwork template: ${error.message}`);
      }
      throw error;
    }
  });

  // Duplicate template
  ipcMain.handle('paperwork-templates:duplicate', async (_event, id: string, newName?: string) => {
    try {
      return await errorHandler.executeWithRetry(
        async () => paperworkTemplateQueries.duplicatePaperworkTemplate(id, newName),
        'paperwork-templates:duplicate'
      );
    } catch (error) {
      console.error('Failed to duplicate paperwork template:', {
        operation: 'paperwork-templates:duplicate',
        id,
        newName,
        error: error instanceof Error ? error.message : error
      });

      if (error instanceof DatabaseError) {
        throw new Error(`Unable to duplicate paperwork template: ${error.message}`);
      }
      throw error;
    }
  });

  // ============================================
  // PDF EXPORT HANDLER
  // ============================================

  // Export Paperwork Report to PDF using Puppeteer
  ipcMain.handle('paperwork:exportPDF', async (_event, htmlContent: string, filename: string, pageSettings: any, fontFamily?: string) => {
    let browser;
    try {
      // Validation
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new ValidationError('HTML content is required', 'htmlContent', htmlContent);
      }
      if (!filename || filename.trim().length === 0) {
        throw new ValidationError('Filename is required', 'filename', filename);
      }

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

      // Apply grayscale filter if black & white mode
      if (pageSettings?.colorMode === 'bw') {
        console.log('📄 Applying grayscale filter for black & white mode...');
        await page.addStyleTag({
          content: `
            body {
              -webkit-filter: grayscale(100%);
              filter: grayscale(100%);
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          `
        });
      }

      console.log('📄 Generating PDF with Puppeteer...');

      // Map page size names to Puppeteer format
      const pageSizeMap: Record<string, any> = {
        'letter': 'Letter',
        'legal': 'Legal',
        'a4': 'A4',
        'tabloid': 'Tabloid',
      };

      // Generate PDF with Puppeteer
      const userName = 'User'; // TODO: Get from user preferences
      // Escape font family for use in CSS - remove any existing quotes and re-wrap
      const footerFontFamily = (fontFamily || '-apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif')
        .replace(/["']/g, ''); // Remove quotes

      await page.pdf({
        path: result.filePath,
        format: pageSizeMap[pageSettings.size] || 'Letter',
        landscape: pageSettings.orientation === 'landscape',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>', // Empty header - we use the custom header in the HTML
        footerTemplate: `
          <div style="
            width: 100%;
            font-family: ${footerFontFamily};
            font-size: 10pt;
            padding: 0 20px;
            margin: 0;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <span>${userName} • ShowStack</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
        margin: {
          top: `${pageSettings.marginTop || 0.5}in`,
          bottom: `${pageSettings.marginBottom || 0.75}in`, // Slightly larger to fit footer
          left: `${pageSettings.marginLeft || 0.5}in`,
          right: `${pageSettings.marginRight || 0.5}in`,
        },
      });

      console.log('✅ PDF generated successfully with Puppeteer');

      await browser.close();

      return {
        success: true,
        filePath: result.filePath,
      };
    } catch (error) {
      console.error('Failed to export PDF:', {
        operation: 'paperwork:exportPDF',
        filename,
        error: error instanceof Error ? error.message : error
      });

      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Failed to close browser:', closeError);
        }
      }

      if (error instanceof ValidationError) {
        throw new Error(error.toUserMessage());
      }
      throw new Error(`Unable to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  console.log('✅ Paperwork IPC handlers registered');
}
