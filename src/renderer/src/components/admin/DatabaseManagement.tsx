import { useState } from 'react';
import { Database, HardDrive, Download, Upload, RefreshCw, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

export function DatabaseManagement() {
  const [dbSize, setDbSize] = useState('0 MB');
  const [lastBackup, setLastBackup] = useState('Never');
  const [isWorking, setIsWorking] = useState(false);

  const handleVacuum = async () => {
    setIsWorking(true);
    // TODO: Implement vacuum
    console.log('Vacuuming database...');
    setTimeout(() => setIsWorking(false), 1000);
  };

  const handleBackup = async () => {
    setIsWorking(true);
    // TODO: Implement backup
    console.log('Creating backup...');
    setTimeout(() => setIsWorking(false), 1000);
  };

  const handleRestore = async () => {
    setIsWorking(true);
    // TODO: Implement restore
    console.log('Restoring from backup...');
    setTimeout(() => setIsWorking(false), 1000);
  };

  const handleIntegrityCheck = async () => {
    setIsWorking(true);
    // TODO: Implement integrity check
    console.log('Checking integrity...');
    setTimeout(() => setIsWorking(false), 1000);
  };

  const handleCleanupOldData = async () => {
    if (!confirm('Are you sure you want to cleanup old data? This action cannot be undone.')) {
      return;
    }
    setIsWorking(true);
    // TODO: Implement cleanup
    console.log('Cleaning up old data...');
    setTimeout(() => setIsWorking(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Management</h2>
        <p className="text-gray-600">Maintain, backup, and optimize application database</p>
      </div>

      {/* Database Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-600" />
          <span>Database Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Database Size</div>
            <div className="text-2xl font-bold text-gray-900">{dbSize}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Last Backup</div>
            <div className="text-2xl font-bold text-gray-900">{lastBackup}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-green-600">Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span>Backup & Restore</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Create Backup</h4>
              <p className="text-sm text-gray-600">
                Export a complete backup of the application database including all settings and templates
              </p>
            </div>
            <button
              onClick={handleBackup}
              disabled={isWorking}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Backup</span>
            </button>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Restore from Backup</h4>
              <p className="text-sm text-gray-600">
                Import and restore database from a previous backup file
              </p>
            </div>
            <button
              onClick={handleRestore}
              disabled={isWorking}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              <span>Restore</span>
            </button>
          </div>
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          <span>Database Maintenance</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Vacuum Database</h4>
              <p className="text-sm text-gray-600">
                Optimize and reclaim unused space. Recommended after large deletions.
              </p>
            </div>
            <button
              onClick={handleVacuum}
              disabled={isWorking}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Vacuum</span>
            </button>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Data Integrity Check</h4>
              <p className="text-sm text-gray-600">
                Verify database integrity and detect potential corruption
              </p>
            </div>
            <button
              onClick={handleIntegrityCheck}
              disabled={isWorking}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Check</span>
            </button>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Cleanup Old Data</h4>
              <p className="text-sm text-gray-600">
                Remove orphaned records and temporary data
              </p>
            </div>
            <button
              onClick={handleCleanupOldData}
              disabled={isWorking}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Cleanup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">Important Safety Information</h4>
            <p className="text-sm text-amber-800">
              Always create a backup before performing maintenance operations or restoring from a backup file.
              These operations can significantly impact your data and should be performed with caution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
