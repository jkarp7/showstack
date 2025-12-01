import { Shield, Download, Trash2, Save } from 'lucide-react';

export function DataPrivacy() {
  const handleExportData = () => console.log('Exporting user data...');
  const handleDeleteData = () => {
    if (confirm('Delete all user data? This cannot be undone.')) {
      console.log('Deleting user data...');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data & Privacy</h2>
        <p className="text-gray-600">Manage your data and privacy settings</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Your Data</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Export User Data</h4>
              <p className="text-sm text-gray-600">Download all your profile data, settings, and preferences</p>
            </div>
            <button onClick={handleExportData} className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Delete All Data</h4>
              <p className="text-sm text-gray-600">Permanently remove all your data from the application</p>
            </div>
            <button onClick={handleDeleteData} className="ml-4 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Data Retention</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Project History</div>
            <div className="text-lg font-semibold text-gray-900">90 days</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Audit Logs</div>
            <div className="text-lg font-semibold text-gray-900">90 days</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Backups</div>
            <div className="text-lg font-semibold text-gray-900">30 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
