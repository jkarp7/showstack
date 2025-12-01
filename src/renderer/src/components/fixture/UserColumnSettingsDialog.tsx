import { useState, useEffect } from 'react';

interface UserColumnSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (definitions: Record<string, string>) => void;
  initialDefinitions?: Record<string, string>;
}

export function UserColumnSettingsDialog({
  isOpen,
  onClose,
  onSave,
  initialDefinitions = {},
}: UserColumnSettingsDialogProps) {
  const [definitions, setDefinitions] = useState<Record<string, string>>(initialDefinitions);

  // Update local state when initial definitions change
  useEffect(() => {
    setDefinitions(initialDefinitions);
  }, [initialDefinitions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(definitions);
    onClose();
  };

  const handleChange = (column: string, value: string) => {
    setDefinitions({
      ...definitions,
      [column]: value,
    });
  };

  const handleReset = () => {
    // Reset all to default names
    const reset: Record<string, string> = {};
    for (let i = 1; i <= 24; i++) {
      reset[`user${i}`] = `User ${i}`;
    }
    setDefinitions(reset);
  };

  const inputClass = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500';
  const labelClass = 'text-xs font-medium text-gray-400 mb-1 w-16';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">User Column Definitions</h2>
          <p className="text-sm text-gray-400 mt-1">
            Customize the names of your 24 user-definable columns
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 24 }, (_, i) => {
                const columnKey = `user${i + 1}`;
                const defaultName = `User ${i + 1}`;
                const currentValue = definitions[columnKey] || defaultName;

                return (
                  <div key={columnKey} className="flex items-center gap-3">
                    <label className={labelClass}>
                      User {i + 1}:
                    </label>
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => handleChange(columnKey, e.target.value)}
                      className={inputClass}
                      placeholder={defaultName}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-gray-750 rounded border border-gray-600">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Examples:</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• User 1 → "Lamp Hours"</li>
                <li>• User 2 → "Serial Number"</li>
                <li>• User 3 → "Last Maintenance"</li>
                <li>• User 4 → "Owner"</li>
              </ul>
            </div>
          </div>

          {/* Footer - Buttons */}
          <div className="px-6 py-4 border-t border-gray-700 flex justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
            >
              Reset to Defaults
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
              >
                Save Definitions
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
