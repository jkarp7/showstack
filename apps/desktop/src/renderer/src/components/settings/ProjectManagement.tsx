import { FolderOpen, Clock, Archive, Save } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { logger } from '../../utils/logger';

export function ProjectManagement() {
  const projectManagement = useSettingsStore((state) => state.projectManagement);
  const updateProjectManagement = useSettingsStore((state) => state.updateProjectManagement);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Project Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Organize and manage your projects</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Recent Projects</span>
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Show {projectManagement.showRecentCount} recent projects
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={projectManagement.showRecentCount}
            onChange={(e) => updateProjectManagement({ showRecentCount: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>5</span>
            <span>50</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Recent Projects List
          </h4>
          <div className="space-y-2">
            {['The Phantom of the Opera', 'Hamilton', 'Wicked'].map((project, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                  <span className="text-sm text-gray-900 dark:text-white">{project}</span>
                </div>
                <button className="text-xs text-blue-600 dark:text-blue-500 hover:text-blue-700">
                  Pin
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Archive className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Auto-Archive</span>
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Enable Auto-Archive</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Automatically archive old projects
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={projectManagement.autoArchive}
                onChange={(e) => updateProjectManagement({ autoArchive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {projectManagement.autoArchive && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Archive after {projectManagement.archiveDays} days of inactivity
              </label>
              <input
                type="number"
                value={projectManagement.archiveDays}
                onChange={(e) => updateProjectManagement({ archiveDays: parseInt(e.target.value) })}
                min="30"
                max="365"
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
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
