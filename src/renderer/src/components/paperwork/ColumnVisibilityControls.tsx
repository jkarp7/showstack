/**
 * ColumnVisibilityControls
 * Controls for showing/hiding columns and managing column display options
 */

import React, { useState } from 'react';
import { PaperworkColumnConfig, ReportType } from '../../types/paperworkTemplate';
import { getAllAvailableColumns } from '../../utils/paperwork/columnDefaults';

interface ColumnVisibilityControlsProps {
  reportType: ReportType;
  columns: PaperworkColumnConfig[];
  onChange: (columns: PaperworkColumnConfig[]) => void;
}

export function ColumnVisibilityControls({
  reportType,
  columns,
  onChange
}: ColumnVisibilityControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get all available columns for this report type (includes all equipment manager fields)
  const availableColumns = getAllAvailableColumns(reportType);

  // Get current column visibility map
  const visibilityMap = new Map(columns.map(col => [col.field, col.visible]));

  // Handle toggle visibility
  const handleToggleColumn = (field: string) => {
    const existingFields = new Set(columns.map(c => c.field));
    const defaultColumn = availableColumns.find(c => c.field === field);

    if (!defaultColumn) return;

    if (existingFields.has(field)) {
      // Toggle existing column
      const updatedColumns = columns.map(col =>
        col.field === field ? { ...col, visible: !col.visible } : col
      );
      onChange(updatedColumns);
    } else {
      // Add new column from defaults, preserving displayMode from existing columns
      const currentDisplayMode = columns.length > 0 && columns[0].displayMode
        ? columns[0].displayMode
        : 'full';
      onChange([...columns, { ...defaultColumn, visible: true, displayMode: currentDisplayMode }]);
    }
  };

  // Count visible columns
  const visibleCount = columns.filter(c => c.visible).length;

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 text-white text-left transition flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Column Visibility</span>
          <span className="text-xs text-gray-400">({visibleCount} visible)</span>
        </div>
        <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="bg-gray-850 max-h-64 overflow-y-auto">
          <div className="p-3 space-y-1">
            {availableColumns.map((defaultCol) => {
              const templateCol = columns.find(c => c.field === defaultCol.field);
              const isVisible = templateCol?.visible ?? false;

              return (
                <label
                  key={defaultCol.field}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700 rounded cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => handleToggleColumn(defaultCol.field)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-200">{defaultCol.label}</span>
                </label>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="border-t border-gray-700 p-2 flex gap-2">
            <button
              onClick={() => {
                // Show all available columns
                const existingFields = new Set(columns.map(c => c.field));
                const allColumns = availableColumns.map(defCol => {
                  const existing = columns.find(c => c.field === defCol.field);
                  return existing ? { ...existing, visible: true } : { ...defCol, visible: true };
                });
                onChange(allColumns);
              }}
              className="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition"
            >
              Show All
            </button>
            <button
              onClick={() => {
                const allHidden = columns.map(col => ({ ...col, visible: false }));
                onChange(allHidden);
              }}
              className="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition"
            >
              Hide All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
