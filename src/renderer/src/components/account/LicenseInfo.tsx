import { FileText, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { useUser } from '../../hooks/useUser';

export function LicenseInfo() {
  const { status } = useUser();

  const hasLicense = status?.isValid || false;
  const licenseType = status?.tier || 'None';
  const expirationDate = status?.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'N/A';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">License Information</h2>
        <p className="text-gray-600 dark:text-gray-400">View your license status and subscription details</p>
      </div>

      {/* Subscription Management - Now at top */}
      {hasLicense ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Subscription Management</h4>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                Your license expires on {expirationDate}. Manage your subscription in the billing portal.
              </p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white rounded-md text-sm font-medium transition-colors">
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">No Active License</h4>
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                You don't have an active license. Purchase a license to unlock all features and receive updates.
              </p>
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-gray-900 dark:text-white rounded-md text-sm font-medium transition-colors">
                Purchase License
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Status */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        {hasLicense ? (
          <>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{licenseType} License</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active license</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">License Type</div>
                <div className="font-semibold text-gray-900 dark:text-white">{licenseType}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expiration Date</div>
                <div className="font-semibold text-gray-900 dark:text-white">{expirationDate}</div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Features Included</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {['Unlimited Projects', 'Advanced Layout Designer', 'Cloud Sync & Backup', 'Priority Support', 'Team Collaboration', 'Custom Templates'].map(feature => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No License Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Purchase a license to access premium features and receive updates.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              License Type: {licenseType}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
