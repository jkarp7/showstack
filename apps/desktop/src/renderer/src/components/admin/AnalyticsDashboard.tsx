import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Activity, Download, Trash2 } from 'lucide-react';
import { telemetry } from '../../services/telemetry';

/**
 * Analytics Dashboard Component
 *
 * Displays telemetry statistics and event summaries for admins.
 * Shows usage patterns, feature adoption, and performance metrics.
 */
export function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    synced: 0,
    unsynced: 0,
    oldestEvent: null as Date | null,
  });

  const [eventData, setEventData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadEventData();
  }, []);

  const loadStats = () => {
    const telemetryStats = telemetry.getStats();
    setStats(telemetryStats);
  };

  const loadEventData = () => {
    const events = telemetry.exportData();
    setEventData(events);
  };

  const handleExport = () => {
    try {
      const events = telemetry.exportData();
      const dataStr = JSON.stringify(events, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `telemetry-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export telemetry data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all local telemetry data? This cannot be undone.')) {
      try {
        await telemetry.clearLocalData();
        loadStats();
        loadEventData();
        alert('Telemetry data cleared successfully.');
      } catch (error) {
        console.error('Failed to clear telemetry data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  // Calculate event type distribution
  const eventTypeCounts = eventData.reduce((acc, event) => {
    acc[event.event] = (acc[event.event] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topEvents = Object.entries(eventTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Calculate feature usage
  const featureEvents = eventData.filter(e => e.event === 'feature_used');
  const featureCounts = featureEvents.reduce((acc, event) => {
    const feature = event.properties?.feature || 'Unknown';
    acc[feature] = (acc[feature] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topFeatures = Object.entries(featureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Calculate performance metrics
  const perfEvents = eventData.filter(e => e.event === 'performance_metric');
  const avgPerformance = perfEvents.length > 0
    ? perfEvents.reduce((acc, e) => acc + (e.properties?.value || 0), 0) / perfEvents.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View telemetry statistics and usage patterns
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            aria-label="Export telemetry data as JSON file"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button
            onClick={handleClear}
            aria-label="Clear all local telemetry data"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Events
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Synced Events
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.synced}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Events
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.unsynced}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Oldest Event
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {stats.oldestEvent
                  ? new Date(stats.oldestEvent).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Events */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Events
        </h3>
        {topEvents.length > 0 ? (
          <div className="space-y-3">
            {topEvents.map(([event, count]) => (
              <div key={event} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{event}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(count / topEvents[0][1]) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No events recorded yet</p>
        )}
      </div>

      {/* Feature Usage */}
      {topFeatures.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Features
          </h3>
          <div className="space-y-3">
            {topFeatures.map(([feature, count]) => (
              <div key={feature} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(count / topFeatures[0][1]) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {perfEvents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Average Performance
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgPerformance.toFixed(2)} ms
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Metrics Recorded
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {perfEvents.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
