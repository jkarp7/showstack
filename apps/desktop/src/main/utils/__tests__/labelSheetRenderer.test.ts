// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderLabelSheet,
  getAverySpec,
  calculatePageCount,
  AVERY_SPECS,
} from '../labelSheetRenderer';
import type { LabelData } from '../../../renderer/src/utils/prep/labelDataMapper';

/**
 * Comprehensive tests for label sheet renderer
 * Focus: XSS prevention, HTML generation, Avery template layouts
 */

// Mock label data
const mockLabelData: LabelData = {
  position: '1st Electric',
  unitNumber: '12',
  type: 'Source Four 19°',
  manufacturer: 'ETC',
  channel: '145',
  dimmer: 'R23',
  circuit: 'C-145',
  color: 'R02',
  wattage: '750',
  purpose: 'DS Special',
};

// Mock template
const mockTemplate = {
  id: 'template-1',
  name: 'Test Template',
  page_type: 'label',
  grid_columns: 4,
  grid_rows: 3,
  grid_gap: 5,
  page_width: 189, // Avery 5160 label width
  page_height: 72, // Avery 5160 label height
  config: {
    backgroundColor: '#ffffff',
  },
};

// Mock layout elements
const mockElements = [
  {
    element_type: 'dataField',
    config: {
      fieldType: 'position',
      prefix: 'Pos: ',
      suffix: '',
    },
    grid_column: 0,
    grid_row: 0,
    column_span: 2,
    row_span: 1,
    style: {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'left',
      color: '#000000',
    },
  },
  {
    element_type: 'text',
    config: {
      content: 'Static Label',
    },
    grid_column: 0,
    grid_row: 1,
    column_span: 1,
    row_span: 1,
    style: {
      fontSize: 10,
    },
  },
];

