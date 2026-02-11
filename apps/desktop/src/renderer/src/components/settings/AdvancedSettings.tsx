import { Sliders, Code, Zap, Save } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { logger } from '../../utils/logger';

export function AdvancedSettings() {
  const advanced = useSettingsStore((state) => state.advanced);
  const updateAdvanced = useSettingsStore((state) => state.updateAdvanced);

  const handleDeveloperModeToggle = async (enabled: boolean) => {
    updateAdvanced({ developerMode: enabled });

    // Notify main process to open/close DevTools
    if (window.api?.settings?.developerModeChanged) {
      await window.api.settings.developerModeChanged(enabled);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Advanced Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Developer mode and performance tuning</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Developer Mode</span>
        </h3>

        <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Enable Developer Tools
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Access debugging tools, inspect element, and view console logs
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ For advanced users only - may impact performance
            </p>
          </div>
          <label className="ml-4 relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={advanced.developerMode}
              onChange={(e) => handleDeveloperModeToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {advanced.developerMode && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
              Developer Tools Active
            </h4>
            <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Press F12 to open DevTools</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Right-click elements to inspect</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Console logging enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>All experimental features unlocked</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Warning - Now at top */}
      <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-1">
              Performance Impact
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Changes to these settings may require an application restart to take full effect.
              Higher memory and cache limits improve performance but use more system resources.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Performance Tuning</span>
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Memory Limit: {advanced.memoryLimit} MB
            </label>
            <input
              type="range"
              min="1024"
              max="8192"
              step="512"
              value={advanced.memoryLimit}
              onChange={(e) => updateAdvanced({ memoryLimit: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1 GB</span>
              <span>4 GB</span>
              <span>8 GB</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Controls:</strong> Maximum RAM the application can use. Higher values allow
              working with larger projects and more assets simultaneously. Increase if you
              experience slowdowns with complex projects.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cache Size: {advanced.cacheSize} MB
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={advanced.cacheSize}
              onChange={(e) => updateAdvanced({ cacheSize: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>100 MB</span>
              <span>1 GB</span>
              <span>2 GB</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Controls:</strong> Disk space for caching rendered layouts, images, and
              project assets. Larger cache reduces re-rendering time. Increase for faster
              performance when working with many projects.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Render Quality
            </label>
            <select
              value={advanced.renderQuality}
              onChange={(e) => updateAdvanced({ renderQuality: e.target.value as any })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low (Faster)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Better Quality)</option>
              <option value="ultra">Ultra (Best Quality)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Controls:</strong> Visual quality of layout rendering and PDF exports. Higher
              quality produces sharper text and graphics but requires more processing power. Use
              "Low" for better performance on slower systems.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => logger.info('Save')}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
}
