import React from 'react';
import { useUser } from '../../../hooks/useUser';

/**
 * Subscription section of the Account dialog
 *
 * Shows subscription/billing information and renewal date
 */
export function SubscriptionSection() {
  const { license } = useUser();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Subscription</h3>

      <p className="text-gray-600">
        Subscription management coming soon. For now, contact support for billing questions.
      </p>

      {license && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm mb-2">
            <strong>Plan:</strong>{' '}
            <span className="capitalize">{license.tier}</span>
          </p>
          <p className="text-sm">
            <strong>Renews:</strong>{' '}
            <span>{new Date(license.expirationDate).toLocaleDateString()}</span>
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <h4 className="font-medium mb-2">Need help with billing?</h4>
        <p className="text-sm text-gray-600 mb-3">
          Contact our support team for assistance with subscriptions, renewals, or billing questions.
        </p>
        <a
          href="mailto:billing@showstack.app"
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
