import { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isFirstTime?: boolean;
}

export function PasswordPrompt({ isOpen, onClose, onSuccess, isFirstTime = false }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isFirstTime) {
      // Setting password for the first time
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setIsLoading(true);
      try {
        const result = await window.api.admin.setPassword(password);
        if (result.success) {
          // Don't call handleClose() here - let parent handle it after state updates
          onSuccess();
        } else {
          setError('Failed to set password');
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
        console.error('Error setting password:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Verifying existing password
      setIsLoading(true);
      try {
        const result = await window.api.admin.verifyPassword(password);
        if (result.success) {
          // Don't call handleClose() here - let parent handle it after state updates
          onSuccess();
        } else {
          setError('Incorrect password');
          setPassword('');
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
        console.error('Error verifying password:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold">
              {isFirstTime ? 'Set Admin Password' : 'Admin Access'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isFirstTime && (
            <p className="text-sm text-gray-600 mb-4">
              Set a password to secure access to the admin panel. You can change this later.
            </p>
          )}

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {isFirstTime ? 'New Password' : 'Password'}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isFirstTime ? 'Enter new password' : 'Enter admin password'}
                autoFocus
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isFirstTime && password && password.length < 6 && (
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            )}
          </div>

          {/* Confirm Password (only for first time) */}
          {isFirstTime && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Re-enter password"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-gray-900 dark:text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !password || (isFirstTime && !confirmPassword)}
            >
              {isLoading ? 'Please wait...' : isFirstTime ? 'Set Password' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
