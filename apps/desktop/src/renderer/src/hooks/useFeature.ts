import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import type { ShowStackModule } from '../../../shared/types/license.types';

/**
 * Hook for checking if a specific feature is enabled for the user's license
 *
 * @param module - The ShowStack module the feature belongs to
 * @param feature - The feature name to check (e.g., 'bulkOperations', 'logoIntegration')
 * @returns Object with enabled boolean and loading state
 *
 * @example
 * ```tsx
 * const { enabled, loading } = useFeature('prep', 'bulkOperations');
 *
 * return (
 *   <div>
 *     {enabled ? (
 *       <BulkOperationsToolbar />
 *     ) : (
 *       <p>Bulk operations available in Professional plan</p>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useFeature(module: ShowStackModule, feature: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFeature();
  }, [module, feature]);

  async function checkFeature() {
    try {
      const canUse = await window.api.license.canUseFeature(module, feature);
      setEnabled(canUse);
    } catch (error) {
      logger.error('Failed to check feature:', error);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }

  return { enabled, loading };
}
