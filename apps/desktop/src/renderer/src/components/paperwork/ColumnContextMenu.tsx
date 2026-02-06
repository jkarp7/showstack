/**
 * ColumnContextMenu
 * Right-click context menu for column and organization options
 */

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PaperworkColumnConfig, ReportOrganization } from '../../types/paperworkTemplate';

interface ColumnContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;

  // Column-specific menu (when right-clicking a column header)
  column?: PaperworkColumnConfig;
  allColumns?: PaperworkColumnConfig[];
  onGroupByColumn?: (columnId: string) => void;
  onSortByColumn?: (columnId: string, direction: 'asc' | 'desc') => void;
  onHideColumn?: (columnId: string) => void;
  onResizeToContent?: (columnId: string) => void;
  onMergeColumn?: (columnId: string) => void;
  onUnmergeColumn?: (columnId: string) => void;

  // Organization menu (when right-clicking table body)
  organization?: ReportOrganization;
  visibleColumns?: PaperworkColumnConfig[];
  onOrganizationChange?: (organization: ReportOrganization) => void;
}

export function ColumnContextMenu({
  position,
  onClose,
  column,
  allColumns = [],
  onGroupByColumn,
  onSortByColumn,
  onHideColumn,
  onResizeToContent,
  onMergeColumn,
  onUnmergeColumn,
  organization,
  visibleColumns = [],
  onOrganizationChange,
}: ColumnContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  // Adjust position to keep menu within viewport bounds
  // Use layoutEffect to run synchronously before paint
  React.useLayoutEffect(() => {
    if (!menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position if menu would go off right edge
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 10; // 10px padding from edge
    }

    // Adjust vertical position if menu would go off bottom edge
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 10; // 10px padding from edge
    }

    // Ensure menu doesn't go off left edge
    if (x < 10) {
      x = 10;
    }

    // Ensure menu doesn't go off top edge
    if (y < 10) {
      y = 10;
    }

    setAdjustedPosition({ x, y });
  }, [position]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Render column header menu
  if (column) {
    const isMerged = column.combinedWith && column.combinedWith.length > 0;
    const mergeableColumns = allColumns.filter((c) => c.id !== column.id && c.visible);

    return createPortal(
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: adjustedPosition.y,
          left: adjustedPosition.x,
          zIndex: 9999,
        }}
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-56 text-white overflow-hidden"
      >
        {/* Column name header */}
        <div className="px-4 py-2 text-sm font-semibold text-gray-400 border-b border-gray-700 flex-shrink-0">
          {column.label}
        </div>

        {/* Scrollable menu content */}
        <div className="max-h-96 overflow-y-auto py-2">
          {/* Merge/Unmerge options - at the top for visibility */}
          {!isMerged && mergeableColumns.length > 0 && (
            <>
              <button
                onClick={() => {
                  onMergeColumn?.(column.id);
                  onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition flex items-center gap-2"
              >
                <span className="text-lg">⋈</span>
                <span className="font-medium">Merge with...</span>
              </button>
              <div className="border-t border-gray-700 my-2" />
            </>
          )}

          {isMerged && (
            <>
              <button
                onClick={() => {
                  onUnmergeColumn?.(column.id);
                  onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition flex items-center gap-2"
              >
                <span className="text-lg">⋉</span>
                <span className="font-medium">Unmerge Columns</span>
              </button>
              <div className="border-t border-gray-700 my-2" />
            </>
          )}

          {/* Column operations */}
          <button
            onClick={() => {
              onHideColumn?.(column.id);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition flex items-center gap-2"
          >
            <span>👁️</span>
            <span>Hide Column</span>
          </button>

          <button
            onClick={() => {
              onResizeToContent?.(column.id);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition flex items-center gap-2"
          >
            <span>↔️</span>
            <span>Resize to Content</span>
          </button>

          <div className="border-t border-gray-700 my-2" />

          {/* Group and sort options */}
          <button
            onClick={() => {
              onGroupByColumn?.(column.id);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition flex items-center gap-2"
          >
            <span>📁</span>
            <span>Group By This Column</span>
          </button>

          <button
            onClick={() => {
              onSortByColumn?.(column.id, 'asc');
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition flex items-center gap-2"
          >
            <span>↑</span>
            <span>Sort Ascending</span>
          </button>

          <button
            onClick={() => {
              onSortByColumn?.(column.id, 'desc');
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition flex items-center gap-2"
          >
            <span>↓</span>
            <span>Sort Descending</span>
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  // Render organization menu (table body)
  if (organization && onOrganizationChange) {
    return createPortal(
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: adjustedPosition.y,
          left: adjustedPosition.x,
          zIndex: 9999,
        }}
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-64 py-2 text-white"
      >
        {/* Menu header */}
        <div className="px-4 py-2 text-sm font-semibold text-gray-400 border-b border-gray-700">
          Organization
        </div>

        {/* Group By */}
        <div className="px-4 py-2">
          <label className="text-xs text-gray-400 mb-1 block">Group By</label>
          <select
            value={organization.groupBy || 'none'}
            onChange={(e) => {
              const value = e.target.value === 'none' ? undefined : e.target.value;
              onOrganizationChange({ ...organization, groupBy: value });
            }}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="none">None</option>
            {visibleColumns.map((col) => (
              <option key={col.id} value={col.field}>
                {col.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="px-4 py-2">
          <label className="text-xs text-gray-400 mb-1 block">Sort By</label>
          <select
            value={organization.sortBy || ''}
            onChange={(e) => {
              onOrganizationChange({ ...organization, sortBy: e.target.value || undefined });
            }}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">None</option>
            {visibleColumns.map((col) => (
              <option key={col.id} value={col.field}>
                {col.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Direction */}
        <div className="px-4 py-2">
          <label className="text-xs text-gray-400 mb-1 block">Sort Direction</label>
          <select
            value={organization.sortDirection || 'asc'}
            onChange={(e) => {
              onOrganizationChange({
                ...organization,
                sortDirection: e.target.value as 'asc' | 'desc',
              });
            }}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div className="border-t border-gray-700 my-2" />

        {/* Checkboxes */}
        {organization.groupBy && (
          <>
            <label className="px-4 py-2 flex items-center gap-2 hover:bg-gray-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={organization.showGroupHeaders ?? true}
                onChange={(e) => {
                  onOrganizationChange({
                    ...organization,
                    showGroupHeaders: e.target.checked,
                  });
                }}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Group Headers</span>
            </label>

            <label className="px-4 py-2 flex items-center gap-2 hover:bg-gray-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={organization.groupPageBreaks ?? false}
                onChange={(e) => {
                  onOrganizationChange({
                    ...organization,
                    groupPageBreaks: e.target.checked,
                  });
                }}
                className="w-4 h-4"
              />
              <span className="text-sm">Page Break Between Groups</span>
            </label>

            <div className="border-t border-gray-700 my-2" />
          </>
        )}

        {/* Reset to Default */}
        <button
          onClick={() => {
            onOrganizationChange({
              groupBy: undefined,
              sortBy: visibleColumns[0]?.field,
              sortDirection: 'asc',
              showGroupHeaders: true,
              groupPageBreaks: false,
            });
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition flex items-center gap-2"
        >
          <span>↺</span>
          <span>Reset to Default View</span>
        </button>
      </div>,
      document.body,
    );
  }

  return null;
}