describe('Label Sheet Renderer - XSS Protection', () => {
  describe('HTML Escaping', () => {
    it('should escape ampersands in dataField content', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: 'Smith & Jones',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('Smith &amp; Jones');
      expect(result).not.toContain('Smith & Jones');
    });

    it('should escape less-than symbols in dataField content', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: 'Position < 5',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('Position &lt; 5');
      expect(result).not.toContain('Position < 5');
    });

    it('should escape greater-than symbols in dataField content', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: 'Position > 10',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('Position &gt; 10');
      expect(result).not.toContain('Position > 10');
    });

    it('should escape double quotes in dataField content', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: 'Position "Special"',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('Position &quot;Special&quot;');
      expect(result).not.toContain('Position "Special"');
    });

    it('should escape single quotes in dataField content', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: "Position 'Special'",
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('Position &#039;Special&#039;');
      expect(result).not.toContain("Position 'Special'");
    });
  });

  describe('XSS Attack Prevention', () => {
    it('should prevent script tag injection in dataField', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: '<script>alert("XSS")</script>',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;/script&gt;');
      expect(result).not.toContain('<script>alert("XSS")</script>');
    });

    it('should prevent img tag injection in dataField', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: '<img src=x onerror="alert(1)">',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
      expect(result).not.toContain('<img src=x onerror="alert(1)">');
    });

    it('should prevent iframe injection in dataField', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: '<iframe src="javascript:alert(1)"></iframe>',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('&lt;iframe');
      expect(result).toContain('&lt;/iframe&gt;');
      expect(result).not.toContain('<iframe');
    });

    it('should prevent event handler injection in dataField', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: '<div onload="alert(1)">Test</div>',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('&lt;div onload=&quot;alert(1)&quot;&gt;');
      expect(result).not.toContain('<div onload="alert(1)">');
    });

    it('should prevent javascript: protocol injection', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: '<a href="javascript:alert(1)">Click</a>',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('&lt;a href=&quot;javascript:alert(1)&quot;&gt;');
      expect(result).not.toContain('<a href="javascript:alert(1)">');
    });

    it('should prevent data: protocol injection', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: '<object data="data:text/html,<script>alert(1)</script>"></object>',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('&lt;object');
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<object data=');
    });

    it('should escape XSS in text elements', () => {
      const textElement = {
        element_type: 'text',
        config: {
          content: '<script>alert("XSS")</script>',
        },
        grid_column: 0,
        grid_row: 0,
        column_span: 1,
        row_span: 1,
        style: {},
      };

      const result = renderLabelSheet(mockTemplate, [textElement], [mockLabelData], '5160');

      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>alert("XSS")</script>');
    });

    it('should handle XSS in prefix/suffix fields', () => {
      const xssElement = {
        element_type: 'dataField',
        config: {
          fieldType: 'position',
          prefix: '<script>',
          suffix: '</script>',
        },
        grid_column: 0,
        grid_row: 0,
        column_span: 1,
        row_span: 1,
        style: {},
      };

      const result = renderLabelSheet(mockTemplate, [xssElement], [mockLabelData], '5160');

      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;/script&gt;');
    });
  });

  describe('Complex XSS Payloads', () => {
    it('should handle encoded HTML entities', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: '&lt;script&gt;alert(1)&lt;/script&gt;',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      // Should double-escape already escaped entities
      expect(result).toContain('&amp;lt;script&amp;gt;');
    });

    it('should handle mixed special characters', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: '<div class="test" onclick=\'alert("XSS")\'>&nbsp;</div>',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('&lt;div class=&quot;test&quot;');
      expect(result).toContain('onclick=&#039;alert(&quot;XSS&quot;)&#039;');
      expect(result).toContain('&amp;nbsp;&lt;/div&gt;');
    });

    it('should handle Unicode characters safely', () => {
      const xssData: LabelData = {
        ...mockLabelData,
        position: '测试<script>alert(1)</script>',
      };

      const result = renderLabelSheet(mockTemplate, mockElements, [xssData], '5160');

      expect(result).toContain('测试'); // Unicode preserved
      expect(result).toContain('&lt;script&gt;'); // XSS escaped
    });

    it('should handle special characters in all label fields', () => {
      const xssData: LabelData = {
        position: '<script>pos</script>',
        unitNumber: '<img src=x>',
        type: '<iframe>',
        manufacturer: '<div onclick="x">',
        purpose: '<a href="javascript:">',
        notes: '<object data="x">',
      };

      const allFieldsElements = [
        {
          element_type: 'dataField',
          config: { fieldType: 'position' },
          grid_column: 0,
          grid_row: 0,
          column_span: 1,
          row_span: 1,
          style: {},
        },
        {
          element_type: 'dataField',
          config: { fieldType: 'unitNumber' },
          grid_column: 1,
          grid_row: 0,
          column_span: 1,
          row_span: 1,
          style: {},
        },
        {
          element_type: 'dataField',
          config: { fieldType: 'type' },
          grid_column: 0,
          grid_row: 1,
          column_span: 1,
          row_span: 1,
          style: {},
        },
        {
          element_type: 'dataField',
          config: { fieldType: 'manufacturer' },
          grid_column: 1,
          grid_row: 1,
          column_span: 1,
          row_span: 1,
          style: {},
        },
        {
          element_type: 'dataField',
          config: { fieldType: 'purpose' },
          grid_column: 0,
          grid_row: 2,
          column_span: 1,
          row_span: 1,
          style: {},
        },
        {
          element_type: 'dataField',
          config: { fieldType: 'notes' },
          grid_column: 1,
          grid_row: 2,
          column_span: 1,
          row_span: 1,
          style: {},
        },
      ];

      const result = renderLabelSheet(mockTemplate, allFieldsElements, [xssData], '5160');

      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;img src=x&gt;');
      expect(result).toContain('&lt;iframe&gt;');
      expect(result).toContain('&lt;div onclick=&quot;x&quot;&gt;');
      expect(result).toContain('&lt;a href=&quot;javascript:&quot;&gt;');
      expect(result).toContain('&lt;object data=&quot;x&quot;&gt;');
    });
  });
});

