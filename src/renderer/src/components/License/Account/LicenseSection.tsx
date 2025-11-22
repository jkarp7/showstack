import React, { useState } from 'react';
import { useUser } from '../../../hooks/useUser';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * License section of the Account dialog
 *
 * Shows:
 * - License activation form (if no license)
 * - License status, tier, and expiration
 * - Available modules
 * - Enabled features
 */
export function LicenseSection() {
  const { license, loading, activateLicense } = useUser();
  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  // Debug logging
  React.useEffect(() => {
    console.log('LicenseSection - license:', license);
    console.log('LicenseSection - loading:', loading);
  }, [license, loading]);

  async function handleActivate() {
    if (!licenseKey || !email) return;

    setActivating(true);
    setError('');
    try {
      // For now, default to 'prep' module - this would come from purchase
      await activateLicense(licenseKey, email, ['prep']);
      setLicenseKey('');
      setEmail('');
    } catch (err) {
      console.error('Activation failed:', err);
      setError('Activation failed. Please check your license key and try again.');
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  // Check if license is truly valid with all required fields
  if (!license || !license.email || !license.licenseKey || !license.modules || license.modules.length === 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Activate License</h3>

        <div>
          <label className="block font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">License Key</label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded font-mono"
            placeholder="XXXX-XXXX-XXXX-XXXX"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={activating || !licenseKey || !email}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {activating ? 'Activating...' : 'Activate License'}
        </button>
      </div>
    );
  }

  const StatusIcon = license.status === 'active' ? CheckCircle :
                     license.status === 'expired' ? AlertCircle : XCircle;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">License Information</h3>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${
            license.status === 'active' ? 'text-green-500' : 'text-red-500'
          }`} />
          <span className="font-medium capitalize">{license.status}</span>
        </div>

        <div>
          <span className="text-sm text-gray-600">Type:</span>
          <span className="ml-2 font-medium capitalize">{license.tier}</span>
        </div>

        <div>
          <span className="text-sm text-gray-600">Expires:</span>
          <span className="ml-2 font-medium">
            {new Date(license.expirationDate).toLocaleDateString()}
          </span>
        </div>

        <div>
          <span className="text-sm text-gray-600">License Key:</span>
          <span className="ml-2 font-mono text-sm">{license.licenseKey}</span>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Available Modules</h4>
        <ul className="space-y-2">
          {license.modules.map((module) => (
            <li key={module.module} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="capitalize">{module.module}</span>
            </li>
          ))}
        </ul>
      </div>

      {license.modules && license.modules.length > 0 && license.modules[0]?.features && (
        <div>
          <h4 className="font-medium mb-2">Features</h4>
          <ul className="space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Max Revisions: {license.modules[0].features.maxRevisions ?? 'Unlimited'}</span>
            </li>
            <li className="flex items-center gap-2">
              {license.modules[0].features.multiDiscipline ?
                <CheckCircle className="w-4 h-4 text-green-500" /> :
                <XCircle className="w-4 h-4 text-gray-400" />
              }
              <span>Multi-Discipline Support</span>
            </li>
            <li className="flex items-center gap-2">
              {license.modules[0].features.advancedExport ?
                <CheckCircle className="w-4 h-4 text-green-500" /> :
                <XCircle className="w-4 h-4 text-gray-400" />
              }
              <span>Advanced Export Options</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
