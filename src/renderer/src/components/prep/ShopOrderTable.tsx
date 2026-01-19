import React, { useState, useEffect, useRef } from 'react';
import { usePrepStore } from '../../store/prepStore';
import type { PrepSection, PrepEquipmentItem } from '../../types/prep';
import {
  parseRevisionQuantities,
  setRevisionQuantity,
  calculateTotalQuantity,
  calculateRentalQuantity,
} from '../../utils/revisionUtils';

interface ShopOrderTableProps {
  projectId: string;
}

interface EditingCell {
  itemId: string;
  field: 'description' | 'revision' | 'spare' | 'venue' | 'section';
  revisionNumber?: number;
}

/**
 * ShopOrderTable - Spreadsheet-like table interface for shop orders
 *
 * Features:
 * - Inline cell editing (like Excel)
 * - Revision columns (Rev 0, Rev 1, etc.)
 * - Section dropdown with carry-down behavior
 * - Spare and Venue columns
 * - Add/delete revision columns
 * - Row reordering via drag-and-drop
 */
export function ShopOrderTable({ projectId }: ShopOrderTableProps) {
  const { currentProject, sections, items, updateItem, createItem, deleteItem, updateProject, createRevision } = usePrepStore();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const [draggedItem, setDraggedItem] = useState<PrepEquipmentItem | null>(null);
  const [notesModalItem, setNotesModalItem] = useState<PrepEquipmentItem | null>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      // Only call select() on input elements (not select dropdowns)
      if ('select' in editInputRef.current) {
        editInputRef.current.select();
      }
    }
  }, [editingCell]);

  if (!currentProject) {
    return <div className="text-gray-500 p-4">No project loaded</div>;
  }

  const currentRevision = currentProject.current_revision;
  const revisionNumbers = Array.from({ length: currentRevision + 1 }, (_, i) => i);

  // Group items by section
  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  const startEdit = (itemId: string, field: EditingCell['field'], revisionNumber?: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    let value = '';
    if (field === 'description') {
      value = item.description;
    } else if (field === 'revision' && revisionNumber !== undefined) {
      const quantities = parseRevisionQuantities(item.revision_quantities);
      value = String(quantities[revisionNumber] || 0);
    } else if (field === 'spare') {
      value = String(item.spare_qty || 0);
    } else if (field === 'venue') {
      value = String(item.venue_qty || 0);
    } else if (field === 'section') {
      value = item.section_id;
    }

    setEditValue(value);
    setEditingCell({ itemId, field, revisionNumber });
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    const item = items.find((i) => i.id === editingCell.itemId);
    if (!item) return;

    try {
      if (editingCell.field === 'description') {
        await updateItem(item.id, { description: editValue });
      } else if (editingCell.field === 'revision' && editingCell.revisionNumber !== undefined) {
        const quantity = parseInt(editValue, 10) || 0;
        const updatedItem = setRevisionQuantity(item, editingCell.revisionNumber, quantity);
        await updateItem(item.id, { revision_quantities: updatedItem.revision_quantities });
      } else if (editingCell.field === 'spare') {
        const quantity = parseInt(editValue, 10) || 0;
        await updateItem(item.id, { spare_qty: quantity });
      } else if (editingCell.field === 'venue') {
        const quantity = parseInt(editValue, 10) || 0;
        await updateItem(item.id, { venue_qty: quantity });
      } else if (editingCell.field === 'section') {
        await updateItem(item.id, { section_id: editValue });
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    }

    cancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleAddRow = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const maxSortOrder = items
      .filter((i) => i.section_id === sectionId)
      .reduce((max, item) => Math.max(max, item.sort_order), 0);

    // Create new item with default values
    await createItem({
      section_id: sectionId,
      description: 'New Item',
      active_qty: 0,
      spare_qty: 0,
      venue_qty: 0,
      sort_order: maxSortOrder + 1,
      revision_quantities: JSON.stringify({ [currentRevision]: 0 }),
    });
  };

  const handleDeleteRow = async (itemId: string) => {
    if (window.confirm('Delete this item?')) {
      await deleteItem(itemId);
    }
  };

  const handleAddRevision = async () => {
    if (!currentProject || currentRevision >= 5) return;

    const newRevisionNumber = currentRevision + 1;

    // Create the revision record
    await createRevision({
      prep_project_id: projectId,
      revision_number: newRevisionNumber,
      revision_date: Date.now(),
      notes: '',
      change_log: JSON.stringify([]),
    });

    // Update project's current revision
    await updateProject(projectId, {
      current_revision: newRevisionNumber,
    });

    // Initialize revision_quantities for all items with the new revision
    // Copy quantity from previous revision
    for (const item of items) {
      const quantities = parseRevisionQuantities(item.revision_quantities);
      const previousQty = quantities[currentRevision] || 0;
      quantities[newRevisionNumber] = previousQty;
      await updateItem(item.id, {
        revision_quantities: JSON.stringify(quantities),
      });
    }
  };

  // Drag and drop handlers for row reordering
  const handleRowDragStart = (e: React.DragEvent, item: PrepEquipmentItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRowDrop = async (e: React.DragEvent, targetItem: PrepEquipmentItem) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      return;
    }

    // Only allow reordering within the same section
    if (draggedItem.section_id !== targetItem.section_id) {
      setDraggedItem(null);
      return;
    }

    const sectionItems = items
      .filter((i) => i.section_id === draggedItem.section_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const sourceIndex = sectionItems.findIndex((i) => i.id === draggedItem.id);
    const targetIndex = sectionItems.findIndex((i) => i.id === targetItem.id);

    if (sourceIndex === targetIndex) {
      setDraggedItem(null);
      return;
    }

    // Reorder items
    const reordered = [...sectionItems];
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shop Order</h2>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleAddRevision}
            disabled={currentRevision >= 5}
            title={currentRevision >= 5 ? 'Maximum 6 revisions reached' : 'Add new revision column'}
          >
            + Add Revision {currentRevision >= 5 && '(Max)'}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-48">
                Section
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[300px]">
                Description
              </th>
              {revisionNumbers.map((revNum) => (
                <th
                  key={revNum}
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-20"
                >
                  Rev {revNum}
                </th>
              ))}
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-20">
                Spare
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-20">
                Venue
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-20">
                Total
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-20">
                Rental
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-16">
                Notes
              </th>
              <th className="px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {sortedSections.map((section) => {
              const sectionItems = items
                .filter((item) => item.section_id === section.id)
                .sort((a, b) => a.sort_order - b.sort_order);

              return (
                <React.Fragment key={section.id}>
                  {/* Section Header Row */}
                  <tr className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-400 dark:border-gray-600">
                    <td
                      colSpan={revisionNumbers.length + 8}
                      className="px-3 py-2 font-bold text-sm text-gray-900 dark:text-white"
                    >
                      {section.name.toUpperCase()}
                    </td>
                  </tr>

                  {/* Items */}
                  {sectionItems.map((item) => {
                    const quantities = parseRevisionQuantities(item.revision_quantities);
                    const total = calculateTotalQuantity(item);
                    const rental = calculateRentalQuantity(item);
                    const isDeleted = item.deleted_in_revision !== undefined;

                    return (
                      <tr
                        key={item.id}
                        draggable={!isDeleted}
                        onDragStart={(e) => handleRowDragStart(e, item)}
                        onDragOver={handleRowDragOver}
                        onDrop={(e) => handleRowDrop(e, item)}
                        className={`
                          border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800
                          ${isDeleted ? 'opacity-50 line-through' : 'cursor-move'}
                          ${draggedItem?.id === item.id ? 'opacity-50' : ''}
                        `}
                      >
                        {/* Section Dropdown */}
                        <td className="px-3 py-2">
                          {editingCell?.itemId === item.id && editingCell.field === 'section' ? (
                            <select
                              ref={editInputRef as any}
                              value={editValue}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                // Save immediately on change for dropdowns
                                updateItem(item.id, { section_id: e.target.value });
                                cancelEdit();
                              }}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                              {sortedSections.map((sec) => (
                                <option key={sec.id} value={sec.id}>
                                  {sec.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div
                              className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                              onClick={() => startEdit(item.id, 'section')}
                            >
                              {section.name}
                            </div>
                          )}
                        </td>

                        {/* Description */}
                        <td className="px-3 py-2">
                          {editingCell?.itemId === item.id && editingCell.field === 'description' ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div
                              className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                              onClick={() => startEdit(item.id, 'description')}
                            >
                              {item.description || '(empty)'}
                            </div>
                          )}
                        </td>

                        {/* Revision Columns */}
                        {revisionNumbers.map((revNum) => (
                          <td key={revNum} className="px-3 py-2 text-center">
                            {editingCell?.itemId === item.id &&
                            editingCell.field === 'revision' &&
                            editingCell.revisionNumber === revNum ? (
                              <input
                                ref={editInputRef}
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={handleKeyDown}
                                className="w-full px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            ) : (
                              <div
                                className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                                onClick={() => startEdit(item.id, 'revision', revNum)}
                              >
                                {quantities[revNum] || 0}
                              </div>
                            )}
                          </td>
                        ))}

                        {/* Spare */}
                        <td className="px-3 py-2 text-center">
                          {editingCell?.itemId === item.id && editingCell.field === 'spare' ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div
                              className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                              onClick={() => startEdit(item.id, 'spare')}
                            >
                              {item.spare_qty || 0}
                            </div>
                          )}
                        </td>

                        {/* Venue */}
                        <td className="px-3 py-2 text-center">
                          {editingCell?.itemId === item.id && editingCell.field === 'venue' ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div
                              className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                              onClick={() => startEdit(item.id, 'venue')}
                            >
                              {item.venue_qty || 0}
                            </div>
                          )}
                        </td>

                        {/* Total */}
                        <td className="px-3 py-2 text-center">
                          <div className="text-sm font-bold">{total}</div>
                        </td>

                        {/* Rental */}
                        <td className="px-3 py-2 text-center">
                          <div className="text-sm font-bold">{rental}</div>
                        </td>

                        {/* Notes */}
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => setNotesModalItem(item)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                            title={item.notes ? 'Edit notes' : 'Add notes'}
                          >
                            {item.notes ? '📝' : '📄'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleDeleteRow(item.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                            title="Delete item"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Add Row Button */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td colSpan={revisionNumbers.length + 8} className="px-3 py-2">
                      <button
                        onClick={() => handleAddRow(section.id)}
                        className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        + Add Item
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {sections.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sections yet. Add a section to start building your shop order.
          </div>
        )}
      </div>

      {/* Item Notes Modal */}
      {notesModalItem && (
        <ItemNotesModal
          item={notesModalItem}
          onClose={() => setNotesModalItem(null)}
          onSave={async (notes) => {
            await updateItem(notesModalItem.id, { notes });
            setNotesModalItem(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * ItemNotesModal - Modal for editing item notes
 */
interface ItemNotesModalProps {
  item: PrepEquipmentItem;
  onClose: () => void;
  onSave: (notes: string) => void;
}

function ItemNotesModal({ item, onClose, onSave }: ItemNotesModalProps) {
  const [notes, setNotes] = useState(item.notes || '');

  const handleSave = () => {
    onSave(notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Item Notes: {item.description}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this item..."
            className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
