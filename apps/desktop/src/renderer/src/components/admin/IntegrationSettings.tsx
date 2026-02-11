import { useState } from 'react';
import { Link2, Cloud, FileText, Save, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { logger } from '../../utils/logger';

export function IntegrationSettings() {
  const [cloudStorageEnabled, setCloudStorageEnabled] = useState(false);
  const [cloudProvider, setCloudProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'testing'
  >('disconnected');

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    // TODO: Implement connection test
    logger.info('Testing connection...');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1500);
  };

  const handleSave = async () => {
    // TODO: Implement save
    logger.info('Saving integration settings...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Integration Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure external integrations and API connections
        </p>
      </div>

      {/* Cloud Storage Integration */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Cloud Storage Integration</span>
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Cloud Storage
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sync backups and exports to cloud storage automatically
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cloudStorageEnabled}
                onChange={(e) => setCloudStorageEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {cloudStorageEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cloud Provider
                </label>
                <select
                  value={cloudProvider}
                  onChange={(e) => setCloudProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a provider</option>
                  <option value="dropbox">Dropbox</option>
                  <option value="google-drive">Google Drive</option>
                  <option value="onedrive">OneDrive</option>
                  <option value="s3">Amazon S3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key / Access Token
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key or access token"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your credentials are stored securely and encrypted
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={connectionStatus === 'testing'}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  <Link2 className="w-4 h-4" />
                  <span>{connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
                </button>

                {connectionStatus === 'connected' && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                )}

                {connectionStatus === 'disconnected' && apiKey && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Not Connected</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Export Formats */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Export Format Support</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">JSON</span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">JSON Format</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Default export format for layouts
                </div>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
              Enabled
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">XML</span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">XML Format</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Legacy format support
                </div>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
              Coming Soon
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">CSV</span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">CSV Format</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Data export for spreadsheets
                </div>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* API Settings */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>API Configuration</span>
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">API Access</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  REST API endpoints for external integrations are currently in development. Contact
                  support for early access to the API beta program.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">API Version</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">v1.0 (Beta)</div>
            </div>
            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rate Limit</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                1000 req/hour
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
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
