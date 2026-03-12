import type { FixtureGroup } from '../../types/group';

interface GroupChipProps {
  group: FixtureGroup;
  memberCount: number;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  onSelect: () => void;
}

/**
 * GroupChip — one row in the groups list.
 *
 * Clicking the chip applies the group as the active grid filter.
 * The chevron / row click selects the group for detail editing.
 */
export function GroupChip({
  group,
  memberCount,
  isActive,
  isSelected,
  onClick,
  onSelect,
}: GroupChipProps) {
  const dotColor = group.color ?? '#94a3b8'; // slate-400 fallback

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none transition-colors ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
      onClick={onSelect}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${group.name}, ${memberCount} fixtures`}
    >
      {/* Color dot */}
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: dotColor }}
        aria-hidden="true"
      />

      {/* Group name */}
      <button
        className={`flex-1 text-left text-sm font-medium truncate ${
          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        title={isActive ? 'Click to clear group filter' : 'Click to filter by this group'}
      >
        {group.name}
      </button>

      {/* Fixture count */}
      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 tabular-nums">
        ({memberCount})
      </span>
    </div>
  );
}
