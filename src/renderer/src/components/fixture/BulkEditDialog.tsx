import { useState } from 'react';
import { Fixture } from '../../types';

interface BulkEditDialogProps {
  isOpen: boolean;
  selectedCount: number;
  selectedIds: string[];
  onClose: () => void;
  onSubmit: (updates: Partial<Fixture>) => void;
  onAutoNumber: (field: keyof Fixture, start: number, increment: number) => void;
}

export function BulkEditDialog({ isOpen, selectedCount, selectedIds, onClose, onSubmit, onAutoNumber }: BulkEditDialogProps) {
  const [updates, setUpdates] = useState<Partial<Fixture>>({});
  const [showAutoNumber, setShowAutoNumber] = useState(false);
  const [autoNumberField, setAutoNumberField] = useState<keyof Fixture>('channel');
  const [autoNumberStart, setAutoNumberStart] = useState<number>(1);
  const [autoNumberIncrement, setAutoNumberIncrement] = useState<number>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit non-empty fields
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== '' && value !== undefined)
    );
    onSubmit(filteredUpdates as Partial<Fixture>);
    setUpdates({});
    onClose();
  };

  const handleAutoNumberSubmit = () => {
    onAutoNumber(autoNumberField, autoNumberStart, autoNumberIncrement);
    setShowAutoNumber(false);
    onClose();
  };

  const handleChange = (field: keyof Fixture, value: string) => {
    setUpdates(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bulk Edit {selectedCount} Fixture{selectedCount > 1 ? 's' : ''}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Only filled fields will be updated. Leave blank to keep existing values.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Common Fields Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  value={updates.type || ''}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Leave blank to skip"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Purpose
                </label>
                <input
                  type="text"
                  value={updates.purpose || ''}
                  onChange={(e) => handleChange('purpose', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Leave blank to skip"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={updates.color || ''}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Leave blank to skip"
                />
              </div>

              {/* Gobo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Gobo
                </label>
                <input
                  type="text"
                  value={updates.gobo || ''}
                  onChange={(e) => handleChange('gobo', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Leave blank to skip"
                />
              </div>

              {/* Dimmer */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Dimmer
                </label>
                <input
                  type="text"
                  value={updates.dimmer || ''}
                  onChange={(e) => handleChange('dimmer', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Leave blank to skip"
                />
              </div>

              {/* Circuit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Circuit Name
                </label>
                <input
                  type="text"
                  value={updates.circuit || ''}
                  onChange={(e) => handleChange('circuit', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Leave blank to skip"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={updates.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Leave blank to skip"
                />
              </div>

              {/* System */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  System
                </label>
                <input
                  type="text"
                  value={updates.system || ''}
                  onChange={(e) => handleChange('system', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="Leave blank to skip"
                />
              </div>
            </div>

            {/* Notes - full width */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={updates.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                placeholder="Leave blank to skip"
                rows={3}
              />
            </div>

            {/* Auto-Number Section */}
            <div className="border-t border-gray-600 pt-4">
              <button
                type="button"
                onClick={() => setShowAutoNumber(!showAutoNumber)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition flex items-center justify-center gap-2"
              >
                {showAutoNumber ? '▼' : '▶'} Auto-Number Fields
              </button>

              {showAutoNumber && (
                <div className="mt-4 p-4 bg-gray-900 border border-gray-600 rounded space-y-3">
                  <p className="text-sm text-gray-400">
                    Automatically number selected fixtures in sequence.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Field
                      </label>
                      <select
                        value={autoNumberField as string}
                        onChange={(e) => setAutoNumberField(e.target.value as keyof Fixture)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="channel">Channel</option>
                        <option value="unit">Unit</option>
                        <option value="unit_number">Unit Number</option>
                        <option value="dmx_address">DMX Address</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Start At
                      </label>
                      <input
                        type="number"
                        value={autoNumberStart}
                        onChange={(e) => setAutoNumberStart(parseInt(e.target.value) || 1)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Increment
                      </label>
                      <input
                        type="number"
                        value={autoNumberIncrement}
                        onChange={(e) => setAutoNumberIncrement(parseInt(e.target.value) || 1)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoNumberSubmit}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition"
                  >
                    Apply Auto-Number to {selectedCount} Fixture{selectedCount > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-900 dark:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-gray-900 dark:text-white transition"
            >
              Update {selectedCount} Fixture{selectedCount > 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
