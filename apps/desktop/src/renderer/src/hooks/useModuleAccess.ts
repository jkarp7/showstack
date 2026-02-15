import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import type { ShowStackModule, ModuleFeatures } from '../../../shared/types/license.types';

/**
 * Hook for checking if user has access to a specific ShowStack module
 *
 * @param module - The module to check access for ('lighting', 'sound', 'video', etc.)
 * @returns Object with hasAccess boolean, module features, and loading state
 *
 * @example
 * ```tsx
 * const { hasAccess, features, loading } = useModuleAccess('lighting');
 *
 * if (loading) return <div>Loading...</div>;
 * if (!hasAccess) return <UpgradePrompt module="lighting" />;
 *
 * return <ProductionApp features={features} />;
 * ```
 */
export function useModuleAccess(module: ShowStackModule) {
  const [hasAccess, setHasAccess] = useState(false);
  const [features, setFeatures] = useState<ModuleFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [module]);

  async function checkAccess() {
    try {
      const access = await window.api.license.hasModule(module);
      const moduleFeatures = await window.api.license.getModuleFeatures(module);

      setHasAccess(access);
      setFeatures(moduleFeatures);
    } catch (error) {
      logger.error('Failed to check module access:', error);
      setHasAccess(false);
      setFeatures(null);
    } finally {
      setLoading(false);
    }
  }

  return { hasAccess, features, loading };
}
