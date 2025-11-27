import { useState } from 'react';

interface ConflictInfo {
  existingProject: {
    id: string;
    name: string;
    updated_at: number;
  };
  importedProject: {
    id: string;
    name: string;
    updated_at: number;
  };
}

interface ImportConflictDialogProps {
  isOpen: boolean;
  conflict: ConflictInfo;
  filePath: string;
  onResolve: (action: 'replace' | 'keep-both' | 'cancel') => void;
}

export function ImportConflictDialog({ isOpen, conflict, filePath, onResolve }: ImportConflictDialogProps) {
  const [selectedAction, setSelectedAction] = useState<'replace' | 'keep-both'>('replace');

  if (!isOpen) return null;

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleImport = () => {
    onResolve(selectedAction);
  };

  const handleCancel = () => {
    onResolve('cancel');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Project Already Exists</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-gray-300 text-sm">
            The project <span className="font-semibold text-white">"{conflict.importedProject.name}"</span> already exists in your database.
          </p>

          {/* Version Comparison */}
          <div className="bg-gray-900 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Your Version</div>
              <div className="text-sm text-gray-300">
                <div className="font-medium">{conflict.existingProject.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Last modified: {formatDate(conflict.existingProject.updated_at)}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-3">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Imported Version</div>
              <div className="text-sm text-gray-300">
                <div className="font-medium">{conflict.importedProject.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Last modified: {formatDate(conflict.importedProject.updated_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">What would you like to do?</p>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition">
              <input
                type="radio"
                name="action"
                value="replace"
                checked={selectedAction === 'replace'}
                onChange={(e) => setSelectedAction(e.target.value as 'replace')}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Replace</div>
                <div className="text-xs text-gray-400 mt-1">
                  Overwrite your existing project with the imported version
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition">
              <input
                type="radio"
                name="action"
                value="keep-both"
                checked={selectedAction === 'keep-both'}
                onChange={(e) => setSelectedAction(e.target.value as 'keep-both')}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Keep Both</div>
                <div className="text-xs text-gray-400 mt-1">
                  Import as a separate project (e.g., "{conflict.importedProject.name} (2)")
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
