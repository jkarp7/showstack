/**
 * Auth Modal Component
 *
 * Modal wrapper for authentication forms.
 * Displays login, signup, or password reset forms.
 */

import { useEffect } from 'react';
import { X, Cloud } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { PasswordResetForm } from './PasswordResetForm';

export function AuthModal() {
  const { showAuthModal, authModalView, closeAuthModal, setAuthModalView, isLoading } =
    useAuthStore();

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAuthModal && !isLoading) {
        closeAuthModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAuthModal, isLoading, closeAuthModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAuthModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showAuthModal]);

  if (!showAuthModal) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      closeAuthModal();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header with Logo */}
        <div className="pt-6 pb-2 px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
            <Cloud className="h-8 w-8" />
            <span className="text-xl font-bold">ShowStack Cloud</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 pb-6">
          {authModalView === 'login' && (
            <LoginForm
              onSwitchToSignUp={() => setAuthModalView('signup')}
              onSwitchToReset={() => setAuthModalView('reset')}
            />
          )}

          {authModalView === 'signup' && (
            <SignUpForm onSwitchToLogin={() => setAuthModalView('login')} />
          )}

          {authModalView === 'reset' && (
            <PasswordResetForm onSwitchToLogin={() => setAuthModalView('login')} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center text-xs text-gray-500 border-t">
          Your data is encrypted and stored securely.
          <br />
          By signing in, you agree to our{' '}
          <button
            onClick={() => window.api.shell.openExternal('https://showstack.app/terms')}
            className="text-blue-600 hover:underline"
          >
            Terms of Service
          </button>
          .
        </div>
      </div>
    </div>
  );
}
