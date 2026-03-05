import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import { ColumnVisibility } from '../../types/columns';

interface ToolbarProps {
  selectedCount: number;
  onAddFixture: () => void;
  onBulkEdit: () => void;
  onDeleteSelected: () => void;
  onDeselectAll: () => void;
  onHideSelected?: () => void;
  onUnhideSelected?: () => void;
  onDuplicate?: () => void;
  onExportCSV?: () => void;
  onUserColumnSettings: () => void;
  columnVisibility: ColumnVisibility;
  onColumnVisibilityChange: (visibility: ColumnVisibility) => void;
  userColumnDefinitions?: Record<string, string>;
  isColumnVisibilityMenuOpen?: boolean;
  onColumnVisibilityMenuOpenChange?: (open: boolean) => void;
}

export function Toolbar({
  selectedCount,
  onAddFixture,
  onBulkEdit,
  onDeleteSelected,
  onDeselectAll,
  onHideSelected,
  onUnhideSelected,
  onDuplicate,
  onExportCSV,
  onUserColumnSettings,
  columnVisibility,
  onColumnVisibilityChange,
  userColumnDefinitions,
  isColumnVisibilityMenuOpen,
  onColumnVisibilityMenuOpenChange,
}: ToolbarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
      <button
        onClick={onAddFixture}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
      >
        + Add Fixture
      </button>

      {selectedCount > 0 && (
        <>
          <button
            onClick={onBulkEdit}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition"
          >
            Bulk Edit ({selectedCount})
          </button>

          <button
            onClick={onDeleteSelected}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition"
          >
            Delete Selected ({selectedCount})
          </button>

          <button
            onClick={onDeselectAll}
            className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded text-sm font-medium transition"
          >
            Deselect All
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2" />

          {onHideSelected && (
            <button
              onClick={onHideSelected}
              className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded text-sm font-medium transition"
              title="Hide selected fixtures from table"
            >
              Hide ({selectedCount})
            </button>
          )}

          {onUnhideSelected && (
            <button
              onClick={onUnhideSelected}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition"
              title="Unhide selected fixtures"
            >
              Unhide ({selectedCount})
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded text-sm font-medium transition"
            >
              Duplicate
            </button>
          )}

          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded text-sm font-medium transition"
            >
              Export CSV
            </button>
          )}
        </>
      )}

      {/* Right side buttons */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onUserColumnSettings}
          className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded text-sm transition"
          title="Define User Columns"
        >
          User Columns...
        </button>

        <ColumnVisibilityMenu
          visibility={columnVisibility}
          onVisibilityChange={onColumnVisibilityChange}
          userColumnDefinitions={userColumnDefinitions}
          isOpen={isColumnVisibilityMenuOpen}
          onOpenChange={onColumnVisibilityMenuOpenChange}
        />
      </div>
    </div>
  );
}
