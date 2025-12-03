import { useState } from 'react';
import { FileText, Download, Trash2, Filter, Calendar, AlertCircle } from 'lucide-react';

type LogLevel = 'all' | 'info' | 'warning' | 'error';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  action: string;
  user: string;
  details: string;
}

export function AuditLogging() {
  const [logLevel, setLogLevel] = useState<LogLevel>('all');
  const [dateRange, setDateRange] = useState('7days');
  const [logs, setLogs] = useState<LogEntry[]>([
    // Mock data - will be replaced with real logs
    {
      id: '1',
      timestamp: Date.now() - 3600000,
      level: 'info',
      action: 'Layout Exported',
      user: 'Admin',
      details: 'Exported "Cover Page - ShowStack Default" to JSON'
    },
    {
      id: '2',
      timestamp: Date.now() - 7200000,
      level: 'info',
      action: 'Settings Changed',
      user: 'Admin',
      details: 'Updated application settings'
    },
    {
      id: '3',
      timestamp: Date.now() - 10800000,
      level: 'warning',
      action: 'Import Warning',
      user: 'Admin',
      details: 'Layout import had 2 validation warnings'
    }
  ]);

  const handleExportLogs = async () => {
    // TODO: Implement export
    console.log('Exporting logs...');
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      return;
    }
    setLogs([]);
    // TODO: Implement clear logs
    console.log('Clearing logs...');
  };

  const filteredLogs = logs.filter(log =>
    logLevel === 'all' || log.level === logLevel
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Audit & Logging</h2>
        <p className="text-gray-600">Track system activities, changes, and access logs</p>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Audit Log Retention</h4>
            <p className="text-sm text-blue-800">
              Audit logs are retained for 90 days by default. Export logs regularly if you need longer retention.
              Clearing logs will permanently remove all entries and cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Log Level Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value as LogLevel)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warnings</option>
                <option value="error">Errors</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="24hours">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Activity Log</span>
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'})
            </span>
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No log entries found</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <span className="text-sm text-gray-500">by {log.user}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                    <p className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          <span>Export History</span>
        </h3>

        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Layout Templates Export</div>
              <div className="text-sm text-gray-500">December 1, 2024 at 10:30 AM</div>
            </div>
            <span className="text-sm text-gray-600">/exports/layouts_2024-12-01.json</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Database Backup</div>
              <div className="text-sm text-gray-500">November 30, 2024 at 6:00 PM</div>
            </div>
            <span className="text-sm text-gray-600">/backups/app_2024-11-30.db</span>
          </div>
        </div>
      </div>
    </div>
  );
}
