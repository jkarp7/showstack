/**
 * InteractiveTableHeader
 * Table header component with resize and reorder functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import { PaperworkColumnConfig } from '../../types/paperworkTemplate';
import { getColumnDisplayLabel } from '../../utils/paperwork/columnUtils';

interface InteractiveTableHeaderProps {
  column: PaperworkColumnConfig;
  columnIndex: number;
  totalColumns: number;
  onResize?: (columnId: string, newWidth: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onContextMenu?: (columnId: string, event: React.MouseEvent) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

export function InteractiveTableHeader({
  column,
  columnIndex,
  totalColumns,
  onResize,
  onReorder,
  onContextMenu,
  isDragging = false,
  isDropTarget = false
}: InteractiveTableHeaderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeStartWidth(column.width || 15);
  }, [column.width]);

  // Handle resize move
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX;
      const parentWidth = (e.target as HTMLElement).closest('table')?.offsetWidth || 800;
      const deltaPercent = (deltaX / parentWidth) * 100;
      const newWidth = Math.max(5, Math.min(50, resizeStartWidth + deltaPercent));

      if (onResize) {
        onResize(column.id, newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartX, resizeStartWidth, column.id, onResize]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnIndex.toString());

    // Create a ghost element
    const ghost = document.createElement('div');
    ghost.textContent = column.label;
    ghost.className = 'px-4 py-2 bg-blue-600 text-white rounded shadow-lg';
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, [column.label, columnIndex]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const toIndex = columnIndex;

    if (fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex);
    }
  }, [columnIndex, onReorder]);

  // Handle context menu
  const handleContextMenuClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(column.id, e);
    }
  }, [column.id, onContextMenu]);

  return (
    <th
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleContextMenuClick}
      style={{
        width: `${column.width}%`,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative'
      }}
      className={`
        bg-transparent text-black px-2 py-1 text-left text-sm font-semibold
        border-t border-b border-gray-300 select-none transition-opacity
        ${!isResizing ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isDropTarget ? 'bg-blue-100' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <span>{getColumnDisplayLabel(column)}</span>

        {/* Resize Handle */}
        {columnIndex < totalColumns - 1 && (
          <div
            onMouseDown={handleResizeStart}
            className={`
              absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
              hover:bg-blue-500 transition-colors
              ${isResizing ? 'bg-blue-500' : 'bg-transparent'}
            `}
            style={{ width: '4px' }}
          />
        )}
      </div>
    </th>
  );
}
