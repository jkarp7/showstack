import { useState, useRef, useEffect } from 'react';
import { COLUMN_CONFIGS, ColumnVisibility } from '../../types/columns';

interface ColumnVisibilityMenuProps {
  visibility: ColumnVisibility;
  onVisibilityChange: (visibility: ColumnVisibility) => void;
}

export function ColumnVisibilityMenu({ visibility, onVisibilityChange }: ColumnVisibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleColumn = (key: string) => {
    onVisibilityChange({
      ...visibility,
      [key]: !visibility[key as keyof ColumnVisibility],
    });
  };

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  // Group columns by their group property
  const groupedColumns = COLUMN_CONFIGS.reduce((acc, column) => {
    const groupKey = column.group || 'ungrouped';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(column);
    return acc;
  }, {} as Record<string, typeof COLUMN_CONFIGS>);

  const visibleCount = Object.values(visibility).filter(Boolean).length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition flex items-center gap-1"
      >
        Columns ({visibleCount})
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 w-64">
          <div className="p-2 border-b border-gray-700">
            <div className="text-xs font-semibold text-gray-400 uppercase">Show/Hide Columns</div>
          </div>
          <div className="p-2 max-h-96 overflow-y-auto">
            {/* Render ungrouped columns first */}
            {groupedColumns.ungrouped?.map((column) => (
              <label
                key={column.key}
                className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700 cursor-pointer ${
                  column.isRequired ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={visibility[column.key]}
                  onChange={() => toggleColumn(column.key)}
                  disabled={column.isRequired}
                  className="w-4 h-4"
                />
                <span className="text-sm">{column.label}</span>
              </label>
            ))}

            {/* Render grouped columns with expandable sections */}
            {Object.entries(groupedColumns)
              .filter(([groupName]) => groupName !== 'ungrouped')
              .map(([groupName, columns]) => (
                <div key={groupName} className="mt-1">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="flex items-center gap-2 px-2 py-1.5 w-full rounded hover:bg-gray-700 text-left"
                  >
                    <span className="text-xs">{expandedGroups.has(groupName) ? '▼' : '▶'}</span>
                    <span className="text-sm font-medium text-gray-300">{groupName}</span>
                  </button>
                  {expandedGroups.has(groupName) && (
                    <div className="ml-4 border-l border-gray-700 pl-2 mt-1">
                      {columns.map((column) => (
                        <label
                          key={column.key}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700 cursor-pointer ${
                            column.isRequired ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={visibility[column.key]}
                            onChange={() => toggleColumn(column.key)}
                            disabled={column.isRequired}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{column.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
