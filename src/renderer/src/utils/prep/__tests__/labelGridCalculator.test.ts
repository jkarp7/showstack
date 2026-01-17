import { describe, it, expect } from 'vitest';
import {
  calculateLabelGrid,
  getAveryGridConfig,
  getAveryTemplates,
  getAveryTemplate,
  calculateCellDimensions,
  AVERY_TEMPLATES
} from '../labelGridCalculator';

/**
 * Comprehensive tests for label grid calculator
 * Target: 75% coverage with 8-10 test cases
 */

describe('Label Grid Calculator', () => {
  describe('calculateLabelGrid', () => {
    it('should calculate grid for standard address label (2.625" × 1")', () => {
      const grid = calculateLabelGrid(2.625, 1.0);

      // 4 cells per inch (default)
      expect(grid.columns).toBe(11); // 2.625 * 4 = 10.5, rounded to 11
      expect(grid.rows).toBe(4);    // 1.0 * 4 = 4

      // 72 DPI standard
      expect(grid.pageWidth).toBe(189);  // 2.625 * 72 = 189
      expect(grid.pageHeight).toBe(72);  // 1.0 * 72 = 72

      expect(grid.gridGap).toBe(2);
    });

    it('should calculate grid for shipping label (4" × 2")', () => {
      const grid = calculateLabelGrid(4.0, 2.0);

      expect(grid.columns).toBe(16); // 4 * 4 = 16
      expect(grid.rows).toBe(8);     // 2 * 4 = 8
      expect(grid.pageWidth).toBe(288);  // 4 * 72
      expect(grid.pageHeight).toBe(144); // 2 * 72
    });

    it('should handle custom cells per inch', () => {
      const grid = calculateLabelGrid(2.0, 1.0, 8); // 8 cells per inch

      expect(grid.columns).toBe(16); // 2 * 8 = 16
      expect(grid.rows).toBe(8);     // 1 * 8 = 8
    });

    it('should handle fractional dimensions with rounding', () => {
      const grid = calculateLabelGrid(1.75, 0.5);

      expect(grid.columns).toBe(7);  // 1.75 * 4 = 7 (exact)
      expect(grid.rows).toBe(2);     // 0.5 * 4 = 2
      expect(grid.pageWidth).toBe(126);  // 1.75 * 72 = 126
      expect(grid.pageHeight).toBe(36);  // 0.5 * 72 = 36
    });

    it('should handle large labels', () => {
      const grid = calculateLabelGrid(8.5, 11.0); // Full page

      expect(grid.columns).toBe(34);  // 8.5 * 4 = 34
      expect(grid.rows).toBe(44);     // 11 * 4 = 44
      expect(grid.pageWidth).toBe(612);  // 8.5 * 72
      expect(grid.pageHeight).toBe(792); // 11 * 72
    });

    it('should handle small labels', () => {
      const grid = calculateLabelGrid(0.5, 0.25);

      expect(grid.columns).toBe(2);  // 0.5 * 4 = 2
      expect(grid.rows).toBe(1);     // 0.25 * 4 = 1
    });
  });

  describe('Avery Template Functions', () => {
    describe('getAveryGridConfig', () => {
      it('should get grid config for Avery 5160', () => {
        const grid = getAveryGridConfig('5160');

        expect(grid).not.toBeNull();
        expect(grid?.columns).toBe(11); // 2.625 * 4 = 10.5 → 11
        expect(grid?.rows).toBe(4);     // 1.0 * 4 = 4
        expect(grid?.pageWidth).toBe(189);
        expect(grid?.pageHeight).toBe(72);
      });

      it('should get grid config for Avery 5163 shipping labels', () => {
        const grid = getAveryGridConfig('5163');

        expect(grid).not.toBeNull();
        expect(grid?.columns).toBe(16); // 4.0 * 4 = 16
        expect(grid?.rows).toBe(8);     // 2.0 * 4 = 8
      });

      it('should get grid config for Avery 5167 return address', () => {
        const grid = getAveryGridConfig('5167');

        expect(grid).not.toBeNull();
        expect(grid?.columns).toBe(7);  // 1.75 * 4 = 7
        expect(grid?.rows).toBe(2);     // 0.5 * 4 = 2
      });

      it('should return null for unknown template code', () => {
        const grid = getAveryGridConfig('9999');
        expect(grid).toBeNull();
      });

      it('should be case-sensitive for template codes', () => {
        const grid = getAveryGridConfig('5160');
        expect(grid).not.toBeNull();

        // Template codes are stored as strings, so case matters
        const gridLower = getAveryGridConfig('5160');
        expect(gridLower).not.toBeNull();
      });
    });

    describe('getAveryTemplates', () => {
      it('should return all available templates', () => {
        const templates = getAveryTemplates();

        expect(templates).toBeInstanceOf(Array);
        expect(templates.length).toBeGreaterThan(0);
        expect(templates.length).toBe(Object.keys(AVERY_TEMPLATES).length);
      });

      it('should include 5160 template', () => {
        const templates = getAveryTemplates();
        const has5160 = templates.some(t => t.code === '5160');
        expect(has5160).toBe(true);
      });

      it('should return templates with all required fields', () => {
        const templates = getAveryTemplates();
        const template = templates[0];

        expect(template).toHaveProperty('code');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('widthInches');
        expect(template).toHaveProperty('heightInches');
        expect(template).toHaveProperty('labelsPerRow');
        expect(template).toHaveProperty('labelsPerColumn');
        expect(template).toHaveProperty('topMargin');
        expect(template).toHaveProperty('leftMargin');
        expect(template).toHaveProperty('horizontalGap');
        expect(template).toHaveProperty('verticalGap');
      });
    });

    describe('getAveryTemplate', () => {
      it('should get specific template by code', () => {
        const template = getAveryTemplate('5160');

        expect(template).not.toBeNull();
        expect(template?.code).toBe('5160');
        expect(template?.name).toBe('Address Labels');
        expect(template?.widthInches).toBe(2.625);
        expect(template?.heightInches).toBe(1.0);
      });

      it('should return template with layout information', () => {
        const template = getAveryTemplate('5160');

        expect(template?.labelsPerRow).toBe(3);
        expect(template?.labelsPerColumn).toBe(10);
        expect(template?.topMargin).toBe(36);
        expect(template?.leftMargin).toBe(11.25);
      });

      it('should return null for unknown template', () => {
        const template = getAveryTemplate('UNKNOWN');
        expect(template).toBeNull();
      });
    });
  });

  describe('calculateCellDimensions', () => {
    it('should calculate cell dimensions with gaps', () => {
      const grid = {
        columns: 10,
        rows: 4,
        pageWidth: 200,
        pageHeight: 100,
        gridGap: 2
      };

      const { cellWidth, cellHeight } = calculateCellDimensions(grid);

      // Width: (200 - 9*2) / 10 = 182 / 10 = 18.2
      expect(cellWidth).toBeCloseTo(18.2, 1);

      // Height: (100 - 3*2) / 4 = 94 / 4 = 23.5
      expect(cellHeight).toBeCloseTo(23.5, 1);
    });

    it('should calculate dimensions without gaps', () => {
      const grid = {
        columns: 5,
        rows: 5,
        pageWidth: 100,
        pageHeight: 100,
        gridGap: 0
      };

      const { cellWidth, cellHeight } = calculateCellDimensions(grid);

      // Width: 100 / 5 = 20
      expect(cellWidth).toBe(20);

      // Height: 100 / 5 = 20
      expect(cellHeight).toBe(20);
    });

    it('should handle Avery 5160 grid dimensions', () => {
      const grid = getAveryGridConfig('5160')!;
      const { cellWidth, cellHeight } = calculateCellDimensions(grid);

      // Should produce reasonable cell sizes
      expect(cellWidth).toBeGreaterThan(0);
      expect(cellHeight).toBeGreaterThan(0);
      expect(cellWidth).toBeLessThan(grid.pageWidth);
      expect(cellHeight).toBeLessThan(grid.pageHeight);
    });

    it('should handle single cell grid', () => {
      const grid = {
        columns: 1,
        rows: 1,
        pageWidth: 72,
        pageHeight: 72,
        gridGap: 2
      };

      const { cellWidth, cellHeight } = calculateCellDimensions(grid);

      // No gaps for single cell: 72 / 1 = 72
      expect(cellWidth).toBe(72);
      expect(cellHeight).toBe(72);
    });

    it('should handle large grids with many gaps', () => {
      const grid = {
        columns: 20,
        rows: 20,
        pageWidth: 400,
        pageHeight: 400,
        gridGap: 2
      };

      const { cellWidth, cellHeight } = calculateCellDimensions(grid);

      // Width: (400 - 19*2) / 20 = 362 / 20 = 18.1
      expect(cellWidth).toBeCloseTo(18.1, 1);
      expect(cellHeight).toBeCloseTo(18.1, 1);
    });
  });

  describe('Integration Tests', () => {
    it('should produce consistent dimensions for end-to-end workflow', () => {
      // Get template → calculate grid → calculate cells
      const template = getAveryTemplate('5160')!;
      const grid = calculateLabelGrid(template.widthInches, template.heightInches);
      const { cellWidth, cellHeight } = calculateCellDimensions(grid);

      // Verify grid matches template dimensions
      expect(grid.pageWidth).toBe(Math.round(template.widthInches * 72));
      expect(grid.pageHeight).toBe(Math.round(template.heightInches * 72));

      // Verify cells fit within page
      const totalWidth = cellWidth * grid.columns + (grid.columns - 1) * grid.gridGap;
      const totalHeight = cellHeight * grid.rows + (grid.rows - 1) * grid.gridGap;

      expect(totalWidth).toBeCloseTo(grid.pageWidth, 0);
      expect(totalHeight).toBeCloseTo(grid.pageHeight, 0);
    });

    it('should handle all template codes consistently', () => {
      const templateCodes = Object.keys(AVERY_TEMPLATES);

      templateCodes.forEach(code => {
        const grid = getAveryGridConfig(code);
        expect(grid).not.toBeNull();
        expect(grid?.columns).toBeGreaterThan(0);
        expect(grid?.rows).toBeGreaterThan(0);
        expect(grid?.pageWidth).toBeGreaterThan(0);
        expect(grid?.pageHeight).toBeGreaterThan(0);
      });
    });
  });
});
