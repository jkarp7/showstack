import { useEffect, useState, useRef } from 'react';
import type { PrintSection, PrepProject, PageLayoutTemplate, LayoutElement } from '../../types/prep';

interface PageRendererProps {
  section: PrintSection;
  project: PrepProject;
  pageSettings: {
    pageSize: string;
    orientation: string;
    margins: { top: number; right: number; bottom: number; left: number };
    showPageNumbers?: boolean;
    fontSize?: number;
    fontFamily?: string;
  };
  pageNumber?: number;
}

type DataFieldType =
  | 'production_name'
  | 'venue'
  | 'venue_city'
  | 'venue_state'
  | 'order_date'
  | 'designer_name'
  | 'designer_company'
  | 'gm_name'
  | 'pm_name'
  | 'ld_name'
  | 'ald_name'
  | 'pe_name'
  | 'gm_email'
  | 'pm_email'
  | 'ld_email'
  | 'ald_email'
  | 'pe_email'
  | 'gm_phone'
  | 'pm_phone'
  | 'ld_phone'
  | 'ald_phone'
  | 'pe_phone'
  | 'prep_start_date'
  | 'prep_end_date'
  | 'load_in_date'
  | 'first_preview_date'
  | 'opening_night_date'
  | 'closing_date'
  | 'load_out_date'
  | 'revision_number'
  | 'document_title'
  | 'logo';

