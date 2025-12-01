import { FileText, CheckCircle, Calendar } from 'lucide-react';

export function LicenseInfo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">License Information</h2>
        <p className="text-gray-600">View your license status and subscription details</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Professional License</h3>
              <p className="text-sm text-gray-500">Active subscription</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">License Type</div>
            <div className="font-semibold text-gray-900">Professional</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Renewal Date</div>
            <div className="font-semibold text-gray-900">Dec 31, 2025</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Seats</div>
            <div className="font-semibold text-gray-900">1 / 5 used</div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Features Included</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {['Unlimited Projects', 'Advanced Layout Designer', 'Cloud Sync & Backup', 'Priority Support', 'Team Collaboration', 'Custom Templates'].map(feature => (
              <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Subscription Management</h4>
            <p className="text-sm text-blue-800 mb-3">
              Your subscription will automatically renew on December 31, 2025. Manage your subscription in the billing portal.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
