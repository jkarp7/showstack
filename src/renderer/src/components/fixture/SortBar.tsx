interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface SortBarProps {
  sortConfigs: SortConfig[];
  onSort: (field: string, addToExisting: boolean) => void;
  onClearSort?: () => void;
}

export function SortBar({ sortConfigs, onSort, onClearSort }: SortBarProps) {
  const sortButtons = [
    { field: 'position', label: 'Position' },
    { field: 'unit', label: 'Unit #' },
    { field: 'address', label: 'Address' },
    { field: 'channel', label: 'Channel' },
    { field: 'dimmer', label: 'Dimmer' },
    { field: 'circuit', label: 'Circuit Name' },
    { field: 'circuit_number', label: 'Circuit #' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
        Sort by: <span className="text-xs">(Shift+Click for multi-column)</span>
      </span>
      {sortButtons.map(({ field, label }) => {
        const sortIndex = sortConfigs.findIndex(s => s.field === field);
        const isActive = sortIndex >= 0;
        const sortConfig = isActive ? sortConfigs[sortIndex] : null;
        const buttonClass = isActive
          ? 'px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition flex items-center gap-1'
          : 'px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded text-sm font-medium transition flex items-center gap-1';

        return (
          <button
            key={field}
            onClick={(e) => onSort(field, e.shiftKey)}
            className={buttonClass}
            title={isActive ? `Sort #${sortIndex + 1}` : 'Click to sort, Shift+Click to add'}
          >
            {label}
            {isActive && sortConfig && (
              <>
                {sortConfigs.length > 1 && (
                  <span className="text-xs font-bold bg-blue-800 px-1 rounded">
                    {sortIndex + 1}
                  </span>
                )}
                <span className="text-xs">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              </>
            )}
          </button>
        );
      })}
      {sortConfigs.length > 0 && onClearSort && (
        <button
          onClick={onClearSort}
          className="ml-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition"
          title="Clear all sorts"
        >
          Clear Sort
        </button>
      )}
    </div>
  );
}
