import { formatShortcut } from '../../../hooks/usePlatform';

interface ShortcutGroup {
  category: string;
  shortcuts: {
    keys: string; // Use "Mod" for modifier key (e.g., "Mod+S")
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    category: 'General',
    shortcuts: [
      { keys: 'Mod+K', description: 'Open command palette' },
      { keys: 'Mod+/', description: 'Show keyboard shortcuts' },
      { keys: 'Mod+S', description: 'Save template' },
      { keys: 'Mod+P', description: 'Toggle preview mode' },
      { keys: 'ESC', description: 'Deselect / Close' }
    ]
  },
  {
    category: 'Editing',
    shortcuts: [
      { keys: 'Mod+Z', description: 'Undo' },
      { keys: 'Mod+Shift+Z', description: 'Redo' },
      { keys: 'Mod+D', description: 'Duplicate element' },
      { keys: 'Delete', description: 'Delete selected element' },
      { keys: 'Backspace', description: 'Delete selected element' }
    ]
  },
  {
    category: 'Text Formatting',
    shortcuts: [
      { keys: 'Mod+B', description: 'Bold' },
      { keys: 'Mod+I', description: 'Italic' },
      { keys: 'Mod+U', description: 'Underline' },
      { keys: 'Mod+Shift+L', description: 'Align left' },
      { keys: 'Mod+Shift+E', description: 'Align center' },
      { keys: 'Mod+Shift+R', description: 'Align right' }
    ]
  },
  {
    category: 'Canvas',
    shortcuts: [
      { keys: 'Mod++', description: 'Zoom in' },
      { keys: 'Mod+-', description: 'Zoom out' },
      { keys: 'Mod+0', description: 'Reset zoom to 100%' },
      { keys: 'Mod+G', description: 'Toggle grid' },
      { keys: 'Mod+Shift+G', description: 'Toggle snap guides' }
    ]
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: '←/→/↑/↓', description: 'Move selected element (fine)' },
      { keys: 'Shift+←/→/↑/↓', description: 'Move selected element (coarse)' },
      { keys: 'Tab', description: 'Select next element' },
      { keys: 'Shift+Tab', description: 'Select previous element' }
    ]
  },
  {
    category: 'Element Creation (Quick Add)',
    shortcuts: [
      { keys: 'T', description: 'Add text element' },
      { keys: 'R', description: 'Add rectangle' },
      { keys: 'L', description: 'Add line' },
      { keys: 'I', description: 'Add image' },
      { keys: 'D', description: 'Add data field' }
    ]
  }
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="shortcuts-title" className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-400 mt-1">
                Master these shortcuts to work faster
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutGroups.map((group) => (
              <div key={group.category} className="space-y-3">
                {/* Category Title */}
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  {group.category}
                </h3>

                {/* Shortcuts List */}
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-750 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-sm text-gray-300">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {formatShortcut(shortcut.keys).split('+').map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            {keyIndex > 0 && (
                              <span className="text-gray-500 text-xs">+</span>
                            )}
                            <kbd className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono text-gray-300 shadow-sm">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Press <kbd className="px-2 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs font-mono">Cmd+/</kbd> anytime to view this help
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
