import { useEffect, useState, useRef } from 'react';
import type {
  PrintSection,
  ShopOrderProject,
  PageLayoutTemplate,
  LayoutElement,
} from '../../types/shopOrder';
import { formatPhoneNumber } from '../../utils/phoneFormatter';
import { logger } from '../../utils/logger';

interface PageRendererProps {
  section: PrintSection;
  project: ShopOrderProject;
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
  | 'gm_company'
  | 'pm_name'
  | 'pm_company'
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
  | 'current_revision'
  | 'revision_number'
  | 'document_title'
  | 'logo';

export function PageRenderer({ section, project, pageSettings, pageNumber }: PageRendererProps) {
  const [layout, setLayout] = useState<PageLayoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
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

      // Get actual available space, accounting for padding
      const availableWidth = container.clientWidth - 16; // p-2 = 8px each side
      const availableHeight = container.clientHeight - 16;

      // Calculate scale with extra margin for better fit on small screens
      const scaleX = (availableWidth * 0.9) / pageWidth; // 90% for more aggressive scaling
      const scaleY = (availableHeight * 0.9) / pageHeight;

      // Use the smaller scale to ensure the page fits completely
      const newScale = Math.min(scaleX, scaleY, 1); // Cap at 1 (100%)
      setScale(newScale);
    };

    // Initial calculation
    calculateScale();

