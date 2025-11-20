import { useState } from 'react';
import type { PrepEquipmentItem } from '../../types/prep';
import { usePrepStore } from '../../store/prepStore';

interface EquipmentItemTableProps {
  sectionId: string;
  items: PrepEquipmentItem[];
  onAddItem: () => void;
  onEditItem: (item: PrepEquipmentItem) => void;
}

export function EquipmentItemTable({
  sectionId,
  items,
  onAddItem,
  onEditItem,
}: EquipmentItemTableProps) {
  const { updateItem, deleteItem } = usePrepStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<{
    itemId: string;
    field: 'active_qty' | 'spare_qty' | 'venue_qty';
    value: string;
  } | null>(null);

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

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

  const calculateRentalQty = (item: PrepEquipmentItem) => {
    return item.total_qty - item.venue_active - item.venue_spare;
  };

  if (sortedItems.length === 0) {
    return (
      <div className="bg-gray-750 rounded p-4 text-center">
        <p className="text-gray-400 text-sm mb-3">No equipment items in this section</p>
        <button
          onClick={onAddItem}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition"
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
            {sortedItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-800 transition group">
                <td className="px-3 py-2 text-white">
                  <div>
                    {item.description}
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
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
                      className="w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-center text-white focus:outline-none"
                      autoFocus
                      min="0"
                    />
                  ) : (
                    <span className="text-white">{item.active_qty}</span>
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
                      className="w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-center text-white focus:outline-none"
                      autoFocus
                      min="0"
                    />
                  ) : (
                    <span className="text-white">{item.spare_qty}</span>
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
                      className="w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-center text-white focus:outline-none"
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
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition"
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
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 border-t border-gray-700 flex justify-between items-center">
        <button
          onClick={onAddItem}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition"
        >
          + Add Item
        </button>
        <div className="text-xs text-gray-500">
          {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
