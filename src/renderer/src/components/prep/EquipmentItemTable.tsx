import { useState, useEffect, useRef } from 'react';
import type { PrepEquipmentItem } from '../../types/prep';
import { usePrepStore } from '../../store/prepStore';

interface EquipmentItemTableProps {
  sectionId: string;
  items: PrepEquipmentItem[];
  onAddItem: () => void;
  onEditItem: (item: PrepEquipmentItem) => void;
  triggerAdd?: boolean; // Trigger to start adding a new row
}

interface NewItemRow {
  description: string;
  active_qty: number;
  spare_qty: number;
  venue_qty: number;
}

export function EquipmentItemTable({
  sectionId,
  items,
  onAddItem,
  onEditItem,
  triggerAdd,
}: EquipmentItemTableProps) {
  const { updateItem, deleteItem, createItem } = usePrepStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<{
    itemId: string;
    field: 'active_qty' | 'spare_qty' | 'venue_qty';
    value: string;
  } | null>(null);
  const [editingNotes, setEditingNotes] = useState<{
    itemId: string;
    value: string;
  } | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRow, setNewRow] = useState<NewItemRow>({
    description: '',
    active_qty: 0,
    spare_qty: 0,
    venue_qty: 0,
  });
  const [isSubmittingNewRow, setIsSubmittingNewRow] = useState(false);
  const [draggedItem, setDraggedItem] = useState<PrepEquipmentItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

  // Watch for external trigger to start adding a row
  useEffect(() => {
    if (triggerAdd) {
      handleStartAddingRow();
    }
  }, [triggerAdd]);

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Delete this equipment item?')) {
      setDeletingId(itemId);
      await deleteItem(itemId);
      setDeletingId(null);
    }
  };

  const handleQtyClick = (
    itemId: string,
    field: 'active_qty' | 'spare_qty' | 'venue_qty',
    currentValue: number
  ) => {
    setEditingQty({ itemId, field, value: currentValue.toString() });
  };

  const handleQtyChange = (value: string) => {
    if (editingQty) {
      setEditingQty({ ...editingQty, value });
    }
  };

  const handleQtyBlur = async () => {
    if (!editingQty) return;

    const newValue = parseInt(editingQty.value) || 0;
    const item = items.find((i) => i.id === editingQty.itemId);

    if (item && item[editingQty.field] !== newValue) {
      await updateItem(editingQty.itemId, {
        [editingQty.field]: newValue,
      });
    }

    setEditingQty(null);
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQtyBlur();
    } else if (e.key === 'Escape') {
      setEditingQty(null);
    }
  };

  const handleNotesClick = (itemId: string, currentNotes: string) => {
    setEditingNotes({ itemId, value: currentNotes || '' });
  };

  const handleNotesChange = (value: string) => {
    if (editingNotes) {
      setEditingNotes({ ...editingNotes, value });
    }
  };

  const handleNotesBlur = async () => {
    if (!editingNotes) return;

    const item = items.find((i) => i.id === editingNotes.itemId);
    if (item && item.notes !== editingNotes.value) {
      await updateItem(editingNotes.itemId, {
        notes: editingNotes.value.trim() || undefined,
      });
    }

    setEditingNotes(null);
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNotesBlur();
    } else if (e.key === 'Escape') {
      setEditingNotes(null);
    }
  };

  const calculateRentalQty = (item: PrepEquipmentItem) => {
    return item.total_qty - item.venue_active - item.venue_spare;
  };

  const handleStartAddingRow = () => {
    setIsAddingRow(true);
    setNewRow({
      description: '',
      active_qty: 0,
      spare_qty: 0,
      venue_qty: 0,
    });
  };

  const handleCancelNewRow = () => {
    setIsAddingRow(false);
    setNewRow({
      description: '',
      active_qty: 0,
      spare_qty: 0,
      venue_qty: 0,
    });
  };

  const handleSaveNewRow = async (continueAdding = false) => {
    if (!newRow.description.trim()) {
      return;
    }

    setIsSubmittingNewRow(true);

    // Calculate next sort order for this section
    const maxSortOrder = sortedItems.reduce((max, item) => Math.max(max, item.sort_order), -1);
    const nextSortOrder = maxSortOrder + 1;

    await createItem({
      section_id: sectionId,
      description: newRow.description.trim(),
      active_qty: newRow.active_qty,
      spare_qty: newRow.spare_qty,
      venue_qty: newRow.venue_qty,
      sort_order: nextSortOrder,
    });

    setIsSubmittingNewRow(false);

    // Reset the form
    setNewRow({
      description: '',
      active_qty: 0,
      spare_qty: 0,
      venue_qty: 0,
    });

    if (!continueAdding) {
      setIsAddingRow(false);
    } else {
      // If continuing, focus the description input for next entry
      setTimeout(() => {
        descriptionInputRef.current?.focus();
      }, 50);
    }
  };

  const handleNewRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // SHIFT+ENTER: Save and create another
        e.preventDefault();
        handleSaveNewRow(true);
      } else {
        // Regular ENTER: Save and close
        e.preventDefault();
        handleSaveNewRow(false);
      }
    } else if (e.key === 'Escape') {
      handleCancelNewRow();
    }
  };

  const calculateNewRowTotals = () => {
    const total = newRow.active_qty + newRow.spare_qty;
    const rental = Math.max(0, total - newRow.venue_qty);
    return { total, rental };
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: PrepEquipmentItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedItem) return;

    const sourceIndex = sortedItems.findIndex((item) => item.id === draggedItem.id);
    if (sourceIndex === targetIndex) return;

    // Reorder items
    const reordered = [...sortedItems];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update sort_order for all affected items
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].sort_order !== i) {
        await updateItem(reordered[i].id, { sort_order: i });
      }
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleMergeDuplicates = async () => {
    // Find items with duplicate descriptions (case-insensitive)
    const descriptionGroups = new Map<string, PrepEquipmentItem[]>();

    sortedItems.forEach((item) => {
      const normalizedDesc = item.description.trim().toLowerCase();
      if (!descriptionGroups.has(normalizedDesc)) {
        descriptionGroups.set(normalizedDesc, []);
      }
      descriptionGroups.get(normalizedDesc)!.push(item);
    });

    // Find groups with duplicates
    const duplicateGroups = Array.from(descriptionGroups.values()).filter(
      (group) => group.length > 1
    );

    if (duplicateGroups.length === 0) {
      alert('No duplicate items found to merge.');
      return;
    }

    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);
    const confirmMessage = `Found ${duplicateGroups.length} set(s) of duplicates (${totalDuplicates} items will be merged).\n\nMerge all duplicate items?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Merge each group
    for (const group of duplicateGroups) {
      // Sort by sort_order to keep the first one
      const sorted = [...group].sort((a, b) => a.sort_order - b.sort_order);
      const primary = sorted[0];
      const duplicates = sorted.slice(1);

      // Sum up all quantities
      const totalActive = sorted.reduce((sum, item) => sum + item.active_qty, 0);
      const totalSpare = sorted.reduce((sum, item) => sum + item.spare_qty, 0);
      const totalVenue = sorted.reduce((sum, item) => sum + item.venue_qty, 0);

      // Combine notes (if any)
      const allNotes = sorted
        .map((item) => item.notes)
        .filter((note) => note && note.trim())
        .join(' | ');

      // Update the primary item with combined quantities
      await updateItem(primary.id, {
        active_qty: totalActive,
        spare_qty: totalSpare,
        venue_qty: totalVenue,
        notes: allNotes || undefined,
      });

      // Delete duplicates
      for (const duplicate of duplicates) {
        await deleteItem(duplicate.id);
      }
    }
  };

  if (sortedItems.length === 0 && !isAddingRow) {
    return (
      <div className="bg-gray-750 rounded p-4 text-center">
        <p className="text-gray-400 text-sm mb-3">No equipment items in this section</p>
        <button
          onClick={handleStartAddingRow}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-gray-900 dark:text-white text-sm transition"
        >
          + Add First Item
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-750 rounded overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                Description
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase w-20">
                Active
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase w-20">
                Spare
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase w-20">
                Total
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase w-20">
                Venue
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase w-20">
                Rental
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {/* Existing Items */}
            {sortedItems.map((item, index) => (
              <tr
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`hover:bg-gray-800 transition group cursor-move ${
                  dragOverIndex === index ? 'border-t-2 border-blue-500' : ''
                } ${draggedItem?.id === item.id ? 'opacity-50' : ''}`}
              >
                <td className="px-3 py-2 text-gray-900 dark:text-white">
                  <div>
                    <div>{item.description}</div>
                    {/* Inline editable notes */}
                    {editingNotes?.itemId === item.id ? (
                      <input
                        type="text"
                        value={editingNotes.value}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        onBlur={handleNotesBlur}
                        onKeyDown={handleNotesKeyDown}
                        placeholder="Add notes..."
                        className="w-full mt-1 px-2 py-1 bg-gray-600 border border-blue-500 rounded text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => handleNotesClick(item.id, item.notes || '')}
                        className="mt-1 text-xs text-gray-400 italic cursor-pointer hover:text-gray-300 hover:bg-gray-700 rounded px-1 py-0.5 transition"
                      >
                        {item.notes || '+ Add notes...'}
                      </div>
                    )}
                  </div>
                </td>

                {/* Active Qty - Editable */}
                <td
                  className="px-3 py-2 text-center cursor-pointer hover:bg-gray-700"
                  onClick={() => handleQtyClick(item.id, 'active_qty', item.active_qty)}
                >
                  {editingQty?.itemId === item.id && editingQty.field === 'active_qty' ? (
                    <input
                      type="number"
                      value={editingQty.value}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      onBlur={handleQtyBlur}
                      onKeyDown={handleQtyKeyDown}
                      className="w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-center text-gray-900 dark:text-white focus:outline-none"
                      autoFocus
                      min="0"
                    />
                  ) : (
                    <span className="text-gray-900 dark:text-white">{item.active_qty}</span>
                  )}
                </td>

                {/* Spare Qty - Editable */}
                <td
                  className="px-3 py-2 text-center cursor-pointer hover:bg-gray-700"
                  onClick={() => handleQtyClick(item.id, 'spare_qty', item.spare_qty)}
                >
                  {editingQty?.itemId === item.id && editingQty.field === 'spare_qty' ? (
                    <input
                      type="number"
                      value={editingQty.value}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      onBlur={handleQtyBlur}
                      onKeyDown={handleQtyKeyDown}
                      className="w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-center text-gray-900 dark:text-white focus:outline-none"
                      autoFocus
                      min="0"
                    />
                  ) : (
                    <span className="text-gray-900 dark:text-white">{item.spare_qty}</span>
                  )}
                </td>

                {/* Total (calculated) */}
                <td className="px-3 py-2 text-center">
                  <span className="text-gray-400 font-medium">{item.total_qty}</span>
                </td>

                {/* Venue Qty - Editable */}
                <td
                  className="px-3 py-2 text-center cursor-pointer hover:bg-gray-700"
                  onClick={() => handleQtyClick(item.id, 'venue_qty', item.venue_qty)}
                >
                  {editingQty?.itemId === item.id && editingQty.field === 'venue_qty' ? (
                    <input
                      type="number"
                      value={editingQty.value}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      onBlur={handleQtyBlur}
                      onKeyDown={handleQtyKeyDown}
                      className="w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-center text-gray-900 dark:text-white focus:outline-none"
                      autoFocus
                      min="0"
                    />
                  ) : (
                    <span className="text-purple-400">{item.venue_qty}</span>
                  )}
                </td>

                {/* Rental (calculated) */}
                <td className="px-3 py-2 text-center">
                  <span className="text-blue-400 font-medium">{calculateRentalQty(item)}</span>
                </td>

                {/* Actions */}
                <td className="px-3 py-2 text-right">
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEditItem(item)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-900 dark:text-white transition"
                      title="Edit details (weight, power, notes)"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 rounded text-xs text-red-400 transition disabled:opacity-50"
                    >
                      {deletingId === item.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* New Row Entry - at bottom */}
            {isAddingRow && (
              <tr className="bg-blue-900/20 border-2 border-blue-500">
                <td className="px-3 py-2">
                  <input
                    ref={descriptionInputRef}
                    type="text"
                    value={newRow.description}
                    onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                    onKeyDown={handleNewRowKeyDown}
                    placeholder="Enter equipment description..."
                    className="w-full px-2 py-1 bg-gray-700 border border-blue-500 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                    autoFocus
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={newRow.active_qty}
                    onChange={(e) =>
                      setNewRow({ ...newRow, active_qty: parseInt(e.target.value) || 0 })
                    }
                    onKeyDown={handleNewRowKeyDown}
                    min="0"
                    className="w-full px-2 py-1 bg-gray-700 border border-blue-500 rounded text-center text-gray-900 dark:text-white focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={newRow.spare_qty}
                    onChange={(e) =>
                      setNewRow({ ...newRow, spare_qty: parseInt(e.target.value) || 0 })
                    }
                    onKeyDown={handleNewRowKeyDown}
                    min="0"
                    className="w-full px-2 py-1 bg-gray-700 border border-blue-500 rounded text-center text-gray-900 dark:text-white focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="text-gray-400 font-medium">{calculateNewRowTotals().total}</span>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={newRow.venue_qty}
                    onChange={(e) =>
                      setNewRow({ ...newRow, venue_qty: parseInt(e.target.value) || 0 })
                    }
                    onKeyDown={handleNewRowKeyDown}
                    min="0"
                    className="w-full px-2 py-1 bg-gray-700 border border-purple-500 rounded text-center text-gray-900 dark:text-white focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="text-blue-400 font-medium">
                    {calculateNewRowTotals().rental}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleSaveNewRow(false)}
                      disabled={!newRow.description.trim() || isSubmittingNewRow}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-gray-900 dark:text-white transition disabled:opacity-50"
                    >
                      {isSubmittingNewRow ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelNewRow}
                      disabled={isSubmittingNewRow}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-900 dark:text-white transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 border-t border-gray-700 flex justify-between items-center">
        <div className="flex gap-2">
          {!isAddingRow && (
            <>
              <button
                onClick={handleStartAddingRow}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-gray-900 dark:text-white text-sm transition"
              >
                + Add Item
              </button>
              {sortedItems.length > 1 && (
                <button
                  onClick={handleMergeDuplicates}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-gray-900 dark:text-white text-sm transition"
                  title="Merge items with identical descriptions"
                >
                  Merge Duplicates
                </button>
              )}
            </>
          )}
          {isAddingRow && (
            <div className="text-xs text-blue-400">
              Press Enter to save, SHIFT+Enter to save & add another, Escape to cancel
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