    // Small delay to ensure DOM is ready
    setTimeout(calculateScale, 100);

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
          section.type,
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
        logger.error('Error loading page layout:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLayout();
  }, [section.type, project.id]);

  // Load logo as data URL
  useEffect(() => {
    const loadLogo = async () => {
      // Try to find logo path from ShopOrderProject or parent Project
      let logoPath = project.logo_path || (project as any).logo_storage_path;

      // If no logo in ShopOrderProject, check parent project
      if (!logoPath && (project as any).parent_project_id) {
        logger.info('[PageRenderer] No logo in ShopOrderProject, checking parent project...');
        try {
          const parentProject = await window.api.projects.getById(
            (project as any).parent_project_id,
          );
          if (parentProject?.logo_path) {
            logger.info('[PageRenderer] Found logo in parent project:', parentProject.logo_path);
            logoPath = parentProject.logo_path;
          } else {
            logger.info('[PageRenderer] Parent project has no logo');
          }
        } catch (error) {
          logger.error('[PageRenderer] Error loading parent project:', error);
        }
      }

      if (!logoPath) {
        setLogoDataUrl(null);
        return;
      }

      // If already a data URL or http(s) URL, use as-is
      if (
        logoPath.startsWith('data:') ||
        logoPath.startsWith('http://') ||
        logoPath.startsWith('https://')
      ) {
        setLogoDataUrl(logoPath);
        return;
      }

      // Read file as data URL
      try {
        if (typeof window !== 'undefined' && window.api?.files) {
          const dataUrl = await window.api.files.readImageAsDataUrl(logoPath);
          setLogoDataUrl(dataUrl);
        }
      } catch (error) {
        logger.error('[PageRenderer] Error loading logo:', error);
        setLogoDataUrl(null);
      }
    };

    loadLogo();
  }, [project.logo_path, (project as any).logo_storage_path, (project as any).parent_project_id]);

  function getDataFieldValue(fieldType: DataFieldType): string {
    const formatDate = (timestamp?: string | number): string => {
      if (!timestamp) return 'Not set';
      try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
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
      case 'gm_company':
        return project.gm_company || '';
      case 'pm_name':
        return project.pm_name || '';
      case 'pm_company':
        return project.pm_company || '';
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
        return formatPhoneNumber(project.gm_phone) || '';
      case 'pm_phone':
        return formatPhoneNumber(project.pm_phone) || '';
      case 'ld_phone':
        return formatPhoneNumber(project.ld_phone) || '';
      case 'ald_phone':
        return formatPhoneNumber(project.ald_phone) || '';
      case 'pe_phone':
        return formatPhoneNumber(project.pe_phone) || '';
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
        // Return logo path from project (logo_url or logo_storage_path)
        return project.logo_url || project.logo_storage_path || '';
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

    // Map textAlign to justify-content for flexbox
    const getJustifyContent = (textAlign: string) => {
      switch (textAlign) {
        case 'center':
          return 'center';
        case 'right':
          return 'flex-end';
        case 'left':
        default:
          return 'flex-start';
      }
    };

    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      fontFamily: style.fontFamily || pageSettings.fontFamily || 'Arial',
      fontSize: `${style.fontSize || pageSettings.fontSize || 12}pt`,
      fontWeight: style.fontWeight || 'normal',
      color: style.color || '#000',
      backgroundColor: style.backgroundColor || 'transparent',
      padding: `${style.padding || 0}px`,
      overflow: 'visible',
      display: 'flex',
      alignItems: 'center',
      justifyContent: getJustifyContent(style.textAlign || 'left'),
    };

    if (element.element_type === 'dataField') {
      const value = getDataFieldValue(config.fieldType);
      const label = config.showLabel && config.label ? config.label : '';
      const displayValue = value || '';

      // Special handling for logo field - render as image
      if (config.fieldType === 'logo' && logoDataUrl) {
        return (
          <div key={element.id} style={{ ...elementStyle, padding: 0 }}>
            <img
              src={logoDataUrl}
              alt="Project Logo"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        );
      }

      // Don't render if no value and not showing label
      if (!value && !label) return null;

      return (
        <div key={element.id} style={elementStyle}>
          {label && <span style={{ fontWeight: style.fontWeight || 'normal' }}>{label} </span>}
          <span style={{ color: value ? style.color || '#000' : '#999' }}>{displayValue}</span>
        </div>
      );
    }

    if (element.element_type === 'text') {
      // Don't render empty text elements
      const content = config.content || '';
      if (!content) return null;

      // Replace placeholders with actual data
      let displayText = content;

      // Replace data field placeholders
      const placeholderRegex = /\{([^}]+)\}/g;
      displayText = displayText.replace(placeholderRegex, (match, fieldName) => {
        return getDataFieldValue(fieldName) || '';
      });

      // Don't render if text is now empty after replacements
      if (!displayText.trim()) return null;

      return (
        <div key={element.id} style={elementStyle}>
          {displayText}
        </div>
      );
    }

    if (element.element_type === 'shape') {
      const thickness = config.thickness || 1;
      const color = config.color || style.backgroundColor || '#000';

      const shapeStyle: React.CSSProperties = {
        ...elementStyle,
      };

      if (config.shapeType === 'rectangle') {
        return <div key={element.id} style={{ ...shapeStyle, backgroundColor: color }} />;
      }
      if (config.shapeType === 'line' || config.shapeType === 'divider') {
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: `${left}px`,
              top: `${top + height / 2}px`,
              width: `${width}px`,
              borderBottom: `${thickness}px solid ${color}`,
              height: '0',
            }}
          />
        );
      }
    }

    // Image elements
    if (element.element_type === 'image') {
      const src = config.src || '';
      if (!src) return null;

      return (
        <div key={element.id} style={{ ...elementStyle, padding: 0 }}>
          <img
            src={src}
            alt={config.altText || 'Image'}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: config.objectFit || 'contain',
            }}
          />
        </div>
      );
    }

    // Dynamic content: Equipment List
    if (element.element_type === 'equipment_list') {
      return (
        <div
          key={element.id}
          style={{
            ...elementStyle,
            overflow: 'auto',
            display: 'block',
            alignItems: 'flex-start',
            padding: '8px',
          }}
        >
          <div
            className="text-xs font-semibold mb-2"
            style={{
              color: '#374151',
              backgroundColor: '#DBEAFE',
              padding: '6px',
              textAlign: 'center',
            }}
          >
            EQUIPMENT LIST
          </div>
          <div className="text-xs text-gray-600 italic">
            Equipment items grouped by section will appear here
            <br />
            Full details render in PDF export
          </div>
        </div>
      );
    }

    // Dynamic content: Notes
    if (element.element_type === 'notes_content') {
      return (
        <div
          key={element.id}
          style={{
            ...elementStyle,
            overflow: 'auto',
            display: 'block',
            alignItems: 'flex-start',
            padding: '12px',
          }}
        >
          <div className="text-xs text-gray-600 italic">
            Notes content ({config.noteType || 'general_notes'}) will appear here
            <br />
            Full content renders in PDF export
          </div>
        </div>
      );
    }

    // Dynamic content: Revision Log
    if (element.element_type === 'revision_log') {
      return (
        <div
          key={element.id}
          style={{
            ...elementStyle,
            overflow: 'auto',
            display: 'block',
            alignItems: 'flex-start',
            padding: '8px',
          }}
        >
          <div
            className="text-xs font-semibold mb-2"
            style={{
              color: '#92400E',
              backgroundColor: '#FEF3C7',
              padding: '6px',
              textAlign: 'center',
            }}
          >
            REVISION CHANGE LOG
          </div>
          <div className="text-xs text-gray-600 italic">
            Revision changes will appear here
            <br />
            Full changelog renders in PDF export
          </div>
        </div>
      );
    }

    // TODO: Handle table elements
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
              <div className="text-sm">No default layout exists for {section.type}</div>
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
