import React, { useState } from 'react';
import { logger } from '../../../utils/logger';
import { useUser } from '../../../hooks/useUser';
import { useAuthStore } from '../../../store/authStore';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * License section of the Account dialog
 *
 * Shows:
 * - License activation form (if no license)
 * - License status, tier, and maintenance date
 * - Available modules
 * - Enabled features
 */
export function LicenseSection() {
  const { license, loading, refreshStatus } = useUser();
  const { isAuthenticated, activateLicense } = useAuthStore();
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  // Debug logging
  React.useEffect(() => {
    logger.info('LicenseSection - license:', license);
    logger.info('LicenseSection - loading:', loading);
    if (license) {
      logger.info('License properties:', {
        tier: license.tier,
        status: license.status,
        maintenanceEndDate: license.maintenanceEndDate,
        licenseKey: license.licenseKey,
        email: license.email,
        modules: license.modules,
      });
    }
  }, [license, loading]);

  async function handleActivate() {
    if (!licenseKey) return;

    setActivating(true);
    setError('');
    try {
      const result = await activateLicense(licenseKey);
      if (result.success) {
        setLicenseKey('');
        await refreshStatus();
      } else {
        setError(result.error || 'Activation failed. Please check your license key and try again.');
      }
    } catch (err) {
      logger.error('Activation failed:', err);
      setError('Activation failed. Please check your license key and try again.');
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  // Check if license is truly valid with all required fields
  if (
    !license ||
    !license.email ||
    !license.licenseKey ||
    !license.modules ||
    license.modules.length === 0
  ) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Activate License</h3>

        {!isAuthenticated && (
          <p className="text-sm text-gray-500">
            Sign in to your account first, then enter your license key.
          </p>
        )}

        <div>
          <label className="block font-medium mb-2 text-gray-900">License Key</label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-gray-900"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            disabled={!isAuthenticated}
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          onClick={handleActivate}
          disabled={activating || !licenseKey || !isAuthenticated}
          className="px-4 py-2 bg-blue-500 text-gray-900 dark:text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {activating ? 'Activating...' : 'Activate License'}
        </button>
      </div>
    );
  }

  const StatusIcon =
    license.status === 'active'
      ? CheckCircle
      : license.status === 'expired'
        ? AlertCircle
        : XCircle;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">License Information</h3>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={`w-5 h-5 ${license.status === 'active' ? 'text-green-500' : 'text-red-500'}`}
          />
          <span className="font-medium capitalize text-gray-900">{license.status}</span>
        </div>

        <div>
          <span className="text-sm text-gray-600">Type:</span>
          <span className="ml-2 font-medium capitalize text-gray-900">{license.tier}</span>
        </div>

        <div>
          <span className="text-sm text-gray-600">Maintenance Until:</span>
          <span className="ml-2 font-medium text-gray-900">
            {new Date(license.maintenanceEndDate).toLocaleDateString()}
          </span>
        </div>

        <div>
          <span className="text-sm text-gray-600">License Key:</span>
          <span className="ml-2 font-mono text-sm text-gray-900">{license.licenseKey}</span>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2 text-gray-900">Available Modules</h4>
        <ul className="space-y-2">
          {license.modules.map((module) => (
            <li key={module.module} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="capitalize text-gray-900">{module.module}</span>
            </li>
          ))}
        </ul>
      </div>

      {license.modules && license.modules.length > 0 && license.modules[0]?.features && (
        <div>
          <h4 className="font-medium mb-2 text-gray-900">Features</h4>
          <ul className="space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-900">
                Max Revisions: {license.modules[0].features.maxRevisions ?? 'Unlimited'}
              </span>
            </li>
            <li className="flex items-center gap-2">
              {license.modules[0].features.multiDiscipline ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-gray-900">Multi-Discipline Support</span>
            </li>
            <li className="flex items-center gap-2">
              {license.modules[0].features.advancedExport ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-gray-900">Advanced Export Options</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
