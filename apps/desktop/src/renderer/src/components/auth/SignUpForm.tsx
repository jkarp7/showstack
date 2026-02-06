/**
 * Sign Up Form Component
 *
 * Handles new user registration.
 */

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password validation
  const passwordMinLength = password.length >= 8;
  const passwordHasNumber = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const isValidPassword = passwordMinLength && passwordHasNumber;
  const canSubmit = email && isValidPassword && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      return;
    }

    const result = await signUp(email, password);
    if (result) {
      setSuccess(true);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) clearError();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) clearError();
  };

  // Success state - email confirmation may be required
  if (success) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
        <p className="text-sm text-gray-500 mb-4">
          We've sent a confirmation link to <strong>{email}</strong>.
          <br />
          Click the link to activate your account.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-500 font-medium text-sm"
        >
          Return to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Create Account</h2>
        <p className="text-sm text-gray-500 mt-1">
          Sign up to sync your projects to the cloud
        </p>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="you@example.com"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            placeholder="Create a password"
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
            autoComplete="new-password"
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
            <div className={`text-xs flex items-center gap-1 ${passwordMinLength ? 'text-green-600' : 'text-gray-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${passwordMinLength ? 'bg-green-500' : 'bg-gray-300'}`} />
              At least 8 characters
            </div>
            <div className={`text-xs flex items-center gap-1 ${passwordHasNumber ? 'text-green-600' : 'text-gray-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${passwordHasNumber ? 'bg-green-500' : 'bg-gray-300'}`} />
              Contains a number
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm ${
              confirmPassword && !passwordsMatch
                ? 'border-red-300'
                : 'border-gray-300'
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
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      {/* Sign In Link */}
      <div className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-500 font-medium"
          disabled={isLoading}
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
