/**
 * Report Table Renderer
 * Renders organized report data as formatted tables
 */

import React, { useState, useCallback } from 'react';
import { PaperworkColumnConfig, ColumnFormatType } from '../../types/paperworkTemplate';
import { OrganizedReportData, ReportDataItem } from '../../utils/paperwork/reportOrganizer';
import { InteractiveTableHeader } from './InteractiveTableHeader';

interface ReportTableRendererProps {
  columns: PaperworkColumnConfig[];
  data: OrganizedReportData;
  reportType: string;
  onColumnsChange?: (columns: PaperworkColumnConfig[]) => void;
  editable?: boolean;
}

export function ReportTableRenderer({
  columns,
  data,
  reportType,
  onColumnsChange,
  editable = false
}: ReportTableRendererProps) {
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const visibleColumns = columns.filter(c => c.visible);

  // Handle column resize
  const handleResize = useCallback((columnId: string, newWidth: number) => {
    if (!onColumnsChange) return;

    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, width: newWidth } : col
    );
    onColumnsChange(updatedColumns);
  }, [columns, onColumnsChange]);

  // Handle column reorder
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (!onColumnsChange || fromIndex === toIndex) return;

    const reorderedColumns = [...columns];
    const [movedColumn] = reorderedColumns.splice(fromIndex, 1);
    reorderedColumns.splice(toIndex, 0, movedColumn);

    onColumnsChange(reorderedColumns);
    setDraggedColumnIndex(null);
    setDropTargetIndex(null);
  }, [columns, onColumnsChange]);

  // Handle context menu (placeholder for now)
  const handleContextMenu = useCallback((columnId: string, event: React.MouseEvent) => {
    // Will be connected to ColumnContextMenu component later
    console.log('Context menu for column:', columnId);
  }, []);

  if (!data || data.groups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-black report-content p-8">
      {data.groups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          {data.hasGroups && (
            <h3 className="text-lg font-bold mb-4 text-blue-600">
              {group.groupValue} ({group.items.length} items)
            </h3>
          )}

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {editable ? (
                  visibleColumns.map((col, index) => (
                    <InteractiveTableHeader
                      key={col.id}
                      column={col}
                      columnIndex={index}
                      totalColumns={visibleColumns.length}
                      onResize={handleResize}
                      onReorder={handleReorder}
                      onContextMenu={handleContextMenu}
                      isDragging={draggedColumnIndex === index}
                      isDropTarget={dropTargetIndex === index}
                    />
                  ))
                ) : (
                  visibleColumns.map(col => (
                    <th
                      key={col.id}
                      style={{ width: `${col.width}%` }}
                      className="border border-gray-300 px-2 py-1 text-left text-sm font-semibold"
                    >
                      {col.label}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {group.items.map((item, itemIndex) => (
                <tr key={itemIndex} className="hover:bg-gray-50">
                  {visibleColumns.map(col => (
                    <td
                      key={col.id}
                      className="border border-gray-300 px-2 py-1 text-sm"
                    >
                      {renderCellValue(item, col, columns)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// Render cell value, handling merged columns
function renderCellValue(
  item: ReportDataItem,
  col: PaperworkColumnConfig,
  allColumns: PaperworkColumnConfig[]
): string {
  // Handle merged columns
  if (col.combinedWith && col.combinedWith.length > 0) {
    const values = [formatValue(item[col.field], col.format)];
    col.combinedWith.forEach(fieldId => {
      const mergedCol = allColumns.find(c => c.id === fieldId);
      if (mergedCol) {
        values.push(formatValue(item[mergedCol.field], mergedCol.format));
      }
    });
    const separator = col.separator || ' • ';
    return values.filter(v => v && v !== '—').join(separator);
  }

  return formatValue(item[col.field], col.format);
}

function formatValue(value: any, format?: ColumnFormatType): string {
  if (value == null) return '—';

  switch (format) {
    case 'number':
      return Number(value).toLocaleString();

    case 'power':
      return `${Number(value).toLocaleString()}W`;

    case 'boolean':
      return value ? 'Yes' : 'No';

    case 'date':
      return new Date(value).toLocaleDateString();

    case 'color':
      return String(value);

    case 'text':
    default:
      return String(value);
  }
}
