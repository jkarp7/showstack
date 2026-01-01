/**
 * Report Table Renderer
 * Renders organized report data as formatted tables
 */

import React, { useState, useCallback } from 'react';
import { PaperworkColumnConfig, ColumnFormatType, ReportOrganization, FontStyle } from '../../types/paperworkTemplate';
import { OrganizedReportData, ReportDataItem } from '../../utils/paperwork/reportOrganizer';
import { InteractiveTableHeader } from './InteractiveTableHeader';
import { ColumnContextMenu } from './ColumnContextMenu';
import { ColumnMergeDialog } from './ColumnMergeDialog';
import { getColumnDisplayLabel } from '../../utils/paperwork/columnUtils';

interface ReportTableRendererProps {
  columns: PaperworkColumnConfig[];
  data: OrganizedReportData;
  reportType: string;
  organization?: ReportOrganization;
  fontStyle?: FontStyle;
  onColumnsChange?: (columns: PaperworkColumnConfig[]) => void;
  onOrganizationChange?: (organization: ReportOrganization) => void;
  editable?: boolean;
}

export function ReportTableRenderer({
  columns,
  data,
  reportType,
  organization,
  fontStyle,
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
  const [mergeDialogColumn, setMergeDialogColumn] = useState<PaperworkColumnConfig | null>(null);

  const visibleColumns = columns.filter(c => c.visible);

  // Debug: Log column display modes
  React.useEffect(() => {
    if (visibleColumns.length > 0) {
      console.log('📊 Table columns displayMode:', visibleColumns.slice(0, 3).map(c => ({
        id: c.id,
        label: c.label,
        shortLabel: c.shortLabel,
        displayMode: c.displayMode
      })));
    }
  }, [columns]);

  // Build style object from font settings
  const tableStyle = {
    fontFamily: fontStyle?.fontFamily || 'Arial, sans-serif',
    fontSize: `${fontStyle?.fontSize || 10}pt`,
    fontWeight: fontStyle?.fontWeight || 'normal',
    fontStyle: fontStyle?.fontStyle || 'normal',
    lineHeight: fontStyle?.lineHeight || 1.2
  };

  const headerStyle = {
    fontSize: `${fontStyle?.headerFontSize || 11}pt`
  };

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

    // Get the actual columns being moved (from visibleColumns indices)
    const movedColumn = visibleColumns[fromIndex];
    const targetColumn = visibleColumns[toIndex];

    // Find their positions in the full columns array
    const movedColumnFullIndex = columns.findIndex(c => c.id === movedColumn.id);
    const targetColumnFullIndex = columns.findIndex(c => c.id === targetColumn.id);

    // Reorder in the full columns array
    const reorderedColumns = [...columns];
    const [removed] = reorderedColumns.splice(movedColumnFullIndex, 1);

    // Adjust target index if we removed an item before it
    const adjustedTargetIndex = movedColumnFullIndex < targetColumnFullIndex
      ? targetColumnFullIndex - 1
      : targetColumnFullIndex;

    reorderedColumns.splice(adjustedTargetIndex, 0, removed);

    onColumnsChange(reorderedColumns);
    setDraggedColumnIndex(null);
    setDropTargetIndex(null);
  }, [columns, visibleColumns, onColumnsChange]);

  // Handle column context menu
  const handleContextMenu = useCallback((columnId: string, event: React.MouseEvent) => {
    event.preventDefault();
    const column = columns.find(c => c.id === columnId);
    console.log('📋 handleContextMenu called for columnId:', columnId, 'found column:', column?.label);
    if (column) {
      const menuState = {
        position: { x: event.clientX, y: event.clientY },
        column,
        type: 'column' as const
      };
      console.log('📋 Setting contextMenu state:', menuState);
      setContextMenu(menuState);
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
    const column = columns.find(c => c.id === columnId);
    if (column) {
      setMergeDialogColumn(column);
    }
  }, [columns]);

  const handleConfirmMerge = useCallback((mergedColumnIds: string[], separator: string) => {
    if (!onColumnsChange || !mergeDialogColumn) return;

    const updatedColumns = columns.map(col => {
      if (col.id === mergeDialogColumn.id) {
        // Update primary column with merge info
        return { ...col, combinedWith: mergedColumnIds, separator };
      }
      if (mergedColumnIds.includes(col.id)) {
        // Hide merged columns
        return { ...col, visible: false };
      }
      return col;
    });

    onColumnsChange(updatedColumns);
    setMergeDialogColumn(null);
  }, [columns, mergeDialogColumn, onColumnsChange]);

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
    <div className="bg-white text-black report-content p-8" onContextMenu={handleTableContextMenu} style={tableStyle}>
      {data.groups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          {data.hasGroups && (
            <h3 className="text-lg font-bold mb-4 text-blue-600">
              {group.groupValue} ({group.items.length} items)
            </h3>
          )}

          <table className="w-full border-collapse" style={tableStyle}>
            <thead>
              <tr className="bg-gray-100">
                {editable ? (
                  visibleColumns.map((col, index) => (
                    <InteractiveTableHeader
                      key={col.id}
                      column={col}
                      columnIndex={index}
                      totalColumns={visibleColumns.length}
                      allColumns={columns}
                      headerStyle={headerStyle}
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
                      style={{ width: `${col.width}%`, ...headerStyle }}
                      className="border-t border-b border-gray-300 px-2 py-1 text-left font-semibold bg-transparent"
                    >
                      {getColumnDisplayLabel(col, columns)}
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
                      className="border-b border-gray-200 px-2 py-1 text-sm"
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
      {contextMenu && (() => {
        console.log('🎨 Rendering ColumnContextMenu component with contextMenu:', contextMenu);
        return (
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
        );
      })()}

      {/* Merge Dialog */}
      {mergeDialogColumn && (() => {
        // When editing an existing merge, include the previously merged columns
        // (even though they're hidden) so they can be removed or re-arranged
        const mergedColumnIds = mergeDialogColumn.combinedWith || [];
        const availableForMerge = columns.filter(c => {
          // Exclude the primary column itself
          if (c.id === mergeDialogColumn.id) return false;
          // Include if visible OR if it's currently part of this merge
          return c.visible || mergedColumnIds.includes(c.id);
        });

        return (
          <ColumnMergeDialog
            primaryColumn={mergeDialogColumn}
            availableColumns={availableForMerge}
            previewData={data.groups[0]?.items || []}
            onConfirm={handleConfirmMerge}
            onCancel={() => setMergeDialogColumn(null)}
          />
        );
      })()}
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
