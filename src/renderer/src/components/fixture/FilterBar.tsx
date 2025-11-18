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
}: FilterBarProps) {
  const hasActiveFilters = searchQuery || locationFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
      <input
        type="text"
        placeholder="Search fixtures..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm flex-1 text-white focus:outline-none focus:border-blue-500"
      />

      <select
        value={locationFilter}
        onChange={(e) => onLocationChange(e.target.value)}
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
      >
        <option value="all">All Locations</option>
        <option value="FOH">FOH</option>
        <option value="1st Electric">1st Electric</option>
        <option value="2nd Electric">2nd Electric</option>
        <option value="3rd Electric">3rd Electric</option>
        <option value="Box Boom">Box Boom</option>
      </select>

      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
      >
        <option value="all">All Types</option>
        <option value="Source Four">Source Four</option>
        <option value="PAR">PAR</option>
        <option value="Moving Light">Moving Light</option>
        <option value="LED">LED</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
      >
        <option value="all">All Status</option>
        <option value="Active">Active</option>
        <option value="Spare">Spare</option>
        <option value="Rental">Rental</option>
        <option value="Needs Repair">Needs Repair</option>
        <option value="Not on Plot">Not on Plot</option>
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
