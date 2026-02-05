import { Shield, Download, Trash2, Eye, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { telemetry } from '../../services/telemetry';
import { useState } from 'react';

export function PrivacySettings() {
  const privacy = useSettingsStore((state) => state.privacy);
  const updatePrivacy = useSettingsStore((state) => state.updatePrivacy);
  const [stats, setStats] = useState(telemetry.getStats());

  const handleTelemetryToggle = async (enabled: boolean) => {
    updatePrivacy({ telemetryEnabled: enabled });

    // Notify main process about developer mode change if DevTools should be affected
    if (window.api?.settings?.developerModeChanged) {
      await window.api.settings.developerModeChanged(enabled);
    }
  };

  const handleExportData = () => {
    const data = telemetry.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `showstack-telemetry-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all local telemetry data? This cannot be undone.')) {
      await telemetry.clearLocalData();
      setStats(telemetry.getStats());
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Privacy & Data</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Control what data we collect and how it's used
        </p>
      </div>

      {/* Telemetry Settings */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Anonymous Analytics</span>
        </h3>

        <div className="space-y-4">
          {/* Telemetry Toggle */}
          <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Enable Telemetry
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Help us improve ShowStack by sending anonymous usage data
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                We collect: feature usage, performance metrics, error reports
              </p>
            </div>
            <label className="ml-4 relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.telemetryEnabled}
                onChange={(e) => handleTelemetryToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Crash Reports Toggle */}
          <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Send Crash Reports
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Automatically send crash reports to help us fix bugs faster
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Includes: error messages, stack traces, app state (no personal data)
              </p>
            </div>
            <label className="ml-4 relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.crashReportsEnabled}
                onChange={(e) => updatePrivacy({ crashReportsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-600 dark:text-purple-500" />
          <span>Your Data</span>
        </h3>

        <div className="space-y-4">
          {/* Anonymous ID */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Anonymous ID
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              This unique identifier is used to track your usage without revealing your identity
            </p>
            <code className="block p-2 bg-gray-200 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {privacy.anonymousId}
            </code>
          </div>

          {/* Data Statistics */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Local Data Statistics
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.synced}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Synced</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.unsynced}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
              </div>
            </div>
            {stats.oldestEvent && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 text-center">
                Oldest event: {stats.oldestEvent.toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Data Retention */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Data Retention
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Local telemetry data is automatically deleted after
            </p>
            <select
              value={privacy.dataRetentionDays}
              onChange={(e) => updatePrivacy({ dataRetentionDays: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
          <span>Data Management</span>
        </h3>

        <div className="space-y-3">
          {/* Export Data */}
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  Export Your Data
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Download all telemetry data as JSON
                </div>
              </div>
            </div>
            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              Download
            </span>
          </button>

          {/* Clear Data */}
          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div className="text-left">
                <div className="font-medium text-red-900 dark:text-red-100">
                  Clear All Data
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Permanently delete all local telemetry data
                </div>
              </div>
            </div>
            <span className="text-red-600 dark:text-red-400 text-sm font-medium">
              Delete
            </span>
          </button>
        </div>
      </div>

      {/* Privacy Policy Link */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Your Privacy Matters
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              We take your privacy seriously. All telemetry is anonymous and never includes
              personal information or project content.
            </p>
            <a
              href="https://showstack.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Read our Privacy Policy →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
