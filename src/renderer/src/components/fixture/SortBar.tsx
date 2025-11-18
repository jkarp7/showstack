interface SortBarProps {
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function SortBar({ sortField, sortDirection, onSort }: SortBarProps) {
  const sortButtons = [
    { field: 'position', label: 'Position' },
    { field: 'address', label: 'Address' },
    { field: 'channel', label: 'Channel' },
    { field: 'dimmer', label: 'Dimmer' },
    { field: 'circuit', label: 'Circuit Name' },
    { field: 'circuit_number', label: 'Circuit #' },
  ];

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
      <span className="text-sm text-gray-400 mr-2">Sort by:</span>
      {sortButtons.map(({ field, label }) => {
        const isActive = sortField === field;
        const buttonClass = isActive
          ? 'px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition flex items-center gap-1'
          : 'px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition flex items-center gap-1';

        return (
          <button
            key={field}
            onClick={() => onSort(field)}
            className={buttonClass}
          >
            {label}
            {isActive && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
