import { useState, useEffect } from 'react';
import { usePrepStore } from '../../store/prepStore';
import type { PrepEquipmentItem } from '../../types/prep';

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: PrepEquipmentItem | null;
}

export function EditItemDialog({ isOpen, onClose, item }: EditItemDialogProps) {
  const updateItem = usePrepStore((state) => state.updateItem);
  const [description, setDescription] = useState('');
  const [activeQty, setActiveQty] = useState(0);
  const [spareQty, setSpareQty] = useState(0);
  const [venueQty, setVenueQty] = useState(0);
  const [weight, setWeight] = useState('');
  const [power, setPower] = useState('');
  const [notes, setNotes] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setDescription(item.description);
      setActiveQty(item.active_qty);
      setSpareQty(item.spare_qty);
      setVenueQty(item.venue_qty);
      setWeight(item.weight?.toString() || '');
      setPower(item.power?.toString() || '');
      setNotes(item.notes || '');
      setSortOrder(item.sort_order);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item || !description.trim()) {
      return;
    }

    setIsSubmitting(true);

    await updateItem(item.id, {
      description: description.trim(),
      active_qty: activeQty,
      spare_qty: spareQty,
      venue_qty: venueQty,
      weight: weight ? parseFloat(weight) : undefined,
      power: power ? parseFloat(power) : undefined,
      notes: notes.trim() || undefined,
      sort_order: sortOrder,
    });

    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-white">Edit Equipment Item</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Equipment Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Robe Robin T1 Profile"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Quantities Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Active Qty</label>
              <input
                type="number"
                value={activeQty}
                onChange={(e) => setActiveQty(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Spare Qty</label>
              <input
                type="number"
                value={spareQty}
                onChange={(e) => setSpareQty(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-400 mb-2">
                Venue Qty
              </label>
              <input
                type="number"
                value={venueQty}
                onChange={(e) => setVenueQty(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Venue Allocation Display */}
          <div className="bg-gray-700/50 rounded p-3 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Total Needed:</span>{' '}
                <span className="text-white font-medium">{activeQty + spareQty}</span>
              </div>
              <div>
                <span className="text-gray-400">Rental Qty:</span>{' '}
                <span className="text-blue-400 font-medium">
                  {Math.max(0, activeQty + spareQty - venueQty)}
                </span>
              </div>
            </div>
            {venueQty > 0 && (
              <div className="pt-2 border-t border-gray-600 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Venue Active:</span>{' '}
                  <span className="text-purple-400 font-medium">
                    {Math.min(venueQty, activeQty)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Venue Spare:</span>{' '}
                  <span className="text-purple-400 font-medium">
                    {Math.max(0, venueQty - Math.min(venueQty, activeQty))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Fields Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Power (watts)
              </label>
              <input
                type="number"
                step="0.1"
                value={power}
                onChange={(e) => setPower(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this equipment..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!description.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
