import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DISMISSED_VERSION_KEY = 'gdtf_dismissed_version';

export function GdtfLibraryUpdateBanner(): JSX.Element | null {
  const [updateInfo, setUpdateInfo] = useState<{
    versionHash: string;
    fixtureCount: number;
  } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

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

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="font-medium text-blue-800">Fixture library update available</span>
            <span className="text-blue-700 ml-2">
              {updateInfo.fixtureCount.toLocaleString()} fixtures.
            </span>
          </div>
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
