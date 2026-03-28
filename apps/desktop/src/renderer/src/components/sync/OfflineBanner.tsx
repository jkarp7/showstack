/**
 * Offline Banner Component
 *
 * Displays a dismissible warning banner when the app is offline.
 * Shows pending changes count and reconnection status.
 */

import { useState, useEffect, useRef } from 'react';
import { logger } from '../../utils/logger';
import { WifiOff, X, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function OfflineBanner(): JSX.Element | null {
  const { isAuthenticated, syncStatus, isCloudConfigured } = useAuthStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const prevStateRef = useRef(syncStatus.state);

  // Reset dismissal state when a NEW disconnection occurs
  // (i.e., when transitioning from connected/syncing to disconnected/error)
  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentState = syncStatus.state;
    const wasOnline = prevState === 'connected' || prevState === 'syncing';
    const isOffline = currentState === 'disconnected' || currentState === 'error';

    // If we just went offline from an online state, reset the dismissed state
    if (wasOnline && isOffline) {
      setIsDismissed(false);
      setRetryError(null);
    }

    // Also reset reconnecting state when connected
    if (currentState === 'connected') {
      setIsReconnecting(false);
      setRetryError(null);
    }

    prevStateRef.current = currentState;
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

  const handleRetry = async (): Promise<void> => {
    setIsReconnecting(true);
    setRetryError(null);
    try {
      if (!window.api?.sync?.connect) {
        throw new Error('Sync API not available');
      }
      await window.api.sync.connect();
    } catch (error) {
      logger.error('[OfflineBanner] Retry failed:', error);
      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          setRetryError('Network unavailable. Check your internet connection.');
        } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
          setRetryError('Authentication failed. Please sign in again.');
        } else {
          setRetryError(`Connection failed: ${error.message}`);
        }
      } else {
        setRetryError('Connection failed. Please try again.');
      }
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WifiOff className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-yellow-800">You're offline</span>
            <span className="text-yellow-700 ml-2">
              {retryError ? (
                <span className="text-red-600">{retryError}</span>
              ) : syncStatus.hasPendingChanges ? (
                'Changes will sync when you reconnect.'
              ) : (
                'Your work is saved locally.'
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRetry}
            disabled={isReconnecting}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 rounded transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
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
