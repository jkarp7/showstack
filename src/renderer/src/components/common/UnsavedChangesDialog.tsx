import { useEffect, useState } from 'react';
import { useFileStore } from '../../store/fileStore';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  action: 'open' | 'new' | 'close';
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  action,
  onSave,
  onDiscard,
  onCancel
}: UnsavedChangesDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const currentFileName = useFileStore((state) => state.getCurrentFileName());

  const actionText = {
    open: 'opening another file',
    new: 'creating a new project',
    close: 'closing'
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Unsaved Changes</h2>

        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            Do you want to save changes to <span className="font-medium text-white">"{currentFileName}"</span> before {actionText[action]}?
          </p>
          <p className="text-sm text-gray-400 mt-3">
            Your changes will be lost if you don't save them.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Don't Save
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage the unsaved changes dialog globally
 * This listens to custom events dispatched by the file store
 */
export function useUnsavedChangesDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    action: 'open' | 'new' | 'close';
    onSave: () => void | Promise<void>;
    onDiscard: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    action: 'close',
    onSave: () => {},
    onDiscard: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { action, onSave, onDiscard, onCancel } = customEvent.detail;

      setDialogState({
        isOpen: true,
        action,
        onSave: async () => {
          await onSave();
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        },
        onDiscard: () => {
          onDiscard();
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        },
        onCancel: () => {
          onCancel();
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        }
      });
    };

    window.addEventListener('showUnsavedChangesDialog', handler);
    return () => window.removeEventListener('showUnsavedChangesDialog', handler);
  }, []);

  return dialogState;
}
