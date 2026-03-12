import { useState, useEffect, useRef } from 'react';
import type { FixtureGroup, GroupFilterDef } from '../../types/group';
import { parseFilterDef } from '../../utils/groupMembership';
import { GroupFilterEditor } from './GroupFilterEditor';

interface GroupDetailProps {
  group: FixtureGroup;
  pinnedFixtureIds: string[];
  onUpdate: (id: string, updates: Partial<FixtureGroup>) => void;
  onRemovePin: (groupId: string, fixtureId: string) => void;
  onDelete: (id: string) => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#94a3b8', // slate (default)
];

/**
 * GroupDetail — editable detail view for a selected group.
 *
 * Fields auto-save on blur. Filter changes are saved immediately via onChange.
 */
export function GroupDetail({
  group,
  pinnedFixtureIds,
  onUpdate,
  onRemovePin,
  onDelete,
}: GroupDetailProps) {
  const [name, setName] = useState(group.name);
  const [notes, setNotes] = useState(group.notes ?? '');
  const [shopNotes, setShopNotes] = useState(group.shop_notes ?? '');
  const [filterDef, setFilterDef] = useState<GroupFilterDef | null>(
    parseFilterDef(group.filter_def),
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Sync when selected group changes
  useEffect(() => {
    setName(group.name);
    setNotes(group.notes ?? '');
    setShopNotes(group.shop_notes ?? '');
    setFilterDef(parseFilterDef(group.filter_def));
    setConfirmingDelete(false);
  }, [group.id]);

  function saveField(updates: Partial<FixtureGroup>) {
    onUpdate(group.id, updates);
  }

  function handleFilterChange(def: GroupFilterDef) {
    setFilterDef(def);
    onUpdate(group.id, {
      filter_def: def.conditions.length > 0 ? JSON.stringify(def) : undefined,
    });
  }

  return (
    <div className="px-3 py-3 space-y-4 text-sm">
      {/* Name */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && saveField({ name: name.trim() })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Color */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Color
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => saveField({ color: c })}
              aria-label={`Select color ${c}`}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                group.color === c
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          {/* Custom color input */}
          <input
            type="color"
            value={group.color ?? '#94a3b8'}
            onChange={(e) => saveField({ color: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent p-0"
            title="Custom color"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => saveField({ notes: notes || undefined })}
          rows={2}
          placeholder="General notes (paperwork, section headers)"
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Shop Notes */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Shop Notes
        </label>
        <textarea
          value={shopNotes}
          onChange={(e) => setShopNotes(e.target.value)}
          onBlur={() => saveField({ shop_notes: shopNotes || undefined })}
          rows={2}
          placeholder="Section note in shop order output"
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Filter Definition */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Filter
        </label>
        <GroupFilterEditor filterDef={filterDef} onChange={handleFilterChange} />
      </div>

      {/* Pinned Fixtures */}
      {pinnedFixtureIds.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Pinned Fixtures ({pinnedFixtureIds.length})
          </label>
          <div className="space-y-1">
            {pinnedFixtureIds.map((fid) => (
              <div key={fid} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-gray-700 dark:text-gray-300 font-mono truncate">{fid}</span>
                <button
                  onClick={() => onRemovePin(group.id, fid)}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0"
                  aria-label="Unpin fixture"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Delete "{group.name}"?</span>
            <button
              onClick={() => onDelete(group.id)}
              className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Delete group
          </button>
        )}
      </div>
    </div>
  );
}
