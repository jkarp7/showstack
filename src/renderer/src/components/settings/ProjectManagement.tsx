import { useState } from 'react';
import { FolderOpen, Clock, Archive, Save } from 'lucide-react';

export function ProjectManagement() {
  const [showRecent, setShowRecent] = useState(10);
  const [autoArchive, setAutoArchive] = useState(false);
  const [archiveDays, setArchiveDays] = useState(90);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Management</h2>
        <p className="text-gray-600">Organize and manage your projects</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Recent Projects</span>
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Show {showRecent} recent projects
          </label>
          <input type="range" min="5" max="50" step="5" value={showRecent} onChange={(e) => setShowRecent(parseInt(e.target.value))} className="w-full" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5</span>
            <span>50</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Projects List</h4>
          <div className="space-y-2">
            {['The Phantom of the Opera', 'Hamilton', 'Wicked'].map((project, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-900">{project}</span>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700">Pin</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Archive className="w-5 h-5 text-blue-600" />
          <span>Auto-Archive</span>
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Enable Auto-Archive</div>
              <div className="text-sm text-gray-500">Automatically archive old projects</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={autoArchive} onChange={(e) => setAutoArchive(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {autoArchive && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archive after {archiveDays} days of inactivity
              </label>
              <input type="number" value={archiveDays} onChange={(e) => setArchiveDays(parseInt(e.target.value))} min="30" max="365" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
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
