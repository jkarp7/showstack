import { useState, useRef } from 'react';
import type { LayoutElement, PageLayoutTemplate, PrepProject, DataFieldType } from '../../../types/prep';

/**
 * Helper function to get actual data value from PrepProject based on field type
 */
function getDataFieldValue(project: PrepProject | undefined, fieldType: DataFieldType): string {
  if (!project) {
    return `{${fieldType}}`;
  }

  // Format dates nicely
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
    // Production info
    case 'production_name':
      return project.production_name || 'Untitled Production';
    case 'venue':
      return project.venue || 'TBD';
    case 'venue_city':
      return project.venue_city || '';
    case 'venue_state':
      return project.venue_state || '';

    // Dates
    case 'order_date':
      return formatDate(project.order_date);
    case 'prep_start_date':
      return formatDate(project.prep_start_date);
    case 'prep_end_date':
      return formatDate(project.prep_end_date);
    case 'load_in_date':
      return formatDate(project.load_in_date);
    case 'opening_night_date':
      return formatDate(project.opening_night_date);
    case 'closing_date':
      return formatDate(project.closing_date);
    case 'load_out_date':
      return formatDate(project.load_out_date);

    // Contacts - GM
    case 'gm_name':
      return project.gm_name || '';
    case 'gm_company':
      return project.gm_company || '';
    case 'gm_email':
      return project.gm_email || '';
    case 'gm_phone':
      return project.gm_phone || '';

    // Contacts - PM
    case 'pm_name':
      return project.pm_name || '';
    case 'pm_company':
      return project.pm_company || '';
    case 'pm_email':
      return project.pm_email || '';
    case 'pm_phone':
      return project.pm_phone || '';

    // Contacts - LD
    case 'ld_name':
      return project.ld_name || '';
    case 'ld_email':
      return project.ld_email || '';
    case 'ld_phone':
      return project.ld_phone || '';

    // Contacts - ALD
    case 'ald_name':
      return project.ald_name || '';
    case 'ald_email':
      return project.ald_email || '';
    case 'ald_phone':
      return project.ald_phone || '';

    // Contacts - PE
    case 'pe_name':
      return project.pe_name || '';
    case 'pe_email':
      return project.pe_email || '';
    case 'pe_phone':
      return project.pe_phone || '';

    // Other
    case 'current_revision':
      return `Revision ${project.current_revision}`;
    case 'disciplines':
      return Array.isArray(project.disciplines)
        ? project.disciplines.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
        : 'Not specified';
    case 'logo':
      return project.logo_url || 'No logo';

    default:
      return `{${fieldType}}`;
  }
}

interface LayoutCanvasProps {
  template: PageLayoutTemplate;
  currentProject?: PrepProject; // Optional: actual project data for live preview
  selectedElementId: string | null;
  onElementSelect: (elementId: string | null) => void;
  onElementDrop: (gridColumn: number, gridRow: number) => void;
  onElementMove: (elementId: string, gridColumn: number, gridRow: number) => void;
  onElementResize: (elementId: string, columnSpan: number, rowSpan: number) => void;
  onElementDelete: (elementId: string) => void;
  zoom?: number;
  showGrid?: boolean;
}

