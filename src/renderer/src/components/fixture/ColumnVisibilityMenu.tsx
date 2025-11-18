import { useState, useRef, useEffect } from 'react';
import { COLUMN_CONFIGS, ColumnVisibility } from '../../types/columns';

interface ColumnVisibilityMenuProps {
  visibility: ColumnVisibility;
  onVisibilityChange: (visibility: ColumnVisibility) => void;
}

export function ColumnVisibilityMenu({ visibility, onVisibilityChange }: ColumnVisibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
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
        <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 w-48">
          <div className="p-2 border-b border-gray-700">
            <div className="text-xs font-semibold text-gray-400 uppercase">Show/Hide Columns</div>
          </div>
          <div className="p-2 max-h-96 overflow-y-auto">
            {COLUMN_CONFIGS.map((column) => (
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
        </div>
      )}
    </div>
  );
}
