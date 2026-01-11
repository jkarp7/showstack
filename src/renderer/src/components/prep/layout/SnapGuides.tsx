import { useMemo } from 'react';
import type { LayoutElement } from '../../../types/prep';

interface SnapGuidesProps {
  elements: LayoutElement[];
  draggedElementId: string | null;
  draggedElement: LayoutElement | null;
  dragPosition: { col: number; row: number } | null;
  cellWidth: number;
  cellHeight: number;
  zoom: number;
  snapEnabled?: boolean;
}

interface Guide {
  position: number;
  type: 'vertical' | 'horizontal';
  alignmentType: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle';
}

export function SnapGuides({
  elements,
  draggedElementId,
  draggedElement,
  dragPosition,
  cellWidth,
  cellHeight,
  zoom,
  snapEnabled = true
}: SnapGuidesProps) {
  const guides = useMemo(() => {
    if (!draggedElement || !dragPosition || !snapEnabled) {
      return { vertical: [], horizontal: [] };
    }

    const guides: { vertical: Guide[]; horizontal: Guide[] } = {
      vertical: [],
      horizontal: []
    };

    // Calculate dragged element boundaries
    const dragLeft = dragPosition.col * cellWidth;
    const dragRight = (dragPosition.col + draggedElement.column_span) * cellWidth;
    const dragCenterX = (dragLeft + dragRight) / 2;
    const dragTop = dragPosition.row * cellHeight;
    const dragBottom = (dragPosition.row + draggedElement.row_span) * cellHeight;
    const dragCenterY = (dragTop + dragBottom) / 2;

    const SNAP_THRESHOLD = 5; // pixels

    // Check alignment with other elements
    elements.forEach(el => {
      if (el.id === draggedElementId) return; // Skip self

      const elLeft = el.grid_column * cellWidth;
      const elRight = (el.grid_column + el.column_span) * cellWidth;
      const elCenterX = (elLeft + elRight) / 2;
      const elTop = el.grid_row * cellHeight;
      const elBottom = (el.grid_row + el.row_span) * cellHeight;
      const elCenterY = (elTop + elBottom) / 2;

      // Vertical guides (X-axis alignment)
      // Left edge alignment
      if (Math.abs(dragLeft - elLeft) < SNAP_THRESHOLD) {
        guides.vertical.push({ position: elLeft, type: 'vertical', alignmentType: 'left' });
      }
      // Right edge alignment
      if (Math.abs(dragRight - elRight) < SNAP_THRESHOLD) {
        guides.vertical.push({ position: elRight, type: 'vertical', alignmentType: 'right' });
      }
      // Center alignment
      if (Math.abs(dragCenterX - elCenterX) < SNAP_THRESHOLD) {
        guides.vertical.push({ position: elCenterX, type: 'vertical', alignmentType: 'center' });
      }
      // Right edge to left edge
      if (Math.abs(dragRight - elLeft) < SNAP_THRESHOLD) {
        guides.vertical.push({ position: elLeft, type: 'vertical', alignmentType: 'left' });
      }
      // Left edge to right edge
      if (Math.abs(dragLeft - elRight) < SNAP_THRESHOLD) {
        guides.vertical.push({ position: elRight, type: 'vertical', alignmentType: 'right' });
      }

      // Horizontal guides (Y-axis alignment)
      // Top edge alignment
      if (Math.abs(dragTop - elTop) < SNAP_THRESHOLD) {
        guides.horizontal.push({ position: elTop, type: 'horizontal', alignmentType: 'top' });
      }
      // Bottom edge alignment
      if (Math.abs(dragBottom - elBottom) < SNAP_THRESHOLD) {
        guides.horizontal.push({ position: elBottom, type: 'horizontal', alignmentType: 'bottom' });
      }
      // Middle alignment
      if (Math.abs(dragCenterY - elCenterY) < SNAP_THRESHOLD) {
        guides.horizontal.push({ position: elCenterY, type: 'horizontal', alignmentType: 'middle' });
      }
      // Bottom edge to top edge
      if (Math.abs(dragBottom - elTop) < SNAP_THRESHOLD) {
        guides.horizontal.push({ position: elTop, type: 'horizontal', alignmentType: 'top' });
      }
      // Top edge to bottom edge
      if (Math.abs(dragTop - elBottom) < SNAP_THRESHOLD) {
        guides.horizontal.push({ position: elBottom, type: 'horizontal', alignmentType: 'bottom' });
      }
    });

    // Remove duplicate guides
    guides.vertical = Array.from(
      new Map(guides.vertical.map(g => [g.position, g])).values()
    );
    guides.horizontal = Array.from(
      new Map(guides.horizontal.map(g => [g.position, g])).values()
    );

    return guides;
  }, [elements, draggedElementId, draggedElement, dragPosition, cellWidth, cellHeight, snapEnabled]);

  if (!snapEnabled || guides.vertical.length === 0 && guides.horizontal.length === 0) {
    return null;
  }

  return (
    <>
      {/* Vertical guides */}
      {guides.vertical.map((guide, index) => (
        <div
          key={`v-${index}`}
          className="absolute pointer-events-none bg-pink-500 opacity-70 shadow-lg"
          style={{
            left: `${guide.position * (zoom / 100)}px`,
            top: 0,
            width: '2px',
            height: '100%',
            zIndex: 10000
          }}
        >
          {/* Guide label */}
          <div
            className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap"
            style={{ fontSize: '10px' }}
          >
            {guide.alignmentType}
          </div>
        </div>
      ))}

      {/* Horizontal guides */}
      {guides.horizontal.map((guide, index) => (
        <div
          key={`h-${index}`}
          className="absolute pointer-events-none bg-pink-500 opacity-70 shadow-lg"
          style={{
            top: `${guide.position * (zoom / 100)}px`,
            left: 0,
            height: '2px',
            width: '100%',
            zIndex: 10000
          }}
        >
          {/* Guide label */}
          <div
            className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap"
            style={{ fontSize: '10px' }}
          >
            {guide.alignmentType}
          </div>
        </div>
      ))}
    </>
  );
}
