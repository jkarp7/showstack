import React from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import type { LicenseValidation } from '../../../../shared/types/license.types';

interface LicenseBannerProps {
  status: LicenseValidation;
}

/**
 * Banner component that displays license warnings and status messages
 *
 * Shows:
 * - Expiration warnings (7 days before expiry)
 * - Offline grace period warnings
 * - Expired license messages with renewal CTA
 *
 * Auto-hides when license is fully active with no warnings
 *
 * @example
 * ```tsx
 * const { status } = useUser();
 * return status && <LicenseBanner status={status} />;
 * ```
 */
export function LicenseBanner({ status }: LicenseBannerProps) {
  // Hide banner if license is fully active with no warnings
  if (status.status === 'active' && !status.warningLevel) {
    return null;
  }

  const bannerStyles = {
    low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    medium: 'bg-orange-50 border-orange-200 text-orange-800',
    high: 'bg-red-50 border-red-200 text-red-800'
  };

  const style = bannerStyles[status.warningLevel || 'medium'];

  return (
    <div className={`border-b-2 px-4 py-2 flex items-center gap-3 ${style}`}>
      {status.status === 'grace' ? (
        <WifiOff className="w-5 h-5 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      )}

      <span className="flex-1">{status.message}</span>

      {status.status === 'expired' && (
        <button
          onClick={() => {
            // Open renewal link - TODO: Replace with actual renewal URL
            window.open('https://showstack.app/renew', '_blank');
          }}
          className="px-4 py-1 bg-blue-600 text-gray-900 dark:text-white rounded hover:bg-blue-700 transition-colors"
        >
          Renew Now
        </button>
      )}
    </div>
  );
}
