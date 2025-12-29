import { InfrastructureColumnVisibilityMenu, InfrastructureColumnVisibility } from './InfrastructureColumnVisibilityMenu';

interface InfrastructureToolbarProps {
  selectedCount: number;
  onAddEquipment: () => void;
  onDeleteSelected: () => void;
  onDeselectAll: () => void;
  columnVisibility: InfrastructureColumnVisibility;
  onColumnVisibilityChange: (visibility: InfrastructureColumnVisibility) => void;
}

export function InfrastructureToolbar({
  selectedCount,
  onAddEquipment,
  onDeleteSelected,
  onDeselectAll,
  columnVisibility,
  onColumnVisibilityChange
}: InfrastructureToolbarProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
      <button
        onClick={onAddEquipment}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
      >
        + Add Equipment
      </button>

      {selectedCount > 0 && (
        <>
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
        </>
      )}

      {/* Right side buttons */}
      <div className="ml-auto flex items-center gap-2">
        <InfrastructureColumnVisibilityMenu
          visibility={columnVisibility}
          onVisibilityChange={onColumnVisibilityChange}
        />
      </div>
    </div>
  );
}
