/**
 * Sync Status Indicator Component
 *
 * Displays current sync status in the app header.
 * Shows connection state, pending changes, and auth status.
 */

import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  User,
  LogOut,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

export function SyncStatusIndicator() {
  const {
    isAuthenticated,
    email,
    syncStatus,
    isCloudConfigured,
    openAuthModal,
    signOut,
    isLoading,
  } = useAuthStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show if cloud is not configured
  if (!isCloudConfigured) {
    return null;
  }

  // Get status icon and color
  const getStatusDisplay = () => {
    if (!isAuthenticated) {
      return {
        icon: CloudOff,
        color: 'text-gray-400',
        bgColor: 'bg-gray-100',
        label: 'Sign in to sync',
      };
    }

    switch (syncStatus.state) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          label: 'Synced',
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          label: 'Syncing...',
          animate: true,
        };
      case 'connecting':
        return {
          icon: Cloud,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          label: 'Connecting...',
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          label: syncStatus.error || 'Sync error',
        };
      default:
        return {
          icon: CloudOff,
          color: 'text-gray-400',
          bgColor: 'bg-gray-100',
          label: 'Offline',
        };
    }
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Status Button */}
      <button
        onClick={() => {
          if (!isAuthenticated) {
            openAuthModal('login');
          } else {
            setShowDropdown(!showDropdown);
          }
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${status.bgColor} hover:opacity-80`}
        title={status.label}
      >
        <StatusIcon
          className={`h-4 w-4 ${status.color} ${status.animate ? 'animate-spin' : ''}`}
        />
        {isAuthenticated ? (
          <span className="text-sm text-gray-600 max-w-[120px] truncate hidden sm:inline">
            {email}
          </span>
        ) : (
          <span className="text-sm text-gray-500">Sign In</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && isAuthenticated && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
                <p className="text-xs text-gray-500">ShowStack Cloud</p>
              </div>
            </div>
          </div>

          {/* Sync Status */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sync Status</span>
              <div className="flex items-center gap-1.5">
                <StatusIcon
                  className={`h-4 w-4 ${status.color} ${status.animate ? 'animate-spin' : ''}`}
                />
                <span className={`text-sm ${status.color}`}>{status.label}</span>
              </div>
            </div>

            {syncStatus.lastSyncedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Last synced: {formatLastSynced(syncStatus.lastSyncedAt)}
              </p>
            )}

            {syncStatus.hasPendingChanges && (
              <p className="text-xs text-yellow-600 mt-1">
                Pending changes will sync when online
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format the last synced timestamp
 */
function formatLastSynced(date: Date | string | null): string {
  if (!date) return 'Never';

  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';

  return d.toLocaleDateString();
}
