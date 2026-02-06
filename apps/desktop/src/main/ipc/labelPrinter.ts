/**
 * Label Printer IPC Handlers
 *
 * Handles batch label printing with fixture data population.
 * Uses Puppeteer for PDF generation with multi-label sheet layouts.
 */

import { ipcMain, app } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import puppeteer from 'puppeteer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { renderLabelSheet, calculatePageCount } from '../utils/labelSheetRenderer';
import { getLayoutTemplateById, getLayoutElementsByTemplateId } from '../database/queries/layoutTemplates';
// import { getAppDatabase } from '../database';

/**
 * Print label batch - full PDF rendering with labelSheetRenderer
 */
async function printLabelBatch(
  event: IpcMainInvokeEvent,
  templateId: string,
  labelDataArray: any[], // LabelData[]
  averyCode: string,
  colorMode?: 'color' | 'bw' // Optional color mode
): Promise<string> {
  try {
    console.log(`📄 Batch label print requested:`, {
      templateId,
      labelCount: labelDataArray.length,
      averyCode,
      pages: calculatePageCount(labelDataArray.length, averyCode)
    });

    // Load template and elements
    const template = getLayoutTemplateById(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const elements = getLayoutElementsByTemplateId(templateId);

    // Parse JSON fields
    const parsedElements = elements.map(el => ({
      ...el,
      config: JSON.parse(el.config),
      style: JSON.parse(el.style)
    }));

    // Render HTML
    const html = renderLabelSheet(template as any, parsedElements as any, labelDataArray, averyCode);

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Apply grayscale filter if black & white mode
      if (colorMode === 'bw') {
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

      // Ensure exports directory exists
      const exportsDir = join(app.getPath('userData'), 'exports');
      if (!existsSync(exportsDir)) {
        mkdirSync(exportsDir, { recursive: true });
      }

      const pdfPath = join(exportsDir, `labels-${Date.now()}.pdf`);

      await page.pdf({
        path: pdfPath,
        format: 'letter',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      console.log(`✅ Label batch PDF generated: ${pdfPath}`);
      return pdfPath;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('❌ Label batch print failed:', error);
    throw error;
  }
}

/**
 * Print single label preview
 */
async function printLabelPreview(
  event: IpcMainInvokeEvent,
  templateId: string,
  sampleData: any
): Promise<string> {
  try {
    console.log(`📄 Label preview requested:`, { templateId });

    // Use batch printer with single label
    return await printLabelBatch(event, templateId, [sampleData], '5160');
  } catch (error) {
    console.error('❌ Label preview failed:', error);
    throw error;
  }
}

/**
 * Register label printer IPC handlers
 */
export function registerLabelPrinterHandlers(): void {
  ipcMain.handle('label-printer:batch', printLabelBatch);
  ipcMain.handle('label-printer:preview', printLabelPreview);

  console.log('✅ Label Printer IPC handlers registered');
}
