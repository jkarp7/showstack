import { useState } from 'react';
import { Edit3, Save, RotateCcw, Keyboard } from 'lucide-react';

export function EditorSettings() {
  const [autoSaveInterval, setAutoSaveInterval] = useState(30);
  const [undoDepth, setUndoDepth] = useState(50);
  const [showToolbar, setShowToolbar] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Editor Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure layout editor behavior and tools</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Save className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Auto-Save</span>
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Auto-save interval: {autoSaveInterval} seconds
          </label>
          <input type="range" min="10" max="300" step="10" value={autoSaveInterval} onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))} className="w-full" />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>10s</span>
            <span>5 min</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Undo History</span>
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Undo depth: {undoDepth} steps
          </label>
          <input type="range" min="10" max="200" step="10" value={undoDepth} onChange={(e) => setUndoDepth(parseInt(e.target.value))} className="w-full" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">More steps use more memory</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Toolbar</span>
        </h3>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">Show Toolbar</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Display toolbar in editor</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={showToolbar} onChange={(e) => setShowToolbar(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Keyboard Shortcuts</span>
        </h3>
        <div className="space-y-2">
          {[
            { action: 'Save', shortcut: 'Ctrl+S' },
            { action: 'Undo', shortcut: 'Ctrl+Z' },
            { action: 'Redo', shortcut: 'Ctrl+Y' },
            { action: 'Delete Element', shortcut: 'Delete' },
            { action: 'Duplicate', shortcut: 'Ctrl+D' },
            { action: 'Select All', shortcut: 'Ctrl+A' }
          ].map(({ action, shortcut }) => (
            <div key={action} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 rounded text-xs font-mono">{shortcut}</kbd>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => console.log('Save')} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium">
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
}
