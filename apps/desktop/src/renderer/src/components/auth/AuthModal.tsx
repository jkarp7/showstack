/**
 * Auth Modal Component
 *
 * Modal wrapper for authentication forms.
 * Displays login, signup, or password reset forms.
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { PasswordResetForm } from './PasswordResetForm';
import { SetPasswordForm } from './SetPasswordForm';

export function AuthModal() {
  const {
    showAuthModal,
    authModalView,
    closeAuthModal,
    setAuthModalView,
    isLoading,
    isFirstLaunchPrompt,
    isReturningUserPrompt,
    activateDemoMode,
  } = useAuthStore();

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

  const handleDemoMode = async () => {
    await activateDemoMode();
    localStorage.setItem('showstack-auth-prompted', 'true');
  };

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
        {/* Close Button — hidden during set-password (user must complete this step) */}
        {authModalView !== 'set-password' && (
          <button
            onClick={closeAuthModal}
            disabled={isLoading}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header with Logo */}
        <div className="pt-6 pb-2 px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
            <span className="text-xl font-bold">ShowStack</span>
          </div>
          {isReturningUserPrompt && authModalView === 'login' && (
            <p className="text-sm text-gray-500 mt-1">
              Your session has expired. Sign in to re-enable cloud sync.
            </p>
          )}
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

          {authModalView === 'set-password' && <SetPasswordForm />}
        </div>

        {/* Demo Mode Button (first-launch only, not shown during set-password) */}
        {isFirstLaunchPrompt && authModalView !== 'set-password' && (
          <div className="px-6 pb-4">
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-xs text-gray-400 absolute">or</span>
            </div>
            <button
              onClick={handleDemoMode}
              disabled={isLoading}
              className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              Continue in Demo Mode
            </button>
            <p className="text-xs text-gray-400 text-center mt-1">
              25 fixtures, no cloud sync, no exports
            </p>
          </div>
        )}

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