describe('Label Sheet Renderer - HTML Generation', () => {
  describe('Document Structure', () => {
    it('should generate valid HTML5 document', () => {
      const result = renderLabelSheet(mockTemplate, mockElements, [mockLabelData], '5160');

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html>');
      expect(result).toContain('</html>');
      expect(result).toContain('<head>');
      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<body>');
      expect(result).toContain('</body>');
    });

    it('should include CSS for print layout', () => {
      const result = renderLabelSheet(mockTemplate, mockElements, [mockLabelData], '5160');

      expect(result).toContain('<style>');
      expect(result).toContain('box-sizing: border-box');
      expect(result).toContain('-webkit-print-color-adjust: exact');
      expect(result).toContain('@page');
      expect(result).toContain('size: letter');
    });

    it('should create page containers with correct structure', () => {
      const result = renderLabelSheet(mockTemplate, mockElements, [mockLabelData], '5160');

      expect(result).toContain('class="page"');
      expect(result).toContain('page-break-after: always');
      expect(result).toContain('width: 8.5in');
      expect(result).toContain('height: 11in');
    });
  });

  describe('Grid Layout', () => {
    it('should create grid with correct Avery 5160 dimensions', () => {
      const result = renderLabelSheet(mockTemplate, mockElements, [mockLabelData], '5160');
      const spec = AVERY_SPECS['5160'];

      expect(result).toContain(
        `grid-template-columns: repeat(${spec.labelsPerRow}, ${spec.labelWidth}px)`,
      );
      expect(result).toContain(
        `grid-template-rows: repeat(${spec.labelsPerColumn}, ${spec.labelHeight}px)`,
      );
      expect(result).toContain(`gap: ${spec.verticalGap}px ${spec.horizontalGap}px`);
    });

    it('should apply correct margins for Avery 5160', () => {
      const result = renderLabelSheet(mockTemplate, mockElements, [mockLabelData], '5160');
      const spec = AVERY_SPECS['5160'];

      expect(result).toContain(`padding: ${spec.topMargin}px 0 0 ${spec.leftMargin}px`);
    });

    it('should handle Avery 5163 (2x5 shipping labels)', () => {
      const result = renderLabelSheet(mockTemplate, mockElements, [mockLabelData], '5163');
      const spec = AVERY_SPECS['5163'];

      expect(result).toContain(
        `grid-template-columns: repeat(${spec.labelsPerRow}, ${spec.labelWidth}px)`,
      );
      expect(result).toContain(
        `grid-template-rows: repeat(${spec.labelsPerColumn}, ${spec.labelHeight}px)`,
      );
    });

    it('should handle Avery 5164 (2x3 shipping labels)', () => {
      const result = renderLabelSheet(mockTemplate, mockElements, [mockLabelData], '5164');
      const spec = AVERY_SPECS['5164'];

      expect(result).toContain(
        `grid-template-columns: repeat(${spec.labelsPerRow}, ${spec.labelWidth}px)`,
      );
      expect(result).toContain(
        `grid-template-rows: repeat(${spec.labelsPerColumn}, ${spec.labelHeight}px)`,
      );
    });
  });

  describe('Element Rendering', () => {
    it('should render dataField elements with correct styling', () => {
      const result = renderLabelSheet(mockTemplate, mockElements, [mockLabelData], '5160');

      expect(result).toContain('Pos: 1st Electric');
      expect(result).toContain('font-family: Arial');
      expect(result).toContain('font-size: 12pt');
      expect(result).toContain('font-weight: bold');
      expect(result).toContain('text-align: left');
    });

    it('should render text elements', () => {
      const result = renderLabelSheet(mockTemplate, mockElements, [mockLabelData], '5160');

      expect(result).toContain('Static Label');
    });

    it('should handle image elements', () => {
      const imageElement = {
        element_type: 'image',
        config: {
          src: 'data:image/png;base64,iVBORw0KG...',
          altText: 'Logo',
          objectFit: 'contain',
        },
        grid_column: 0,
        grid_row: 0,
        column_span: 1,
        row_span: 1,
        style: {},
      };

      const result = renderLabelSheet(mockTemplate, [imageElement], [mockLabelData], '5160');

      expect(result).toContain('<img src="data:image/png;base64,iVBORw0KG..."');
      expect(result).toContain('alt="Logo"');
      expect(result).toContain('object-fit: contain');
    });

    it('should handle shape elements (rectangle)', () => {
      const shapeElement = {
        element_type: 'shape',
        config: {
          shapeType: 'rectangle',
          color: '#000000',
          thickness: 2,
        },
        grid_column: 0,
        grid_row: 0,
        column_span: 1,
        row_span: 1,
        style: {},
      };

      const result = renderLabelSheet(mockTemplate, [shapeElement], [mockLabelData], '5160');

      expect(result).toContain('border: 2px solid #000000');
    });

    it('should handle shape elements (line/divider)', () => {
      const lineElement = {
        element_type: 'shape',
        config: {
          shapeType: 'line',
          color: '#cccccc',
          thickness: 1,
        },
        grid_column: 0,
        grid_row: 0,
        column_span: 1,
        row_span: 1,
        style: {},
      };

      const result = renderLabelSheet(mockTemplate, [lineElement], [mockLabelData], '5160');

      expect(result).toContain('height: 1px');
      expect(result).toContain('background-color: #cccccc');
    });
  });

  describe('Multiple Labels and Pages', () => {
    it('should render multiple labels on single page', () => {
      const labels = Array(5).fill(mockLabelData);
      const result = renderLabelSheet(mockTemplate, mockElements, labels, '5160');

      // Should have 1 page (Avery 5160 has 30 labels per page)
      const pageCount = (result.match(/class="page"/g) || []).length;
      expect(pageCount).toBe(1);
    });

    it('should create multiple pages when needed', () => {
      const spec = AVERY_SPECS['5160'];
      const labelsPerPage = spec.labelsPerRow * spec.labelsPerColumn; // 30
      const labels = Array(labelsPerPage + 5).fill(mockLabelData); // 35 labels

      const result = renderLabelSheet(mockTemplate, mockElements, labels, '5160');

      // Should have 2 pages
      const pageCount = (result.match(/class="page"/g) || []).length;
      expect(pageCount).toBe(2);
    });

    it('should fill empty label slots on partial pages', () => {
      const labels = [mockLabelData]; // Just 1 label
      const result = renderLabelSheet(mockTemplate, mockElements, labels, '5160');

      // Should still create a full page grid
      expect(result).toContain('class="page"');
    });
  });
});

