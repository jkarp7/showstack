import React, { useState } from 'react';
import { X, User, Key, CreditCard } from 'lucide-react';
import { ProfileSection } from './ProfileSection';
import { LicenseSection } from './LicenseSection';
import { SubscriptionSection } from './SubscriptionSection';

type AccountTab = 'profile' | 'license' | 'subscription';

interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Account management dialog with tabbed interface
 *
 * Tabs:
 * - Profile: User information
 * - License: License key, status, module access
 * - Subscription: Billing and renewal information
 *
 * @example
 * ```tsx
 * const [accountOpen, setAccountOpen] = useState(false);
 *
 * return (
 *   <>
 *     <button onClick={() => setAccountOpen(true)}>Account</button>
 *     <AccountDialog isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
 *   </>
 * );
 * ```
 */
export function AccountDialog({ isOpen, onClose }: AccountDialogProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>('license');

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'license', label: 'License', icon: Key },
    { id: 'subscription', label: 'Subscription', icon: CreditCard }
  ] as const;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[500px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Account</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-gray-900 font-semibold"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 inline" />
            <span className="ml-1">Close</span>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-gray-50 border-r border-gray-200 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded mb-1 flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'license' && <LicenseSection />}
            {activeTab === 'subscription' && <SubscriptionSection />}
          </div>
        </div>
      </div>
    </div>
  );
}
