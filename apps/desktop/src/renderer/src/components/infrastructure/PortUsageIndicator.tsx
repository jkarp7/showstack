import { useEffect, useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';

export interface PortUsageStats {
  total_ports: number;
  used_ports: number;
  available_ports: number;
  usage_percentage: number;
  by_status: {
    active: number;
    inactive: number;
    error: number;
    unassigned: number;
  };
}

interface PortUsageIndicatorProps {
  equipmentId: string;
  compact?: boolean; // Show compact version
  showDetails?: boolean; // Show detailed breakdown
}

export function PortUsageIndicator({ equipmentId, compact = false, showDetails = true }: PortUsageIndicatorProps) {
  const [stats, setStats] = useState<PortUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [equipmentId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const portStats = await window.api.infrastructure.getPortUsageStats(equipmentId);
      setStats(portStats);
    } catch (error) {
      console.error('Error loading port usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Loading stats...
      </div>
    );
  }

  if (stats.total_ports === 0) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        No ports configured
      </div>
    );
  }

  const getUsageColor = () => {
    if (stats.usage_percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (stats.usage_percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getUsageBarColor = () => {
    if (stats.usage_percentage >= 90) return 'bg-red-500';
    if (stats.usage_percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Activity className={`w-4 h-4 ${getUsageColor()}`} />
        <span className="text-xs text-gray-900 dark:text-white">
          {stats.used_ports}/{stats.total_ports} ports
        </span>
        <span className={`text-xs font-medium ${getUsageColor()}`}>
          ({stats.usage_percentage}%)
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Usage Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Port Usage
            </span>
            <span className={`text-xs font-medium ${getUsageColor()}`}>
              {stats.usage_percentage}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getUsageBarColor()} transition-all duration-300`}
              style={{ width: `${stats.usage_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-700 dark:text-gray-300">
            {stats.used_ports} used
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="text-gray-700 dark:text-gray-300">
            {stats.available_ports} available
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 dark:text-gray-400">
            Total: {stats.total_ports}
          </span>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status Breakdown
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {stats.by_status.active > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {stats.by_status.active}
                </span>
              </div>
            )}
            {stats.by_status.inactive > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Inactive:</span>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  {stats.by_status.inactive}
                </span>
              </div>
            )}
            {stats.by_status.error > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Error:</span>
                <span className="font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {stats.by_status.error}
                </span>
              </div>
            )}
            {stats.by_status.unassigned > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Unassigned:</span>
                <span className="font-medium text-gray-500 dark:text-gray-400">
                  {stats.by_status.unassigned}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning for high usage */}
      {stats.usage_percentage >= 90 && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1.5 rounded">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Port capacity is critically high ({stats.usage_percentage}%)</span>
        </div>
      )}
    </div>
  );
}
