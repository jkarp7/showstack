export function FilterBar() {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
      <input
        type="text"
        placeholder="Search fixtures..."
        className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm flex-1 focus:outline-none focus:border-blue-500"
      />
      
      <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500">
        <option>All Locations</option>
        <option>FOH</option>
        <option>1st Electric</option>
        <option>2nd Electric</option>
      </select>
      
      <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500">
        <option>All Types</option>
        <option>Source Four</option>
        <option>Moving Light</option>
        <option>LED</option>
      </select>
      
      <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition">
        Clear Filters
      </button>
    </div>
  );
}
