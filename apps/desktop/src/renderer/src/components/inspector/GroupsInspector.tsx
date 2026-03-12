import { useState, useEffect, useRef } from 'react';
import { useGroupStore } from '../../store/groupStore';
import type { FixtureGroup } from '../../types/group';
import type { Fixture } from '../../types';
import { countGroupMembers } from '../../utils/groupMembership';
import { GroupChip } from './GroupChip';
import { GroupDetail } from './GroupDetail';

interface GroupsInspectorProps {
  fixtures: Fixture[];
  activeGroupId: string | null;
  onGroupActivate: (groupId: string | null) => void;
  projectId: string;
}

/**
 * GroupsInspector — the first consumer of InspectorPanel.
 *
 * Shows a list of group chips with live fixture counts, and a detail
 * panel for the currently selected group.
 */
export function GroupsInspector({
  fixtures,
  activeGroupId,
  onGroupActivate,
  projectId,
}: GroupsInspectorProps) {
  const { groups, loading, createGroup, updateGroup, deleteGroup, addPin, removePin } =
    useGroupStore();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Inline "new group" form state
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const newGroupInputRef = useRef<HTMLInputElement>(null);

  // Pins state: groupId → fixture ids (loaded lazily on selection)
  const [pins, setPins] = useState<Record<string, string[]>>({});

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  // Load pins for the selected group when it changes
  useEffect(() => {
    if (!selectedGroupId || pins[selectedGroupId] !== undefined) return;
    window.api?.groups
      .getPins(selectedGroupId)
      .then((rows) => {
        setPins((prev) => ({
          ...prev,
          [selectedGroupId]: rows.map((r: { fixture_id: string }) => r.fixture_id),
        }));
      })
      .catch(() => {
        setPins((prev) => ({ ...prev, [selectedGroupId]: [] }));
      });
  }, [selectedGroupId]);

  function startCreate() {
    setIsCreating(true);
    setNewGroupName('');
    setTimeout(() => newGroupInputRef.current?.focus(), 0);
  }

  async function commitCreate() {
    const name = newGroupName.trim();
    if (!name) {
      setIsCreating(false);
      return;
    }
    setIsCreating(false);
    setNewGroupName('');
    const created = await createGroup({ name }, projectId);
    setSelectedGroupId(created.id);
  }

  function cancelCreate() {
    setIsCreating(false);
    setNewGroupName('');
  }

  async function handleUpdate(id: string, updates: Partial<FixtureGroup>) {
    await updateGroup(id, updates);
  }

  async function handleDelete(id: string) {
    await deleteGroup(id);
    if (selectedGroupId === id) setSelectedGroupId(null);
    if (activeGroupId === id) onGroupActivate(null);
    setPins((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleRemovePin(groupId: string, fixtureId: string) {
    await removePin(groupId, fixtureId);
    setPins((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).filter((id) => id !== fixtureId),
    }));
  }

  function handleChipClick(groupId: string) {
    // Toggle: clicking the active group clears the filter
    onGroupActivate(activeGroupId === groupId ? null : groupId);
  }

  function handleChipSelect(groupId: string) {
    setSelectedGroupId((prev) => (prev === groupId ? null : groupId));
  }

  if (loading) {
    return (
      <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">Loading groups…</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Groups</span>
        {!isCreating && (
          <button
            onClick={startCreate}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            aria-label="New group"
          >
            + New
          </button>
        )}
      </div>

      {/* Inline new-group form */}
      {isCreating && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <input
            ref={newGroupInputRef}
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitCreate();
              if (e.key === 'Escape') cancelCreate();
            }}
            placeholder="Group name"
            className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={commitCreate}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add
          </button>
          <button
            onClick={cancelCreate}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Group list */}
      <div className="flex-shrink-0">
        {groups.length === 0 && !isCreating ? (
          <div className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
            No groups yet.{' '}
            <button
              onClick={startCreate}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create one
            </button>{' '}
            to filter and organize fixtures.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {groups.map((group) => (
              <GroupChip
                key={group.id}
                group={group}
                memberCount={countGroupMembers(group, fixtures, pins[group.id] ?? [])}
                isActive={activeGroupId === group.id}
                isSelected={selectedGroupId === group.id}
                onClick={() => handleChipClick(group.id)}
                onSelect={() => handleChipSelect(group.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Active filter indicator */}
      {activeGroupId && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-y border-blue-100 dark:border-blue-800/30 flex-shrink-0">
          <span className="text-xs text-blue-700 dark:text-blue-300">
            Filtering by: <strong>{groups.find((g) => g.id === activeGroupId)?.name}</strong>
          </span>
          <button
            onClick={() => onGroupActivate(null)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Group detail */}
      {selectedGroup && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0" />
          <div className="flex-1 overflow-y-auto">
            <GroupDetail
              group={selectedGroup}
              pinnedFixtureIds={pins[selectedGroup.id] ?? []}
              onUpdate={handleUpdate}
              onRemovePin={handleRemovePin}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}
    </div>
  );
}
