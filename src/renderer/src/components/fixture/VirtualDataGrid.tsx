import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Fixture } from '../types';
import { VirtualRow } from './VirtualRow';
import { COLUMN_CONFIGS, ColumnVisibility, ColumnKey, getOrderedColumns, applyUserColumnLabels } from '../../types/columns';

interface VirtualDataGridProps {
  fixtures: Fixture[];
  selectedRows: Set<string>;
  onSelectRows: (selected: Set<string>) => void;
  onUpdateFixture: (id: string, updates: Partial<Fixture>) => void;
  columnVisibility: ColumnVisibility;
  columnOrder: ColumnKey[];
  onColumnOrderChange: (order: ColumnKey[]) => void;
  columnWidths: Partial<Record<ColumnKey, number>>;
  onColumnWidthChange: (widths: Partial<Record<ColumnKey, number>>) => void;
  userColumnDefinitions?: Record<string, string>;
}

const ROW_HEIGHT = 40; // pixels
const HEADER_HEIGHT = 48;
const OVERSCAN = 5; // Render extra rows above/below viewport

export function VirtualDataGrid({
  fixtures,
  selectedRows,
  onSelectRows,
  onUpdateFixture,
  columnVisibility,
  columnOrder,
  onColumnOrderChange,
  columnWidths,
  onColumnWidthChange,
  userColumnDefinitions = {},
}: VirtualDataGridProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [resizingColumn, setResizingColumn] = useState<ColumnKey | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Calculate visible range
  const visibleHeight = containerHeight - HEADER_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    fixtures.length,
    Math.ceil((scrollTop + visibleHeight) / ROW_HEIGHT) + OVERSCAN
  );

  const visibleFixtures = fixtures.slice(startIndex, endIndex);
  const totalHeight = fixtures.length * ROW_HEIGHT;
  const offsetY = startIndex * ROW_HEIGHT;

  // Handle scroll (vertical and horizontal sync)
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    // Sync horizontal scroll to header
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  // Handle header horizontal scroll (sync to content)
  const handleHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  // Handle row selection
  const handleRowClick = useCallback((id: string, e: React.MouseEvent) => {
    const newSelected = new Set(selectedRows);

    if (e.shiftKey && selectedRows.size > 0) {
      // Shift+Click: Select range from last selected to current
      const lastSelected = Array.from(selectedRows)[selectedRows.size - 1];
      const lastIndex = fixtures.findIndex(f => f.id === lastSelected);
      const currentIndex = fixtures.findIndex(f => f.id === id);
      const [start, end] = [Math.min(lastIndex, currentIndex), Math.max(lastIndex, currentIndex)];

      for (let i = start; i <= end; i++) {
        newSelected.add(fixtures[i].id);
      }
    } else {
      // Regular click: Toggle this row (keep other selections)
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    }

    onSelectRows(newSelected);
  }, [fixtures, selectedRows, onSelectRows]);

  // Handle cell edit
  const handleCellEdit = useCallback((
    fixtureId: string,
    field: keyof Fixture,
    value: string
  ) => {
    const updates: Partial<Fixture> = {};

    // Handle user columns stored in custom_fields
    if (typeof field === 'string' && field.startsWith('user')) {
      const fixture = fixtures.find(f => f.id === fixtureId);
      updates.custom_fields = {
        ...fixture?.custom_fields,
        [field]: value
      };
    }
    // Handle Address field - parse "universe/dmx_address" format OR raw address number
    else if (field === 'address') {
      // Check if it's in "universe/address" format
      if (value.includes('/')) {
        const parts = value.split('/');
        if (parts.length === 2) {
          const universe = parseInt(parts[0], 10);
          const dmx_address = parseInt(parts[1], 10);
          if (!isNaN(universe) && !isNaN(dmx_address)) {
            updates.universe = universe;
            updates.dmx_address = dmx_address;
          }
        }
      }
      // Otherwise treat it as a raw DMX address and calculate universe (512 addresses per universe)
      else {
        const rawAddress = parseInt(value, 10);
        if (!isNaN(rawAddress) && rawAddress > 0) {
          // Calculate universe and address within universe
          // DMX universes have 512 addresses each (1-512)
          updates.universe = Math.ceil(rawAddress / 512);
          updates.dmx_address = ((rawAddress - 1) % 512) + 1;
        }
      }
    }
    // Handle arrays (like accessories) - parse comma-separated string
    else if (field === 'accessories') {
      updates[field] = value.split(',').map(s => s.trim()).filter(Boolean);
    }
    // Handle boolean fields
    else if (field === 'on_light_plot') {
      updates[field] = value === '✓' || value.toLowerCase() === 'true' || value === '1';
    }
    // Handle numeric fields
    else if (['unit', 'unit_number', 'universe', 'dmx_address', 'wattage', 'amperage',
              'position_x', 'position_y', 'position_z',
              'vw_x_coordinate', 'vw_y_coordinate', 'vw_z_coordinate', 'vw_symbol_rotation',
              'changed_at', 'created_at', 'updated_at'].includes(field as string)) {
      const num = parseFloat(value);
      updates[field] = isNaN(num) ? undefined : num;
    }
    // Regular string fields
    else {
      updates[field] = value;
    }

    onUpdateFixture(fixtureId, updates);
  }, [fixtures, onUpdateFixture]);

  // Drag and drop handlers for column reordering
  const handleDragStart = useCallback((e: React.DragEvent, columnKey: ColumnKey) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetColumnKey: ColumnKey) => {
    e.preventDefault();

    if (!draggedColumn || draggedColumn === targetColumnKey) {
      setDraggedColumn(null);
      return;
    }

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnKey);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove the dragged column
      newOrder.splice(draggedIndex, 1);
      // Insert it at the target position
      newOrder.splice(targetIndex, 0, draggedColumn);
      onColumnOrderChange(newOrder);
    }

    setDraggedColumn(null);
  }, [draggedColumn, columnOrder, onColumnOrderChange]);

  // Column resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, columnKey: ColumnKey, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  }, []);

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + delta); // Min width 50px
      onColumnWidthChange({
        ...columnWidths,
        [resizingColumn]: newWidth,
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth, columnWidths, onColumnWidthChange]);

  // Helper to get column width (custom or default)
  const getColumnWidth = useCallback((col: typeof COLUMN_CONFIGS[0]): number => {
    if (columnWidths[col.key]) {
      return columnWidths[col.key]!;
    }
    // Parse Tailwind width to pixels (approximate)
    if (col.width.includes('flex-1')) return 200; // Default for flex columns
    const match = col.width.match(/w-(\d+)/);
    if (match) return parseInt(match[1], 10) * 4; // Tailwind w-X is X * 0.25rem, 1rem = 16px
    return 100; // Fallback
  }, [columnWidths]);

  // Get ordered column configs
  // Get ordered columns and apply user-defined labels
  const orderedColumns = useMemo(() => {
    const cols = getOrderedColumns(columnOrder);
    return applyUserColumnLabels(cols, userColumnDefinitions);
  }, [columnOrder, userColumnDefinitions]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Column Headers */}
      <div
        ref={headerRef}
        className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto overflow-y-scroll"
        style={{ height: HEADER_HEIGHT }}
        onScroll={handleHeaderScroll}
      >
        <div className="w-12 flex items-center justify-center flex-shrink-0">
          <input
            type="checkbox"
            checked={selectedRows.size === fixtures.length && fixtures.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                onSelectRows(new Set(fixtures.map(f => f.id)));
              } else {
                onSelectRows(new Set());
              }
            }}
            className="w-4 h-4 appearance-none rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 checked:bg-blue-600 checked:border-blue-600 transition-colors"
            style={{
              backgroundImage: (selectedRows.size === fixtures.length && fixtures.length > 0)
                ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")`
                : undefined,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        </div>
        {orderedColumns.filter(col => columnVisibility[col.key]).map(col => {
          const colWidth = getColumnWidth(col);
          return (
            <div
              key={col.key}
              draggable
              onDragStart={(e) => handleDragStart(e, col.key)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`px-2 font-semibold text-sm text-gray-700 dark:text-gray-300 flex-shrink-0 cursor-move hover:bg-gray-200 dark:hover:bg-gray-700 transition relative ${
                draggedColumn === col.key ? 'opacity-50' : ''
              }`}
              style={{ width: `${colWidth}px` }}
              title="Drag to reorder"
            >
              {col.label}
              {/* Resize handle */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all"
                onMouseDown={(e) => handleResizeStart(e, col.key, colWidth)}
                onClick={(e) => e.stopPropagation()}
                title="Drag to resize"
              />
            </div>
          );
        })}
      </div>

      {/* Virtual Scrolling Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleFixtures.map((fixture) => (
              <VirtualRow
                key={fixture.id}
                fixture={fixture}
                isSelected={selectedRows.has(fixture.id)}
                onClick={(e) => handleRowClick(fixture.id, e)}
                onCellEdit={handleCellEdit}
                columnVisibility={columnVisibility}
                columnOrder={columnOrder}
                columnWidths={columnWidths}
                getColumnWidth={getColumnWidth}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