export function LayoutCanvas({
  template,
  currentProject,
  selectedElementId,
  onElementSelect,
  onElementDrop,
  onElementMove,
  onElementResize,
  onElementDelete,
  zoom: externalZoom,
  showGrid: externalShowGrid
}: LayoutCanvasProps) {
  // Use external zoom/grid if provided, otherwise use defaults
  const zoom = externalZoom ?? 100;
  const showGrid = externalShowGrid ?? true;
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ col: number; row: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'e' | 's' | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate cell dimensions based on page size and grid
  const cellWidth = template.page_width / template.grid_columns;
  const cellHeight = template.page_height / template.grid_rows;

  const handleDragOver = (e: React.DragEvent, col: number, row: number) => {
    e.preventDefault(); // Always prevent default to allow drop
    e.stopPropagation();
    setDragOverCell({ col, row });
  };

  const handleDrop = (e: React.DragEvent, col: number, row: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCell(null);

    if (draggedElement) {
      // Moving existing element
      onElementMove(draggedElement, col, row);
      setDraggedElement(null);
    } else {
      // Dropping new element from palette
      onElementDrop(col, row);
    }
  };

  const handleElementDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId);
    onElementSelect(elementId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedElementId && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      onElementDelete(selectedElementId);
    }
  };

  const getElementAtPosition = (col: number, row: number): LayoutElement | null => {
    return template.elements.find(el =>
      col >= el.grid_column &&
      col < el.grid_column + el.column_span &&
      row >= el.grid_row &&
      row < el.grid_row + el.row_span
    ) || null;
  };

  return (
    <div className="flex-1 bg-gray-900 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
      {/* Canvas */}
      <div className="flex-1 overflow-auto p-8 bg-gray-850">
        <div className="flex items-center justify-center min-h-full">
          <div
            ref={canvasRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(e) => {
              e.preventDefault();

              // Get the canvas element's bounding rect
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;

              // Calculate the position relative to the canvas
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;

              // Account for zoom
              const actualX = x / (zoom / 100);
              const actualY = y / (zoom / 100);

              // Calculate grid column and row
              const col = Math.floor(actualX / cellWidth);
              const row = Math.floor(actualY / cellHeight);

              // Clamp to grid bounds
              const gridCol = Math.max(0, Math.min(col, template.grid_columns - 1));
              const gridRow = Math.max(0, Math.min(row, template.grid_rows - 1));

              // Check if cell is occupied
              const element = getElementAtPosition(gridCol, gridRow);
              if (!element) {
                handleDrop(e, gridCol, gridRow);
              }
            }}
            className="relative bg-white shadow-2xl outline-none"
            style={{
              width: `${template.page_width * (zoom / 100)}px`,
              height: `${template.page_height * (zoom / 100)}px`,
              transform: `scale(1)`,
              transformOrigin: 'center'
            }}
          >
            {/* Grid - Enhanced with better visibility */}
            {showGrid && (
              <>
                {/* Fine grid lines */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)
                    `,
                    backgroundSize: `${cellWidth * (zoom / 100)}px ${cellHeight * (zoom / 100)}px`
                  }}
                />
                {/* Bold grid lines every 4 cells for better visual hierarchy */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(148, 163, 184, 0.6) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(148, 163, 184, 0.6) 1px, transparent 1px)
                    `,
                    backgroundSize: `${cellWidth * 4 * (zoom / 100)}px ${cellHeight * 4 * (zoom / 100)}px`
                  }}
                />
              </>
            )}

            {/* Snap Guides - Show when dragging elements */}
            {snapGuides.x.map((x, i) => (
              <div
                key={`snap-x-${i}`}
                className="absolute pointer-events-none bg-blue-500 opacity-50"
                style={{
                  left: `${x * (zoom / 100)}px`,
                  top: 0,
                  width: '1px',
                  height: '100%',
                  zIndex: 9999
                }}
              />
            ))}
            {snapGuides.y.map((y, i) => (
              <div
                key={`snap-y-${i}`}
                className="absolute pointer-events-none bg-blue-500 opacity-50"
                style={{
                  top: `${y * (zoom / 100)}px`,
                  left: 0,
                  height: '1px',
                  width: '100%',
                  zIndex: 9999
                }}
              />
            ))}

            {/* Grid Cells (Drop Zones) */}
            <div className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${template.grid_columns}, 1fr)`,
                gridTemplateRows: `repeat(${template.grid_rows}, 1fr)`
              }}
            >
              {Array.from({ length: template.grid_rows }).map((_, rowIndex) =>
                Array.from({ length: template.grid_columns }).map((_, colIndex) => {
                  const element = getElementAtPosition(colIndex, rowIndex);
                  const isOccupied = element !== null;
                  const isDragOver = dragOverCell?.col === colIndex && dragOverCell?.row === rowIndex;

                  // Only render drop zone if this is the top-left corner of an occupied cell or unoccupied
                  if (isOccupied && (element.grid_column !== colIndex || element.grid_row !== rowIndex)) {
                    return null;
                  }

                  return (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      onDragOver={(e) => handleDragOver(e, colIndex, rowIndex)}
                      onDrop={(e) => {
                        if (!isOccupied) {
                          handleDrop(e, colIndex, rowIndex);
                        } else {
                          e.preventDefault(); // Still need to prevent default even if occupied
                        }
                      }}
                      className={`transition-all duration-200 ${
                        isDragOver && !isOccupied
                          ? 'bg-blue-200/60 border-2 border-blue-500 border-dashed shadow-lg animate-pulse'
                          : isDragOver && isOccupied
                          ? 'bg-red-200/40 border-2 border-red-400 border-dashed'
                          : draggedElement || dragOverCell
                          ? !isOccupied
                            ? 'bg-green-100/30 border border-green-300/50'
                            : 'bg-red-50/20 border border-red-300/30'
                          : 'border border-transparent'
                      }`}
                      style={{
                        gridColumn: isOccupied ? `span ${element.column_span}` : undefined,
                        gridRow: isOccupied ? `span ${element.row_span}` : undefined,
                        cursor: isOccupied ? 'not-allowed' : 'crosshair',
                        minHeight: isOccupied ? undefined : '20px'
                      }}
                    >
                      {/* Drop Zone Indicator */}
                      {isDragOver && !isOccupied && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs shadow-lg">
                            Drop here
                          </div>
                        </div>
                      )}
                      {isDragOver && isOccupied && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs shadow-lg">
                            Occupied
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Ghost Element Preview - Shows where element will drop */}
            {dragOverCell && draggedElement && (() => {
              const element = template.elements.find(el => el.id === draggedElement);
              if (!element) return null;

              // Check if drop location is valid (not occupied)
              const targetElement = getElementAtPosition(dragOverCell.col, dragOverCell.row);
              const isValidDrop = !targetElement;

              return (
                <div
                  className={`absolute pointer-events-none border-2 rounded ${
                    isValidDrop
                      ? 'border-blue-500 bg-blue-100/40 border-dashed'
                      : 'border-red-500 bg-red-100/40 border-dashed'
                  }`}
                  style={{
                    left: `${dragOverCell.col * cellWidth * (zoom / 100)}px`,
                    top: `${dragOverCell.row * cellHeight * (zoom / 100)}px`,
                    width: `${element.column_span * cellWidth * (zoom / 100)}px`,
                    height: `${element.row_span * cellHeight * (zoom / 100)}px`,
                    zIndex: 9998
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-xs font-medium px-2 py-1 rounded ${
                      isValidDrop
                        ? 'bg-blue-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {isValidDrop ? '✓ Drop' : '✗ Occupied'}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Elements */}
            {template.elements
              .sort((a, b) => a.layer - b.layer)
              .map((element) => (
                <div
                  key={element.id}
                  draggable
                  onDragStart={(e) => handleElementDragStart(e, element.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onElementSelect(element.id);
                  }}
                  className={`absolute cursor-move transition-all ${
                    draggedElement === element.id
                      ? 'opacity-40 scale-95 ring-2 ring-blue-400 ring-dashed'
                      : selectedElementId === element.id
                      ? 'ring-2 ring-blue-500 ring-offset-2 shadow-xl'
                      : 'hover:ring-2 hover:ring-gray-400 hover:shadow-md'
                  }`}
                  style={{
                    left: `${element.grid_column * cellWidth * (zoom / 100)}px`,
                    top: `${element.grid_row * cellHeight * (zoom / 100)}px`,
                    width: `${element.column_span * cellWidth * (zoom / 100)}px`,
                    height: `${element.row_span * cellHeight * (zoom / 100)}px`,
                    zIndex: element.layer,
                    backgroundColor: element.style.backgroundColor || 'transparent',
                    color: element.style.color || '#000',
                    fontSize: `${(element.style.fontSize || 12) * (zoom / 100)}px`,
                    fontFamily: element.style.fontFamily || 'Arial',
                    fontWeight: element.style.fontWeight || 'normal',
                    fontStyle: element.style.fontStyle || 'normal',
                    textAlign: element.style.textAlign || 'left',
                    textDecoration: element.style.textDecoration || 'none',
                    lineHeight: element.style.lineHeight || 1.5,
                    letterSpacing: element.style.letterSpacing ? `${element.style.letterSpacing * (zoom / 100)}px` : 'normal',
                    // Individual padding support - use individual if set, otherwise use unified
                    padding: element.style.paddingTop !== undefined
                      ? `${element.style.paddingTop * (zoom / 100)}px ${element.style.paddingRight * (zoom / 100)}px ${element.style.paddingBottom * (zoom / 100)}px ${element.style.paddingLeft * (zoom / 100)}px`
                      : `${(element.style.padding || 8) * (zoom / 100)}px`,
                    borderWidth: `${(element.style.borderWidth || 0) * (zoom / 100)}px`,
                    borderStyle: element.style.borderStyle || 'none',
                    borderColor: element.style.borderColor || '#000',
                    borderRadius: `${(element.style.borderRadius || 0) * (zoom / 100)}px`,
                    opacity: element.style.opacity || 1
                  }}
                >
                  {/* Element Content Preview */}
                  <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    {element.element_type === 'dataField' && (
                      <div className={currentProject ? '' : 'text-gray-500 italic'}>
                        {(element.config as any).showLabel && (element.config as any).label && (
                          <span className="font-semibold">{(element.config as any).label}: </span>
                        )}
                        {getDataFieldValue(currentProject, (element.config as any).fieldType)}
                      </div>
                    )}
                    {element.element_type === 'text' && (
                      <div className="text-xs">
                        {(element.config as any).content || 'Text content...'}
                      </div>
                    )}
                    {element.element_type === 'image' && (
                      <>
                        {(element.config as any).src ? (
                          <img
                            src={(element.config as any).src}
                            alt={(element.config as any).altText || 'Image'}
                            className="w-full h-full"
                            style={{
                              objectFit: (element.config as any).objectFit || 'contain'
                            }}
                          />
                        ) : (
                          <div className="text-xs text-gray-500 italic flex flex-col items-center justify-center h-full">
                            <div className="text-2xl mb-1">🖼️</div>
                            <div>No image</div>
                            <div className="text-xs mt-1">Upload in inspector</div>
                          </div>
                        )}
                      </>
                    )}
                    {element.element_type === 'table' && (
                      <div className="text-xs text-gray-500 italic flex flex-col items-center justify-center">
                        <div className="text-2xl mb-1">📋</div>
                        <div>Contact Table</div>
                      </div>
                    )}
                    {element.element_type === 'shape' && (
                      <div className="w-full h-full" style={{
                        backgroundColor: (element.config as any).color || '#000'
                      }} />
                    )}
                  </div>

                  {/* Selection Indicator and Resize Handles */}
                  {selectedElementId === element.id && (
                    <>
                      {/* Element info label */}
                      <div className="absolute -top-6 left-0 bg-blue-500 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap pointer-events-none shadow-lg">
                        {element.element_type}
                        {' '}
                        ({element.column_span}×{element.row_span})
                      </div>

                      {/* Resize Handles */}
                      {/* Bottom-right corner handle */}
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize hover:scale-125 transition-transform shadow-md"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeHandle('se');
                        }}
                      />

                      {/* Right edge handle */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-6 bg-white border-2 border-blue-500 rounded-sm cursor-e-resize hover:scale-125 transition-transform shadow-md"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeHandle('e');
                        }}
                      />

                      {/* Bottom edge handle */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-6 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-s-resize hover:scale-125 transition-transform shadow-md"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeHandle('s');
                        }}
                      />
                    </>
                  )}
                </div>
              ))}

            {/* Empty State */}
            {template.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">📐</div>
                  <div className="text-sm">Drag elements from the palette to start designing</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div>
          {template.elements.length} element{template.elements.length !== 1 ? 's' : ''}
          {selectedElementId && ' • 1 selected'}
        </div>
        <div>
          {template.page_width} × {template.page_height}px
          {' '}• Page: {template.page_type}
        </div>
      </div>
    </div>
  );
}
