import React from 'react';
import { logger } from '../../../utils/logger';
import { useUser } from '../../../hooks/useUser';
import { useAuthStore } from '../../../store/authStore';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * License section of the Account dialog
 *
 * Shows:
 * - License status, tier, and maintenance date
 * - Available modules
 * - Enabled features
 * - Prompt to sign in if no license found
 */
export function LicenseSection() {
  const { license, loading } = useUser();
  const { isAuthenticated } = useAuthStore();

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

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  // No valid license — prompt to sign in
  if (
    !license ||
    !license.email ||
    !license.licenseKey ||
    !license.modules ||
    license.modules.length === 0
  ) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">License</h3>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            {!isAuthenticated
              ? 'Sign in with the email associated with your purchase to activate your license automatically.'
              : 'No license found for your account. If you recently purchased, it may take a moment to sync.'}
          </p>
        </div>
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
