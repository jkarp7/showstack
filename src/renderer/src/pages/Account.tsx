import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, UserCircle, Shield, Bell, Palette, FileText, CreditCard } from 'lucide-react';
import { UserProfile } from '../components/account/UserProfile';
import { DataPrivacy } from '../components/account/DataPrivacy';
import { AdvancedSettings } from '../components/account/AdvancedSettings';
import { LicenseInfo } from '../components/account/LicenseInfo';
import { ThemeAppearance } from '../components/account/ThemeAppearance';
import { Notifications } from '../components/account/Notifications';

type Tab = 'profile' | 'privacy' | 'advanced' | 'license' | 'theme' | 'notifications';

export function Account() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Account</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              <span>User Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'theme'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Palette className="w-5 h-5" />
              <span>Theme & Appearance</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Data & Privacy</span>
            </button>
            <button
              onClick={() => setActiveTab('license')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'license'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>License Info</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Advanced</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'profile' && <UserProfile />}
          {activeTab === 'theme' && <ThemeAppearance />}
          {activeTab === 'notifications' && <Notifications />}
          {activeTab === 'privacy' && <DataPrivacy />}
          {activeTab === 'license' && <LicenseInfo />}
          {activeTab === 'advanced' && <AdvancedSettings />}
        </div>
      </div>
    </div>
  );
}
