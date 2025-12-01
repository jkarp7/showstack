import { useState } from 'react';
import { Bell, Save } from 'lucide-react';

export function Notifications() {
  const [exportComplete, setExportComplete] = useState(true);
  const [validationWarnings, setValidationWarnings] = useState(true);
  const [changeDetection, setChangeDetection] = useState(false);
  const [updates, setUpdates] = useState(true);

  const handleSave = () => console.log('Saving notifications...');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Notifications</h2>
        <p className="text-gray-600 dark:text-gray-400">Control which notifications you receive</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-4">
          {[
            { label: 'Export Complete', desc: 'Notify when file exports finish', state: exportComplete, setState: setExportComplete },
            { label: 'Validation Warnings', desc: 'Alert on potential issues in layouts', state: validationWarnings, setState: setValidationWarnings },
            { label: 'Change Detection', desc: 'Notify when equipment changes between revisions', state: changeDetection, setState: setChangeDetection },
            { label: 'App Updates', desc: 'Notify about new versions and features', state: updates, setState: setUpdates }
          ].map(({ label, desc, state, setState }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
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
