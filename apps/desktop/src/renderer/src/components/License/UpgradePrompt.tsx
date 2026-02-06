import React from 'react';
import { Lock } from 'lucide-react';
import type { ShowStackModule } from '../../../../shared/types/license.types';

interface UpgradePromptProps {
  module?: ShowStackModule;
  feature?: string;
}

/**
 * Upgrade prompt component for locked features or modules
 *
 * Displays a centered card prompting users to upgrade their plan to unlock
 * specific features or modules. Can be customized for either module-level
 * or feature-level upgrades.
 *
 * @example
 * ```tsx
 * // For a locked module:
 * <UpgradePrompt module="production" />
 *
 * // For a locked feature:
 * <UpgradePrompt feature="Bulk Operations" />
 * ```
 */
export function UpgradePrompt({ module, feature }: UpgradePromptProps) {
  const upgradeText = module
    ? `Upgrade to unlock ShowStack:${module.charAt(0).toUpperCase() + module.slice(1)}`
    : `Upgrade to unlock ${feature}`;

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold mb-2">{upgradeText}</h3>
      <p className="text-gray-600 mb-4">This feature is available in the Professional plan</p>
      <button
        onClick={() => {
          // Open upgrade link - TODO: Replace with actual pricing URL
          window.open('https://showstack.app/pricing', '_blank');
        }}
        className="px-6 py-2 bg-blue-500 text-gray-900 dark:text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        View Upgrade Options
      </button>
    </div>
  );
}
