interface ToolbarProps {
  selectedCount: number;
  onAddFixture: () => void;
  onDeleteSelected: () => void;
}

export function Toolbar({ selectedCount, onAddFixture, onDeleteSelected }: ToolbarProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
      <button
        onClick={onAddFixture}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition"
      >
        + Add Fixture
      </button>
      
      {selectedCount > 0 && (
        <>
          <button
            onClick={onDeleteSelected}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition"
          >
            Delete Selected ({selectedCount})
          </button>
          
          <div className="h-6 w-px bg-gray-700 mx-2" />
          
          <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition">
            Duplicate
          </button>
          
          <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition">
            Export CSV
          </button>
        </>
      )}
    </div>
  );
}
