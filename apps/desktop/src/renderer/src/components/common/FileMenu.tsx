import { useEffect, useState } from 'react';
import { useFileStore } from '../../store/fileStore';
import { logger } from '../../utils/logger';

interface FileMenuProps {
  className?: string;
  onDataReload?: () => Promise<void>;
  projectName?: string;
  currentProjectId?: string;
}

export function FileMenu({ className = '', onDataReload, projectName, currentProjectId }: FileMenuProps) {
  const {
    isDirty,
    isSaving,
    isOpening,
    getCurrentFileName,
    newFile,
    openFile,
    saveFile,
    saveFileAs,
  } = useFileStore();
  const [isCopying, setIsCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  // Use projectName prop if provided, otherwise fall back to file store
  const currentFileName = projectName || getCurrentFileName();
  const isLoading = isSaving || isOpening;

  const handleNew = async () => {
    await newFile(onDataReload);
  };

  const handleOpen = async () => {
    await openFile(onDataReload);
  };

  const handleSave = async () => {
    await saveFile();
  };

  const handleSaveAs = async () => {
    await saveFileAs(projectName, onDataReload);
  };

  const handleSaveAsCopy = async () => {
    if (!currentProjectId || isCopying) return;

    try {
      setIsCopying(true);
      setCopyMessage(null);
      const copy = await window.api.projects.createCopy(currentProjectId);
      setCopyMessage(`Copy created: "${copy.name}"`);
      // Auto-dismiss after 4 seconds
      setTimeout(() => setCopyMessage(null), 4000);
      if (onDataReload) {
        await onDataReload();
      }
    } catch (error) {
      logger.error('Failed to save as copy:', error);
      setCopyMessage('Failed to create copy');
      setTimeout(() => setCopyMessage(null), 3000);
    } finally {
      setIsCopying(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+N - New
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleNew();
      }
      // Cmd/Ctrl+O - Open
      else if ((e.metaKey || e.ctrlKey) && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        handleOpen();
      }
      // Cmd/Ctrl+Shift+S - Save As
      else if ((e.metaKey || e.ctrlKey) && e.key === 's' && e.shiftKey) {
        e.preventDefault();
        handleSaveAs();
      }
      // Cmd/Ctrl+S - Save
      else if ((e.metaKey || e.ctrlKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNew, handleOpen, handleSave, handleSaveAs]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* File name display */}
      <div className="text-gray-900 dark:text-gray-300 font-medium px-3 py-1.5 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
        {currentFileName}
        {isDirty && <span className="text-yellow-600 dark:text-yellow-500 ml-1">*</span>}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />

      {/* File operation buttons */}
      <div className="flex gap-1">
        <button
          onClick={handleNew}
          disabled={isLoading}
          title="New Project (Cmd/Ctrl+N)"
          className="px-3 py-1.5 text-sm bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          New
        </button>

        <button
          onClick={handleOpen}
          disabled={isLoading}
          title="Open Project (Cmd/Ctrl+O)"
          className="px-3 py-1.5 text-sm bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOpening ? 'Opening...' : 'Open'}
        </button>

        <button
          onClick={handleSave}
          disabled={isLoading || !isDirty}
          title="Save Project (Cmd/Ctrl+S)"
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleSaveAs}
          disabled={isLoading}
          title="Save As... (Cmd/Ctrl+Shift+S)"
          className="px-3 py-1.5 text-sm bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save As...
        </button>

        {currentProjectId && (
          <button
            onClick={handleSaveAsCopy}
            disabled={isLoading || isCopying}
            title="Save as Copy — creates a new timestamped version in the same family"
            className="px-3 py-1.5 text-sm bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCopying ? 'Copying...' : 'Save as Copy'}
          </button>
        )}
      </div>

      {/* Copy status message */}
      {copyMessage && (
        <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
          <span>✓</span>
          <span>{copyMessage}</span>
        </div>
      )}

      {/* Status indicator */}
      {isSaving && (
        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          Saving...
        </div>
      )}

      {isOpening && (
        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          Opening...
        </div>
      )}
    </div>
  );
}
