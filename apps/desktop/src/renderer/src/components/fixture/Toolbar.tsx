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
  onImportMvr?: () => void;
  onUserColumnSettings: () => void;
  columnVisibility: ColumnVisibility;
  onColumnVisibilityChange: (visibility: ColumnVisibility) => void;
  userColumnDefinitions?: Record<string, string>;
  isColumnVisibilityMenuOpen?: boolean;
  onColumnVisibilityMenuOpenChange?: (open: boolean) => void;
  // Search (moved from FilterBar into toolbar)
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
  onImportMvr,
  onUserColumnSettings,
  columnVisibility,
  onColumnVisibilityChange,
  userColumnDefinitions,
  isColumnVisibilityMenuOpen,
  onColumnVisibilityMenuOpenChange,
  searchQuery,
  onSearchChange,
}: ToolbarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
      {/* Primary action */}
      <button
        onClick={onAddFixture}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition flex-shrink-0"
      >
        + Add Fixture
      </button>

      {/* Selection-contextual actions */}
      {selectedCount > 0 && (
        <>
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5 flex-shrink-0" />

          <button
            onClick={onBulkEdit}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition flex-shrink-0"
          >
            Edit {selectedCount}
          </button>

          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition flex-shrink-0"
            >
              Duplicate
            </button>
          )}

          {onHideSelected && (
            <button
              onClick={onHideSelected}
              className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition flex-shrink-0"
              title="Hide selected fixtures"
            >
              Hide
            </button>
          )}

          {onUnhideSelected && (
            <button
              onClick={onUnhideSelected}
              className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition flex-shrink-0"
              title="Unhide selected fixtures"
            >
              Unhide
            </button>
          )}

          <button
            onClick={onDeleteSelected}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-sm font-medium transition flex-shrink-0"
          >
            Delete
          </button>

          <button
            onClick={onDeselectAll}
            className="px-2 py-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition flex-shrink-0"
            title="Clear selection"
          >
            ✕
          </button>
        </>
      )}

      {/* Right side — search, export, column controls */}
      <div className="ml-auto flex items-center gap-2">
        <input
          type="text"
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm w-44 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-colors"
        />

        {onImportMvr && (
          <button
            onClick={onImportMvr}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition flex-shrink-0"
            title="Import fixtures from an MVR file"
          >
            Import MVR
          </button>
        )}

        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition flex-shrink-0"
          >
            Export ↓
          </button>
        )}

        <ColumnVisibilityMenu
          visibility={columnVisibility}
          onVisibilityChange={onColumnVisibilityChange}
          userColumnDefinitions={userColumnDefinitions}
          isOpen={isColumnVisibilityMenuOpen}
          onOpenChange={onColumnVisibilityMenuOpenChange}
          onUserColumnSettings={onUserColumnSettings}
        />
      </div>
    </div>
  );
}
