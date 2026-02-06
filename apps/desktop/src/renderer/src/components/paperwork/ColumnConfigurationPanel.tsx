/**
 * Column Configuration Panel
 * UI for configuring report columns (reorder, resize, visibility)
 */

import React, { useState } from 'react';
import { PaperworkColumnConfig } from '../../types/paperworkTemplate';

interface ColumnConfigurationPanelProps {
  columns: PaperworkColumnConfig[];
  reportType: string;
  onChange: (columns: PaperworkColumnConfig[]) => void;
}

export function ColumnConfigurationPanel({
  columns,
  reportType,
  onChange
}: ColumnConfigurationPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...columns];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, removed);
    onChange(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleToggleVisible = (id: string) => {
    onChange(
      columns.map(col =>
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleWidthChange = (id: string, width: number) => {
    onChange(
      columns.map(col =>
        col.id === id ? { ...col, width } : col
      )
    );
  };

  return (
    <div className="space-y-2">
      {columns.map((column, index) => (
        <div
          key={column.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`bg-gray-700 rounded-lg p-3 cursor-move transition ${
            draggedIndex === index ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={column.visible}
                onChange={() => handleToggleVisible(column.id)}
                className="w-4 h-4"
              />
              <span className="font-medium">{column.label}</span>
            </div>
            <span className="text-sm text-gray-400">{column.width}%</span>
          </div>

          {column.visible && (
            <input
              type="range"
              min="5"
              max="50"
              value={column.width}
              onChange={(e) => handleWidthChange(column.id, Number(e.target.value))}
              className="w-full"
            />
          )}
        </div>
      ))}
    </div>
  );
}
