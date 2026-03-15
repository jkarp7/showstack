import { useState } from 'react';
import { Settings, FolderOpen, FileText, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export function ApplicationSettings() {
  const adminConfig = useSettingsStore((state) => state.adminConfig);
  const updateAdminConfig = useSettingsStore((state) => state.updateAdminConfig);

  const [localConfig, setLocalConfig] = useState({ ...adminConfig });
  const [savedIndicator, setSavedIndicator] = useState(false);

  const handleSave = () => {
    updateAdminConfig(localConfig);
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2000);
  };

  const handleSelectExportPath = async () => {
    const result = await window.api.admin.selectFolder();
    if (!result.canceled && result.path) {
      setLocalConfig((prev) => ({ ...prev, defaultExportPath: result.path! }));
    }
  };

  const handleSelectProjectPath = async () => {
    const result = await window.api.admin.selectFolder();
    if (!result.canceled && result.path) {
      setLocalConfig((prev) => ({ ...prev, defaultProjectPath: result.path! }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Application Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure default paths, file naming, and auto-backup settings
        </p>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Settings Scope</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              These settings apply application-wide and affect all users. Changes take effect
              immediately after saving. Default paths will be set to the application installation
              directory when bundled.
            </p>
          </div>
        </div>
      </div>

      {/* Default Directories */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Default Directories</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Export Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localConfig.defaultExportPath}
                onChange={(e) =>
                  setLocalConfig((prev) => ({ ...prev, defaultExportPath: e.target.value }))
                }
                placeholder="/path/to/exports"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSelectExportPath}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                Browse
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Default location for exported layouts and files
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Project Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localConfig.defaultProjectPath}
                onChange={(e) =>
                  setLocalConfig((prev) => ({ ...prev, defaultProjectPath: e.target.value }))
                }
                placeholder="/path/to/projects"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSelectProjectPath}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                Browse
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Default location for saving new projects
            </p>
          </div>
        </div>
      </div>

      {/* File Naming */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>File Naming Conventions</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export File Name Pattern
            </label>
            <input
              type="text"
              value={localConfig.fileNamingPattern}
              onChange={(e) =>
                setLocalConfig((prev) => ({ ...prev, fileNamingPattern: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Available variables: {'{name}'}, {'{date}'}, {'{time}'}, {'{type}'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Example:{' '}
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                cover_layout_2024-12-01.json
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Auto-Backup Settings */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Auto-Backup Settings</span>
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Auto-Backup
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Automatically backup default layouts and settings
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.autoBackupEnabled}
                onChange={(e) =>
                  setLocalConfig((prev) => ({ ...prev, autoBackupEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        {savedIndicator && (
          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            Settings saved
          </span>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
}
