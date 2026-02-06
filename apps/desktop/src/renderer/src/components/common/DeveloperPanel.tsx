import { Code, X } from 'lucide-react';
import { useState } from 'react';
import { useDeveloperMode } from '../../hooks/useDeveloperMode';

interface DeveloperPanelProps {
  title: string;
  data?: Record<string, any>;
  metrics?: Record<string, any>;
  children?: React.ReactNode;
}

/**
 * Developer Panel Component
 *
 * Displays debugging information, state inspection, and performance metrics
 * when developer mode is enabled.
 */
export function DeveloperPanel({ title, data, metrics, children }: DeveloperPanelProps) {
  const isDeveloperMode = useDeveloperMode();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isDeveloperMode) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-2xl z-40">
      <div className="bg-purple-900 text-white rounded-lg shadow-2xl overflow-hidden border-2 border-purple-600">
        {/* Header */}
        <div className="bg-purple-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            <span className="font-mono text-sm font-bold">{title}</span>
            <span className="text-xs bg-purple-700 px-2 py-0.5 rounded">DEV MODE</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-purple-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-purple-700 transition-colors"
            >
              {isCollapsed ? 'Expand' : 'Collapse'}
            </button>
            <button
              onClick={() => {
                /* Could add close functionality */
              }}
              className="text-purple-200 hover:text-white p-1 rounded hover:bg-purple-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="p-4 max-h-96 overflow-y-auto bg-purple-950/50">
            {/* Performance Metrics */}
            {metrics && Object.keys(metrics).length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-purple-200 mb-2">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(metrics).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-purple-900/50 px-3 py-2 rounded border border-purple-700"
                    >
                      <div className="text-xs text-purple-300">{key}</div>
                      <div className="font-mono text-sm text-white">
                        {typeof value === 'number' ? value.toFixed(2) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Inspector */}
            {data && Object.keys(data).length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-purple-200 mb-2">State Inspector</h3>
                <pre className="bg-purple-900/50 p-3 rounded border border-purple-700 text-xs font-mono text-purple-100 overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}

            {/* Custom Content */}
            {children && (
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-purple-200 mb-2">Debug Info</h3>
                <div className="bg-purple-900/50 p-3 rounded border border-purple-700 text-sm text-purple-100">
                  {children}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-purple-700 flex gap-2">
              <button
                onClick={() => {
                  if (data) {
                    console.log(`[${title}] State:`, data);
                  }
                  if (metrics) {
                    console.log(`[${title}] Metrics:`, metrics);
                  }
                }}
                className="text-xs px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded transition-colors"
              >
                Log to Console
              </button>
              <button
                onClick={() => {
                  const debugData = { title, data, metrics };
                  const blob = new Blob([JSON.stringify(debugData, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `debug-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded transition-colors"
              >
                Export Debug Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
