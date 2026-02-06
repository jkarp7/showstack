import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface ConsentDialogProps {
  onClose: () => void;
}

/**
 * Telemetry Consent Dialog
 *
 * Shown on first launch to ask user for permission to collect
 * anonymous usage data and crash reports.
 */
export function ConsentDialog({ onClose }: ConsentDialogProps) {
  const updatePrivacy = useSettingsStore((state) => state.updatePrivacy);
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  const [crashReportsEnabled, setCrashReportsEnabled] = useState(false);

  const handleSave = () => {
    updatePrivacy({
      telemetryEnabled,
      crashReportsEnabled,
    });
    onClose();
  };

  const handleSkip = () => {
    // Keep default settings (disabled)
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Help Improve ShowStack</h2>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-6 space-y-4 overflow-y-auto flex-1">
          <p className="text-gray-700 dark:text-gray-300">
            We'd like to collect anonymous usage data to understand which features are most valuable
            and identify bugs. Your privacy is important to us.
          </p>

          {/* What we collect */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              ✅ What we collect:
            </h3>
            <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <li>• Which features you use</li>
              <li>• Error reports and crashes</li>
              <li>• Performance metrics (load times, rendering speed)</li>
              <li>• App version and operating system</li>
            </ul>
          </div>

          {/* What we don't collect */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
              ❌ What we DON'T collect:
            </h3>
            <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
              <li>• Your name or email address</li>
              <li>• Project content or data</li>
              <li>• Personal information</li>
              <li>• File names or paths</li>
            </ul>
          </div>

          {/* Privacy commitment */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🔒 Privacy Commitment:
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• All data is anonymous (no way to identify you)</li>
              <li>• Data is stored securely and never sold</li>
              <li>• You can opt-out anytime in Settings</li>
              <li>• You can export or delete your data anytime</li>
            </ul>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={telemetryEnabled}
                onChange={(e) => setTelemetryEnabled(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Enable anonymous analytics
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Help us understand which features are most useful
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={crashReportsEnabled}
                onChange={(e) => setCrashReportsEnabled(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Send crash reports
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically send crash reports to help us fix bugs faster
                </div>
              </div>
            </label>
          </div>

          {/* Learn more */}
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
            By enabling telemetry, you agree to our{' '}
            <a
              href="https://showstack.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Privacy Policy
            </a>
            . You can change these settings anytime in Settings → Privacy.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            Skip for now
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
