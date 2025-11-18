import { useEffect } from 'react';
import { useFileStore } from '../../store/fileStore';

interface FileMenuProps {
  className?: string;
}

export function FileMenu({ className = '' }: FileMenuProps) {
  const {
    isDirty,
    isSaving,
    isOpening,
    getCurrentFileName,
    newFile,
    openFile,
    saveFile,
    saveFileAs
  } = useFileStore();

  const currentFileName = getCurrentFileName();
  const isLoading = isSaving || isOpening;

  const handleNew = async () => {
    await newFile();
  };

  const handleOpen = async () => {
    await openFile();
  };

  const handleSave = async () => {
    await saveFile();
  };

  const handleSaveAs = async () => {
    await saveFileAs();
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
  }, [isDirty, isSaving, isOpening]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* File name display */}
      <div className="text-gray-300 font-medium px-3 py-1.5 bg-gray-800 rounded border border-gray-700">
        {currentFileName}
        {isDirty && <span className="text-yellow-500 ml-1">*</span>}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-700" />

      {/* File operation buttons */}
      <div className="flex gap-1">
        <button
          onClick={handleNew}
          disabled={isLoading}
          title="New Project (Cmd/Ctrl+N)"
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          New
        </button>

        <button
          onClick={handleOpen}
          disabled={isLoading}
          title="Open Project (Cmd/Ctrl+O)"
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOpening ? 'Opening...' : 'Open'}
        </button>

        <button
          onClick={handleSave}
          disabled={isLoading || !isDirty}
          title="Save Project (Cmd/Ctrl+S)"
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleSaveAs}
          disabled={isLoading}
          title="Save As... (Cmd/Ctrl+Shift+S)"
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save As...
        </button>
      </div>

      {/* Status indicator */}
      {isSaving && (
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          Saving...
        </div>
      )}

      {isOpening && (
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          Opening...
        </div>
      )}
    </div>
  );
}
