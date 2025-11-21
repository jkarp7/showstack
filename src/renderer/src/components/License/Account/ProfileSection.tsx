import React from 'react';
import { useUser } from '../../../hooks/useUser';

/**
 * Profile section of the Account dialog
 *
 * Shows user information (email, name) from the license
 */
export function ProfileSection() {
  const { license } = useUser();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Profile</h3>

      <div>
        <label className="block font-medium mb-2">Email</label>
        <input
          type="email"
          value={license?.email || ''}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
        />
      </div>

      <div>
        <label className="block font-medium mb-2">Name</label>
        <input
          type="text"
          value={license?.name || ''}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
        />
      </div>

      <p className="text-sm text-gray-600">
        To update your profile information, please contact support at{' '}
        <a href="mailto:support@showstack.app" className="text-blue-500 hover:underline">
          support@showstack.app
        </a>
      </p>
    </div>
  );
}
