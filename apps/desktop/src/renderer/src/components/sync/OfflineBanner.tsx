/**
 * Offline Banner Component
 *
 * Displays a dismissible warning banner when the app is offline.
 * Shows pending changes count and reconnection status.
 */

import { useState, useEffect } from 'react';
import { WifiOff, X, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function OfflineBanner() {
  const { isAuthenticated, syncStatus, isCloudConfigured } = useAuthStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Reset dismissed state when coming back online
  useEffect(() => {
    if (syncStatus.state === 'connected') {
      setIsDismissed(false);
      setIsReconnecting(false);
    }
  }, [syncStatus.state]);

  // Don't show if:
  // - Cloud not configured
  // - Not authenticated
  // - User dismissed the banner
  // - Not in an offline/error state
  if (
    !isCloudConfigured ||
    !isAuthenticated ||
    isDismissed ||
    (syncStatus.state !== 'disconnected' && syncStatus.state !== 'error')
  ) {
    return null;
  }

  const handleRetry = async () => {
    setIsReconnecting(true);
    try {
      await window.api.sync.initialize();
    } catch (error) {
      console.error('[OfflineBanner] Retry failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const pendingCount = syncStatus.hasPendingChanges ? 'some' : 'no';

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WifiOff className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-yellow-800">You're offline</span>
            <span className="text-yellow-700 ml-2">
              {syncStatus.hasPendingChanges
                ? 'Changes will sync when you reconnect.'
                : 'Your work is saved locally.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRetry}
            disabled={isReconnecting}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 rounded transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isReconnecting ? 'animate-spin' : ''}`}
            />
            {isReconnecting ? 'Reconnecting...' : 'Retry'}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded transition"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
