import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '../../utils/logger';
import {
  Activity,
  Database,
  HardDrive,
  Cpu,
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface CheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: Record<string, unknown>;
}

interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: CheckResult;
    filesystem: CheckResult;
    memory: CheckResult;
    sync: CheckResult;
  };
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    label: 'Healthy',
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    label: 'Degraded',
  },
  unhealthy: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    label: 'Unhealthy',
  },
};

const checkIcons = {
  database: Database,
  filesystem: HardDrive,
  memory: Cpu,
  sync: Cloud,
};

const checkLabels = {
  database: 'Database',
  filesystem: 'Filesystem',
  memory: 'Memory',
  sync: 'Cloud Sync',
};

const HEALTH_CHECK_COOLDOWN_MS = 5000;

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function CheckCard({
  name,
  result,
}: {
  name: 'database' | 'filesystem' | 'memory' | 'sync';
  result: CheckResult;
}) {
  const Icon = checkIcons[name];
  const config = statusConfig[result.status];

  return (
    <div className={`rounded-lg border p-4 ${config.border} ${config.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <span className="font-medium text-gray-900 dark:text-white">{checkLabels[name]}</span>
        </div>
        <StatusBadge status={result.status} />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{result.message}</p>
      {result.details && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 font-mono">
          {Object.entries(result.details).map(([key, value]) => (
            <div key={key}>
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HealthPanel() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckRef = useRef<number>(0);

  const runHealthCheck = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheckRef.current < HEALTH_CHECK_COOLDOWN_MS) {
      return;
    }
    lastCheckRef.current = now;
    setIsChecking(true);
    try {
      const result = await window.api.health.check();
      setReport(result);
    } catch (error) {
      logger.error('Health check failed', error instanceof Error ? error : undefined);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Auto-run health check on mount
  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Check the health of application subsystems
            </p>
          </div>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={isChecking}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Run Health Check'}
        </button>
      </div>

      {/* Overall Status */}
      {report && (
        <div
          className={`rounded-lg border p-4 ${statusConfig[report.status].border} ${statusConfig[report.status].bg}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">Overall Status</span>
              <StatusBadge status={report.status} />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(report.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Individual Checks */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CheckCard name="database" result={report.checks.database} />
          <CheckCard name="filesystem" result={report.checks.filesystem} />
          <CheckCard name="memory" result={report.checks.memory} />
          <CheckCard name="sync" result={report.checks.sync} />
        </div>
      )}

      {/* Empty state */}
      {!report && !isChecking && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Click "Run Health Check" to check system health</p>
        </div>
      )}
    </div>
  );
}
