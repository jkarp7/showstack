import { useState } from 'react';
import {
  UserCircle,
  Mail,
  Building,
  Phone,
  Save,
  Camera,
  Check,
  LogOut,
  Shield,
} from 'lucide-react';
import { logger } from '../../utils/logger';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

export function UserProfile() {
  const userProfile = useSettingsStore((state) => state.userProfile);
  const updateUserProfile = useSettingsStore((state) => state.updateUserProfile);
  const [saved, setSaved] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authEmail = useAuthStore((state) => state.email);
  const licenseStatus = useAuthStore((state) => state.licenseStatus);
  const signOut = useAuthStore((state) => state.signOut);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  // Check if current license is demo tier
  const isDemoMode = licenseStatus?.message?.includes('Demo mode');

  // Local state for form inputs
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [company, setCompany] = useState(userProfile.company);
  const [role, setRole] = useState(userProfile.role);
  const [phone, setPhone] = useState(userProfile.phone);
  const [designerCredit, setDesignerCredit] = useState(userProfile.designerCredit);

  const handleSave = async () => {
    updateUserProfile({
      name,
      email,
      company,
      role,
      phone,
      designerCredit,
    });

    // Show success message
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUploadAvatar = async () => {
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Use FileReader to convert to data URL
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              updateUserProfile({ avatarPath: dataUrl });
            }
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    } catch (error) {
      logger.error('Failed to upload avatar:', error);
    }
  };

  // Phone number formatting
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters except + for international
    const cleaned = value.replace(/[^\d+]/g, '');

    // International format (starts with +)
    if (cleaned.startsWith('+')) {
      // Keep the + and format based on length
      const digits = cleaned.slice(1);
      if (digits.length <= 3) return cleaned;
      if (digits.length <= 6) return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length <= 10)
        return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10, 14)}`;
    }

    // US format (10 digits)
    if (cleaned.length <= 10) {
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }

    // UK format (11 digits starting with 0)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }

    // Default: just return cleaned with spacing
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Profile</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your personal information and designer credits
        </p>
      </div>

      {/* Auth Status */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Account Status</span>
        </h3>

        {isAuthenticated ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Signed in as</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{authEmail}</p>
              {licenseStatus && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {licenseStatus.message}
                </p>
              )}
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : isDemoMode ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-block px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30 rounded-full">
                Demo Mode
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                25 fixtures, no cloud sync, no PDF/Excel export
              </p>
            </div>
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Sign in for full access
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sign in to unlock cloud sync and full features
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Profile Picture
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
              {userProfile.avatarPath ? (
                <img
                  src={userProfile.avatarPath}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-20 h-20 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <button
              onClick={handleUploadAvatar}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              title="Upload photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Upload a profile picture or company logo
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Recommended: Square image, at least 200x200px, PNG or JPG
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Personal Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company Name"
                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role/Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Lighting Designer"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+1 (555) 123-4567 or (555) 123-4567"
                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Designer Credit */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Designer Credit
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This information will appear on shop orders and exported documents
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Designer Credit
          </label>
          <textarea
            value={designerCredit}
            onChange={(e) => setDesignerCredit(e.target.value)}
            placeholder="Lighting Design by John Doe&#10;Company Name&#10;john@example.com"
            rows={4}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This will be used as the default credit line for new projects
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {saved && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Saved!</span>
          </div>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Save Profile</span>
        </button>
      </div>
    </div>
  );
}
