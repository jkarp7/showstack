import { useState, useRef, useCallback, useEffect } from 'react';
import { Fixture } from '../types';
import { VirtualRow } from './VirtualRow';
import { COLUMN_CONFIGS, ColumnVisibility } from '../../types/columns';

interface VirtualDataGridProps {
  fixtures: Fixture[];
  selectedRows: Set<string>;
  onSelectRows: (selected: Set<string>) => void;
  onUpdateFixture: (id: string, updates: Partial<Fixture>) => void;
  columnVisibility: ColumnVisibility;
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
}: VirtualDataGridProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

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
    // Handle Address field - parse "universe/dmx_address" format
    else if (field === 'address') {
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

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Column Headers */}
      <div
        ref={headerRef}
        className="flex items-center bg-gray-800 border-b border-gray-700 overflow-x-auto overflow-y-scroll"
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
            className="w-4 h-4"
          />
        </div>
        {COLUMN_CONFIGS.filter(col => columnVisibility[col.key]).map(col => (
          <div key={col.key} className={`${col.width} px-2 font-semibold text-sm text-gray-300 flex-shrink-0`}>
            {col.label}
          </div>
        ))}
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
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
