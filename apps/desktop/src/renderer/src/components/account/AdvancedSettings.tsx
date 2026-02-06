import { useState } from 'react';
import { Settings, BarChart, Beaker, Save } from 'lucide-react';

export function AdvancedSettings() {
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [betaFeatures, setBetaFeatures] = useState(false);

  const handleSave = () => console.log('Saving advanced settings...');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Advanced Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Telemetry and beta feature access</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Telemetry</span>
        </h3>

        <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Anonymous Usage Statistics
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Help improve ShowStack by sending anonymous usage data. This includes which features
              you use, performance metrics, and crash reports. No personal data or project content
              is collected.
            </p>
            <details className="text-xs text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer font-medium mb-2">What data is collected?</summary>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Feature usage frequency</li>
                <li>Application performance metrics</li>
                <li>Error and crash reports</li>
                <li>Operating system and version</li>
                <li>Application version</li>
              </ul>
            </details>
          </div>
          <label className="ml-4 relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={telemetryEnabled}
              onChange={(e) => setTelemetryEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Beaker className="w-5 h-5 text-purple-600" />
          <span>Beta Features</span>
        </h3>

        <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Early Access to New Features
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Get early access to new features before they're officially released. Beta features may
              be unstable or incomplete.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Beta features are experimental and may change or be removed
            </p>
          </div>
          <label className="ml-4 relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={betaFeatures}
              onChange={(e) => setBetaFeatures(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {betaFeatures && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Available Beta Features</h4>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                <span>AI-Powered Layout Suggestions (Coming Soon)</span>
              </li>
              <li className="flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                <span>Real-time Collaboration (Beta)</span>
              </li>
              <li className="flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                <span>Advanced Export Formats (Beta)</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white rounded-md transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
}
