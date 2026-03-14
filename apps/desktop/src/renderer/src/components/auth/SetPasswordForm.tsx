/**
 * Set Password Form Component
 *
 * Shown after a recovery (password reset) or invite deep link is verified.
 * The user is already authenticated via verifyOtp at this point — they just
 * need to set (or reset) their password to complete the flow.
 */

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PASSWORD_MIN_LENGTH } from '@showstack/shared';

export function SetPasswordForm() {
  const { updatePassword, closeAuthModal, isLoading, error, clearError, pendingDeepLinkType } =
    useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => closeAuthModal(), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, closeAuthModal]);

  const isInvite = pendingDeepLinkType === 'invite';

  const passwordMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const passwordHasNumber = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isValidPassword = passwordMinLength && passwordHasNumber;
  const canSubmit = isValidPassword && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const result = await updatePassword(password);
    if (result) {
      setSuccess(true);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) clearError();
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">You're all set!</h2>
        <p className="text-sm text-gray-500">
          Your password has been {isInvite ? 'created' : 'reset'}.
          <br />
          You're now signed in to ShowStack.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isInvite ? 'Create Your Password' : 'Set New Password'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isInvite
            ? 'Choose a password to complete your account setup'
            : 'Choose a new password for your account'}
        </p>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="set-password" className="block text-sm font-medium text-gray-700 mb-1">
          {isInvite ? 'Password' : 'New Password'}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="set-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            placeholder="Create a password"
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>

        {/* Password Requirements */}
        {password.length > 0 && (
          <div className="mt-2 space-y-1">
            <div
              className={`text-xs flex items-center gap-1 ${passwordMinLength ? 'text-green-600' : 'text-gray-400'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${passwordMinLength ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              At least {PASSWORD_MIN_LENGTH} characters
            </div>
            <div
              className={`text-xs flex items-center gap-1 ${passwordHasNumber ? 'text-green-600' : 'text-gray-400'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${passwordHasNumber ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              Contains a number
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label
          htmlFor="set-confirm-password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="set-confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm ${
              confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>
        {confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !canSubmit}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : isInvite ? (
          'Create Password'
        ) : (
          'Set New Password'
        )}
      </button>
    </form>
  );
}