describe('Label Sheet Renderer - Edge Cases', () => {
  it('should handle empty data array', () => {
    const result = renderLabelSheet(mockTemplate, mockElements, [], '5160');

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<body>');
  });

  it('should handle missing field values', () => {
    const emptyData: LabelData = {
      position: '',
      unitNumber: '',
      type: '',
    };

    const result = renderLabelSheet(mockTemplate, mockElements, [emptyData], '5160');

    expect(result).toContain('Pos: '); // Prefix but no value
  });

  it('should handle undefined field values gracefully', () => {
    const sparseData: Partial<LabelData> = {
      position: '1st Electric',
    };

    const result = renderLabelSheet(mockTemplate, mockElements, [sparseData as LabelData], '5160');

    expect(result).toContain('1st Electric');
  });

  it('should throw error for invalid Avery code', () => {
    expect(() => {
      renderLabelSheet(mockTemplate, mockElements, [mockLabelData], 'INVALID');
    }).toThrow('Unknown Avery template: INVALID');
  });

  it('should handle very long text values', () => {
    const longText = 'A'.repeat(1000);
    const longData: LabelData = {
      ...mockLabelData,
      position: longText,
    };

    const result = renderLabelSheet(mockTemplate, mockElements, [longData], '5160');

    expect(result).toContain(longText);
    expect(result).toContain('overflow: hidden'); // Text should be clipped
  });

  it('should handle custom background colors', () => {
    const colorTemplate = {
      ...mockTemplate,
      config: {
        backgroundColor: '#f0f0f0',
      },
    };

    const result = renderLabelSheet(colorTemplate, mockElements, [mockLabelData], '5160');

    expect(result).toContain('background-color: #f0f0f0');
  });

  it('should handle missing config.backgroundColor', () => {
    const noColorTemplate = {
      ...mockTemplate,
      config: undefined,
    };

    const result = renderLabelSheet(noColorTemplate, mockElements, [mockLabelData], '5160');

    expect(result).toContain('background-color: #ffffff'); // Default white
  });
});

