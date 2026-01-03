interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  locationFilter: string;
  onLocationChange: (location: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  showHidden?: boolean;
  onShowHiddenChange?: (show: boolean) => void;
  onClearFilters: () => void;
  availableLocations: string[];
  availableTypes: string[];
  availableStatuses: string[];
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  locationFilter,
  onLocationChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  showHidden = false,
  onShowHiddenChange,
  onClearFilters,
  availableLocations,
  availableTypes,
  availableStatuses,
}: FilterBarProps) {
  const hasActiveFilters = searchQuery || locationFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || showHidden;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
      <input
        type="text"
        placeholder="Search fixtures..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm flex-1 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
      />

      <select
        value={locationFilter}
        onChange={(e) => onLocationChange(e.target.value)}
        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
      >
        <option value="all">All Locations</option>
        {availableLocations.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>

      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
      >
        <option value="all">All Types</option>
        {availableTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
      >
        <option value="all">All Status</option>
        {availableStatuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      {onShowHiddenChange && (
        <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => onShowHiddenChange(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Show Hidden
        </label>
      )}

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded text-sm font-medium transition"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
