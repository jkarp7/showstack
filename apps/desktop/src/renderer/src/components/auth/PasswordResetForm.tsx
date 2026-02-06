/**
 * Password Reset Form Component
 *
 * Handles password reset requests.
 */

import { useState } from 'react';
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface PasswordResetFormProps {
  onSwitchToLogin: () => void;
}

export function PasswordResetForm({ onSwitchToLogin }: PasswordResetFormProps) {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    const result = await resetPassword(email);
    if (result) {
      setSuccess(true);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) clearError();
  };

  // Success state
  if (success) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
        <p className="text-sm text-gray-500 mb-4">
          We've sent password reset instructions to <strong>{email}</strong>.
          <br />
          Check your inbox and follow the link to reset your password.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Return to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Reset Password</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="reset-email"
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

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !email}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Reset Link'
        )}
      </button>

      {/* Back to Login Link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to sign in
        </button>
      </div>
    </form>
  );
}
