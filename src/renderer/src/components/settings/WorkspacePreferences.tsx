import { useState } from 'react';
import { Monitor, Grid, Ruler, Save } from 'lucide-react';

export function WorkspacePreferences() {
  const [defaultView, setDefaultView] = useState('projects');
  const [gridDisplay, setGridDisplay] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [units, setUnits] = useState('imperial');

  const handleSave = () => console.log('Saving workspace preferences...');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Workspace Preferences</h2>
        <p className="text-gray-600 dark:text-gray-400">Customize your workspace layout and default views</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Default View</span>
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Startup View
          </label>
          <select
            value={defaultView}
            onChange={(e) => setDefaultView(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="projects">Projects List</option>
            <option value="prep">Prep Module</option>
            <option value="designer">Layout Designer</option>
            <option value="last">Last Opened Project</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Which view opens when you start the application</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Grid className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Grid Settings</span>
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Show Grid</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Display grid lines in designer</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={gridDisplay} onChange={(e) => setGridDisplay(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Snap to Grid</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Automatically align elements to grid</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grid Size: {gridSize}px
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>5px</span>
              <span>25px</span>
              <span>50px</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Measurement Units</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setUnits('imperial')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              units === 'imperial'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900 dark:text-white mb-1">Imperial</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Feet, inches (ft, in)</div>
          </button>

          <button
            onClick={() => setUnits('metric')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              units === 'metric'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900 dark:text-white mb-1">Metric</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Meters, centimeters (m, cm)</div>
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium">
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
}
