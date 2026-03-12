import { useState, useRef, useEffect } from 'react';

interface FilterChipBarProps {
  locationFilter: string;
  onLocationChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  showHidden: boolean;
  onShowHiddenChange: (v: boolean) => void;
  onClearFilters: () => void;
  availableLocations: string[];
  availableTypes: string[];
  availableStatuses: string[];
}

interface ChipProps {
  label: string;
  onRemove: () => void;
}

function Chip({ label, onRemove }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:text-blue-600 dark:hover:text-blue-100 leading-none"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  );
}

export function FilterChipBar({
  locationFilter,
  onLocationChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  showHidden,
  onShowHiddenChange,
  onClearFilters,
  availableLocations,
  availableTypes,
  availableStatuses,
}: FilterChipBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hasActiveFilters =
    locationFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || showHidden;

  // Close panel when clicking outside
  useEffect(() => {
    if (!panelOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen]);

  // Render nothing when no active filters and panel is closed
  if (!hasActiveFilters && !panelOpen) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-1.5 flex items-center gap-2 relative">
        <button
          ref={buttonRef}
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
          Add Filter
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative">
      {/* Chip row */}
      <div className="px-4 py-1.5 flex items-center gap-1.5 flex-wrap">
        <button
          ref={buttonRef}
          onClick={() => setPanelOpen((p) => !p)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
            panelOpen
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
          Filters {panelOpen ? '▲' : '▾'}
        </button>

        {locationFilter !== 'all' && (
          <Chip label={`Location: ${locationFilter}`} onRemove={() => onLocationChange('all')} />
        )}
        {typeFilter !== 'all' && (
          <Chip label={`Type: ${typeFilter}`} onRemove={() => onTypeChange('all')} />
        )}
        {statusFilter !== 'all' && (
          <Chip label={`Status: ${statusFilter}`} onRemove={() => onStatusChange('all')} />
        )}
        {showHidden && <Chip label="Show Hidden" onRemove={() => onShowHiddenChange(false)} />}

        {hasActiveFilters && (
          <button
            onClick={() => {
              onClearFilters();
              setPanelOpen(false);
            }}
            className="ml-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 top-full z-20 bg-white dark:bg-gray-800 border-b border-x border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => onLocationChange(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => onTypeChange(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All</option>
              {availableStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => onShowHiddenChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Show Hidden
          </label>

          <button
            onClick={() => setPanelOpen(false)}
            className="ml-auto text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
