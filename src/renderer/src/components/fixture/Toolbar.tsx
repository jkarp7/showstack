import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import { ColumnVisibility } from '../../types/columns';

interface ToolbarProps {
  selectedCount: number;
  onAddFixture: () => void;
  onBulkEdit: () => void;
  onDeleteSelected: () => void;
  onUserColumnSettings: () => void;
  columnVisibility: ColumnVisibility;
  onColumnVisibilityChange: (visibility: ColumnVisibility) => void;
  userColumnDefinitions?: Record<string, string>;
}

export function Toolbar({ selectedCount, onAddFixture, onBulkEdit, onDeleteSelected, onUserColumnSettings, columnVisibility, onColumnVisibilityChange, userColumnDefinitions }: ToolbarProps) {
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
            onClick={onBulkEdit}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition"
          >
            Bulk Edit ({selectedCount})
          </button>

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

      {/* Right side buttons */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onUserColumnSettings}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
          title="Define User Columns"
        >
          User Columns...
        </button>

        <ColumnVisibilityMenu
          visibility={columnVisibility}
          onVisibilityChange={onColumnVisibilityChange}
          userColumnDefinitions={userColumnDefinitions}
        />
      </div>
    </div>
  );
}
