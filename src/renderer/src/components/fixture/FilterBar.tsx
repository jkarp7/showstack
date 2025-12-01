interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  locationFilter: string;
  onLocationChange: (location: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
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
  onClearFilters,
  availableLocations,
  availableTypes,
  availableStatuses,
}: FilterBarProps) {
  const hasActiveFilters = searchQuery || locationFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
      <input
        type="text"
        placeholder="Search fixtures..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm flex-1 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
      />

      <select
        value={locationFilter}
        onChange={(e) => onLocationChange(e.target.value)}
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
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
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
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
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
      >
        <option value="all">All Status</option>
        {availableStatuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
