import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import type { UserLicense, LicenseValidation } from '../../../shared/types/license.types';

/**
 * Hook for accessing user license information and status
 *
 * Provides current license, validation status, and refresh functionality.
 * Automatically loads on mount.
 *
 * @returns {object} License data and methods
 * @returns {UserLicense | null} license - Current user license
 * @returns {LicenseValidation | null} status - Current license validation status
 * @returns {boolean} loading - Loading state
 * @returns {function} refreshStatus - Function to refresh license status
 *
 * @example
 * ```tsx
 * const { license, status, loading, refreshStatus } = useUser();
 *
 * if (loading) return <div>Loading...</div>;
 *
 * return (
 *   <div>
 *     <p>Email: {license?.email}</p>
 *     <p>Status: {status?.message}</p>
 *   </div>
 * );
 * ```
 */
export function useUser() {
  const [license, setLicense] = useState<UserLicense | null>(null);
  const [status, setStatus] = useState<LicenseValidation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicense();
    loadStatus();
  }, []);

  async function loadLicense() {
    try {
      const data = await window.api.license.getCurrent();
      setLicense(data);
    } catch (error) {
      logger.error('Failed to load license:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStatus() {
    try {
      const data = await window.api.license.getStatus();
      setStatus(data);
    } catch (error) {
      logger.error('Failed to load license status:', error);
    }
  }

  async function refreshStatus() {
    await loadLicense();
    await loadStatus();
  }

  return {
    license,
    status,
    loading,
    refreshStatus,
  };
}
