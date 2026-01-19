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
  const { currentProject, sections, items, updateItem, createItem, deleteItem } = usePrepStore();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shop Order</h2>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              // Add revision column (future feature)
              console.log('Add revision column');
            }}
            disabled={currentRevision >= 5}
          >
            + Add Revision
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
                      colSpan={revisionNumbers.length + 7}
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
                        className={`
                          border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800
                          ${isDeleted ? 'opacity-50 line-through' : ''}
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
                    <td colSpan={revisionNumbers.length + 7} className="px-3 py-2">
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
    </div>
  );
}
