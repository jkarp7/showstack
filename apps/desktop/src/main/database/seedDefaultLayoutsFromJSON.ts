// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';
import { createLayoutTemplate } from './queries/layoutTemplates';
import { logger } from '../utils/logger';

type PrintSectionType = string;

const DEFAULT_LAYOUTS_DIR = path.join(__dirname, 'defaultLayouts');

interface LayoutElementData {
  element_type: string;
  config: any;
  grid_column: number;
  grid_row: number;
  column_span: number;
  row_span: number;
  layer: number;
  style: any;
}

interface LayoutJSONData {
  template: {
    name: string;
    description: string;
    page_type: string;
    grid_columns: number;
    grid_rows: number;
    grid_gap: number;
    page_width: number;
    page_height: number;
    is_default: boolean;
  };
  elements: LayoutElementData[];
}

/**
 * Seed default page layouts from JSON files
 * This replaces the hardcoded approach with a file-based system
 */
export function seedDefaultPageLayoutsFromJSON(): void {
  logger.info('Seeding default page layouts from JSON files...');

  try {
    // Check if directory exists
    if (!fs.existsSync(DEFAULT_LAYOUTS_DIR)) {
      logger.warn(`⚠️  Default layouts directory not found: ${DEFAULT_LAYOUTS_DIR}`);
      logger.warn('   Falling back to hardcoded layouts');
      // Import and use the original seed function as fallback
      const { seedDefaultPageLayouts } = require('./seedDefaultLayouts');
      seedDefaultPageLayouts();
      return;
    }

    // Read all JSON files in the directory
    const files = fs.readdirSync(DEFAULT_LAYOUTS_DIR).filter((file) => file.endsWith('.json'));

    if (files.length === 0) {
      logger.warn('⚠️  No JSON layout files found in directory');
      logger.warn('   Falling back to hardcoded layouts');
      const { seedDefaultPageLayouts } = require('./seedDefaultLayouts');
      seedDefaultPageLayouts();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Load and create each layout
    for (const file of files) {
      try {
        const filePath = path.join(DEFAULT_LAYOUTS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data: LayoutJSONData = JSON.parse(fileContent);

        // Validate structure
        if (!data.template || !data.elements) {
          logger.error(`✗ Invalid structure in ${file}: missing template or elements`);
          errorCount++;
          continue;
        }

        // Prepare template data
        const templateData = {
          name: data.template.name,
          description: data.template.description,
          page_type: data.template.page_type as PrintSectionType,
          grid_columns: data.template.grid_columns,
          grid_rows: data.template.grid_rows,
          grid_gap: data.template.grid_gap,
          page_width: data.template.page_width,
          page_height: data.template.page_height,
          is_default: data.template.is_default,
        };

        // Prepare elements data (stringify config and style)
        const elementsData = data.elements.map((el) => ({
          element_type: el.element_type,
          config: JSON.stringify(el.config),
          grid_column: el.grid_column,
          grid_row: el.grid_row,
          column_span: el.column_span,
          row_span: el.row_span,
          layer: el.layer || 0,
          style: JSON.stringify(el.style),
        }));

        // Create the layout
        createLayoutTemplate(templateData, elementsData as any);
        logger.info(`✓ Loaded layout from ${file}`);
        successCount++;
      } catch (error) {
        logger.error(`✗ Error loading ${file}:`, error);
        errorCount++;
      }
    }

    logger.info(`✅ Seeding complete: ${successCount} layouts loaded, ${errorCount} errors`);

    if (successCount === 0 && errorCount > 0) {
      logger.warn('   No layouts were loaded successfully, falling back to hardcoded layouts');
      const { seedDefaultPageLayouts } = require('./seedDefaultLayouts');
      seedDefaultPageLayouts();
    }
  } catch (error) {
    logger.error('Error seeding layouts from JSON:', error);
    logger.warn('Falling back to hardcoded layouts');
    const { seedDefaultPageLayouts } = require('./seedDefaultLayouts');
    seedDefaultPageLayouts();
  }
}
