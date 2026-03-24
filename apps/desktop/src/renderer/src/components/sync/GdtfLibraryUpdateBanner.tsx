import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DISMISSED_VERSION_KEY = 'gdtf_dismissed_version';

export function GdtfLibraryUpdateBanner(): JSX.Element | null {
  const [updateInfo, setUpdateInfo] = useState<{
    versionHash: string;
    fixtureCount: number;
  } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.api?.gdtf?.onUpdateAvailable) return;

    const unsubscribe = window.api.gdtf.onUpdateAvailable((info) => {
      // Check if this version was already dismissed
      try {
        const dismissedHash = localStorage.getItem(DISMISSED_VERSION_KEY);
        if (dismissedHash === info.versionHash) {
          return;
        }
      } catch {
        // localStorage unavailable — show the banner
      }
      setUpdateInfo(info);
      setIsDismissed(false);
      setApplyError(null);
    });

    return unsubscribe;
  }, []);

  if (!updateInfo || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_VERSION_KEY, updateInfo.versionHash);
    } catch {
      // localStorage unavailable — non-fatal
    }
    setIsDismissed(true);
  };

  const handleApply = async () => {
    if (!window.api?.gdtf?.applyUpdate) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      const result = await window.api.gdtf.applyUpdate();
      if (result.success) {
        try {
          localStorage.setItem(DISMISSED_VERSION_KEY, updateInfo.versionHash);
        } catch {
          // non-fatal
        }
        setIsDismissed(true);
      } else {
        setApplyError(result.error ?? 'Update failed');
      }
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="font-medium text-blue-800">Fixture library update available</span>
            <span className="text-blue-700 ml-2">
              {updateInfo.fixtureCount.toLocaleString()} fixtures.
            </span>
            {applyError && <span className="text-red-600 ml-2">{applyError}</span>}
          </div>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isApplying ? 'Updating…' : 'Update Now'}
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