describe('Avery Spec Utilities', () => {
  describe('getAverySpec', () => {
    it('should return spec for valid Avery 5160', () => {
      const spec = getAverySpec('5160');

      expect(spec).toBeDefined();
      expect(spec?.code).toBe('5160');
      expect(spec?.name).toBe('Address Labels');
      expect(spec?.labelsPerRow).toBe(3);
      expect(spec?.labelsPerColumn).toBe(10);
    });

    it('should return spec for valid Avery 5163', () => {
      const spec = getAverySpec('5163');

      expect(spec).toBeDefined();
      expect(spec?.code).toBe('5163');
      expect(spec?.name).toBe('Shipping Labels');
      expect(spec?.labelsPerRow).toBe(2);
      expect(spec?.labelsPerColumn).toBe(5);
    });

    it('should return null for invalid code', () => {
      const spec = getAverySpec('INVALID');
      expect(spec).toBeNull();
    });

    it('should return null for empty code', () => {
      const spec = getAverySpec('');
      expect(spec).toBeNull();
    });
  });

  describe('calculatePageCount', () => {
    it('should calculate 1 page for 30 labels on Avery 5160', () => {
      const pageCount = calculatePageCount(30, '5160');
      expect(pageCount).toBe(1);
    });

    it('should calculate 2 pages for 31 labels on Avery 5160', () => {
      const pageCount = calculatePageCount(31, '5160');
      expect(pageCount).toBe(2);
    });

    it('should calculate 0 pages for 0 labels', () => {
      const pageCount = calculatePageCount(0, '5160');
      expect(pageCount).toBe(0);
    });

    it('should calculate correct pages for Avery 5163 (10 per page)', () => {
      expect(calculatePageCount(10, '5163')).toBe(1);
      expect(calculatePageCount(11, '5163')).toBe(2);
      expect(calculatePageCount(25, '5163')).toBe(3);
    });

    it('should calculate correct pages for Avery 5164 (6 per page)', () => {
      expect(calculatePageCount(6, '5164')).toBe(1);
      expect(calculatePageCount(7, '5164')).toBe(2);
      expect(calculatePageCount(18, '5164')).toBe(3);
    });

    it('should return 0 for invalid Avery code', () => {
      const pageCount = calculatePageCount(30, 'INVALID');
      expect(pageCount).toBe(0);
    });
  });

  describe('AVERY_SPECS constant', () => {
    it('should include all standard Avery templates', () => {
      expect(AVERY_SPECS).toHaveProperty('5160');
      expect(AVERY_SPECS).toHaveProperty('5163');
      expect(AVERY_SPECS).toHaveProperty('5164');
      expect(AVERY_SPECS).toHaveProperty('8160');
      expect(AVERY_SPECS).toHaveProperty('5167');
    });

    it('should have consistent dimension units (points)', () => {
      Object.values(AVERY_SPECS).forEach((spec) => {
        expect(spec.labelWidth).toBeGreaterThan(0);
        expect(spec.labelHeight).toBeGreaterThan(0);
        expect(spec.topMargin).toBeGreaterThanOrEqual(0);
        expect(spec.leftMargin).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid label counts', () => {
      Object.values(AVERY_SPECS).forEach((spec) => {
        expect(spec.labelsPerRow).toBeGreaterThan(0);
        expect(spec.labelsPerColumn).toBeGreaterThan(0);
        const totalLabels = spec.labelsPerRow * spec.labelsPerColumn;
        expect(totalLabels).toBeGreaterThan(0);
      });
    });
  });
});

describe('Label Sheet Renderer - Integration Scenarios', () => {
  it('should render complete label sheet with real-world fixture data', () => {
    const realWorldData: LabelData[] = [
      {
        position: '1st Electric',
        unitNumber: '12',
        type: 'Source Four 19°',
        channel: '145',
        dimmer: 'R23',
        color: 'R02',
      },
      {
        position: '1st Electric',
        unitNumber: '13',
        type: 'Source Four 26°',
        channel: '146',
        dimmer: 'R24',
        color: 'R54',
      },
      {
        position: '2nd Electric',
        unitNumber: '1',
        type: 'PAR64',
        channel: '201',
        dimmer: 'R31',
        color: 'R80',
      },
    ];

    // Create elements that render multiple fields
    const fullElements = [
      {
        element_type: 'dataField',
        config: { fieldType: 'position' },
        grid_column: 0,
        grid_row: 0,
        column_span: 2,
        row_span: 1,
        style: {},
      },
      {
        element_type: 'dataField',
        config: { fieldType: 'type' },
        grid_column: 0,
        grid_row: 1,
        column_span: 2,
        row_span: 1,
        style: {},
      },
      {
        element_type: 'dataField',
        config: { fieldType: 'unitNumber' },
        grid_column: 2,
        grid_row: 0,
        column_span: 1,
        row_span: 1,
        style: {},
      },
    ];

    const result = renderLabelSheet(mockTemplate, fullElements, realWorldData, '5160');

    expect(result).toContain('1st Electric');
    expect(result).toContain('2nd Electric');
    expect(result).toContain('Source Four 19°');
    expect(result).toContain('PAR64');
  });

  it('should handle complete workflow: fixtures → labels → HTML', () => {
    const fixtureData: LabelData[] = Array(35)
      .fill(null)
      .map((_, i) => ({
        position: `Electric ${i + 1}`,
        unitNumber: (i + 1).toString(),
        type: 'Source Four 19°',
        channel: (100 + i).toString(),
      }));

    // Create elements that render position field
    const positionElement = [
      {
        element_type: 'dataField',
        config: { fieldType: 'position' },
        grid_column: 0,
        grid_row: 0,
        column_span: 1,
        row_span: 1,
        style: {},
      },
    ];

    const result = renderLabelSheet(mockTemplate, positionElement, fixtureData, '5160');

    // Should create 2 pages (30 labels per page, 35 total)
    const pageCount = (result.match(/class="page"/g) || []).length;
    expect(pageCount).toBe(2);

    // Should contain fixtures from first and last page
    expect(result).toContain('Electric 1');
    expect(result).toContain('Electric 35');
  });
});
