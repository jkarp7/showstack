import { FileText, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { useUser } from '../../hooks/useUser';

export function LicenseInfo() {
  const { license, status } = useUser();

  const hasLicense = !!license;
  const licenseType = license?.tier || 'None';
  const maintenanceDate = license?.maintenanceEndDate
    ? new Date(license.maintenanceEndDate).toLocaleDateString()
    : 'N/A';
  const isMaintenanceExpired = status?.status === 'maintenance_expired';
  const isActive = status?.status === 'active';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          License Information
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          View your license status and maintenance details
        </p>
      </div>

      {/* Maintenance Status */}
      {hasLicense && isActive && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                Active Maintenance
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Active until {maintenanceDate}. You have access to updates and cloud sync.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasLicense && isMaintenanceExpired && (
        <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                Maintenance Expired
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Your maintenance expired on {maintenanceDate}. The app continues to work, but cloud
                sync is disabled. Renew to get updates and sync.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* License Details */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        {hasLicense ? (
          <>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                    {licenseType} License
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isMaintenanceExpired ? 'Maintenance expired' : 'Active license'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : isMaintenanceExpired
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {isActive
                  ? 'Active'
                  : isMaintenanceExpired
                    ? 'Maintenance Expired'
                    : status?.status || 'Unknown'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">License Type</div>
                <div className="font-semibold text-gray-900 dark:text-white capitalize">
                  {licenseType}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Maintenance Until
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">{maintenanceDate}</div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Features Included
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { name: 'Unlimited Projects', available: true },
                  { name: 'Advanced Layout Designer', available: true },
                  { name: 'Cloud Sync & Backup', available: status?.canSync ?? false },
                  { name: 'Priority Support', available: licenseType !== 'student' },
                  { name: 'Custom Templates', available: true },
                  { name: 'Software Updates', available: !isMaintenanceExpired },
                ].map((feature) => (
                  <div
                    key={feature.name}
                    className={`flex items-center gap-2 text-sm ${
                      feature.available
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500 line-through'
                    }`}
                  >
                    <CheckCircle
                      className={`w-4 h-4 ${feature.available ? 'text-green-600' : 'text-gray-300'}`}
                    />
                    <span>{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No License Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sign in with the email associated with your purchase to activate your license
              automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
