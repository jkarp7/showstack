import { useState } from 'react';
import { usePrepStore } from '../../store/prepStore';

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionName: string;
}

export function AddItemDialog({ isOpen, onClose, sectionId, sectionName }: AddItemDialogProps) {
  const { createItem, items } = usePrepStore();
  const [description, setDescription] = useState('');
  const [activeQty, setActiveQty] = useState(0);
  const [spareQty, setSpareQty] = useState(0);
  const [venueQty, setVenueQty] = useState(0);
  const [weight, setWeight] = useState('');
  const [power, setPower] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Calculate next sort order for this section
    const sectionItems = items.filter((item) => item.section_id === sectionId);
    const maxSortOrder = sectionItems.reduce((max, item) => Math.max(max, item.sort_order), -1);
    const nextSortOrder = maxSortOrder + 1;

    await createItem({
      section_id: sectionId,
      description: description.trim(),
      active_qty: activeQty,
      spare_qty: spareQty,
      venue_qty: venueQty,
      weight: weight ? parseFloat(weight) : undefined,
      power: power ? parseFloat(power) : undefined,
      notes: notes.trim() || undefined,
      sort_order: nextSortOrder,
    });

    setIsSubmitting(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setDescription('');
    setActiveQty(0);
    setSpareQty(0);
    setVenueQty(0);
    setWeight('');
    setPower('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-1 text-white">Add Equipment Item</h2>
        <p className="text-sm text-gray-400 mb-4">Section: {sectionName}</p>

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

          {/* Total and Rental Summary */}
          <div className="bg-gray-700/50 rounded p-3 grid grid-cols-2 gap-4 text-sm">
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

          {/* Optional Fields Row */}
          <div className="grid grid-cols-2 gap-4">
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
              onClick={handleClose}
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
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
