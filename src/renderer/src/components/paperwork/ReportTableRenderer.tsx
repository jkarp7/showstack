/**
 * Report Table Renderer
 * Renders organized report data as formatted tables
 */

import React, { useState, useCallback } from 'react';
import { PaperworkColumnConfig, ColumnFormatType, ReportOrganization } from '../../types/paperworkTemplate';
import { OrganizedReportData, ReportDataItem } from '../../utils/paperwork/reportOrganizer';
import { InteractiveTableHeader } from './InteractiveTableHeader';
import { ColumnContextMenu } from './ColumnContextMenu';

interface ReportTableRendererProps {
  columns: PaperworkColumnConfig[];
  data: OrganizedReportData;
  reportType: string;
  organization?: ReportOrganization;
  onColumnsChange?: (columns: PaperworkColumnConfig[]) => void;
  onOrganizationChange?: (organization: ReportOrganization) => void;
  editable?: boolean;
}

export function ReportTableRenderer({
  columns,
  data,
  reportType,
  organization,
  onColumnsChange,
  onOrganizationChange,
  editable = false
}: ReportTableRendererProps) {
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    column?: PaperworkColumnConfig;
    type: 'column' | 'organization';
  } | null>(null);

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

  // Handle column context menu
  const handleContextMenu = useCallback((columnId: string, event: React.MouseEvent) => {
    event.preventDefault();
    const column = columns.find(c => c.id === columnId);
    if (column) {
      setContextMenu({
        position: { x: event.clientX, y: event.clientY },
        column,
        type: 'column'
      });
    }
  }, [columns]);

  // Handle table body context menu
  const handleTableContextMenu = useCallback((event: React.MouseEvent) => {
    if (!editable || !organization) return;
    event.preventDefault();
    setContextMenu({
      position: { x: event.clientX, y: event.clientY },
      type: 'organization'
    });
  }, [editable, organization]);

  // Context menu actions - Column operations
  const handleGroupByColumn = useCallback((columnId: string) => {
    if (!onOrganizationChange || !organization) return;
    const column = columns.find(c => c.id === columnId);
    if (column) {
      onOrganizationChange({ ...organization, groupBy: column.field });
    }
  }, [columns, organization, onOrganizationChange]);

  const handleSortByColumn = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    if (!onOrganizationChange || !organization) return;
    const column = columns.find(c => c.id === columnId);
    if (column) {
      onOrganizationChange({
        ...organization,
        sortBy: column.field,
        sortDirection: direction
      });
    }
  }, [columns, organization, onOrganizationChange]);

  const handleHideColumn = useCallback((columnId: string) => {
    if (!onColumnsChange) return;
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, visible: false } : col
    );
    onColumnsChange(updatedColumns);
  }, [columns, onColumnsChange]);

  const handleResizeToContent = useCallback((columnId: string) => {
    // Auto-resize logic - set to a reasonable width based on content
    // For now, set to 15% as a default
    if (!onColumnsChange) return;
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, width: 15 } : col
    );
    onColumnsChange(updatedColumns);
  }, [columns, onColumnsChange]);

  const handleMergeColumn = useCallback((columnId: string) => {
    // This will open the merge dialog (to be implemented)
    console.log('Merge column:', columnId);
    // TODO: Open ColumnMergeDialog
  }, []);

  const handleUnmergeColumn = useCallback((columnId: string) => {
    if (!onColumnsChange) return;
    const column = columns.find(c => c.id === columnId);
    if (!column || !column.combinedWith) return;

    // Restore visibility of merged columns
    const mergedColumnIds = column.combinedWith;
    const updatedColumns = columns.map(col => {
      if (col.id === columnId) {
        return { ...col, combinedWith: undefined, separator: undefined };
      }
      if (mergedColumnIds.includes(col.id)) {
        return { ...col, visible: true };
      }
      return col;
    });
    onColumnsChange(updatedColumns);
  }, [columns, onColumnsChange]);

  if (!data || data.groups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-black report-content p-8" onContextMenu={handleTableContextMenu}>
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

      {/* Context Menu */}
      {contextMenu && (
        <ColumnContextMenu
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          column={contextMenu.column}
          allColumns={columns}
          onGroupByColumn={handleGroupByColumn}
          onSortByColumn={handleSortByColumn}
          onHideColumn={handleHideColumn}
          onResizeToContent={handleResizeToContent}
          onMergeColumn={handleMergeColumn}
          onUnmergeColumn={handleUnmergeColumn}
          organization={organization}
          visibleColumns={visibleColumns}
          onOrganizationChange={onOrganizationChange}
        />
      )}
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
