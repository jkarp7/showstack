import { useState, useEffect } from 'react';
import type { UserLicense, LicenseValidation, ShowStackModule } from '../../../shared/types/license.types';

/**
 * Hook for accessing user license information and status
 *
 * Provides current license, validation status, and activation functionality.
 * Automatically loads on mount and provides methods to activate new licenses.
 *
 * @returns {object} License data and methods
 * @returns {UserLicense | null} license - Current user license
 * @returns {LicenseValidation | null} status - Current license validation status
 * @returns {boolean} loading - Loading state
 * @returns {function} activateLicense - Function to activate a new license
 *
 * @example
 * ```tsx
 * const { license, status, loading, activateLicense } = useUser();
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
      console.error('Failed to load license:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStatus() {
    try {
      const data = await window.api.license.getStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load license status:', error);
    }
  }

  async function activateLicense(
    licenseKey: string,
    email: string,
    modules: ShowStackModule[]
  ) {
    try {
      const data = await window.api.license.activate(licenseKey, email, modules);
      setLicense(data);
      await loadStatus();
      return data;
    } catch (error) {
      console.error('Failed to activate license:', error);
      throw error;
    }
  }

  async function refreshStatus() {
    await loadStatus();
  }

  return {
    license,
    status,
    loading,
    activateLicense,
    refreshStatus
  };
}