export function PageRenderer({ section, project, pageSettings, pageNumber }: PageRendererProps) {
  const [layout, setLayout] = useState<PageLayoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Page dimensions in pixels (at 96 DPI)
  const pageDimensions = {
    letter: { width: 816, height: 1056 },
    legal: { width: 816, height: 1344 },
    a4: { width: 794, height: 1123 },
    tabloid: { width: 1056, height: 1632 },
  };

  const isLandscape = pageSettings.orientation === 'landscape';
  const pageSize = pageSettings.pageSize.toLowerCase() as keyof typeof pageDimensions;
  const dims = pageDimensions[pageSize] || pageDimensions.letter;

  const pageWidth = isLandscape ? dims.height : dims.width;
  const pageHeight = isLandscape ? dims.width : dims.height;

  // Convert margins from inches to pixels (96 DPI)
  const marginTop = pageSettings.margins.top * 96;
  const marginRight = pageSettings.margins.right * 96;
  const marginBottom = pageSettings.margins.bottom * 96;
  const marginLeft = pageSettings.margins.left * 96;

  // Content area dimensions
  const contentWidth = pageWidth - marginLeft - marginRight;
  const contentHeight = pageHeight - marginTop - marginBottom;

  // Calculate scale to fit page in viewport
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth - 16; // Account for padding (p-2 = 8px on each side)
      const containerHeight = container.clientHeight - 16;

      // Calculate scale to fit both width and height with some margin
      const scaleX = containerWidth / pageWidth;
      const scaleY = containerHeight / pageHeight;

      // Use the smaller scale to ensure the page fits completely
      const newScale = Math.min(scaleX, scaleY, 1); // Cap at 1 (100%)
      setScale(newScale);
    };

    calculateScale();

    // Recalculate on window resize
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [pageWidth, pageHeight]);

  useEffect(() => {
    async function loadLayout() {
      try {
        setLoading(true);

        // Load the default layout for this section type
        const defaultLayout = await window.api.prep.layoutTemplates.getDefault(
          project.id,
          section.type
        );

        if (defaultLayout) {
          // Load elements for this layout
          const elements = await window.api.prep.layoutTemplates.getElements(defaultLayout.id);

          const parsedElements = elements.map((el: any) => ({
            ...el,
            config: JSON.parse(el.config),
            style: JSON.parse(el.style),
          }));

          setLayout({
            ...defaultLayout,
            elements: parsedElements,
          });
        }
      } catch (error) {
        console.error('Error loading page layout:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLayout();
  }, [section.type, project.id]);

  function getDataFieldValue(fieldType: DataFieldType): string {
    const formatDate = (timestamp?: string | number): string => {
      if (!timestamp) return 'Not set';
      try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return String(timestamp);
      }
    };

    switch (fieldType) {
      case 'production_name':
        return project.production_name || 'Untitled Production';
      case 'venue':
        return project.venue || 'TBD';
      case 'venue_city':
        return project.venue_city || '';
      case 'venue_state':
        return project.venue_state || '';
      case 'order_date':
        return formatDate(project.order_date);
      case 'designer_name':
        return project.ld_name || 'TBD';
      case 'gm_name':
        return project.gm_name || '';
      case 'pm_name':
        return project.pm_name || '';
      case 'ld_name':
        return project.ld_name || '';
      case 'ald_name':
        return project.ald_name || '';
      case 'pe_name':
        return project.pe_name || '';
      case 'gm_email':
        return project.gm_email || '';
      case 'pm_email':
        return project.pm_email || '';
      case 'ld_email':
        return project.ld_email || '';
      case 'ald_email':
        return project.ald_email || '';
      case 'pe_email':
        return project.pe_email || '';
      case 'gm_phone':
        return project.gm_phone || '';
      case 'pm_phone':
        return project.pm_phone || '';
      case 'ld_phone':
        return project.ld_phone || '';
      case 'ald_phone':
        return project.ald_phone || '';
      case 'pe_phone':
        return project.pe_phone || '';
      case 'prep_start_date':
        return formatDate(project.prep_start_date);
      case 'prep_end_date':
        return formatDate(project.prep_end_date);
      case 'load_in_date':
        return formatDate(project.load_in_date);
      case 'first_preview_date':
        return formatDate(project.first_preview_date);
      case 'opening_night_date':
        return formatDate(project.opening_night_date);
      case 'closing_date':
        return formatDate(project.closing_date);
      case 'load_out_date':
        return formatDate(project.load_out_date);
      case 'revision_number':
        return String(project.current_revision);
      case 'document_title':
        return section.config?.title || 'SHOP ORDER';
      case 'logo':
        return ''; // TODO: Handle logo images
      default:
        return '';
    }
  }

  function renderElement(element: LayoutElement) {
    const { grid_column, grid_row, column_span, row_span, config, style } = element;

    // Calculate pixel position from grid
    const gridColumns = layout?.grid_columns || 12;
    const gridRows = layout?.grid_rows || 20;
    const cellWidth = contentWidth / gridColumns;
    const cellHeight = contentHeight / gridRows;

    const left = grid_column * cellWidth;
    const top = grid_row * cellHeight;
    const width = column_span * cellWidth;
    const height = row_span * cellHeight;

    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      fontFamily: style.fontFamily || pageSettings.fontFamily || 'Arial',
      fontSize: `${style.fontSize || pageSettings.fontSize || 12}pt`, // Increased default to 12pt
      fontWeight: style.fontWeight || 'normal',
      textAlign: (style.textAlign as any) || 'left',
      color: style.color || '#000',
      backgroundColor: style.backgroundColor || 'transparent',
      padding: `${style.padding || 0}px`,
      overflow: 'visible', // Changed from 'hidden' to allow text to show
      display: 'flex',
      alignItems: 'center',
    };

    if (element.element_type === 'dataField') {
      const value = getDataFieldValue(config.fieldType);
      const label = config.showLabel ? `${config.fieldType.replace(/_/g, ' ')}: ` : '';
      const displayValue = value || '—'; // Show em dash if empty

      return (
        <div key={element.id} style={elementStyle}>
          {label && <span style={{ fontWeight: 'bold' }}>{label}</span>}
          <span style={{ color: value ? (style.color || '#000') : '#999' }}>{displayValue}</span>
        </div>
      );
    }

    if (element.element_type === 'text') {
      return (
        <div key={element.id} style={elementStyle}>
          {config.text || '[No Text]'}
        </div>
      );
    }

    if (element.element_type === 'shape') {
      const shapeStyle: React.CSSProperties = {
        ...elementStyle,
        border: config.borderWidth ? `${config.borderWidth}px solid ${config.borderColor || '#000'}` : 'none',
      };

      if (config.shapeType === 'rectangle') {
        return <div key={element.id} style={shapeStyle} />;
      }
      if (config.shapeType === 'line') {
        return (
          <div
            key={element.id}
            style={{
              ...shapeStyle,
              borderBottom: `${config.borderWidth || 1}px solid ${config.borderColor || '#000'}`,
              height: '0',
            }}
          />
        );
      }
    }

    // TODO: Handle table, image elements
    return null;
  }

  if (loading) {
    return (
      <div
        ref={containerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="bg-white shadow-lg relative"
          style={{
            width: `${pageWidth}px`,
            height: `${pageHeight}px`,
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading layout...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!layout) {
    return (
      <div
        ref={containerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="bg-white shadow-lg relative"
          style={{
            width: `${pageWidth}px`,
            height: `${pageHeight}px`,
            padding: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-lg font-semibold mb-2">No Layout Found</div>
              <div className="text-sm">
                No default layout exists for {section.type}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      <div
        className="bg-white shadow-lg relative"
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
        }}
      >
      {/* Margin guides (visual only, not printed) */}
      <div
        className="absolute border border-dashed border-gray-300 pointer-events-none"
        style={{
          top: `${marginTop}px`,
          left: `${marginLeft}px`,
          right: `${marginRight}px`,
          bottom: `${marginBottom}px`,
        }}
      />

      {/* Content area */}
      <div
        className="absolute"
        style={{
          top: `${marginTop}px`,
          left: `${marginLeft}px`,
          width: `${contentWidth}px`,
          height: `${contentHeight}px`,
        }}
      >
        {layout.elements.map((element) => renderElement(element))}
      </div>

        {/* Page number */}
        {pageSettings.showPageNumbers && pageNumber !== undefined && (
          <div
            className="absolute text-gray-600 text-sm"
            style={{
              bottom: `${marginBottom / 2}px`,
              right: `${marginRight}px`,
              fontFamily: pageSettings.fontFamily || 'Arial',
            }}
          >
            {pageNumber}
          </div>
        )}
      </div>
    </div>
  );
}
